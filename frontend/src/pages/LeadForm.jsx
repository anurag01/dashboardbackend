import { useState } from 'react'
import { API_BASE } from '../hooks/useLiveFeed'
import './LeadForm.css'

const initialForm = {
  firstName: '',
  lastName: '',
  corporateEmail: '',
  companyName: '',
  estimatedAnnualBudget: 'UNDER_10K',
}

export default function LeadForm() {
  const [formData, setFormData] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch(`${API_BASE}/leads/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed.')
      setFormData(initialForm)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page form-page">
      <div className="form-card">
        <div className="form-intro">
          <p className="eyebrow">Get in Touch</p>
          <h1>Tell us about your project</h1>
          <p className="form-sub">
            Fill in your details and our team will reach out. All information is kept confidential.
          </p>
        </div>

        {success && (
          <div className="success-banner">
            ✓ Thank you! Your submission has been received. We'll be in touch shortly.
          </div>
        )}

        <form onSubmit={onSubmit} className="lead-form">
          <div className="form-row">
            <label>
              First Name
              <input
                name="firstName"
                value={formData.firstName}
                onChange={onChange}
                placeholder="Jane"
                required
              />
            </label>
            <label>
              Last Name
              <input
                name="lastName"
                value={formData.lastName}
                onChange={onChange}
                placeholder="Smith"
                required
              />
            </label>
          </div>

          <label>
            Corporate Email
            <input
              type="email"
              name="corporateEmail"
              value={formData.corporateEmail}
              onChange={onChange}
              placeholder="jane@company.com"
              required
            />
          </label>

          <label>
            Company Name
            <input
              name="companyName"
              value={formData.companyName}
              onChange={onChange}
              placeholder="Acme Corp"
              required
            />
          </label>

          <label>
            Estimated Annual Budget
            <select
              name="estimatedAnnualBudget"
              value={formData.estimatedAnnualBudget}
              onChange={onChange}
            >
              <option value="UNDER_10K">Under $10k</option>
              <option value="10K_TO_50K">$10k – $50k</option>
              <option value="ABOVE_50K">Greater than $50k</option>
            </select>
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'Submitting…' : 'Submit →'}
          </button>
        </form>
      </div>
    </main>
  )
}
