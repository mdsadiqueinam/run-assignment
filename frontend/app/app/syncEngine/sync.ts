/**
 * Sync Engine
 * -----------
 * This module provides real-time synchronization between the client-side IndexedDB
 * and the server, managing both offline and online operations.
 *
 * Key Components:
 * 1. Data Modes:
 *    - INIT: Initial state
 *    - BOOTSTRAP_FULL: Complete data reload
 *    - BOOTSTRAP_DELTA: Partial update based on syncId
 *    - REAL_TIME: Active sync with server
 *    - OFFLINE: Local-only operations
 *
 * 2. Transaction Queue:
 *    - Tracks local changes (create/update/delete)
 *    - Processes changes sequentially
 *    - Handles rollbacks on failure
 *
 * 3. Socket Events:
 *    - Receives real-time updates from server
 *    - Manages reconnection and state changes
 *    - Processes events in order
 *
 * 4. Recent Mutations System:
 *    - Tracks the last ${MAX_RECENT_MUTATIONS} local mutations
 *    - Prevents "echo" updates where server sends back our own changes
 *    - Uses timestamp comparison (${RECENT_MUTATION_TIMEOUT}ms window)
 *    - Only tracks update operations (not creates/deletes)
 *
 * 5. Multi-Tab Support:
 *    - Uses localStorage for tab coordination
 *    - Prevents duplicate processing of queues
 *    - Handles tab lock timeouts
 */

import { ref, computed, watch } from "vue";
import { useObservable } from "@vueuse/rxjs";
import { useLocalStorage } from "@vueuse/core";
import relationships from "dexie-relationships";
import Dexie from "dexie";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { Graffle } from "graffle";
import {
  currentSession,
  authToken,
  hydrateSession,
  havePermissionsChanged,
} from "@root/utils/useCurrentSession";
import {
  MODES,
  TAB_LOCK_KEY,
  TAB_LOCK_TIMEOUT,
  TAB_LOCK_INIT_TIMEOUT,
  MAX_RECENT_MUTATIONS,
  RECENT_MUTATION_TIMEOUT,
} from "./modules/constants";
import {
  capitalizeFirstLetter,
  convertDates,
  snakeToCamel,
  getNameForSingleObjectFromTableName,
  dbFormat,
  acquireTabLock,
  releaseTabLock,
  generateDbName,
  waitForTabLock,
} from "./modules/utils";

const TAB_ID = `tab-${uuidv4()}`; // Unique identifier for this tab

// Reactive state - reactive for external reporting
const dataMode = ref("init"); // 'init', 'bootstrap-full', 'bootstrap-delta', 'real-time-init', 'real-time', 'offline'
const socketIsConnected = ref(false);
const socketEventQueue = ref([]);
const isProcessingTransactionQueue = ref(false);
const isProcessingSocketEventQueue = ref(false);
const config = ref(null);

// Internal State
let errorHandling = null;
let isSocketSetup = false;
let socketAddr = "";
let graphQLEndpoint = "/graphql";
let graphQLHeaders = {};
let companyId = null;
let graffle;
let appCode = null; // Store the base database name for cleanup

// We store recent mutations in localStorage so that any updates that come back in that originated from tabs
// are not processed again - which can cause a bad user experience especially when the user is typing
const recentMutations = useLocalStorage("recentMutations", []);

// Persistent State - used for testing
const errorTestRandomAPIFailsPercent = useLocalStorage(
  "errorTestRandomAPIFailsPercent",
  0
); // 0 = never fail, 50 = half the time, 100 = all the time
const autoProcessTransactionQueue = useLocalStorage(
  "autoProcessTransactionQueue",
  true
);
const autoProcessSocketEventQueue = useLocalStorage(
  "autoProcessSocketEventQueue",
  true
);
const allowWebSocketUpdates = useLocalStorage("allowWebSocketUpdates", true);

// Retry Configuration
const API_MAX_RETRY_ATTEMPTS = 3;
const API_RETRY_DELAY_MS = 1000;

// Generate indexes for Dexie.js setup
function getIndexesForDexie() {
  return Object.entries(config.value).reduce((indexes, [key, tableInfo]) => {
    indexes[key] =
      tableInfo?.customIndex ||
      Object.entries(tableInfo.fields)
        .filter(([, field]) => field.index)
        .map(([fieldName, fieldInfo]) =>
          fieldInfo.reference
            ? `${fieldName} -> ${fieldInfo.reference}`
            : fieldName
        )
        .join(",");
    return indexes;
  }, {});
}

const syncId = computed({
  async get() {
    const syncId = await sync.db.meta.get("syncId");
    return syncId?.value || null;
  },
  set(newSyncId) {
    sync.db.meta.put({ name: "syncId", value: newSyncId });
  },
});

const isLoaded = computed(() => {
  return ![MODES.INIT, MODES.BOOTSTRAP_FULL].includes(dataMode.value);
});

// Helper function to log recent mutations
function logRecentMutation(transaction) {
  recentMutations.value.push({
    action: transaction.action,
    table: transaction.table,
    objectId: transaction.objectId,
    data: transaction.data,
    timestamp: new Date().getTime(),
  });

  // Remove old mutations
  const cutoffTime = new Date().getTime() - RECENT_MUTATION_TIMEOUT;
  recentMutations.value = recentMutations.value
    .filter((mutation) => mutation.timestamp > cutoffTime)
    .slice(-MAX_RECENT_MUTATIONS);
}

async function logTransaction(tableName, action, obj) {
  if (!obj.id) throw "No id provided";

  const tableInfo = config.value[tableName];
  const oldData = await sync.db[tableName].get(obj.id);

  const createTransactionItem = (data = {}, oldData = {}) => {
    return new sync.db.TransactionQueueItem({
      table: tableName,
      action,
      objectId: obj.id,
      data,
      oldData,
    });
  };

  switch (action) {
    case "create": {
      const data = Object.fromEntries(
        Object.keys(tableInfo.fields)
          .filter(
            (fieldName) =>
              obj[fieldName] !== undefined && fieldName !== "createdAt"
          )
          .map((fieldName) => [fieldName, obj[fieldName]])
      );
      await createTransactionItem(data).enqueue();
      break;
    }

    case "update": {
      const data = {};
      for (const [fieldName, fieldInfo] of Object.entries(tableInfo.fields)) {
        const newVal = obj[fieldName];
        const oldVal = oldData[fieldName];

        const hasChanges =
          newVal instanceof Date && oldVal instanceof Date
            ? newVal.getTime() !== oldVal.getTime()
            : newVal !== oldVal;

        if (hasChanges) {
          data[fieldName] = newVal;
        }
      }

      if (Object.keys(data).length === 0) throw "No changes detected";

      await createTransactionItem(data, oldData).enqueue();
      break;
    }

    case "delete": {
      await createTransactionItem({}, oldData).enqueue();
      break;
    }

    default:
      throw `Unsupported action: ${action}`;
  }
}

async function processNextTransactionInQueue() {
  if (!acquireTabLock(TAB_ID, TAB_LOCK_KEY, TAB_LOCK_TIMEOUT)) {
    console.log("Another tab is processing the queue.");
    return;
  }

  // Exit if already processing - important to keep this outside try...finally
  if (isProcessingTransactionQueue.value) return;

  // We need the nextTransaction variable to be accessible in the finally block
  let nextTransaction;

  // Do not move this try block - the finally is neeeded to release the tab lock
  try {
    isProcessingTransactionQueue.value = true;

    // Ensure 'real-time' mode is active
    if (dataMode.value !== MODES.REAL_TIME) {
      return;
    }

    // Retrieve the transaction queue
    const queue = await sync.db.liveTransactionQueue.value;
    if (queue.length === 0) {
      return;
    }

    nextTransaction = queue[0];
    if (!nextTransaction?.table || !nextTransaction?.action) {
      console.error("Invalid transaction format:", nextTransaction);
      await sync.db.transactionQueue.delete(nextTransaction.id);
      return;
    }

    const singleObjectName = getNameForSingleObjectFromTableName(
      nextTransaction.table
    );
    const singleObjectNameCapitalized = capitalizeFirstLetter(singleObjectName);
    let mutationName = "";
    let inputBlock = "";

    // Build GraphQL mutation based on action type
    switch (nextTransaction.action) {
      case "create":
        mutationName = `${nextTransaction.action}${singleObjectNameCapitalized}`;
        inputBlock = `input: {
        ${singleObjectName}: {
          ${Object.entries(nextTransaction.data)
            .map(([key, value]) => `${key}: ${dbFormat(key, value)}`)
            .join(", ")}
          }
        }`;

        // Store recent update mutations
        logRecentMutation(nextTransaction);
        break;

      case "update":
        mutationName = `${nextTransaction.action}${singleObjectNameCapitalized}`;
        inputBlock = `input: {
        id: \"${nextTransaction.objectId}\",
        patch: {
          ${Object.entries(nextTransaction.data)
            .map(([key, value]) => `${key}: ${dbFormat(key, value)}`)
            .join(", ")}
          }
        }`;

        // Store recent update mutations
        logRecentMutation(nextTransaction);
        break;

      case "delete":
        mutationName = `${nextTransaction.action}${singleObjectNameCapitalized}`;
        inputBlock = `input: {
          id: \"${nextTransaction.objectId}\"
        }`;

        // Store recent update mutations
        logRecentMutation(nextTransaction);
        break;
    }

    // Simulate errors for testing
    if (Number(errorTestRandomAPIFailsPercent.value) > 0) {
      if (Math.random() * 100 < Number(errorTestRandomAPIFailsPercent.value)) {
        inputBlock += "-FAIL-TEST-";
      }
    }

    const localSyncId = await syncId.value;
    try {
      const result = await graffle.gql`
          mutation {
            ${mutationName}(
              ${inputBlock}
            ) {
              ${singleObjectName} {
                syncId
              }
            }
          }
      `.send();

      // Handle response - result can be undefined if server rejects the request
      if (result && (!result?.errors || result.errors.length === 0)) {
        await sync.db.transactionQueue.delete(nextTransaction.id);
        const latestQueue = await sync.db.liveTransactionQueue.value;

        // CURRENT USER PERMISSIONS CHANGE CHECK
        // If the current user has been affected, we need to hydrate their permission
        const isCurrentUserAffected =
          (nextTransaction.table === "users" &&
            nextTransaction.data.id === currentSession.value?.userId) ||
          (nextTransaction.table === "usersOnTeams" &&
            (nextTransaction.data?.userId === currentSession.value?.userId ||
              nextTransaction.oldData?.userId ===
                currentSession.value?.userId));
        if (isCurrentUserAffected) {
          const doFullLoad = nextTransaction.table === "usersOnTeams";
          onChangeCurrentUserPermissionsOrTeams(doFullLoad);
        }
      } else {
        nextTransaction.rollback();
        const errMsg =
          result?.errors?.[0]?.message || "Error processing transaction";
        errorHandling?.setErrorMessage(errMsg);
      }
    } catch (error) {
      console.error("error with transaction", nextTransaction, error);
      nextTransaction.rollback();
      const errMsg = "Error processing transaction";
      errorHandling?.setErrorMessage(errMsg);
    }
  } catch (error) {
    nextTransaction.rollback();
    errorHandling?.setErrorMessage("Failed to process transaction queue");
  } finally {
    isProcessingTransactionQueue.value = false;
    releaseTabLock(TAB_ID, TAB_LOCK_KEY);
  }

  // Automatically process the next transaction if enabled
  if (autoProcessTransactionQueue.value) {
    setTimeout(processNextTransactionInQueue, 1);
  }
}

async function getBootstrapData({
  mode = MODES.BOOTSTRAP_FULL,
  filter = "",
} = {}) {
  let result;
  const fd = config.value;
  const tableNames = Object.keys(fd);

  // Build GraphQL query for all tables
  let query = tableNames
    .map((table) => {
      const fields = fd[table].fields;
      const fieldsQuery = Object.keys(fields).join("\n\t\t\t");
      return `
        ${table} ${filter} {
          nodes {
            ${fieldsQuery}
            syncId
          }
        }`;
    })
    .join("\n");

  try {
    result = await graffle.gql`query {
        ${query}
        sync(companyId: "${companyId}") {
          syncId
        }
      }`.send();
    // Check for undefined result which indicates a 401 unauthorized
    if (result === undefined) {
      throw new Error(
        "Unauthorized: 401 error detected. Please check your authentication credentials."
      );
    }
  } catch (error) {
    console.error("Error getting bootstrap data:", error);
    dataMode.value = MODES.ERROR_LOADING_BOOTSTRAP;
    return;
  }

  // Check for and report errors
  if (result?.errors) {
    console.error("Errors found in bootstrap data:", result.errors);
    errorHandling?.setErrorMessage("Errors found in bootstrap data");
    return;
  }

  // Needed if site not found
  if (!result.sync?.syncId) {
    console.error("No syncId found in bootstrap data");
    errorHandling?.setErrorMessage("No syncId found in bootstrap data");
    window.location = "/signin";
    return;
  }

  // Process and load bootstrap data into IndexedDB
  for (const table of tableNames) {
    let nodes = result[table]?.nodes || [];

    nodes = convertDates(nodes);

    // Convert date to real dates
    if (mode === MODES.BOOTSTRAP_FULL) {
      await sync.db[table].bulkPut(nodes);
      const allNewIds = nodes.map((o) => o.id);
      const allOldIdsThatDontMatch = await sync.db[table]
        .where("id")
        .noneOf(allNewIds)
        .primaryKeys();
      await sync.db[table].bulkDelete(allOldIdsThatDontMatch);
    } else if (mode === "updates") {
      await sync.db[table].bulkDelete(
        nodes
          .filter(
            (node) => node.stateId === "DELETED" || node.stateId === "ARCHIVED"
          )
          .map((node) => node.id)
      );
      // Update nodes
      try {
        await sync.db[table].bulkPut(
          nodes.filter((node) => node.stateId === "ACTIVE")
        );
      } catch (error) {
        // If bulkPut fails, insert one by one
        console.error(
          "Error executing bulkPut, reverting to one-by-one",
          error
        );
        for (const node of nodes.filter((node) => node.stateId === "ACTIVE")) {
          await sync.db[table].put(node);
        }
      }
    }
  }

  // Update the syncId and switch data mode (this is local only)
  await sync.db.meta.put({
    name: "syncId",
    value: result.sync.syncId,
  });

  dataMode.value = MODES.REAL_TIME_INIT;
}

async function retryOperation(operation, retries = API_MAX_RETRY_ATTEMPTS) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, API_RETRY_DELAY_MS * (i + 1))
      );
    }
  }
}

async function getLatestLastSyncId() {
  try {
    const result = await retryOperation(() =>
      graffle.gql`query {
        sync(companyId: "${companyId}") {
          syncId
        }
      }`.send()
    );
    const latestLastSyncId = result.sync.syncId;

    const localSyncId = await syncId.value;

    // Debugging issue in production where localSyncId is null
    if (!localSyncId) {
      console.error(
        "No local sync ID found, skipping bootstrap.",
        typeof localSyncId
      );
    }

    if (localSyncId && localSyncId !== latestLastSyncId) {
      // Load changes from the server
      await getBootstrapData({
        mode: "updates",
        filter: `(filter: { syncId: { greaterThan: ${localSyncId}, lessThanOrEqualTo: ${latestLastSyncId} } })`,
      });
    } else {
      // Already up to date
      dataMode.value = MODES.REAL_TIME_INIT;
    }

    // Process any remaining transactions
    processNextTransactionInQueue();
  } catch (error) {
    console.error("Failed to get latest sync ID after retries:", error);
    errorHandling?.setErrorMessage("Failed to sync with server");
    dataMode.value = MODES.OFFLINE;
  }
}

async function processNextSocketEventInQueue() {
  // Exit if already processing
  if (isProcessingSocketEventQueue.value) {
    return;
  }
  isProcessingSocketEventQueue.value = true;

  // Ensure we are in 'real-time' mode
  if (dataMode.value !== MODES.REAL_TIME) {
    isProcessingSocketEventQueue.value = false;
    return;
  }

  // Check if there are events to process
  if (socketEventQueue.value.length === 0) {
    isProcessingSocketEventQueue.value = false;
    return;
  }

  const event = socketEventQueue.value.shift();
  const localSyncId = await syncId.value;

  // Ignore events already covered by the bootstrap
  if (event.data.syncId <= localSyncId && !event?.command === "delete") {
    isProcessingSocketEventQueue.value = false;
    return;
  }

  let existingObject;
  try {
    if (event?.command === "delete") {
      existingObject = await sync.db[event.table].get(event.data.id);
      if (existingObject) await sync.db[event.table].delete(event.data.id);
    } else {
      if (typeof event.data.syncId !== "number") {
        throw new Error("syncId is not a number");
      }

      // Handle insert or update commands
      if (event.command === "insert") {
        try {
          await sync.db[event.table].add({ ...event.data }); // Spread to avoid proxy issues with Dexie
        } catch (e) {
          if (e.name === "ConstraintError") {
            await sync.db[event.table].update(event.data.id, event.data);
          }
        }
      } else {
        // Update existing records only
        existingObject = await sync.db[event.table].get(event.data.id);
        if (existingObject)
          await sync.db[event.table].update(event.data.id, event.data);
      }
    }
  } catch (error) {
    console.error("Error processing socket event:", error);
  } finally {
    isProcessingSocketEventQueue.value = false;

    // Automatically process the next event if queue is not empty
    if (autoProcessSocketEventQueue.value) {
      setTimeout(processNextSocketEventInQueue, 1);
    }
  }

  // CURRENT USER PERMISSIONS CHANGE CHECK
  // If the current user has been affected, we need to hydrate their permission
  const isCurrentUserAffected =
    (event.table === "users" &&
      event.data.id === currentSession.value?.userId) ||
    (event.table === "usersOnTeams" &&
      (event.data?.userId === currentSession.value?.userId ||
        existingObject?.userId === currentSession.value?.userId));
  if (isCurrentUserAffected) {
    const doFullReload = event.table === "usersOnTeams";
    onChangeCurrentUserPermissionsOrTeams(doFullReload);
  }
}

function initRealtimeMode() {
  // If socket is already set up, update the data mode and process events
  if (isSocketSetup) {
    dataMode.value = socketIsConnected.value
      ? MODES.REAL_TIME
      : MODES.REAL_TIME_DISCONNECTED;

    if (autoProcessSocketEventQueue.value) {
      processNextSocketEventInQueue();
    }

    if (autoProcessTransactionQueue.value) {
      processNextTransactionInQueue();
    }

    return;
  }

  // Initialize socket connection
  const socket = io(`${socketAddr}:443`, {
    autoConnect: false,
    secure: true,
    reconnect: true,
    rejectUnauthorized: false,
    auth: {
      companyId,
    },
  });

  // Handle socket connection events
  socket.on("connect", () => {
    socketIsConnected.value = true;
    dataMode.value = [
      MODES.REAL_TIME_INIT,
      MODES.REAL_TIME_DISCONNECTED,
    ].includes(dataMode.value)
      ? MODES.BOOTSTRAP_DELTA
      : MODES.REAL_TIME;
  });

  socket.on("disconnect", () => {
    socketIsConnected.value = false;
    dataMode.value = MODES.REAL_TIME_DISCONNECTED;
  });

  // Listen for socket events
  socket.onAny((eventName, ...events) => {
    if (eventName !== "syncEvent") return;
    events.forEach((event) => {
      if (!event.data?.id || !event.table) return; // hardening

      // Convert the table and data to camelCase
      // This must be done before the recent mutations check below
      event.table = snakeToCamel(event.table);
      event.data = snakeToCamel(event.data);
      event.data = convertDates(event.data);

      // Check if this event matches a recent mutation, and if so ignore it
      // This prevents bad experience using the UI especially when the user is typing
      const isRecentMutation = recentMutations.value.some((mutation) =>
        (() => {
          const eventCommand =
            event.command === "insert" ? "create" : event.command;
          const actionMatch = mutation.action === eventCommand;
          const tableMatch = mutation.table === snakeToCamel(event.table);
          const idMatch = mutation.objectId === event.data.id;
          const hasUpdatedAt = event.data.updatedAt instanceof Date;
          const isRecent =
            mutation.timestamp > new Date().getTime() - RECENT_MUTATION_TIMEOUT;
          const dataMatches = Object.entries(mutation.data).every(
            ([key, value]) => {
              const matches =
                value instanceof Date && event.data[key] instanceof Date
                  ? value.getTime() === event.data[key].getTime()
                  : event.data[key] === value;
              return matches;
            }
          );
          return (
            actionMatch &&
            tableMatch &&
            idMatch &&
            hasUpdatedAt &&
            isRecent &&
            dataMatches
          );
        })()
      );

      // Exit if this event comes from us
      if (isRecentMutation) {
        if (import.meta.env.DEV) {
          console.log("Skipping socket event that originated from us", event);
        }
        return;
      } else if (import.meta.env.DEV) {
        console.log("Processing socket event", event);
      }

      // Process the event
      if (import.meta.env.DEV) {
        // Simulate slow network in dev so we can recreate issues
        setTimeout(() => {
          socketEventQueue.value.push(event);
        }, 500); // Simulate slow network in dev
      } else {
        socketEventQueue.value.push(event);
      }
    });
  });

  // Manage WebSocket updates based on user preferences
  if (allowWebSocketUpdates.value) {
    socket.connect();
  }

  watch(allowWebSocketUpdates, (newVal) => {
    newVal ? socket.connect() : socket.disconnect();
  });

  isSocketSetup = true;
}

async function checkRequiredAndAddDefaults(tableDef, _this) {
  for (const [fieldName, fieldInfo] of Object.entries(tableDef.fields)) {
    if (fieldName === "id") continue;

    const fieldVal = _this[fieldName];
    if (fieldVal !== undefined && fieldVal !== null) continue;

    if (fieldInfo?.default) {
      // evalDefault flag tells us to eval the default value string
      if (fieldInfo?.evalDefault) {
        _this[fieldName] = eval(fieldInfo.default);
      } else {
        _this[fieldName] = fieldInfo.default;
      }
      continue;
    }

    if (!fieldInfo?.required) continue;

    if (fieldName === "createdAt") {
      _this.createdAt = new Date();
      continue;
    }

    if (fieldName === "companyId") {
      _this.companyId = companyId;
      continue;
    }

    const errMsg = `Missing required field '${fieldName}'`;
    console.error(errMsg);
    errorHandling?.setErrorMessage(errMsg);
    return false;
  }

  return true;
}

// Creates handlers for the fields that are passed in so that we get
// handlers like new sync.Object() or object.save() or object.delete()
function setupObjectClasses() {
  // Create the Transaction class
  var TransactionQueueItemClass = Dexie.defineClass({
    id: String,
    table: String,
    action: String,
    objectId: String,
    data: Object,
    oldData: Object,
  });
  TransactionQueueItemClass.prototype.enqueue = async function () {
    await sync.db.transactionQueue.add(this);
  };
  TransactionQueueItemClass.prototype.rollback = async function () {
    // Remove this transaction from the queue
    await sync.db.transactionQueue.delete(this.id);
    // Instant rollback
    switch (this.action) {
      case "create":
        await sync.db[this.table].delete(this.objectId);
        break;
      case "update":
        await sync.db[this.table].update(this.objectId, this.oldData);
        break;
      case "delete":
        await sync.db[this.table].add({ ...this.oldData });
        break;
    }
  };
  sync.db.transactionQueue.mapToClass(TransactionQueueItemClass);
  sync.db["TransactionQueueItem"] = TransactionQueueItemClass;

  const tables = config.value;
  const tableNames = Object.keys(tables);
  for (const tableName of tableNames) {
    const tableDef = tables[tableName];
    let tableClassName = capitalizeFirstLetter(
      getNameForSingleObjectFromTableName(tableName)
    );
    var tableClass = Dexie.defineClass(tableDef);

    var genFn = function (tableName, tableDef, fn) {
      return async function () {
        return await fn(tableName, tableDef, this);
      };
    };

    tableClass.prototype.create = genFn(
      tableName,
      tableDef,
      async function (tableName, tableDef, _this) {
        // Add defaults and check required
        if (!(await checkRequiredAndAddDefaults(tableDef, _this))) return false;
        // Log the transaction
        await logTransaction(tableName, "create", _this);
        // Reflect changes instantly - add us to indexedDb
        await sync.db[tableName].add(_this);
        return true;
      }
    );
    tableClass.prototype.save = genFn(
      tableName,
      tableDef,
      async function (tableName, tableDef, _this) {
        // Add defaults and check required
        if (!(await checkRequiredAndAddDefaults(tableDef, _this))) return false;
        // Log the transaction
        await logTransaction(tableName, "update", _this);
        // Reflect changes instantly - update in indexedDb - must be after logTransaction
        await sync.db[tableName].update(_this.id, _this);
        return true;
      }
    );
    // This delete is a soft delete by default
    tableClass.prototype.softDelete = genFn(
      tableName,
      tableDef,
      async function (tableName, tableDef, _this) {
        if (_this.stateId === undefined)
          throw "stateId not supported for soft delete. Use delete().";
        _this.stateId = "DELETED";
        // Log the transaction
        await logTransaction(tableName, "update", _this);
        // Reflect changes instantly - update in indexedDb - must be after logTransaction
        await sync.db[tableName].update(_this.id, _this);
      }
    );
    tableClass.prototype.restore = genFn(
      tableName,
      tableDef,
      async function (tableName, tableDef, _this) {
        if (_this.stateId === undefined)
          throw "stateId not supported for restore.";
        _this.stateId = "ACTIVE";
        // Log the transaction
        await logTransaction(tableName, "update", _this);
        // Reflect changes instantly - update in indexedDb - must be after logTransaction
        await sync.db[tableName].update(_this.id, _this);
      }
    );
    tableClass.prototype.delete = genFn(
      tableName,
      tableDef,
      async function (tableName, tableDef, _this) {
        // Log the transaction
        await logTransaction(tableName, "delete", _this);
        // Reflect changes instantly - take us out of the indexedDb
        await sync.db[tableName].delete(_this.id);
      }
    );
    sync.db[tableName].mapToClass(tableClass);
    sync.db[tableClassName] = tableClass;
  }
}

// Setup watchers
function setupWatchers() {
  sync.db.liveTransactionQueue = useObservable(
    Dexie.liveQuery(() => sync.db.transactionQueue.toArray())
  );

  const autoProcessWatchers = [
    {
      source: sync.db.liveTransactionQueue,
      handler: processNextTransactionInQueue,
    },
    {
      source: autoProcessTransactionQueue,
      handler: (isOn) => isOn && processNextTransactionInQueue(),
    },
    { source: socketEventQueue.value, handler: processNextSocketEventInQueue },
    {
      source: autoProcessSocketEventQueue,
      handler: (isOn) => isOn && processNextSocketEventInQueue(),
    },
  ];

  autoProcessWatchers.forEach(({ source, handler }) => watch(source, handler));

  watch(dataMode, async (newMode) => {
    if (newMode === MODES.BOOTSTRAP_FULL) {
      await getBootstrapData();
    } else if (newMode === MODES.BOOTSTRAP_DELTA) {
      await getLatestLastSyncId();
    } else if (newMode === MODES.REAL_TIME_INIT) {
      initRealtimeMode();
    }
  });
}

// Update init function
async function init(options = {}) {
  // Wait for tab lock instead of giving up - this one needs to be long for full bootstrap to finish
  await waitForTabLock(TAB_ID, TAB_LOCK_KEY, TAB_LOCK_INIT_TIMEOUT);

  try {
    // Set up error handling and account ID
    errorHandling = options.errorHandling || null;

    // Remember the logged in user
    if (currentSession.value === null || !currentSession.value?.email?.length) {
      throw new Error("User not logged in");
    }

    // Ensure required options are provided
    const requiredOptions = [
      "socketAddr",
      "graphQLEndpoint",
      "graphQLHeaders",
      "config",
      "companyId",
    ];
    requiredOptions.forEach((key) => {
      if (options[key] === undefined) throw new Error(`${key} is required`);
    });

    // Assign options to internal variables
    socketAddr = options.socketAddr;
    graphQLEndpoint = options.graphQLEndpoint;
    graphQLHeaders = options.graphQLHeaders;
    config.value = options.config;
    companyId = options.companyId;
    appCode = options.appCode; // Store for cleanup in hardReload

    // Determine the database name and check if a full reload is necessary
    const localStorageKey = `success.co_${companyId}`; // TODO: Should be using options.appCode instead of hardcoded success.co
    const lastLoadTimeKey = `lastLoadTime_${companyId}`;
    let dbName = localStorage.getItem(localStorageKey);
    const currentLoadTime = Date.now();
    let doFullLoad = false;
    let dbToDelete = null;
    // Check the time since the last load to decide on a full reload
    const lastLoadTime = sessionStorage.getItem(lastLoadTimeKey);
    if (lastLoadTime) {
      const timeSinceLastLoad = currentLoadTime - Number(lastLoadTime);
      if (timeSinceLastLoad < 5000) {
        // Less than 5 seconds
        doFullLoad = true;
        console.info("FULL RELOAD REQUESTED (double reload in < 5 secs)");
      }
    }

    // Check if the table structure has changed based on a hash of the table data, do full reload if so
    const configHashKey = `configHash_${companyId}_${currentSession.value?.userId}`;
    const currentTableDataHash = await computeSHA256Hash(
      JSON.stringify(config.value)
    );
    const previousTableDataHash = localStorage.getItem(configHashKey);
    if (currentTableDataHash !== previousTableDataHash) {
      doFullLoad = true; // Trigger a full reload
    }
    localStorage.setItem(configHashKey, currentTableDataHash);

    // Determine if a new database should be created, and old one should be deleted
    if (doFullLoad || !dbName) {
      if (dbName) {
        dbToDelete = dbName; // Mark the old database for deletion
      }
      dbName = generateDbName(options.appCode, companyId, currentLoadTime);
      localStorage.setItem(localStorageKey, dbName);
    }
    // Update the last load time in session storage
    sessionStorage.setItem(lastLoadTimeKey, currentLoadTime);

    // Initialize a new Dexie database instance
    sync.db = new Dexie(dbName, { addons: [relationships] });

    // Configure the Dexie database schema
    sync.db.version(1).stores({
      meta: "name, value",
      transactionQueue: "++id, table, action, objectId, data, oldData",
      ...getIndexesForDexie(),
    });

    // Set up object classes for database operations
    setupObjectClasses();

    // Initialize watchers for reactive updates
    setupWatchers();

    // Delete old database instance
    if (dbToDelete) {
      await Dexie.delete(dbToDelete); // Delete the old database if necessary
      console.log(`Deleted old db: ${dbToDelete}`);
    }

    // Determine the bootstrap mode: FULL or DELTA
    const localSyncId = await syncId.value;
    if (!localSyncId || !(localSyncId > 0)) {
      doFullLoad = true; // Force a full load if no valid sync ID is found
    }

    // Setup the graphql api and security
    graffle = Graffle.create().transport({
      url: graphQLEndpoint,
      headers: {
        authorization: `Bearer ${authToken.value}`,
        ...graphQLHeaders,
      },
    });

    // Save the current load time and set the data mode
    localStorage.setItem("lastLoadTime", currentLoadTime);
    dataMode.value = doFullLoad ? MODES.BOOTSTRAP_FULL : MODES.BOOTSTRAP_DELTA;
  } catch (error) {
    console.error("Initialization failed:", error);
  } finally {
    // Release tab lock
    releaseTabLock(TAB_ID, TAB_LOCK_KEY);
  }
}

async function onChangeCurrentUserPermissionsOrTeams(doFullReload = false) {
  const beforeUpdateCurrentUser = currentSession.value;

  // Update the users permission levels
  await hydrateSession();

  if (!currentSession.value) return;

  // Update graffle authToken - it would be nice to just update the token but
  // I can't see docs on that yet https://graffle.js.org/ - this works anyhow:
  graffle = Graffle.create().transport({
    url: graphQLEndpoint,
    headers: {
      authorization: `Bearer ${authToken.value}`,
      ...graphQLHeaders,
    },
  });

  // Only do full reload if told to or we pick up that permissions have changed
  if (!doFullReload) {
    doFullReload = havePermissionsChanged(beforeUpdateCurrentUser);
  }

  // Do a full reload of data now that permissions have changed
  if (doFullReload) {
    dataMode.value = MODES.BOOTSTRAP_FULL;
  }
}

// TODO: Move to utils.js
async function computeSHA256Hash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

async function hardReload() {
  // Delete all IndexedDB databases that start with the base database name
  if (appCode && "databases" in indexedDB) {
    try {
      const databases = await indexedDB.databases();
      const databasesToDelete = databases.filter(
        (db) => db.name && db.name.startsWith(appCode)
      );

      for (const db of databasesToDelete) {
        await Dexie.delete(db.name);
        console.log(`Deleted database: ${db.name}`);
      }
    } catch (error) {
      console.error("Error deleting databases:", error);
    }
  }

  window.location.reload();
}

// Create internal sync object that will be exported
const sync = {
  db: null, // Will be set during init
  init,
  allowWebSocketUpdates,
  autoProcessSocketEventQueue,
  autoProcessTransactionQueue,
  dataMode,
  errorTestRandomAPIFailsPercent,
  getBootstrapData,
  getLatestLastSyncId,
  hardReload,
  initRealtimeMode,
  isProcessingSocketEventQueue,
  isProcessingTransactionQueue,
  syncId,
  processNextSocketEventInQueue,
  processNextTransactionInQueue,
  socketEventQueue,
  socketIsConnected,
  config,
  currentSession,
  isLoaded,
  MODES,
};

// Export the sync object
export { sync };
