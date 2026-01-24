import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('shifts', {
      name: 'Shift Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const tokenData = await Notifications.getExpoPushTokenAsync()
  const token = tokenData.data

  await supabase.from('worker_push_tokens').upsert(
    {
      worker_id: userId,
      push_token: token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    } as any,
    { onConflict: 'worker_id' }
  )

  return token
}
