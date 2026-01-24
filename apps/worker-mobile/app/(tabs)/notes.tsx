import { View } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function NotesScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#F5F5F5',
      }}
    >
      <MaterialCommunityIcons name="note-text-outline" size={48} color="#ccc" />
      <Text variant="titleMedium" style={{ marginTop: 16, color: '#666' }}>
        My Notes
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: '#999', textAlign: 'center', marginTop: 8 }}
      >
        Your case notes will appear here after you complete shifts.
      </Text>
    </View>
  )
}
