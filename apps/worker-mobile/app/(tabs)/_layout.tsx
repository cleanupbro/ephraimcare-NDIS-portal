import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { TimerBar } from '../../components/TimerBar'
import { useSession } from '../../hooks/useAuth'
import { usePendingNoteShifts } from '../../hooks/usePendingNoteShifts'

export default function TabLayout() {
  const { userId } = useSession()
  const { data: pendingData } = usePendingNoteShifts(userId)
  const pendingCount = pendingData?.length ?? 0
  return (
    <View style={{ flex: 1 }}>
    <TimerBar />
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#66BB6A',
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-week" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'My Notes',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#EF4444', fontSize: 10 },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="note-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </View>
  )
}
