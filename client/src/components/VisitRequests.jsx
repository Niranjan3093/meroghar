import { useState, useEffect } from 'react';
import { visitSittingAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';
import {
  FiCalendar, FiClock, FiUser, FiPhone, FiMail,
  FiCheckCircle, FiXCircle, FiMessageSquare, FiTrash2, FiMapPin
} from 'react-icons/fi';
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
    fetchRequests();
  }, [user, filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let query = {};
      if (filterStatus !== 'all') {
        query.status = filterStatus;
      }

      let response;
      if (user?.role === 'host') {
        response = await visitSittingAPI.getHostRequests(query);
      } else {
        response = await visitSittingAPI.getTenantRequests(query);
      }

      let data = response.data.data || [];

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
      toast.error(error.response?.data?.message || 'Failed to approve visit');
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
      toast.error(error.response?.data?.message || 'Failed to reject visit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (requestId) => {
    try {
      setActionLoading(true);
      await visitSittingAPI.cancel(requestId);
      toast.success('Visit request cancelled.');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to cancel visit:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel visit');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending:   { bg: 'bg-yellow-100', text: 'text-yellow-800', Icon: FiClock,        label: 'Pending' },
      approved:  { bg: 'bg-green-100',  text: 'text-green-800',  Icon: FiCheckCircle,  label: 'Approved' },
      rejected:  { bg: 'bg-red-100',    text: 'text-red-800',    Icon: FiXCircle,      label: 'Rejected' },
      completed: { bg: 'bg-blue-100',   text: 'text-blue-800',   Icon: FiCheckCircle,  label: 'Completed' },
      cancelled: { bg: 'bg-gray-100',   text: 'text-gray-800',   Icon: FiTrash2,       label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.Icon;

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

  const isHost = user?.role === 'host';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visit Requests</h1>
          <p className="text-gray-600 mt-1">
            {isHost ? 'Manage visit requests from potential tenants' : 'Track your scheduled property visits'}
          </p>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {requests.length} {requests.length === 1 ? 'request' : 'requests'}
        </span>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize text-sm ${
                filterStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="date-asc">Visit Date Ascending</option>
            <option value="date-desc">Visit Date Descending</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" showText text="Loading requests..." />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-100">
          <FiCalendar className="mx-auto text-5xl text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No visit requests found</h3>
          <p className="text-gray-500 text-sm">
            {filterStatus !== 'all'
              ? `No ${filterStatus} requests found`
              : isHost
                ? 'When tenants schedule visits to your properties, they will appear here.'
                : 'You have not scheduled any property visits yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
                    {request.property?.title || 'Property'}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <FiMapPin size={12} />
                    {request.property?.address?.city || request.property?.address?.street || '—'}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <FiCalendar size={16} className="text-primary-600" />
                  <span>{formatDate(request.visitDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <FiClock size={16} className="text-primary-600" />
                  <span>{request.visitTime}</span>
                </div>
              </div>

              {request.message && (
                <div className="bg-gray-50 p-3 rounded-lg mb-3 border-l-4 border-primary-300">
                  <p className="text-sm text-gray-700">
                    <FiMessageSquare className="inline mr-2 text-primary-600" size={13} />
                    {request.message}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {(isHost ? request.tenant?.name : request.host?.name)?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {isHost ? request.tenant?.name : request.host?.name}
                  </p>
                  <p className="text-xs text-gray-500">{isHost ? 'Tenant' : 'Host'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedRequest.property?.title}</h3>
                  <p className="text-gray-500 text-sm mt-0.5">{selectedRequest.property?.address?.street}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-light ml-4"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">{getStatusBadge(selectedRequest.status)}</div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-5">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Visit Details</h4>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-gray-700 text-sm">
                      <FiCalendar className="text-primary-600" size={16} />
                      {formatDate(selectedRequest.visitDate)}
                    </p>
                    <p className="flex items-center gap-2 text-gray-700 text-sm">
                      <FiClock className="text-primary-600" size={16} />
                      {selectedRequest.visitTime}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {isHost ? 'Tenant Information' : 'Host Information'}
                  </h4>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-gray-700 text-sm">
                      <FiUser className="text-primary-600" size={16} />
                      {isHost ? selectedRequest.tenant?.name : selectedRequest.host?.name}
                    </p>
                    {(isHost ? selectedRequest.tenant?.phone : selectedRequest.host?.phone) && (
                      <p className="flex items-center gap-2 text-gray-700 text-sm">
                        <FiPhone className="text-primary-600" size={16} />
                        <a href={`tel:${isHost ? selectedRequest.tenant?.phone : selectedRequest.host?.phone}`} className="hover:underline">
                          {isHost ? selectedRequest.tenant?.phone : selectedRequest.host?.phone}
                        </a>
                      </p>
                    )}
                    {(isHost ? selectedRequest.tenant?.email : selectedRequest.host?.email) && (
                      <p className="flex items-center gap-2 text-gray-700 text-sm">
                        <FiMail className="text-primary-600" size={16} />
                        <a href={`mailto:${isHost ? selectedRequest.tenant?.email : selectedRequest.host?.email}`} className="hover:underline">
                          {isHost ? selectedRequest.tenant?.email : selectedRequest.host?.email}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedRequest.message && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Message</h4>
                  <p className="text-blue-800 text-sm">{selectedRequest.message}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">Rejection Reason</h4>
                  <p className="text-red-800 text-sm">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {/* Host Actions */}
              {isHost && selectedRequest.status === 'pending' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium disabled:opacity-50 transition text-sm"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest._id)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition text-sm"
                  >
                    {actionLoading ? (
                      <><LoadingSpinner size="sm" color="white" /> Approving...</>
                    ) : (
                      <><FiCheckCircle size={16} /> Approve</>
                    )}
                  </button>
                </div>
              )}

              {/* Tenant Actions */}
              {!isHost && selectedRequest.status === 'pending' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleCancel(selectedRequest._id)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50 transition text-sm"
                  >
                    {actionLoading ? 'Cancelling...' : 'Cancel Request'}
                  </button>
                </div>
              )}

              {/* Close Button */}
              {(selectedRequest.status !== 'pending' || (!isHost && selectedRequest.status !== 'pending')) && (
                <div className="mt-4">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Visit Request?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Please provide a reason so the tenant understands why their request was not approved.
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4 resize-none text-sm"
                rows={3}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRequest._id)}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 text-sm"
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
