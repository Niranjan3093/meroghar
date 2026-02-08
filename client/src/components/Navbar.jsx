import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { FiHome, FiUser, FiLogOut, FiMenu } from 'react-icons/fi'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
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
                    <img 
                      src={user?.avatar || 'https://via.placeholder.com/40'} 
                      alt={user?.name}
                      className="w-8 h-8 rounded-full"
                    />
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
    </nav>
  )
}

export default Navbar
