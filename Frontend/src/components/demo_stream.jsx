import { useEffect, useState } from 'react'

export default function DemoStreamControls({ preview, onShowLive }) {
  const [rate, setRate] = useState('5')
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let stopped = false
    const controller = new AbortController()
    // Poll server-owned state so refreshes and other tabs show the same running task.
    async function refresh() {
      try {
        const response = await fetch('/api/demo-stream', { signal: controller.signal })
        if (!response.ok) throw new Error('Unavailable')
        const data = await response.json()
        if (!stopped) setStatus(data)
      } catch {
        if (!stopped) setStatus(null)
      }
    }
    refresh()
    const interval = setInterval(refresh, 1500)
    return () => { stopped = true; controller.abort(); clearInterval(interval) }
  }, [])

  const valid = /^\d+$/.test(rate) && Number(rate) >= 1 && Number(rate) <= 20
  async function control() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/demo-stream', {
        method: status?.running ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(status?.running ? {} : { body: JSON.stringify({ target_rate: Number(rate) }) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Unable to start demo stream.')
      setStatus(data)
      if (data.running) onShowLive()
    } catch (failure) { setError(failure.message || 'Unable to contact the backend.') }
    finally { setBusy(false) }
  }

  return <section className="generator-controls" aria-label="Synthetic event generator">
    <div className="generator-description"><strong>Demo event stream</strong><p>Writes synthetic events to your database. Stops automatically after 60 seconds.</p></div>
    <div className="generator-actions"><label htmlFor="demo-rate">Target events/sec<input id="demo-rate" type="number" min="1" max="20" step="1" value={rate} onChange={event => setRate(event.target.value)} disabled={busy || status?.running} aria-invalid={!valid} /></label><button className={`generator-button ${status?.running ? 'stop' : ''}`} onClick={control} disabled={busy || (!status?.running && (!valid || !status?.enabled || preview))}>{busy ? 'Please wait…' : status?.running ? 'Stop stream' : 'Start demo stream'}</button></div>
    <p className="generator-status" role="status">{error || status?.error || (status?.running ? `Synthetic events running · ${status.generated} stored · ${status.remaining_seconds}s remaining` : !status ? 'Connect the backend to enable streaming.' : !status.enabled ? 'Demo streaming is disabled on this server.' : preview ? 'Switch to Live data to generate events.' : `Ready · ${status.generated} events stored in last run · 1–20 events/sec`)}</p>
  </section>
}
