import { useState } from 'react'
import { Dashboard_Cards } from './components/dashboard_cards'
import DemoStreamControls from './components/demo_stream'
import {
  StreamToolbar,
  TrafficPanel,
  BreakdownPanel,
  TopicsPanel,
} from './components/dashboard_sections'
import useAnalyticsStream from './hooks/useAnalyticsStream'
import { demoSnapshot, demoTraffic } from './data/demo_data'
import './App.css'

export default function App() {
  const [showPreview, setShowPreview] = useState(false)
  const { analytics, trafficData, connectionStatus, lastUpdated } = useAnalyticsStream()

  // Select one source for all dashboard sections, so preview and live data never mix.
  const displayedAnalytics = showPreview ? demoSnapshot : analytics
  const displayedTraffic = showPreview ? demoTraffic : trafficData
  const isConnected = connectionStatus === 'connected'

  let notice = ''
  if (showPreview) {
    notice = 'You’re exploring sample data. Switch to Live data to view your connected event stream.'
  } else if (!isConnected && analytics) {
    notice = 'Connection interrupted. Showing the last snapshot while we reconnect.'
  } else if (!isConnected) {
    notice = 'Your dashboard is ready. Start your event stream, or select Try demo to explore a sample.'
  }

  return (
    <div className="app-shell">
      <div className="main-shell">
        <main id="overview">
          <StreamToolbar
            showPreview={showPreview}
            onChangePreview={setShowPreview}
            connectionStatus={connectionStatus}
            lastUpdated={lastUpdated}
          />

          {notice && <div className="notice">{notice}</div>}

          <Dashboard_Cards analytics={displayedAnalytics} />

          {/* Unlike preview mode, the generator stores real synthetic events. */}
          <DemoStreamControls
            preview={showPreview}
            onShowLive={() => setShowPreview(false)}
          />

          <TrafficPanel data={displayedTraffic} showPreview={showPreview} />

          <div className="audience-grid" id="audience">
            <BreakdownPanel
              title="Platform mix"
              description="Where the conversation happens"
              symbol="◎"
              counts={displayedAnalytics?.platform_counts}
            />
            <BreakdownPanel
              title="Sentiment signals"
              description="The tone behind your events"
              symbol="◒"
              counts={displayedAnalytics?.sentiment_counts}
              sentiment
            />
          </div>

          <TopicsPanel
            counts={displayedAnalytics?.topic_counts}
            totalEvents={displayedAnalytics?.total_events ?? 0}
          />
        </main>
      </div>
    </div>
  )
}
