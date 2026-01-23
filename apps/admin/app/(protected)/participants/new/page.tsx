import { Card, CardContent, CardHeader, CardTitle } from '@ephraimcare/ui'
import { ParticipantForm } from '@/components/participants/participant-form'

export default function NewParticipantPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li>
            <a href="/participants" className="hover:text-foreground transition-colors">
              Participants
            </a>
          </li>
          <li className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium">New</li>
        </ol>
      </nav>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Participant</h1>
        <p className="text-muted-foreground mt-1">
          Register a new NDIS participant with their plan details and contact information.
        </p>
      </div>

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Participant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipantForm />
        </CardContent>
      </Card>
    </div>
  )
}
