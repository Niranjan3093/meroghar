import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../utils/api'
import UserAvatar from '../../components/UserAvatar'
import { FiUser, FiMail, FiPhone, FiLock, FiCamera, FiMapPin, FiCalendar, FiBell, FiShield, FiCreditCard, FiCheckCircle, FiAlertCircle, FiEdit, FiSave, FiX } from 'react-icons/fi'

function Profile() {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Fetch latest user data on component mount
  useEffect(() => {
    const fetchLatestUserData = async () => {
      try {
        const response = await authAPI.getMe()
        if (response.data.data) {
          updateUser(response.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch latest user data:', error)
      }
    }
    fetchLatestUserData()
  }, [])
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || '',
    avatar: user?.avatar || 'https://via.placeholder.com/150'
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    paymentReminders: true,
    maintenanceUpdates: true,
    leaseReminders: true,
    marketingEmails: false
  })

  const validateProfile = () => {
    const errs = {}
    if (!profileData.name.trim()) errs.name = 'Name is required'
    else if (profileData.name.trim().length < 2) errs.name = 'Name must be at least 2 characters'
    else if (!/^[A-Za-z\s'-]+$/.test(profileData.name.trim())) errs.name = 'Name can only contain letters, spaces, hyphens and apostrophes'
    if (!profileData.email.trim()) errs.email = 'Email is required'
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(profileData.email.trim())) errs.email = 'Invalid email address'
    if (profileData.phone && !/^(\+977)?[0-9]{10}$/.test(profileData.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid Nepali phone number'
    if (profileData.bio && profileData.bio.length > 500) errs.bio = 'Bio must be less than 500 characters'
    setProfileErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    if (!validateProfile()) return
    setLoading(true)
    // API call would go here
    setTimeout(() => {
      updateUser(profileData)
      setEditing(false)
      setLoading(false)
    }, 1000)
  }

  const validatePassword = () => {
    const errs = {}
    if (!passwordData.currentPassword) errs.currentPassword = 'Current password is required'
    if (!passwordData.newPassword) errs.newPassword = 'New password is required'
    else if (passwordData.newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters'
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(passwordData.newPassword)) errs.newPassword = 'Must include uppercase, lowercase, and a number'
    if (passwordData.newPassword !== passwordData.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    setPasswordErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!validatePassword()) return
    setLoading(true)
    setPasswordSuccess('')
    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordSuccess('Password updated successfully')
      setTimeout(() => setPasswordSuccess(''), 4000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password'
      setPasswordErrors(prev => ({ ...prev, currentPassword: msg }))
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPG or PNG image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await authAPI.uploadAvatar(formData)
      const newAvatar = res.data.data.avatar
      updateUser({ avatar: newAvatar })
      setProfileData(prev => ({ ...prev, avatar: newAvatar }))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setAvatarUploading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'payment', label: 'Payment Methods', icon: FiCreditCard }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar / Tab Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            {/* Profile Card */}
            <div className="text-center pb-4 mb-4 border-b border-gray-100">
              <div className="relative inline-block">
                <UserAvatar
                  name={profileData.name}
                  avatar={profileData.avatar}
                  size="2xl"
                  className="mx-auto border-4 border-white shadow-lg"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition shadow-lg disabled:opacity-50"
                  title="Change profile picture"
                >
                  {avatarUploading ? (
                    <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <FiCamera className="text-sm" />
                  )}
                </button>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{profileData.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
              <div className="flex items-center justify-center mt-2">
                {user?.isVerified ? (
                  <span className="inline-flex items-center text-xs text-green-600">
                    <FiCheckCircle className="mr-1" /> Verified Account
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs text-orange-600">
                    <FiAlertCircle className="mr-1" /> Unverified
                  </span>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="mr-3 text-lg" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                {!editing ? (
                  <button 
                    onClick={() => setEditing(true)}
                    className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <FiEdit className="mr-1" /> Edit
                  </button>
                ) : (
                  <button 
                    onClick={() => setEditing(false)}
                    className="flex items-center text-gray-600 hover:text-gray-700 text-sm font-medium"
                  >
                    <FiX className="mr-1" /> Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {editing ? (
                      <>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => {
                            setProfileData({...profileData, name: e.target.value})
                            if (profileErrors.name) setProfileErrors({...profileErrors, name: ''})
                          }}
                          className={`input-field ${profileErrors.name ? 'border-red-500' : ''}`}
                          maxLength={50}
                        />
                        {profileErrors.name && <p className="text-red-500 text-sm mt-1">{profileErrors.name}</p>}
                      </>
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    {editing ? (
                      <>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => {
                            setProfileData({...profileData, email: e.target.value})
                            if (profileErrors.email) setProfileErrors({...profileErrors, email: ''})
                          }}
                          className={`input-field ${profileErrors.email ? 'border-red-500' : ''}`}
                          maxLength={100}
                        />
                        {profileErrors.email && <p className="text-red-500 text-sm mt-1">{profileErrors.email}</p>}
                      </>
                    ) : (
                      <div className="flex items-center">
                        <p className="text-gray-900 py-2">{profileData.email || '-'}</p>
                        {user?.isEmailVerified && (
                          <FiCheckCircle className="ml-2 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    {editing ? (
                      <>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => {
                            setProfileData({...profileData, phone: e.target.value})
                            if (profileErrors.phone) setProfileErrors({...profileErrors, phone: ''})
                          }}
                          className={`input-field ${profileErrors.phone ? 'border-red-500' : ''}`}
                          placeholder="9800000000"
                          maxLength={14}
                          onKeyDown={(e) => {
                            if (!/[0-9+]/.test(e.key) && !['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                              e.preventDefault()
                            }
                          }}
                        />
                        {profileErrors.phone && <p className="text-red-500 text-sm mt-1">{profileErrors.phone}</p>}
                      </>
                    ) : (
                      <div className="flex items-center">
                        <p className="text-gray-900 py-2">{profileData.phone || '-'}</p>
                        {user?.isPhoneVerified && (
                          <FiCheckCircle className="ml-2 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    {editing ? (
                      <input
                        type="text"
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        className="input-field"
                        placeholder="Your address"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.address || '-'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  {editing ? (
                    <>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => {
                          setProfileData({...profileData, bio: e.target.value})
                          if (profileErrors.bio) setProfileErrors({...profileErrors, bio: ''})
                        }}
                        className={`input-field ${profileErrors.bio ? 'border-red-500' : ''}`}
                        rows={3}
                        placeholder="Tell us about yourself..."
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-400 mt-1">{profileData.bio.length}/500 characters</p>
                      {profileErrors.bio && <p className="text-red-500 text-sm mt-1">{profileErrors.bio}</p>}
                    </>
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.bio || 'No bio added'}</p>
                  )}
                </div>

                {editing && (
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="btn-primary flex items-center"
                    >
                      {loading ? (
                        <span className="animate-spin mr-2">⏳</span>
                      ) : (
                        <FiSave className="mr-2" />
                      )}
                      Save Changes
                    </button>
                  </div>
                )}
              </form>

              {/* Account Info */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="font-medium text-gray-900 capitalize mt-1">{user?.role || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Account Status</p>
                    <p className="font-medium mt-1">
                      {user?.isVerified
                        ? <span className="text-green-600">Verified</span>
                        : <span className="text-orange-500">Unverified</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  {passwordSuccess && (
                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                      <FiCheckCircle className="mr-2 flex-shrink-0" />
                      {passwordSuccess}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => {
                        setPasswordData({...passwordData, currentPassword: e.target.value})
                        if (passwordErrors.currentPassword) setPasswordErrors({...passwordErrors, currentPassword: ''})
                      }}
                      className={`input-field ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                      required
                      maxLength={128}
                    />
                    {passwordErrors.currentPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData({...passwordData, newPassword: e.target.value})
                        if (passwordErrors.newPassword) setPasswordErrors({...passwordErrors, newPassword: ''})
                      }}
                      className={`input-field ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                      required
                      minLength={6}
                      maxLength={128}
                    />
                    {passwordErrors.newPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => {
                        setPasswordData({...passwordData, confirmPassword: e.target.value})
                        if (passwordErrors.confirmPassword) setPasswordErrors({...passwordErrors, confirmPassword: ''})
                      }}
                      className={`input-field ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                      required
                      minLength={6}
                      maxLength={128}
                    />
                    {passwordErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>}
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Two-Factor Authentication</h2>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">SMS Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
                    Enable
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Active Sessions</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        💻
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Chrome on Windows</p>
                        <p className="text-sm text-gray-500">Kathmandu, Nepal • Current session</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Active now</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                  { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Get reminded about upcoming payments' },
                  { key: 'maintenanceUpdates', label: 'Maintenance Updates', desc: 'Updates on maintenance requests' },
                  { key: 'leaseReminders', label: 'Lease Reminders', desc: 'Reminders about lease expiry' },
                  { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive promotional content' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                  <button className="btn-primary text-sm">Add New</button>
                </div>
                <div className="py-8 text-center text-gray-400">
                  <FiCreditCard className="mx-auto text-3xl mb-2" />
                  <p className="text-sm">No payment methods added yet.</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing History</h2>
                <p className="text-gray-500 text-sm">View your payment and billing history in the Payments section.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
