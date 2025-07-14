import React, { useEffect } from 'react'

/**
 * SignedInSetup Component
 *
 * Handles initial setup and ongoing maintenance of the signed-in user session.
 *
 * Session & Permissions Hydration:
 * The component uses two mechanisms to ensure permissions stay fresh when a user returns after being away:
 * 1. Tab Visibility: Using document visibility API to detect when user switches back to the tab
 * 2. Idle Detection: Using a custom hook to detect when user returns after extended inactivity
 *
 * This dual approach ensures we catch all scenarios where permissions might need refreshing,
 * whether it's simple tab switching or returning to the computer after extended absence.
 */

interface SignedInSetupProps {
  children?: React.ReactNode
}

const SignedInSetup: React.FC<SignedInSetupProps> = ({ children }) => {
  // Use existing hooks
  const { session, hydrateSession, init } = useCurrentSession()

  // Idle and visibility detection
  const { isIdle } = useIdle(1800000) // 30 minutes in milliseconds
  const isVisible = useDocumentVisibility()

  // Idle detection effect - hydrate session when user becomes active again
  useEffect(() => {
    if (!isIdle && session) {
      hydrateSession()
    }
  }, [isIdle, session, hydrateSession])

  // Visibility detection effect - hydrate session when tab becomes visible again
  useEffect(() => {
    if (isVisible && session) {
      hydrateSession()
    }
  }, [isVisible, session, hydrateSession])

  // Initialize session on mount
  useEffect(() => {
    init()
  }, [init])

  // Initialize services when session is available
  useEffect(() => {
    if (session) {
      initServices()
    }
  }, [session])

  const initServices = async () => {
    try {
      // Initialize any additional services like sync, analytics, etc.
      if (process.env.NODE_ENV === 'production') {
        // Initialize analytics or other production services
        console.log('Initializing production services...')
      }
    } catch (error) {
      console.error('Error initializing services:', error)
    }
  }

  // Render children or default layout
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {children || (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            You are successfully signed in.
          </p>
        </div>
      )}
    </div>
  )
}

export default SignedInSetup
