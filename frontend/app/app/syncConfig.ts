"use strict";
/*
Indexes usually get created for you automatically based on the index flag but you can customise the indexes
when you need something more complex with "customIndex".

IMPORTANT: This config should be STATIC . i.e. don't do things like default: new Date()
or that will cause the config to be different on every reload which will cause lots of problems.
*/

/**
 * Deep freeze function to ensure the syncConfig cannot be modified at runtime
 * This enforces the static nature of the configuration
 */
function deepFreeze(obj: Record<string, any>): Record<string, any> {
  // Retrieve the property names defined on obj
  Object.getOwnPropertyNames(obj).forEach(function (name) {
    const value = obj[name];

    // Freeze properties before freezing self
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  });

  return Object.freeze(obj);
}

const syncConfigData = {
  users: {
    fields: {
      id: { index: true, type: String },
      firstName: { index: false, type: String, required: true },
      lastName: { index: false, type: String, required: true },
      email: { index: false, type: String, required: true },
      userPermissionId: { index: false, type: String, required: true },
      timeZone: { index: false, type: String, default: "Europe/Dublin" },
      createdAt: { index: true, type: Date, required: true },
      stateId: { index: true, type: String, default: "ACTIVE" },
    },
  },
};

// Export the deeply frozen syncConfig to ensure complete immutability
export const syncConfig = deepFreeze(syncConfigData);
