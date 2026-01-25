'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

import { useHolidays, useCreateHoliday, useDeleteHoliday, type PublicHoliday } from '@/hooks/use-holidays'
import { publicHolidaySchema, type PublicHolidayInput } from '@/lib/invoices/schemas'

// ─── Format Date ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy')
}

// ─── Holiday Form ───────────────────────────────────────────────────────────────

interface HolidayFormProps {
  onSubmit: (data: PublicHolidayInput) => void
  isLoading: boolean
  onCancel: () => void
}

function HolidayForm({ onSubmit, isLoading, onCancel }: HolidayFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PublicHolidayInput>({
    resolver: zodResolver(publicHolidaySchema),
    defaultValues: {
      holiday_date: '',
      name: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="holiday_date">Date *</Label>
        <Input
          id="holiday_date"
          type="date"
          {...register('holiday_date')}
        />
        {errors.holiday_date && (
          <p className="text-sm text-destructive">{errors.holiday_date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Holiday Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Australia Day"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Holiday'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Holiday Item ───────────────────────────────────────────────────────────────

interface HolidayItemProps {
  holiday: PublicHoliday
  onDelete: (id: string) => void
  isDeleting: boolean
}

function HolidayItem({ holiday, onDelete, isDeleting }: HolidayItemProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground w-24">
          {formatDate(holiday.holiday_date)}
        </span>
        <span className="font-medium">{holiday.name}</span>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isDeleting}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Public Holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{holiday.name}&quot; ({formatDate(holiday.holiday_date)}) from the list of public holidays. Shifts on this date will use weekday rates instead of public holiday rates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(holiday.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function HolidaysSettingsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { data: holidays, isLoading } = useHolidays()
  const createHoliday = useCreateHoliday()
  const deleteHoliday = useDeleteHoliday()

  const handleCreate = (data: PublicHolidayInput) => {
    createHoliday.mutate(data, {
      onSuccess: () => setIsAddOpen(false),
    })
  }

  const handleDelete = (id: string) => {
    deleteHoliday.mutate(id)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Public Holidays</h1>
          <p className="text-sm text-muted-foreground">
            Manage public holiday dates for rate calculations
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Holiday
        </Button>
      </div>

      {/* Holidays List */}
      {isLoading ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          Loading holidays...
        </div>
      ) : holidays && holidays.length > 0 ? (
        <div className="rounded-lg border border-border">
          {holidays.map((holiday) => (
            <HolidayItem
              key={holiday.id}
              holiday={holiday}
              onDelete={handleDelete}
              isDeleting={deleteHoliday.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground mb-2">No public holidays configured.</p>
          <p className="text-sm text-muted-foreground">
            Shifts on unconfigured dates will use weekday rates.
          </p>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Public Holiday</DialogTitle>
            <DialogDescription>
              Add a public holiday date for rate calculations.
            </DialogDescription>
          </DialogHeader>
          <HolidayForm
            onSubmit={handleCreate}
            isLoading={createHoliday.isPending}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
