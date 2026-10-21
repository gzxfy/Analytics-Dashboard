export function Dashboard_Cards({ analytics }) {
  const topics = Object.entries(analytics?.topic_counts ?? {}).sort((a, b) => b[1] - a[1])
  const sentiments = Object.entries(analytics?.sentiment_counts ?? {}).sort((a, b) => b[1] - a[1])
  const total = sentiments.reduce((sum, [, count]) => sum + count, 0)
  const cards = [
    { label: 'Total events', value: analytics ? analytics.total_events.toLocaleString() : '—', detail: 'All recorded conversations', icon: '◫', color: 'coral' },
    { label: 'Events per second', value: analytics ? (analytics.events_per_second ?? 0).toLocaleString() : '—', detail: 'Current stream throughput', icon: '⌁', color: 'blue' },
    { label: 'Leading topic', value: topics[0]?.[0] ?? 'No data yet', detail: topics.length ? `${topics[0][1].toLocaleString()} events in this topic` : 'Waiting for conversations', icon: '#', color: 'purple' },
    { label: 'Leading sentiment', value: sentiments[0]?.[0] ?? 'No data yet', detail: total ? `${Math.round(sentiments[0][1] / total * 100)}% of classified events` : 'Waiting for conversations', icon: '◡', color: 'green' },
  ]
  return <section className="metrics-grid" aria-label="Key metrics">{cards.map(card => <article className="metric-card" key={card.label}><div className="metric-header"><h2>{card.label}</h2><span className={`metric-icon ${card.color}`} aria-hidden="true">{card.icon}</span></div><div className="metric-value capitalize">{card.value}</div><p><i className={`mini-dot ${card.color}`} />{card.detail}</p></article>)}</section>
}
