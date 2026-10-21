import { useEffect, useState } from 'react'
import { eventsUrl } from '../config'

/**
 * Polls GET /events for a recent page of stored events.
 */
export function useRecentEvents(limit = 20, intervalMs = 3000) {
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    let timer

    async function fetchEvents() {
      try {
        const response = await fetch(eventsUrl(limit, 0))
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        if (cancelled) return
        setEvents(data.events ?? [])
        setStatus('ok')
        setError(null)
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Failed to load events')
      }
    }

    fetchEvents()
    timer = setInterval(fetchEvents, intervalMs)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [limit, intervalMs])

  return { events, status, error }
}
