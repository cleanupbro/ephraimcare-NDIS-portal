'use client'

import { useState } from 'react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@ephraimcare/ui/components/card'
import { Badge } from '@ephraimcare/ui/components/badge'
import { Button } from '@ephraimcare/ui/components/button'
import { Progress } from '@ephraimcare/ui/components/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ephraimcare/ui/components/dropdown-menu'
import { MoreVertical, Target, CheckCircle, XCircle, Plus } from 'lucide-react'

import type { GoalWithProgress, GoalStatus, GoalCategory } from '@/hooks/use-goals'
import { GoalProgressModal } from './GoalProgressModal'

const categoryLabels: Record<GoalCategory, string> = {
  daily_living: 'Daily Living',
  community: 'Community',
  employment: 'Employment',
  relationships: 'Relationships',
  health: 'Health',
  learning: 'Learning',
  other: 'Other',
}

const statusColors: Record<GoalStatus, string> = {
  active: 'bg-blue-100 text-blue-800',
  achieved: 'bg-green-100 text-green-800',
  discontinued: 'bg-gray-100 text-gray-800',
}

interface GoalCardProps {
  goal: GoalWithProgress
  participantId: string
  onStatusChange: (goalId: string, status: GoalStatus, reason?: string) => void
  onDelete: (goalId: string) => void
  canEdit: boolean
}

export function GoalCard({ goal, participantId, onStatusChange, onDelete, canEdit }: GoalCardProps) {
  const [showProgressModal, setShowProgressModal] = useState(false)

  const progressPercent = goal.latest_rating ? (goal.latest_rating / 5) * 100 : 0

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{goal.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{categoryLabels[goal.category]}</Badge>
              <Badge className={statusColors[goal.status]}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </Badge>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {goal.status === 'active' && (
                      <>
                        <DropdownMenuItem onClick={() => onStatusChange(goal.id, 'achieved')}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          Mark Achieved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(goal.id, 'discontinued')}>
                          <XCircle className="mr-2 h-4 w-4 text-gray-600" />
                          Discontinue
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(goal.id)}
                      className="text-red-600"
                    >
                      Delete Goal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {goal.description && (
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          )}

          {goal.target_date && (
            <p className="text-sm">
              <span className="font-medium">Target:</span>{' '}
              {format(new Date(goal.target_date), 'MMM d, yyyy')}
            </p>
          )}

          {/* Progress indicator */}
          {goal.status === 'active' && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Latest Progress</span>
                <span>{goal.latest_rating ? `${goal.latest_rating}/5` : 'No ratings yet'}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Progress notes summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Progress Notes ({goal.progress_notes?.length || 0})
              </span>
              {goal.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProgressModal(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Note
                </Button>
              )}
            </div>

            {/* Recent notes */}
            {goal.progress_notes?.slice(0, 2).map((note) => (
              <div key={note.id} className="rounded-md bg-muted p-3 text-sm">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>
                    {note.worker?.profile
                      ? `${note.worker.profile.first_name} ${note.worker.profile.last_name}`
                      : 'Admin'}
                  </span>
                  <span>{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
                </div>
                <p>{note.note}</p>
                {note.progress_rating && (
                  <div className="mt-1 text-xs">
                    Rating: {note.progress_rating}/5
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <GoalProgressModal
        open={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        goalId={goal.id}
        goalTitle={goal.title}
        participantId={participantId}
      />
    </>
  )
}
