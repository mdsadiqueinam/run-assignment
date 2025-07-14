export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function convertDates(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertDates);
  } else if (obj && typeof obj === "object") {
    return Object.entries(obj).reduce((acc: any, [key, value]) => {
      acc[key] = shouldConvertToDate(key, value)
        ? new Date(value as string)
        : convertDates(value);
      return acc;
    }, {});
  }
  return obj;
}

export function shouldConvertToDate(key: string, value: any): boolean {
  return (
    (key.endsWith("At") ||
      key.endsWith("Date") ||
      key.endsWith("Time") ||
      key === "date") &&
    typeof value === "string"
  );
}

export function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj;
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc: any, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, char) =>
        char.toUpperCase()
      );
      acc[camelKey] = obj[key];
      return acc;
    }, {});
  } else if (typeof obj === "string") {
    return obj.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }
  return obj;
}

export function getNameForSingleObjectFromTableName(tableName: string): string {
  if (tableName.endsWith("ies")) return tableName.slice(0, -3) + "y";
  if (tableName.endsWith("s")) return tableName.slice(0, -1);
  return tableName;
}

export function dbFormat(key: string, value: any): string | number {
  if (value instanceof Date) {
    return `"${value.toISOString()}"`;
  } else if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    return `"${value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")}"`;
  } else if (typeof value === "boolean") {
    return `${value}`;
  } else if (value === null) {
    return `null`;
  }
  const errMsg = `Field '${key}' is an unsupported data type '${typeof value}'`;
  console.error(errMsg, value);
  throw errMsg;
}

interface TabLock {
  tabId: string;
  timestamp: number;
}

/**
 * Attempts to acquire a lock for the current tab
 * @param {string} tabId - Unique identifier for the current tab
 * @param {string} lockKey - Key used for storing the lock in localStorage
 * @param {number} timeout - Lock timeout in milliseconds
 * @returns {boolean} - True if lock was acquired or already owned by this tab
 */
export function acquireTabLock(
  tabId: string,
  lockKey: string,
  timeout: number
): boolean {
  const currentTime = Date.now();
  const lockData = localStorage.getItem(lockKey);
  const lock: TabLock | null = lockData ? JSON.parse(lockData) : null;

  if (!lock || currentTime - lock.timestamp > timeout) {
    // Lock is either not set or expired, acquire it
    localStorage.setItem(
      lockKey,
      JSON.stringify({ tabId, timestamp: currentTime })
    );
    return true;
  }

  // Lock exists and is not expired
  return lock.tabId === tabId; // True if this tab already owns the lock
}

/**
 * Releases the lock if owned by the current tab
 * @param {string} tabId - Unique identifier for the current tab
 * @param {string} lockKey - Key used for storing the lock in localStorage
 */
export function releaseTabLock(tabId: string, lockKey: string): void {
  const lockData = localStorage.getItem(lockKey);
  const lock: TabLock | null = lockData ? JSON.parse(lockData) : null;
  if (lock && lock.tabId === tabId) {
    localStorage.removeItem(lockKey); // Only release if this tab owns the lock
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16); // Convert to hex and ensure positive
}

export function generateDbName(
  appCode: string,
  companyId: string,
  timestamp: number
): string {
  const companyIdHash = simpleHash(companyId);
  const timestampHash = simpleHash(timestamp.toString());
  return `${appCode}_${companyIdHash}_${timestampHash}`;
}

/**
 * Waits until a tab lock can be acquired
 * @param {string} tabId - The ID of the current tab
 * @param {string} lockKey - The key used for locking in localStorage
 * @param {number} timeout - How long the lock should be valid for (ms)
 * @param {number} retryInterval - How often to check for lock availability (ms)
 * @returns {Promise<void>} - Resolves when the lock is acquired
 */
export async function waitForTabLock(
  tabId: string,
  lockKey: string,
  timeout: number,
  retryInterval: number = 100
): Promise<void> {
  while (!acquireTabLock(tabId, lockKey, timeout)) {
    console.log(
      "Another tab is initializing. Waiting for lock to be released..."
    );
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }
}

interface ValidationResult {
  isMinLength: boolean;
  isAlphanumeric: boolean;
}

/**
 * @param {string} teamName - The name of the team
 */
export function validateNameString(teamName: string): ValidationResult {
  // Minimum length requirement check
  const test: ValidationResult = {
    isMinLength: true,
    isAlphanumeric: true,
  };
  const MIN_LENGTH = 2;
  if (teamName.length < MIN_LENGTH) {
    test.isMinLength = false;
  }

  // Check if first two characters are alphanumeric
  const firstTwoChars = teamName.slice(0, MIN_LENGTH);
  const ALPHANUMERIC_PATTERN = /^[a-zA-Z0-9]{2}$/;

  if (!ALPHANUMERIC_PATTERN.test(firstTwoChars)) {
    test.isAlphanumeric = false;
  }

  return test;
}

export async function computeSHA256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
