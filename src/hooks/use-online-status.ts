import { useEffect, useState } from 'react'

/**
 * Tracks browser online/offline status.
 * Uses navigator.onLine and listens to online/offline events.
 *
 * Note: navigator.onLine can report true when connected to WiFi but without
 * internet access. This is acceptable - failed API calls will be handled
 * by the auth provider.
 *
 * @returns Current online status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
