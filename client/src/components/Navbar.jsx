import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { FiHome, FiUser, FiLogOut, FiMenu } from 'react-icons/fi'
import { useState } from 'react'
import UserAvatar from './UserAvatar'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <FiHome className="text-2xl text-primary-600" />
            <span className="text-xl font-bold text-gray-800">MeroGhar</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/properties" className="text-gray-700 hover:text-primary-600 transition">
              Browse Properties
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to={`/dashboard/${user?.role}`} 
                  className="text-gray-700 hover:text-primary-600 transition"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/dashboard/messages" 
                  className="text-gray-700 hover:text-primary-600 transition"
                >
                  Messages
                </Link>
                <div className="flex items-center space-x-3">
                  <Link to="/dashboard/profile" className="flex items-center space-x-2">
                    <UserAvatar name={user?.name} avatar={user?.avatar} size="sm" />
                    <span className="text-gray-700">{user?.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 transition"
                    title="Logout"
                  >
                    <FiLogOut className="text-xl" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 transition">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden">
            <FiMenu className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-primary-800 bg-primary-100 rounded-lg hover:bg-primary-200 transition font-medium"
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
    </nav>
  )
}

export default Navbar
