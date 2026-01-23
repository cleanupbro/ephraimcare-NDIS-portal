import { createClient } from '@/lib/supabase/server'

export default async function CaseNotesPage() {
  const supabase = await createClient()

  const { data: notes } = await supabase
    .from('case_notes')
    .select('*, participants(first_name, last_name), workers(profiles(first_name, last_name))')
    .order('note_date', { ascending: false }) as { data: Array<{
      id: string
      note_date: string
      content: string
      goals_addressed: string[]
      is_draft: boolean
      follow_up_required: boolean
      participants: { first_name: string; last_name: string } | null
      workers: { profiles: { first_name: string; last_name: string } | null } | null
    }> | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Case Notes</h1>
          <p className="text-sm text-muted-foreground">
            {notes?.length ?? 0} case notes
          </p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + New Note
        </button>
      </div>

      {(!notes || notes.length === 0) ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground">No case notes yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Workers create case notes after completing shifts
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-border p-4 hover:bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {note.participants?.first_name} {note.participants?.last_name}
                    </span>
                    {note.is_draft && (
                      <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800">
                        Draft
                      </span>
                    )}
                    {note.follow_up_required && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">
                        Follow-up
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {note.workers?.profiles?.first_name} {note.workers?.profiles?.last_name}
                    {' · '}
                    {new Date(note.note_date).toLocaleDateString('en-AU')}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-foreground/80 line-clamp-2">
                {note.content}
              </p>
              {note.goals_addressed?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {note.goals_addressed.map((goal) => (
                    <span key={goal} className="rounded bg-accent px-1.5 py-0.5 text-xs">
                      {goal}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
