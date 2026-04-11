import { useState, useEffect } from 'react';
import { visitSittingAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';
import { FiCalendar, FiClock, FiUser, FiPhone, FiMail, FiCheckCircle, FiXCircle, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

function VisitRequests() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (user?.role === 'host') {
      fetchRequests();
    }
  }, [user, filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let query = {};
      if (filterStatus !== 'all') {
        query.status = filterStatus;
      }
      const response = await visitSittingAPI.getHostRequests(query);
      let data = response.data.data || [];

      // Sort based on sortBy
      if (sortBy === 'newest') {
        data = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'oldest') {
        data = data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortBy === 'date-asc') {
        data = data.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
      } else if (sortBy === 'date-desc') {
        data = data.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      }

      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch visit requests:', error);
      toast.error('Failed to load visit requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setActionLoading(true);
      await visitSittingAPI.approve(requestId);
      toast.success('Visit approved! Tenant will be notified.');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to approve visit:', error);
      const errorMessage = error.response?.data?.message || 'Failed to approve visit';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      await visitSittingAPI.reject(requestId, { reason: rejectReason });
      toast.success('Visit rejected. Tenant can choose another date.');
      fetchRequests();
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to reject visit:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reject visit';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FiPending, label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: FiCheckCircle, label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: FiXCircle, label: 'Rejected' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FiCheckCircle, label: 'Completed' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: FiTrash2, label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (user?.role !== 'host') {
    return (
      <div className="text-center py-12">
        <FiXCircle className="mx-auto text-6xl text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="text-gray-600">Only hosts can view visit requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Visit Sitting Requests</h2>
        <span className="text-sm text-gray-600">
          {requests.length} {requests.length === 1 ? 'request' : 'requests'}
        </span>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Rejected
          </button>
        </div>

        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="date-asc">Visit Date Ascending</option>
            <option value="date-desc">Visit Date Descending</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" showText text="Loading requests..." />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FiCalendar className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No requests yet</h3>
          <p className="text-gray-600">When tenants book visits, they will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {request.property?.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Requested by {request.tenant?.name}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <FiCalendar size={18} className="text-primary-600" />
                  <span>{formatDate(request.visitDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FiClock size={18} className="text-primary-600" />
                  <span>{request.visitTime}</span>
                </div>
              </div>

              {request.message && (
                <div className="bg-gray-50 p-3 rounded mb-4 border-l-4 border-primary-300">
                  <p className="text-sm text-gray-700">
                    <FiMessageSquare className="inline mr-2 text-primary-600" size={14} />
                    {request.message}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <img
                  src={request.tenant?.avatar}
                  alt={request.tenant?.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{request.tenant?.name}</p>
                  <div className="flex gap-4 text-xs text-gray-600">
                    {request.tenant?.phone && (
                      <span className="flex items-center gap-1">
                        <FiPhone size={12} />
                        {request.tenant.phone}
                      </span>
                    )}
                    {request.tenant?.email && (
                      <span className="flex items-center gap-1">
                        <FiMail size={12} />
                        {request.tenant.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Details and Actions */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedRequest.property?.title}</h3>
                  <p className="text-gray-600">{selectedRequest.property?.address?.street}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none font-light"
                >
                  ×
                </button>
              </div>

              {getStatusBadge(selectedRequest.status)}

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Visit Details</h4>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-gray-700">
                      <FiCalendar className="text-primary-600" size={18} />
                      {formatDate(selectedRequest.visitDate)}
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                      <FiClock className="text-primary-600" size={18} />
                      {selectedRequest.visitTime}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Tenant Information</h4>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-gray-700">
                      <FiUser className="text-primary-600" size={18} />
                      {selectedRequest.tenant?.name}
                    </p>
                    {selectedRequest.tenant?.phone && (
                      <p className="flex items-center gap-2 text-gray-700">
                        <FiPhone className="text-primary-600" size={18} />
                        <a href={`tel:${selectedRequest.tenant.phone}`} className="hover:underline">
                          {selectedRequest.tenant.phone}
                        </a>
                      </p>
                    )}
                    {selectedRequest.tenant?.email && (
                      <p className="flex items-center gap-2 text-gray-700">
                        <FiMail className="text-primary-600" size={18} />
                        <a href={`mailto:${selectedRequest.tenant.email}`} className="hover:underline">
                          {selectedRequest.tenant.email}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedRequest.message && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Tenant Message</h4>
                  <p className="text-blue-800">{selectedRequest.message}</p>
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">Rejection Reason</h4>
                  <p className="text-red-800">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest._id)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                  >
                    {actionLoading ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle size={18} />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Close Button */}
              {selectedRequest.status !== 'pending' && (
                <div className="mt-6">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Visit Request?</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejection so the tenant can understand why their request was not approved.
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4 resize-none"
                rows={3}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRequest._id)}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisitRequests;
