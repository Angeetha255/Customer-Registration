const API_BASE = import.meta.env.VITE_API_BASE || '/api'

import { SESSION_TYPES, getToken } from '../utils/sessionIsolation.js'

// Separate token getters for admin and customer
const getAdminToken = () => getToken(SESSION_TYPES.ADMIN)
const getUserToken = () => getToken(SESSION_TYPES.CUSTOMER)

// Admin headers — uses adminToken only
const adminHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAdminToken()}`,
})

// Customer headers — uses userToken only
const userHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getUserToken()}`,
})

// Generic send with explicit headers
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

// Customer: fetch current logged-in customer
export const fetchMe = () =>
  send('/users/me', { headers: userHeaders() })

// Admin: fetch current logged-in admin
export const fetchMeAdmin = () =>
  send('/users/me', { headers: adminHeaders() })

// Customer profile
export const updateProfile = (data) =>
  send('/users/me', {
    method: 'PUT',
    headers: userHeaders(),
    body: JSON.stringify(data),
  })

// Admin-only endpoints — use adminHeaders
export const fetchAdminStats = () =>
  send('/users/stats', { headers: adminHeaders() })

export const fetchAdminCustomers = (params) => {
  const query = new URLSearchParams(params).toString()
  return send(`/users?${query}`, { headers: adminHeaders() })
}

export const deleteCustomer = (id) =>
  send(`/users/${id}`, { method: 'DELETE', headers: adminHeaders() })

export const updateCustomer = (id, data) =>
  send(`/users/${id}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(data),
  })

export const exportCustomers = (format = 'csv') =>
  fetch(`${API_BASE}/users/export?format=${format}`, { headers: adminHeaders() })

export const fetchReferredCustomers = () =>
  send('/users/referred/list', { headers: userHeaders() })

// Admin settings
export const fetchSettings = () =>
  send('/users/settings', { headers: adminHeaders() })

export const updateSetting = (key, value) =>
  send('/users/settings', {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify({ key, value }),
  })

// Admin: Reset database and set Top ID
export const resetDatabase = (data) =>
  send('/users/reset-db', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(data),
  })

// Admin: Create first Top ID (when no users exist)
export const createFirstTopId = (data) =>
  send('/users/create-first-top-id', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(data),
  })

// Admin: Set Top ID from existing user
export const setTopId = (userId) =>
  send('/users/top-id', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ userId }),
  })

// Admin: Update Top ID details
export const updateTopId = (data) =>
  send('/users/top-id', {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(data),
  })

// Level-based team view (admin can view any user, customer views own)
export const fetchLevelSummary = (userId) =>
  send(userId ? `/users/level-summary?userId=${encodeURIComponent(userId)}` : '/users/level-summary', { headers: userHeaders() })

export const fetchLevelUsers = (level, userId) =>
  send(userId ? `/users/level-users/${encodeURIComponent(level)}?userId=${encodeURIComponent(userId)}` : `/users/level-users/${encodeURIComponent(level)}`, { headers: userHeaders() })

// Genealogy pages (customer endpoints)
export const fetchMyDirect = () =>
  send('/users/my-direct', { headers: userHeaders() })

export const fetchMyTeam = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return send(`/users/my-team${query ? `?${query}` : ''}`, { headers: userHeaders() })
}

export const fetchTeamView = (userId) =>
  send(userId ? `/users/team-view/${userId}` : '/users/team-view', { headers: userHeaders() })

export const fetchTeamViewChildren = (parentId) =>
  send(`/users/team-view/children/${parentId}`, { headers: userHeaders() })

export const searchTeamView = (q) =>
  send(`/users/team-view/search?q=${encodeURIComponent(q)}`, { headers: userHeaders() })

export const loginWithApi = login

// Business Directory endpoints
export const createBusiness = (data) =>
  send('/business', {
    method: 'POST',
    headers: userHeaders(),
    body: JSON.stringify(data),
  })

export const createProduct = (formData) =>
  fetch(`${API_BASE}/business/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getUserToken()}`,
    },
    body: formData,
  }).then(async (res) => {
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(body?.message || res.statusText)
    }
    return body
  })

export const fetchBusinesses = () =>
  send('/business', { headers: userHeaders() })

export const fetchBusiness = (id) =>
  send(`/business/${id}`, { headers: userHeaders() })

export const fetchBusinessProducts = (businessId) =>
  send(`/business/${businessId}/products`, { headers: userHeaders() })
