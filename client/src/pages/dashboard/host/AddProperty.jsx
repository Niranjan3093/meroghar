import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { propertiesAPI } from '../../../utils/api'
import { toast } from 'react-toastify'
import { FiHome, FiMapPin, FiDollarSign, FiImage, FiX, FiPlus, FiCheck, FiChevronLeft, FiChevronRight, FiAlertCircle } from 'react-icons/fi'
import GoogleMap from '../../../components/GoogleMap'

const NEPAL_CITIES = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Birgunj',
  'Bharatpur', 'Dharan', 'Butwal', 'Hetauda', 'Janakpur', 'Itahari',
  'Nepalgunj', 'Dhangadhi', 'Tulsipur', 'Ghorahi', 'Damak', 'Mechinagar',
  'Siddharthanagar', 'Lahan', 'Rajbiraj', 'Gaur', 'Kalaiya', 'Tansen',
  'Tikapur', 'Gulariya', 'Dhulikhel', 'Banepa', 'Panauti', 'Thimi',
  'Kirtipur', 'Tokha', 'Budhanilkantha', 'Kageshwari Manohara', 'Godawari',
  'Chandragiri', 'Dakshinkali', 'Nagarjun', 'Tarakeshwar', 'Madhyapur Thimi',
  'Suryabinayak', 'Changunarayan', 'Lekhnath', 'Waling', 'Kapilvastu',
  'Gorkha', 'Lamjung', 'Baglung', 'Myagdi', 'Parbat',
  'Damauli', 'Byas', 'Kawasoti', 'Ramgram', 'Bardaghat',
  'Sunwal', 'Devdaha', 'Lumbini Sanskritik', 'Tilottama', 'Sainamaina',
  'Kohalpur', 'Lamki', 'Attariya', 'Mahendranagar', 'Bhimdatta',
  'Birendranagar', 'Narayan', 'Surkhet', 'Jumla', 'Simikot',
  'Dipayal Silgadhi', 'Amargadhi', 'Dasharathchand', 'Doti',
  'Inaruwa', 'Triyuga', 'Belaka', 'Katari', 'Chaudandigadhi',
  'Gaighat', 'Myanglung', 'Khandbari', 'Chainpur', 'Taplejung',
  'Phidim', 'Ilam', 'Birtamod', 'Urlabari', 'Sundarharaincha',
  'Rangeli', 'Belbari', 'Letang', 'Pathari Shanischare', 'Sundarijal',
  'Kamalamai', 'Jaleshwar', 'Malangwa', 'Hariwan', 'Chandrapur',
  'Mirchaiya', 'Lalbandi', 'Bardibas', 'Sindhuli', 'Dhulikhel',
  'Chautara', 'Melamchi', 'Bidur', 'Trisuli', 'Dhunche',
  'Palpa', 'Rampur', 'Beni', 'Jomsom', 'Manang',
  'Sandhikharka', 'Pyuthan', 'Rolpa', 'Rukum', 'Salyan',
  'Musikot', 'Dullu', 'Dailekh', 'Narayan Municipality',
  'Banke', 'Bardiya', 'Dang', 'Kapilvastu', 'Arghakhanchi',
  'Gulmi', 'Nawalpur', 'Tanahun', 'Kaski', 'Syangja',
  'Mustang', 'Dolpa', 'Mugu', 'Humla', 'Kalikot',
  'Jajarkot', 'Bajura', 'Bajhang', 'Darchula', 'Baitadi',
  'Dadeldhura', 'Kanchanpur', 'Mahakali', 'Seti',
  'Bhojpur', 'Solukhumbu', 'Okhaldhunga', 'Diktel', 'Terhathum',
  'Panchthar', 'Sankhuwasabha', 'Dhankuta', 'Sunsari', 'Morang',
  'Jhapa', 'Saptari', 'Siraha', 'Dhanusa', 'Mahottari',
  'Sarlahi', 'Rautahat', 'Bara', 'Parsa', 'Chitwan',
  'Makwanpur', 'Sindhuli', 'Ramechhap', 'Dolakha', 'Sindhupalchok',
  'Kavrepalanchok', 'Nuwakot', 'Rasuwa', 'Dhading', 'Gorakhpur',
  'Manpur', 'Pyuthan', 'Jomsom', 'Besisahar', 'Chame',
  'Kushma', 'Galyangd', 'Putalisadak', 'Baneshwor', 'Chabahil',
  'Bouddha', 'Jorpati', 'Gongabu', 'Kalanki', 'Balkhu',
  'Satdobato', 'Lagankhel', 'Jawalakhel', 'Pulchowk', 'Kupondole',
  'Patan', 'Mangalbazar', 'Thamel', 'Durbar Marg', 'New Road',
  'Asan', 'Basantapur', 'Balaju', 'Maharajgunj', 'Lazimpat',
  'Naxal', 'Battisputali', 'Koteshwor', 'Tinkune', 'Sinamangal',
  'Gaushala', 'Pashupatinath', 'Mitrapark', 'Battisputali',
  'Sukedhara', 'Kapan', 'Chunikhel', 'Budhanilkantha',
  'Sundarijal', 'Sankhu', 'Nagarkot', 'Kakani', 'Thankot',
  'Pharping', 'Chapagaun', 'Lubhu', 'Tikathali', 'Imadol',
  'Lamatar', 'Godavari', 'Harisiddhi', 'Thecho', 'Bungamati',
  'Khokana', 'Chovar', 'Kritipur', 'Naikap', 'Sitapaila',
  'Swayambhu', 'Ichangu', 'Ranipauwa', 'Goldhunga', 'Manmaiju',
  'Samakhushi', 'Banasthali', 'Dhapasi', 'Grande', 'Tokha',
  'Sangam Chowk', 'Gangabu', 'Machhapokhari', 'Basundhara'
].filter((v, i, a) => a.indexOf(v) === i).sort()

function AddProperty() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const isEditMode = Boolean(editId)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetchingProperty, setFetchingProperty] = useState(false)
  const [editProperty, setEditProperty] = useState(null)
  const [citySearch, setCitySearch] = useState('')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const cityDropdownRef = useRef(null)
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    type: 'apartment',
    
    // Location
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: null,
    longitude: null,
    
    // Details
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    furnished: 'unfurnished',
    
    // Pricing
    monthlyRent: '',
    securityDeposit: '',
    minimumLease: 6,
    
    // Amenities
    amenities: [],
    
    // Images
    images: []
  })
  const [formErrors, setFormErrors] = useState({})

  const steps = [
    { number: 1, title: 'Basic Info', icon: FiHome },
    { number: 2, title: 'Location', icon: FiMapPin },
    { number: 3, title: 'Details', icon: FiHome },
    { number: 4, title: 'Pricing', icon: FiDollarSign },
    { number: 5, title: 'Photos', icon: FiImage }
  ]

  const amenitiesList = [
    'parking', 'wifi', 'furnished', 'ac', 'heating', 'gym', 'pool',
    'security', 'elevator', 'garden', 'balcony', 'pets-allowed',
    'smoking-allowed', 'laundry', 'kitchen'
  ]

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'room', label: 'Single Room' },
    { value: 'studio', label: 'Studio' },
    { value: 'office', label: 'Office' },
    { value: 'villa', label: 'Villa' }
  ]

  // Close city dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setShowCityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch property data when in edit mode
  useEffect(() => {
    if (!isEditMode) return
    const fetchProperty = async () => {
      try {
        setFetchingProperty(true)
        const response = await propertiesAPI.getById(editId)
        const p = response.data.data

        // Only allow editing pending or rejected properties
        if (p.verificationStatus === 'verified') {
          toast.error('Cannot edit an approved property')
          navigate('/dashboard/host/properties')
          return
        }

        // Check rejection edit limit
        if (p.verificationStatus === 'rejected' && p.rejectionEditCount >= 3) {
          toast.error('Maximum resubmission limit (3) reached for this property')
          navigate('/dashboard/host/properties')
          return
        }

        setEditProperty(p)

        const leaseDurationMap = { 'monthly': 1, '3-months': 3, '6-months': 6, 'yearly': 12 }

        setFormData({
          title: p.title || '',
          description: p.description || '',
          type: p.propertyType || 'apartment',
          address: p.address?.street || '',
          city: p.address?.city || '',
          state: p.address?.state || '',
          zipCode: p.address?.zipCode || '',
          latitude: p.location?.coordinates?.[1] || null,
          longitude: p.location?.coordinates?.[0] || null,
          bedrooms: p.bedrooms || 1,
          bathrooms: p.bathrooms || 1,
          area: p.area?.value ? String(p.area.value) : '',
          furnished: 'unfurnished',
          monthlyRent: p.rent ? String(p.rent) : '',
          securityDeposit: p.securityDeposit ? String(p.securityDeposit) : '',
          minimumLease: leaseDurationMap[p.leaseDuration] || 12,
          amenities: p.amenities || [],
          images: (p.images || []).map(img => ({ url: img.url, public_id: img.public_id, preview: img.url, isExisting: true }))
        })
        setCitySearch(p.address?.city ? p.address.city.charAt(0).toUpperCase() + p.address.city.slice(1) : '')
      } catch (error) {
        console.error('Failed to fetch property:', error)
        toast.error('Failed to load property for editing')
        navigate('/dashboard/host/properties')
      } finally {
        setFetchingProperty(false)
      }
    }
    fetchProperty()
  }, [editId, isEditMode, navigate])

  const filteredCities = NEPAL_CITIES.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  )

  const handleCitySelect = (city) => {
    setFormData({ ...formData, city: city.toLowerCase() })
    setCitySearch(city)
    setShowCityDropdown(false)
    if (formErrors.city) setFormErrors({ ...formErrors, city: '' })
  }

  const handleLocationSelect = (addressData) => {
    // Update form fields with data from map
    setFormData(prev => ({
      ...prev,
      address: addressData.street || prev.address,
      city: addressData.city?.toLowerCase() || prev.city,
      state: addressData.state || prev.state,
      zipCode: addressData.zipCode || prev.zipCode,
      latitude: addressData.location.lat,
      longitude: addressData.location.lng
    }))
    
    // Update city search field
    if (addressData.city) {
      setCitySearch(addressData.city)
    }
    
    // Clear any errors
    setFormErrors(prev => ({
      ...prev,
      address: '',
      city: '',
      state: '',
      zipCode: ''
    }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: '' })
  }

  // Restrict input to digits only for number fields
  const handleNumericKeyDown = (e) => {
    if (!/[0-9]/.test(e.key) && !['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
    }
  }

  const validateStep = (step) => {
    const errs = {}
    if (step === 1) {
      if (!formData.title.trim()) errs.title = 'Title is required'
      else if (formData.title.trim().length < 5) errs.title = 'Title must be at least 5 characters'
      if (!formData.description.trim()) errs.description = 'Description is required'
      else if (formData.description.trim().length < 20) errs.description = 'Description must be at least 20 characters'
    } else if (step === 2) {
      if (!formData.address.trim()) errs.address = 'Street address is required'
      if (!formData.city) errs.city = 'City is required'
    } else if (step === 3) {
      if (formData.area && (isNaN(formData.area) || Number(formData.area) <= 0)) errs.area = 'Area must be a positive number'
      if (formData.area && Number(formData.area) > 100000) errs.area = 'Area seems too large'
    } else if (step === 4) {
      if (!formData.monthlyRent) errs.monthlyRent = 'Monthly rent is required'
      else if (isNaN(formData.monthlyRent) || Number(formData.monthlyRent) <= 0) errs.monthlyRent = 'Rent must be a positive number'
      else if (Number(formData.monthlyRent) > 10000000) errs.monthlyRent = 'Rent amount seems too high'
      if (!formData.securityDeposit) errs.securityDeposit = 'Security deposit is required'
      else if (isNaN(formData.securityDeposit) || Number(formData.securityDeposit) < 0) errs.securityDeposit = 'Deposit must be a non-negative number'
    }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const toggleAmenity = (amenity) => {
    if (formData.amenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: formData.amenities.filter(a => a !== amenity)
      })
    } else {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity]
      })
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setFormData({
      ...formData,
      images: [...formData.images, ...newImages]
    })
  }

  const removeImage = (index) => {
    const newImages = [...formData.images]
    if (!newImages[index].isExisting) {
      URL.revokeObjectURL(newImages[index].preview)
    }
    newImages.splice(index, 1)
    setFormData({ ...formData, images: newImages })
  }

  const nextStep = () => {
    if (!validateStep(currentStep)) return
    if (currentStep < 5) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate images - for new properties require 3, for edits check total (existing + new)
    const totalImages = formData.images.length
    if (totalImages < 3) {
      toast.error('Please upload at least 3 photos of your property')
      setCurrentStep(5)
      return
    }
    
    setLoading(true)
    
    try {
      // Prepare the property data for the API
      const propertyData = {
        title: formData.title,
        description: formData.description,
        propertyType: formData.type,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: 'Nepal'
        },
        rent: parseInt(formData.monthlyRent),
        securityDeposit: parseInt(formData.securityDeposit),
        leaseDuration: formData.minimumLease === 3 ? '3-months' : 
                       formData.minimumLease === 6 ? '6-months' : 
                       formData.minimumLease === 12 ? 'yearly' : 'yearly',
        availableFrom: new Date(),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: formData.area ? {
          value: parseInt(formData.area),
          unit: 'sqft'
        } : undefined,
        amenities: formData.amenities
      }

      // Add location coordinates if available
      if (formData.latitude && formData.longitude) {
        propertyData.location = {
          type: 'Point',
          coordinates: [formData.longitude, formData.latitude] // [longitude, latitude]
        }
      }

      if (isEditMode) {
        // Keep existing images that weren't removed
        const existingImages = formData.images.filter(img => img.isExisting).map(img => ({ url: img.url, public_id: img.public_id }))
        propertyData.images = existingImages

        // Update the property
        await propertiesAPI.update(editId, propertyData)

        // Upload new images if any
        const newImages = formData.images.filter(img => !img.isExisting)
        if (newImages.length > 0) {
          const imageFormData = new FormData()
          newImages.forEach(img => {
            imageFormData.append('images', img.file)
          })
          await propertiesAPI.uploadImages(editId, imageFormData)
        }

        toast.success('Property updated and resubmitted for review!')
      } else {
        // Create the property
        const response = await propertiesAPI.create(propertyData)
        const createdProperty = response.data.data

        // Upload images if any
        if (formData.images.length > 0) {
          const imageFormData = new FormData()
          formData.images.forEach(img => {
            imageFormData.append('images', img.file)
          })
          await propertiesAPI.uploadImages(createdProperty._id, imageFormData)
        }

        toast.success('Property submitted for review! Admin will verify it shortly.')
      }

      navigate('/dashboard/host/properties')
    } catch (error) {
      console.error('Failed to save property:', error)
      toast.error(error.response?.data?.message || 'Failed to save property')
    } finally {
      setLoading(false)
    }
  }

  if (fetchingProperty) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Property' : 'Add New Property'}</h1>
        <p className="text-gray-500 mt-1">{isEditMode ? 'Update your property and resubmit for review' : 'List your property to start receiving tenants'}</p>
      </div>

      {/* Rejection Banner */}
      {isEditMode && editProperty?.verificationStatus === 'rejected' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start">
            <FiAlertCircle className="text-red-500 text-xl mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Property was rejected</h3>
              {editProperty.rejectionReason && (
                <p className="text-red-700 text-sm mt-1">Reason: {editProperty.rejectionReason}</p>
              )}
              <p className="text-red-600 text-sm mt-1">
                Resubmissions remaining: {3 - (editProperty.rejectionEditCount || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                currentStep >= step.number 
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step.number ? (
                  <FiCheck className="text-lg" />
                ) : (
                  <step.icon className="text-lg" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden md:block w-24 lg:w-32 h-1 mx-2 transition-colors ${
                  currentStep > step.number ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="hidden md:flex justify-between mt-2">
          {steps.map((step) => (
            <span key={step.number} className={`text-sm ${
              currentStep >= step.number ? 'text-primary-600 font-medium' : 'text-gray-400'
            }`}>
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`input-field ${formErrors.title ? 'border-red-500' : ''}`}
                  placeholder="e.g., Spacious 2BHK Apartment in Thamel"
                  required
                  maxLength={100}
                />
                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`p-4 border rounded-lg text-center transition ${
                        formData.type === type.value
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FiHome className="mx-auto text-2xl mb-1" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`input-field ${formErrors.description ? 'border-red-500' : ''}`}
                  rows={5}
                  placeholder="Describe your property, its features, and the neighborhood..."
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 mt-1">{formData.description.length}/2000 characters</p>
                {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`input-field ${formErrors.address ? 'border-red-500' : ''}`}
                  placeholder="e.g., 123 Main Street"
                  required
                  maxLength={200}
                />
                {formErrors.address && <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div ref={cityDropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value)
                      setShowCityDropdown(true)
                      if (!e.target.value) {
                        setFormData({ ...formData, city: '' })
                      }
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="Type to search city..."
                    className={`input-field ${formErrors.city ? 'border-red-500' : ''}`}
                    autoComplete="off"
                  />
                  {formErrors.city && <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>}
                  {showCityDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredCities.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No cities found</div>
                      ) : (
                        filteredCities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => handleCitySelect(city)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 hover:text-primary-700 transition ${
                              formData.city === city.toLowerCase() ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {city}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area/Zone</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Thamel, Lazimpat"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Near City Hospital"
                />
              </div>

              {/* Google Map */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Location on Map</label>
                <GoogleMap
                  onLocationSelect={handleLocationSelect}
                  initialLocation={
                    formData.latitude && formData.longitude
                      ? { lat: formData.latitude, lng: formData.longitude }
                      : null
                  }
                />
              </div>
            </div>
          )}

          {/* Step 3: Property Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms *</label>
                  <select
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms *</label>
                  <select
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {[1, 2, 3, 4].map((num) => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area (sq.ft)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    className={`input-field ${formErrors.area ? 'border-red-500' : ''}`}
                    placeholder="e.g., 1200"
                    maxLength={6}
                    onKeyDown={handleNumericKeyDown}
                  />
                  {formErrors.area && <p className="text-red-500 text-sm mt-1">{formErrors.area}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing Status</label>
                <div className="grid grid-cols-3 gap-3">
                  {['unfurnished', 'semi-furnished', 'fully-furnished'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, furnished: status })}
                      className={`p-3 border rounded-lg text-center text-sm transition ${
                        formData.furnished === status
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenitiesList.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`p-3 border rounded-lg text-left text-sm transition flex items-center capitalize ${
                        formData.amenities.includes(amenity)
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded border mr-2 flex items-center justify-center ${
                        formData.amenities.includes(amenity)
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-gray-300'
                      }`}>
                        {formData.amenities.includes(amenity) && <FiCheck className="text-xs" />}
                      </span>
                      {amenity.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Terms</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent (NPR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">NPR</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="monthlyRent"
                      value={formData.monthlyRent}
                      onChange={handleChange}
                      className={`input-field pl-14 ${formErrors.monthlyRent ? 'border-red-500' : ''}`}
                      placeholder="25000"
                      required
                      maxLength={8}
                      onKeyDown={handleNumericKeyDown}
                    />
                  </div>
                  {formErrors.monthlyRent && <p className="text-red-500 text-sm mt-1">{formErrors.monthlyRent}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (NPR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">NPR</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="securityDeposit"
                      value={formData.securityDeposit}
                      onChange={handleChange}
                      className={`input-field pl-14 ${formErrors.securityDeposit ? 'border-red-500' : ''}`}
                      placeholder="50000"
                      required
                      maxLength={8}
                      onKeyDown={handleNumericKeyDown}
                    />
                  </div>
                  {formErrors.securityDeposit && <p className="text-red-500 text-sm mt-1">{formErrors.securityDeposit}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Lease Duration *</label>
                <select
                  name="minimumLease"
                  value={formData.minimumLease}
                  onChange={handleChange}
                  className="input-field max-w-xs"
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                </select>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4">Pricing Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rent</span>
                    <span className="font-medium">NPR {formData.monthlyRent ? parseInt(formData.monthlyRent).toLocaleString() : '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-medium">NPR {formData.securityDeposit ? parseInt(formData.securityDeposit).toLocaleString() : '0'}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-gray-900 font-medium">Move-in Cost</span>
                    <span className="font-bold text-primary-600">
                      NPR {((parseInt(formData.monthlyRent) || 0) + (parseInt(formData.securityDeposit) || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Photos */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Photos</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photos *</label>
                <p className="text-sm text-gray-500 mb-4">Add at least 3 photos. First photo will be the cover image.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Uploaded Images */}
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={image.preview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <FiX />
                        </button>
                      </div>
                      {index === 0 && (
                        <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Upload Button */}
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition">
                    <FiPlus className="text-2xl text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                  Supported formats: JPG, PNG. Max size: 5MB per image.
                </p>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📷 Photo Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use natural lighting for best results</li>
                  <li>• Include photos of all rooms and amenities</li>
                  <li>• Show the exterior and surrounding area</li>
                  <li>• Make sure photos are clear and not blurry</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-4 py-2 rounded-lg transition ${
                currentStep === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiChevronLeft className="mr-1" /> Previous
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary flex items-center"
              >
                Next <FiChevronRight className="ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {isEditMode ? 'Updating...' : 'Publishing...'}
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" />
                    {isEditMode ? 'Update & Resubmit' : 'Publish Property'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProperty
