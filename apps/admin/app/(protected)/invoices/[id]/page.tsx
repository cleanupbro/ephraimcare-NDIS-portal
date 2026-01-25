'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileDown, Lock, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Skeleton,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@ephraimcare/ui'
import { useInvoice, useFinalizeInvoice, useDeleteInvoice } from '@/hooks/use-invoices'
import { InvoicePreview } from '@/components/invoices/InvoicePreview'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const { data: invoice, isLoading, error } = useInvoice(id)
  const finalizeMutation = useFinalizeInvoice()
  const deleteMutation = useDeleteInvoice()

  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleFinalize = () => {
    finalizeMutation.mutate(id, {
      onSuccess: () => {
        setShowFinalizeDialog(false)
      },
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        router.push('/invoices')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-medium text-red-800">Invoice not found</p>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error ? error.message : 'The requested invoice could not be found.'}
          </p>
        </div>
      </div>
    )
  }

  const isDraft = invoice.status === 'draft'
  const isFinalized = invoice.status === 'submitted' || invoice.status === 'paid'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isDraft && (
            <>
              {/* Delete Draft Button */}
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Draft
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Draft Invoice?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the draft invoice and all its line items.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Finalize Button */}
              <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
                <AlertDialogTrigger asChild>
                  <Button>
                    Finalize Invoice
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Finalize Invoice?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to finalize this invoice? Once finalized, it cannot
                      be edited or deleted. The invoice will be marked as submitted and ready
                      for payment processing.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleFinalize}
                      disabled={finalizeMutation.isPending}
                    >
                      {finalizeMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Finalizing...
                        </>
                      ) : (
                        'Finalize'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {isFinalized && (
            <>
              {/* Download PDF */}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/api/invoices/${id}/pdf`} target="_blank">
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Locked State Notice */}
      {isFinalized && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Lock className="h-4 w-4" />
          <span>This invoice has been finalized and cannot be edited.</span>
        </div>
      )}

      {/* Invoice Preview */}
      <InvoicePreview invoice={invoice} />
    </div>
  )
}
