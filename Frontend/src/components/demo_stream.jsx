import { useEffect, useState } from 'react'
import { DEMO_STREAM_URL } from '../config.js'

const POLL_INTERVAL = 1500
const MIN_RATE = 1
const MAX_RATE = 20

export default function DemoStreamControls({ preview, onShowLive }) {
  // Keep the input as text so users can clear it while entering a new rate.
  const [targetRate, setTargetRate] = useState('5')
  const [streamStatus, setStreamStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestError, setRequestError] = useState('')

  useEffect(() => {
    let stopped = false
    const abortController = new AbortController()

    // The server owns the task. Polling also picks up changes from other tabs.
    async function refreshStatus() {
      try {
        const response = await fetch(DEMO_STREAM_URL, { signal: abortController.signal })
        if (!response.ok) throw new Error('Status unavailable')

        const currentStatus = await response.json()
        if (!stopped) setStreamStatus(currentStatus)
      } catch {
        if (!stopped) setStreamStatus(null)
      }
    }

    refreshStatus()
    const pollTimer = setInterval(refreshStatus, POLL_INTERVAL)

    return () => {
      stopped = true
      abortController.abort()
      clearInterval(pollTimer)
    }
  }, [])
  // Convert the target rate to a number for validation and submission.
  const numericRate = Number(targetRate)
  const isValidRate = /^\d+$/.test(targetRate)
    && numericRate >= MIN_RATE
    && numericRate <= MAX_RATE
  const isRunning = Boolean(streamStatus?.running)
  const canStart = isValidRate && streamStatus?.enabled && !preview
  const isButtonDisabled = isSubmitting || (!isRunning && !canStart)

  async function handleStreamControl() {
    setIsSubmitting(true)
    setRequestError('')

    // Only start requests need a payload; stop requests cancel the shared task.
    const requestOptions = {
      method: isRunning ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
    if (!isRunning) {
      requestOptions.body = JSON.stringify({ target_rate: numericRate })
    }

    try {
      const response = await fetch(DEMO_STREAM_URL, requestOptions)
      const updatedStatus = await response.json()

      if (!response.ok) {
        const errorMessage = typeof updatedStatus.detail === 'string'
          ? updatedStatus.detail
          : 'Unable to start demo stream.'
        throw new Error(errorMessage)
      }

      setStreamStatus(updatedStatus)
      if (updatedStatus.running) onShowLive()
    } catch (error) {
      setRequestError(error.message || 'Unable to contact the backend.')
    } finally {
      setIsSubmitting(false)
    }
  }

  let buttonLabel = 'Start demo stream'
  if (isSubmitting) {
    buttonLabel = 'Please wait…'
  } else if (isRunning) {
    buttonLabel = 'Stop stream'
  }

  // Keep the status priority explicit: request errors, server errors, then progress.
  let statusMessage
  if (requestError) {
    statusMessage = requestError
  } else if (streamStatus?.error) {
    statusMessage = streamStatus.error
  } else if (isRunning) {
    statusMessage = `Synthetic events running · ${streamStatus.generated} stored · ${streamStatus.remaining_seconds}s remaining`
  } else if (!streamStatus) {
    statusMessage = 'Connect the backend to enable streaming.'
  } else if (!streamStatus.enabled) {
    statusMessage = 'Demo streaming is disabled on this server.'
  } else if (preview) {
    statusMessage = 'Switch to Live data to generate events.'
  } else {
    statusMessage = `Ready · ${streamStatus.generated} events stored in last run · 1–20 events/sec`
  }

  return (
    <section className="generator-controls" aria-label="Synthetic event generator">
      <div className="generator-description">
        <strong>Demo event stream</strong>
        <p>Writes synthetic events to your database. Stops automatically after 60 seconds.</p>
      </div>

      <div className="generator-actions">
        <label htmlFor="demo-rate">
          Target events/sec
          <input
            id="demo-rate"
            type="number"
            min={MIN_RATE}
            max={MAX_RATE}
            step="1"
            value={targetRate}
            onChange={(event) => setTargetRate(event.target.value)}
            disabled={isSubmitting || isRunning}
            aria-invalid={!isValidRate}
          />
        </label>
        <button
          className={`generator-button ${isRunning ? 'stop' : ''}`}
          onClick={handleStreamControl}
          disabled={isButtonDisabled}
        >
          {buttonLabel}
        </button>
      </div>

      <p className="generator-status" role="status">{statusMessage}</p>
    </section>
  )
}
