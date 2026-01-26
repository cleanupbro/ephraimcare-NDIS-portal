import { IncidentForm } from '@/components/incidents/incident-form'

export default function NewIncidentPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold mb-6">Report Incident</h1>
      <IncidentForm />
    </div>
  )
}
