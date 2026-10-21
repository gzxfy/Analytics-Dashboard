import { Link } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'

const STEPS = [
  { name: 'Ingest', detail: 'POST /events validates platform, topic, sentiment' },
  { name: 'Store', detail: 'Async SQLAlchemy writes each event to PostgreSQL' },
  { name: 'Aggregate', detail: 'GET /analytics returns topic, platform, sentiment counts' },
  { name: 'Stream', detail: 'WebSocket /ws/analytics pushes snapshots ~4× per second' },
]

export default function Landing() {
  return (
    <div className="page">
      <SiteHeader />

      <main>
        <section className="shell landing-hero">
          <h1>Event Analytics</h1>
          <p className="landing-hero__pitch">
            Real-time event counts from ingest to browser.
          </p>
          <p className="landing-hero__body">
            FastAPI accepts events, PostgreSQL keeps them, and a React client
            redraws live aggregates over a WebSocket—built to practice backend
            pipelines, not chase UI chrome.
          </p>
          <div className="landing-hero__actions">
            <Link to="/dashboard" className="btn-primary">
              Open live dashboard
            </Link>
            <a
              href="http://127.0.0.1:8000/docs"
              className="link-quiet"
              target="_blank"
              rel="noreferrer"
            >
              API docs →
            </a>
          </div>
        </section>

        <section className="landing-panel">
          <div className="shell">
            <p className="section-label">How it works</p>
            <ol className="flow-list">
              {STEPS.map((step, index) => (
                <li key={step.name}>
                  <span className="flow-list__num">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3>{step.name}</h3>
                  <p>{step.detail}</p>
                </li>
              ))}
            </ol>

            <dl className="stack-block">
              <dt className="section-label">Stack</dt>
              <dd>
                FastAPI · Pydantic · SQLAlchemy (async) · PostgreSQL · Alembic ·
                React · Vite · Recharts · WebSockets
              </dd>
            </dl>
          </div>
        </section>
      </main>
    </div>
  )
}
