'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from 'date-fns'

import { Button } from '@ephraimcare/ui/components/button'
import { Input } from '@ephraimcare/ui/components/input'
import { Label } from '@ephraimcare/ui/components/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ephraimcare/ui/components/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ephraimcare/ui/components/select'

import { createClient } from '@/lib/supabase/client'
import { generateInvoiceSchema, type GenerateInvoiceInput } from '@/lib/invoices/schemas'
import { useGenerateInvoice } from '@/hooks/use-invoices'

interface Participant {
  id: string
  first_name: string
  last_name: string
  ndis_number: string
}

export default function GenerateInvoicePage() {
  const router = useRouter()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(true)

  const { mutateAsync: generateInvoice, isPending } = useGenerateInvoice()

  // Default to previous month
  const previousMonth = subMonths(new Date(), 1)
  const defaultPeriodStart = format(startOfMonth(previousMonth), 'yyyy-MM-dd')
  const defaultPeriodEnd = format(endOfMonth(previousMonth), 'yyyy-MM-dd')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GenerateInvoiceInput>({
    resolver: zodResolver(generateInvoiceSchema),
    defaultValues: {
      participant_id: '',
      period_start: defaultPeriodStart,
      period_end: defaultPeriodEnd,
    },
  })

  const participantId = watch('participant_id')

  // Fetch active participants
  useEffect(() => {
    async function fetchParticipants() {
      const supabase = createClient()
      const { data, error } = await (supabase
        .from('participants')
        .select('id, first_name, last_name, ndis_number')
        .eq('is_active', true)
        .order('first_name') as any)

      if (!error && data) {
        setParticipants(data as Participant[])
      }
      setLoadingParticipants(false)
    }

    fetchParticipants()
  }, [])

  const onSubmit = async (data: GenerateInvoiceInput) => {
    try {
      const result = await generateInvoice(data)
      // Redirect to the invoice detail page
      router.push(`/invoices/${result.invoice.id}`)
    } catch {
      // Error is handled by the mutation hook (toast)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">Generate Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Create an invoice from completed shifts
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Details
          </CardTitle>
          <CardDescription>
            Select a participant and date range to generate an invoice from their
            completed shifts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Participant Selector */}
            <div className="space-y-2">
              <Label htmlFor="participant_id">Participant</Label>
              {loadingParticipants ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading participants...
                </div>
              ) : (
                <Select
                  value={participantId}
                  onValueChange={(value) => setValue('participant_id', value)}
                >
                  <SelectTrigger id="participant_id">
                    <SelectValue placeholder="Select a participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} ({p.ndis_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.participant_id && (
                <p className="text-sm text-destructive">
                  {errors.participant_id.message}
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_start">Period Start</Label>
                <Input
                  id="period_start"
                  type="date"
                  {...register('period_start')}
                />
                {errors.period_start && (
                  <p className="text-sm text-destructive">
                    {errors.period_start.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="period_end">Period End</Label>
                <Input
                  id="period_end"
                  type="date"
                  {...register('period_end')}
                />
                {errors.period_end && (
                  <p className="text-sm text-destructive">
                    {errors.period_end.message}
                  </p>
                )}
              </div>
            </div>

            {/* Info Text */}
            <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              <p>
                The invoice will be generated from all <strong>completed shifts</strong> for
                this participant within the selected date range. Billing uses the{' '}
                <strong>lesser of scheduled vs actual duration</strong>.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Link href="/invoices">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isPending || loadingParticipants}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
