'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, MessageSquarePlus } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Textarea,
} from '@ephraimcare/ui'
import { useAdminComments } from '@/hooks/use-case-notes'

interface CaseNoteCardProps {
  note: any
  onReview: () => void
  onAddComment: (comment: string) => void
  isReviewing?: boolean
}

function formatNoteDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown date'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, h:mm a')
  } catch {
    return 'Invalid date'
  }
}

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return 'N/A'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function getWorkerName(note: any): string {
  const profile = note.workers?.profiles
  if (!profile) return 'Unknown worker'
  return `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Unknown worker'
}

function getDuration(note: any): number | null {
  const checkIns = note.shifts?.shift_check_ins
  if (Array.isArray(checkIns) && checkIns.length > 0) {
    return checkIns[0]?.duration_minutes ?? null
  }
  return null
}

export function CaseNoteCard({ note, onReview, onAddComment, isReviewing }: CaseNoteCardProps) {
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: comments } = useAdminComments(note.id)

  const workerName = getWorkerName(note)
  const duration = getDuration(note)
  const isReviewed = !!note.reviewed_at

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return
    setIsSubmitting(true)
    try {
      onAddComment(commentText.trim())
      setCommentText('')
      setShowCommentInput(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{workerName}</p>
            <p className="text-xs text-muted-foreground">
              {formatNoteDate(note.note_date || note.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {note.concern_flag && (
              <Badge variant="destructive">Concern</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Note content */}
        <p className="text-sm whitespace-pre-wrap">{note.content}</p>

        {/* Concern text */}
        {note.concern_text && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm font-medium text-red-800">Concern Details</p>
            <p className="text-sm text-red-700 mt-1">{note.concern_text}</p>
          </div>
        )}

        {/* Footer: Duration + Review status */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Duration: {formatDuration(duration)}
          </p>
          <div>
            {isReviewed ? (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  Reviewed {note.reviewed_at ? format(parseISO(note.reviewed_at), 'dd MMM yyyy') : ''}
                </span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onReview}
                disabled={isReviewing}
              >
                {isReviewing ? 'Reviewing...' : 'Mark as Reviewed'}
              </Button>
            )}
          </div>
        </div>

        {/* Admin comments section */}
        <div className="pt-2 border-t space-y-2">
          {comments && comments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Admin Comments</p>
              {comments.map((c: any) => (
                <div key={c.id} className="rounded bg-muted/50 p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {c.profiles?.first_name ?? 'Admin'} {c.profiles?.last_name ?? ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.created_at ? format(parseISO(c.created_at), 'dd MMM, h:mm a') : ''}
                    </span>
                  </div>
                  <p className="text-sm">{c.comment}</p>
                </div>
              ))}
            </div>
          )}

          {showCommentInput ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a private comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Comment'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCommentInput(false)
                    setCommentText('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentInput(true)}
              className="text-xs"
            >
              <MessageSquarePlus className="mr-1 h-3.5 w-3.5" />
              Add Comment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
