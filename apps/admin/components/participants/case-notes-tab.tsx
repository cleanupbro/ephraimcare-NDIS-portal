'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ephraimcare/ui'
import {
  useParticipantCaseNotes,
  useReviewCaseNote,
  useAddAdminComment,
  useCaseNoteWorkers,
} from '@/hooks/use-case-notes'
import { CaseNoteCard } from './case-note-card'

interface CaseNotesTabProps {
  participantId: string
  organizationId?: string
}

export function CaseNotesTab({ participantId, organizationId }: CaseNotesTabProps) {
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [workerId, setWorkerId] = useState<string>('')

  const filters = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    workerId: workerId && workerId !== 'all' ? workerId : undefined,
  }

  const { data: notes, isLoading, error } = useParticipantCaseNotes(participantId, filters)
  const { data: workers } = useCaseNoteWorkers(participantId)
  const reviewMutation = useReviewCaseNote()
  const commentMutation = useAddAdminComment()

  const hasFilters = dateFrom || dateTo || (workerId && workerId !== 'all')

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setWorkerId('')
  }

  const handleReview = (caseNoteId: string) => {
    reviewMutation.mutate(caseNoteId)
  }

  const handleAddComment = (caseNoteId: string, comment: string) => {
    commentMutation.mutate({
      caseNoteId,
      comment,
      organizationId: organizationId ?? '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Worker</label>
          <Select value={workerId} onValueChange={setWorkerId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All workers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workers</SelectItem>
              {(workers ?? []).map((w: any) => (
                <SelectItem key={w.worker_id} value={w.worker_id}>
                  {w.workers?.profiles?.first_name ?? ''}{' '}
                  {w.workers?.profiles?.last_name ?? ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Notes count */}
      {!isLoading && notes && (
        <p className="text-sm text-muted-foreground">
          {notes.length} case note{notes.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">
            Failed to load case notes. Please try again.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && notes && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No case notes found</p>
          {hasFilters && (
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your filters
            </p>
          )}
        </div>
      )}

      {/* Notes list */}
      {!isLoading && notes && notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note: any) => (
            <CaseNoteCard
              key={note.id}
              note={note}
              onReview={() => handleReview(note.id)}
              onAddComment={(comment) => handleAddComment(note.id, comment)}
              isReviewing={reviewMutation.isPending && reviewMutation.variables === note.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
