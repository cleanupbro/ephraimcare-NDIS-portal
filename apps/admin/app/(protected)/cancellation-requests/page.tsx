'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Textarea,
  Label,
} from '@ephraimcare/ui'
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  useCancellationRequests,
  useReviewCancellationRequest,
  type CancellationRequest,
} from '@/hooks/use-cancellation-requests'

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

export default function CancellationRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [userId, setUserId] = useState<string>('')
  const [reviewingRequest, setReviewingRequest] = useState<CancellationRequest | null>(null)
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved')
  const [adminNotes, setAdminNotes] = useState('')

  const { data: requests, isLoading } = useCancellationRequests(statusFilter)
  const reviewMutation = useReviewCancellationRequest()

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  function handleReview(request: CancellationRequest, action: 'approved' | 'rejected') {
    setReviewingRequest(request)
    setReviewAction(action)
    setAdminNotes('')
  }

  async function submitReview() {
    if (!reviewingRequest) return

    await reviewMutation.mutateAsync({
      id: reviewingRequest.id,
      status: reviewAction,
      admin_notes: adminNotes || undefined,
      reviewed_by: userId,
    })

    setReviewingRequest(null)
    setAdminNotes('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Cancellation Requests</h1>
          <p className="text-sm text-muted-foreground">
            Review and respond to participant cancellation requests
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading requests...</div>
      ) : !requests?.length ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {statusFilter === 'pending'
              ? 'No pending cancellation requests'
              : 'No cancellation requests found'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Participant */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">
                      {request.participants?.first_name} {request.participants?.last_name}
                    </h3>
                    <Badge className={STATUS_COLORS[request.status]}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Shift details */}
                  {request.shifts && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(parseISO(request.shifts.scheduled_start), 'EEE, d MMM yyyy')} at{' '}
                      {format(parseISO(request.shifts.scheduled_start), 'h:mm a')} -{' '}
                      {format(parseISO(request.shifts.scheduled_end), 'h:mm a')}
                      {request.shifts.workers?.profiles && (
                        <> with {request.shifts.workers.profiles.first_name} {request.shifts.workers.profiles.last_name}</>
                      )}
                    </p>
                  )}

                  {/* Reason */}
                  <div className="rounded-md bg-muted p-2 mb-2">
                    <p className="text-sm">{request.reason}</p>
                  </div>

                  {/* Meta */}
                  <p className="text-xs text-muted-foreground">
                    Requested {format(parseISO(request.created_at), 'd MMM yyyy, h:mm a')}
                  </p>

                  {/* Admin notes */}
                  {request.admin_notes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Admin note: {request.admin_notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {request.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleReview(request, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleReview(request, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <AlertDialog open={!!reviewingRequest} onOpenChange={(open) => !open && setReviewingRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction === 'approved' ? 'Approve' : 'Reject'} Cancellation Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewAction === 'approved'
                ? 'Approving will cancel the scheduled shift. The participant will be notified.'
                : 'Rejecting will keep the shift scheduled. The participant will be notified.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
            <Textarea
              id="admin-notes"
              placeholder="Add a note for the participant..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitReview}
              disabled={reviewMutation.isPending}
              className={
                reviewAction === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {reviewMutation.isPending
                ? 'Processing...'
                : reviewAction === 'approved'
                  ? 'Approve & Cancel Shift'
                  : 'Reject Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
