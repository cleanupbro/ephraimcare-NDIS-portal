import { View } from 'react-native'
import { Text } from 'react-native-paper'
import { useElapsedTimer } from '../hooks/useActiveShift'
import { useShiftStore } from '../stores/shiftStore'

export function TimerBar() {
  const { formatted, isActive } = useElapsedTimer()
  const participantName = useShiftStore((s) => s.activeParticipantName)

  if (!isActive) return null

  return (
    <View
      style={{
        backgroundColor: '#E3F2FD',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 16,
        gap: 8,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#66BB6A',
        }}
      />
      <Text
        variant="labelMedium"
        style={{
          color: '#1565C0',
          fontWeight: '600',
          fontVariant: ['tabular-nums'],
        }}
      >
        {formatted}
      </Text>
      {participantName && (
        <Text variant="labelSmall" style={{ color: '#666' }} numberOfLines={1}>
          with {participantName}
        </Text>
      )}
    </View>
  )
}
