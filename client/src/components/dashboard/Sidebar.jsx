import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { FiHome, FiMessageSquare, FiFileText, FiDollarSign, FiTool, FiUser, FiBarChart2, FiUsers, FiSettings, FiLogOut, FiPlus, FiChevronRight, FiClipboard } from 'react-icons/fi'
import { useState } from 'react'
import UserAvatar from '../UserAvatar'

function Sidebar() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

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
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    navigate('/')
  }

  const isActive = (path) => {
    if (path === '/dashboard/host' || path === '/dashboard/tenant' || path === '/dashboard/admin') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white h-screen shadow-lg border-r-4 border-gradient-to-b from-primary-600 to-accent-500 overflow-y-auto flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        {/* User Info - Premium Card */}
        <div className="mb-6 p-5 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <UserAvatar name={user?.name} avatar={user?.avatar} size="lg" className="border-4 border-white shadow-lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate text-lg">{user?.name || 'User'}</h3>
              <p className="text-xs text-primary-100 capitalize font-semibold mt-1 bg-primary-500/50 inline-block px-2 py-1 rounded-full">{user?.role} Account</p>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        {user?.role === 'host' && (
          <Link
            to="/dashboard/host/properties/add"
            className="flex items-center justify-center w-full px-4 py-3 mb-6 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-bold shadow-md"
          >
            <FiPlus className="mr-2 text-lg" />
            Add Property
          </Link>
        )}

        {/* Navigation */}
        <nav className="space-y-2">
          {links.map((link) => {
            const active = isActive(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Logout</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="btn-accent text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
