'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type GoalCategory = 'daily_living' | 'community' | 'employment' | 'relationships' | 'health' | 'learning' | 'other'
export type GoalStatus = 'active' | 'achieved' | 'discontinued'

export interface Goal {
  id: string
  participant_id: string
  organization_id: string
  title: string
  description: string | null
  target_date: string | null
  status: GoalStatus
  category: GoalCategory
  created_at: string
  updated_at: string
  created_by: string | null
  achieved_at: string | null
  discontinued_at: string | null
  discontinued_reason: string | null
}

export interface GoalWithProgress extends Goal {
  progress_notes: ProgressNote[]
  latest_rating: number | null
}

export interface ProgressNote {
  id: string
  goal_id: string
  shift_id: string | null
  worker_id: string | null
  note: string
  progress_rating: number | null
  created_at: string
  worker?: {
    profile: {
      first_name: string
      last_name: string
    }
  }
}

/**
 * Fetch goals for a participant
 */
export function useParticipantGoals(participantId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['goals', participantId],
    queryFn: async (): Promise<GoalWithProgress[]> => {
      const { data, error } = await (supabase
        .from('participant_goals') as any)
        .select(`
          *,
          progress_notes:goal_progress_notes(
            id,
            goal_id,
            shift_id,
            worker_id,
            note,
            progress_rating,
            created_at,
            worker:workers(
              profile:profiles(first_name, last_name)
            )
          )
        `)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate latest rating for each goal
      return (data || []).map((goal: any) => ({
        ...goal,
        latest_rating: goal.progress_notes?.length > 0
          ? goal.progress_notes
              .filter((n: any) => n.progress_rating)
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.progress_rating || null
          : null,
      }))
    },
    enabled: !!participantId,
  })
}

export interface CreateGoalInput {
  participantId: string
  title: string
  description?: string
  targetDate?: string
  category: GoalCategory
}

/**
 * Create a new goal for a participant
 */
export function useCreateGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) throw new Error('No organization')

      const { data, error } = await (supabase
        .from('participant_goals') as any)
        .insert({
          participant_id: input.participantId,
          organization_id: profile.organization_id,
          title: input.title,
          description: input.description || null,
          target_date: input.targetDate || null,
          category: input.category,
          status: 'active',
          created_by: user.id,
        } as any)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals', variables.participantId] })
    },
  })
}

export interface AddProgressNoteInput {
  goalId: string
  participantId: string // For cache invalidation
  shiftId?: string
  workerId?: string
  note: string
  progressRating: number
}

/**
 * Add a progress note to a goal
 */
export function useAddProgressNote() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddProgressNoteInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) throw new Error('No organization')

      const { data, error } = await (supabase
        .from('goal_progress_notes') as any)
        .insert({
          goal_id: input.goalId,
          organization_id: profile.organization_id,
          shift_id: input.shiftId || null,
          worker_id: input.workerId || null,
          note: input.note,
          progress_rating: input.progressRating,
          created_by: user.id,
        } as any)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals', variables.participantId] })
    },
  })
}

export interface UpdateGoalStatusInput {
  goalId: string
  participantId: string
  status: GoalStatus
  reason?: string // For discontinued
}

/**
 * Update goal status (achieved/discontinued)
 */
export function useUpdateGoalStatus() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateGoalStatusInput) => {
      const updateData: Record<string, any> = {
        status: input.status,
      }

      if (input.status === 'achieved') {
        updateData.achieved_at = new Date().toISOString()
      } else if (input.status === 'discontinued') {
        updateData.discontinued_at = new Date().toISOString()
        updateData.discontinued_reason = input.reason || null
      }

      const { error } = await (supabase
        .from('participant_goals') as any)
        .update(updateData)
        .eq('id', input.goalId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals', variables.participantId] })
    },
  })
}

/**
 * Delete a goal (admin only)
 */
export function useDeleteGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ goalId, participantId }: { goalId: string; participantId: string }) => {
      const { error } = await (supabase
        .from('participant_goals') as any)
        .delete()
        .eq('id', goalId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals', variables.participantId] })
    },
  })
}
