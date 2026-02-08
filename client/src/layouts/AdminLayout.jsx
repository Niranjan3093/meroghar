import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { FiGrid, FiHome, FiUsers, FiCheckCircle, FiBarChart2, FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { useState } from 'react'

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-gradient-to-b from-purple-800 to-indigo-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-purple-700">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold">Admin Portal</h1>
                <p className="text-purple-300 text-xs mt-1">MeroGhar</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-purple-700 rounded-lg transition"
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          {/* User Info */}
          {sidebarOpen && (
            <div className="p-4 border-b border-purple-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold">{user?.name?.charAt(0) || 'A'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user?.name || 'Admin'}</p>
                  <p className="text-purple-300 text-xs truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}

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
                      ? 'bg-purple-700 text-white'
                      : 'text-purple-200 hover:bg-purple-700/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-purple-700">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-purple-200 hover:bg-red-600 hover:text-white transition w-full"
            >
              <FiLogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navItems.find(item => isActive(item.path))?.label || 'Admin Portal'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Manage your rental platform</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
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
    </div>
  )
}

export default AdminLayout
