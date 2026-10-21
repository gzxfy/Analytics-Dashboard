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
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-6xl flex-col justify-center px-5 py-16 sm:px-8 sm:py-20">
          <h1 className="max-w-4xl font-sans text-5xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Event Analytics
          </h1>
          <p className="mt-5 max-w-2xl font-sans text-xl font-medium leading-snug text-teal sm:text-2xl">
            Real-time event counts from ingest to browser.
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            FastAPI accepts events, PostgreSQL keeps them, and a React client
            redraws live aggregates over a WebSocket—built to practice backend
            pipelines, not chase UI chrome.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center bg-teal px-5 py-3 font-mono text-xs font-medium uppercase tracking-wider text-paper no-underline transition-colors hover:bg-teal-deep hover:text-paper"
            >
              Open live dashboard
            </Link>
            <a
              href="http://127.0.0.1:8000/docs"
              className="font-mono text-xs uppercase tracking-wider text-ink-muted hover:text-teal"
              target="_blank"
              rel="noreferrer"
            >
              API docs →
            </a>
          </div>
        </section>

        <section className="border-t border-line bg-paper-deep/50">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-faint">
              How it works
            </h2>
            <ol className="mt-8 grid gap-0 sm:grid-cols-4">
              {STEPS.map((step, index) => (
                <li
                  key={step.name}
                  className="border-t border-line py-6 sm:border-t-0 sm:border-l sm:px-5 sm:py-0 sm:first:border-l-0 sm:first:pl-0"
                >
                  <span className="font-mono text-xs text-ink-faint">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-2 font-sans text-lg font-semibold tracking-tight text-ink">
                    {step.name}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {step.detail}
                  </p>
                </li>
              ))}
            </ol>

            <dl className="mt-14 border-t border-line pt-8">
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-faint">
                Stack
              </dt>
              <dd className="mt-3 font-mono text-sm leading-relaxed text-ink-muted">
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
