import { useEffect, useState } from 'react'
import { Dashboard_Cards } from './components/dashboard_cards'
import Live_Traffic_Graph from './components/graph'
import './App.css'
import DemoStreamControls from './components/demo_stream'

const demoSnapshot = { total_events: 24836, events_per_second: 42, topic_counts: { Python: 8240, 'Artificial intelligence': 6150, React: 4820, FastAPI: 3406, Gaming: 2220 }, platform_counts: { Reddit: 11240, YouTube: 8140, Twitter: 5456 }, sentiment_counts: { positive: 15398, neutral: 6457, negative: 2981 } }
const demoTraffic = Array.from({ length: 60 }, (_, i) => ({ time: 1700000000000 + i * 1000, eventsPerSecond: Math.round(27 + Math.sin(i * .35) * 9 + Math.cos(i * .9) * 5 + i * .25) }))
function Breakdown({ counts, sentiment = false }) {
  const entries = Object.entries(counts ?? {}).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((sum, [, value]) => sum + value, 0)
  return <div className={`breakdown ${sentiment ? 'sentiments' : ''}`}>{entries.length ? entries.map(([name, value], index) => <div key={name}><div className="row-label"><i className={`dot color-${index % 5}`} /><span className="capitalize">{name}</span><strong>{value.toLocaleString()}</strong><span className="percentage">{total ? Math.round(value / total * 100) : 0}%</span></div><div className="bar-track"><div className={`bar-fill color-${index % 5}`} style={{ width: `${total ? value / total * 100 : 0}%` }} /></div></div>) : <p className="empty-copy">Your breakdown will appear as events arrive.</p>}</div>
}

export default function App() {
  const [analytics, setAnalytics] = useState(null)
  const [trafficData, setTrafficData] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [demo, setDemo] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  useEffect(() => {
    let delay = 500, timer, socket, stopped = false
    function connect() {
      if (stopped) return
      setConnectionStatus('connecting')
      socket = new WebSocket('ws://127.0.0.1:8000/ws/analytics')
      socket.addEventListener('open', () => { if (!stopped) { setConnectionStatus('connected'); delay = 500 } })
      socket.addEventListener('message', message => {
        if (stopped) return
        try {
          const snapshot = JSON.parse(message.data)
          if (typeof snapshot.total_events !== 'number') return
          const time = Date.now()
          setAnalytics(snapshot)
          setLastUpdated(time)
          setTrafficData(previous => [...previous, { time, eventsPerSecond: snapshot.events_per_second ?? 0 }].slice(-240))
        } catch { setConnectionStatus('error') }
      })
      socket.addEventListener('error', () => { if (!stopped) setConnectionStatus('error') })
      socket.addEventListener('close', () => { if (!stopped) { setConnectionStatus('disconnected'); timer = setTimeout(connect, delay); delay = Math.min(delay * 2, 30000) } })
    }
    connect()
    return () => { stopped = true; clearTimeout(timer); socket?.close() }
  }, [])
  const snapshot = demo ? demoSnapshot : analytics
  const connected = connectionStatus === 'connected'
  const topics = Object.entries(snapshot?.topic_counts ?? {}).sort((a, b) => b[1] - a[1])
  const total = snapshot?.total_events ?? 0

  return <div className="app-shell">
    <div className="main-shell"><main id="overview">
      <div className="stream-toolbar"><div className="stream-label" role="status"><i className={`status-dot ${demo ? 'sample' : connected ? 'online' : ''}`} />{demo ? 'Demo preview' : connected ? 'Live stream' : connectionStatus === 'connecting' ? 'Connecting to stream' : 'Stream disconnected'}<span className="toolbar-divider" /><span className="muted">{demo ? 'Illustrative sample data' : lastUpdated ? `Last received ${new Date(lastUpdated).toLocaleTimeString()}` : 'Waiting for your first snapshot'}</span></div><div className="mode-switch"><button onClick={() => setDemo(false)} aria-pressed={!demo}>Live data</button><button onClick={() => setDemo(true)} aria-pressed={demo}>Try demo</button></div></div>
      {demo && <div className="notice">You’re exploring sample data. Switch to Live data to view your connected event stream.</div>}
      {!demo && !connected && <div className="notice">{analytics ? 'Connection interrupted. Showing the last snapshot while we reconnect.' : 'Your dashboard is ready. Start your event stream, or select Try demo to explore a sample.'}</div>}
      <Dashboard_Cards analytics={snapshot} />
      {/* Preview samples never write data; this separate control starts real synthetic ingestion. */}
      <DemoStreamControls preview={demo} onShowLive={() => setDemo(false)} />
      <section className="panel traffic-panel" id="traffic"><div className="panel-heading"><div><h2>Conversation activity <span className="live-tag">{demo ? 'SAMPLE' : 'LIVE'}</span></h2><p>Incoming events per second across all platforms</p></div><span className="chart-legend"><i className="status-dot sample" />Event throughput</span></div><div className="traffic-chart">{(demo ? demoTraffic : trafficData).length ? <Live_Traffic_Graph data={demo ? demoTraffic : trafficData} /> : <div className="chart-empty"><span>⌁</span><strong>Your next conversation starts here</strong><p>Live traffic will appear as events arrive.</p></div>}</div><div className="chart-footer"><span><i className="status-dot sample" />{demo ? '60 illustrative samples' : `${trafficData.length} recent samples`}</span><span>Rolling window · up to 240 samples</span></div></section>
      <div className="audience-grid" id="audience"><section className="panel"><div className="panel-heading"><div><h2>Platform mix</h2><p>Where the conversation happens</p></div><span className="panel-symbol">◎</span></div><Breakdown counts={snapshot?.platform_counts} /></section><section className="panel"><div className="panel-heading"><div><h2>Sentiment signals</h2><p>The tone behind your events</p></div><span className="panel-symbol">◒</span></div><Breakdown counts={snapshot?.sentiment_counts} sentiment /></section></div>
      <section className="panel topics-panel" id="topics"><div className="panel-heading"><div><h2>Topics in focus</h2><p>What’s capturing attention across your stream</p></div><span className="count-badge">{topics.length} topics</span></div><div className="table-scroll"><table><thead><tr><th scope="col">TOPIC</th><th scope="col">EVENTS</th><th scope="col">SHARE OF CONVERSATION</th></tr></thead><tbody>{topics.map(([name, count], index) => <tr key={name}><td><span className="topic-rank">{String(index + 1).padStart(2, '0')}</span><span className="topic-name">{name}</span></td><td>{count.toLocaleString()}</td><td><div className="table-share"><div className="bar-track"><div className="bar-fill" style={{ width: `${total ? count / total * 100 : 0}%` }} /></div><span>{total ? (count / total * 100).toFixed(1) : '0.0'}%</span></div></td></tr>)}</tbody></table>{!topics.length && <p className="empty-copy">Topics will be ranked here when events arrive.</p>}</div></section>
    </main></div></div>
}
