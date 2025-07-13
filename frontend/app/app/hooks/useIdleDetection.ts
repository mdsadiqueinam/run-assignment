import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook for idle detection
 * Detects when user becomes idle after a specified timeout
 */
export const useIdle = (timeout: number) => {
  const [isIdle, setIsIdle] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsIdle(false)
    timeoutRef.current = setTimeout(() => setIsIdle(true), timeout)
  }

  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ]

    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true)
    })

    resetTimer()

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, true)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [timeout])

  return { isIdle }
}

/**
 * Custom hook for document visibility detection
 * Detects when the document/tab becomes visible or hidden
 */
export const useDocumentVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return isVisible
}
