'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Input,
  Label,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@ephraimcare/ui'
import { contactsSchema, type ContactsData } from '@/lib/participants/schemas'
import { useParticipantFormStore } from '@/lib/participants/form-store'

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

interface StepContactsProps {
  onNext: () => void
  onBack: () => void
}

export function StepContacts({ onNext, onBack }: StepContactsProps) {
  const { contacts, setContacts, markStepComplete } = useParticipantFormStore()

  const form = useForm<ContactsData>({
    resolver: zodResolver(contactsSchema),
    defaultValues: contacts ?? {
      address_line_1: '',
      address_line_2: '',
      suburb: '',
      state: 'NSW',
      postcode: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    },
  })

  const onSubmit = (data: ContactsData) => {
    setContacts(data)
    markStepComplete(2)
    onNext()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Address Section */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Address</h3>
        <div className="space-y-4">
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
        </div>
      </div>

      <Separator />

      {/* Emergency Contact Section */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Emergency Contact</h3>
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
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Next
        </Button>
      </div>
    </form>
  )
}
