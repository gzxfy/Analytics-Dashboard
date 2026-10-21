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
    <div className="page">
      <SiteHeader connectionStatus={connectionStatus} showStatus />

      <main className="shell dashboard-main">
        <div className="dashboard-intro">
          <h1>Live dashboard</h1>
          <p>
            Snapshots from <code>/ws/analytics</code>. Counts persist in
            PostgreSQL; events/sec is a rolling process window.
          </p>
        </div>

        {!analytics ? (
          <p className="waiting">Waiting for stream…</p>
        ) : (
          <div className="dashboard-stack">
            <DashboardCards analytics={analytics} />

            <section>
              <div className="panel-head">
                <h2>Live traffic</h2>
                <p className="panel-head__meta">Events / second</p>
              </div>
              <LiveTrafficGraph data={trafficData} />
            </section>

            <BreakdownCharts analytics={analytics} />
          </div>
        )}

        <EventsTable events={events} status={eventsStatus} error={eventsError} />
      </main>
    </div>
  )
}
