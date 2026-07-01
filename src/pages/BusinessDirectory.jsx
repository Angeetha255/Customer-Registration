import { useState, useEffect, useRef } from 'react'
import { createCompany, updateCompany, fetchCompanies, createBusinessDirectory, updateBusinessDirectory, fetchBusinessDirectories, createProductNew, updateProduct, fetchProducts, fetchCountries, fetchStates, fetchDistricts, fetchAreas, fetchCategories, fetchSubcategories } from '../services/api.js'
import Toast from '../components/Toast.jsx'
import FloatingInput from '../components/FloatingInput.jsx'
import Modal from '../components/Modal.jsx'
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// Days of the week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function BusinessDirectory() {
  const [viewMode, setViewMode] = useState('list') // 'list' or 'form'
  const [activeTab, setActiveTab] = useState('company')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState([])
  const [businessDirectories, setBusinessDirectories] = useState([])
  const [products, setProducts] = useState([])
  const [editingCompanyId, setEditingCompanyId] = useState(null)
  const [editingBusinessId, setEditingBusinessId] = useState(null)
  const [editingProductId, setEditingProductId] = useState(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [selectedProductId, setSelectedProductId] = useState(null)

  // Master data states
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [areas, setAreas] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loadingMasterData, setLoadingMasterData] = useState(false)

  // Category search autocomplete states
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [isCategorySuggestionsOpen, setIsCategorySuggestionsOpen] = useState(false)
  const categoryDropdownRef = useRef(null)

  // Close category search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategorySuggestionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    businessName: '',
    email: '',
    mobileNumber: '',
    ownerName: '',
    yearOfEstablishment: '',
    gstNumber: '',
    yearlyTurnover: '',
    numberOfEmployees: '',
    country: 'India',
    countryId: '',
    state: '',
    district: '',
    area: '',
    pincode: '',
    mapLink: ''
  })

  // Business Directory form state
  const [businessDirectoryForm, setBusinessDirectoryForm] = useState({
    companyId: '',
    category: [],
    subcategory: [],
    website: '',
    description: '',
    businessHoursGroups: [
      { id: 1, days: [], openTime: '', closeTime: '' }
    ]
  })

  // Store subcategories grouped by category ID
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({})
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)

  // Product form state
  const [productForm, setProductForm] = useState({
    companyId: '',
    coverImage: null,
    productImages: [],
    gallery: [],
    productName: '',
    displayPrice: false,
    productMrp: '',
    discountPercentage: '',
    discountPrice: '',
    isEnabled: true,
    specifications: [],
    descriptions: [],
    youtubeLink: '',
    productCategory: '',
    addProduct: null // null = not asked, true = yes, false = no
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

  // Fetch states when country changes
  useEffect(() => {
    const loadStates = async () => {
      if (!companyForm.countryId) {
        setStates([])
        return
      }
      try {
        const res = await fetchStates(companyForm.countryId)
        setStates(res.states || [])
      } catch (err) {
        console.error('Failed to fetch states:', err)
      }
    }
    loadStates()
  }, [companyForm.countryId])

  // Fetch districts when state changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!companyForm.state) {
        setDistricts([])
        return
      }
      try {
        const state = states.find(s => s.stateName === companyForm.state)
        if (state) {
          const res = await fetchDistricts(state.id)
          setDistricts(res.districts || [])
        }
      } catch (err) {
        console.error('Failed to fetch districts:', err)
      }
    }
    loadDistricts()
  }, [companyForm.state, states])

  // Fetch areas when district changes
  useEffect(() => {
    const loadAreas = async () => {
      if (!companyForm.district) {
        setAreas([])
        return
      }
      try {
        const district = districts.find(d => d.districtName === companyForm.district)
        if (district) {
          const res = await fetchAreas(district.id)
          setAreas(res.areas || [])
        }
      } catch (err) {
        console.error('Failed to fetch areas:', err)
      }
    }
    loadAreas()
  }, [companyForm.district, districts])

  // Fetch subcategories for selected categories
  useEffect(() => {
    const loadSubcategoriesForCategories = async () => {
      if (!businessDirectoryForm.category || businessDirectoryForm.category.length === 0) {
        setSubcategoriesByCategory({})
        return
      }

      setLoadingSubcategories(true)
      try {
        const selectedCategoryObjects = categories.filter(cat => 
          businessDirectoryForm.category.includes(cat.categoryName)
        )

        const subcategoryPromises = selectedCategoryObjects.map(async (cat) => {
          const res = await fetchSubcategories(cat.id)
          return {
            categoryId: cat.id,
            categoryName: cat.categoryName,
            subcategories: res.subcategories || []
          }
        })

        const results = await Promise.all(subcategoryPromises)
        
        const grouped = {}
        results.forEach(result => {
          grouped[result.categoryId] = {
            categoryName: result.categoryName,
            subcategories: result.subcategories
          }
        })

        setSubcategoriesByCategory(grouped)
      } catch (err) {
        console.error('Failed to fetch subcategories:', err)
      } finally {
        setLoadingSubcategories(false)
      }
    }

    loadSubcategoriesForCategories()
  }, [businessDirectoryForm.category, categories])

  // Auto-detect category from subcategory selection (for backward compatibility)
  useEffect(() => {
    if (!businessDirectoryForm.subcategory || subcategories.length === 0) {
      return
    }

    const selectedSub = subcategories.find(sub => sub.subcategoryName === businessDirectoryForm.subcategory)
    if (selectedSub && selectedSub.categoryName) {
      const catName = selectedSub.categoryName
      setBusinessDirectoryForm(prev => {
        const currentCategories = Array.isArray(prev.category) ? prev.category : []
        if (!currentCategories.includes(catName)) {
          return { ...prev, category: [...currentCategories, catName] }
        }
        return prev
      })
    }
  }, [businessDirectoryForm.subcategory, subcategories])

  // Fetch companies, business directories, and products on component mount
  useEffect(() => {
    refreshCompaniesList()

    fetchBusinessDirectories()
      .then((data) => setBusinessDirectories(data.businessDirectories || []))
      .catch(() => setBusinessDirectories([]))

    fetchProducts()
      .then((data) => setProducts(data.products || []))
      .catch(() => setProducts([]))
  }, [])

  const refreshCompaniesList = () => {
    return fetchCompanies()
      .then((data) => setCompanies(data.companies || []))
      .catch((err) => {
        console.error('Failed to fetch companies:', err)
        setCompanies([])
      })
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || null

  const getCompanyCategory = (company) => company.businesses?.[0]?.category || '—'

  const closeDetailsModal = () => {
    setDetailsModalOpen(false)
    setSelectedCompanyId(null)
    setSelectedProductId(null)
  }

  const openDetailsModal = (company, product = null) => {
    setSelectedCompanyId(company.id)
    setSelectedProductId(product?.id || null)
    setDetailsModalOpen(true)
  }

  // Build product rows: one row per product
  const productRows = []
  companies.forEach((company) => {
    if (company.products && company.products.length > 0) {
      company.products.forEach((product) => {
        productRows.push({
          company,
          product,
          key: `${company.id}-${product.id}`
        })
      })
    } else {
      // Company with no products - show one row with placeholder
      productRows.push({
        company,
        product: null,
        key: `${company.id}-no-product`
      })
    }
  })

  const handleEditFromTable = (e, company, product = null) => {
    e.stopPropagation()
    closeDetailsModal()
    handleEditCompany(company, product)
  }

  const renderBusinessDetails = (company, product = null) => {
    if (!company) return null

    // Find the specific product to display
    const selectedProduct = product || (selectedProductId ? company.products?.find(p => p.id === selectedProductId) : null)

    return (
      <div className="business-details-modal-content">
        <div className="business-card-header business-details-modal-header">
          <div className="business-card-title">
            <h3>{company.businessName}</h3>
            <div className="business-card-contact">
              <span className="contact-item">📧 {company.email}</span>
              {company.mobileNumber && <span className="contact-item">📞 {company.mobileNumber}</span>}
            </div>
            <p className="business-card-address">
              📍 {company.area}, {company.district}, {company.state} - {company.pincode}
            </p>
          </div>
        </div>

        {(company.ownerName || company.gstNumber || company.yearOfEstablishment || company.yearlyTurnover || company.numberOfEmployees) && (
          <div className="business-card-section">
            <h4>Key Business Information</h4>
            <div className="business-info-grid">
              {company.ownerName && (
                <div className="business-info-item">
                  <span className="business-info-label">Owner</span>
                  <span className="business-info-value">{company.ownerName}</span>
                </div>
              )}
              {company.gstNumber && (
                <div className="business-info-item">
                  <span className="business-info-label">GST Number</span>
                  <span className="business-info-value">{company.gstNumber}</span>
                </div>
              )}
              {company.yearOfEstablishment && (
                <div className="business-info-item">
                  <span className="business-info-label">Established</span>
                  <span className="business-info-value">{company.yearOfEstablishment}</span>
                </div>
              )}
              {company.yearlyTurnover && (
                <div className="business-info-item">
                  <span className="business-info-label">Turnover</span>
                  <span className="business-info-value">₹{company.yearlyTurnover}</span>
                </div>
              )}
              {company.numberOfEmployees && (
                <div className="business-info-item">
                  <span className="business-info-label">Employees</span>
                  <span className="business-info-value">{company.numberOfEmployees}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {company.businesses?.[0]?.description && (
          <div className="business-card-section">
            <h4>Company Overview</h4>
            <p className="business-description">{company.businesses[0].description}</p>
          </div>
        )}

        {company.businesses && company.businesses.length > 0 && (
          <div className="business-card-section">
            <h4>Business Details</h4>
            <div className="business-details-grid">
              {company.businesses.map((business) => (
                <div key={business.id}>
                  {business.category && (
                    <div className="business-detail-item">
                      <span className="business-detail-label">Category</span>
                      <span className="business-detail-value">{business.category}</span>
                    </div>
                  )}
                  {business.subcategory && (
                    <div className="business-detail-item">
                      <span className="business-detail-label">Subcategory</span>
                      <span className="business-detail-value">{business.subcategory}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="business-detail-item">
                      <span className="business-detail-label">Website</span>
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="business-detail-link">
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {company.businesses?.[0]?.businessHours && Object.keys(company.businesses[0].businessHours).length > 0 && (
          <div className="business-card-section">
            <h4>Business Hours</h4>
            <div className="business-hours">
              {DAYS.map((day) => {
                const hours = company.businesses[0].businessHours[day]
                if (hours?.isWorkingDay) {
                  return (
                    <div key={day} className="business-hours-item">
                      <span className="business-hours-days">{day}</span>
                      <span className="business-hours-time">{hours.openTime} - {hours.closeTime}</span>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>
        )}

        {selectedProduct && (
          <div className="business-card-section">
            <h4>Product Details</h4>
            <div className="product-details-block">
              <div className="business-details-grid">
                <div className="business-detail-item">
                  <span className="business-detail-label">Product Name</span>
                  <span className="business-detail-value">{selectedProduct.productName}</span>
                </div>
                {selectedProduct.productCategory && (
                  <div className="business-detail-item">
                    <span className="business-detail-label">Product Category</span>
                    <span className="business-detail-value">{selectedProduct.productCategory}</span>
                  </div>
                )}
                <div className="business-detail-item">
                  <span className="business-detail-label">Status</span>
                  <span className="business-detail-value">{selectedProduct.isEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                {selectedProduct.displayPrice && selectedProduct.productMrp && (
                  <div className="business-detail-item">
                    <span className="business-detail-label">MRP</span>
                    <span className="business-detail-value">₹{selectedProduct.productMrp}</span>
                  </div>
                )}
                {selectedProduct.displayPrice && selectedProduct.discountPercentage > 0 && (
                  <div className="business-detail-item">
                    <span className="business-detail-label">Discount</span>
                    <span className="business-detail-value">{selectedProduct.discountPercentage}%</span>
                  </div>
                )}
                {selectedProduct.displayPrice && selectedProduct.discountPrice && (
                  <div className="business-detail-item">
                    <span className="business-detail-label">Price</span>
                    <span className="business-detail-value">₹{selectedProduct.discountPrice}</span>
                  </div>
                )}
                {selectedProduct.youtubeLink && (
                  <div className="business-detail-item">
                    <span className="business-detail-label">YouTube</span>
                    <a href={selectedProduct.youtubeLink} target="_blank" rel="noopener noreferrer" className="business-detail-link">
                      View Video
                    </a>
                  </div>
                )}
              </div>

              {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                <div className="product-specs-list">
                  <h5>Specifications</h5>
                  {selectedProduct.specifications.map((spec, index) => (
                    <div key={index} className="product-spec-item">
                      <span className="business-detail-label">{spec.name}</span>
                      <span className="business-detail-value">{spec.detail}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedProduct.descriptions && selectedProduct.descriptions.length > 0 && (
                <div className="product-descriptions-list">
                  <h5>Descriptions</h5>
                  {selectedProduct.descriptions.map((desc, index) => (
                    <p key={index} className="product-description-text">{desc}</p>
                  ))}
                </div>
              )}

              {(selectedProduct.coverImage || (selectedProduct.productImages && selectedProduct.productImages.length > 0) || (selectedProduct.gallery && selectedProduct.gallery.length > 0)) && (
                <div className="product-images-preview">
                  <h5>Images</h5>
                  <div className="product-images-grid">
                    {selectedProduct.coverImage && (
                      <img src={`/uploads/${selectedProduct.coverImage}`} alt={`${selectedProduct.productName} cover`} className="product-preview-image" />
                    )}
                    {(selectedProduct.productImages || []).map((img, index) => (
                      <img key={`pi-${index}`} src={`/uploads/${img}`} alt={`${selectedProduct.productName} ${index + 1}`} className="product-preview-image" />
                    ))}
                    {(selectedProduct.gallery || []).map((img, index) => (
                      <img key={`g-${index}`} src={`/uploads/${img}`} alt={`${selectedProduct.productName} gallery ${index + 1}`} className="product-preview-image" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {company.mapLink && (
          <div className="business-card-section">
            <a
              href={company.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="map-link-button"
            >
              📍 View Location on Google Maps
            </a>
          </div>
        )}
      </div>
    )
  }

  const handleCompanyChange = (e) => {
    const { name, value } = e.target
    setCompanyForm(prev => {
      // Reset state and district when country changes
      if (name === 'country') {
        const selectedCountry = countries.find(c => c.countryName === value)
        return { 
          ...prev, 
          country: value, 
          countryId: selectedCountry ? selectedCountry.id : '',
          state: '', 
          district: '', 
          area: '' 
        }
      }
      // Reset district and area when state changes
      if (name === 'state') {
        return { ...prev, [name]: value, district: '', area: '' }
      }
      // Reset area when district changes
      if (name === 'district') {
        return { ...prev, [name]: value, area: '' }
      }
      return { ...prev, [name]: value }
    })
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

  // Get all available subcategories from selected categories
  const getAvailableSubcategories = () => {
    const allSubs = []
    Object.values(subcategoriesByCategory).forEach(catData => {
      allSubs.push(...catData.subcategories)
    })
    return allSubs
  }

  // Handle category selection/deselection
  const handleCategoryCheckboxChange = (categoryName) => {
    setBusinessDirectoryForm(prev => {
      const currentCategories = Array.isArray(prev.category) ? prev.category : []
      const isSelected = currentCategories.includes(categoryName)
      
      let newCategories
      if (isSelected) {
        // Remove category
        newCategories = currentCategories.filter(c => c !== categoryName)
        
        // Find category ID and remove its subcategories
        const categoryToRemove = categories.find(c => c.categoryName === categoryName)
        if (categoryToRemove) {
          const subsToRemove = subcategoriesByCategory[categoryToRemove.id]?.subcategories || []
          const subNamesToRemove = subsToRemove.map(s => s.subcategoryName)
          const newSubcategories = (Array.isArray(prev.subcategory) ? prev.subcategory : [])
            .filter(s => !subNamesToRemove.includes(s))
          
          return {
            ...prev,
            category: newCategories,
            subcategory: newSubcategories
          }
        }
      } else {
        // Add category
        newCategories = [...currentCategories, categoryName]
      }
      
      return {
        ...prev,
        category: newCategories
      }
    })
  }

  // Handle subcategory selection/deselection
  const handleSubcategoryCheckboxChange = (subcategoryName) => {
    setBusinessDirectoryForm(prev => {
      const currentSubs = Array.isArray(prev.subcategory) ? prev.subcategory : []
      const isSelected = currentSubs.includes(subcategoryName)
      
      if (isSelected) {
        // Deselect
        return {
          ...prev,
          subcategory: currentSubs.filter(s => s !== subcategoryName)
        }
      } else {
        // Check if already at limit
        if (currentSubs.length >= 10) {
          setError('Maximum 10 subcategories can be selected.')
          setTimeout(() => setError(''), 3000)
          return prev
        }
        
        // Select
        return {
          ...prev,
          subcategory: [...currentSubs, subcategoryName]
        }
      }
    })
  }

  // Handle edit company
  const handleEditCompany = async (company, product = null) => {
    setViewMode('form')
    setActiveTab('company')
    setEditingCompanyId(company.id)
    
    // Find country id
    const selectedCountry = countries.find(c => c.countryName === company.country)
    setCompanyForm({
      businessName: company.businessName,
      email: company.email,
      mobileNumber: company.mobileNumber || '',
      ownerName: company.ownerName || '',
      yearOfEstablishment: company.yearOfEstablishment ? String(company.yearOfEstablishment) : '',
      gstNumber: company.gstNumber || '',
      yearlyTurnover: company.yearlyTurnover || '',
      numberOfEmployees: company.numberOfEmployees ? String(company.numberOfEmployees) : '',
      country: company.country || 'India',
      countryId: selectedCountry ? selectedCountry.id : '',
      state: company.state,
      district: company.district,
      area: company.area,
      pincode: company.pincode,
      mapLink: company.mapLink || ''
    })

    // Load associated business and product if they exist
    if (company.businesses && company.businesses.length > 0) {
      const business = company.businesses[0]
      setEditingBusinessId(business.id)
      
      // Convert businessHours to businessHoursGroups
      const groups = []
      const hoursByGroup = {}
      
      Object.entries(business.businessHours || {}).forEach(([day, hours]) => {
        if (hours.isWorkingDay) {
          const key = `${hours.openTime}-${hours.closeTime}`
          if (!hoursByGroup[key]) {
            hoursByGroup[key] = { id: Date.now() + Math.random(), days: [], openTime: hours.openTime, closeTime: hours.closeTime }
            groups.push(hoursByGroup[key])
          }
          hoursByGroup[key].days.push(day)
        }
      })

      // Handle category - convert IDs to names if needed
      let categoryValue = business.category || []
      if (typeof business.category === 'string') {
        try {
          const parsed = JSON.parse(business.category)
          // If it's an array of numbers, they are IDs - convert to names
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'number') {
            const matchedCategories = categories.filter(cat => parsed.includes(cat.id))
            categoryValue = matchedCategories.map(cat => cat.categoryName)
          } else {
            // It's already a string (could be JSON string of names or single name)
            categoryValue = parsed
          }
        } catch (e) {
          // If JSON.parse fails, it's likely a plain string name
          categoryValue = business.category
        }
      }

      // Handle subcategory - convert IDs to names if needed
      let subcategoryValue = business.subcategory || []
      if (typeof business.subcategory === 'string') {
        try {
          const parsed = JSON.parse(business.subcategory)
          // If it's an array of numbers, they are IDs - convert to names
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'number') {
            // Fetch all subcategories and match by IDs
            const allSubcategories = await fetchSubcategories().then(res => res.subcategories || [])
            const matchedSubcategories = allSubcategories.filter(sub => parsed.includes(sub.id))
            subcategoryValue = matchedSubcategories.map(sub => sub.subcategoryName)
          } else {
            // It's already a string (could be JSON string of names or single name)
            subcategoryValue = parsed
          }
        } catch (e) {
          // If JSON.parse fails, it's likely a plain string name
          subcategoryValue = business.subcategory
        }
      }

      setBusinessDirectoryForm({
        companyId: String(company.id),
        category: categoryValue,
        subcategory: subcategoryValue,
        website: business.website || '',
        description: business.description || '',
        businessHoursGroups: groups.length > 0 ? groups : [{ id: 1, days: [], openTime: '', closeTime: '' }]
      })
    }

    // Use the selected product if provided, otherwise use the first product
    const productToEdit = product || (company.products && company.products.length > 0 ? company.products[0] : null)
    
    if (productToEdit) {
      setEditingProductId(productToEdit.id)
      setProductForm({
        companyId: String(company.id),
        coverImage: null,
        productImages: [],
        gallery: [],
        productName: productToEdit.productName,
        displayPrice: Boolean(productToEdit.displayPrice),
        productMrp: productToEdit.productMrp ? String(productToEdit.productMrp) : '',
        discountPercentage: productToEdit.discountPercentage ? String(productToEdit.discountPercentage) : '',
        discountPrice: productToEdit.discountPrice ? String(productToEdit.discountPrice) : '',
        isEnabled: Boolean(productToEdit.isEnabled),
        specifications: productToEdit.specifications ? productToEdit.specifications.map((s, i) => ({ id: Date.now() + i, ...s })) : [],
        descriptions: productToEdit.descriptions ? productToEdit.descriptions.map((d, i) => ({ id: Date.now() + i, text: d })) : [],
        youtubeLink: productToEdit.youtubeLink || '',
        productCategory: productToEdit.productCategory || '',
        addProduct: true
      })
    }
  }

  const handleCompanySubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!companyForm.businessName || !companyForm.email || !companyForm.state || !companyForm.district || !companyForm.area || !companyForm.pincode) {
        setError('Business Name, Email, State, District, Area, and Pincode are required')
        setLoading(false)
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyForm.email)) {
        setError('Invalid email format')
        setLoading(false)
        return
      }

      let response
      if (editingCompanyId) {
        response = await updateCompany(editingCompanyId, companyForm)
      } else {
        response = await createCompany(companyForm)
      }
      
      setToast({ message: response.message || (editingCompanyId ? 'Company updated successfully' : 'Company created successfully'), type: 'success' })
      
      // Reset form
      setCompanyForm({
        businessName: '',
        email: '',
        mobileNumber: '',
        ownerName: '',
        yearOfEstablishment: '',
        gstNumber: '',
        yearlyTurnover: '',
        numberOfEmployees: '',
        country: 'India',
        countryId: '',
        state: '',
        district: '',
        area: '',
        pincode: '',
        mapLink: ''
      })
      setEditingCompanyId(null)
      setEditingBusinessId(null)
      setEditingProductId(null)

      // Refresh companies list
      await refreshCompaniesList()
      
      // Switch back to list view
      setViewMode('list')
    } catch (err) {
      setError(err.message || 'Failed to save company')
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
      if (!Array.isArray(businessDirectoryForm.category) || businessDirectoryForm.category.length === 0) {
        setError('At least one category is required')
        setLoading(false)
        return
      }

      if (!Array.isArray(businessDirectoryForm.subcategory) || businessDirectoryForm.subcategory.length === 0) {
        setError('At least one subcategory is required')
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

      // Store actual category names and subcategory names (not IDs)
      const businessDirectoryDataForAPI = {
        companyId: businessDirectoryForm.companyId,
        category: businessDirectoryForm.category, // Store category names
        subcategory: businessDirectoryForm.subcategory, // Store subcategory names
        website: businessDirectoryForm.website,
        description: businessDirectoryForm.description,
        businessHours
      }

      let response
      if (editingBusinessId) {
        response = await updateBusinessDirectory(editingBusinessId, businessDirectoryDataForAPI)
      } else {
        response = await createBusinessDirectory(businessDirectoryDataForAPI)
      }

      setToast({ message: response.message || (editingBusinessId ? 'Business Directory updated successfully' : 'Business Directory created successfully'), type: 'success' })
      
      // Reset form
      setBusinessDirectoryForm({
        companyId: '',
        category: [],
        subcategory: [],
        website: '',
        description: '',
        businessHoursGroups: [
          { id: 1, days: [], openTime: '', closeTime: '' }
        ]
      })
      setSubcategoriesByCategory({})
      setEditingBusinessId(null)

      // Refresh business directories list
      fetchBusinessDirectories()
        .then((data) => setBusinessDirectories(data.businessDirectories || []))
        .catch(() => setBusinessDirectories([]))

      await refreshCompaniesList()
    } catch (err) {
      setError(err.message || 'Failed to save business directory')
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

  const addSpecification = () => {
    setProductForm(prev => ({
      ...prev,
      specifications: [...prev.specifications, { id: Date.now(), name: '', detail: '' }]
    }))
  }

  const removeSpecification = (id) => {
    setProductForm(prev => ({
      ...prev,
      specifications: prev.specifications.filter(spec => spec.id !== id)
    }))
  }

  const updateSpecification = (id, field, value) => {
    setProductForm(prev => ({
      ...prev,
      specifications: prev.specifications.map(spec =>
        spec.id === id ? { ...spec, [field]: value } : spec
      )
    }))
  }

  const addDescription = () => {
    setProductForm(prev => ({
      ...prev,
      descriptions: [...prev.descriptions, { id: Date.now(), text: '' }]
    }))
  }

  const removeDescription = (id) => {
    setProductForm(prev => ({
      ...prev,
      descriptions: prev.descriptions.filter(desc => desc.id !== id)
    }))
  }

  const updateDescription = (id, text) => {
    setProductForm(prev => ({
      ...prev,
      descriptions: prev.descriptions.map(desc =>
        desc.id === id ? { ...desc, text } : desc
      )
    }))
  }

  const calculateDiscountPrice = () => {
    const mrp = parseFloat(productForm.productMrp) || 0
    const discount = parseFloat(productForm.discountPercentage) || 0
    const calculatedPrice = mrp - (mrp * discount / 100)
    setProductForm(prev => ({ ...prev, discountPrice: calculatedPrice.toFixed(2) }))
  }

  useEffect(() => {
    if (productForm.productMrp && productForm.discountPercentage) {
      calculateDiscountPrice()
    }
  }, [productForm.productMrp, productForm.discountPercentage])

  // Clear specifications when displayPrice is toggled to false
  useEffect(() => {
    if (!productForm.displayPrice) {
      setProductForm(prev => ({
        ...prev,
        specifications: [],
        productMrp: '',
        discountPercentage: '',
        discountPrice: ''
      }))
    }
  }, [productForm.displayPrice])

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

      const formData = new FormData()
      formData.append('companyId', productForm.companyId)
      formData.append('productName', productForm.productName)
      formData.append('displayPrice', productForm.displayPrice)
      formData.append('productMrp', productForm.productMrp || '')
      formData.append('discountPercentage', productForm.discountPercentage || '0')
      formData.append('discountPrice', productForm.discountPrice || '')
      formData.append('isEnabled', productForm.isEnabled)
      formData.append('youtubeLink', productForm.youtubeLink || '')
      formData.append('productCategory', productForm.productCategory || '')

      // Add specifications as JSON string
      const validSpecs = productForm.specifications.filter(spec => spec.name && spec.detail)
      if (validSpecs.length > 0) {
        formData.append('specifications', JSON.stringify(validSpecs.map(s => ({ name: s.name, detail: s.detail }))))
      }

      // Add descriptions as JSON string
      const validDescs = productForm.descriptions.filter(desc => desc.text)
      if (validDescs.length > 0) {
        formData.append('descriptions', JSON.stringify(validDescs.map(d => d.text)))
      }

      if (productForm.coverImage) {
        formData.append('coverImage', productForm.coverImage)
      }

      productForm.productImages.forEach((file, index) => {
        formData.append('productImages', file)
      })

      productForm.gallery.forEach((file, index) => {
        formData.append('gallery', file)
      })

      let response
      if (editingProductId) {
        response = await updateProduct(editingProductId, formData)
      } else {
        response = await createProductNew(formData)
      }

      setToast({ message: response.message || (editingProductId ? 'Product updated successfully' : 'Product created successfully'), type: 'success' })

      // Reset form
      setProductForm({
        companyId: '',
        coverImage: null,
        productImages: [],
        gallery: [],
        productName: '',
        displayPrice: false,
        productMrp: '',
        discountPercentage: '',
        discountPrice: '',
        isEnabled: true,
        specifications: [],
        descriptions: [],
        youtubeLink: '',
        productCategory: '',
        addProduct: null
      })
      setEditingProductId(null)

      // Refresh products list
      fetchProducts()
        .then((data) => setProducts(data.products || []))
        .catch(() => setProducts([]))

      await refreshCompaniesList()
    } catch (err) {
      setError(err.message || 'Failed to save product')
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`button ${viewMode === 'list' ? 'button-primary' : 'button-secondary'}`}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
          <button
            className={`button ${viewMode === 'form' ? 'button-primary' : 'button-secondary'}`}
            onClick={() => {
              closeDetailsModal()
              setViewMode('form')
              setEditingCompanyId(null)
              setEditingBusinessId(null)
              setEditingProductId(null)
              setCompanyForm({
                businessName: '',
                email: '',
                mobileNumber: '',
                ownerName: '',
                yearOfEstablishment: '',
                gstNumber: '',
                yearlyTurnover: '',
                numberOfEmployees: '',
                country: 'India',
                countryId: '',
                state: '',
                district: '',
                area: '',
                pincode: '',
                mapLink: ''
              })
              setBusinessDirectoryForm({
                companyId: '',
                category: [],
                subcategory: [],
                website: '',
                description: '',
                businessHoursGroups: [{ id: 1, days: [], openTime: '', closeTime: '' }]
              })
              setSubcategoriesByCategory({})
              setProductForm({
                companyId: '',
                coverImage: null,
                productImages: [],
                gallery: [],
                productName: '',
                displayPrice: false,
                productMrp: '',
                discountPercentage: '',
                discountPrice: '',
                isEnabled: true,
                specifications: [],
                descriptions: [],
                youtubeLink: '',
                productCategory: '',
                addProduct: null
              })
            }}
          >
            Add New
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="business-directory-list">
          {error && <div className="alert alert-danger"><p>{error}</p></div>}

          {companies.length > 0 ? (
            <div className="business-directory-table-container">
              <table className="data-table business-directory-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Category</th>
                    <th>Product Name</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row) => (
                    <tr
                      key={row.key}
                      className="business-table-row"
                      onClick={() => openDetailsModal(row.company, row.product)}
                    >
                      <td className="business-name-cell">{row.company.businessName}</td>
                      <td>{getCompanyCategory(row.company)}</td>
                      <td>{row.product?.productName || '—'}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          title="Edit"
                          className="icon-button"
                          aria-label={`Edit ${row.company.businessName}`}
                          onClick={(e) => handleEditFromTable(e, row.company, row.product)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              <p>No business directory entries yet. Click &quot;Add New&quot; to create one!</p>
            </div>
          )}

          <Modal
            isOpen={detailsModalOpen && Boolean(selectedCompany)}
            onClose={closeDetailsModal}
            title="Business Details"
            cardClassName="business-details-modal"
          >
            {renderBusinessDetails(selectedCompany, selectedProductId ? selectedCompany.products?.find(p => p.id === selectedProductId) : null)}
          </Modal>
        </div>
      ) : (
        <>
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
        {companies.length > 0 && (
          <div className="full-width" style={{ marginBottom: '2rem' }}>
            {/* <h3>Your Companies</h3> */}
            <div className="list-container">
              {companies.map((company) => (
                <div key={company.id} className="list-item">
                  {/* <div>
                    <strong>{company.businessName}</strong>
                    <p>{company.email} | {company.state}, {company.district}</p>
                  </div> */}
                  {company.mapLink && (
                    <div style={{ marginBottom: '1rem' }}>
                      {/* <a 
                        href={company.mapLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          color: 'var(--primary)',
                          textDecoration: 'none',
                          padding: '0.5rem 1rem',
                          background: 'var(--surface)',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border)'
                        }}
                      > */}
                        {/* 📍 View Location on Google Maps
                      </a> */}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
            label="Telephone Number"
            name="telephoneNumber"
            type="tel"
            value={companyForm.telephoneNumber}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
              setCompanyForm(prev => ({ ...prev, telephoneNumber: digits }))
            }}
            inputProps={{ inputMode: 'numeric', maxLength: 10 }}
          />

          <FloatingInput
            label="Additional Mobile Number"
            name="additionalMobileNumber"
            type="tel"
            value={companyForm.additionalMobileNumber}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
              setCompanyForm(prev => ({ ...prev, additionalMobileNumber: digits }))
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
            label="Country *"
            name="country"
            value={companyForm.country}
            onChange={handleCompanyChange}
            required
            type="select"
            options={countries.map(c => ({ value: c.countryName, label: c.countryName }))}
          />

          <FloatingInput
            label="State *"
            name="state"
            value={companyForm.state}
            onChange={handleCompanyChange}
            required
            type="select"
            options={states.map(s => ({ value: s.stateName, label: s.stateName }))}
          />

          <FloatingInput
            label="District *"
            name="district"
            value={companyForm.district}
            onChange={handleCompanyChange}
            required
            disabled={!companyForm.state || districts.length === 0}
            type="select"
            options={availableDistricts.map(d => ({ value: d, label: d }))}
          />

          <FloatingInput
            label="Area *"
            name="area"
            value={companyForm.area}
            onChange={handleCompanyChange}
            required
            disabled={!companyForm.district || areas.length === 0}
            type="select"
            options={availableAreas.map(a => ({ value: a, label: a }))}
          />

          <FloatingInput
            label="Pincode *"
            name="pincode"
            value={companyForm.pincode}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCompanyForm(prev => ({ ...prev, pincode: digits }))
            }}
            required
            inputProps={{ inputMode: 'numeric', maxLength: 6 }}
          />

          <FloatingInput
            label="Google Maps Link"
            name="mapLink"
            type="url"
            value={companyForm.mapLink}
            onChange={handleCompanyChange}
            placeholder="https://maps.google.com/..."
          />

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
            options={companies.map(c => ({ value: c.id, label: c.businessName }))}
          />

          {/* Category Selection UI Redesign */}
          <div className="full-width" ref={categoryDropdownRef} style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)' }}>
              Category * <span style={{ color: 'var(--muted)', fontWeight: '400' }}>(Type to search)</span>
            </label>
            
            {/* Searchable Input Field */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Type a category name..."
                value={categorySearchQuery}
                onChange={(e) => {
                  setCategorySearchQuery(e.target.value);
                  setIsCategorySuggestionsOpen(true);
                }}
                onFocus={() => setIsCategorySuggestionsOpen(true)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              />
              {categorySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCategorySearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0.2rem'
                  }}
                >
                  ✕
                </button>
              )}

              {/* Suggestions list */}
              {isCategorySuggestionsOpen && categorySearchQuery.trim() !== '' && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  marginTop: '0.35rem'
                }}>
                  {(() => {
                    const searchTerm = categorySearchQuery.toLowerCase();
                    const filtered = categories.filter(cat => 
                      cat.categoryName.toLowerCase().includes(searchTerm)
                    );

                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                          No matching categories found
                        </div>
                      );
                    }

                    return filtered.map(cat => {
                      const isSelected = Array.isArray(businessDirectoryForm.category) && 
                                       businessDirectoryForm.category.includes(cat.categoryName);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => {
                            handleCategoryCheckboxChange(cat.categoryName);
                            setCategorySearchQuery('');
                            setIsCategorySuggestionsOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.65rem 1rem',
                            cursor: 'pointer',
                            backgroundColor: 'white',
                            borderBottom: '1px solid #f3f4f6',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <span style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: isSelected ? '600' : '400' }}>
                            {cat.categoryName}
                          </span>
                          {isSelected && (
                            <span style={{ color: '#fbbf24', fontSize: '1.1rem', marginRight: '0.25rem' }} aria-hidden="true">
                              ⭐
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Selected Categories & Subcategories as Removable Chips */}
            {((Array.isArray(businessDirectoryForm.category) && businessDirectoryForm.category.length > 0) ||
              (Array.isArray(businessDirectoryForm.subcategory) && businessDirectoryForm.subcategory.length > 0)) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                {/* Category Chips */}
                {Array.isArray(businessDirectoryForm.category) && businessDirectoryForm.category.map((catName) => (
                  <span
                    key={`cat-chip-${catName}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.75rem',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1e40af',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    <span>⭐ {catName}</span>
                    <button
                      type="button"
                      onClick={() => handleCategoryCheckboxChange(catName)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1e40af',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        marginLeft: '0.15rem'
                      }}
                      aria-label={`Remove category ${catName}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}

                {/* Subcategory Chips */}
                {Array.isArray(businessDirectoryForm.subcategory) && businessDirectoryForm.subcategory.map((subName) => (
                  <span
                    key={`sub-chip-${subName}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.75rem',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    <span>{subName}</span>
                    <button
                      type="button"
                      onClick={() => handleSubcategoryCheckboxChange(subName)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#065f46',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        marginLeft: '0.15rem'
                      }}
                      aria-label={`Remove subcategory ${subName}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Subcategories Display Directly Below Selected Category */}
          {Array.isArray(businessDirectoryForm.category) && businessDirectoryForm.category.length > 0 && (
            <div className="full-width" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              {businessDirectoryForm.category.map((catName) => {
                const catObj = categories.find(c => c.categoryName === catName);
                const subs = catObj ? (subcategoriesByCategory[catObj.id]?.subcategories || []) : [];

                // Filter out subcategories that are already selected
                const availableSubs = subs.filter(
                  sub => !businessDirectoryForm.subcategory.includes(sub.subcategoryName)
                );

                // If not loading, and there are no available unselected subcategories, show nothing
                if (!loadingSubcategories && availableSubs.length === 0) {
                  return null;
                }

                return (
                  <div key={`cat-subs-section-${catName}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>⭐ {catName}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {loadingSubcategories ? (
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading subcategories...</div>
                      ) : (
                        availableSubs.map((sub) => {
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleSubcategoryCheckboxChange(sub.subcategoryName)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.4rem 0.8rem',
                                background: '#f3f4f6',
                                border: '1px solid #e5e7eb',
                                color: '#4b5563',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '400',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary)';
                                e.currentTarget.style.backgroundColor = '#eef2ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                              }}
                            >
                              {sub.subcategoryName}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <FloatingInput
            label="Website"
            name="website"
            type="url"
            value={businessDirectoryForm.website}
            onChange={handleBusinessDirectoryChange}
          />

          <div className="full-width">
            <FloatingInput
              label="Description"
              name="description"
              value={businessDirectoryForm.description}
              onChange={handleBusinessDirectoryChange}
              multiline
              rows={3}
            />
          </div>

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
        {products.length > 0 && (
          <div className="full-width" style={{ marginBottom: '2rem' }}>
            {/* <h3>Your Products</h3> */}
            <div className="list-container">
              {products.map((product) => (
                <div key={product.id} className="list-item">
                  
                  {product.youtubeLink && (
                    <div className="video-container" style={{
                      width: '100%',
                      maxWidth: '560px',
                      height: '315px',
                      marginTop: '1rem',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <iframe
                        src={product.youtubeLink.replace('watch?v=', 'embed/')}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen=""
                        title={`Video for ${product.productName}`}
                      />
                    </div>
                  )} 
                </div>
              ))}
            </div>
          </div>
        )}
        {productForm.addProduct === null ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>Do you want to add your product?</h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setProductForm(prev => ({ ...prev, addProduct: true }))}
              >
                Yes
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setProductForm(prev => ({ ...prev, addProduct: false }))}
              >
                No
              </button>
            </div>
          </div>
        ) : productForm.addProduct === false ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>Thank You</h3>
          </div>
        ) : (
        <form onSubmit={handleProductSubmit} className="form-grid business-directory-form">
          <FloatingInput
            label="Select Company"
            name="companyId"
            value={productForm.companyId}
            onChange={handleProductChange}
            type="select"
            options={companies.map(c => ({ value: c.id, label: c.businessName }))}
          />

          <FloatingInput
            label="Product Category"
            name="productCategory"
            value={productForm.productCategory}
            onChange={handleProductChange}
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
              Do you want to display your price?
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
           </div><br/>

           {productForm.displayPrice && (
             <>
               <FloatingInput
                 label="Product MRP *"
                 name="productMrp"
                 type="number"
                 value={productForm.productMrp}
                 onChange={handleProductChange}
                 step="0.01"
                 min="0"
                 required
               />

               <FloatingInput
                 label="Discount (%)"
                 name="discountPercentage"
                 type="number"
                 value={productForm.discountPercentage}
                 onChange={handleProductChange}
                 step="0.01"
                 min="0"
                 max="100"
               />

               {productForm.discountPrice && (
                 <div className="full-width" style={{ 
                   padding: '0.75rem', 
                   background: '#d4edda', 
                   border: '1px solid #28a745',
                   borderRadius: '4px',
                   marginBottom: '1rem'
                 }}>
                   <strong>Discount Price: ₹{productForm.discountPrice}</strong>
                 </div>
               )}

               <div className="full-width">
                 <h3>Product Specifications</h3>
                 {productForm.specifications.map((spec, index) => (
                   <div key={spec.id} className="specification-row">
                     <FloatingInput
                       label={`Specification ${index + 1} - Name`}
                       value={spec.name}
                       onChange={(e) => updateSpecification(spec.id, 'name', e.target.value)}
                       placeholder="e.g., Size, Color"
                     />
                     <FloatingInput
                       label={`Specification ${index + 1} - Detail`}
                       value={spec.detail}
                       onChange={(e) => updateSpecification(spec.id, 'detail', e.target.value)}
                       placeholder="e.g., 40 cm, Black"
                     />
                     <button
                       type="button"
                       className="button button-danger button-small"
                       onClick={() => removeSpecification(spec.id)}
                       style={{ marginTop: '1.5rem' }}
                     >
                       Remove
                     </button>
                   </div>
                 ))}
                 <button
                   type="button"
                   className="button button-secondary button-small"
                   onClick={addSpecification}
                   style={{ marginTop: '0.5rem' }}
                 >
                   + Add Specification
                 </button>
               </div>
             </>
            )}

          {/* <div className="full-width">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)' }}>
              Enable Product?
            </label>
            <div className="radio-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <input
                  type="radio"
                  name="isEnabled"
                  checked={productForm.isEnabled === true}
                  onChange={() => setProductForm(prev => ({ ...prev, isEnabled: true }))}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <input
                  type="radio"
                  name="isEnabled"
                  checked={productForm.isEnabled === false}
                  onChange={() => setProductForm(prev => ({ ...prev, isEnabled: false }))}
                />
                No
              </label>
            </div>
          </div> */}

           <br/>

          <FloatingInput
            label="YouTube Link"
            name="youtubeLink"
            type="url"
            value={productForm.youtubeLink}
            onChange={handleProductChange}
            placeholder="https://www.youtube.com/watch?v=..."
          />

          

          <div className="full-width">
            <h3>Product Description</h3>
            {productForm.descriptions.map((desc, index) => (
              <div key={desc.id} className="description-row">
                <FloatingInput
                  label={`Point ${index + 1}`}
                  value={desc.text}
                  onChange={(e) => updateDescription(desc.id, e.target.value)}
                  placeholder="e.g., High quality material"
                />
                <button
                  type="button"
                  className="button button-danger button-small"
                  onClick={() => removeDescription(desc.id)}
                  style={{ marginTop: '1.5rem' }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={addDescription}
              style={{ marginTop: '0.5rem' }}
            >
              + Add Description Point
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
        </form>
        )}
        </div>
      )}

        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
        </>
      )}
    </div>
  )
}