import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'

const TEAL = '#0f6b6b'
const TEAL_MID = '#3a8a8a'
const TEAL_SOFT = '#7ab0b0'
const LINE = '#c5d0da'
const INK_MUTED = '#5a6a7a'
const SENTIMENT_FILL = {
  positive: '#0f6b6b',
  neutral: '#7ab0b0',
  negative: '#5a6a7a',
}

function countsToRows(counts) {
  return Object.entries(counts ?? {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function EmptyChart() {
  return <div className="chart-empty">No data yet</div>
}

function SimpleBarChart({ rows, fill = TEAL }) {
  if (rows.length === 0) return <EmptyChart />

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={LINE} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: INK_MUTED, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          axisLine={{ stroke: LINE }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={72}
          tick={{ fill: INK_MUTED, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(15, 107, 107, 0.06)' }}
          contentStyle={{
            background: '#f4f7f9',
            border: `1px solid ${LINE}`,
            borderRadius: 0,
            fontFamily: 'IBM Plex Mono',
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" name="Count" fill={fill} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function SentimentBars({ rows }) {
  if (rows.length === 0) return <EmptyChart />

  const palette = [TEAL, TEAL_MID, TEAL_SOFT]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: INK_MUTED, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          axisLine={{ stroke: LINE }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: INK_MUTED, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: 'rgba(15, 107, 107, 0.06)' }}
          contentStyle={{
            background: '#f4f7f9',
            border: `1px solid ${LINE}`,
            borderRadius: 0,
            fontFamily: 'IBM Plex Mono',
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" name="Count" isAnimationActive={false}>
          {rows.map((row, index) => (
            <Cell
              key={row.name}
              fill={SENTIMENT_FILL[row.name] ?? palette[index % palette.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function BreakdownCharts({ analytics }) {
  const topics = countsToRows(analytics?.topic_counts)
  const platforms = countsToRows(analytics?.platform_counts)
  const sentiments = countsToRows(analytics?.sentiment_counts)

  return (
    <section aria-label="Count breakdowns" className="breakdowns">
      <div className="breakdown">
        <h3>Topics</h3>
        <div className="breakdown__chart">
          <SimpleBarChart rows={topics} fill={TEAL} />
        </div>
      </div>
      <div className="breakdown">
        <h3>Platforms</h3>
        <div className="breakdown__chart">
          <SimpleBarChart rows={platforms} fill={TEAL_MID} />
        </div>
      </div>
      <div className="breakdown">
        <h3>Sentiment</h3>
        <div className="breakdown__chart">
          <SentimentBars rows={sentiments} />
        </div>
      </div>
    </section>
  )
}
