/**
 * Helpers for formatting and enriching user records in API responses.
 */

export const formatRefStatus = (refactcount, refcount) =>
  `${refactcount ?? 0} / ${refcount ?? 0}`

export const formatTeamStatus = (teamactcount, teamcount) =>
  `${teamactcount ?? 0} / ${teamcount ?? 0}`

export const enrichUserStats = (user) => {
  const data = typeof user.toJSON === 'function' ? user.toJSON() : { ...user }
  return {
    ...data,
    refStatus: formatRefStatus(data.refactcount, data.refcount),
    teamStatus: formatTeamStatus(data.teamactcount, data.teamcount),
    activeStatus: data.active ? 'Active' : 'Inactive',
  }
}

export const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}
