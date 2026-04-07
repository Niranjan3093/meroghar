import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { FiHome, FiMessageSquare, FiFileText, FiDollarSign, FiTool, FiUser, FiBarChart2, FiUsers, FiSettings, FiLogOut, FiPlus, FiChevronRight, FiClipboard } from 'react-icons/fi'
import UserAvatar from '../UserAvatar'

function Sidebar({ isOpen, onClose, onLogoutClick }) {
  const { user } = useAuthStore()
  const location = useLocation()

  const hostLinks = [
    { to: '/dashboard/host', icon: FiBarChart2, label: 'Dashboard' },
    { to: '/dashboard/host/properties', icon: FiHome, label: 'My Properties' },
    { to: '/dashboard/lease-requests', icon: FiClipboard, label: 'Lease Requests' },
    { to: '/dashboard/leases', icon: FiFileText, label: 'Leases' },
    { to: '/dashboard/payments', icon: FiDollarSign, label: 'Payments' },
    { to: '/dashboard/maintenance', icon: FiTool, label: 'Maintenance' },
    { to: '/dashboard/messages', icon: FiMessageSquare, label: 'Messages' },
    { to: '/dashboard/profile', icon: FiUser, label: 'Profile' }
  ]

  const tenantLinks = [
    { to: '/dashboard/tenant', icon: FiBarChart2, label: 'Dashboard' },
    { to: '/dashboard/properties', icon: FiHome, label: 'Browse Properties' },
    { to: '/dashboard/lease-requests', icon: FiClipboard, label: 'Lease Requests' },
    { to: '/dashboard/leases', icon: FiFileText, label: 'My Leases' },
    { to: '/dashboard/payments', icon: FiDollarSign, label: 'Payments' },
    { to: '/dashboard/maintenance', icon: FiTool, label: 'Maintenance' },
    { to: '/dashboard/messages', icon: FiMessageSquare, label: 'Messages' },
    { to: '/dashboard/profile', icon: FiUser, label: 'Profile' }
  ]

  const adminLinks = [
    { to: '/dashboard/admin', icon: FiBarChart2, label: 'Dashboard' },
    { to: '/dashboard/admin/users', icon: FiUsers, label: 'Users' },
    { to: '/dashboard/admin/properties', icon: FiHome, label: 'Properties' },
    { to: '/dashboard/admin/leases', icon: FiFileText, label: 'Leases' },
    { to: '/dashboard/messages', icon: FiMessageSquare, label: 'Messages' },
    { to: '/dashboard/admin/reports', icon: FiBarChart2, label: 'Reports' },
    { to: '/dashboard/admin/settings', icon: FiSettings, label: 'Settings' }
  ]

  const links = user?.role === 'host' ? hostLinks : user?.role === 'admin' ? adminLinks : tenantLinks

  const handleLogout = () => {
    if (onLogoutClick) {
      onLogoutClick()
    }
  }

  const isActive = (path) => {
    if (path === '/dashboard/host' || path === '/dashboard/tenant' || path === '/dashboard/admin') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 w-64 flex-shrink-0 bg-white h-screen shadow-lg border-r-4 border-gradient-to-b from-primary-600 to-accent-500 overflow-y-auto flex flex-col transition-transform duration-300 z-30 md:z-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Close Button on Mobile */}
        <div className="flex justify-end md:hidden p-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info - Premium Card */}
        <div className="mb-5 p-4 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-xl shadow-lg mx-4">
          <div className="flex items-center space-x-3">
            <UserAvatar name={user?.name} avatar={user?.avatar} size="md" className="border-3 border-white shadow-md" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate text-sm">{user?.name || 'User'}</h3>
              <p className="text-xs text-primary-100 capitalize font-semibold mt-0.5 bg-primary-500/50 inline-block px-2 py-0.5 rounded-full">{user?.role} Account</p>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        {user?.role === 'host' && (
          <Link
            to="/dashboard/host/properties/add"
            onClick={onClose}
            className="flex items-center justify-center w-full px-4 py-3 mb-6 mx-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-bold shadow-md"
          >
            <FiPlus className="mr-2 text-lg" />
            Add Property
          </Link>
        )}

        {/* Navigation */}
        <nav className="space-y-2 px-2">
          {links.map((link) => {
            const active = isActive(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group font-semibold ${
                  active
                    ? 'bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 shadow-md border-l-4 border-primary-600'
                    : 'text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-primary-50 hover:text-primary-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <link.icon className={`text-xl transition-all ${active ? 'text-primary-600 scale-110' : 'text-slate-400 group-hover:text-primary-600'}`} />
                  <span>{link.label}</span>
                </div>
                {active && <FiChevronRight className="text-primary-500 font-bold" />}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-primary-50">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-accent-600 rounded-xl hover:bg-accent-50 transition-all duration-300 font-bold hover:shadow-md"
        >
          <FiLogOut className="text-xl mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  )
}

export default Sidebar
