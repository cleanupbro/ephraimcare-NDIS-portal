import { useState } from 'react'
import { View, ScrollView } from 'react-native'
import { Text, IconButton } from 'react-native-paper'
import { startOfWeek, addWeeks, format } from 'date-fns'
import { useSession } from '../../hooks/useAuth'
import { useWeekShifts } from '../../hooks/useShifts'
import { WeeklyCalendar } from '../../components/WeeklyCalendar'

export default function ScheduleScreen() {
  const { userId } = useSession()
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const { data: shifts } = useWeekShifts(userId ?? undefined, weekStart)

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}
      >
        <IconButton
          icon="chevron-left"
          onPress={() => setWeekStart((s) => addWeeks(s, -1))}
        />
        <Text variant="titleSmall">
          {format(weekStart, 'd MMM')} – {format(addWeeks(weekStart, 1), 'd MMM yyyy')}
        </Text>
        <IconButton
          icon="chevron-right"
          onPress={() => setWeekStart((s) => addWeeks(s, 1))}
        />
      </View>

      <ScrollView style={{ flex: 1 }}>
        <WeeklyCalendar weekStart={weekStart} shifts={shifts ?? []} />
      </ScrollView>
    </View>
  )
}
