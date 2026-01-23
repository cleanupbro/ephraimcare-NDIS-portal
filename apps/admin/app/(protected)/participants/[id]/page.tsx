import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Participant, NdisPlan, PlanBudget } from '@ephraimcare/types'
import { ParticipantDetail } from '@/components/participants/participant-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ParticipantDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch participant
  const { data: participantData } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single()

  if (!participantData) {
    notFound()
  }

  const participant = participantData as unknown as Participant

  // Fetch current plan
  const { data: planData } = await supabase
    .from('ndis_plans')
    .select('*')
    .eq('participant_id', id)
    .eq('is_current', true)
    .single()

  const plan = (planData as unknown as NdisPlan) ?? null

  // Fetch budgets for the current plan
  let budgets: PlanBudget[] = []
  if (plan) {
    const { data: budgetData } = await (supabase.from('plan_budgets') as any)
      .select('*')
      .eq('plan_id', plan.id)
      .order('category')

    budgets = (budgetData as PlanBudget[]) ?? []
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href="/participants"
          className="hover:text-foreground transition-colors"
        >
          Participants
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {participant.first_name} {participant.last_name}
        </span>
      </nav>

      <ParticipantDetail
        participant={participant}
        plan={plan}
        budgets={budgets}
      />
    </div>
  )
}
