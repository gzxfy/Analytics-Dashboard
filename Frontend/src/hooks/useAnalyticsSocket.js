import { useEffect, useState } from 'react'
import { getAnalyticsWsUrl } from '../config'

/**
 * Connects to the analytics WebSocket with exponential backoff reconnect.
 * Keeps the last 240 traffic points for the live EPS chart.
 */
export function useAnalyticsSocket() {
  const [analytics, setAnalytics] = useState(null)
  const [trafficData, setTrafficData] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  useEffect(() => {
    const initialDelayMs = 500
    const maxDelayMs = 30000

    let retryDelayMs = initialDelayMs
    let retryTimer
    let socket
    let stopped = false

    function connect() {
      if (stopped) return

      setConnectionStatus('connecting')
      socket = new WebSocket(getAnalyticsWsUrl())

      socket.addEventListener('open', () => {
        if (stopped) return
        setConnectionStatus('connected')
        retryDelayMs = initialDelayMs
      })

      socket.addEventListener('message', (message) => {
        if (stopped) return
        const snapshot = JSON.parse(message.data)
        const point = {
          time: Date.now(),
          eventsPerSecond: snapshot.events_per_second ?? 0,
        }
        setAnalytics(snapshot)
        setTrafficData((prev) => [...prev, point].slice(-240))
      })

      socket.addEventListener('error', () => {
        if (!stopped) setConnectionStatus('error')
      })

      socket.addEventListener('close', () => {
        if (stopped) return
        setConnectionStatus('disconnected')
        retryTimer = setTimeout(connect, retryDelayMs)
        retryDelayMs = Math.min(retryDelayMs * 2, maxDelayMs)
      })
    }

    connect()

    return () => {
      stopped = true
      clearTimeout(retryTimer)
      socket?.close()
    }
  }, [])

  return { analytics, trafficData, connectionStatus }
}
