import { useState, useEffect } from 'react'
import { createCompany, updateCompany, fetchCompanies, createBusinessDirectory, updateBusinessDirectory, fetchBusinessDirectories, createProductNew, updateProduct, fetchProducts, fetchCountries, fetchStates, fetchDistricts, fetchAreas, fetchCategories, fetchSubcategories } from '../services/api.js'
import Toast from '../components/Toast.jsx'
import FloatingInput from '../components/FloatingInput.jsx'
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// Days of the week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function BusinessDirectory() {
  const [activeTab, setActiveTab] = useState('company')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState([])
  const [businessDirectories, setBusinessDirectories] = useState([])
  const [products, setProducts] = useState([])

  // Master data states
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [areas, setAreas] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loadingMasterData, setLoadingMasterData] = useState(false)

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    businessName: '',
    email: '',
    mobileNumber: '',
    ownerName: '',
    website: '',
    description: '',
    yearOfEstablishment: '',
    gstNumber: '',
    yearlyTurnover: '',
    numberOfEmployees: ''
  })

  // Business Directory form state
  const [businessDirectoryForm, setBusinessDirectoryForm] = useState({
    companyId: '',
    category: '',
    subcategory: '',
    country: '',
    state: '',
    district: '',
    area: '',
    pincode: '',
    businessHoursGroups: [
      { id: 1, days: [], openTime: '', closeTime: '' }
    ]
  })

  // Product form state
  const [productForm, setProductForm] = useState({
    companyId: '',
    coverImage: null,
    productImages: [],
    gallery: [],
    productName: '',
    displayPrice: false,
    productPrice: ''
  })

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingMasterData(true)
      try {
        const [countriesRes, statesRes, categoriesRes] = await Promise.all([
          fetchCountries(),
          fetchStates(),
          fetchCategories()
        ])
        setCountries(countriesRes.countries || [])
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
      if (!businessDirectoryForm.state) {
        setDistricts([])
        return
      }
      try {
        const state = states.find(s => s.stateName === businessDirectoryForm.state)
        if (state) {
          const res = await fetchDistricts(state.id)
          setDistricts(res.districts || [])
        }
      } catch (err) {
        console.error('Failed to fetch districts:', err)
      }
    }
    loadDistricts()
  }, [businessDirectoryForm.state, states])

  // Fetch areas when district changes
  useEffect(() => {
    const loadAreas = async () => {
      if (!businessDirectoryForm.district) {
        setAreas([])
        return
      }
      try {
        const district = districts.find(d => d.districtName === businessDirectoryForm.district)
        if (district) {
          const res = await fetchAreas(district.id)
          setAreas(res.areas || [])
        }
      } catch (err) {
        console.error('Failed to fetch areas:', err)
      }
    }
    loadAreas()
  }, [businessDirectoryForm.district, districts])

  // Fetch subcategories when category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!businessDirectoryForm.category) {
        setSubcategories([])
        return
      }
      try {
        const category = categories.find(c => c.categoryName === businessDirectoryForm.category)
        if (category) {
          const res = await fetchSubcategories(category.id)
          setSubcategories(res.subcategories || [])
        }
      } catch (err) {
        console.error('Failed to fetch subcategories:', err)
      }
    }
    loadSubcategories()
  }, [businessDirectoryForm.category, categories])

  // Fetch companies, business directories, and products on component mount
  useEffect(() => {
    fetchCompanies()
      .then((data) => setCompanies(data.companies || []))
      .catch(() => setCompanies([]))
    
    fetchBusinessDirectories()
      .then((data) => setBusinessDirectories(data.businessDirectories || []))
      .catch(() => setBusinessDirectories([]))
    
    fetchProducts()
      .then((data) => setProducts(data.products || []))
      .catch(() => setProducts([]))
  }, [])

  const handleCompanyChange = (e) => {
    const { name, value } = e.target
    setCompanyForm(prev => ({ ...prev, [name]: value }))
  }

  const handleBusinessDirectoryChange = (e) => {
    const { name, value } = e.target
    setBusinessDirectoryForm(prev => ({ ...prev, [name]: value }))
  }

  const handleBusinessDirectoryHoursChange = (groupId, field, value) => {
    setBusinessDirectoryForm(prev => ({
      ...prev,
      businessHoursGroups: prev.businessHoursGroups.map(group =>
        group.id === groupId ? { ...group, [field]: value } : group
      )
    }))
  }

  const toggleDayInGroup = (groupId, day) => {
    setBusinessDirectoryForm(prev => ({
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
    setBusinessDirectoryForm(prev => ({
      ...prev,
      businessHoursGroups: [
        ...prev.businessHoursGroups,
        { id: Date.now(), days: [], openTime: '', closeTime: '' }
      ]
    }))
  }

  const removeBusinessHoursGroup = (groupId) => {
    setBusinessDirectoryForm(prev => ({
      ...prev,
      businessHoursGroups: prev.businessHoursGroups.filter(group => group.id !== groupId)
    }))
  }

  const handleCompanySubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!companyForm.businessName || !companyForm.email) {
        setError('Business Name and Email are required')
        setLoading(false)
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyForm.email)) {
        setError('Invalid email format')
        setLoading(false)
        return
      }

      const response = await createCompany(companyForm)
      setToast({ message: response.message || 'Company created successfully', type: 'success' })
      
      // Reset form
      setCompanyForm({
        businessName: '',
        email: '',
        mobileNumber: '',
        ownerName: '',
        website: '',
        description: '',
        yearOfEstablishment: '',
        gstNumber: '',
        yearlyTurnover: '',
        numberOfEmployees: ''
      })

      // Refresh companies list
      fetchCompanies()
        .then((data) => setCompanies(data.companies || []))
        .catch(() => setCompanies([]))
    } catch (err) {
      setError(err.message || 'Failed to create company')
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessDirectorySubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!businessDirectoryForm.category || !businessDirectoryForm.state || !businessDirectoryForm.district || !businessDirectoryForm.area || !businessDirectoryForm.pincode) {
        setError('Category, State, District, Area, and Pincode are required')
        setLoading(false)
        return
      }

      if (!/^[0-9]{6}$/.test(businessDirectoryForm.pincode)) {
        setError('Pincode must be 6 digits')
        setLoading(false)
        return
      }

      // Convert businessHoursGroups to businessHours format for API
      const businessHours = DAYS.reduce((acc, day) => {
        acc[day] = { isWorkingDay: false, openTime: '', closeTime: '' }
        return acc
      }, {})

      businessDirectoryForm.businessHoursGroups.forEach(group => {
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

      const businessDirectoryDataForAPI = {
        ...businessDirectoryForm,
        businessHours
      }

      const response = await createBusinessDirectory(businessDirectoryDataForAPI)
      setToast({ message: response.message || 'Business Directory created successfully', type: 'success' })
      
      // Reset form
      setBusinessDirectoryForm({
        companyId: '',
        category: '',
        subcategory: '',
        country: '',
        state: '',
        district: '',
        area: '',
        pincode: '',
        businessHoursGroups: [
          { id: 1, days: [], openTime: '', closeTime: '' }
        ]
      })

      // Refresh business directories list
      fetchBusinessDirectories()
        .then((data) => setBusinessDirectories(data.businessDirectories || []))
        .catch(() => setBusinessDirectories([]))
    } catch (err) {
      setError(err.message || 'Failed to create business directory')
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

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files)
    setProductForm(prev => ({ ...prev, gallery: files }))
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
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
      formData.append('companyId', productForm.companyId)
      formData.append('productName', productForm.productName)
      formData.append('displayPrice', productForm.displayPrice)
      formData.append('productPrice', productForm.productPrice || '')

      if (productForm.coverImage) {
        formData.append('coverImage', productForm.coverImage)
      }

      productForm.productImages.forEach((file, index) => {
        formData.append('productImages', file)
      })

      productForm.gallery.forEach((file, index) => {
        formData.append('gallery', file)
      })

      const response = await createProductNew(formData)
      setToast({ message: response.message || 'Product created successfully', type: 'success' })

      // Reset form
      setProductForm({
        companyId: '',
        coverImage: null,
        productImages: [],
        gallery: [],
        productName: '',
        displayPrice: false,
        productPrice: ''
      })

      // Refresh products list
      fetchProducts()
        .then((data) => setProducts(data.products || []))
        .catch(() => setProducts([]))
    } catch (err) {
      setError(err.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const availableDistricts = districts.map(d => d.districtName)
  const availableAreas = areas.map(a => a.areaName)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Business Directory</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          Company
        </button>
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

      {activeTab === 'company' && (
        <div>
        <form onSubmit={handleCompanySubmit} className="form-grid business-directory-form">
          <FloatingInput
            label="Business Name *"
            name="businessName"
            value={companyForm.businessName}
            onChange={handleCompanyChange}
            required
          />

          <FloatingInput
            label="Business Owner"
            name="ownerName"
            value={companyForm.ownerName}
            onChange={handleCompanyChange}
          />

           <FloatingInput
            label="Mobile Number"
            name="mobileNumber"
            type="tel"
            value={companyForm.mobileNumber}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
              setCompanyForm(prev => ({ ...prev, mobileNumber: digits }))
            }}
            inputProps={{ inputMode: 'numeric', maxLength: 10 }}
          />

          <FloatingInput
            label="Email *"
            name="email"
            type="email"
            value={companyForm.email}
            onChange={handleCompanyChange}
            required
          />

         

          

          <FloatingInput
            label="Website"
            name="website"
            type="url"
            value={companyForm.website}
            onChange={handleCompanyChange}
          />

          <div className="full-width">
            <FloatingInput
              label="Description"
              name="description"
              value={companyForm.description}
              onChange={handleCompanyChange}
              multiline
              rows={3}
            />
          </div>
          <FloatingInput
            label="GST Number"
            name="gstNumber"
            value={companyForm.gstNumber}
            onChange={handleCompanyChange}
          />

          <FloatingInput
            label="Year of Establishment"
            name="yearOfEstablishment"
            type="number"
            value={companyForm.yearOfEstablishment}
            onChange={handleCompanyChange}
            min="1900"
            max={new Date().getFullYear()}
          />

          

          <FloatingInput
            label="Number of Employees"
            name="numberOfEmployees"
            type="number"
            value={companyForm.numberOfEmployees}
            onChange={handleCompanyChange}
            min="0"
            placeholder="Total employees"
          />

          <FloatingInput
            label="Yearly Turnover (₹)"
            name="yearlyTurnover"
            type="text"
            value={companyForm.yearlyTurnover}
            onChange={handleCompanyChange}
            placeholder="e.g., 50L, 2Cr, 1.5Cr"
          />

          <div className="form-actions full-width">
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Company'}
            </button>
          </div>
        </form></div>
      )}

      {activeTab === 'business' && (
        <div>
        <form onSubmit={handleBusinessDirectorySubmit} className="form-grid business-directory-form">
          <FloatingInput
            label="Select Company"
            name="companyId"
            value={businessDirectoryForm.companyId}
            onChange={handleBusinessDirectoryChange}
            type="select"
            options={[{ value: '', label: 'Select Company ' }, ...companies.map(c => ({ value: c.id, label: c.businessName }))]}
          />

          <FloatingInput
            label="Category *"
            name="category"
            value={businessDirectoryForm.category}
            onChange={handleBusinessDirectoryChange}
            required
            type="select"
            options={[{ value: '', label: 'Select Category *' }, ...categories.map(c => ({ value: c.categoryName, label: c.categoryName }))]}
          />

          <FloatingInput
            label="Subcategory"
            name="subcategory"
            value={businessDirectoryForm.subcategory}
            onChange={handleBusinessDirectoryChange}
            disabled={!businessDirectoryForm.category || subcategories.length === 0}
            type="select"
            options={[{ value: '', label: 'Select Subcategory' }, ...subcategories.map(s => ({ value: s.subcategoryName, label: s.subcategoryName }))]}
          />

          <FloatingInput
            label="Country *"
            name="country"
            value={businessDirectoryForm.country}
            onChange={handleBusinessDirectoryChange}
            required
            type="select"
            options={[{ value: '', label: 'Select Country *' }, ...countries.map(c => ({ value: c.countryName, label: c.countryName }))]}
          />

          <FloatingInput
            label="State *"
            name="state"
            value={businessDirectoryForm.state}
            onChange={handleBusinessDirectoryChange}
            required
            type="select"
            options={[{ value: '', label: 'Select State *' }, ...states.map(s => ({ value: s.stateName, label: s.stateName }))]}
          />

          <FloatingInput
            label="District *"
            name="district"
            value={businessDirectoryForm.district}
            onChange={handleBusinessDirectoryChange}
            required
            disabled={!businessDirectoryForm.state || districts.length === 0}
            type="select"
            options={[{ value: '', label: 'Select District *' }, ...availableDistricts.map(d => ({ value: d, label: d }))]}
          />

          <FloatingInput
            label="Area *"
            name="area"
            value={businessDirectoryForm.area}
            onChange={handleBusinessDirectoryChange}
            required
            disabled={!businessDirectoryForm.district || areas.length === 0}
            type="select"
            options={[{ value: '', label: 'Select Area *' }, ...availableAreas.map(a => ({ value: a, label: a }))]}
          />

          <FloatingInput
            label="Pincode *"
            name="pincode"
            value={businessDirectoryForm.pincode}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
              setBusinessDirectoryForm(prev => ({ ...prev, pincode: digits }))
            }}
            required
            inputProps={{ inputMode: 'numeric', maxLength: 6 }}
          />

          <div className="full-width business-hours-section">
            <h3>Business Hours</h3>
            {businessDirectoryForm.businessHoursGroups.map((group, groupIndex) => (
              <div key={group.id} className="business-hours-group">
                <div className="business-hours-group-header">
                  <span className="schedule-title">Schedule {groupIndex + 1}</span>
                  {businessDirectoryForm.businessHoursGroups.length > 1 && (
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
                        onChange={(e) => handleBusinessDirectoryHoursChange(group.id, 'openTime', e.target.value)}
                      />
                    </label>
                    <label>
                      Close
                      <input
                        type="time"
                        value={group.closeTime}
                        onChange={(e) => handleBusinessDirectoryHoursChange(group.id, 'closeTime', e.target.value)}
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
            label="Select Company"
            name="companyId"
            value={productForm.companyId}
            onChange={handleProductChange}
            type="select"
            options={[{ value: '', label: 'Select Company ' }, ...companies.map(c => ({ value: c.id, label: c.businessName }))]}
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
          </div><br></br>

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

          <div className="full-width">
            <FloatingInput
              label="Gallery"
              name="gallery"
              type="file"
              value=""
              onChange={handleGalleryChange}
              inputProps={{ accept: 'image/*', multiple: true }}
            />
            {productForm.gallery.length > 0 && (
              <div className="image-preview">
                {productForm.gallery.map((file, index) => (
                  <img key={index} src={URL.createObjectURL(file)} alt={`Gallery ${index + 1}`} />
                ))}
              </div>
            )}
          </div>

          <div className="form-actions full-width">
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
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
