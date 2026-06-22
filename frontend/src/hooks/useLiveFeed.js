import { useEffect, useMemo, useRef, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '')

export { API_BASE }

export function useLiveFeed() {
  const [leads, setLeads] = useState([])
  const [router, setRouter] = useState({
    isEnabled: true,
    isConnected: false,
    statusMessage: 'Checking HubSpot router...',
  })
  const [analytics, setAnalytics] = useState({ totalLeads: 0, totalPipelineValue: 0 })
  const [sseStatus, setSseStatus] = useState('connecting')
  const eventSourceRef = useRef(null)

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
    let es
    let retryTimeout

    const connect = () => {
      es = new EventSource(`${API_BASE}/leads/stream/`)
      eventSourceRef.current = es
      setSseStatus('connecting')

      es.onopen = () => setSseStatus('connected')

      es.onmessage = (event) => {
        if (!event.data || event.data.trim() === '') return
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'snapshot') {
            setLeads(payload.leads || [])
            setAnalytics(payload.analytics || { totalLeads: 0, totalPipelineValue: 0 })
            if (payload.router) setRouter(payload.router)
            setSseStatus('connected')
            return
          }
          if (payload.lead) {
            setLeads((prev) => {
              const rest = prev.filter((l) => l.id !== payload.lead.id)
              return [payload.lead, ...rest]
            })
          }
          if (payload.analytics) setAnalytics(payload.analytics)
          if (payload.router) setRouter(payload.router)
        } catch (err) {
          console.error('SSE parse error', err)
        }
      }

      es.onerror = () => {
        setSseStatus('error')
        es.close()
        retryTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      clearTimeout(retryTimeout)
      if (es) es.close()
    }
  }, [])

  const toggleRouter = async () => {
    const next = !router.isEnabled
    const res = await fetch(`${API_BASE}/router/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled: next }),
    })
    const data = await res.json()
    if (res.ok && data.router) setRouter(data.router)
  }

  return { leads, router, analytics, sseStatus, currencyFormatter, toggleRouter }
}
