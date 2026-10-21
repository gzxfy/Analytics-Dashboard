const LABELS = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Reconnecting',
  error: 'Error',
}

export function StatusBadge({ status }) {
  const label = LABELS[status] ?? status

  return (
    <span className="status-badge" role="status" aria-live="polite">
      <span
        className={`status-badge__dot is-${status}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  )
}
