import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '')

const initialForm = {
  firstName: '',
  lastName: '',
  corporateEmail: '',
  companyName: '',
  estimatedAnnualBudget: 'UNDER_10K',
}

function App() {
  const [formData, setFormData] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [leads, setLeads] = useState([])
  const [router, setRouter] = useState({
    isEnabled: true,
    isConnected: false,
    statusMessage: 'Checking HubSpot router...',
  })
  const [analytics, setAnalytics] = useState({ totalLeads: 0, totalPipelineValue: 0 })

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    [],
  )

  useEffect(() => {
    const loadSnapshot = async () => {
      const response = await fetch(`${API_BASE}/dashboard/`)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard snapshot.')
      }
      const payload = await response.json()
      setLeads(payload.leads || [])
      setAnalytics(payload.analytics || { totalLeads: 0, totalPipelineValue: 0 })
      setRouter(
        payload.router || {
          isEnabled: true,
          isConnected: false,
          statusMessage: 'Checking HubSpot router...',
        },
      )
    }

    loadSnapshot().catch((err) => {
      setSubmitError(err.message)
    })

    const events = new EventSource(`${API_BASE}/leads/stream/`)
    events.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'snapshot') {
          setLeads(payload.leads || [])
          setAnalytics(payload.analytics || { totalLeads: 0, totalPipelineValue: 0 })
          setRouter(
            payload.router || {
              isEnabled: true,
              isConnected: false,
              statusMessage: 'Checking HubSpot router...',
            },
          )
          return
        }
        if (payload.lead) {
          setLeads((current) => {
            const withoutLead = current.filter((item) => item.id !== payload.lead.id)
            return [payload.lead, ...withoutLead]
          })
        }
        if (payload.analytics) {
          setAnalytics(payload.analytics)
        }
        if (payload.router) {
          setRouter(payload.router)
        }
      } catch (err) {
        console.error('Unable to parse SSE payload', err)
      }
    }

    return () => {
      events.close()
    }
  }, [])

  const onChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch(`${API_BASE}/leads/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Lead submission failed.')
      }
      setFormData(initialForm)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onRouterToggle = async () => {
    const nextState = !router.isEnabled
    try {
      const response = await fetch(`${API_BASE}/router/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: nextState }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update router state.')
      }
      setRouter(payload.router)
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  const statusClass = (value) => value.toLowerCase()

  return (
    <main className="portal-shell">
      <section className="hero-card">
        <p className="eyebrow">Lead Distribution Portal</p>
        <h1>Capture leads and route them to HubSpot in real-time.</h1>
        <p className="hero-copy">
          Submit prospects from the public form, track sync status instantly, and monitor pipeline
          health from one dashboard.
        </p>
        <div className="metrics-row">
          <article className="metric-chip">
            <span>Total Leads</span>
            <strong>{analytics.totalLeads}</strong>
          </article>
          <article className="metric-chip">
            <span>Pipeline Value</span>
            <strong>{currencyFormatter.format(analytics.totalPipelineValue)}</strong>
          </article>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel form-panel">
          <h2>Public Lead Form</h2>
          <form onSubmit={onSubmit}>
            <label>
              First Name
              <input name="firstName" value={formData.firstName} onChange={onChange} required />
            </label>
            <label>
              Last Name
              <input name="lastName" value={formData.lastName} onChange={onChange} required />
            </label>
            <label>
              Corporate Email
              <input
                type="email"
                name="corporateEmail"
                value={formData.corporateEmail}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Company Name
              <input name="companyName" value={formData.companyName} onChange={onChange} required />
            </label>
            <label>
              Estimated Annual Budget
              <select
                name="estimatedAnnualBudget"
                value={formData.estimatedAnnualBudget}
                onChange={onChange}
              >
                <option value="UNDER_10K">Under $10k</option>
                <option value="10K_TO_50K">$10k-$50k</option>
                <option value="ABOVE_50K">Greater than $50k</option>
              </select>
            </label>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Lead'}
            </button>
            {submitError && <p className="error-message">{submitError}</p>}
          </form>
        </article>

        <article className="panel router-panel">
          <h2>HubSpot Router Control</h2>
          <div className="router-status">
            <span className={`dot ${router.isConnected ? 'online' : 'offline'}`}></span>
            <div>
              <strong>{router.isConnected ? 'Connected' : 'Disconnected'}</strong>
              <p>{router.statusMessage || 'No status message yet.'}</p>
            </div>
          </div>
          <button
            type="button"
            className={`toggle ${router.isEnabled ? 'enabled' : 'disabled'}`}
            onClick={onRouterToggle}
          >
            {router.isEnabled ? 'Disable Router' : 'Enable Router'}
          </button>
          <p className="router-note">
            Router is currently <strong>{router.isEnabled ? 'enabled' : 'disabled'}</strong>.
          </p>
        </article>
      </section>

      <section className="panel table-panel">
        <h2>Live Lead Feed</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Budget</th>
                <th>Local Status</th>
                <th>HubSpot Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.firstName} {lead.lastName}</td>
                  <td>{lead.corporateEmail}</td>
                  <td>{lead.companyName}</td>
                  <td>{lead.estimatedAnnualBudgetLabel}</td>
                  <td>
                    <span className={`badge ${statusClass(lead.localStatus)}`}>{lead.localStatus}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusClass(lead.hubspotSyncStatus)}`}>
                      {lead.hubspotSyncStatus}
                    </span>
                  </td>
                  <td>{new Date(lead.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No leads submitted yet.
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

export default App
