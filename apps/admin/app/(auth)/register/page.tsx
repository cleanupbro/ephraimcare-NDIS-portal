'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ephraimcare/ui'
import { organizationRegisterSchema, type OrganizationRegisterInput } from '@/lib/supabase/schemas'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<OrganizationRegisterInput>({
    resolver: zodResolver(organizationRegisterSchema),
    defaultValues: {
      organizationName: '',
      abn: '',
      adminEmail: '',
      adminPassword: '',
      adminFirstName: '',
      adminLastName: '',
    },
  })

  const onSubmit = async (data: OrganizationRegisterInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/organizations/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">Registration Successful!</CardTitle>
          <CardDescription>
            Your organization has been created. Redirecting to login...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Register Your Organization</CardTitle>
        <CardDescription>
          Create an account for your NDIS provider organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              placeholder="Ephraim Care"
              {...form.register('organizationName')}
            />
            {form.formState.errors.organizationName && (
              <p className="text-sm text-destructive">{form.formState.errors.organizationName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="abn">ABN (11 digits)</Label>
            <Input
              id="abn"
              placeholder="12345678901"
              {...form.register('abn')}
            />
            {form.formState.errors.abn && (
              <p className="text-sm text-destructive">{form.formState.errors.abn.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminFirstName">First Name</Label>
              <Input
                id="adminFirstName"
                placeholder="John"
                {...form.register('adminFirstName')}
              />
              {form.formState.errors.adminFirstName && (
                <p className="text-sm text-destructive">{form.formState.errors.adminFirstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminLastName">Last Name</Label>
              <Input
                id="adminLastName"
                placeholder="Smith"
                {...form.register('adminLastName')}
              />
              {form.formState.errors.adminLastName && (
                <p className="text-sm text-destructive">{form.formState.errors.adminLastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              placeholder="admin@example.com"
              {...form.register('adminEmail')}
            />
            {form.formState.errors.adminEmail && (
              <p className="text-sm text-destructive">{form.formState.errors.adminEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Password</Label>
            <Input
              id="adminPassword"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              {...form.register('adminPassword')}
            />
            {form.formState.errors.adminPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.adminPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Organization
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
