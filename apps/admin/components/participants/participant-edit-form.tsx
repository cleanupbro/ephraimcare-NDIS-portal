'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import type { Participant } from '@ephraimcare/types'
import {
  Input,
  Label,
  Button,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ephraimcare/ui'
import { participantEditSchema, type ParticipantEditData } from '@/lib/participants/schemas'
import { useUpdateParticipant } from '@/hooks/use-participants'
import { toast } from '@/lib/toast'

const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'ACT', label: 'Australian Capital Territory' },
] as const

interface ParticipantEditFormProps {
  participant: Participant
}

export function ParticipantEditForm({ participant }: ParticipantEditFormProps) {
  const router = useRouter()
  const updateMutation = useUpdateParticipant()

  const form = useForm<ParticipantEditData>({
    resolver: zodResolver(participantEditSchema),
    defaultValues: {
      first_name: participant.first_name,
      last_name: participant.last_name,
      date_of_birth: participant.date_of_birth ?? '',
      phone: participant.phone ?? '',
      email: participant.email ?? '',
      address_line_1: participant.address_line_1 ?? '',
      address_line_2: participant.address_line_2 ?? '',
      suburb: participant.suburb ?? '',
      state: participant.state ?? 'NSW',
      postcode: participant.postcode ?? '',
      emergency_contact_name: participant.emergency_contact_name ?? '',
      emergency_contact_phone: participant.emergency_contact_phone ?? '',
      notes: participant.notes ?? '',
    },
  })

  const onSubmit = async (data: ParticipantEditData) => {
    try {
      await updateMutation.mutateAsync({
        id: participant.id,
        data,
      })
      toast({ title: 'Participant updated', variant: 'success' })
      router.push(`/participants/${participant.id}`)
    } catch (error) {
      toast({
        title: 'Failed to update participant',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'error',
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Read-only NDIS Number */}
      <Card>
        <CardHeader>
          <CardTitle>NDIS Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>NDIS Number</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono">{participant.ndis_number}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              NDIS number cannot be changed after registration
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
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line_1">Address Line 1</Label>
            <Input
              id="address_line_1"
              placeholder="Street address"
              {...form.register('address_line_1')}
            />
            {form.formState.errors.address_line_1 && (
              <p className="text-sm text-destructive">
                {form.formState.errors.address_line_1.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line_2">Address Line 2</Label>
            <Input
              id="address_line_2"
              placeholder="Apartment, unit, etc. (optional)"
              {...form.register('address_line_2')}
            />
            {form.formState.errors.address_line_2 && (
              <p className="text-sm text-destructive">
                {form.formState.errors.address_line_2.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="suburb">Suburb</Label>
              <Input
                id="suburb"
                placeholder="e.g. Liverpool"
                {...form.register('suburb')}
              />
              {form.formState.errors.suburb && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.suburb.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                defaultValue={form.getValues('state') || 'NSW'}
                onValueChange={(value) => form.setValue('state', value)}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {AUSTRALIAN_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.state && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.state.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                placeholder="e.g. 2170"
                maxLength={4}
                {...form.register('postcode')}
              />
              {form.formState.errors.postcode && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.postcode.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              <Input
                id="emergency_contact_name"
                placeholder="Full name"
                {...form.register('emergency_contact_name')}
              />
              {form.formState.errors.emergency_contact_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.emergency_contact_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                placeholder="e.g. 0412345678"
                {...form.register('emergency_contact_phone')}
              />
              {form.formState.errors.emergency_contact_phone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.emergency_contact_phone.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Support Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any relevant support information..."
              rows={4}
              {...form.register('notes')}
            />
            {form.formState.errors.notes && (
              <p className="text-sm text-destructive">
                {form.formState.errors.notes.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {form.watch('notes')?.length ?? 0}/2000 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/participants/${participant.id}`)}
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
