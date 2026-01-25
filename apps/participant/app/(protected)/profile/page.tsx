'use client'

import { useParticipantProfile } from '@/hooks/use-participant-profile'
import { format, parseISO } from 'date-fns'
import { User, Phone, MapPin, AlertCircle, Heart } from 'lucide-react'

/**
 * Read-only profile page for participants.
 * Displays personal information, contact details, emergency contact, and support needs.
 * NO edit buttons or forms - purely informational.
 */
export default function ProfilePage() {
  const { data: profile, isLoading, error } = useParticipantProfile()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Profile</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl bg-muted" />
          <div className="h-32 rounded-xl bg-muted" />
          <div className="h-32 rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Profile</h1>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          Unable to load profile. Please try refreshing the page.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal information (read-only)
        </p>
      </div>

      {/* Personal Information */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-medium">Personal Information</h2>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Full Name</dt>
            <dd className="font-medium">{profile.first_name} {profile.last_name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">NDIS Number</dt>
            <dd className="font-medium font-mono">{profile.ndis_number}</dd>
          </div>
          {profile.date_of_birth && (
            <div>
              <dt className="text-sm text-muted-foreground">Date of Birth</dt>
              <dd className="font-medium">{format(parseISO(profile.date_of_birth), 'd MMMM yyyy')}</dd>
            </div>
          )}
          {profile.email && (
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Contact Information */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-medium">Contact Information</h2>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          {profile.phone ? (
            <div>
              <dt className="text-sm text-muted-foreground">Phone</dt>
              <dd className="font-medium">{profile.phone}</dd>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground italic">No phone number on file</p>
            </div>
          )}
          {profile.address && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Address</dt>
              <dd className="font-medium">
                {profile.address}
                {profile.suburb && `, ${profile.suburb}`}
                {profile.state && ` ${profile.state}`}
                {profile.postcode && ` ${profile.postcode}`}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Emergency Contact */}
      {profile.emergency_contact_name && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-medium">Emergency Contact</h2>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd className="font-medium">{profile.emergency_contact_name}</dd>
            </div>
            {profile.emergency_contact_phone && (
              <div>
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd className="font-medium">{profile.emergency_contact_phone}</dd>
              </div>
            )}
            {profile.emergency_contact_relationship && (
              <div>
                <dt className="text-sm text-muted-foreground">Relationship</dt>
                <dd className="font-medium">{profile.emergency_contact_relationship}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Support Needs (if populated) */}
      {profile.support_needs && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-medium">Support Needs</h2>
          </div>
          <p className="text-sm whitespace-pre-wrap">{profile.support_needs}</p>
        </div>
      )}

      {/* Read-only notice */}
      <div className="rounded-lg border border-muted bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          To update your information, please contact your coordinator or support team.
        </p>
      </div>

      {/* OpBros footer */}
      <footer className="pt-8 border-t border-border text-center text-xs text-muted-foreground">
        Powered by{' '}
        <a
          href="https://opbros.online"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:underline"
        >
          OpBros
        </a>
      </footer>
    </div>
  )
}
