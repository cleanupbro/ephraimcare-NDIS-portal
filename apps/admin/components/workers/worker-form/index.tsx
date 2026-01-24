'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Input, Label, Button, Card, CardContent, CardHeader, CardTitle, Textarea } from '@ephraimcare/ui'
import { Loader2 } from 'lucide-react'
import { workerFullSchema, type WorkerFullData } from '@/lib/workers/schemas'
import { SUPPORT_TYPES } from '@/lib/workers/constants'
import { useCreateWorker } from '@/hooks/use-create-worker'

export function WorkerForm() {
  const router = useRouter()
  const createWorker = useCreateWorker()

  const form = useForm<WorkerFullData>({
    resolver: zodResolver(workerFullSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      services_provided: [],
      qualification: [],
      hourly_rate: undefined,
      max_hours_per_week: 38,
      ndis_check_number: '',
      ndis_check_expiry: '',
      wwcc_number: '',
      wwcc_expiry: '',
    },
  })

  const onSubmit = (data: WorkerFullData) => {
    // Transform qualification textarea value: split by newline, filter empty
    const qualificationText = (form.getValues as any)('_qualification_text') as string | undefined
    const qualifications = qualificationText
      ? qualificationText
          .split('\n')
          .map((q: string) => q.trim())
          .filter((q: string) => q.length > 0)
      : data.qualification || []

    createWorker.mutate(
      {
        ...data,
        qualification: qualifications,
        ndis_check_expiry: data.ndis_check_expiry || undefined,
        wwcc_expiry: data.wwcc_expiry || undefined,
      },
      {
        onSuccess: () => {
          router.push('/workers')
        },
      }
    )
  }

  // Handle checkbox toggle for support types
  const toggleSupportType = (type: (typeof SUPPORT_TYPES)[number]) => {
    const current = form.getValues('services_provided') || []
    if (current.includes(type)) {
      form.setValue(
        'services_provided',
        current.filter((t) => t !== type),
        { shouldValidate: true }
      )
    } else {
      form.setValue('services_provided', [...current, type], { shouldValidate: true })
    }
  }

  const selectedTypes = form.watch('services_provided') || []

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="worker@example.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              An invitation email will be sent to this address.
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+61..."
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

      {/* Section 2: Support Types & Qualifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Support Types & Qualifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Support Types */}
          <div className="space-y-2">
            <Label>
              Support Types <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUPPORT_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 hover:bg-accent transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleSupportType(type)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm">{type}</span>
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
            <Label htmlFor="qualification_text">Qualifications</Label>
            <Textarea
              id="qualification_text"
              placeholder="Enter qualifications, one per line"
              rows={3}
              {...form.register('_qualification_text' as any)}
            />
            <p className="text-xs text-muted-foreground">
              Enter one qualification per line (e.g., Certificate III in Individual Support)
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

            {/* Max Hours/Week */}
            <div className="space-y-2">
              <Label htmlFor="max_hours_per_week">Max Hours / Week</Label>
              <Input
                id="max_hours_per_week"
                type="number"
                min="1"
                max="168"
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

      {/* Section 3: Compliance Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Compliance Checks{' '}
            <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These can be added later if not available now.
          </p>

          {/* NDIS Check */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ndis_check_number">NDIS Check Number</Label>
              <Input
                id="ndis_check_number"
                placeholder="Check number"
                {...form.register('ndis_check_number')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ndis_check_expiry">NDIS Check Expiry</Label>
              <Input
                id="ndis_check_expiry"
                type="date"
                {...form.register('ndis_check_expiry')}
              />
            </div>
          </div>

          {/* WWCC */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wwcc_number">WWCC Number</Label>
              <Input
                id="wwcc_number"
                placeholder="WWCC number"
                {...form.register('wwcc_number')}
              />
            </div>
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

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/workers')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createWorker.isPending}>
          {createWorker.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {createWorker.isPending ? 'Sending Invite...' : 'Create Worker'}
        </Button>
      </div>
    </form>
  )
}
