function topEntry(counts, fallback = '—') {
  const entries = Object.entries(counts ?? {})
  if (entries.length === 0) return [fallback, 0]
  return entries.reduce((max, current) => (current[1] > max[1] ? current : max))
}

function Metric({ label, children, compact = false }) {
  return (
    <div className="metric">
      <p className="metric__label">{label}</p>
      <div className={`metric__value${compact ? ' metric__value--sm' : ''}`}>
        {children}
      </div>
    </div>
  )
}

export function DashboardCards({ analytics }) {
  const eventsPerSecond = analytics?.events_per_second ?? 0
  const totalEvents = analytics?.total_events ?? 0
  const topicCounts = analytics?.topic_counts ?? {}
  const sentimentCounts = analytics?.sentiment_counts ?? {}

  const [topTopic] = topEntry(topicCounts)
  const [topSentiment, topSentimentCount] = topEntry(sentimentCounts)

  const totalSentiments = Object.values(sentimentCounts).reduce(
    (sum, count) => sum + count,
    0,
  )
  const sentimentPercentage =
    totalSentiments > 0
      ? Math.round((topSentimentCount / totalSentiments) * 100)
      : 0

  return (
    <section aria-label="Key metrics" className="metrics">
      <Metric label="Total events">{totalEvents.toLocaleString()}</Metric>
      <Metric label="Events / sec">{eventsPerSecond}</Metric>
      <Metric label="Top topic" compact>
        {topTopic}
      </Metric>
      <Metric label="Top sentiment" compact>
        {topSentiment}
        <span className="metric__pct">{sentimentPercentage}%</span>
      </Metric>
    </section>
  )
}
