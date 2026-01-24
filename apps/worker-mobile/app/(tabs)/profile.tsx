import { View } from 'react-native'
import { Text, Button, Card } from 'react-native-paper'
import { useSession } from '../../hooks/useAuth'
import { useSyncStore } from '../../stores/syncStore'

export default function ProfileScreen() {
  const { session, signOut } = useSession()
  const pendingCount = useSyncStore((s) => s.pendingActions.length)

  const userEmail = session?.user?.email ?? 'Unknown'
  const userName =
    session?.user?.user_metadata?.full_name ??
    session?.user?.user_metadata?.name ??
    userEmail.split('@')[0]

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5', padding: 16 }}>
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleLarge" style={{ fontWeight: '600' }}>
            {userName}
          </Text>
          <Text variant="bodyMedium" style={{ color: '#666', marginTop: 4 }}>
            {userEmail}
          </Text>
          <Text variant="bodySmall" style={{ color: '#999', marginTop: 2 }}>
            Worker
          </Text>
        </Card.Content>
      </Card>

      {pendingCount > 0 && (
        <Card style={{ marginBottom: 16, backgroundColor: '#FFF8E1' }}>
          <Card.Content>
            <Text variant="bodySmall" style={{ color: '#F57F17' }}>
              {pendingCount} action{pendingCount > 1 ? 's' : ''} pending sync
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={{ flex: 1 }} />

      <Button
        mode="outlined"
        onPress={signOut}
        textColor="#C62828"
        style={{ borderColor: '#C62828', borderRadius: 8 }}
      >
        Log Out
      </Button>

      <Text
        variant="bodySmall"
        style={{ textAlign: 'center', color: '#ccc', marginTop: 16 }}
      >
        Powered by OpBros
      </Text>
    </View>
  )
}
