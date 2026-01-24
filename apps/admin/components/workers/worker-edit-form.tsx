'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import type { WorkerWithProfile } from '@ephraimcare/types'
import {
  Input,
  Label,
  Button,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ephraimcare/ui'
import { workerEditSchema, type WorkerEditData } from '@/lib/workers/schemas'
import { SUPPORT_TYPES } from '@/lib/workers/constants'
import { useUpdateWorker } from '@/hooks/use-workers'

interface WorkerEditFormProps {
  worker: WorkerWithProfile
}

export function WorkerEditForm({ worker }: WorkerEditFormProps) {
  const router = useRouter()
  const updateMutation = useUpdateWorker(worker.id, worker.profile_id)

  const form = useForm<WorkerEditData>({
    resolver: zodResolver(workerEditSchema),
    defaultValues: {
      first_name: worker.profiles.first_name,
      last_name: worker.profiles.last_name,
      phone: worker.profiles.phone ?? '',
      services_provided: worker.services_provided ?? [],
      qualification: worker.qualification ?? [],
      hourly_rate: worker.hourly_rate ?? undefined,
      max_hours_per_week: worker.max_hours_per_week ?? 38,
      ndis_check_number: worker.ndis_check_number ?? '',
      ndis_check_expiry: worker.ndis_check_expiry ?? '',
      wwcc_number: worker.wwcc_number ?? '',
      wwcc_expiry: worker.wwcc_expiry ?? '',
    },
  })

  const onSubmit = (data: WorkerEditData) => {
    // Transform qualification: split textarea by newlines, filter empty
    const transformed = {
      ...data,
      qualification: Array.isArray(data.qualification)
        ? data.qualification
        : [],
      // Convert empty date strings to null
      ndis_check_expiry: data.ndis_check_expiry || null,
      wwcc_expiry: data.wwcc_expiry || null,
    } as WorkerEditData

    updateMutation.mutate(transformed)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Read-only Email */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{worker.profiles.email}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Email cannot be changed after registration
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                placeholder="Enter first name"
                {...form.register('first_name')}
              />
              {form.formState.errors.first_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.first_name.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                placeholder="Enter last name"
                {...form.register('last_name')}
              />
              {form.formState.errors.last_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="e.g. 0412345678"
              {...form.register('phone')}
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Worker Details */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Support Types */}
          <div className="space-y-2">
            <Label>
              Support Types <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUPPORT_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    value={type}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    {...form.register('services_provided')}
                  />
                  {type}
                </label>
              ))}
            </div>
            {form.formState.errors.services_provided && (
              <p className="text-sm text-destructive">
                {form.formState.errors.services_provided.message}
              </p>
            )}
          </div>

          {/* Qualifications */}
          <div className="space-y-2">
            <Label htmlFor="qualification">Qualifications</Label>
            <Textarea
              id="qualification"
              placeholder="Enter each qualification on a new line..."
              rows={4}
              defaultValue={(worker.qualification ?? []).join('\n')}
              onChange={(e) => {
                const lines = e.target.value
                  .split('\n')
                  .map((l) => l.trim())
                  .filter((l) => l.length > 0)
                form.setValue('qualification', lines)
              }}
            />
            <p className="text-xs text-muted-foreground">
              One qualification per line
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 35.00"
                {...form.register('hourly_rate')}
              />
              {form.formState.errors.hourly_rate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.hourly_rate.message}
                </p>
              )}
            </div>

            {/* Max Hours */}
            <div className="space-y-2">
              <Label htmlFor="max_hours_per_week">Max Hours/Week</Label>
              <Input
                id="max_hours_per_week"
                type="number"
                min="1"
                max="168"
                placeholder="38"
                {...form.register('max_hours_per_week')}
              />
              {form.formState.errors.max_hours_per_week && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.max_hours_per_week.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* NDIS Check Number */}
            <div className="space-y-2">
              <Label htmlFor="ndis_check_number">NDIS Check Number</Label>
              <Input
                id="ndis_check_number"
                placeholder="Enter NDIS check number"
                {...form.register('ndis_check_number')}
              />
            </div>

            {/* NDIS Check Expiry */}
            <div className="space-y-2">
              <Label htmlFor="ndis_check_expiry">NDIS Check Expiry</Label>
              <Input
                id="ndis_check_expiry"
                type="date"
                {...form.register('ndis_check_expiry')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* WWCC Number */}
            <div className="space-y-2">
              <Label htmlFor="wwcc_number">WWCC Number</Label>
              <Input
                id="wwcc_number"
                placeholder="Enter WWCC number"
                {...form.register('wwcc_number')}
              />
            </div>

            {/* WWCC Expiry */}
            <div className="space-y-2">
              <Label htmlFor="wwcc_expiry">WWCC Expiry</Label>
              <Input
                id="wwcc_expiry"
                type="date"
                {...form.register('wwcc_expiry')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/workers/${worker.id}`)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
