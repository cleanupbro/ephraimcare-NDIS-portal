'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, CheckCircle, XCircle, ExternalLink, Info } from 'lucide-react'

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Badge,
  Alert,
  AlertDescription,
} from '@ephraimcare/ui'

import {
  useOrganization,
  useUpdateOrganizationSettings,
  useTestTwilioCredentials,
} from '@/hooks/use-organization'
import { toast } from '@/lib/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TwilioFormData {
  accountSid: string
  authToken: string
  phoneNumber: string
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { data: organization, isLoading } = useOrganization()
  const updateSettings = useUpdateOrganizationSettings()
  const testTwilio = useTestTwilioCredentials()

  const [testPhone, setTestPhone] = useState('')

  const twilioForm = useForm<TwilioFormData>({
    defaultValues: {
      accountSid: '',
      authToken: '',
      phoneNumber: '',
    },
  })

  // Set defaults when org loads
  useEffect(() => {
    if (organization && !twilioForm.formState.isDirty) {
      twilioForm.reset({
        accountSid: organization.twilio_account_sid || '',
        authToken: '',
        phoneNumber: organization.twilio_phone_number || '',
      })
    }
  }, [organization, twilioForm])

  const handleTwilioSave = async (data: TwilioFormData) => {
    try {
      await updateSettings.mutateAsync({
        twilio_account_sid: data.accountSid,
        twilio_auth_token: data.authToken || undefined,
        twilio_phone_number: data.phoneNumber,
        settings: { sms_enabled: true },
      })
      toast({
        title: 'Twilio settings saved',
        description: 'Your SMS configuration has been updated.',
        variant: 'success',
      })
      // Clear the auth token field after save (write-only)
      twilioForm.setValue('authToken', '')
    } catch (error) {
      toast({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : 'Failed to save Twilio settings',
        variant: 'error',
      })
    }
  }

  const handleTestSms = async () => {
    if (!testPhone) {
      toast({
        title: 'Phone number required',
        description: 'Enter a phone number to send a test SMS',
        variant: 'error',
      })
      return
    }
    try {
      await testTwilio.mutateAsync(testPhone)
      toast({
        title: 'Test SMS sent',
        description: 'Check your phone for the test message.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Test failed',
        description: error instanceof Error ? error.message : 'Failed to send test SMS',
        variant: 'error',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const smsEnabled = organization?.settings?.sms_enabled
  const xeroConnected = organization?.settings?.xero_connected

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external services for SMS notifications and accounting sync
        </p>
      </div>

      {/* Twilio SMS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SMS Notifications (Twilio)</CardTitle>
              <CardDescription>
                Send shift reminders to workers and participants via SMS
              </CardDescription>
            </div>
            <Badge variant={smsEnabled ? 'default' : 'secondary'}>
              {smsEnabled ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Enabled
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Not configured
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={twilioForm.handleSubmit(handleTwilioSave)} className="space-y-4">
            {/* Account SID */}
            <div className="space-y-2">
              <Label htmlFor="accountSid">Account SID</Label>
              <Input
                id="accountSid"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                {...twilioForm.register('accountSid')}
              />
              <p className="text-xs text-muted-foreground">
                Found in your{' '}
                <a
                  href="https://console.twilio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Twilio Console <ExternalLink className="inline h-3 w-3" />
                </a>
              </p>
            </div>

            {/* Auth Token */}
            <div className="space-y-2">
              <Label htmlFor="authToken">Auth Token</Label>
              <Input
                id="authToken"
                type="password"
                placeholder="Enter new token to update"
                {...twilioForm.register('authToken')}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to keep existing token
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Twilio Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="+61xxxxxxxxx"
                {...twilioForm.register('phoneNumber')}
              />
              <p className="text-xs text-muted-foreground">
                Australian number in E.164 format (e.g., +61412345678)
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Twilio Settings
              </Button>
            </div>
          </form>

          {/* Test SMS Section */}
          {smsEnabled && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-2">Test SMS</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="+61412345678"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  variant="outline"
                  onClick={handleTestSms}
                  disabled={testTwilio.isPending}
                >
                  {testTwilio.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Test
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Xero Accounting */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Xero Accounting</CardTitle>
              <CardDescription>
                Automatically sync invoices to your Xero account
              </CardDescription>
            </div>
            <Badge variant={xeroConnected ? 'default' : 'secondary'}>
              {xeroConnected ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Not connected
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {xeroConnected ? (
            <div className="space-y-4">
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Xero is connected. Invoices will automatically sync when finalized.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                onClick={() => {
                  // Future: implement Xero disconnect
                  toast({
                    title: 'Coming soon',
                    description: 'Xero disconnect will be available in a future update.',
                  })
                }}
              >
                Disconnect Xero
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Xero account to automatically create invoices in Xero
                when you finalize invoices in this system.
              </p>
              <Button
                onClick={() => {
                  // Future: implement Xero OAuth flow
                  toast({
                    title: 'Coming soon',
                    description: 'Xero integration will be available in a future update.',
                  })
                }}
              >
                Connect to Xero
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NDIA Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>NDIA Claims</CardTitle>
              <CardDescription>
                Generate PACE-compliant CSV files for bulk claim submission
              </CardDescription>
            </div>
            <Badge variant="secondary">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Available
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              NDIA bulk claims are submitted via CSV upload to the myplace portal.
              Generate PACE-compliant CSV files from the{' '}
              <a href="/invoices" className="text-primary hover:underline font-medium">
                Invoices page
              </a>{' '}
              when ready to submit.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
