import { useState, useEffect } from 'react'
import { adminAPI } from '../../../utils/api'
import PropertyStatusBadge from '../../../components/PropertyStatusBadge'
import GoogleMap from '../../../components/GoogleMap'
import { FiCheck, FiX, FiMapPin, FiDollarSign, FiHome, FiUser } from 'react-icons/fi'
import { toast } from 'react-toastify'

function PropertyVerification() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchPendingProperties()
  }, [])

  const fetchPendingProperties = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getPendingProperties()
      setProperties(response.data.data)
    } catch (error) {
      console.error('Failed to fetch pending properties:', error)
      toast.error('Failed to load pending properties')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (propertyId) => {
    if (window.confirm('Are you sure you want to approve this property?')) {
      try {
        setProcessingId(propertyId)
        await adminAPI.approveProperty(propertyId)
        toast.success('Property approved successfully!')
        // Remove from list
        setProperties(properties.filter(p => p._id !== propertyId))
      } catch (error) {
        console.error('Failed to approve property:', error)
        toast.error(error.response?.data?.message || 'Failed to approve property')
      } finally {
        setProcessingId(null)
      }
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setProcessingId(selectedProperty._id)
      await adminAPI.rejectProperty(selectedProperty._id, rejectionReason)
      toast.success('Property rejected')
      // Remove from list
      setProperties(properties.filter(p => p._id !== selectedProperty._id))
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedProperty(null)
    } catch (error) {
      console.error('Failed to reject property:', error)
      toast.error(error.response?.data?.message || 'Failed to reject property')
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectModal = (property) => {
    setSelectedProperty(property)
    setShowRejectModal(true)
  }

  const closeRejectModal = () => {
    setShowRejectModal(false)
    setRejectionReason('')
    setSelectedProperty(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending properties...</p>
        </div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Property Verification</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <FiCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No properties pending verification at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Property Verification</h1>
        <p className="text-gray-600">{properties.length} properties awaiting approval</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {properties.map((property) => (
          <div key={property._id} className="card">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Property Image */}
              <div className="lg:w-1/3">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0].url}
                    alt={property.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <FiHome className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="lg:w-2/3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{property.title}</h3>
                    <PropertyStatusBadge 
                      status={property.status} 
                      verificationStatus={property.verificationStatus}
                    />
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{property.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-gray-700">
                    <FiMapPin className="mr-2 text-gray-400" />
                    <span>
                      {property.address?.street}, {property.address?.city}
                      {property.address?.state && `, ${property.address.state}`}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <FiDollarSign className="mr-2 text-gray-400" />
                    <span className="font-semibold">
                      NPR {property.rent?.toLocaleString()}/month
                    </span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <FiHome className="mr-2 text-gray-400" />
                    <span className="capitalize">{property.propertyType}</span>
                    {property.bedrooms && (
                      <span className="ml-2">• {property.bedrooms} bed</span>
                    )}
                    {property.bathrooms && (
                      <span className="ml-2">• {property.bathrooms} bath</span>
                    )}
                  </div>

                  <div className="flex items-center text-gray-700">
                    <FiUser className="mr-2 text-gray-400" />
                    <span>
                      Host: {property.host?.name || 'Unknown'}
                      {property.host?.rating > 0 && (
                        <span className="ml-2 flex items-center gap-1"><FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {property.host.rating.toFixed(1)}</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Amenities:</h4>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {amenity.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property Location Map */}
                {property.location && property.location.coordinates && property.location.coordinates.length === 2 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Property Location:</h4>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <GoogleMap
                        initialLocation={{
                          lat: property.location.coordinates[1],
                          lng: property.location.coordinates[0]
                        }}
                        onLocationSelect={() => {}} // Read-only mode
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Coordinates: {property.location.coordinates[1].toFixed(6)}, {property.location.coordinates[0].toFixed(6)}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(property._id)}
                    disabled={processingId === property._id}
                    className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                  >
                    <FiCheck />
                    {processingId === property._id ? 'Approving...' : 'Approve Property'}
                  </button>
                  
                  <button
                    onClick={() => openRejectModal(property)}
                    disabled={processingId === property._id}
                    className="flex-1 btn bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                  >
                    <FiX />
                    {processingId === property._id ? 'Rejecting...' : 'Reject Property'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Reject Property</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting "{selectedProperty?.title}"
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Images are not clear, incomplete information, etc."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />

            <div className="flex gap-3">
              <button
                onClick={closeRejectModal}
                className="flex-1 btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                disabled={processingId}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white"
                disabled={processingId || !rejectionReason.trim()}
              >
                {processingId ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyVerification
