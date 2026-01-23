export default function ParticipantDashboard() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="font-heading text-2xl font-bold">Welcome</h1>
      <p className="text-sm text-muted-foreground">
        Participant Portal — Coming soon
      </p>

      <footer className="mt-12 pt-4 border-t border-border text-center text-xs text-muted-foreground">
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
