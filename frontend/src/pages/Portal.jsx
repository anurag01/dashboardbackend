import { Link } from 'react-router-dom'
import { useLiveFeed } from '../hooks/useLiveFeed'
import './Portal.css'

const SSE_LABEL = { connecting: 'Connecting…', connected: 'Live', error: 'Reconnecting…' }
const SSE_DOT   = { connecting: 'pending',     connected: 'online', error: 'offline' }

export default function Portal() {
  const { leads, analytics, router, sseStatus, currencyFormatter, toggleRouter } = useLiveFeed()

  const statusClass = (v) => v.toLowerCase()

  return (
    <main className="page portal-page">
      {/* Hero */}
      <section className="portal-hero">
        <p className="eyebrow">Lead Distribution Portal</p>
        <h1>Capture, route, and track leads in real-time.</h1>
        <p className="hero-copy">
          Prospects submit via the public form, leads are stored locally and pushed to HubSpot CRM
          automatically.
        </p>
        <Link to="/form" className="cta-btn primary">+ Submit a Lead</Link>
      </section>

      {/* Analytics Badges */}
      <section className="portal-cards">
        <article className="stat-card">
          <span className="stat-label">Total Leads Ingested</span>
          <strong className="stat-value">{analytics.totalLeads}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Estimated Pipeline Value</span>
          <strong className="stat-value">{currencyFormatter.format(analytics.totalPipelineValue)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Live Feed Status</span>
          <strong className="stat-value">
            <span className={`dot ${SSE_DOT[sseStatus]}`}></span>
            {SSE_LABEL[sseStatus]}
          </strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">HubSpot</span>
          <strong className={`stat-value ${router.isConnected ? 'text-green' : ''}`}>
            {router.isConnected ? 'Connected' : 'Disconnected'}
          </strong>
        </article>
      </section>

      {/* HubSpot Router Control */}
      <section className="router-section">
        <div className="router-header">
          <h2>HubSpot Router Control</h2>
          <span className={`badge ${router.isConnected ? 'synced' : 'failed'}`}>
            {router.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="router-body">
          <div className="router-status">
            <span className={`dot lg ${router.isConnected ? 'online' : 'offline'}`}></span>
            <div>
              <p className="router-msg">{router.statusMessage || 'Waiting for first sync…'}</p>
              <p className="router-state">
                Routing is currently <strong>{router.isEnabled ? 'enabled' : 'disabled'}</strong>.
                {' '}New leads will be{' '}
                {router.isEnabled ? 'sent to HubSpot automatically.' : 'queued locally — not sent to HubSpot.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`toggle-btn ${router.isEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleRouter}
          >
            {router.isEnabled ? '⏸ Pause Router' : '▶ Enable Router'}
          </button>
        </div>
      </section>

      {/* Live Lead Feed */}
      <section className="feed-section">
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
                  <td className="date-cell">{new Date(lead.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No leads yet.{' '}
                    <Link to="/form">Submit the first one →</Link>
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
