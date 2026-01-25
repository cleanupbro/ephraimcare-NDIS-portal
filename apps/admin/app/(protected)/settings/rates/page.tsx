'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil } from 'lucide-react'

import {
  Button,
  Input,
  Label,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@ephraimcare/ui'

import { useRates, useCreateRate, useUpdateRate, type SupportTypeRate } from '@/hooks/use-rates'
import { supportTypeRateSchema, type SupportTypeRateInput } from '@/lib/invoices/schemas'
import { SUPPORT_TYPES } from '@/lib/workers/constants'

// ─── Format Currency ────────────────────────────────────────────────────────────

function formatRate(rate: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(rate) + '/hr'
}

// ─── Today's Date ───────────────────────────────────────────────────────────────

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Rate Form ──────────────────────────────────────────────────────────────────

interface RateFormProps {
  defaultValues?: Partial<SupportTypeRateInput>
  onSubmit: (data: SupportTypeRateInput) => void
  isLoading: boolean
  submitLabel: string
}

function RateForm({ defaultValues, onSubmit, isLoading, submitLabel }: RateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupportTypeRateInput>({
    resolver: zodResolver(supportTypeRateSchema),
    defaultValues: {
      support_type: defaultValues?.support_type ?? '',
      ndis_item_number: defaultValues?.ndis_item_number ?? '',
      weekday_rate: defaultValues?.weekday_rate ?? 0,
      saturday_rate: defaultValues?.saturday_rate ?? 0,
      sunday_rate: defaultValues?.sunday_rate ?? 0,
      public_holiday_rate: defaultValues?.public_holiday_rate ?? 0,
      effective_from: defaultValues?.effective_from ?? getTodayISO(),
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Support Type */}
      <div className="space-y-2">
        <Label htmlFor="support_type">Support Type *</Label>
        <Input
          id="support_type"
          list="support-type-suggestions"
          placeholder="e.g., Personal Care"
          {...register('support_type')}
        />
        <datalist id="support-type-suggestions">
          {SUPPORT_TYPES.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>
        {errors.support_type && (
          <p className="text-sm text-destructive">{errors.support_type.message}</p>
        )}
      </div>

      {/* NDIS Item Number */}
      <div className="space-y-2">
        <Label htmlFor="ndis_item_number">NDIS Item Number (optional)</Label>
        <Input
          id="ndis_item_number"
          placeholder="e.g., 01_011_0107_1_1"
          {...register('ndis_item_number')}
        />
      </div>

      {/* Rate Tiers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weekday_rate">Weekday Rate ($/hr) *</Label>
          <Input
            id="weekday_rate"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register('weekday_rate')}
          />
          {errors.weekday_rate && (
            <p className="text-sm text-destructive">{errors.weekday_rate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="saturday_rate">Saturday Rate ($/hr) *</Label>
          <Input
            id="saturday_rate"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register('saturday_rate')}
          />
          {errors.saturday_rate && (
            <p className="text-sm text-destructive">{errors.saturday_rate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sunday_rate">Sunday Rate ($/hr) *</Label>
          <Input
            id="sunday_rate"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register('sunday_rate')}
          />
          {errors.sunday_rate && (
            <p className="text-sm text-destructive">{errors.sunday_rate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="public_holiday_rate">Public Holiday Rate ($/hr) *</Label>
          <Input
            id="public_holiday_rate"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register('public_holiday_rate')}
          />
          {errors.public_holiday_rate && (
            <p className="text-sm text-destructive">{errors.public_holiday_rate.message}</p>
          )}
        </div>
      </div>

      {/* Effective From */}
      <div className="space-y-2">
        <Label htmlFor="effective_from">Effective From *</Label>
        <Input
          id="effective_from"
          type="date"
          {...register('effective_from')}
        />
        {errors.effective_from && (
          <p className="text-sm text-destructive">{errors.effective_from.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function RatesSettingsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<SupportTypeRate | null>(null)

  const { data: rates, isLoading } = useRates()
  const createRate = useCreateRate()
  const updateRate = useUpdateRate()

  const handleCreate = (data: SupportTypeRateInput) => {
    createRate.mutate(data, {
      onSuccess: () => setIsAddOpen(false),
    })
  }

  const handleUpdate = (data: SupportTypeRateInput) => {
    if (!editingRate) return
    updateRate.mutate(
      { ...data, id: editingRate.id },
      { onSuccess: () => setEditingRate(null) }
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Support Type Rates</h1>
          <p className="text-sm text-muted-foreground">
            Configure hourly rates for each support type
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rate
        </Button>
      </div>

      {/* Rates Table */}
      {isLoading ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          Loading rates...
        </div>
      ) : rates && rates.length > 0 ? (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Support Type</TableHead>
                <TableHead>NDIS Item #</TableHead>
                <TableHead className="text-right">Weekday</TableHead>
                <TableHead className="text-right">Saturday</TableHead>
                <TableHead className="text-right">Sunday</TableHead>
                <TableHead className="text-right">Public Holiday</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.support_type}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {rate.ndis_item_number || '-'}
                  </TableCell>
                  <TableCell className="text-right">{formatRate(rate.weekday_rate)}</TableCell>
                  <TableCell className="text-right">{formatRate(rate.saturday_rate)}</TableCell>
                  <TableCell className="text-right">{formatRate(rate.sunday_rate)}</TableCell>
                  <TableCell className="text-right">{formatRate(rate.public_holiday_rate)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingRate(rate)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground mb-4">No rates configured yet.</p>
          <p className="text-sm text-muted-foreground">
            Add support type rates to enable invoice generation with correct pricing.
          </p>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Support Type Rate</DialogTitle>
            <DialogDescription>
              Configure hourly rates for a support type across different day types.
            </DialogDescription>
          </DialogHeader>
          <RateForm
            onSubmit={handleCreate}
            isLoading={createRate.isPending}
            submitLabel="Add Rate"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRate} onOpenChange={(open) => !open && setEditingRate(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Support Type Rate</DialogTitle>
            <DialogDescription>
              Update the hourly rates for this support type.
            </DialogDescription>
          </DialogHeader>
          {editingRate && (
            <RateForm
              defaultValues={{
                support_type: editingRate.support_type,
                ndis_item_number: editingRate.ndis_item_number ?? '',
                weekday_rate: editingRate.weekday_rate,
                saturday_rate: editingRate.saturday_rate,
                sunday_rate: editingRate.sunday_rate,
                public_holiday_rate: editingRate.public_holiday_rate,
                effective_from: editingRate.effective_from,
              }}
              onSubmit={handleUpdate}
              isLoading={updateRate.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
