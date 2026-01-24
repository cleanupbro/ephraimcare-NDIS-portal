import { View } from 'react-native'
import { Card, Text } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { format, parseISO } from 'date-fns'

export interface ShiftCardProps {
  id: string
  participantFirstName: string
  participantLastName: string
  scheduledStart: string
  scheduledEnd: string
  status: string
  supportType: string | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFA726',
  proposed: '#FFA726',
  confirmed: '#66BB6A',
  in_progress: '#42A5F5',
  completed: '#BDBDBD',
}

export function ShiftCard({
  id,
  participantFirstName,
  participantLastName,
  scheduledStart,
  scheduledEnd,
  status,
  supportType,
}: ShiftCardProps) {
  const router = useRouter()
  const dotColor = STATUS_COLORS[status] ?? '#BDBDBD'

  const startFormatted = format(parseISO(scheduledStart), 'h:mm a')
  const endFormatted = format(parseISO(scheduledEnd), 'h:mm a')

  return (
    <Card
      onPress={() => router.push(`/shift/${id}`)}
      style={{ marginBottom: 8, borderRadius: 8 }}
      mode="elevated"
    >
      <Card.Content style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: dotColor,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">
            {participantFirstName} {participantLastName}
          </Text>
          <Text variant="bodySmall" style={{ color: '#666', marginTop: 2 }}>
            {startFormatted} – {endFormatted}
          </Text>
        </View>
        {supportType && (
          <Text variant="labelSmall" style={{ color: '#999' }}>
            {supportType}
          </Text>
        )}
      </Card.Content>
    </Card>
  )
}
