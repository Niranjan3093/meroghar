import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import { leasesAPI, paymentsAPI, maintenanceAPI, messagesAPI } from '../../../utils/api'
import { FiHome, FiFileText, FiDollarSign, FiTool, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiMessageSquare, FiSearch, FiBell } from 'react-icons/fi'
import { toast } from 'react-toastify'

function TenantDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    activeLease: null,
    upcomingPayment: null,
    maintenanceRequests: 0,
    unreadMessages: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch leases
      try {
        const leasesRes = await leasesAPI.getAll()
        const leases = leasesRes.data.data || []
        const activeLease = leases.find(l => l.status === 'active')
        
        setStats(prev => ({
          ...prev,
          activeLease: activeLease || null
        }))
      } catch (err) {
        console.log('No leases found')
      }

      // Fetch maintenance requests
      try {
        const maintenanceRes = await maintenanceAPI.getAll()
        const requests = maintenanceRes.data.data || []
        const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'in-progress')
        
        setStats(prev => ({
          ...prev,
          maintenanceRequests: pendingRequests.length
        }))
      } catch (err) {
        console.log('No maintenance requests found')
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
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
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Tenant'}! 👋</h1>
        <p className="text-primary-100">Here's what's happening with your rental today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Lease Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FiFileText className="text-2xl text-primary-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Lease</h3>
          <p className="text-lg font-bold text-gray-900">{stats.activeLease ? '1 Property' : 'No Active Lease'}</p>
        </div>

        {/* Upcoming Payment Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiDollarSign className="text-2xl text-orange-600" />
            </div>
            {stats.upcomingPayment && (
              <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                {stats.upcomingPayment.daysLeft} days left
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Next Payment</h3>
          <p className="text-lg font-bold text-gray-900">
            {stats.upcomingPayment ? `NPR ${stats.upcomingPayment.amount.toLocaleString()}` : 'No pending'}
          </p>
        </div>

        {/* Maintenance Requests Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FiTool className="text-2xl text-red-600" />
            </div>
            {stats.maintenanceRequests > 0 && (
              <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                {stats.maintenanceRequests} pending
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Maintenance</h3>
          <p className="text-lg font-bold text-gray-900">{stats.maintenanceRequests} Requests</p>
        </div>

        {/* Messages Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiMessageSquare className="text-2xl text-purple-600" />
            </div>
            {stats.unreadMessages > 0 && (
              <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                {stats.unreadMessages} new
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Messages</h3>
          <p className="text-lg font-bold text-gray-900">{stats.unreadMessages} Unread</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Lease Details */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Current Rental</h2>
            <Link to="/dashboard/leases" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View Details →
            </Link>
          </div>
          
          {stats.activeLease ? (
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={stats.activeLease.property?.images?.[0]?.url || stats.activeLease.property?.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200"} 
                    alt="Property" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{stats.activeLease.property?.title || 'Property'}</h3>
                  <p className="text-sm text-gray-500 mb-2">{stats.activeLease.property?.address?.city || 'Address'}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">
                      <span className="font-medium">Landlord:</span> {stats.activeLease.host?.name || 'Landlord'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Monthly Rent</p>
                  <p className="font-semibold text-gray-900">NPR {(stats.activeLease.monthlyRent || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lease Start</p>
                  <p className="font-semibold text-gray-900">{new Date(stats.activeLease.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lease End</p>
                  <p className="font-semibold text-gray-900">{new Date(stats.activeLease.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiHome className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">You don't have an active lease yet</p>
              <Link to="/properties" className="btn-primary inline-block">
                <FiSearch className="inline mr-2" />
                Browse Properties
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming Payment */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Payment</h2>
            <Link to="/dashboard/payments" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              History →
            </Link>
          </div>
          
          {stats.upcomingPayment ? (
            <div className="space-y-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-600 mb-1">Due on {new Date(stats.upcomingPayment.dueDate).toLocaleDateString()}</p>
                <p className="text-3xl font-bold text-gray-900">NPR {stats.upcomingPayment.amount.toLocaleString()}</p>
              </div>
              <button className="w-full btn-primary flex items-center justify-center">
                <FiDollarSign className="mr-2" />
                Pay Now
              </button>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <FiClock className="mr-1" />
                {stats.upcomingPayment.daysLeft} days remaining
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCheckCircle className="mx-auto text-4xl text-green-500 mb-3" />
              <p className="text-gray-500">No pending payments</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              to="/dashboard/maintenance" 
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition group"
            >
              <div className="p-2 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition">
                <FiTool className="text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Report Issue</p>
                <p className="text-xs text-gray-500">Submit maintenance request</p>
              </div>
            </Link>
            <Link 
              to="/dashboard/messages" 
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition group"
            >
              <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition">
                <FiMessageSquare className="text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Contact Landlord</p>
                <p className="text-xs text-gray-500">Send a message</p>
              </div>
            </Link>
            <Link 
              to="/dashboard/payments" 
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition group"
            >
              <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition">
                <FiDollarSign className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Payment History</p>
                <p className="text-xs text-gray-500">View past payments</p>
              </div>
            </Link>
            <Link 
              to="/properties" 
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition group"
            >
              <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition">
                <FiSearch className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Browse Properties</p>
                <p className="text-xs text-gray-500">Find new rentals</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition">
                  <div className={`p-2 rounded-lg ${activity.color?.replace('text-', 'bg-').replace('600', '100') || 'bg-gray-100'}`}>
                    {activity.icon && <activity.icon className={activity.color || 'text-gray-600'} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiBell className="mx-auto text-3xl text-gray-300 mb-3" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TenantDashboard
