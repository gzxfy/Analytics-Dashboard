// Preview fixtures only. Switching to these values never writes database records.
export const demoSnapshot = {
  total_events: 24836,
  events_per_second: 42,
  topic_counts: {
    Python: 8240,
    'Artificial intelligence': 6150,
    React: 4820,
    FastAPI: 3406,
    Gaming: 2220,
  },
  platform_counts: {
    Reddit: 11240,
    YouTube: 8140,
    Twitter: 5456,
  },
  sentiment_counts: {
    positive: 15398,
    neutral: 6457,
    negative: 2981,
  },
}

// Fixed timestamps and a repeatable curve keep the sample chart consistent.
export const demoTraffic = []
const sampleStartTime = 1700000000000

for (let index = 0; index < 60; index += 1) {
  const wave = Math.sin(index * 0.35) * 9
  const variation = Math.cos(index * 0.9) * 5
  const trend = index * 0.25

  demoTraffic.push({
    time: sampleStartTime + index * 1000,
    eventsPerSecond: Math.round(27 + wave + variation + trend),
  })
}
