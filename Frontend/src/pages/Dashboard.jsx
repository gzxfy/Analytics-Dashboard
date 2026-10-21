import { SiteHeader } from '../components/SiteHeader'
import { DashboardCards } from '../components/dashboard_cards'
import LiveTrafficGraph from '../components/graph'
import { BreakdownCharts } from '../components/BreakdownCharts'
import { EventsTable } from '../components/EventsTable'
import { useAnalyticsSocket } from '../hooks/useAnalyticsSocket'
import { useRecentEvents } from '../hooks/useRecentEvents'

export default function Dashboard() {
  const { analytics, trafficData, connectionStatus } = useAnalyticsSocket()
  const { events, status: eventsStatus, error: eventsError } = useRecentEvents(20, 3000)

  return (
    <div className="min-h-screen">
      <SiteHeader connectionStatus={connectionStatus} showStatus />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-sans text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Live dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink-muted">
              Snapshots from <span className="font-mono text-xs">/ws/analytics</span>.
              Counts persist in PostgreSQL; events/sec is a rolling process window.
            </p>
          </div>
        </div>

        {!analytics ? (
          <p className="mt-12 font-mono text-sm text-ink-muted">
            Waiting for stream…
          </p>
        ) : (
          <div className="mt-10 space-y-14">
            <DashboardCards analytics={analytics} />

            <section>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-sans text-lg font-semibold tracking-tight text-ink">
                  Live traffic
                </h2>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">
                  Events / second
                </p>
              </div>
              <div className="mt-4">
                <LiveTrafficGraph data={trafficData} />
              </div>
            </section>

            <BreakdownCharts analytics={analytics} />
          </div>
        )}

        <div className="mt-16">
          <EventsTable events={events} status={eventsStatus} error={eventsError} />
        </div>
      </main>
    </div>
  )
}
