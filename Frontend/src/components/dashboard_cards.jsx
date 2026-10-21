function topEntry(counts, fallback = '—') {
  const entries = Object.entries(counts ?? {})
  if (entries.length === 0) return [fallback, 0]
  return entries.reduce((max, current) => (current[1] > max[1] ? current : max))
}

function Metric({ label, children }) {
  return (
    <div className="min-w-0 border-t border-line pt-4 first:border-t-0 first:pt-0 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5 sm:first:border-l-0 sm:first:pl-0">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>
      <div className="mt-2 animate-fade-in font-mono text-2xl font-medium tracking-tight text-ink sm:text-3xl">
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
    <section
      aria-label="Key metrics"
      className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4"
    >
      <Metric label="Total events">{totalEvents.toLocaleString()}</Metric>
      <Metric label="Events / sec">{eventsPerSecond}</Metric>
      <Metric label="Top topic">
        <span className="block truncate text-xl sm:text-2xl">{topTopic}</span>
      </Metric>
      <Metric label="Top sentiment">
        <span className="block truncate text-xl sm:text-2xl">
          {topSentiment}
          <span className="ml-2 text-base text-ink-muted">{sentimentPercentage}%</span>
        </span>
      </Metric>
    </section>
  )
}
