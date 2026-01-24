import { View, FlatList, RefreshControl } from 'react-native'
import { Text, ActivityIndicator } from 'react-native-paper'
import { format } from 'date-fns'
import { useSession } from '../../hooks/useAuth'
import { useTodayShifts, useWeekShifts } from '../../hooks/useShifts'
import { ShiftCard } from '../../components/ShiftCard'

export default function HomeScreen() {
  const { userId } = useSession()
  const { data: shifts, isLoading, refetch, isRefetching } = useTodayShifts(userId ?? undefined)

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    )
  }

  if (!shifts || shifts.length === 0) {
    return <EmptyState userId={userId} />
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text variant="titleMedium" style={{ color: '#333' }}>
          Today, {format(new Date(), 'EEEE d MMM')}
        </Text>
      </View>
      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#66BB6A']} />
        }
        renderItem={({ item }) => (
          <ShiftCard
            id={item.id}
            participantFirstName={item.participants?.first_name ?? ''}
            participantLastName={item.participants?.last_name ?? ''}
            scheduledStart={item.scheduled_start}
            scheduledEnd={item.scheduled_end}
            status={item.status}
            supportType={item.support_type}
          />
        )}
      />
    </View>
  )
}

function EmptyState({ userId }: { userId: string | null }) {
  const { data: weekShifts } = useWeekShifts(userId ?? undefined)
  const now = new Date()
  const nextShift = weekShifts?.find((s) => {
    const start = new Date(s.scheduled_start)
    return start > now
  })

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F5F5F5' }}>
      <Text variant="titleMedium" style={{ color: '#333', marginBottom: 8 }}>
        No shifts today
      </Text>
      {nextShift ? (
        <Text variant="bodyMedium" style={{ color: '#666', textAlign: 'center' }}>
          Next: {format(new Date(nextShift.scheduled_start), 'EEEE h:mm a')} with{' '}
          {nextShift.participants?.first_name} {nextShift.participants?.last_name?.charAt(0)}.
        </Text>
      ) : (
        <Text variant="bodyMedium" style={{ color: '#666' }}>
          No upcoming shifts this week.
        </Text>
      )}
    </View>
  )
}
