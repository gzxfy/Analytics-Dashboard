/** Empty API base = same-origin (Vite proxy in dev). */
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

/**
 * WebSocket URL for analytics snapshots.
 * Default uses current host so Vite can proxy `/ws/analytics`.
 */
export function getAnalyticsWsUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/analytics`
}

export function eventsUrl(limit = 20, offset = 0) {
  return `${API_BASE}/events?limit=${limit}&offset=${offset}`
}
