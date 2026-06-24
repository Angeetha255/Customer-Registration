import { useState, useEffect } from 'react'
import { createBusiness, createProduct, fetchBusinesses, fetchBusinessProducts, fetchStates, fetchDistricts, fetchAreas, fetchCategories, fetchSubcategories } from '../services/api.js'
import Toast from '../components/Toast.jsx'
import FloatingInput from '../components/FloatingInput.jsx'
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// Days of the week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function BusinessDirectory() {
  const [activeTab, setActiveTab] = useState('business')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [businesses, setBusinesses] = useState([])

  // Master data states
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [areas, setAreas] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loadingMasterData, setLoadingMasterData] = useState(false)

  // Business form state
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    email: '',
    mobileNumber: '',
    website: '',
    description: '',
    yearOfEstablishment: '',
    mapLocation: '',
    country: 'India',
    state: '',
    district: '',
    area: '',
    pincode: '',
    mainCategory: '',
    subCategory: '',
    numberOfEmployees: '',
    yearlyTurnover: '',
    businessHoursGroups: [
      { id: 1, days: [], openTime: '', closeTime: '' }
    ]
  })

  const [showMapPicker, setShowMapPicker] = useState(false)

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingMasterData(true)
      try {
        const [statesRes, categoriesRes] = await Promise.all([
          fetchStates(),
          fetchCategories()
        ])
        setStates(statesRes.states || [])
        setCategories(categoriesRes.categories || [])
      } catch (err) {
        console.error('Failed to fetch master data:', err)
      } finally {
        setLoadingMasterData(false)
      }
    }
    fetchMasterData()
  }, [])

  // Fetch districts when state changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!businessForm.state) {
        setDistricts([])
        return
      }
      try {
        const state = states.find(s => s.stateName === businessForm.state)
        if (state) {
          const res = await fetchDistricts(state.id)
          setDistricts(res.districts || [])
        }
      } catch (err) {
        console.error('Failed to fetch districts:', err)
      }
    }
    loadDistricts()
  }, [businessForm.state, states])

  // Fetch areas when district changes
  useEffect(() => {
    const loadAreas = async () => {
      if (!businessForm.district) {
        setAreas([])
        return
      }
      try {
        const district = districts.find(d => d.districtName === businessForm.district)
        if (district) {
          const res = await fetchAreas(district.id)
          setAreas(res.areas || [])
        }
      } catch (err) {
        console.error('Failed to fetch areas:', err)
      }
    }
    loadAreas()
  }, [businessForm.district, districts])

  // Fetch subcategories when category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!businessForm.mainCategory) {
        setSubcategories([])
        return
      }
      try {
        const category = categories.find(c => c.categoryName === businessForm.mainCategory)
        if (category) {
          const res = await fetchSubcategories(category.id)
          setSubcategories(res.subcategories || [])
        }
      } catch (err) {
        console.error('Failed to fetch subcategories:', err)
      }
    }
    loadSubcategories()
  }, [businessForm.mainCategory, categories])

  // Product form state
  const [productForm, setProductForm] = useState({
    businessId: '',
    coverImage: null,
    productImages: [],
    productName: '',
    displayPrice: false,
    productPrice: ''
  })

  useEffect(() => {
    fetchBusinesses()
      .then((data) => setBusinesses(data.businesses || []))
      .catch(() => setBusinesses([]))
  }, [])

  const handleBusinessChange = (e) => {
    const { name, value } = e.target
    setBusinessForm(prev => ({ ...prev, [name]: value }))
  }

  const handleBusinessHoursChange = (groupId, field, value) => {
    setBusinessForm(prev => ({
      ...prev,
      businessHoursGroups: prev.businessHoursGroups.map(group =>
        group.id === groupId ? { ...group, [field]: value } : group
      )
    }))
  }

  const toggleDayInGroup = (groupId, day) => {
    setBusinessForm(prev => ({
      ...prev,
      businessHoursGroups: prev.businessHoursGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              days: group.days.includes(day)
                ? group.days.filter(d => d !== day)
                : [...group.days, day]
            }
          : group
      )
    }))
  }

  const addBusinessHoursGroup = () => {
    setBusinessForm(prev => ({
      ...prev,
      businessHoursGroups: [
        ...prev.businessHoursGroups,
        { id: Date.now(), days: [], openTime: '', closeTime: '' }
      ]
    }))
  }

  const removeBusinessHoursGroup = (groupId) => {
    setBusinessForm(prev => ({
      ...prev,
      businessHoursGroups: prev.businessHoursGroups.filter(group => group.id !== groupId)
    }))
  }

  const handleBusinessSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!businessForm.businessName || !businessForm.email || !businessForm.mobileNumber) {
        setError('Business Name, Email, and Mobile Number are required')
        setLoading(false)
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessForm.email)) {
        setError('Invalid email format')
        setLoading(false)
        return
      }

      if (!/^[0-9]{10}$/.test(businessForm.mobileNumber)) {
        setError('Mobile number must be 10 digits')
        setLoading(false)
        return
      }

      if (!businessForm.state || !businessForm.district || !businessForm.area || !businessForm.pincode) {
        setError('State, District, Area, and Pincode are required')
        setLoading(false)
        return
      }

      if (!/^[0-9]{6}$/.test(businessForm.pincode)) {
        setError('Pincode must be 6 digits')
        setLoading(false)
        return
      }

      if (!businessForm.mainCategory) {
        setError('Main Category is required')
        setLoading(false)
        return
      }

      // Convert businessHoursGroups to businessHours format for API
      const businessHours = DAYS.reduce((acc, day) => {
        acc[day] = { isWorkingDay: false, openTime: '', closeTime: '' }
        return acc
      }, {})

      businessForm.businessHoursGroups.forEach(group => {
        group.days.forEach(day => {
          if (businessHours[day]) {
            businessHours[day] = {
              isWorkingDay: true,
              openTime: group.openTime,
              closeTime: group.closeTime
            }
          }
        })
      })

      const businessDataForAPI = {
        ...businessForm,
        businessHours
      }

      const response = await createBusiness(businessDataForAPI)
      setToast({ message: response.message || 'Business created successfully', type: 'success' })
      
      // Reset form
      setBusinessForm({
        businessName: '',
        email: '',
        mobileNumber: '',
        website: '',
        description: '',
        yearOfEstablishment: '',
        mapLocation: '',
        country: 'India',
        state: '',
        district: '',
        area: '',
        pincode: '',
        mainCategory: '',
        subCategory: '',
        numberOfEmployees: '',
        yearlyTurnover: '',
        businessHoursGroups: [
          { id: 1, days: [], openTime: '', closeTime: '' }
        ]
      })

      // Refresh businesses list
      fetchBusinesses()
        .then((data) => setBusinesses(data.businesses || []))
        .catch(() => setBusinesses([]))
    } catch (err) {
      setError(err.message || 'Failed to create business')
    } finally {
      setLoading(false)
    }
  }

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setProductForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setProductForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProductForm(prev => ({ ...prev, coverImage: file }))
    }
  }

  const handleProductImagesChange = (e) => {
    const files = Array.from(e.target.files)
    setProductForm(prev => ({ ...prev, productImages: files }))
  }

  const handleOpenMapPicker = () => {
    setShowMapPicker(true)
  }

  const handleCloseMapPicker = () => {
    setShowMapPicker(false)
  }

  const handleLocationSelect = (location) => {
    setBusinessForm(prev => ({ ...prev, mapLocation: location }))
    setShowMapPicker(false)
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!productForm.businessId) {
        setError('Please select a business')
        setLoading(false)
        return
      }

      if (!productForm.productName) {
        setError('Product Name is required')
        setLoading(false)
        return
      }

      if (productForm.displayPrice && !productForm.productPrice) {
        setError('Product Price is required when display price is enabled')
        setLoading(false)
        return
      }

      const formData = new FormData()
      formData.append('businessId', productForm.businessId)
      formData.append('productName', productForm.productName)
      formData.append('displayPrice', productForm.displayPrice)
      formData.append('productPrice', productForm.productPrice || '')

      if (productForm.coverImage) {
        formData.append('coverImage', productForm.coverImage)
      }

      productForm.productImages.forEach((file, index) => {
        formData.append('productImages', file)
      })

      const response = await createProduct(formData)
      setToast({ message: response.message || 'Product created successfully', type: 'success' })

      // Reset form
      setProductForm({
        businessId: '',
        coverImage: null,
        productImages: [],
        productName: '',
        displayPrice: false,
        productPrice: ''
      })
    } catch (err) {
      setError(err.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const availableDistricts = districts.map(d => d.districtName)
  const availableAreas = areas.map(a => a.areaName)
  const availableSubCategories = subcategories.map(s => s.subcategoryName)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Business Directory</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'business' ? 'active' : ''}`}
          onClick={() => setActiveTab('business')}
        >
          Business
        </button>
        <button
          className={`tab ${activeTab === 'product' ? 'active' : ''}`}
          onClick={() => setActiveTab('product')}
        >
          Product
        </button>
      </div>

      {error && <div className="alert alert-danger"><p>{error}</p></div>}

      {activeTab === 'business' && (
        <div>
        <form onSubmit={handleBusinessSubmit} className="form-grid business-directory-form">
          <FloatingInput
            label="Business Name *"
            name="businessName"
            value={businessForm.businessName}
            onChange={handleBusinessChange}
            required
          />

          <FloatingInput
            label="Email *"
            name="email"
            type="email"
            value={businessForm.email}
            onChange={handleBusinessChange}
            required
          />

          <FloatingInput
            label="Mobile Number *"
            name="mobileNumber"
            type="tel"
            value={businessForm.mobileNumber}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
              setBusinessForm(prev => ({ ...prev, mobileNumber: digits }))
            }}
            required
            inputProps={{ inputMode: 'numeric', maxLength: 10 }}
          />

          <FloatingInput
            label="Website"
            name="website"
            type="url"
            value={businessForm.website}
            onChange={handleBusinessChange}
          />

          <div className="full-width">
            <FloatingInput
              label="Description"
              name="description"
              value={businessForm.description}
              onChange={handleBusinessChange}
              multiline
              rows={3}
            />
          </div>

          <FloatingInput
            label="Year of Establishment"
            name="yearOfEstablishment"
            type="number"
            value={businessForm.yearOfEstablishment}
            onChange={handleBusinessChange}
            min="1900"
            max={new Date().getFullYear()}
          />

          <FloatingInput
            label="Number of Employees"
            name="numberOfEmployees"
            type="number"
            value={businessForm.numberOfEmployees}
            onChange={handleBusinessChange}
            min="0"
            placeholder="Total employees"
          />

          <FloatingInput
            label="Yearly Turnover (₹)"
            name="yearlyTurnover"
            type="text"
            value={businessForm.yearlyTurnover}
            onChange={handleBusinessChange}
            placeholder="e.g., 50L, 2Cr, 1.5Cr"
          />

          <div className="full-width">
            <label className="map-location-label">Map Location</label>
            <div className="map-location-wrapper">
              <input
                type="text"
                name="mapLocation"
                value={businessForm.mapLocation}
                onChange={handleBusinessChange}
                placeholder="Click to select location on map"
                className="map-location-input"
                readOnly
                onClick={handleOpenMapPicker}
              />
              <button
                type="button"
                className="map-picker-button"
                onClick={handleOpenMapPicker}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Pick Location
              </button>
            </div>
            {businessForm.mapLocation && (
              <div className="map-location-preview">
                <a href={businessForm.mapLocation} target="_blank" rel="noopener noreferrer" className="map-preview-link">
                  View selected location on Google Maps →
                </a>
              </div>
            )}
          </div>

          {showMapPicker && (
            <div className="map-picker-modal">
              <div className="map-picker-overlay" onClick={handleCloseMapPicker}></div>
              <div className="map-picker-content">
                <div className="map-picker-header">
                  <h3>Select Location</h3>
                  <button type="button" className="map-picker-close" onClick={handleCloseMapPicker}>✕</button>
                </div>
                <div className="map-picker-body">
                  <p className="map-picker-instruction">
                    Search for your location on Google Maps, then copy the URL and paste it below:
                  </p>
                  <input
                    type="text"
                    placeholder="Paste Google Maps URL here..."
                    className="map-url-input"
                    id="mapUrlInput"
                  />
                  <div className="map-picker-actions">
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={handleCloseMapPicker}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => {
                        const input = document.getElementById('mapUrlInput')
                        if (input && input.value) {
                          handleLocationSelect(input.value)
                        }
                      }}
                    >
                      Confirm Location
                    </button>
                  </div>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-maps-link"
                  >
                    Open Google Maps →
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="country-field-wrapper">
            <label htmlFor="country" className="country-label">Country</label>
            <select
              id="country"
              name="country"
              value={businessForm.country}
              onChange={handleBusinessChange}
              disabled
              className="country-select"
            >
              <option value="India">India</option>
            </select>
          </div>

          <FloatingInput
            
            name="state"
            value={businessForm.state}
            onChange={handleBusinessChange}
            required
            type="select"
            options={[{ value: '', label: 'Select State *' }, ...states.map(s => ({ value: s.stateName, label: s.stateName }))]}
          />

          <FloatingInput
            
            name="district"
            value={businessForm.district}
            onChange={handleBusinessChange}
            required
            disabled={!businessForm.state || districts.length === 0}
            type="select"
            options={[{ value: '', label: 'Select District *' }, ...availableDistricts.map(d => ({ value: d, label: d }))]}
          />

          <FloatingInput
            
            name="area"
            value={businessForm.area}
            onChange={handleBusinessChange}
            required
            disabled={!businessForm.district || areas.length === 0}
            type="select"
            options={[{ value: '', label: 'Select Area *' }, ...availableAreas.map(a => ({ value: a, label: a }))]}
          />

          <FloatingInput
            label="Pincode *"
            name="pincode"
            value={businessForm.pincode}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
              setBusinessForm(prev => ({ ...prev, pincode: digits }))
            }}
            required
            inputProps={{ inputMode: 'numeric', maxLength: 6 }}
          />

          <FloatingInput
            
            name="mainCategory"
            value={businessForm.mainCategory}
            onChange={handleBusinessChange}
            required
            type="select"
            options={[{ value: '', label: 'Select Category *' }, ...categories.map(c => ({ value: c.categoryName, label: c.categoryName }))]}
          />

          <FloatingInput
            
            name="subCategory"
            value={businessForm.subCategory}
            onChange={handleBusinessChange}
            disabled={!businessForm.mainCategory || subcategories.length === 0}
            type="select"
            options={[{ value: '', label: 'Select Sub Category' }, ...availableSubCategories.map(s => ({ value: s, label: s }))]}
          />

          <div className="full-width business-hours-section">
            <h3>Business Hours</h3>
            {businessForm.businessHoursGroups.map((group, groupIndex) => (
              <div key={group.id} className="business-hours-group">
                <div className="business-hours-group-header">
                  <span className="schedule-title">Schedule {groupIndex + 1}</span>
                  {businessForm.businessHoursGroups.length > 1 && (
                    <button
                      type="button"
                      className="button button-danger button-small remove-schedule-btn"
                      onClick={() => removeBusinessHoursGroup(group.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="days-grid">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`day-chip ${group.days.includes(day) ? 'selected' : ''}`}
                      onClick={() => toggleDayInGroup(group.id, day)}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
                {group.days.length > 0 && (
                  <div className="time-inputs-inline">
                    <label>
                      Open
                      <input
                        type="time"
                        value={group.openTime}
                        onChange={(e) => handleBusinessHoursChange(group.id, 'openTime', e.target.value)}
                      />
                    </label>
                    <label>
                      Close
                      <input
                        type="time"
                        value={group.closeTime}
                        onChange={(e) => handleBusinessHoursChange(group.id, 'closeTime', e.target.value)}
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              className="button button-secondary button-small add-schedule-btn"
              onClick={addBusinessHoursGroup}
            >
              + Add Schedule
            </button>
          </div>

          <div className="form-actions full-width">
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Business'}
            </button>
          </div>
        </form></div>
      )}

      {activeTab === 'product' && (
        <div>
        <form onSubmit={handleProductSubmit} className="form-grid business-directory-form">
          <FloatingInput
            
            name="businessId"
            value={productForm.businessId}
            onChange={handleProductChange}
            required
            type="select"
            options={[{ value: '', label: 'Select a Business *' }, ...businesses.map(b => ({ value: b.id, label: b.businessName }))]}
          />
          <FloatingInput
            label="Product Name *"
            name="productName"
            value={productForm.productName}
            onChange={handleProductChange}
            required
          />

          <div className="full-width">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)' }}>
              Do you want to display the product price?
            </label>
            <div className="radio-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <input
                  type="radio"
                  name="displayPrice"
                  checked={productForm.displayPrice === false}
                  onChange={() => setProductForm(prev => ({ ...prev, displayPrice: false }))}
                />
                No
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <input
                  type="radio"
                  name="displayPrice"
                  checked={productForm.displayPrice === true}
                  onChange={() => setProductForm(prev => ({ ...prev, displayPrice: true }))}
                />
                Yes
              </label>
              
            </div>
          </div>

          {productForm.displayPrice && (
            <FloatingInput
              label="Product Price *"
              name="productPrice"
              type="number"
              value={productForm.productPrice}
              onChange={handleProductChange}
              step="0.01"
              min="0"
              required
            />
          )}

          <div className="form-actions full-width">
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
          

          <div className="full-width">
            <FloatingInput
              label="Cover Image"
              name="coverImage"
              type="file"
              value=""
              onChange={handleCoverImageChange}
              inputProps={{ accept: 'image/*' }}
            />
            {productForm.coverImage && (
              <div className="image-preview">
                <img src={URL.createObjectURL(productForm.coverImage)} alt="Cover preview" />
              </div>
            )}
          </div>

          <div className="full-width">
            <FloatingInput
              label="Product Images"
              name="productImages"
              type="file"
              value=""
              onChange={handleProductImagesChange}
              inputProps={{ accept: 'image/*', multiple: true }}
            />
            {productForm.productImages.length > 0 && (
              <div className="image-preview">
                {productForm.productImages.map((file, index) => (
                  <img key={index} src={URL.createObjectURL(file)} alt={`Product ${index + 1}`} />
                ))}
              </div>
            )}
          </div>

          
        </form></div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  )
}
