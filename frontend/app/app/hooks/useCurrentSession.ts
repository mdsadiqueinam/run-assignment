import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocalStorageState } from "ahooks";
import { v4 as uuidv4 } from "uuid";

// Unique identifier for the current tab
const TAB_ID = `tab-${uuidv4()}`;

// Session state management
let currentSession: any = undefined; // undefined = unknown, null = logged out
const sessionListeners = new Set<(session: any) => void>();

// Function to update session globally
function updateSession(newSession: any) {
  currentSession = newSession;
  sessionListeners.forEach((listener) => listener(newSession));
}

// Custom hook for current session
export const useCurrentSession = () => {
  const [session, setSession] = useState(currentSession);
  const [tabMessage, setTabMessage] = useLocalStorageState<string | null>(
    "tabMessage",
    {
      defaultValue: null,
    }
  );

  // Subscribe to session changes
  useEffect(() => {
    sessionListeners.add(setSession);
    return () => {
      sessionListeners.delete(setSession);
    };
  }, []);

  // Handle inter-tab communication via useLocalStorageState
  useEffect(() => {
    if (tabMessage) {
      try {
        const messageObj = JSON.parse(tabMessage);
        const { origin, message } = messageObj;

        // Ignore messages originating from the same tab
        if (origin === TAB_ID) return;

        // Handle logout message
        if (message === "logout") {
          window.location.href = "/signin";
        }
      } catch (_error) {
        console.error("Error parsing tab message:", _error);
      }
    }
  }, [tabMessage]);

  // Function to send a message to other tabs
  const sendTabMessage = useCallback(
    (message: string) => {
      const messageData = JSON.stringify({ origin: TAB_ID, message });
      setTabMessage(messageData);
    },
    [setTabMessage]
  );

  // Computed properties for impersonation
  const isImpersonating = useMemo(() => {
    return !!session?.impersonator;
  }, [session]);

  const originalUserName = useMemo(() => {
    if (!session?.impersonator) return "Admin";

    const firstName = session.impersonator.originalFirstName || "";
    const lastName = session.impersonator.originalLastName || "";

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    return "Admin";
  }, [session]);

  // Function to return to the original admin user
  const returnToOriginalUser = useCallback(() => {
    if (!isImpersonating) return;
    window.location.href = `/auth/return-from-impersonation`;
  }, [isImpersonating]);

  // Logout function
  const logoutCurrentSession = useCallback(async () => {
    await fetch("/auth/signout.json", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });
    sessionStorage.removeItem("isLogin");
    sendTabMessage("logout");
    window.location.href = "/signin";
  }, [sendTabMessage]);

  // Hydrate session
  const hydrateSession = useCallback(async () => {
    return await fetchUserSession({ hydrate: true });
  }, []);

  // Check if permissions changed
  const havePermissionsChanged = useCallback(
    (oldCurrentSessionVal: any) => {
      return (
        oldCurrentSessionVal?.userPermissionId !== session?.userPermissionId
      );
    },
    [session]
  );

  // Fetch user session
  const fetchUserSession = useCallback(
    async (options: { hydrate?: boolean } = {}) => {
      const response = await fetch(
        options.hydrate ? "/auth/hydrateSession.json" : "/auth/session.json"
      );

      // Handle 304 Not Modified
      if (response.status === 304 && options.hydrate) {
        return null; // No changes, all good
      }

      const data = await response.json();

      // Return empty session if not logged in
      if (!response.ok) {
        // Remember the current URL in session storage
        const path = window.location.pathname;
        if (!["/signin", "/signup", "/login", "/app"].includes(path)) {
          window.location.href = "/signin";
        }
        return null;
      }

      // Set the session data globally (this will update all components)
      const sessionData = data.session;
      updateSession(sessionData);
      return sessionData;
    },
    []
  );

  // Initialize session
  const init = useCallback(async () => {
    return await fetchUserSession();
  }, [fetchUserSession]);

  return {
    session,
    isImpersonating,
    originalUserName,
    returnToOriginalUser,
    logoutCurrentSession,
    hydrateSession,
    havePermissionsChanged,
    fetchUserSession,
    init,
  };
};
