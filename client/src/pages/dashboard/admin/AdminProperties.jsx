import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminAPI } from '../../../utils/api'
import { FiHome, FiUser, FiMapPin, FiFilter, FiEye, FiCheck, FiX, FiCalendar, FiDollarSign, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { toast } from 'react-toastify'
import PropertyStatusBadge from '../../../components/PropertyStatusBadge'
import UserAvatar from '../../../components/UserAvatar'

function AdminProperties() {
  const [searchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState(searchParams.get('verification') || 'all')
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [propertyDetails, setPropertyDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    fetchProperties()
  }, [statusFilter, verificationFilter])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const params = {}
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      if (verificationFilter !== 'all') {
        params.verificationStatus = verificationFilter
      }

      const response = await adminAPI.getAllProperties(params)
      setProperties(response.data.data)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const fetchPropertyDetails = async (propertyId) => {
    try {
      setLoadingDetails(true)
      const response = await adminAPI.getPropertyDetails(propertyId)
      setPropertyDetails(response.data.data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Failed to fetch property details:', error)
      toast.error('Failed to load property details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleApprove = async (propertyId) => {
    try {
      setProcessingId(propertyId)
      await adminAPI.approveProperty(propertyId)
      toast.success('Property approved successfully')
      fetchProperties()
      if (showDetailsModal) {
        fetchPropertyDetails(propertyId)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve property')
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectModal = (property) => {
    setSelectedProperty(property)
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setProcessingId(selectedProperty._id)
      await adminAPI.rejectProperty(selectedProperty._id, rejectReason)
      toast.success('Property rejected')
      fetchProperties()
      setShowRejectModal(false)
      setRejectReason('')
      setSelectedProperty(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject property')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      rented: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getVerificationBadge = (status) => {
    const styles = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Property Management</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="rented">Rented</option>
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Verification</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          <span className="text-gray-600 ml-auto">
            {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} found
          </span>
        </div>
      </div>

      {/* Properties Display */}
      {properties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          {verificationFilter === 'pending' ? (
            <>
              <FiCheck className="mx-auto text-5xl text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No properties pending verification at the moment.</p>
            </>
          ) : (
            <>
              <FiHome className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500">No properties found</p>
            </>
          )}
        </div>
      ) : verificationFilter === 'pending' ? (
        /* Detailed Pending Properties View */
        <div className="grid grid-cols-1 gap-6">
          {properties.map((property) => (
            <div key={property._id} className="card">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Property Image */}
                <div className="lg:w-1/3">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]?.url || property.images[0]}
                      alt={property.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <FiHome className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {property.images && property.images.length > 1 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      +{property.images.length - 1} more photo{property.images.length - 1 > 1 ? 's' : ''}
                      <button
                        onClick={() => fetchPropertyDetails(property._id)}
                        className="ml-2 text-primary-600 hover:underline"
                      >
                        View all
                      </button>
                    </p>
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
                    <button
                      onClick={() => fetchPropertyDetails(property._id)}
                      className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm flex items-center gap-1"
                    >
                      <FiEye /> Full Details
                    </button>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{property.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-700">
                      <FiMapPin className="mr-2 text-gray-400 flex-shrink-0" />
                      <span>
                        {property.address?.street}, {property.address?.city}
                        {property.address?.state && `, ${property.address.state}`}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-700">
                      <FiDollarSign className="mr-2 text-gray-400 flex-shrink-0" />
                      <span className="font-semibold">
                        NPR {(property.rent || property.monthlyRent)?.toLocaleString()}/month
                      </span>
                    </div>

                    <div className="flex items-center text-gray-700">
                      <FiHome className="mr-2 text-gray-400 flex-shrink-0" />
                      <span className="capitalize">{property.propertyType}</span>
                      {property.bedrooms && (
                        <span className="ml-2">• {property.bedrooms} bed</span>
                      )}
                      {property.bathrooms && (
                        <span className="ml-2">• {property.bathrooms} bath</span>
                      )}
                    </div>

                    <div className="flex items-center text-gray-700">
                      <FiUser className="mr-2 text-gray-400 flex-shrink-0" />
                      <span>
                        Host: {property.host?.name || 'Unknown'}
                        {property.host?.rating > 0 && (
                          <span className="ml-2">⭐ {property.host.rating.toFixed(1)}</span>
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
      ) : (
        /* Standard Grid View for non-pending */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative">
                <img
                  src={property.images?.[0]?.url || property.images?.[0] || 'https://via.placeholder.com/400x200?text=No+Image'}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVerificationBadge(property.verificationStatus)}`}>
                    {property.verificationStatus}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
                
                <div className="flex items-center text-gray-600 text-sm mb-2">
                  <FiMapPin className="mr-1" />
                  <span className="line-clamp-1">
                    {property.address?.city}, {property.address?.state}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600 text-sm mb-3">
                  <FiUser className="mr-1" />
                  <span>{property.host?.name || 'Unknown Host'}</span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-primary-600 font-bold">
                    Rs. {(property.rent || property.monthlyRent)?.toLocaleString()}/mo
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(property.status)}`}>
                    {property.status}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchPropertyDetails(property._id)}
                    className="flex-1 btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm flex items-center justify-center gap-1"
                  >
                    <FiEye /> View Details
                  </button>
                  
                  {property.verificationStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(property._id)}
                        disabled={processingId === property._id}
                        className="btn bg-green-600 hover:bg-green-700 text-white text-sm px-3"
                      >
                        <FiCheck />
                      </button>
                      <button
                        onClick={() => openRejectModal(property)}
                        disabled={processingId === property._id}
                        className="btn bg-red-600 hover:bg-red-700 text-white text-sm px-3"
                      >
                        <FiX />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Property Details Modal */}
      {showDetailsModal && propertyDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Property Details</h2>
                <button
                  onClick={() => { setShowDetailsModal(false); setActiveImageIndex(0) }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {/* Property Image Gallery */}
              {propertyDetails.property.images && propertyDetails.property.images.length > 0 && (
                <div className="mb-6">
                  {/* Main Image with Navigation */}
                  <div className="relative rounded-lg overflow-hidden mb-3">
                    <img
                      src={propertyDetails.property.images[activeImageIndex]?.url || propertyDetails.property.images[activeImageIndex] || 'https://via.placeholder.com/800x400?text=No+Image'}
                      alt={`Property ${activeImageIndex + 1}`}
                      className="w-full h-80 object-cover"
                    />
                    {propertyDetails.property.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImageIndex(prev => prev === 0 ? propertyDetails.property.images.length - 1 : prev - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2"
                        >
                          <FiChevronLeft className="text-xl" />
                        </button>
                        <button
                          onClick={() => setActiveImageIndex(prev => prev === propertyDetails.property.images.length - 1 ? 0 : prev + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2"
                        >
                          <FiChevronRight className="text-xl" />
                        </button>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
                          {activeImageIndex + 1} / {propertyDetails.property.images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {propertyDetails.property.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {propertyDetails.property.images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                            activeImageIndex === index ? 'border-primary-600 ring-2 ring-primary-300' : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={img?.url || img || 'https://via.placeholder.com/100x80?text=No+Image'}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-20 h-16 object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Property Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">{propertyDetails.property.title}</h3>
                    <PropertyStatusBadge 
                      status={propertyDetails.property.status} 
                      verificationStatus={propertyDetails.property.verificationStatus}
                    />
                  </div>
                  <p className="text-gray-600 mb-4">{propertyDetails.property.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <FiMapPin className="mr-2 flex-shrink-0" />
                      {propertyDetails.property.address?.street}, {propertyDetails.property.address?.city}
                      {propertyDetails.property.address?.state && `, ${propertyDetails.property.address.state}`}
                    </div>
                    <div className="flex items-center text-gray-700 font-semibold">
                      <FiDollarSign className="mr-2 flex-shrink-0" />
                      NPR {(propertyDetails.property.rent || propertyDetails.property.monthlyRent)?.toLocaleString()}/month
                    </div>
                    {propertyDetails.property.securityDeposit && (
                      <div className="flex items-center text-gray-600">
                        <FiDollarSign className="mr-2 flex-shrink-0" />
                        Security Deposit: NPR {propertyDetails.property.securityDeposit?.toLocaleString()}
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <FiHome className="mr-2 flex-shrink-0" />
                      <span className="capitalize">{propertyDetails.property.propertyType}</span>
                      {propertyDetails.property.bedrooms && (
                        <span className="ml-2">• {propertyDetails.property.bedrooms} bed</span>
                      )}
                      {propertyDetails.property.bathrooms && (
                        <span className="ml-2">• {propertyDetails.property.bathrooms} bath</span>
                      )}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiCalendar className="mr-2 flex-shrink-0" />
                      Listed: {new Date(propertyDetails.property.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Amenities */}
                  {propertyDetails.property.amenities && propertyDetails.property.amenities.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Amenities:</h4>
                      <div className="flex flex-wrap gap-2">
                        {propertyDetails.property.amenities.map((amenity, index) => (
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
                </div>

                {/* Host Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Host Information</h4>
                  <div className="flex items-center mb-3">
                    <UserAvatar
                      name={propertyDetails.property.host?.name}
                      avatarUrl={propertyDetails.property.host?.avatar}
                      size="lg"
                    />
                    <div className="ml-3">
                      <p className="font-medium">{propertyDetails.property.host?.name}</p>
                      <p className="text-sm text-gray-600">{propertyDetails.property.host?.email}</p>
                    </div>
                  </div>
                  {propertyDetails.property.host?.phone && (
                    <p className="text-sm text-gray-600">Phone: {propertyDetails.property.host.phone}</p>
                  )}
                  {propertyDetails.property.host?.rating > 0 && (
                    <p className="text-sm text-gray-600 mt-1">Rating: ⭐ {propertyDetails.property.host.rating.toFixed(1)}</p>
                  )}
                </div>
              </div>

              {/* Leases */}
              {propertyDetails.leases?.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Lease History ({propertyDetails.leases.length})</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600">
                          <th className="pb-2">Tenant</th>
                          <th className="pb-2">Period</th>
                          <th className="pb-2">Rent</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {propertyDetails.leases.map((lease) => (
                          <tr key={lease._id} className="border-t border-gray-200">
                            <td className="py-2">{lease.tenant?.name}</td>
                            <td className="py-2">
                              {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                            </td>
                            <td className="py-2">Rs. {lease.monthlyRent?.toLocaleString()}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                lease.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {lease.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              {propertyDetails.property.verificationStatus === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleApprove(propertyDetails.property._id)
                    }}
                    disabled={processingId}
                    className="flex-1 btn bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                  >
                    <FiCheck /> Approve Property
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setActiveImageIndex(0)
                      openRejectModal(propertyDetails.property)
                    }}
                    disabled={processingId}
                    className="flex-1 btn bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                  >
                    <FiX /> Reject Property
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Reject Property</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting "{selectedProperty?.title}"
            </p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Incomplete documentation, misleading photos, etc."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  setSelectedProperty(null)
                }}
                className="flex-1 btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                disabled={processingId}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white"
                disabled={processingId || !rejectReason.trim()}
              >
                {processingId ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProperties
