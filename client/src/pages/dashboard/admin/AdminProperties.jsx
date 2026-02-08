import { useState, useEffect } from 'react'
import { adminAPI } from '../../../utils/api'
import { FiHome, FiUser, FiMapPin, FiFilter, FiEye, FiCheck, FiX, FiCalendar, FiDollarSign } from 'react-icons/fi'
import { toast } from 'react-toastify'

function AdminProperties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [propertyDetails, setPropertyDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

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

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <FiHome className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500">No properties found</p>
          </div>
        ) : (
          properties.map((property) => (
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
                    Rs. {property.monthlyRent?.toLocaleString()}/mo
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
          ))
        )}
      </div>

      {/* Property Details Modal */}
      {showDetailsModal && propertyDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Property Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {/* Property Images */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-2">
                  {propertyDetails.property.images?.slice(0, 3).map((img, index) => (
                    <img
                      key={index}
                      src={img?.url || img || 'https://via.placeholder.com/200x150?text=No+Image'}
                      alt={`Property ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>

              {/* Property Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{propertyDetails.property.title}</h3>
                  <p className="text-gray-600 mb-4">{propertyDetails.property.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <FiMapPin className="mr-2" />
                      {propertyDetails.property.address?.street}, {propertyDetails.property.address?.city}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiDollarSign className="mr-2" />
                      Rs. {propertyDetails.property.monthlyRent?.toLocaleString()}/month
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiCalendar className="mr-2" />
                      Listed: {new Date(propertyDetails.property.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Host Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Host Information</h4>
                  <div className="flex items-center mb-3">
                    <img
                      src={propertyDetails.property.host?.avatar || 'https://via.placeholder.com/40'}
                      alt={propertyDetails.property.host?.name}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-medium">{propertyDetails.property.host?.name}</p>
                      <p className="text-sm text-gray-600">{propertyDetails.property.host?.email}</p>
                    </div>
                  </div>
                  {propertyDetails.property.host?.phone && (
                    <p className="text-sm text-gray-600">Phone: {propertyDetails.property.host.phone}</p>
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
                    className="flex-1 btn bg-green-600 hover:bg-green-700 text-white"
                  >
                    Approve Property
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      openRejectModal(propertyDetails.property)
                    }}
                    disabled={processingId}
                    className="flex-1 btn bg-red-600 hover:bg-red-700 text-white"
                  >
                    Reject Property
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
