import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { propertiesAPI } from '../../../utils/api'
import PropertyStatusBadge from '../../../components/PropertyStatusBadge'
import { FiHome, FiPlus, FiEdit, FiTrash2, FiEye, FiMapPin, FiDollarSign, FiStar, FiMoreVertical, FiFilter, FiGrid, FiList } from 'react-icons/fi'
import { toast } from 'react-toastify'

function MyProperties() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [filter, setFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(null)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
setLoading(true)
      const response = await propertiesAPI.getHostProperties()
      setProperties(response.data.data)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const filteredProperties = filter === 'all' 
    ? properties 
    : filter === 'pending'
      ? properties.filter(p => p.verificationStatus === 'pending')
      : filter === 'rejected'
        ? properties.filter(p => p.status === 'rejected' || p.verificationStatus === 'rejected')
        : properties.filter(p => p.status === filter)

  const canEdit = (property) => {
    // Allow edit if pending or rejected (with < 3 resubmissions)
    if (property.verificationStatus === 'pending') return true
    if (property.verificationStatus === 'rejected' && (property.rejectionEditCount || 0) < 3) return true
    return false
  }

  const handleEdit = (property) => {
    if (!canEdit(property)) {
      if (property.verificationStatus === 'verified') {
        toast.error('Cannot edit an approved property')
      } else if (property.verificationStatus === 'rejected' && (property.rejectionEditCount || 0) >= 3) {
        toast.error('Maximum resubmission limit (3) reached for this property')
      }
      return
    }
    navigate(`/dashboard/host/properties/edit/${property._id}`)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertiesAPI.delete(id)
        toast.success('Property deleted successfully')
        setShowDeleteModal(null)
        fetchProperties()
      } catch (error) {
        console.error('Failed to delete property:', error)
        toast.error('Failed to delete property')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-500 mt-1">Manage your property listings</p>
        </div>
        <Link to="/dashboard/host/properties/add" className="btn-primary flex items-center w-fit">
          <FiPlus className="mr-2" />
          Add New Property
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Properties</p>
          <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active Listings</p>
          <p className="text-2xl font-bold text-green-600">{properties.filter(p => p.status === 'active' && p.verificationStatus === 'verified').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold text-orange-600">{properties.filter(p => p.verificationStatus === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Views</p>
          <p className="text-2xl font-bold text-blue-600">{properties.reduce((sum, p) => sum + (p.views || 0), 0)}</p>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
          {['all', 'active', 'pending', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                filter === f
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <FiGrid />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <FiList />
          </button>
        </div>
      </div>

      {/* Properties Grid/List */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <FiHome className="mx-auto text-4xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? "You haven't listed any properties yet."
              : `No ${filter} properties found.`
            }
          </p>
          <Link to="/dashboard/host/properties/add" className="btn-primary inline-flex items-center">
            <FiPlus className="mr-2" />
            Add Your First Property
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div key={property._id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition group">
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                {property.images && property.images.length > 0 ? (
                  <img 
                    src={property.images[0].url} 
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FiHome className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <PropertyStatusBadge status={property.status} verificationStatus={property.verificationStatus} />
                </div>
                {property.rejectionReason && (
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 p-2 rounded text-xs">
                    <p className="text-red-600 font-medium">Rejection Reason:</p>
                    <p className="text-gray-700">{property.rejectionReason}</p>
                    {property.verificationStatus === 'rejected' && (
                      <p className="text-orange-600 mt-1">Edits remaining: {3 - (property.rejectionEditCount || 0)}</p>
                    )}
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <button className="p-2 bg-white/90 rounded-full hover:bg-white transition">
                    <FiMoreVertical className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{property.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <FiMapPin className="mr-1" /> {property.address?.street}, {property.address?.city}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">{property.propertyType}</span>
                </div>

                <div className="flex items-center gap-4 my-4 text-sm">
                  <span className="flex items-center text-gray-600">
                    <FiStar className="mr-1 text-yellow-500 fill-current" />
                    {property.rating > 0 ? property.rating : 'New'}
                  </span>
                  <span className="flex items-center text-gray-600">
                    <FiEye className="mr-1" />
                    {property.views || 0}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      NPR {(property.rent || 0).toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">/mo</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/properties/${property._id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                      >
                        <FiEye />
                      </Link>
                      {canEdit(property) && (
                        <button 
                          onClick={() => handleEdit(property)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Edit property"
                        >
                          <FiEdit />
                        </button>
                      )}
                      <button 
                        onClick={() => setShowDeleteModal(property._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property) => (
            <div key={property._id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                  {property.images && property.images.length > 0 ? (
                    <img src={property.images[0].url} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <FiHome className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{property.title}</h3>
                        <PropertyStatusBadge status={property.status} verificationStatus={property.verificationStatus} />
                      </div>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <FiMapPin className="mr-1" /> {property.address?.street}, {property.address?.city}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      NPR {(property.rent || 0).toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">/mo</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                    <span className="flex items-center"><FiHome className="mr-1" /> {property.propertyType}</span>
                    <span className="flex items-center"><FiStar className="mr-1 text-yellow-500" /> {property.rating > 0 ? `${property.rating} (${property.numReviews})` : 'New'}</span>
                    <span className="flex items-center"><FiEye className="mr-1" /> {property.views || 0} views</span>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Link to={`/properties/${property._id}`} className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 border border-gray-200 rounded-lg hover:border-primary-200 transition">View</Link>
                    {canEdit(property) && (
                      <button 
                        onClick={() => handleEdit(property)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 border border-gray-200 rounded-lg hover:border-primary-200 transition"
                      >
                        Edit
                      </button>
                    )}
                    <button onClick={() => setShowDeleteModal(property._id)} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Property?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this property? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(showDeleteModal)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyProperties
