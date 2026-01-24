import { View } from 'react-native'
import { Text } from 'react-native-paper'

type Severity = 'critical' | 'caution' | 'info'

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string }> = {
  critical: { bg: '#FFEBEE', text: '#C62828' },
  caution: { bg: '#FFF8E1', text: '#F57F17' },
  info: { bg: '#E3F2FD', text: '#1565C0' },
}

interface AlertBadgeProps {
  text: string
  severity?: Severity
}

export function AlertBadge({ text, severity = 'info' }: AlertBadgeProps) {
  const colors = SEVERITY_COLORS[severity]
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 14 }}>{text}</Text>
    </View>
  )
}

export function parseAlerts(alertsText: string | null): { text: string; severity: Severity }[] {
  if (!alertsText) return []
  return alertsText
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith('[CRITICAL]'))
        return { text: line.replace('[CRITICAL]', '').trim(), severity: 'critical' as Severity }
      if (line.startsWith('[CAUTION]'))
        return { text: line.replace('[CAUTION]', '').trim(), severity: 'caution' as Severity }
      if (line.startsWith('[INFO]'))
        return { text: line.replace('[INFO]', '').trim(), severity: 'info' as Severity }
      return { text: line.trim(), severity: 'info' as Severity }
    })
}
