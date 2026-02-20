import { useState, useEffect } from 'react'
import { adminAPI } from '../../../utils/api'
import { FiUser, FiMail, FiPhone, FiShield, FiLock, FiUnlock, FiFilter, FiEye, FiHome, FiFileText, FiX, FiCalendar, FiDollarSign, FiMapPin } from 'react-icons/fi'
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
  
  // User details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [userDetails, setUserDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

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

  const fetchUserDetails = async (userId) => {
    try {
      setLoadingDetails(true)
      const response = await adminAPI.getUserDetails(userId)
      setUserDetails(response.data.data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Failed to fetch user details:', error)
      toast.error('Failed to load user details')
    } finally {
      setLoadingDetails(false)
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
      if (showDetailsModal && userDetails?.user?._id === selectedUser._id) {
        fetchUserDetails(selectedUser._id)
      }
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
        if (showDetailsModal && userDetails?.user?._id === userId) {
          fetchUserDetails(userId)
        }
      } catch (error) {
        console.error('Failed to unban user:', error)
        toast.error(error.response?.data?.message || 'Failed to unban user')
      } finally {
        setProcessingId(null)
      }
    }
  }

  const handleVerifyUser = async (userId, userName, isCurrentlyVerified) => {
    const action = isCurrentlyVerified ? 'unverify' : 'verify'
    const confirmMsg = isCurrentlyVerified 
      ? `Are you sure you want to unverify ${userName}?`
      : `Are you sure you want to verify ${userName}?`
    
    if (window.confirm(confirmMsg)) {
      try {
        setProcessingId(userId)
        await adminAPI.verifyUser(userId)
        toast.success(`User ${action}d successfully`)
        fetchUsers()
        if (showDetailsModal && userDetails?.user?._id === userId) {
          fetchUserDetails(userId)
        }
      } catch (error) {
        console.error(`Failed to ${action} user:`, error)
        toast.error(error.response?.data?.message || `Failed to ${action} user`)
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchUserDetails(user._id)}
                          disabled={loadingDetails}
                          className="text-primary-600 hover:text-primary-900 font-medium flex items-center gap-1"
                        >
                          <FiEye />
                          View
                        </button>
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
                                {processingId === user._id ? 'Banning...' : 'Ban'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showDetailsModal && userDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">User Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {/* User Info Header */}
              <div className="flex items-start gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                <img
                  src={userDetails.user.avatar || 'https://via.placeholder.com/80'}
                  alt={userDetails.user.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{userDetails.user.name}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userDetails.user.role)}`}>
                      {userDetails.user.role}
                    </span>
                    {userDetails.user.isBanned && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Banned
                      </span>
                    )}
                    {!userDetails.user.isVerified && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        Unverified
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FiMail className="mr-2" />
                      {userDetails.user.email}
                    </div>
                    {userDetails.user.phone && (
                      <div className="flex items-center">
                        <FiPhone className="mr-2" />
                        {userDetails.user.phone}
                      </div>
                    )}
                    <div className="flex items-center">
                      <FiCalendar className="mr-2" />
                      Joined: {formatDate(userDetails.user.createdAt)}
                    </div>
                    <div className="flex items-center">
                      <FiShield className="mr-2" />
                      {userDetails.user.isVerified ? 'Verified' : 'Unverified'}
                    </div>
                  </div>
                  {userDetails.user.bio && (
                    <p className="mt-3 text-gray-600 text-sm">{userDetails.user.bio}</p>
                  )}
                  {userDetails.user.isBanned && userDetails.user.banReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Ban Reason:</strong> {userDetails.user.banReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Properties Section (for hosts) */}
              {userDetails.user.role === 'host' && (
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FiHome className="text-primary-600" />
                    Properties ({userDetails.properties?.length || 0})
                  </h4>
                  {userDetails.properties?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userDetails.properties.map((property) => (
                        <div key={property._id} className="border border-gray-200 rounded-lg p-4 flex gap-4">
                          <img
                            src={property.images?.[0]?.url || property.images?.[0] || 'https://via.placeholder.com/80'}
                            alt={property.title}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 line-clamp-1">{property.title}</h5>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <FiMapPin className="mr-1" />
                              {property.address?.city}, {property.address?.state}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-primary-600 font-medium text-sm">
                                Rs. {property.monthlyRent?.toLocaleString()}/mo
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                property.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                                property.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {property.verificationStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                      No properties listed
                    </p>
                  )}
                </div>
              )}

              {/* Active Leases Section */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FiFileText className="text-primary-600" />
                  Active Leases ({userDetails.leases?.length || 0})
                </h4>
                {userDetails.leases?.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-600">Property</th>
                          <th className="px-4 py-2 text-left text-gray-600">
                            {userDetails.user.role === 'host' ? 'Tenant' : 'Host'}
                          </th>
                          <th className="px-4 py-2 text-left text-gray-600">Period</th>
                          <th className="px-4 py-2 text-left text-gray-600">Rent</th>
                          <th className="px-4 py-2 text-left text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetails.leases.map((lease) => (
                          <tr key={lease._id} className="border-t border-gray-200">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={lease.property?.images?.[0]?.url || lease.property?.images?.[0] || 'https://via.placeholder.com/32'}
                                  alt=""
                                  className="w-8 h-8 rounded object-cover"
                                />
                                <span className="line-clamp-1">{lease.property?.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={userDetails.user.role === 'host' ? lease.tenant?.avatar : lease.host?.avatar || 'https://via.placeholder.com/32'}
                                  alt=""
                                  className="w-6 h-6 rounded-full"
                                />
                                <span>{userDetails.user.role === 'host' ? lease.tenant?.name : lease.host?.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                            </td>
                            <td className="px-4 py-3">
                              Rs. {lease.monthlyRent?.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                lease.status === 'active' ? 'bg-green-100 text-green-800' :
                                lease.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lease.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                    No active leases
                  </p>
                )}
              </div>

              {/* Actions */}
              {userDetails.user.role !== 'admin' && (
                <div className="flex flex-col gap-4 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Verification Action */}
                    <button
                      onClick={() => handleVerifyUser(userDetails.user._id, userDetails.user.name, userDetails.user.isVerified)}
                      disabled={processingId === userDetails.user._id}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 transform ${
                        processingId === userDetails.user._id 
                          ? 'opacity-75 cursor-not-allowed' 
                          : 'hover:shadow-lg hover:scale-[1.02]'
                      } ${
                        userDetails.user.isVerified 
                          ? 'bg-orange-50 text-orange-700 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-100' 
                          : 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md hover:shadow-xl'
                      }`}
                    >
                      <FiShield className="text-lg" />
                      <span>
                        {processingId === userDetails.user._id 
                          ? (userDetails.user.isVerified ? 'Unverifying...' : 'Verifying...')
                          : (userDetails.user.isVerified ? 'Unverify User' : 'Verify User')
                        }
                      </span>
                    </button>

                    {/* Ban/Unban Action */}
                    {userDetails.user.isBanned ? (
                      <button
                        onClick={() => handleUnbanUser(userDetails.user._id, userDetails.user.name)}
                        disabled={processingId === userDetails.user._id}
                        className={`px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 transform bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md ${
                          processingId === userDetails.user._id 
                            ? 'opacity-75 cursor-not-allowed' 
                            : 'hover:shadow-lg hover:scale-[1.02]'
                        }`}
                      >
                        <FiUnlock className="text-lg" />
                        <span>{processingId === userDetails.user._id ? 'Unbanning...' : 'Unban User'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowDetailsModal(false)
                          openBanModal(userDetails.user)
                        }}
                        disabled={processingId === userDetails.user._id}
                        className={`px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 transform bg-red-50 text-red-700 border-2 border-red-200 hover:border-red-300 hover:bg-red-100 ${
                          processingId === userDetails.user._id 
                            ? 'opacity-75 cursor-not-allowed' 
                            : 'hover:shadow-md hover:scale-[1.02]'
                        }`}
                      >
                        <FiLock className="text-lg" />
                        <span>Ban User</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
