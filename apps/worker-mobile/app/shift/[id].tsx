import { View, ScrollView } from 'react-native'
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { useShiftDetail } from '../../hooks/useShifts'
import { useCheckIn } from '../../hooks/useCheckIn'
import { useCheckOut } from '../../hooks/useCheckOut'
import { AlertBadge, parseAlerts } from '../../components/AlertBadge'
import { CaseNoteModal } from '../../components/CaseNoteModal'
import { useState } from 'react'

export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: shift, isLoading } = useShiftDetail(id ?? undefined)
  const { checkIn, loading: checkingIn } = useCheckIn()
  const { checkOut, loading: checkingOut } = useCheckOut()
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [checkoutDuration, setCheckoutDuration] = useState<number | undefined>()

  if (isLoading || !shift) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    )
  }

  const participant = shift.participants
  const checkInRecord = shift.shift_check_ins?.[0]
  const hasCheckedIn = !!checkInRecord?.check_in_time
  const hasCheckedOut = !!checkInRecord?.check_out_time
  const isActive = hasCheckedIn && !hasCheckedOut
  const alerts = parseAlerts(participant?.notes ?? null)

  const handleCheckIn = async () => {
    setCheckInError(null)
    const result = await checkIn(
      shift.id,
      participant?.latitude ?? null,
      participant?.longitude ?? null,
      `${participant?.first_name ?? ''} ${participant?.last_name ?? ''}`
    )
    if (!result.success) {
      setCheckInError(result.error ?? 'Check-in failed')
    }
  }

  const canCheckIn = !hasCheckedIn && shift.status !== 'completed' && shift.status !== 'cancelled'
  const canCheckOut = isActive

  const address = [participant?.address_line_1, participant?.suburb].filter(Boolean).join(', ')

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <View style={{ backgroundColor: '#fff', padding: 16, marginBottom: 8 }}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
          {participant?.first_name} {participant?.last_name}
        </Text>
        <Text variant="bodyMedium" style={{ color: '#666', marginTop: 4 }}>
          {format(parseISO(shift.scheduled_start), 'h:mm a')} –{' '}
          {format(parseISO(shift.scheduled_end), 'h:mm a')}
        </Text>
        {shift.support_type && (
          <Text variant="bodySmall" style={{ color: '#999', marginTop: 2 }}>
            {shift.support_type} | {format(parseISO(shift.scheduled_start), 'EEEE, d MMM yyyy')}
          </Text>
        )}
      </View>

      {alerts.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text variant="labelLarge" style={{ marginBottom: 8, color: '#333' }}>
            Medical Alerts
          </Text>
          {alerts.map((alert, i) => (
            <AlertBadge key={i} text={alert.text} severity={alert.severity} />
          ))}
        </View>
      )}

      {address ? (
        <Card style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <Card.Content>
            <Text variant="labelLarge" style={{ marginBottom: 4 }}>
              Address
            </Text>
            <Text variant="bodyMedium" style={{ color: '#555' }}>
              {address}
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      {shift.notes && (
        <Card style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <Card.Content>
            <Text variant="labelLarge" style={{ marginBottom: 4 }}>
              Shift Notes
            </Text>
            <Text variant="bodyMedium" style={{ color: '#555' }}>
              {shift.notes}
            </Text>
          </Card.Content>
        </Card>
      )}

      {hasCheckedIn && checkInRecord && (
        <Card style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <Card.Content>
            <Text variant="labelLarge" style={{ marginBottom: 4 }}>
              Check-in Record
            </Text>
            <Text variant="bodySmall" style={{ color: '#555' }}>
              Checked in: {format(new Date(checkInRecord.check_in_time), 'h:mm a')}
            </Text>
            {hasCheckedOut && (
              <>
                <Text variant="bodySmall" style={{ color: '#555' }}>
                  Checked out: {format(new Date(checkInRecord.check_out_time!), 'h:mm a')}
                  {checkInRecord.check_out_type === 'auto' && ' (auto)'}
                  {checkInRecord.check_out_type === 'admin_override' && ' (override)'}
                </Text>
                {checkInRecord.duration_minutes != null && (
                  <Text variant="bodySmall" style={{ color: '#555' }}>
                    Duration: {checkInRecord.duration_minutes} minutes
                  </Text>
                )}
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {checkInError && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 8,
            padding: 12,
            backgroundColor: '#FFEBEE',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#C62828' }}>{checkInError}</Text>
        </View>
      )}

      <View style={{ padding: 16 }}>
        {canCheckIn && (
          <Button
            mode="contained"
            onPress={handleCheckIn}
            loading={checkingIn}
            disabled={checkingIn}
            buttonColor="#66BB6A"
            style={{ borderRadius: 8, paddingVertical: 4 }}
          >
            Check In
          </Button>
        )}
        {canCheckOut && (
          <Button
            mode="contained"
            onPress={async () => {
              const result = await checkOut()
              if (result.success) {
                setCheckoutDuration(result.durationMinutes)
                setShowNoteModal(true)
              }
            }}
            loading={checkingOut}
            disabled={checkingOut}
            buttonColor="#42A5F5"
            style={{ borderRadius: 8, paddingVertical: 4 }}
          >
            Check Out
          </Button>
        )}
        {hasCheckedOut && (
          <View style={{ alignItems: 'center', padding: 8 }}>
            <Text variant="bodyMedium" style={{ color: '#66BB6A' }}>
              Shift completed
            </Text>
          </View>
        )}
      </View>

      <CaseNoteModal
        visible={showNoteModal}
        shiftId={shift.id}
        participantId={shift.participant_id}
        participantName={`${participant?.first_name ?? ''} ${participant?.last_name ?? ''}`}
        workerId={shift.worker_id}
        organizationId={shift.organization_id}
        durationMinutes={checkoutDuration}
        onDismiss={() => {
          setShowNoteModal(false)
          router.back()
        }}
      />
    </ScrollView>
  )
}
