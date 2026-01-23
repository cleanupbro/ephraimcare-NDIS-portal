'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Input, Label, Button } from '@ephraimcare/ui'
import { basicInfoSchema, type BasicInfoData } from '@/lib/participants/schemas'
import { useParticipantFormStore } from '@/lib/participants/form-store'
import { useCheckNdisNumber } from '@/hooks/use-check-ndis'
import { Loader2 } from 'lucide-react'

interface StepBasicInfoProps {
  onNext: () => void
}

export function StepBasicInfo({ onNext }: StepBasicInfoProps) {
  const { basicInfo, setBasicInfo, markStepComplete } = useParticipantFormStore()

  const form = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: basicInfo ?? {
      first_name: '',
      last_name: '',
      ndis_number: '',
      date_of_birth: '',
      phone: '',
      email: '',
    },
  })

  const ndisNumber = useWatch({ control: form.control, name: 'ndis_number' })
  const { data: ndisCheck, isLoading: isCheckingNdis } = useCheckNdisNumber(ndisNumber)

  // Set error when NDIS number already exists
  useEffect(() => {
    if (ndisCheck?.exists) {
      form.setError('ndis_number', {
        type: 'manual',
        message: 'This NDIS number is already registered',
      })
    } else if (form.formState.errors.ndis_number?.type === 'manual') {
      form.clearErrors('ndis_number')
    }
  }, [ndisCheck, form])

  const onSubmit = (data: BasicInfoData) => {
    // Block submission if NDIS already exists
    if (ndisCheck?.exists) {
      form.setError('ndis_number', {
        type: 'manual',
        message: 'This NDIS number is already registered',
      })
      return
    }

    setBasicInfo(data)
    markStepComplete(0)
    onNext()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

      {/* NDIS Number */}
      <div className="space-y-2">
        <Label htmlFor="ndis_number">
          NDIS Number <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="ndis_number"
            placeholder="e.g. 431234567"
            maxLength={9}
            {...form.register('ndis_number')}
          />
          {isCheckingNdis && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        {form.formState.errors.ndis_number && (
          <p className="text-sm text-destructive">
            {form.formState.errors.ndis_number.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          9-digit number starting with 43
        </p>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="date_of_birth">
          Date of Birth <span className="text-destructive">*</span>
        </Label>
        <Input
          id="date_of_birth"
          type="date"
          {...form.register('date_of_birth')}
        />
        {form.formState.errors.date_of_birth && (
          <p className="text-sm text-destructive">
            {form.formState.errors.date_of_birth.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="participant@example.com"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isCheckingNdis}>
          Next
        </Button>
      </div>
    </form>
  )
}
