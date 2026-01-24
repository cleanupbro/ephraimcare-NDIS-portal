import { useState, useCallback } from 'react'
import { View, FlatList, RefreshControl } from 'react-native'
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSession } from '../../hooks/useAuth'
import { usePendingNoteShifts, PendingNoteShift } from '../../hooks/usePendingNoteShifts'
import { CaseNoteModal } from '../../components/CaseNoteModal'

function formatTimeRemaining(checkOutTime: string): string {
  const hoursRemaining = Math.max(
    0,
    24 - (Date.now() - new Date(checkOutTime).getTime()) / (1000 * 60 * 60)
  )
  if (hoursRemaining > 1) {
    return `${Math.floor(hoursRemaining)}h remaining`
  }
  return `${Math.floor(hoursRemaining * 60)}m remaining`
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatShiftTime(start: string): string {
  const date = new Date(start)
  const day = date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${day} at ${time}`
}

export default function NotesScreen() {
  const { userId } = useSession()
  const { data: pendingShifts, isLoading, refetch } = usePendingNoteShifts(userId)

  const [selectedShift, setSelectedShift] = useState<PendingNoteShift | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleWriteNote = (shift: PendingNoteShift) => {
    setSelectedShift(shift)
    setModalVisible(true)
  }

  const handleDismiss = () => {
    setModalVisible(false)
    setSelectedShift(null)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const renderItem = ({ item }: { item: PendingNoteShift }) => (
    <Card style={{ marginBottom: 12, borderRadius: 12 }} mode="elevated">
      <Card.Content style={{ paddingVertical: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>
              {item.participantName}
            </Text>
            <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
              {formatShiftTime(item.scheduledStart)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#999" />
                <Text variant="bodySmall" style={{ color: '#999' }}>
                  {formatDuration(item.durationMinutes)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialCommunityIcons name="timer-sand" size={14} color="#EF4444" />
                <Text variant="bodySmall" style={{ color: '#EF4444' }}>
                  {formatTimeRemaining(item.checkOutTime)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Button
          mode="contained"
          onPress={() => handleWriteNote(item)}
          buttonColor="#66BB6A"
          style={{ marginTop: 12, borderRadius: 8 }}
          icon="pencil"
          compact
        >
          Write Note
        </Button>
      </Card.Content>
    </Card>
  )

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
          My Notes
        </Text>
        <Text variant="bodyMedium" style={{ color: '#666', marginTop: 4 }}>
          Complete notes for recent shifts
        </Text>
      </View>

      {(!pendingShifts || pendingShifts.length === 0) ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <MaterialCommunityIcons name="check-circle-outline" size={56} color="#66BB6A" />
          <Text variant="titleMedium" style={{ marginTop: 16, fontWeight: '600', color: '#333' }}>
            All caught up!
          </Text>
          <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center', marginTop: 8 }}>
            No pending notes. Notes must be written within 24 hours of shift completion.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingShifts}
          keyExtractor={(item) => item.shiftId}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#66BB6A" />
          }
        />
      )}

      {selectedShift && (
        <CaseNoteModal
          visible={modalVisible}
          onDismiss={handleDismiss}
          shiftId={selectedShift.shiftId}
          participantId={selectedShift.participantId}
          participantName={selectedShift.participantName}
          workerId={userId!}
          organizationId={selectedShift.organizationId}
          durationMinutes={selectedShift.durationMinutes}
        />
      )}
    </View>
  )
}
