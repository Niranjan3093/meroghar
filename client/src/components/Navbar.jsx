import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { FiLogOut, FiMenu } from 'react-icons/fi'
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
    <nav className="sticky top-0 z-40 bg-gradient-to-r from-white via-primary-50 to-white shadow-lg border-b border-primary-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group hover-glow transition-transform duration-300 hover:scale-110">
            <img 
              src="/assets/app_logo.png" 
              alt="MeroGhar Logo" 
              className="h-20 w-auto object-contain"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/properties" className="text-slate-700 font-medium hover:text-primary-600 transition-colors duration-300 relative group">
              Browse Properties
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to={`/dashboard/${user?.role}`} 
                  className="text-slate-700 font-medium hover:text-primary-600 transition-colors duration-300 relative group"
                >
                  Dashboard
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link 
                  to="/dashboard/messages" 
                  className="text-slate-700 font-medium hover:text-primary-600 transition-colors duration-300 relative group"
                >
                  Messages
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <div className="flex items-center space-x-4 pl-4 border-l-2 border-slate-200">
                  <Link to="/dashboard/profile" className="flex items-center space-x-2 hover:opacity-75 transition-opacity">
                    <UserAvatar name={user?.name} avatar={user?.avatar} size="sm" />
                    <span className="text-slate-700 font-medium hidden lg:inline">{user?.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-accent-600 hover:text-accent-700 transition-colors duration-300 hover:bg-accent-50 p-2 rounded-lg"
                    title="Logout"
                  >
                    <FiLogOut className="text-xl" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-700 font-medium hover:text-primary-600 transition-colors duration-300">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden">
            <FiMenu className="text-2xl text-slate-700" />
          </button>
        </div>
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
    </nav>
  )
}

export default Navbar
