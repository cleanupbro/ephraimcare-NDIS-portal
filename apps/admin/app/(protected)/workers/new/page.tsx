import type { Metadata } from 'next'
import { WorkerForm } from '@/components/workers/worker-form'

export const metadata: Metadata = {
  title: 'Add Worker | Ephraim Care',
}

export default function NewWorkerPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li>
            <a href="/workers" className="hover:text-foreground transition-colors">
              Workers
            </a>
          </li>
          <li className="text-muted-foreground/50">/</li>
          <li className="text-foreground font-medium">New</li>
        </ol>
      </nav>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Worker</h1>
        <p className="text-muted-foreground mt-1">
          Create a new worker profile and send them an invitation email to set up their account.
        </p>
      </div>

      {/* Worker creation form */}
      <WorkerForm />
    </div>
  )
}
