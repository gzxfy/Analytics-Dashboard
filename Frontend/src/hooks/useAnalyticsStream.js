import { useEffect, useState } from 'react'

const STREAM_URL = 'ws://127.0.0.1:8000/ws/analytics'
const INITIAL_RETRY_DELAY = 500
const MAX_RETRY_DELAY = 30000
const MAX_TRAFFIC_POINTS = 240

// Owns the connection lifecycle so the dashboard only has to display its results.
export default function useAnalyticsStream() {
  const [analytics, setAnalytics] = useState(null)
  const [trafficData, setTrafficData] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    let retryDelay = INITIAL_RETRY_DELAY
    let retryTimer
    let socket
    let stopped = false

    function handleMessage(message) {
      if (stopped) return

      try {
        const snapshot = JSON.parse(message.data)
        if (typeof snapshot.total_events !== 'number') return

        const receivedAt = Date.now()
        const trafficPoint = {
          time: receivedAt,
          eventsPerSecond: snapshot.events_per_second ?? 0,
        }

        // Record history when a message arrives, rather than in a render effect.
        setAnalytics(snapshot)
        setLastUpdated(receivedAt)
        setTrafficData((previousPoints) => {
          const updatedPoints = [...previousPoints, trafficPoint]
          return updatedPoints.slice(-MAX_TRAFFIC_POINTS)
        })
      } catch {
        setConnectionStatus('error')
      }
    }

    function connect() {
      if (stopped) return

      setConnectionStatus('connecting')
      socket = new WebSocket(STREAM_URL)

      socket.addEventListener('open', () => {
        if (stopped) return
        setConnectionStatus('connected')
        retryDelay = INITIAL_RETRY_DELAY
      })

      socket.addEventListener('message', handleMessage)

      socket.addEventListener('error', () => {
        if (!stopped) setConnectionStatus('error')
      })

      socket.addEventListener('close', () => {
        if (stopped) return

        // Retry more slowly after repeated failures, up to a 30-second delay.
        setConnectionStatus('disconnected')
        retryTimer = setTimeout(connect, retryDelay)
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY)
      })
    }

    connect()

    // Prevent reconnects and state updates after the component is removed.
    return () => {
      stopped = true
      clearTimeout(retryTimer)
      socket?.close()
    }
  }, [])

  return { analytics, trafficData, connectionStatus, lastUpdated }
}
