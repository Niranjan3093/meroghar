import { useState, useEffect } from 'react'
import { adminAPI } from '../../utils/api'
import { FiTrendingUp, FiUsers, FiHome, FiDollarSign, FiActivity } from 'react-icons/fi'
import { toast } from 'react-toastify'

function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getDashboard()
      setStats(response.data.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const analyticsCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      change: '+12%',
      icon: FiUsers,
      color: 'blue',
      subtitle: `${stats?.users?.hosts || 0} Hosts, ${stats?.users?.tenants || 0} Tenants`
    },
    {
      title: 'Total Properties',
      value: stats?.properties?.total || 0,
      change: '+8%',
      icon: FiHome,
      color: 'green',
      subtitle: `${stats?.properties?.active || 0} Active`
    },
    {
      title: 'Pending Approvals',
      value: stats?.properties?.pending || 0,
      change: '-5%',
      icon: FiActivity,
      color: 'orange',
      subtitle: 'Requires attention'
    },
    {
      title: 'Active Leases',
      value: stats?.leases?.active || 0,
      change: '+15%',
      icon: FiDollarSign,
      color: 'purple',
      subtitle: `${stats?.leases?.expired || 0} Expired`
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-500 mt-1">Monitor your platform's performance and growth</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  {card.change}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </div>
          )
        })}
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiUsers className="mr-2 text-blue-600" />
            User Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Tenants</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{stats?.users?.tenants || 0}</p>
                <p className="text-xs text-gray-500">
                  {((stats?.users?.tenants / stats?.users?.total) * 100 || 0).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Hosts</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{stats?.users?.hosts || 0}</p>
                <p className="text-xs text-gray-500">
                  {((stats?.users?.hosts / stats?.users?.total) * 100 || 0).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Admins</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{stats?.users?.admins || 0}</p>
                <p className="text-xs text-gray-500">
                  {((stats?.users?.admins / stats?.users?.total) * 100 || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Property Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiHome className="mr-2 text-green-600" />
            Property Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Active</span>
              </div>
              <p className="font-semibold text-gray-900">{stats?.properties?.active || 0}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Pending</span>
              </div>
              <p className="font-semibold text-gray-900">{stats?.properties?.pending || 0}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Rejected</span>
              </div>
              <p className="font-semibold text-gray-900">{stats?.properties?.rejected || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Chart Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiTrendingUp className="mr-2 text-purple-600" />
          Platform Growth
        </h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <FiTrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Growth charts coming soon</p>
            <p className="text-sm text-gray-400 mt-1">Integration with charting library required</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics
