function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function EventsTable({ events, status, error }) {
  return (
    <section aria-label="Recent events">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-sans text-lg font-semibold tracking-tight text-ink">
          Recent events
        </h2>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">
          GET /events
        </p>
      </div>

      {status === 'loading' && events.length === 0 ? (
        <p className="mt-4 font-mono text-sm text-ink-muted">Loading events…</p>
      ) : null}

      {status === 'error' ? (
        <p className="mt-4 font-mono text-sm text-error">
          Could not load events{error ? `: ${error}` : ''}. Is the API running?
        </p>
      ) : null}

      {status === 'ok' && events.length === 0 ? (
        <p className="mt-4 font-mono text-sm text-ink-muted">
          No events stored yet. POST to /events or run the sample generator.
        </p>
      ) : null}

      {events.length > 0 ? (
        <div className="mt-4 overflow-x-auto border-y border-line">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-faint">
                <th className="px-3 py-3 font-medium">ID</th>
                <th className="px-3 py-3 font-medium">Platform</th>
                <th className="px-3 py-3 font-medium">Topic</th>
                <th className="px-3 py-3 font-medium">Sentiment</th>
                <th className="px-3 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr
                  key={event.id ?? `${event.platform}-${event.created_at}-${index}`}
                  className={index % 2 === 0 ? 'bg-paper-deep/40' : 'bg-transparent'}
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">
                    {event.id ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{event.platform}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{event.topic}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{event.sentiment}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">
                    {formatTime(event.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
