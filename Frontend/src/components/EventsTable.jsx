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
    <section className="events-block" aria-label="Recent events">
      <div className="panel-head">
        <h2>Recent events</h2>
        <p className="panel-head__meta">GET /events</p>
      </div>

      {status === 'loading' && events.length === 0 ? (
        <p className="events-msg">Loading events…</p>
      ) : null}

      {status === 'error' ? (
        <p className="events-msg is-error">
          Could not load events{error ? `: ${error}` : ''}. Is the API running?
        </p>
      ) : null}

      {status === 'ok' && events.length === 0 ? (
        <p className="events-msg">
          No events stored yet. POST to /events or run the sample generator.
        </p>
      ) : null}

      {events.length > 0 ? (
        <div className="events-scroll">
          <table className="events-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Platform</th>
                <th>Topic</th>
                <th>Sentiment</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr
                  key={event.id ?? `${event.platform}-${event.created_at}-${index}`}
                >
                  <td className="muted">{event.id ?? '—'}</td>
                  <td>{event.platform}</td>
                  <td>{event.topic}</td>
                  <td>{event.sentiment}</td>
                  <td className="muted">{formatTime(event.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
