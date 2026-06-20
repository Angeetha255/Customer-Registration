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

// New: Get Top ID info
export const fetchTopId = () => send('/auth/top-id')

// New: Check referral validity
export const checkReferral = (refId) =>
  send(`/auth/check-referral/${encodeURIComponent(refId)}`)

export const registerCustomer = (data) =>
  send('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

// Fetch referrer by their numeric primary key id
export const fetchReferrer = (userId) =>
  send(`/auth/referrer/${encodeURIComponent(userId)}`)

export const login = (credentials) =>
  send('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

export const loginAdmin = (credentials) =>
  send('/auth/admin/login', {
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
  send('/users/me', { headers: authHeaders() })

export const updateProfile = (data) =>
  send('/users/me', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

export const fetchAdminStats = () =>
  send('/users/stats', { headers: authHeaders() })

export const fetchAdminCustomers = (params) => {
  const query = new URLSearchParams(params).toString()
  return send(`/users?${query}`, { headers: authHeaders() })
}

export const deleteCustomer = (id) =>
  send(`/users/${id}`, { method: 'DELETE', headers: authHeaders() })

export const updateCustomer = (id, data) =>
  send(`/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

export const exportCustomers = (format = 'csv') =>
  fetch(`${API_BASE}/users/export?format=${format}`, { headers: authHeaders() })

export const fetchReferredCustomers = () =>
  send('/users/referred/list', { headers: authHeaders() })

// Admin settings
export const fetchSettings = () =>
  send('/users/settings', { headers: authHeaders() })

export const updateSetting = (key, value) =>
  send('/users/settings', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ key, value }),
  })

// New: Reset database and set Top ID
export const resetDatabase = (data) =>
  send('/users/reset-db', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

// New: Update Top ID details
export const updateTopId = (data) =>
  send('/users/top-id', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

// Level-based team view
export const fetchLevelSummary = (userId) =>
  send(userId ? `/users/level-summary?userId=${encodeURIComponent(userId)}` : '/users/level-summary', { headers: authHeaders() })

export const fetchLevelUsers = (level, userId) =>
  send(userId ? `/users/level-users/${encodeURIComponent(level)}?userId=${encodeURIComponent(userId)}` : `/users/level-users/${encodeURIComponent(level)}`, { headers: authHeaders() })

// Genealogy pages
export const fetchMyDirect = () =>
  send('/users/my-direct', { headers: authHeaders() })

export const fetchMyTeam = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return send(`/users/my-team${query ? `?${query}` : ''}`, { headers: authHeaders() })
}

export const fetchTeamView = (userId) =>
  send(userId ? `/users/team-view/${userId}` : '/users/team-view', { headers: authHeaders() })

export const fetchTeamViewChildren = (parentId) =>
  send(`/users/team-view/children/${parentId}`, { headers: authHeaders() })

export const searchTeamView = (q) =>
  send(`/users/team-view/search?q=${encodeURIComponent(q)}`, { headers: authHeaders() })

export const loginWithApi = login
