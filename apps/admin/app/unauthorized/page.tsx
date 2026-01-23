export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="font-heading text-2xl font-bold text-destructive">
          Access Denied
        </h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to access the admin portal.
        </p>
        <a href="/login" className="text-sm text-secondary hover:underline">
          Return to login
        </a>
      </div>
    </div>
  )
}
