import { useLiveFeed } from '../hooks/useLiveFeed'
import './Dashboard.css'

const SSE_LABEL = { connecting: 'Connecting…', connected: 'Live', error: 'Reconnecting…' }
const SSE_DOT   = { connecting: 'pending',     connected: 'online', error: 'offline' }

export default function Dashboard() {
  const { leads, router, analytics, sseStatus, currencyFormatter, toggleRouter } = useLiveFeed()

  const statusClass = (v) => v.toLowerCase()

  return (
    <main className="page dash-page">
      <div className="dash-header">
        <div>
          <h1>Internal Dashboard</h1>
          <p className="dash-sub">Real-time lead tracking and HubSpot sync monitoring.</p>
        </div>
        <div className="sse-pill">
          <span className={`dot sm ${SSE_DOT[sseStatus]}`}></span>
          {SSE_LABEL[sseStatus]}
        </div>
      </div>

      {/* Analytics Badges */}
      <div className="dash-metrics">
        <article className="metric-badge">
          <span>Total Leads</span>
          <strong>{analytics.totalLeads}</strong>
        </article>
        <article className="metric-badge">
          <span>Pipeline Value</span>
          <strong>{currencyFormatter.format(analytics.totalPipelineValue)}</strong>
        </article>
        <article className="metric-badge">
          <span>HubSpot</span>
          <strong className={router.isConnected ? 'text-green' : 'text-muted'}>
            {router.isConnected ? 'Connected' : 'Disconnected'}
          </strong>
        </article>
        <article className="metric-badge">
          <span>Router</span>
          <strong className={router.isEnabled ? 'text-green' : 'text-muted'}>
            {router.isEnabled ? 'Active' : 'Paused'}
          </strong>
        </article>
      </div>

      {/* Router Control */}
      <section className="dash-router">
        <div className="dash-router-left">
          <span className={`dot lg ${router.isConnected ? 'online' : 'offline'}`}></span>
          <div>
            <p className="router-msg">
              HubSpot: {router.isConnected ? 'Connected' : 'Disconnected'} &mdash;{' '}
              Routing: {router.isEnabled ? 'Enabled' : 'Paused'}
            </p>
            <p className="router-note">{router.statusMessage || 'Waiting for first sync…'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleRouter}
          className={`router-toggle ${router.isEnabled ? 'pause' : 'resume'}`}
        >
          {router.isEnabled ? '⏸ Pause HubSpot Routing' : '▶ Resume HubSpot Routing'}
        </button>
      </section>

      {/* Live Lead Feed Table */}
      <section className="dash-feed">
        <div className="feed-header">
          <h2>Live Lead Feed</h2>
          <span className="lead-count">{analytics.totalLeads} total</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Budget</th>
                <th>Local Status</th>
                <th>HubSpot Sync</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, idx) => (
                <tr key={lead.id} className="feed-row">
                  <td className="row-num">{idx + 1}</td>
                  <td>{lead.firstName} {lead.lastName}</td>
                  <td className="email-cell">{lead.corporateEmail}</td>
                  <td>{lead.companyName}</td>
                  <td>{lead.estimatedAnnualBudgetLabel}</td>
                  <td>
                    <span className={`badge ${statusClass(lead.localStatus)}`}>
                      {lead.localStatus}
                    </span>
                  </td>
                  <td>
                    <div>
                      <span className={`badge ${statusClass(lead.hubspotSyncStatus)}`}>
                        {lead.hubspotSyncStatus}
                      </span>
                      {lead.hubspotMessage && (
                        <p className="hs-msg">{lead.hubspotMessage}</p>
                      )}
                    </div>
                  </td>
                  <td className="date-cell">
                    {new Date(lead.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No leads yet. Submit one using the public form.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
