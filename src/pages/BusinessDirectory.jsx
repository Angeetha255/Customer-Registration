import { useState, useEffect } from 'react'
import { createBusiness, createProduct, fetchBusinesses } from '../services/api.js'
import Toast from '../components/Toast.jsx'

// Indian states data
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry'
]

// Districts data (simplified - in production, this would be a comprehensive API or database)
const STATE_DISTRICTS = {
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Tirunelveli', 'Vellore', 'Thoothukudi', 'Dindigul'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Kalaburagi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Pimpri-Chinchwad', 'Nashik', 'Kalyan-Dombivli', 'Vasai-Virar', 'Aurangabad', 'Navi Mumbai'],
  'Delhi': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kottayam'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Bhuj'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Sikar', 'Alwar', 'Bharatpur', 'Bhilwara'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Ghaziabad', 'Bareilly', 'Aligarh', 'Moradabad'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Kharagpur', 'Shantipur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet']
}

// Areas data (simplified - in production, this would be comprehensive)
const DISTRICT_AREAS = {
  'Chennai': ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'Mylapore', 'Royapettah', 'Nungambakkam', 'Chromepet', 'Perambur', 'Ambattur'],
  'Bengaluru': ['Indiranagar', 'Koramangala', 'HSR Layout', 'Jayanagar', 'Whitefield', 'Electronic City', 'BTM Layout', 'Malleshwaram', 'Yelahanka', 'Bannerghatta'],
  'Mumbai': ['Andheri', 'Bandra', 'Colaba', 'Dadar', 'Juhu', 'Lower Parel', 'Malad', 'Powai', 'Thane', 'Vashi'],
  'Delhi': ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Saket', 'Vasant Kunj', 'Dwarka', 'Rohini', 'Mayur Vihar', 'Preet Vihar', 'Greater Kailash'],
  'Hyderabad': ['Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Gachibowli', 'Secunderabad', 'Kukatpally', 'Manikonda', 'Uppal', 'Malkajgiri', 'Kondapur']
}

// Main categories
const MAIN_CATEGORIES = [
  'Restaurants & Food',
  'Retail & Shopping',
  'Healthcare & Medical',
  'Education & Training',
  'Automotive',
  'Real Estate',
  'Professional Services',
  'Entertainment & Media',
  'Travel & Tourism',
  'Technology & IT',
  'Beauty & Wellness',
  'Home Services',
  'Sports & Fitness',
  'Financial Services',
  'Other'
]

// Sub categories based on main category
const SUB_CATEGORIES = {
  'Restaurants & Food': ['Fine Dining', 'Fast Food', 'Cafes', 'Bakeries', 'Food Delivery', 'Catering Services'],
  'Retail & Shopping': ['Clothing & Apparel', 'Electronics', 'Grocery', 'Jewelry', 'Furniture', 'Books & Stationery'],
  'Healthcare & Medical': ['Hospitals', 'Clinics', 'Pharmacies', 'Dental Care', 'Ayurveda', 'Diagnostic Centers'],
  'Education & Training': ['Schools', 'Colleges', 'Coaching Centers', 'Vocational Training', 'Online Education', 'Libraries'],
  'Automotive': ['Car Dealers', 'Bike Dealers', 'Service Centers', 'Spare Parts', 'Car Rental', 'Driving Schools'],
  'Real Estate': ['Property Dealers', 'Construction', 'Interior Design', 'Architects', 'Property Management'],
  'Professional Services': ['Legal Services', 'Accounting', 'Consulting', 'Marketing', 'Event Management'],
  'Entertainment & Media': ['Cinemas', 'Theaters', 'Music', 'Gaming', 'Media Production'],
  'Travel & Tourism': ['Travel Agencies', 'Hotels', 'Resorts', 'Tour Operators', 'Transportation'],
  'Technology & IT': ['Software Development', 'Hardware', 'Networking', 'Web Services', 'Mobile Apps'],
  'Beauty & Wellness': ['Salons', 'Spas', 'Gyms', 'Yoga Centers', 'Beauty Products'],
  'Home Services': ['Plumbing', 'Electrical', 'Cleaning', 'Pest Control', 'AC Repair'],
  'Sports & Fitness': ['Sports Clubs', 'Fitness Centers', 'Sports Equipment', 'Coaching'],
  'Financial Services': ['Banks', 'Insurance', 'Investment', 'Loans', 'Tax Services'],
  'Other': ['General Services', 'Miscellaneous']
}

// Days of the week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function BusinessDirectory() {
  const [activeTab, setActiveTab] = useState('business')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [businesses, setBusinesses] = useState([])

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
    businessHoursGroups: [
      { id: 1, days: [], openTime: '', closeTime: '' }
    ]
  })

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

  const availableDistricts = STATE_DISTRICTS[businessForm.state] || []
  const availableAreas = DISTRICT_AREAS[businessForm.district] || []
  const availableSubCategories = SUB_CATEGORIES[businessForm.mainCategory] || []

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
        <form onSubmit={handleBusinessSubmit} className="form-grid business-directory-form">
          <label>
            Business Name *
            <input
              type="text"
              name="businessName"
              value={businessForm.businessName}
              onChange={handleBusinessChange}
              required
            />
          </label>

          <label>
            Email *
            <input
              type="email"
              name="email"
              value={businessForm.email}
              onChange={handleBusinessChange}
              required
            />
          </label>

          <label>
            Mobile Number *
            <input
              type="tel"
              name="mobileNumber"
              value={businessForm.mobileNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                setBusinessForm(prev => ({ ...prev, mobileNumber: digits }))
              }}
              maxLength={10}
              required
            />
          </label>

          <label>
            Website
            <input
              type="url"
              name="website"
              value={businessForm.website}
              onChange={handleBusinessChange}
            />
          </label>

          <label className="full-width">
            Description
            <textarea
              name="description"
              value={businessForm.description}
              onChange={handleBusinessChange}
              rows={3}
            />
          </label>

          <label>
            Year of Establishment
            <input
              type="number"
              name="yearOfEstablishment"
              value={businessForm.yearOfEstablishment}
              onChange={handleBusinessChange}
              min="1900"
              max={new Date().getFullYear()}
            />
          </label>

          <label className="full-width">
            Map Location
            <div className="map-card">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125339.47253884688!2d76.87387674999999!3d11.016844499999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba907b0754a3c75%3A0x6e6b3e7e7e7e7e7e!2sTiruppur%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps"
              />
            </div>
            <input
              type="text"
              name="mapLocation"
              value={businessForm.mapLocation}
              onChange={handleBusinessChange}
              placeholder="Click on map to set location or enter coordinates"
              className="map-input"
            />
          </label>

          <label>
            Country
            <input
              type="text"
              name="country"
              value={businessForm.country}
              onChange={handleBusinessChange}
              disabled
            />
          </label>

          <label>
            State *
            <select
              name="state"
              value={businessForm.state}
              onChange={handleBusinessChange}
              required
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </label>

          <label>
            District/City *
            <select
              name="district"
              value={businessForm.district}
              onChange={handleBusinessChange}
              required
              disabled={!businessForm.state}
            >
              <option value="">Select District</option>
              {availableDistricts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </label>

          <label>
            Area *
            <select
              name="area"
              value={businessForm.area}
              onChange={handleBusinessChange}
              required
              disabled={!businessForm.district}
            >
              <option value="">Select Area</option>
              {availableAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </label>

          <label>
            Pincode *
            <input
              type="text"
              name="pincode"
              value={businessForm.pincode}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                setBusinessForm(prev => ({ ...prev, pincode: digits }))
              }}
              maxLength={6}
              required
            />
          </label>

          <label>
            Main Category *
            <select
              name="mainCategory"
              value={businessForm.mainCategory}
              onChange={handleBusinessChange}
              required
            >
              <option value="">Select Category</option>
              {MAIN_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            Sub Category
            <select
              name="subCategory"
              value={businessForm.subCategory}
              onChange={handleBusinessChange}
              disabled={!businessForm.mainCategory}
            >
              <option value="">Select Sub Category</option>
              {availableSubCategories.map(subCategory => (
                <option key={subCategory} value={subCategory}>{subCategory}</option>
              ))}
            </select>
          </label>

          <div className="full-width business-hours-section">
            <h3>Business Hours</h3>
            {businessForm.businessHoursGroups.map((group, groupIndex) => (
              <div key={group.id} className="business-hours-group">
                <div className="business-hours-group-header">
                  <span>Group {groupIndex + 1}</span>
                  {businessForm.businessHoursGroups.length > 1 && (
                    <button
                      type="button"
                      className="button button-danger button-small"
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
              className="button button-secondary button-small"
              onClick={addBusinessHoursGroup}
            >
              + Add Time Group
            </button>
          </div>

          <div className="form-actions full-width">
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Business'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'product' && (
        <form onSubmit={handleProductSubmit} className="form-grid business-directory-form">
          <label className="full-width">
            Select Business *
            <select
              name="businessId"
              value={productForm.businessId}
              onChange={handleProductChange}
              required
            >
              <option value="">Select a Business</option>
              {businesses.map(business => (
                <option key={business.id} value={business.id}>{business.businessName}</option>
              ))}
            </select>
          </label>

          <label className="full-width">
            Cover Image
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
            />
            {productForm.coverImage && (
              <div className="image-preview">
                <img src={URL.createObjectURL(productForm.coverImage)} alt="Cover preview" />
              </div>
            )}
          </label>

          <label className="full-width">
            Product Images (Multiple)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleProductImagesChange}
            />
            {productForm.productImages.length > 0 && (
              <div className="image-preview">
                {productForm.productImages.map((file, index) => (
                  <img key={index} src={URL.createObjectURL(file)} alt={`Product ${index + 1}`} />
                ))}
              </div>
            )}
          </label>

          <label className="full-width">
            Product Name *
            <input
              type="text"
              name="productName"
              value={productForm.productName}
              onChange={handleProductChange}
              required
            />
          </label>

          <label className="full-width">
            Do you want to display the product price?
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="displayPrice"
                  value="true"
                  checked={productForm.displayPrice === true}
                  onChange={() => setProductForm(prev => ({ ...prev, displayPrice: true }))}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="displayPrice"
                  value="false"
                  checked={productForm.displayPrice === false}
                  onChange={() => setProductForm(prev => ({ ...prev, displayPrice: false }))}
                />
                No
              </label>
            </div>
          </label>

          {productForm.displayPrice && (
            <label className="full-width">
              Product Price *
              <input
                type="number"
                name="productPrice"
                value={productForm.productPrice}
                onChange={handleProductChange}
                step="0.01"
                min="0"
                required
              />
            </label>
          )}

          <div className="form-actions full-width">
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  )
}
