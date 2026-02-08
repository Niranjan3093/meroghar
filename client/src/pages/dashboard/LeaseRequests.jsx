import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { leaseRequestsAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-toastify'
import { 
  FiHome, FiCalendar, FiDollarSign, FiClock, 
  FiCheck, FiX, FiAlertCircle, FiUser, FiMessageSquare,
  FiFileText, FiChevronRight, FiFilter
} from 'react-icons/fi'

function LeaseRequests() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [leaseRequests, setLeaseRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [responseAction, setResponseAction] = useState('')
  const [responseMessage, setResponseMessage] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchLeaseRequests()
  }, [])

  const fetchLeaseRequests = async () => {
    try {
      setLoading(true)
      const response = await leaseRequestsAPI.getAll()
      setLeaseRequests(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch lease requests:', error)
      toast.error('Failed to load lease requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (request, action) => {
    setSelectedRequest(request)
    setResponseAction(action)
    setResponseMessage('')
    setShowResponseModal(true)
  }

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return

    setProcessing(true)
    try {
      if (responseAction === 'approve') {
        await leaseRequestsAPI.approve(selectedRequest._id, { message: responseMessage })
        toast.success('Lease request approved! Waiting for tenant to pay security deposit.')
      } else if (responseAction === 'reject') {
        await leaseRequestsAPI.reject(selectedRequest._id, { message: responseMessage })
        toast.success('Lease request rejected')
      } else if (responseAction === 'cancel') {
        await leaseRequestsAPI.cancel(selectedRequest._id, { reason: responseMessage })
        toast.success('Lease request cancelled')
      }
      
      setShowResponseModal(false)
      fetchLeaseRequests()
    } catch (error) {
      console.error('Failed to process request:', error)
      toast.error(error.response?.data?.message || 'Failed to process request')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      'payment-pending': 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.pending}`}>
        {status.replace('-', ' ')}
      </span>
    )
  }

  const filteredRequests = leaseRequests.filter(req => {
    if (filter === 'all') return true
    return req.status === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lease requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lease Requests</h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'host' 
              ? 'Manage lease requests from potential tenants'
              : 'Track your lease requests'}
          </p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center space-x-2">
          <FiFilter className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <FiFileText className="mx-auto text-5xl text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lease Requests</h3>
          <p className="text-gray-600">
            {filter !== 'all' 
              ? `No ${filter} requests found`
              : user.role === 'host'
                ? 'You haven\'t received any lease requests yet'
                : 'You haven\'t submitted any lease requests yet'}
          </p>
          {user.role === 'tenant' && (
            <button
              onClick={() => navigate('/properties')}
              className="btn-primary mt-4"
            >
              Browse Properties
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div 
              key={request._id}
              className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Property Info */}
                <div className="flex items-start space-x-4 flex-1">
                  {request.property?.images?.[0] && (
                    <img
                      src={request.property.images[0].url}
                      alt={request.property.title}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {request.property?.title || 'Property'}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <FiUser className="mr-1" size={14} />
                      {user.role === 'host' 
                        ? `Tenant: ${request.tenant?.name}`
                        : `Host: ${request.host?.name}`}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <FiCalendar className="mr-1" />
                        Move-in: {new Date(request.proposedMoveIn).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <FiClock className="mr-1" />
                        {request.proposedDuration}
                      </span>
                      <span className="flex items-center">
                        <FiDollarSign className="mr-1" />
                        NPR {request.securityDeposit?.toLocaleString()} deposit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:flex-shrink-0">
                  {/* Host Actions for Pending Requests */}
                  {user.role === 'host' && request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(request, 'approve')}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center"
                      >
                        <FiCheck className="mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(request, 'reject')}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition flex items-center"
                      >
                        <FiX className="mr-1" /> Reject
                      </button>
                    </>
                  )}

                  {/* Tenant Actions */}
                  {user.role === 'tenant' && request.status === 'approved' && !request.securityDepositPaid && (
                    <button
                      onClick={() => navigate(`/dashboard/lease-requests/${request._id}/pay`)}
                      className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition flex items-center"
                    >
                      <FiDollarSign className="mr-1" /> Pay Deposit
                    </button>
                  )}

                  {/* Cancel Button for Pending/Approved */}
                  {['pending', 'approved'].includes(request.status) && (
                    <button
                      onClick={() => handleAction(request, 'cancel')}
                      className="px-4 py-2 text-gray-600 bg-gray-100 text-sm rounded-lg hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  )}

                  {/* Message Button */}
                  {request.conversation && (
                    <button
                      onClick={() => navigate(`/dashboard/messages?conversation=${request.conversation}`)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition"
                      title="View Conversation"
                    >
                      <FiMessageSquare />
                    </button>
                  )}

                  {/* View Lease for Completed */}
                  {request.status === 'completed' && request.lease && (
                    <button
                      onClick={() => navigate(`/dashboard/leases/${typeof request.lease === 'object' ? request.lease._id : request.lease}`)}
                      className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition flex items-center"
                    >
                      View Lease <FiChevronRight className="ml-1" />
                    </button>
                  )}
                </div>
              </div>

              {/* Host Response Message */}
              {request.hostResponse?.message && (
                <div className={`mt-4 p-3 rounded-lg ${
                  request.status === 'approved' ? 'bg-green-50 border border-green-200' :
                  request.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <p className="text-sm">
                    <span className="font-medium">Host Response: </span>
                    {request.hostResponse.message}
                  </p>
                </div>
              )}

              {/* Tenant Message */}
              {request.message && user.role === 'host' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Tenant Message: </span>
                    {request.message}
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-400 mt-4">
                Submitted: {new Date(request.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {responseAction === 'approve' && 'Approve Lease Request'}
              {responseAction === 'reject' && 'Reject Lease Request'}
              {responseAction === 'cancel' && 'Cancel Lease Request'}
            </h3>
            
            {/* Request Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-900">{selectedRequest.property?.title}</p>
              <p className="text-sm text-gray-600">
                {user.role === 'host' 
                  ? `Tenant: ${selectedRequest.tenant?.name}`
                  : `Host: ${selectedRequest.host?.name}`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Move-in: {new Date(selectedRequest.proposedMoveIn).toLocaleDateString()} • 
                Deposit: NPR {selectedRequest.securityDeposit?.toLocaleString()}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {responseAction === 'approve' && 'Message to Tenant (Optional)'}
                {responseAction === 'reject' && 'Reason for Rejection (Optional)'}
                {responseAction === 'cancel' && 'Reason for Cancellation (Optional)'}
              </label>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={
                  responseAction === 'approve' 
                    ? 'Great! Looking forward to having you as a tenant...'
                    : responseAction === 'reject'
                      ? 'Sorry, the property is no longer available...'
                      : 'I need to cancel this request because...'
                }
              />
            </div>

            {responseAction === 'approve' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800 flex items-start">
                  <FiAlertCircle className="mr-2 flex-shrink-0 mt-0.5" />
                  By approving, the tenant will be able to pay the security deposit and the lease will be created automatically.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={processing}
                className={`px-4 py-2 text-white rounded-lg transition flex items-center ${
                  responseAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  responseAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {responseAction === 'approve' && <><FiCheck className="mr-1" /> Approve</>}
                    {responseAction === 'reject' && <><FiX className="mr-1" /> Reject</>}
                    {responseAction === 'cancel' && 'Confirm Cancel'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaseRequests
