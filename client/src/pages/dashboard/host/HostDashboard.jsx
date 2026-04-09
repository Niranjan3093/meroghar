import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import { propertiesAPI } from '../../../utils/api'
import { FiHome, FiUsers, FiDollarSign, FiPlus, FiCheckCircle, FiClock, FiMessageSquare, FiStar, FiMapPin } from 'react-icons/fi'
import { toast } from 'react-toastify'

function HostDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    pendingProperties: 0,
    activeLeases: 0,
    monthlyEarnings: 0,
    pendingMaintenance: 0,
    pendingPayments: 0
  })
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch properties
      const propertiesRes = await propertiesAPI.getHostProperties()
      const hostProperties = propertiesRes.data.data || []
      setProperties(hostProperties.slice(0, 3)) // Show top 3 properties
      
      // Calculate stats from properties
      const activeProps = hostProperties.filter(p => p.status === 'active' && p.verificationStatus === 'verified')
      const pendingProps = hostProperties.filter(p => p.verificationStatus === 'pending')
      const totalRent = activeProps.reduce((sum, p) => sum + (p.rent || 0), 0)
      
      setStats({
        totalProperties: hostProperties.length,
        activeProperties: activeProps.length,
        pendingProperties: pendingProps.length,
        activeLeases: 0, // Will be updated when leases API is connected
        monthlyEarnings: totalRent,
        pendingMaintenance: 0,
        pendingPayments: 0
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Host'}! 👋</h1>
            <p className="text-primary-100">Here's an overview of your property portfolio.</p>
          </div>
          <Link 
            to="/dashboard/host/properties/add" 
            className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition flex items-center"
          >
            <FiPlus className="mr-2" />
            Add Property
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Properties */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FiHome className="text-2xl text-primary-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              {stats.activeProperties} active
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Properties</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.pendingProperties} pending approval</p>
        </div>

        {/* Potential Earnings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-lg font-bold text-green-600">Rs</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Potential Earnings</h3>
          <p className="text-2xl font-bold text-gray-900">NPR {stats.monthlyEarnings.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">from active properties</p>
        </div>

        {/* Active Properties */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiCheckCircle className="text-2xl text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Listings</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.activeProperties}</p>
          <p className="text-xs text-gray-500 mt-1">Verified and live</p>
        </div>

        {/* Pending Approval */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiClock className="text-2xl text-orange-600" />
            </div>
            {stats.pendingProperties > 0 && (
              <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                Awaiting
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Approval</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingProperties}</p>
          <p className="text-xs text-gray-500 mt-1">Under admin review</p>
        </div>
      </div>

      {/* Properties Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Your Properties</h2>
          <Link to="/dashboard/host/properties" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </Link>
        </div>
        
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <Link 
                key={property._id} 
                to={`/properties/${property._id}`}
                className="flex flex-col p-4 border border-gray-100 rounded-lg hover:border-primary-200 hover:bg-primary-50/30 transition"
              >
                <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden mb-3">
                  {property.images && property.images.length > 0 ? (
                    <img 
                      src={property.images[0].url} 
                      alt={property.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiHome className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
                    {property.rating > 0 && (
                      <div className="flex items-center text-yellow-500 text-sm">
                        <FiStar className="fill-current" />
                        <span className="ml-1">{property.rating}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 flex items-center mb-2">
                    <FiMapPin className="mr-1 flex-shrink-0" /> 
                    {property.address?.city || 'Location not set'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-600">
                      NPR {(property.rent || 0).toLocaleString()}/mo
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      property.verificationStatus === 'verified' 
                        ? 'bg-green-100 text-green-700' 
                        : property.verificationStatus === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {property.verificationStatus}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiHome className="mx-auto text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">You haven't added any properties yet</p>
            <Link to="/dashboard/host/properties/add" className="btn-primary inline-block">
              <FiPlus className="inline mr-2" />
              Add Your First Property
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to="/dashboard/host/properties/add" 
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition group border border-gray-100"
          >
            <div className="p-3 bg-primary-100 rounded-lg mb-2 group-hover:bg-primary-200 transition">
              <FiPlus className="text-xl text-primary-600" />
            </div>
            <p className="font-medium text-gray-900 text-sm">Add Property</p>
          </Link>
          <Link 
            to="/dashboard/host/properties" 
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition group border border-gray-100"
          >
            <div className="p-3 bg-blue-100 rounded-lg mb-2 group-hover:bg-blue-200 transition">
              <FiHome className="text-xl text-blue-600" />
            </div>
            <p className="font-medium text-gray-900 text-sm">My Properties</p>
          </Link>
          <Link 
            to="/dashboard/messages" 
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition group border border-gray-100"
          >
            <div className="p-3 bg-purple-100 rounded-lg mb-2 group-hover:bg-purple-200 transition">
              <FiMessageSquare className="text-xl text-purple-600" />
            </div>
            <p className="font-medium text-gray-900 text-sm">Messages</p>
          </Link>
          <Link 
            to="/dashboard/profile" 
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition group border border-gray-100"
          >
            <div className="p-3 bg-green-100 rounded-lg mb-2 group-hover:bg-green-200 transition">
              <FiUsers className="text-xl text-green-600" />
            </div>
            <p className="font-medium text-gray-900 text-sm">Profile</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HostDashboard
