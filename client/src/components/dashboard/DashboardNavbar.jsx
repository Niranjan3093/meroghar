import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { FiBell, FiSearch, FiHome, FiMenu, FiX, FiSettings, FiHelpCircle, FiCheck, FiTrash2, FiMessageCircle, FiClipboard, FiCheckCircle, FiXCircle, FiDollarSign, FiClock, FiTool, FiAlertTriangle, FiUser, FiStar, FiFileText } from 'react-icons/fi'
import { useState, useEffect, useCallback } from 'react'
import { notificationsAPI } from '../../utils/api'
import { io } from 'socket.io-client'

function DashboardNavbar({ onMenuClick }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState(null)

  // Get user initials like Gmail (e.g., "BB" for "Bashu Baidya")
  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const parts = user.name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }
    return parts[0].charAt(0).toUpperCase()
  }

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getAll({ limit: 10 })
      if (response.data.success) {
        setNotifications(response.data.notifications)
        setUnreadCount(response.data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize socket connection
  useEffect(() => {
    if (user?._id || user?.id) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true
      })

      newSocket.on('connect', () => {
        newSocket.emit('join', user._id || user.id)
      })

      // Listen for new notifications
      newSocket.on('new-notification', (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)])
        setUnreadCount(prev => prev + 1)
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [user])

  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, fetchNotifications])

  // Mark notification as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await notificationsAPI.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already
    if (!notification.read) {
      await notificationsAPI.markAsRead(notification._id)
      setNotifications(prev => 
        prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    // Navigate based on notification type
    setShowNotifications(false)
    
    if (notification.data?.actionUrl) {
      navigate(notification.data.actionUrl)
    } else {
      // Default navigation based on type
      switch (notification.type) {
        case 'message':
          navigate('/dashboard/messages')
          break
        case 'lease_request':
        case 'lease_request_approved':
        case 'lease_request_rejected':
          navigate('/dashboard/lease-requests')
          break
        case 'rent_payment':
        case 'payment_received':
        case 'rent_reminder':
          navigate('/dashboard/payments')
          break
        case 'maintenance_request':
        case 'maintenance_resolved':
        case 'maintenance_update':
          navigate('/dashboard/maintenance')
          break
        case 'lease_expiring':
        case 'contract_renewal':
        case 'lease_signed':
          navigate('/dashboard/leases')
          break
        case 'pending_property':
        case 'new_user':
          navigate('/admin/dashboard')
          break
        default:
          break
      }
    }
  }

  // Format time ago
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

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const iconProps = 'w-5 h-5 text-primary-600'
    switch (type) {
      case 'message':
        return <FiMessageCircle className={iconProps} />
      case 'lease_request':
        return <FiClipboard className={iconProps} />
      case 'lease_request_approved':
        return <FiCheckCircle className={iconProps} />
      case 'lease_request_rejected':
        return <FiXCircle className={iconProps} />
      case 'rent_payment':
      case 'payment_received':
        return <FiDollarSign className={iconProps} />
      case 'rent_reminder':
        return <FiClock className={iconProps} />
      case 'maintenance_request':
        return <FiTool className={iconProps} />
      case 'maintenance_resolved':
        return <FiCheck className={iconProps} />
      case 'maintenance_update':
        return <FiFileText className={iconProps} />
      case 'lease_expiring':
        return <FiAlertTriangle className={iconProps} />
      case 'contract_renewal':
        return <FiFileText className={iconProps} />
      case 'property_approved':
        return <FiHome className={iconProps} />
      case 'property_rejected':
        return <FiXCircle className={iconProps} />
      case 'warning':
        return <FiAlertTriangle className={iconProps} />
      case 'new_user':
        return <FiUser className={iconProps} />
      case 'pending_property':
        return <FiHome className={iconProps} />
      case 'review_received':
        return <FiStar className={iconProps} />
      case 'lease_signed':
        return <FiFileText className={iconProps} />
      default:
        return <FiBell className={iconProps} />
    }
  }

  return (
    <nav className="bg-white shadow-md border-b sticky top-0 z-20">
      <div className="px-4 md:px-6 py-4 md:py-5 flex justify-between items-center">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            title="Toggle menu"
          >
            <FiMenu className="text-xl" />
          </button>

          <Link to={user?.role === 'admin' ? '/dashboard/admin' : user?.role === 'host' ? '/dashboard/host' : '/dashboard/tenant'} className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
            <img 
              src="/assets/app_logo.png" 
              alt="MeroGhar Logo" 
              className="h-14 md:h-16 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-6 lg:mx-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search properties, tenants, payments..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition text-sm"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end space-x-1 md:space-x-2 ml-auto">
          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            <FiSearch className="text-xl" />
          </button>

          {/* Help */}
          <button className="hidden md:flex p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0" title="Help">
            <FiHelpCircle className="text-xl" />
          </button>

          {/* Notifications */}
          <div className="relative flex-shrink-0">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <FiBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-medium px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <FiCheck className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        Loading...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <FiBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${!notif.read ? 'bg-primary-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-primary-600 flex-shrink-0 flex items-center justify-center">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(notif._id, e)}
                                    className="text-gray-400 hover:text-primary-600 p-1 rounded"
                                    title="Mark as read"
                                  >
                                    <FiCheck className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-400">{formatTimeAgo(notif.createdAt)}</p>
                                {notif.priority === 'urgent' && (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Urgent</span>
                                )}
                                {notif.priority === 'high' && (
                                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Important</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <Link 
                      to="/dashboard/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <Link 
            to="/dashboard/profile"
            className="flex items-center px-2 py-1.5 hover:bg-primary-50 rounded-lg transition flex-shrink-0"
            title={user?.name || 'Profile'}
          >
            {/* Avatar - Simple Icon */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-primary-100 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : null}
              {!user?.avatar && (
                <span>{getUserInitials()}</span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      )}
    </nav>
  )
}

export default DashboardNavbar
