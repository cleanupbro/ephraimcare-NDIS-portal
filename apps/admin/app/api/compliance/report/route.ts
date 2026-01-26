import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, addDays, isAfter, isBefore, format } from 'date-fns'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const thirtyDaysFromNow = addDays(now, 30)

    // Fetch all data
    const [workersRes, incidentsRes, participantsRes, plansRes, organizationRes] = await Promise.all([
      supabase
        .from('workers')
        .select('id, ndis_check_expiry, wwcc_expiry, first_aid_expiry, profiles(first_name, last_name)')
        .eq('is_active', true),
      (supabase.from('incidents') as any)
        .select('id, title, status, severity, requires_ndia_report, ndia_reported_at, created_at')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString()),
      supabase
        .from('participants')
        .select('id, first_name, last_name')
        .eq('is_active', true),
      supabase
        .from('ndis_plans')
        .select('participant_id')
        .eq('is_current', true),
      (supabase
        .from('organizations') as any)
        .select('name')
        .single(),
    ])

    const workers = workersRes.data || []
    const incidents = incidentsRes.data || []
    const participants = participantsRes.data || []
    const plans = plansRes.data || []
    const organization = organizationRes.data

    // Calculate metrics
    let validWorkers = 0
    let expiringWorkers = 0
    let expiredWorkers = 0
    const workerIssues: string[] = []

    workers.forEach((worker: any) => {
      const name = worker.profiles
        ? `${worker.profiles.first_name} ${worker.profiles.last_name}`
        : 'Unknown Worker'

      const checkDates = [
        { date: worker.ndis_check_expiry, name: 'NDIS Check' },
        { date: worker.wwcc_expiry, name: 'WWCC' },
        { date: worker.first_aid_expiry, name: 'First Aid' },
      ].filter(c => c.date)

      if (checkDates.length === 0) {
        expiredWorkers++
        workerIssues.push(`${name}: Missing compliance checks`)
        return
      }

      const expiredChecks = checkDates.filter(c => isBefore(new Date(c.date), now))
      const expiringChecks = checkDates.filter(
        c => isAfter(new Date(c.date), now) && isBefore(new Date(c.date), thirtyDaysFromNow)
      )

      if (expiredChecks.length > 0) {
        expiredWorkers++
        workerIssues.push(`${name}: Expired - ${expiredChecks.map(c => c.name).join(', ')}`)
      } else if (expiringChecks.length > 0) {
        expiringWorkers++
        workerIssues.push(`${name}: Expiring soon - ${expiringChecks.map(c => c.name).join(', ')}`)
      } else {
        validWorkers++
      }
    })

    const workerRate = workers.length > 0 ? Math.round((validWorkers / workers.length) * 100) : 100

    // Incidents
    const openIncidents = incidents.filter((i: any) => i.status === 'open')
    const pendingNdia = incidents.filter((i: any) => i.requires_ndia_report && !i.ndia_reported_at)
    const closedIncidents = incidents.filter((i: any) => i.status === 'closed').length
    const incidentRate = incidents.length > 0 ? Math.round((closedIncidents / incidents.length) * 100) : 100

    // Documentation
    const plansParticipantIds = new Set(plans.map((p: any) => p.participant_id))
    const withActivePlan = participants.filter((p: any) => plansParticipantIds.has(p.id)).length
    const missingPlanParticipants = participants.filter((p: any) => !plansParticipantIds.has(p.id))
    const docRate = participants.length > 0 ? Math.round((withActivePlan / participants.length) * 100) : 100

    // Overall score
    const overallScore = Math.round(workerRate * 0.4 + incidentRate * 0.3 + docRate * 0.3)

    // Generate HTML report (simpler than @react-pdf/renderer for server-side)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Compliance Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
    h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .score { font-size: 48px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .score.green { background: #dcfce7; color: #166534; }
    .score.amber { background: #fef3c7; color: #92400e; }
    .score.red { background: #fee2e2; color: #991b1b; }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .metric-label { color: #6b7280; }
    .metric-value { font-weight: 600; }
    .issue { padding: 8px 12px; background: #fef3c7; border-radius: 4px; margin: 4px 0; font-size: 14px; }
    .issue.critical { background: #fee2e2; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${organization?.name || 'Organization'} - Compliance Report</h1>
  <p>Generated: ${format(now, 'd MMMM yyyy, h:mm a')}</p>
  <p>Reporting Period: ${format(monthStart, 'd MMM')} - ${format(monthEnd, 'd MMM yyyy')}</p>

  <h2>Overall Compliance Score</h2>
  <div class="score ${overallScore >= 80 ? 'green' : overallScore >= 60 ? 'amber' : 'red'}">
    ${overallScore}%
  </div>

  <h2>Worker Compliance (40% weight)</h2>
  <div class="metric">
    <span class="metric-label">Compliance Rate</span>
    <span class="metric-value">${workerRate}%</span>
  </div>
  <div class="metric">
    <span class="metric-label">Valid Workers</span>
    <span class="metric-value">${validWorkers} of ${workers.length}</span>
  </div>
  <div class="metric">
    <span class="metric-label">Expiring (30 days)</span>
    <span class="metric-value">${expiringWorkers}</span>
  </div>
  <div class="metric">
    <span class="metric-label">Expired</span>
    <span class="metric-value">${expiredWorkers}</span>
  </div>
  ${workerIssues.length > 0 ? `
    <h3>Worker Issues</h3>
    ${workerIssues.map(i => `<div class="issue ${i.includes('Expired') ? 'critical' : ''}">${i}</div>`).join('')}
  ` : ''}

  <h2>Incident Resolution (30% weight)</h2>
  <div class="metric">
    <span class="metric-label">Resolution Rate</span>
    <span class="metric-value">${incidentRate}%</span>
  </div>
  <div class="metric">
    <span class="metric-label">Total Incidents (This Month)</span>
    <span class="metric-value">${incidents.length}</span>
  </div>
  <div class="metric">
    <span class="metric-label">Closed</span>
    <span class="metric-value">${closedIncidents}</span>
  </div>
  <div class="metric">
    <span class="metric-label">Open</span>
    <span class="metric-value">${openIncidents.length}</span>
  </div>
  ${pendingNdia.length > 0 ? `
    <h3>Pending NDIA Reports</h3>
    ${pendingNdia.map((i: any) => `<div class="issue critical">${i.title} - ${i.severity} severity</div>`).join('')}
  ` : ''}

  <h2>Documentation (30% weight)</h2>
  <div class="metric">
    <span class="metric-label">Documentation Rate</span>
    <span class="metric-value">${docRate}%</span>
  </div>
  <div class="metric">
    <span class="metric-label">Participants with Active Plans</span>
    <span class="metric-value">${withActivePlan} of ${participants.length}</span>
  </div>
  ${missingPlanParticipants.length > 0 ? `
    <h3>Participants Missing Active Plans</h3>
    <table>
      <tr><th>Name</th></tr>
      ${missingPlanParticipants.slice(0, 10).map((p: any) => `<tr><td>${p.first_name} ${p.last_name}</td></tr>`).join('')}
      ${missingPlanParticipants.length > 10 ? `<tr><td>... and ${missingPlanParticipants.length - 10} more</td></tr>` : ''}
    </table>
  ` : ''}

  <div class="footer">
    <p>This report was automatically generated by Ephraim Care Admin Portal.</p>
    <p>For questions about this report, contact your system administrator.</p>
  </div>
</body>
</html>
`

    // Return HTML as PDF-printable document
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="compliance-report-${format(now, 'yyyy-MM-dd')}.html"`,
      },
    })
  } catch (error) {
    console.error('Compliance report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
