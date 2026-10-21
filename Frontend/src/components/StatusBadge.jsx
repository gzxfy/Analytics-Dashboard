const LABELS = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Reconnecting',
  error: 'Error',
}

const DOT_CLASS = {
  connected: 'bg-live animate-live-pulse',
  connecting: 'bg-warn',
  disconnected: 'bg-warn',
  error: 'bg-error',
}

export function StatusBadge({ status }) {
  const label = LABELS[status] ?? status
  const dotClass = DOT_CLASS[status] ?? 'bg-ink-faint'

  return (
    <span
      className="inline-flex items-center gap-2 font-mono text-xs tracking-wide text-ink-muted"
      role="status"
      aria-live="polite"
    >
      <span
        className={`inline-block size-2 shrink-0 rounded-sm ${dotClass}`}
        aria-hidden="true"
      />
      <span className="uppercase">{label}</span>
    </span>
  )
}
