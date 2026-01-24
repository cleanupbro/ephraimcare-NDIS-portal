import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Text } from 'react-native-paper'
import NetInfo from '@react-native-community/netinfo'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected)
    })
    return () => unsubscribe()
  }, [])

  if (!isOffline) return null

  return (
    <View
      style={{
        backgroundColor: '#FFA726',
        paddingVertical: 4,
        paddingHorizontal: 16,
        alignItems: 'center',
      }}
    >
      <Text variant="labelSmall" style={{ color: '#fff' }}>
        No internet connection – changes will sync when online
      </Text>
    </View>
  )
}
