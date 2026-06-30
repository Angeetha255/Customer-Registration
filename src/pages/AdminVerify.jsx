import { useState, useEffect } from 'react'
import { fetchCompanies, updateCompany } from '../services/api.js'
import Toast from '../components/Toast.jsx'

// Admin endpoint to fetch all companies
const fetchAllCompaniesAdmin = async () => {
  const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
  const response = await fetch('/api/company/admin/all', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch companies')
  }
  return data
}

const ITEMS_PER_PAGE = 10

export default function AdminVerify() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const fetchAllCompanies = async () => {
    setLoading(true)
    try {
      const data = await fetchAllCompaniesAdmin()
      setCompanies(data.companies || [])
    } catch (err) {
        console.error('Failed to fetch companies:', err)
        setToast({ message: 'Failed to load companies', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllCompanies()
  }, [])

  const handleToggle = async (companyId, field) => {
    setSaving(prev => ({ ...prev, [companyId]: true }))
    try {
      const company = companies.find(c => c.id === companyId)
      if (!company) return

      const updatedData = {
        businessName: company.businessName,
        email: company.email,
        mobileNumber: company.mobileNumber || '',
        ownerName: company.ownerName || '',
        yearOfEstablishment: company.yearOfEstablishment || '',
        gstNumber: company.gstNumber || '',
        yearlyTurnover: company.yearlyTurnover || '',
        numberOfEmployees: company.numberOfEmployees || '',
        country: company.country || 'India',
        state: company.state,
        district: company.district,
        area: company.area,
        pincode: company.pincode,
        mapLink: company.mapLink || '',
        telephoneNumber: company.telephoneNumber || '',
        additionalMobileNumber: company.additionalMobileNumber || '',
        verify: company.verify ? 0 : 1,
        trust: company.trust ? 0 : 1,
        quickResponse: company.quickResponse ? 0 : 1,
        topRated: company.topRated ? 0 : 1,
      }

      // Only toggle the specific field that was clicked
      if (field === 'verify') {
        updatedData.verify = company.verify ? 0 : 1
        updatedData.trust = company.trust
        updatedData.quickResponse = company.quickResponse
        updatedData.topRated = company.topRated
      } else if (field === 'trust') {
        updatedData.verify = company.verify
        updatedData.trust = company.trust ? 0 : 1
        updatedData.quickResponse = company.quickResponse
        updatedData.topRated = company.topRated
      } else if (field === 'quickResponse') {
        updatedData.verify = company.verify
        updatedData.trust = company.trust
        updatedData.quickResponse = company.quickResponse ? 0 : 1
        updatedData.topRated = company.topRated
      } else if (field === 'topRated') {
        updatedData.verify = company.verify
        updatedData.trust = company.trust
        updatedData.quickResponse = company.quickResponse
        updatedData.topRated = company.topRated ? 0 : 1
      }

      // Use admin update endpoint
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
      const response = await fetch(`/api/company/admin/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update company')
      }

      setCompanies(prev => prev.map(c => {
        if (c.id === companyId) {
          return {
            ...c,
            verify: field === 'verify' ? (c.verify ? 0 : 1) : c.verify,
            trust: field === 'trust' ? (c.trust ? 0 : 1) : c.trust,
            quickResponse: field === 'quickResponse' ? (c.quickResponse ? 0 : 1) : c.quickResponse,
            topRated: field === 'topRated' ? (c.topRated ? 0 : 1) : c.topRated,
          }
        }
        return c
      }))

      setToast({ message: 'Company updated successfully', type: 'success' })
    } catch (err) {
      console.error('Failed to update company:', err)
      setToast({ message: err.message || 'Failed to update company', type: 'error' })
    } finally {
      setSaving(prev => ({ ...prev, [companyId]: false }))
    }
  }

  const filteredCompanies = companies.filter(company => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      company.businessName?.toLowerCase().includes(query) ||
      company.email?.toLowerCase().includes(query) ||
      company.state?.toLowerCase().includes(query) ||
      company.district?.toLowerCase().includes(query) ||
      company.area?.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const getCategory = (company) => {
    if (company.businesses && company.businesses.length > 0) {
      return company.businesses[0].category || '—'
    }
    return '—'
  }

  const getCity = (company) => {
    return company.district || '—'
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Verify Companies</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading companies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Verify Companies</h1>
      </div>

      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}

      <div className="table-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          <p>No companies found.</p>
        </div>
      ) : (
        <>
          <div className="business-directory-table-container" style={{ margin: '1rem 0' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Category</th>
                  <th>City</th>
                  <th style={{ textAlign: 'center' }}>Verified</th>
                  <th style={{ textAlign: 'center' }}>Trusted</th>
                  <th style={{ textAlign: 'center' }}>Quick Response</th>
                  <th style={{ textAlign: 'center' }}>Top Rated</th>
                  
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.businessName}</td>
                    <td>{getCategory(company)}</td>
                    <td>{getCity(company)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(company.verify)}
                        onChange={() => handleToggle(company.id, 'verify')}
                        disabled={saving[company.id]}
                        style={{ height: '16px', width: '16px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(company.trust)}
                        onChange={() => handleToggle(company.id, 'trust')}
                        disabled={saving[company.id]}
                        style={{ height: '16px', width: '16px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(company.quickResponse)}
                        onChange={() => handleToggle(company.id, 'quickResponse')}
                        disabled={saving[company.id]}
                        style={{ height: '16px', width: '16px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(company.topRated)}
                        onChange={() => handleToggle(company.id, 'topRated')}
                        disabled={saving[company.id]}
                        style={{ height: '16px', width: '16px', cursor: 'pointer' }}
                      />
                    </td>
                   
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}