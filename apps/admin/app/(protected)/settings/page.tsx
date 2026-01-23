import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single() as { data: {
      first_name: string
      last_name: string
      email: string
      role: string
      phone: string | null
      organization_id: string
    } | null }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Profile</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">First Name</label>
            <p className="mt-1 font-medium">{profile?.first_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Last Name</label>
            <p className="mt-1 font-medium">{profile?.last_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="mt-1">{profile?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Role</label>
            <p className="mt-1 capitalize">{profile?.role}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Phone</label>
            <p className="mt-1">{profile?.phone ?? 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Organization ID</label>
            <p className="mt-1 font-mono text-xs">{profile?.organization_id}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Security</h2>
        <button className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          Change Password
        </button>
      </div>

      <div className="rounded-lg border border-destructive/30 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
