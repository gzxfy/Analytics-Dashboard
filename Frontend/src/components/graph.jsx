import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const TEAL = '#0f6b6b'
const TEAL_SOFT = '#d4e8e8'
const LINE = '#c5d0da'
const INK_MUTED = '#5a6a7a'

export default function LiveTrafficGraph({ data }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickCount={6}
            tick={{ fill: INK_MUTED, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            axisLine={{ stroke: LINE }}
            tickLine={false}
            tickFormatter={(time) =>
              new Date(time).toLocaleTimeString([], {
                minute: '2-digit',
                second: '2-digit',
              })
            }
          />
          <YAxis
            tick={{ fill: INK_MUTED, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: '#f4f7f9',
              border: `1px solid ${LINE}`,
              borderRadius: 0,
              fontFamily: 'IBM Plex Mono',
              fontSize: 12,
            }}
            labelFormatter={(time) => new Date(time).toLocaleTimeString()}
          />
          <Area
            type="monotone"
            dataKey="eventsPerSecond"
            name="Events / second"
            stroke={TEAL}
            fill={TEAL_SOFT}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
