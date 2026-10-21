import Live_Traffic_Graph from './graph'

export function StreamToolbar({
  showPreview,
  onChangePreview,
  connectionStatus,
  lastUpdated,
}) {
  let label = 'Stream disconnected'
  let indicatorClass = ''
  let timestamp = 'Waiting for your first snapshot'

  if (lastUpdated) {
    timestamp = `Last received ${new Date(lastUpdated).toLocaleTimeString()}`
  }

  if (showPreview) {
    label = 'Demo preview'
    indicatorClass = 'sample'
    timestamp = 'Illustrative sample data'
  } else if (connectionStatus === 'connected') {
    label = 'Live stream'
    indicatorClass = 'online'
  } else if (connectionStatus === 'connecting') {
    label = 'Connecting to stream'
  }

  return (
    <div className="stream-toolbar">
      <div className="stream-label" role="status">
        <i className={`status-dot ${indicatorClass}`} />
        {label}
        <span className="toolbar-divider" />
        <span className="muted">{timestamp}</span>
      </div>

      <div className="mode-switch">
        <button onClick={() => onChangePreview(false)} aria-pressed={!showPreview}>
          Live data
        </button>
        <button onClick={() => onChangePreview(true)} aria-pressed={showPreview}>
          Try demo
        </button>
      </div>
    </div>
  )
}

export function TrafficPanel({ data, showPreview }) {
  const sampleDescription = showPreview
    ? '60 illustrative samples'
    : `${data.length} recent samples`

  return (
    <section className="panel traffic-panel" id="traffic">
      <div className="panel-heading">
        <div>
          <h2>
            Conversation activity
            <span className="live-tag">{showPreview ? 'SAMPLE' : 'LIVE'}</span>
          </h2>
          <p>Incoming events per second across all platforms</p>
        </div>
        <span className="chart-legend">
          <i className="status-dot sample" />
          Event throughput
        </span>
      </div>

      <div className="traffic-chart">
        {data.length > 0 ? (
          <Live_Traffic_Graph data={data} />
        ) : (
          <div className="chart-empty">
            <span>⌁</span>
            <strong>Your next conversation starts here</strong>
            <p>Live traffic will appear as events arrive.</p>
          </div>
        )}
      </div>

      <div className="chart-footer">
        <span>
          <i className="status-dot sample" />
          {sampleDescription}
        </span>
        <span>Rolling window · up to 240 samples</span>
      </div>
    </section>
  )
}

export function BreakdownPanel({ title, description, symbol, counts, sentiment = false }) {
  // Sort a new array; never modify the analytics object received from the server.
  const sortedCounts = Object.entries(counts ?? {}).sort((first, second) => second[1] - first[1])
  const totalCount = sortedCounts.reduce((sum, [, count]) => sum + count, 0)
  const breakdownClass = sentiment ? 'breakdown sentiments' : 'breakdown'

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="panel-symbol">{symbol}</span>
      </div>

      <div className={breakdownClass}>
        {sortedCounts.length === 0 && (
          <p className="empty-copy">Your breakdown will appear as events arrive.</p>
        )}

        {sortedCounts.map(([name, count], index) => {
          const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0
          const colorClass = `color-${index % 5}`

          return (
            <div key={name}>
              <div className="row-label">
                <i className={`dot ${colorClass}`} />
                <span className="capitalize">{name}</span>
                <strong>{count.toLocaleString()}</strong>
                <span className="percentage">{Math.round(percentage)}%</span>
              </div>
              <div className="bar-track">
                <div
                  className={`bar-fill ${colorClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function TopicsPanel({ counts, totalEvents }) {
  const sortedTopics = Object.entries(counts ?? {}).sort((first, second) => second[1] - first[1])

  return (
    <section className="panel topics-panel" id="topics">
      <div className="panel-heading">
        <div>
          <h2>Topics in focus</h2>
          <p>What’s capturing attention across your stream</p>
        </div>
        <span className="count-badge">{sortedTopics.length} topics</span>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">TOPIC</th>
              <th scope="col">EVENTS</th>
              <th scope="col">SHARE OF CONVERSATION</th>
            </tr>
          </thead>
          <tbody>
            {sortedTopics.map(([name, count], index) => {
              // Use all events as the denominator, not just the top-ranked topic.
              const percentage = totalEvents > 0 ? (count / totalEvents) * 100 : 0
              const rank = String(index + 1).padStart(2, '0')

              return (
                <tr key={name}>
                  <td>
                    <span className="topic-rank">{rank}</span>
                    <span className="topic-name">{name}</span>
                  </td>
                  <td>{count.toLocaleString()}</td>
                  <td>
                    <div className="table-share">
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${percentage}%` }} />
                      </div>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {sortedTopics.length === 0 && (
          <p className="empty-copy">Topics will be ranked here when events arrive.</p>
        )}
      </div>
    </section>
  )
}
