import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { propertiesAPI } from '../../../utils/api'
import { toast } from 'react-toastify'
import { FiHome, FiMapPin, FiDollarSign, FiImage, FiX, FiPlus, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

function AddProperty() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
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
    URL.revokeObjectURL(newImages[index].preview)
    newImages.splice(index, 1)
    setFormData({ ...formData, images: newImages })
  }

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate images
    if (formData.images.length < 3) {
      toast.error('Please upload at least 3 photos of your property')
      setCurrentStep(5) // Go to photos step
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
      navigate('/dashboard/host/properties')
    } catch (error) {
      console.error('Failed to create property:', error)
      toast.error(error.response?.data?.message || 'Failed to create property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
        <p className="text-gray-500 mt-1">List your property to start receiving tenants</p>
      </div>

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
                  className="input-field"
                  placeholder="e.g., Spacious 2BHK Apartment in Thamel"
                  required
                />
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
                  className="input-field"
                  rows={5}
                  placeholder="Describe your property, its features, and the neighborhood..."
                  required
                />
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
                  className="input-field"
                  placeholder="e.g., 123 Main Street"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select city</option>
                    <option value="kathmandu">Kathmandu</option>
                    <option value="lalitpur">Lalitpur</option>
                    <option value="bhaktapur">Bhaktapur</option>
                    <option value="pokhara">Pokhara</option>
                    <option value="biratnagar">Biratnagar</option>
                    <option value="birgunj">Birgunj</option>
                  </select>
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

              {/* Map Placeholder */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FiMapPin className="mx-auto text-4xl text-gray-400 mb-2" />
                <p className="text-gray-500">Map integration will be added here</p>
                <p className="text-sm text-gray-400">Pin your property location on the map</p>
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
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 1200"
                  />
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
                      type="number"
                      name="monthlyRent"
                      value={formData.monthlyRent}
                      onChange={handleChange}
                      className="input-field pl-14"
                      placeholder="25000"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (NPR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">NPR</span>
                    <input
                      type="number"
                      name="securityDeposit"
                      value={formData.securityDeposit}
                      onChange={handleChange}
                      className="input-field pl-14"
                      placeholder="50000"
                      required
                    />
                  </div>
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
                    Publishing...
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" />
                    Publish Property
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
