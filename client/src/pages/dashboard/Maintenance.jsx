import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { maintenanceAPI, leasesAPI } from '../../utils/api'
import { toast } from 'react-toastify'
import { FiTool, FiPlus, FiClock, FiCheckCircle, FiAlertCircle, FiMessageSquare, FiImage, FiCalendar, FiUser, FiHome, FiFilter, FiX } from 'react-icons/fi'

function Maintenance() {
  const { user } = useAuthStore()
  const [requests, setRequests] = useState([])
  const [userProperties, setUserProperties] = useState([])
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newRequest, setNewRequest] = useState({
    title: '',
    category: 'plumbing',
    priority: 'medium',
    description: '',
    property: ''
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
      setUserProperties(properties)
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
      await maintenanceAPI.create({
        title: newRequest.title,
        category: newRequest.category,
        priority: newRequest.priority,
        description: newRequest.description,
        property: newRequest.property
      })
      toast.success('Maintenance request submitted successfully!')
      setShowCreateModal(false)
      setNewRequest({ title: '', category: 'plumbing', priority: 'medium', description: '', property: '' })
      fetchMaintenanceRequests() // Refresh the list
    } catch (error) {
      console.error('Failed to create maintenance request:', error)
      toast.error(error.response?.data?.message || 'Failed to submit maintenance request')
    } finally {
      setSubmitting(false)
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
                  </div>

                  {/* Sidebar Info */}
                  <div className="lg:w-64 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Submitted by</p>
                      <div className="flex items-center">
                        <img src={request.reportedBy?.avatar || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 rounded-full mr-2" />
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
                      <button className="flex items-center text-sm text-gray-600 hover:text-primary-600 transition">
                        <FiMessageSquare className="mr-1" /> View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                    View Details
                  </button>
                  {user?.role === 'host' && request.status === 'pending' && (
                    <>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                        Start Progress
                      </button>
                    </>
                  )}
                  {user?.role === 'host' && request.status === 'in-progress' && (
                    <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition">
                      Mark Complete
                    </button>
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
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition cursor-pointer">
                  <FiImage className="mx-auto text-3xl text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload images</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
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
    </div>
  )
}

export default Maintenance
