'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'

import { Button } from '@ephraimcare/ui/components/button'
import { Input } from '@ephraimcare/ui/components/input'
import { Textarea } from '@ephraimcare/ui/components/textarea'
import { Label } from '@ephraimcare/ui/components/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@ephraimcare/ui/components/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ephraimcare/ui/components/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ephraimcare/ui/components/tabs'
import { Loader2, Plus, Target } from 'lucide-react'

import {
  useParticipantGoals,
  useCreateGoal,
  useUpdateGoalStatus,
  useDeleteGoal,
  type GoalCategory,
  type GoalStatus,
} from '@/hooks/use-goals'
import { useParticipant } from '@/hooks/use-participants'
import { createClient } from '@/lib/supabase/client'
import { GoalCard } from '@/components/goals/GoalCard'
import { toast } from '@/lib/toast'

const categories: { value: GoalCategory; label: string }[] = [
  { value: 'daily_living', label: 'Daily Living' },
  { value: 'community', label: 'Community Participation' },
  { value: 'employment', label: 'Employment' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'health', label: 'Health & Wellbeing' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' },
]

export default function ParticipantGoalsPage() {
  const params = useParams()
  const participantId = params.id as string

  const { data: participant, isLoading: participantLoading } = useParticipant(participantId)
  const { data: goals, isLoading: goalsLoading } = useParticipantGoals(participantId)

  const createGoal = useCreateGoal()
  const updateStatus = useUpdateGoalStatus()
  const deleteGoal = useDeleteGoal()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>('daily_living')
  const [canEdit, setCanEdit] = useState(false)

  // Fetch profile to check role
  useEffect(() => {
    async function checkRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin' || profile?.role === 'coordinator') {
        setCanEdit(true)
      }
    }
    checkRole()
  }, [])

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      targetDate: '',
    },
  })

  const handleCreateGoal = async (data: { title: string; description: string; targetDate: string }) => {
    try {
      await createGoal.mutateAsync({
        participantId,
        title: data.title,
        description: data.description || undefined,
        targetDate: data.targetDate || undefined,
        category: selectedCategory,
      })
      toast({ title: 'Goal created', variant: 'success' })
      form.reset()
      setShowCreateDialog(false)
    } catch (error) {
      toast({ title: 'Failed to create goal', variant: 'error' })
    }
  }

  const handleStatusChange = async (goalId: string, status: GoalStatus, reason?: string) => {
    try {
      await updateStatus.mutateAsync({
        goalId,
        participantId,
        status,
        reason,
      })
      toast({ title: `Goal marked as ${status}`, variant: 'success' })
    } catch (error) {
      toast({ title: 'Failed to update goal', variant: 'error' })
    }
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      await deleteGoal.mutateAsync({ goalId, participantId })
      toast({ title: 'Goal deleted', variant: 'success' })
    } catch (error) {
      toast({ title: 'Failed to delete goal', variant: 'error' })
    }
  }

  if (participantLoading || goalsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const activeGoals = goals?.filter((g) => g.status === 'active') || []
  const achievedGoals = goals?.filter((g) => g.status === 'achieved') || []
  const discontinuedGoals = goals?.filter((g) => g.status === 'discontinued') || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Goals for {participant?.first_name} {participant?.last_name}
          </h1>
          <p className="text-muted-foreground">
            Track care goals and monitor progress
          </p>
        </div>
        {canEdit && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleCreateGoal)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Improve morning routine independence"
                    {...form.register('title', { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(v) => setSelectedCategory(v as GoalCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the goal..."
                    {...form.register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date (optional)</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    {...form.register('targetDate')}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createGoal.isPending}>
                    {createGoal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Goal
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="achieved">
            Achieved ({achievedGoals.length})
          </TabsTrigger>
          <TabsTrigger value="discontinued">
            Discontinued ({discontinuedGoals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active goals</p>
              {canEdit && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create First Goal
                </Button>
              )}
            </div>
          ) : (
            activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                participantId={participantId}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                canEdit={canEdit}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="achieved" className="space-y-4 mt-4">
          {achievedGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No achieved goals yet</p>
            </div>
          ) : (
            achievedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                participantId={participantId}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                canEdit={canEdit}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="discontinued" className="space-y-4 mt-4">
          {discontinuedGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No discontinued goals</p>
            </div>
          ) : (
            discontinuedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                participantId={participantId}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                canEdit={canEdit}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
