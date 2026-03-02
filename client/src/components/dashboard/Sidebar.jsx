import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { FiHome, FiMessageSquare, FiFileText, FiDollarSign, FiTool, FiUser, FiBarChart2, FiUsers, FiSettings, FiLogOut, FiPlus, FiChevronRight, FiClipboard } from 'react-icons/fi'

function Sidebar() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

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
    { to: '/dashboard/admin/reports', icon: FiBarChart2, label: 'Reports' },
    { to: '/dashboard/admin/settings', icon: FiSettings, label: 'Settings' }
  ]

  const links = user?.role === 'host' ? hostLinks : user?.role === 'admin' ? adminLinks : tenantLinks

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => {
    if (path === '/dashboard/host' || path === '/dashboard/tenant' || path === '/dashboard/admin') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white h-screen shadow-sm border-r border-gray-100 overflow-y-auto flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        {/* User Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl">
          <div className="flex items-center space-x-3">
            <img 
              src={user?.avatar || 'https://via.placeholder.com/40'} 
              alt={user?.name}
              className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{user?.name || 'User'}</h3>
              <p className="text-xs text-primary-600 capitalize font-medium">{user?.role} Account</p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        {user?.role === 'host' && (
          <Link
            to="/dashboard/host/properties/add"
            className="flex items-center justify-center w-full px-4 py-3 mb-6 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            <FiPlus className="mr-2" />
            Add Property
          </Link>
        )}

        {/* Navigation */}
        <nav className="space-y-1">
          {links.map((link) => {
            const active = isActive(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition group ${
                  active
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <link.icon className={`text-xl ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span className="font-medium">{link.label}</span>
                </div>
                {active && <FiChevronRight className="text-primary-400" />}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition"
        >
          <FiLogOut className="text-xl mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
