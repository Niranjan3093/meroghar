import { useState, useEffect } from 'react'
import { adminAPI } from '../../../utils/api'
import { FiUser, FiMail, FiPhone, FiShield, FiLock, FiUnlock, FiFilter } from 'react-icons/fi'
import { toast } from 'react-toastify'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showBanModal, setShowBanModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [banReason, setBanReason] = useState('')
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = {}
      
      if (roleFilter !== 'all') {
        params.role = roleFilter
      }
      
      if (statusFilter !== 'all') {
        params.isBanned = statusFilter === 'banned' ? 'true' : 'false'
      }

      const response = await adminAPI.getAllUsers(params)
      setUsers(response.data.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const openBanModal = (user) => {
    setSelectedUser(user)
    setShowBanModal(true)
  }

  const closeBanModal = () => {
    setShowBanModal(false)
    setBanReason('')
    setSelectedUser(null)
  }

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      toast.error('Please provide a ban reason')
      return
    }

    try {
      setProcessingId(selectedUser._id)
      await adminAPI.banUser(selectedUser._id, banReason)
      toast.success('User banned successfully')
      fetchUsers()
      closeBanModal()
    } catch (error) {
      console.error('Failed to ban user:', error)
      toast.error(error.response?.data?.message || 'Failed to ban user')
    } finally {
      setProcessingId(null)
    }
  }

  const handleUnbanUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to unban ${userName}?`)) {
      try {
        setProcessingId(userId)
        await adminAPI.unbanUser(userId)
        toast.success('User unbanned successfully')
        fetchUsers()
      } catch (error) {
        console.error('Failed to unban user:', error)
        toast.error(error.response?.data?.message || 'Failed to unban user')
      } finally {
        setProcessingId(null)
      }
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'host':
        return 'bg-blue-100 text-blue-800'
      case 'tenant':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">User Management</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="tenant">Tenants</option>
            <option value="host">Hosts</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>

          <span className="text-gray-600 ml-auto">
            {users.length} user{users.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className={user.isBanned ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={user.avatar || 'https://via.placeholder.com/40'}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">
                            {user.isVerified ? (
                              <span className="text-green-600">✓ Verified</span>
                            ) : (
                              <span className="text-orange-600">Unverified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiMail className="mr-2 text-gray-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <FiPhone className="mr-2 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isBanned ? (
                        <div>
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Banned
                          </span>
                          {user.banReason && (
                            <div className="text-xs text-gray-500 mt-1">
                              Reason: {user.banReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.role !== 'admin' && (
                        <>
                          {user.isBanned ? (
                            <button
                              onClick={() => handleUnbanUser(user._id, user.name)}
                              disabled={processingId === user._id}
                              className="text-green-600 hover:text-green-900 font-medium flex items-center gap-1"
                            >
                              <FiUnlock />
                              {processingId === user._id ? 'Unbanning...' : 'Unban'}
                            </button>
                          ) : (
                            <button
                              onClick={() => openBanModal(user)}
                              disabled={processingId === user._id}
                              className="text-red-600 hover:text-red-900 font-medium flex items-center gap-1"
                            >
                              <FiLock />
                              {processingId === user._id ? 'Banning...' : 'Ban User'}
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Ban User</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for banning "{selectedUser?.name}"
            </p>
            
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="e.g., Violation of terms, spam, inappropriate behavior, etc."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />

            <div className="flex gap-3">
              <button
                onClick={closeBanModal}
                className="flex-1 btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                disabled={processingId}
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white"
                disabled={processingId || !banReason.trim()}
              >
                {processingId ? 'Banning...' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
