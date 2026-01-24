import { View, Dimensions, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { format, addDays, isSameDay, parseISO } from 'date-fns'
import { useRouter } from 'expo-router'
import type { ShiftWithParticipant } from '../hooks/useShifts'

interface WeeklyCalendarProps {
  weekStart: Date
  shifts: ShiftWithParticipant[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFA726',
  proposed: '#FFA726',
  confirmed: '#66BB6A',
  in_progress: '#42A5F5',
  completed: '#BDBDBD',
}

const HOUR_HEIGHT = 40
const START_HOUR = 6
const END_HOUR = 22
const TOTAL_HOURS = END_HOUR - START_HOUR

export function WeeklyCalendar({ weekStart, shifts }: WeeklyCalendarProps) {
  const router = useRouter()
  const screenWidth = Dimensions.get('window').width
  const columnWidth = (screenWidth - 40) / 7
  const today = new Date()

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function getShiftPosition(shift: ShiftWithParticipant) {
    const start = parseISO(shift.scheduled_start)
    const end = parseISO(shift.scheduled_end)
    const startHour = start.getHours() + start.getMinutes() / 60
    const endHour = end.getHours() + end.getMinutes() / 60
    const top = (Math.max(startHour, START_HOUR) - START_HOUR) * HOUR_HEIGHT
    const height = (Math.min(endHour, END_HOUR) - Math.max(startHour, START_HOUR)) * HOUR_HEIGHT
    return { top, height: Math.max(height, 20) }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', paddingLeft: 40 }}>
        {days.map((day, i) => (
          <View
            key={i}
            style={{
              width: columnWidth,
              alignItems: 'center',
              paddingVertical: 8,
              backgroundColor: isSameDay(day, today) ? '#E8F5E9' : 'transparent',
              borderRadius: 4,
            }}
          >
            <Text variant="labelSmall" style={{ color: '#999' }}>
              {format(day, 'EEE')}
            </Text>
            <Text
              variant="labelMedium"
              style={{
                fontWeight: isSameDay(day, today) ? '700' : '400',
                color: isSameDay(day, today) ? '#66BB6A' : '#333',
              }}
            >
              {format(day, 'd')}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: 40 }}>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <View key={i} style={{ height: HOUR_HEIGHT, justifyContent: 'flex-start' }}>
              <Text variant="labelSmall" style={{ color: '#999', fontSize: 10 }}>
                {format(new Date(2000, 0, 1, START_HOUR + i), 'ha')}
              </Text>
            </View>
          ))}
        </View>

        {days.map((day, dayIndex) => {
          const dayShifts = shifts.filter((s) =>
            isSameDay(parseISO(s.scheduled_start), day)
          )
          return (
            <View
              key={dayIndex}
              style={{
                width: columnWidth,
                height: TOTAL_HOURS * HOUR_HEIGHT,
                borderLeftWidth: 0.5,
                borderLeftColor: '#E0E0E0',
                position: 'relative',
              }}
            >
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    top: i * HOUR_HEIGHT,
                    left: 0,
                    right: 0,
                    borderTopWidth: 0.5,
                    borderTopColor: '#F0F0F0',
                  }}
                />
              ))}
              {dayShifts.map((shift) => {
                const pos = getShiftPosition(shift)
                const color = STATUS_COLORS[shift.status] ?? '#BDBDBD'
                return (
                  <TouchableOpacity
                    key={shift.id}
                    onPress={() => router.push(`/shift/${shift.id}`)}
                    style={{
                      position: 'absolute',
                      top: pos.top,
                      height: pos.height,
                      left: 2,
                      right: 2,
                      backgroundColor: color + '30',
                      borderLeftWidth: 3,
                      borderLeftColor: color,
                      borderRadius: 4,
                      padding: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <Text style={{ fontSize: 9, color: '#333', fontWeight: '500' }} numberOfLines={1}>
                      {shift.participants?.first_name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )
        })}
      </View>
    </View>
  )
}
