const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const getToken = () => window.localStorage.getItem('authToken')
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
})

const send = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, options)
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || response.statusText)
  }
  return body
}

export const registerCustomer = (data) =>
  send('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const fetchIntroducer = (introducerId) =>
  send(`/auth/introducer/${encodeURIComponent(introducerId)}`)

export const login = (credentials) =>
  send('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

export const forgotPassword = (email) =>
  send('/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

export const resetPassword = (data) =>
  send('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const fetchMe = () =>
  send('/customers/me', { headers: authHeaders() })

export const updateProfile = (data) =>
  send('/customers/me', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

export const fetchAdminStats = () =>
  send('/customers/stats', { headers: authHeaders() })

export const fetchAdminCustomers = (params) => {
  const query = new URLSearchParams(params).toString()
  return send(`/customers?${query}`, { headers: authHeaders() })
}

export const deleteCustomer = (id) =>
  send(`/customers/${id}`, { method: 'DELETE', headers: authHeaders() })

export const updateCustomer = (id, data) =>
  send(`/customers/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

export const exportCustomers = (format = 'csv') =>
  fetch(`${API_BASE}/customers/export?format=${format}`, { headers: authHeaders() })

export const fetchReferredCustomers = () =>
  send('/customers/referred/list', { headers: authHeaders() })

export const loginWithApi = login
