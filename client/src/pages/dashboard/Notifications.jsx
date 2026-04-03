import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiBell, FiCheck, FiTrash2, FiFilter, FiChevronDown, FiMessageCircle, FiClipboard, FiCheckCircle, FiXCircle, FiDollarSign, FiClock, FiTool, FiAlertTriangle, FiUser, FiStar, FiFileText } from 'react-icons/fi'
import { notificationsAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'

function Notifications() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [page, filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      const response = await notificationsAPI.getAll(params)
      if (response.data.success) {
        let filtered = response.data.notifications
        if (filter === 'unread') {
          filtered = filtered.filter(n => !n.read)
        } else if (filter !== 'all') {
          filtered = filtered.filter(n => n.category === filter)
        }
        setNotifications(filtered)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id)
      setNotifications(prev => prev.filter(n => n._id !== id))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return
    try {
      await notificationsAPI.clearAll()
      setNotifications([])
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    return new Date(date).toLocaleDateString()
  }

  const getNotificationIcon = (type) => {
    const iconProps = 'w-5 h-5'
    const icons = {
      message: <FiMessageCircle className={iconProps} />,
      lease_request: <FiClipboard className={iconProps} />,
      lease_request_approved: <FiCheckCircle className={iconProps} />,
      lease_request_rejected: <FiXCircle className={iconProps} />,
      rent_payment: <FiDollarSign className={iconProps} />,
      payment_received: <FiDollarSign className={iconProps} />,
      rent_reminder: <FiClock className={iconProps} />,
      maintenance_request: <FiTool className={iconProps} />,
      maintenance_resolved: <FiCheck className={iconProps} />,
      maintenance_update: <FiFileText className={iconProps} />,
      lease_expiring: <FiAlertTriangle className={iconProps} />,
      contract_renewal: <FiFileText className={iconProps} />,
      property_approved: <FiBell className={iconProps} />,
      property_rejected: <FiXCircle className={iconProps} />,
      warning: <FiAlertTriangle className={iconProps} />,
      new_user: <FiUser className={iconProps} />,
      pending_property: <FiBell className={iconProps} />,
      review_received: <FiStar className={iconProps} />,
      lease_signed: <FiFileText className={iconProps} />
    }
    return icons[type] || <FiBell className={iconProps} />
  }

  const filterOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'unread', label: 'Unread Only' },
    { value: 'lease', label: 'Lease' },
    { value: 'payment', label: 'Payment' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'message', label: 'Messages' },
    { value: 'admin', label: 'Admin' }
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <FiFilter className="w-4 h-4" />
              <span className="text-sm">{filterOptions.find(f => f.value === filter)?.label}</span>
              <FiChevronDown className="w-4 h-4" />
            </button>
            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                  {filterOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilter(option.value)
                        setShowFilterDropdown(false)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        filter === option.value ? 'bg-primary-50 text-primary-600' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
            >
              <FiCheck className="w-4 h-4" />
              <span className="text-sm">Mark all read</span>
            </button>
          )}
          
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <FiTrash2 className="w-4 h-4" />
              <span className="text-sm">Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <FiBell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "You're all caught up! Check back later."
                : `No ${filter} notifications found.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition ${!notification.read ? 'bg-primary-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-primary-600 flex-shrink-0 flex items-center justify-center w-6 h-6">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">{formatTimeAgo(notification.createdAt)}</span>
                          {notification.priority === 'urgent' && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Urgent</span>
                          )}
                          {notification.priority === 'high' && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Important</span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                            {notification.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                            title="Mark as read"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {notification.data?.actionUrl && (
                      <Link
                        to={notification.data.actionUrl}
                        className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
