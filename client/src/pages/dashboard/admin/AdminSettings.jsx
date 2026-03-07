import { useEffect, useState } from 'react'
import { FiSettings, FiBell, FiShield, FiSave, FiRefreshCw } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { adminAPI } from '../../../utils/api'
import { useAppSettingsStore } from '../../../store/appSettingsStore'

function AdminSettings() {
  const { fetchSettings } = useAppSettingsStore()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [settings, setSettings] = useState({
    platformName: 'MeroGhar',
    supportEmail: 'support@meroghar.com',
    maxPropertiesPerHost: 10,
    adminNotificationEmail: 'support@meroghar.com',
    adminEmailNotifications: {
      newUserRegistration: true,
      propertyPendingApproval: true,
      maxLoginAttemptsExceeded: true
    },
    requireEmailVerification: true,
    autoApproveProperties: false,
    maxLoginAttempts: 5,
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back later.'
  })

  useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
        setFetching(true)
        const response = await adminAPI.getSettings()
        if (response.data?.success) {
          const data = response.data.data
          setSettings((prev) => ({
            ...prev,
            ...data,
            adminEmailNotifications: {
              ...prev.adminEmailNotifications,
              ...(data.adminEmailNotifications || {})
            }
          }))
        }
      } catch (_error) {
        toast.error('Failed to load settings')
      } finally {
        setFetching(false)
      }
    }

    fetchAdminSettings()
  }, [])

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleNotificationToggle = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      adminEmailNotifications: {
        ...prev.adminEmailNotifications,
        [key]: value
      }
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await adminAPI.updateSettings({
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        maxPropertiesPerHost: settings.maxPropertiesPerHost,
        adminNotificationEmail: settings.adminNotificationEmail,
        adminEmailNotifications: settings.adminEmailNotifications,
        requireEmailVerification: settings.requireEmailVerification,
        autoApproveProperties: settings.autoApproveProperties,
        maxLoginAttempts: settings.maxLoginAttempts,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage
      })

      await fetchSettings()
      toast.success('Settings saved successfully')
    } catch (_error) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      try {
        setLoading(true)
        const response = await adminAPI.resetSettings()
        if (response.data?.success) {
          const data = response.data.data
          setSettings((prev) => ({
            ...prev,
            ...data,
            adminEmailNotifications: {
              ...prev.adminEmailNotifications,
              ...(data.adminEmailNotifications || {})
            }
          }))
          await fetchSettings()
          toast.info('Settings reset to default')
        }
      } catch (_error) {
        toast.error('Failed to reset settings')
      } finally {
        setLoading(false)
      }
    }
  }

  if (fetching) {
    return <div className="text-gray-600">Loading settings...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600 mt-1">Configure platform settings and preferences</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-2"
          >
            <FiRefreshCw />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2"
          >
            <FiSave />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FiSettings className="text-primary-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold">General Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleChange('platformName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={50}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={100}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Properties Per Host
              </label>
              <input
                type="number"
                value={settings.maxPropertiesPerHost}
                onChange={(e) => handleChange('maxPropertiesPerHost', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min={1}
                max={100}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiBell className="text-blue-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold">Notification Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">New User Registration Alerts</p>
                <p className="text-sm text-gray-600">Email admins when a new user signs up</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.adminEmailNotifications.newUserRegistration}
                  onChange={(e) => handleNotificationToggle('newUserRegistration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Property Pending Approval Alerts</p>
                <p className="text-sm text-gray-600">Email admins when host submits a property</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.adminEmailNotifications.propertyPendingApproval}
                  onChange={(e) => handleNotificationToggle('propertyPendingApproval', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Max Login Attempts Exceeded Alerts</p>
                <p className="text-sm text-gray-600">Email admins when users exceed login attempts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.adminEmailNotifications.maxLoginAttemptsExceeded}
                  onChange={(e) => handleNotificationToggle('maxLoginAttemptsExceeded', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Alert Email
              </label>
              <input
                type="email"
                value={settings.adminNotificationEmail}
                onChange={(e) => handleChange('adminNotificationEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={120}
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FiShield className="text-red-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold">Security Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Require Email Verification</p>
                <p className="text-sm text-gray-600">Users must verify email before access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto-Approve Properties</p>
                <p className="text-sm text-gray-600">Skip manual verification for properties</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoApproveProperties}
                  onChange={(e) => handleChange('autoApproveProperties', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min={1}
                max={20}
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiSettings className="text-orange-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold">Maintenance Mode</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Enable Maintenance Mode</p>
                <p className="text-sm text-gray-600">Temporarily disable the platform for maintenance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maintenance Message
              </label>
              <textarea
                value={settings.maintenanceMessage}
                onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{settings.maintenanceMessage.length}/500 characters</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
