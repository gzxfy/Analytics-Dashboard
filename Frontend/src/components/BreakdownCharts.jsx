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

function ChartPanel({ title, children }) {
  return (
    <div className="min-w-0">
      <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </h3>
      <div className="mt-3 h-[200px] animate-chart-in">{children}</div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center font-mono text-xs text-ink-faint">
      No data yet
    </div>
  )
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
    <section
      aria-label="Count breakdowns"
      className="grid gap-10 md:grid-cols-3"
    >
      <ChartPanel title="Topics">
        <SimpleBarChart rows={topics} fill={TEAL} />
      </ChartPanel>
      <ChartPanel title="Platforms">
        <SimpleBarChart rows={platforms} fill={TEAL_MID} />
      </ChartPanel>
      <ChartPanel title="Sentiment">
        <SentimentBars rows={sentiments} />
      </ChartPanel>
    </section>
  )
}
