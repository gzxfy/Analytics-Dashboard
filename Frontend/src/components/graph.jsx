import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

function formatAxisTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function Live_Traffic_Graph({ data }) {
  // Rendering only: the WebSocket message handler owns the history updates.
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 15, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#df8065" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#df8065" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#eaece9" />
        <XAxis
          dataKey="time"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickCount={7}
          axisLine={false}
          tickLine={false}
          tickMargin={14}
          minTickGap={35}
          tick={{ fill: '#8a8e91', fontSize: 13 }}
          tickFormatter={formatAxisTime}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tick={{ fill: '#8a8e91', fontSize: 13 }}
        />
        <Tooltip
          contentStyle={{ border: '1px solid #e8e9e5', borderRadius: 12, fontSize: 14 }}
          labelFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
        />
        <Area
          type="monotone"
          dataKey="eventsPerSecond"
          name="Events / second"
          stroke="#df8065"
          strokeWidth={2.5}
          fill="url(#trafficFill)"
          isAnimationActive={false}
          dot={data.length === 1 ? { r: 4 } : false}
          activeDot={{ r: 5, stroke: '#fff', strokeWidth: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
