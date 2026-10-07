import { useEffect, useState } from 'react'
import { Dashboard_Cards } from './components/dashboard_cards'
import './App.css'
import Live_Traffic_Graph from './components/graph'

function App() {
  const [analytics, setAnalytics] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState("connecting")

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/analytics")

    socket.addEventListener("open", () => {
      setConnectionStatus("connected")
    })

    socket.addEventListener("message", (message) => {
      setAnalytics(JSON.parse(message.data))
    })

    socket.addEventListener('error', () => {
      setConnectionStatus('error')
    })

    socket.addEventListener('close', () => {
      setConnectionStatus('disconnected')
    })

    return () => socket.close()
  }, [])

  function renderCounts(counts) {
    return (
      <ul>
        {Object.entries(counts).map(([name, count]) => (
          <li key={name}>
            <span>{name}</span>
            <strong>: {count}</strong>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <main>
      <h1>Event Analytics</h1>
      <p>WebSocket: {connectionStatus}</p>

      {!analytics ? (
        <p>Waiting for analytics...</p>
      ) : (
        <>
          <h2>Total Events: {analytics.total_events.toLocaleString()}</h2>
          
          <section>
            <h2>Topics</h2>
            {renderCounts(analytics.topic_counts)}
          </section>

          <section>
            <h2>Platforms</h2>
            {renderCounts(analytics.platform_counts)}
          </section>

          <section>
            <h2>Sentiment</h2>
            {renderCounts(analytics.sentiment_counts)}
          </section>
        </>
      )}
    
      <Dashboard_Cards analytics={analytics} />

      <h2>Live Traffic Graph</h2>
      <Live_Traffic_Graph analytics={analytics} />
    </main>
  )
}

export default App
