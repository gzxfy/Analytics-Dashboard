// Public connection settings supplied when Vite builds the frontend.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const DEMO_STREAM_URL =
  `${apiBaseUrl.replace(/\/$/, '')}/demo-stream`

export const ANALYTICS_STREAM_URL =
  import.meta.env.VITE_WS_URL
  ?? 'ws://127.0.0.1:8000/ws/analytics'