import { useState, useEffect } from 'react'
import { adminAPI } from '../../../utils/api'
import { FiFileText, FiUser, FiHome, FiFilter, FiCalendar, FiDollarSign } from 'react-icons/fi'
import { toast } from 'react-toastify'

function AdminLeases() {
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchLeases()
  }, [statusFilter])

  const fetchLeases = async () => {
    try {
      setLoading(true)
      const params = {}
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await adminAPI.getAllLeases(params)
      setLeases(response.data.data)
    } catch (error) {
      console.error('Failed to fetch leases:', error)
      toast.error('Failed to load leases')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-gray-100 text-gray-800',
      terminated: 'bg-red-100 text-red-800',
      renewed: 'bg-blue-100 text-blue-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leases...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Lease Management</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
            <option value="renewed">Renewed</option>
          </select>

          <span className="text-gray-600 ml-auto">
            {leases.length} lease{leases.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leases</p>
              <p className="text-2xl font-bold">{leases.length}</p>
            </div>
            <FiFileText className="text-3xl text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {leases.filter(l => l.status === 'active').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiFileText className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {leases.filter(l => l.status === 'pending').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiFileText className="text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-600">
                {leases.filter(l => l.status === 'expired').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <FiFileText className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Leases Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Host
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <FiFileText className="mx-auto text-4xl text-gray-400 mb-4" />
                    No leases found
                  </td>
                </tr>
              ) : (
                leases.map((lease) => {
                  const daysRemaining = getDaysRemaining(lease.endDate)
                  return (
                    <tr key={lease._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={lease.property?.images?.[0]?.url || lease.property?.images?.[0] || 'https://via.placeholder.com/40'}
                            alt={lease.property?.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {lease.property?.title || 'Unknown Property'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {lease.property?.address?.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={lease.host?.avatar || 'https://via.placeholder.com/32'}
                            alt={lease.host?.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="ml-2">
                            <div className="text-sm text-gray-900">{lease.host?.name}</div>
                            <div className="text-xs text-gray-500">{lease.host?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={lease.tenant?.avatar || 'https://via.placeholder.com/32'}
                            alt={lease.tenant?.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="ml-2">
                            <div className="text-sm text-gray-900">{lease.tenant?.name}</div>
                            <div className="text-xs text-gray-500">{lease.tenant?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                        </div>
                        {lease.status === 'active' && (
                          <div className={`text-xs ${daysRemaining <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                            {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          Rs. {lease.monthlyRent?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Deposit: Rs. {lease.securityDeposit?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(lease.status)}`}>
                          {lease.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminLeases
