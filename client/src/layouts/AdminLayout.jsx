import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { FiGrid, FiHome, FiUsers, FiCheckCircle, FiBarChart2, FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import UserAvatar from '../components/UserAvatar'

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    navigate('/admin')
  }

  const navItems = [
    { path: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
    { path: '/admin/properties', icon: FiHome, label: 'Properties' },
    { path: '/admin/users', icon: FiUsers, label: 'User Management' },
    { path: '/admin/analytics', icon: FiBarChart2, label: 'Analytics' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-primary-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen bg-gradient-to-b from-primary-800 to-primary-700 text-white transition-transform duration-300 z-30 md:z-auto ${\n        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-64'\n      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-primary-700">
            <div>
              <h1 className="text-xl font-bold">Admin Portal</h1>
              <p className="text-primary-100 text-xs mt-1">MeroGhar</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-primary-700 rounded-lg transition"
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-primary-700">
            <div className="flex items-center space-x-3">
              <UserAvatar name={user?.name} avatar={user?.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name || 'Admin'}</p>
                <p className="text-primary-100 text-xs truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path)
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-100 hover:bg-primary-700/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-primary-700">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-primary-100 hover:bg-red-600 hover:text-white transition w-full"
            >
              <FiLogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-primary-100 px-4 md:px-6 py-5 md:py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              >
                <FiMenu className="text-xl" />
              </button>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {navItems.find(item => isActive(item.path))?.label || 'Admin Portal'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">Manage your rental platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                Admin
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal - Rendered at layout level to escape overflow constraints */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                No
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLayout
