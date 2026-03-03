import { useState, useEffect } from 'react'
import { adminAPI } from '../../../utils/api'
import { FiUsers, FiHome, FiClock, FiFileText, FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getDashboard()
      setStats(response.data.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
      setError(err.response?.data?.message || 'Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchDashboardStats}
          className="mt-4 btn btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* User Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
              <FiUsers className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-primary-600">{stats?.users?.total || 0}</p>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Hosts</h3>
              <FiHome className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats?.users?.hosts || 0}</p>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Tenants</h3>
              <FiUsers className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats?.users?.tenants || 0}</p>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Admins</h3>
              <FiUsers className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats?.users?.admins || 0}</p>
          </div>
        </div>
      </div>

      {/* Property Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Property Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Properties</h3>
              <FiHome className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.properties?.total || 0}</p>
          </div>
          
          <div className="card cursor-pointer hover:shadow-lg transition-shadow">
            <Link to="/dashboard/admin/properties?verification=pending">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Pending Approval</h3>
                <FiClock className="text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-orange-600">{stats?.properties?.pending || 0}</p>
              {stats?.properties?.pending > 0 && (
                <div className="mt-3 flex items-center text-sm text-orange-600 font-medium">
                  <span>Review Now</span>
                  <FiArrowRight className="ml-1" />
                </div>
              )}
            </Link>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Properties</h3>
              <FiHome className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats?.properties?.active || 0}</p>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Rejected</h3>
              <FiHome className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats?.properties?.rejected || 0}</p>
          </div>
        </div>
      </div>

      {/* Lease Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Lease Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Leases</h3>
              <FiFileText className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats?.leases?.active || 0}</p>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Expired Leases</h3>
              <FiFileText className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-600">{stats?.leases?.expired || 0}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to="/dashboard/admin/properties?verification=pending"
            className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Review Pending Properties</h3>
                <p className="text-sm text-gray-600">
                  {stats?.properties?.pending || 0} properties awaiting approval
                </p>
              </div>
              <FiArrowRight className="text-2xl text-primary-600" />
            </div>
          </Link>
          
          <Link 
            to="/dashboard/admin/users"
            className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Manage Users</h3>
                <p className="text-sm text-gray-600">
                  View and manage all platform users
                </p>
              </div>
              <FiArrowRight className="text-2xl text-primary-600" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
