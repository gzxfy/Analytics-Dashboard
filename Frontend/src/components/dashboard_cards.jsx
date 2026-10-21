export function Dashboard_Cards({ analytics }) {
  // Counts arrive as objects. Sort their entries to find the leading categories.
  const topicCounts = analytics?.topic_counts ?? {}
  const sentimentCounts = analytics?.sentiment_counts ?? {}
  const sortedTopics = Object.entries(topicCounts).sort((first, second) => second[1] - first[1])
  const sortedSentiments = Object.entries(sentimentCounts).sort((first, second) => second[1] - first[1])

  const [leadingTopic, leadingTopicCount] = sortedTopics[0] ?? ['No data yet', 0]
  const [leadingSentiment, leadingSentimentCount] = sortedSentiments[0] ?? ['No data yet', 0]
  const totalSentiments = Object.values(sentimentCounts).reduce((sum, count) => sum + count, 0)
  const sentimentPercentage = totalSentiments > 0
    ? Math.round((leadingSentimentCount / totalSentiments) * 100)
    : 0

  const cards = [
    {
      label: 'Total events',
      value: analytics ? analytics.total_events.toLocaleString() : '—',
      detail: 'All recorded conversations',
      icon: '◫',
      color: 'coral',
    },
    {
      label: 'Events per second',
      value: analytics ? (analytics.events_per_second ?? 0).toLocaleString() : '—',
      detail: 'Current stream throughput',
      icon: '⌁',
      color: 'blue',
    },
    {
      label: 'Leading topic',
      value: leadingTopic,
      detail: sortedTopics.length > 0
        ? `${leadingTopicCount.toLocaleString()} events in this topic`
        : 'Waiting for conversations',
      icon: '#',
      color: 'purple',
    },
    {
      label: 'Leading sentiment',
      value: leadingSentiment,
      detail: totalSentiments > 0
        ? `${sentimentPercentage}% of classified events`
        : 'Waiting for conversations',
      icon: '◡',
      color: 'green',
    },
  ]

  return (
    <section className="metrics-grid" aria-label="Key metrics">
      {cards.map((card) => (
        <article className="metric-card" key={card.label}>
          <div className="metric-header">
            <h2>{card.label}</h2>
            <span className={`metric-icon ${card.color}`} aria-hidden="true">
              {card.icon}
            </span>
          </div>
          <div className="metric-value capitalize">{card.value}</div>
          <p>
            <i className={`mini-dot ${card.color}`} />
            {card.detail}
          </p>
        </article>
      ))}
    </section>
  )
}
