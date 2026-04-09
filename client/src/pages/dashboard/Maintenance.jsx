import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { maintenanceAPI, leasesAPI } from '../../utils/api'
import { toast } from 'react-toastify'
import UserAvatar from '../../components/UserAvatar'
import { FiTool, FiPlus, FiClock, FiCheckCircle, FiAlertCircle, FiMessageSquare, FiImage, FiCalendar, FiUser, FiHome, FiFilter, FiX, FiUpload, FiTrash2 } from 'react-icons/fi'

function Maintenance() {
  const { user } = useAuthStore()
  const [requests, setRequests] = useState([])
  const [userProperties, setUserProperties] = useState([])
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState([])
  const [newRequest, setNewRequest] = useState({
    title: '',
    category: 'plumbing',
    priority: 'medium',
    description: '',
    property: ''
  })
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: '',
    estimatedCost: '',
    actualCost: ''
  })

  useEffect(() => {
    fetchMaintenanceRequests()
    fetchUserProperties()
  }, [user])

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true)
      const response = await maintenanceAPI.getAll()
      setRequests(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error)
      toast.error('Failed to load maintenance requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProperties = async () => {
    try {
      // Fetch user's leases to get properties they can submit maintenance for
      const response = await leasesAPI.getAll()
      const leases = response.data.data || []
      const properties = leases
        .filter(lease => lease.status === 'active')
        .map(lease => ({
          id: lease.property?._id || lease.property,
          name: lease.property?.title || 'Property'
        }))

      const uniqueProperties = Array.from(
        new Map(properties.map((property) => [property.id, property])).values()
      )

      setUserProperties(uniqueProperties)
    } catch (error) {
      console.error('Failed to fetch user properties:', error)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><FiClock className="mr-1" /> Pending</span>
      case 'in-progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><FiTool className="mr-1" /> In Progress</span>
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><FiCheckCircle className="mr-1" /> Completed</span>
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><FiX className="mr-1" /> Cancelled</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">High</span>
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">Medium</span>
      case 'low':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Low</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{priority}</span>
    }
  }

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + selectedImages.length > 5) {
      toast.error('You can upload a maximum of 5 images')
      return
    }
    
    // Validate file size and type
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`)
        return false
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        toast.error(`${file.name} is not a valid image format`)
        return false
      }
      return true
    })
    
    setSelectedImages([...selectedImages, ...validFiles])
    
    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls])
  }

  const handleRemoveImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index)
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index])
    
    setSelectedImages(newImages)
    setImagePreviewUrls(newPreviews)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setNewRequest({ title: '', category: 'plumbing', priority: 'medium', description: '', property: '' })
    // Clean up image previews
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url))
    setSelectedImages([])
    setImagePreviewUrls([])
  }

  const handleCreateRequest = async (e) => {
    e.preventDefault()
    // Validate
    if (!newRequest.property) {
      toast.error('Please select a property')
      return
    }
    if (!newRequest.title.trim() || newRequest.title.trim().length < 3) {
      toast.error('Issue title must be at least 3 characters')
      return
    }
    if (!newRequest.description.trim() || newRequest.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters')
      return
    }
    try {
      setSubmitting(true)
      
      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('title', newRequest.title)
      formData.append('category', newRequest.category)
      formData.append('priority', newRequest.priority)
      formData.append('description', newRequest.description)
      formData.append('property', newRequest.property)
      
      // Append images
      selectedImages.forEach(image => {
        formData.append('images', image)
      })
      
      await maintenanceAPI.create(formData)
      toast.success('Maintenance request submitted successfully!')
      closeCreateModal()
      fetchMaintenanceRequests() // Refresh the list
    } catch (error) {
      console.error('Failed to create maintenance request:', error)
      toast.error(error.response?.data?.message || 'Failed to submit maintenance request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const payload = {
        status: updateData.status,
        notes: updateData.notes
      }
      
      // Add cost fields if they have values
      if (updateData.estimatedCost) {
        payload.estimatedCost = parseFloat(updateData.estimatedCost)
      }
      if (updateData.actualCost) {
        payload.actualCost = parseFloat(updateData.actualCost)
      }
      
      // If marking as resolved, send as resolutionNotes
      if (updateData.status === 'resolved') {
        payload.resolutionNotes = updateData.notes
      }
      
      await maintenanceAPI.update(selectedRequest._id, payload)
      toast.success('Maintenance status updated successfully!')
      setShowUpdateModal(false)
      setSelectedRequest(null)
      setUpdateData({ status: '', notes: '', estimatedCost: '', actualCost: '' })
      fetchMaintenanceRequests()
    } catch (error) {
      console.error('Failed to update maintenance:', error)
      toast.error(error.response?.data?.message || 'Failed to update maintenance')
    } finally {
      setSubmitting(false)
    }
  }

  const openUpdateModal = (request, newStatus) => {
    setSelectedRequest(request)
    setUpdateData({
      status: newStatus,
      notes: '',
      estimatedCost: request.estimatedCost || '',
      actualCost: request.actualCost || ''
    })
    setShowUpdateModal(true)
  }

  const openDetailsModal = (request) => {
    console.log('Opening details for:', request)
    setSelectedRequest(request)
    setShowDetailsModal(true)
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedRequest(null)
    setSelectedImageIndex(null)
  }

  const formatAddress = (address) => {
    if (!address) return ''
    if (typeof address === 'string') return address
    // If address is an object, format it
    const parts = []
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.zipCode) parts.push(address.zipCode)
    if (address.country) parts.push(address.country)
    return parts.join(', ')
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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'host' 
              ? 'Manage maintenance requests from your tenants'
              : 'Submit and track maintenance requests'
            }
          </p>
        </div>
        {user?.role === 'tenant' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            New Request
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <FiTool className="text-xl text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === 'pending').length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FiClock className="text-xl text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{requests.filter(r => r.status === 'in-progress').length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiTool className="text-xl text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'resolved').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheckCircle className="text-xl text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
        {['all', 'pending', 'in-progress', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              filter === f
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <FiTool className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance requests</h3>
            <p className="text-gray-500 mb-4">
              {filter === 'all' 
                ? 'No maintenance requests have been submitted yet.'
                : `No ${filter} requests found.`
              }
            </p>
            {user?.role === 'tenant' && (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                <FiPlus className="inline mr-2" />
                Submit a Request
              </button>
            )}
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request._id} className="bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Request Details */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      {getStatusBadge(request.status)}
                      {getPriorityBadge(request.priority)}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{request.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <FiHome className="mr-1" /> {request.property?.title || 'Property'}
                      </span>
                      <span className="flex items-center">
                        <FiCalendar className="mr-1" /> {new Date(request.reportedAt || request.createdAt).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {request.category?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Other'}
                      </span>
                    </div>

                    {request.images && request.images.length > 0 && (
                      <div className="flex items-center gap-2 mt-4">
                        <FiImage className="text-gray-400" />
                        <div className="flex -space-x-2">
                          {request.images.map((img, idx) => (
                            <img key={idx} src={img.url || img} alt="" className="w-10 h-10 rounded border-2 border-white object-cover" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{request.images.length} attachment(s)</span>
                      </div>
                    )}

                    {/* Status Updates / Notes */}
                    {(request.notes || request.resolutionNotes) && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-start">
                          <FiMessageSquare className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-blue-800 mb-1">
                              {request.status === 'resolved' ? 'Resolution Notes' : 'Progress Update'}
                            </p>
                            <p className="text-sm text-blue-900">
                              {request.resolutionNotes || request.notes}
                            </p>
                            {(request.estimatedCost || request.actualCost) && (
                              <div className="mt-2 flex gap-4 text-xs text-blue-700">
                                {request.estimatedCost && (
                                  <span>Estimated: Rs. {parseFloat(request.estimatedCost).toFixed(2)}</span>
                                )}
                                {request.actualCost && (
                                  <span>Actual: Rs. {parseFloat(request.actualCost).toFixed(2)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Info */}
                  <div className="lg:w-64 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Submitted by</p>
                      <div className="flex items-center">
                        <UserAvatar name={request.reportedBy?.name} avatar={request.reportedBy?.avatar} size="sm" className="mr-2" />
                        <span className="text-sm font-medium text-gray-900">{request.reportedBy?.name || 'User'}</span>
                      </div>
                    </div>

                    {request.status === 'resolved' && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 mb-1">Resolved on</p>
                        <p className="text-sm font-medium text-green-800">{new Date(request.resolvedAt).toLocaleDateString()}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => openDetailsModal(request)}
                        className="flex items-center text-sm text-gray-600 hover:text-primary-600 transition"
                      >
                        <FiMessageSquare className="mr-1" /> View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => openDetailsModal(request)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    View Details
                  </button>
                  {user?.role === 'host' && request.status === 'pending' && (
                    <button
                      onClick={() => openUpdateModal(request, 'in-progress')}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                    >
                      Start Progress
                    </button>
                  )}
                  {user?.role === 'host' && request.status === 'in-progress' && (
                    <>
                      <button
                        onClick={() => openUpdateModal(request, 'in-progress')}
                        className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
                      >
                        Update Progress
                      </button>
                      <button
                        onClick={() => openUpdateModal(request, 'resolved')}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                      >
                        Mark Complete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">New Maintenance Request</h2>
                <button onClick={closeCreateModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                <select 
                  value={newRequest.property}
                  onChange={(e) => setNewRequest({...newRequest, property: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Select property</option>
                  {userProperties.map(prop => (
                    <option key={prop.id} value={prop.id}>{prop.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
                <input 
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  className="input-field"
                  placeholder="Brief description of the issue"
                  required
                  minLength={3}
                  maxLength={100}
                />
                <p className="text-xs text-gray-400 mt-1">{newRequest.title.length}/100 characters</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={newRequest.category}
                    onChange={(e) => setNewRequest({...newRequest, category: e.target.value})}
                    className="input-field"
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC</option>
                    <option value="appliance">Appliance</option>
                    <option value="structural">Structural</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select 
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({...newRequest, priority: e.target.value})}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  className="input-field"
                  rows={4}
                  placeholder="Provide detailed description of the issue..."
                  required
                  minLength={10}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-400 mt-1">{newRequest.description.length}/1000 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition cursor-pointer">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <FiUpload className="mx-auto text-3xl text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload images</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB (max 5 images)</p>
                    </label>
                  </div>
                  
                  {imagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {updateData.status === 'in-progress' ? 'Update Maintenance Progress' : 'Complete Maintenance'}
                </h2>
                <button onClick={() => setShowUpdateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-1">{selectedRequest.title}</h3>
                <p className="text-sm text-gray-600">{selectedRequest.description}</p>
              </div>

              {updateData.status === 'in-progress' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Update</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                    className="input-field"
                  >
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Mark as Resolved</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {updateData.status === 'resolved' ? 'Resolution Notes' : 'Progress Notes'}
                </label>
                <textarea
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({...updateData, notes: e.target.value})}
                  className="input-field"
                  rows={4}
                  placeholder={updateData.status === 'resolved' 
                    ? 'Describe how the issue was resolved...'
                    : 'Update on the current progress...'
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (Rs)</label>
                  <input
                    type="number"
                    value={updateData.estimatedCost}
                    onChange={(e) => setUpdateData({...updateData, estimatedCost: e.target.value})}
                    className="input-field"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                {updateData.status === 'resolved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost (Rs)</label>
                    <input
                      type="number"
                      value={updateData.actualCost}
                      onChange={(e) => setUpdateData({...updateData, actualCost: e.target.value})}
                      className="input-field"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
                    updateData.status === 'resolved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : updateData.status === 'resolved' ? 'Mark as Complete' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8 flex items-center justify-center">
            <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedRequest.title || 'Maintenance Request'}</h2>
                  <p className="text-sm text-gray-500">Request ID: {selectedRequest._id?.slice(-8) || 'N/A'}</p>
                </div>
                <button 
                  onClick={closeDetailsModal} 
                  className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  type="button"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="space-y-6">
                  {/* Status & Priority */}
                  <div className="flex flex-wrap items-center gap-3">
                    {getStatusBadge(selectedRequest.status)}
                    {getPriorityBadge(selectedRequest.priority)}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {selectedRequest.category?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Other'}
                    </span>
                  </div>

                  {/* Property & Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <FiHome className="mr-2" />
                        <span>Property</span>
                      </div>
                      <p className="font-medium text-gray-900">{selectedRequest.property?.title || 'N/A'}</p>
                      {selectedRequest.property?.address && (
                        <p className="text-sm text-gray-600 mt-1">{formatAddress(selectedRequest.property.address)}</p>
                      )}
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <FiCalendar className="mr-2" />
                        <span>Submission Date</span>
                      </div>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedRequest.reportedAt || selectedRequest.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Submitted By */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <FiUser className="mr-2" />
                      <span>Submitted By</span>
                    </div>
                    <div className="flex items-center">
                      <UserAvatar 
                        name={selectedRequest.reportedBy?.name || 'User'} 
                        avatar={selectedRequest.reportedBy?.avatar} 
                        size="md" 
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{selectedRequest.reportedBy?.name || 'User'}</p>
                        {selectedRequest.reportedBy?.email && (
                          <p className="text-sm text-gray-600">{selectedRequest.reportedBy.email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.description || 'No description provided'}</p>
                    </div>
                  </div>

                  {/* Images Gallery */}
                  {selectedRequest.images && selectedRequest.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <FiImage className="mr-2" />
                        <span>Attachments ({selectedRequest.images.length})</span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {selectedRequest.images.map((img, idx) => (
                          <div 
                            key={idx} 
                            className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-500 transition-all aspect-square"
                            onClick={() => setSelectedImageIndex(idx)}
                          >
                            <img
                              src={img.url || img}
                              alt={`Attachment ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found'
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                              <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                View Full
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cost Information */}
                  {(selectedRequest.estimatedCost || selectedRequest.actualCost) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedRequest.estimatedCost && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-600 font-medium mb-1">Estimated Cost</p>
                            <p className="text-2xl font-bold text-blue-900">
                              Rs. {parseFloat(selectedRequest.estimatedCost).toFixed(2)}
                            </p>
                          </div>
                        )}
                        {selectedRequest.actualCost && (
                          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-xs text-green-600 font-medium mb-1">Actual Cost</p>
                            <p className="text-2xl font-bold text-green-900">
                              Rs. {parseFloat(selectedRequest.actualCost).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Updates / Notes */}
                  {(selectedRequest.notes || selectedRequest.resolutionNotes) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <FiMessageSquare className="mr-2" />
                        <span>{selectedRequest.status === 'resolved' ? 'Resolution Notes' : 'Progress Updates'}</span>
                      </h3>
                      <div className={`p-4 rounded-lg border ${
                        selectedRequest.status === 'resolved' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {selectedRequest.resolutionNotes || selectedRequest.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Resolution Details */}
                  {selectedRequest.status === 'resolved' && selectedRequest.resolvedAt && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center mb-2">
                        <FiCheckCircle className="text-green-600 mr-2" />
                        <span className="font-semibold text-green-900">Completed on</span>
                      </div>
                      <p className="text-green-800">
                        {new Date(selectedRequest.resolvedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                {user?.role === 'host' && selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => {
                      closeDetailsModal()
                      openUpdateModal(selectedRequest, 'in-progress')
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    type="button"
                  >
                    Start Progress
                  </button>
                )}
                {user?.role === 'host' && selectedRequest.status === 'in-progress' && (
                  <>
                    <button
                      onClick={() => {
                        closeDetailsModal()
                        openUpdateModal(selectedRequest, 'in-progress')
                      }}
                      className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                      type="button"
                    >
                      Update Progress
                    </button>
                    <button
                      onClick={() => {
                        closeDetailsModal()
                        openUpdateModal(selectedRequest, 'resolved')
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      type="button"
                    >
                      Mark Complete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImageIndex !== null && selectedRequest?.images && selectedRequest.images[selectedImageIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-[60] flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors z-10"
            type="button"
          >
            <FiX className="text-2xl" />
          </button>
          
          {selectedRequest.images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + selectedRequest.images.length) % selectedRequest.images.length)}
                className="absolute left-4 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors text-3xl font-bold z-10"
                type="button"
              >
                ‹
              </button>
              
              <button
                onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % selectedRequest.images.length)}
                className="absolute right-4 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors text-3xl font-bold z-10"
                type="button"
              >
                ›
              </button>
            </>
          )}
          
          <div className="max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={selectedRequest.images[selectedImageIndex].url || selectedRequest.images[selectedImageIndex]}
              alt={`Full size ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://via.placeholder.com/800?text=Image+Not+Found'
              }}
            />
          </div>
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-60 px-4 py-2 rounded-full">
            {selectedImageIndex + 1} / {selectedRequest.images.length}
          </div>
        </div>
      )}
    </div>
  )
}

export default Maintenance
