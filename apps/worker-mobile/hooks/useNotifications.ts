import { useEffect } from 'react'
import { registerForPushNotifications } from '../lib/notifications'
import { useSession } from './useAuth'

export function useNotificationSetup() {
  const { userId } = useSession()

  useEffect(() => {
    if (!userId) return

    registerForPushNotifications(userId).catch((err) => {
      console.warn('Push notification registration failed:', err)
    })
  }, [userId])
}
