import { useEffect, useState } from 'react'
import { FiSettings, FiBell, FiShield, FiSave, FiRefreshCw, FiMail, FiHome, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'
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

  const enabledNotificationCount = Object.values(settings.adminEmailNotifications || {}).filter(Boolean).length
  const stagger = (index) => ({
    animationDelay: `${index * 120}ms`,
    animationFillMode: 'both'
  })

  const ToggleRow = ({ title, description, checked, onChange, tone = 'primary' }) => {
    const toneMap = {
      primary: 'peer-checked:bg-primary-600',
      accent: 'peer-checked:bg-accent-600',
      orange: 'peer-checked:bg-orange-600'
    }

    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-primary-200 transition-colors">
        <div className="pr-4">
          <p className="font-medium text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className={`w-11 h-6 bg-slate-300 rounded-full transition-colors after:content-[''] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-full ${toneMap[tone]}`}></div>
        </label>
      </div>
    )
  }

  if (fetching) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-2xl bg-slate-200" />
          <div className="h-72 rounded-2xl bg-slate-200" />
          <div className="h-64 rounded-2xl bg-slate-200" />
          <div className="h-64 rounded-2xl bg-slate-200" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-primary-200 bg-gradient-to-br from-white via-primary-50 to-accent-50 shadow-lg p-6 md:p-8 animate-slide-in-down" style={stagger(0)}>
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary-200/40 blur-2xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-accent-200/40 blur-2xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 mb-2">Control Center</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Platform Settings</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">Customize branding, alerts, access control, and maintenance behavior in one place.</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold border border-emerald-200">
                <FiCheckCircle />
                {enabledNotificationCount} alert rule{enabledNotificationCount === 1 ? '' : 's'} enabled
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold border border-slate-200">
                <FiSettings />
                Live configuration
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg transition-all disabled:opacity-60"
            >
              <FiSave />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 animate-slide-in-up" style={stagger(1)}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center">
              <FiSettings className="text-primary-700 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">General Settings</h2>
              <p className="text-sm text-slate-600">Brand and inventory limits</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleChange('platformName', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                maxLength={50}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Support Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Properties Per Host
              </label>
              <div className="relative">
                <FiHome className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={settings.maxPropertiesPerHost}
                  onChange={(e) => handleChange('maxPropertiesPerHost', parseInt(e.target.value, 10) || 0)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                  min={1}
                  max={100}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 animate-slide-in-up" style={stagger(2)}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiBell className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Notification Settings</h2>
              <p className="text-sm text-slate-600">Choose admin email alerts</p>
            </div>
          </div>

          <div className="space-y-3">
            <ToggleRow
              title="New User Registration Alerts"
              description="Email admins when a new user signs up"
              checked={settings.adminEmailNotifications.newUserRegistration}
              onChange={(checked) => handleNotificationToggle('newUserRegistration', checked)}
            />
            <ToggleRow
              title="Property Pending Approval Alerts"
              description="Email admins when host submits a property"
              checked={settings.adminEmailNotifications.propertyPendingApproval}
              onChange={(checked) => handleNotificationToggle('propertyPendingApproval', checked)}
            />
            <ToggleRow
              title="Max Login Attempts Exceeded Alerts"
              description="Email admins when users exceed login attempts"
              checked={settings.adminEmailNotifications.maxLoginAttemptsExceeded}
              onChange={(checked) => handleNotificationToggle('maxLoginAttemptsExceeded', checked)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Admin Alert Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={settings.adminNotificationEmail}
                  onChange={(e) => handleChange('adminNotificationEmail', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                  maxLength={120}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 animate-slide-in-up" style={stagger(3)}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">
              <FiShield className="text-red-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Security Settings</h2>
              <p className="text-sm text-slate-600">Account and property verification controls</p>
            </div>
          </div>

          <div className="space-y-3">
            <ToggleRow
              title="Require Email Verification"
              description="Users must verify email before access"
              checked={settings.requireEmailVerification}
              onChange={(checked) => handleChange('requireEmailVerification', checked)}
              tone="accent"
            />
            <ToggleRow
              title="Auto-Approve Properties"
              description="Skip manual verification for new properties"
              checked={settings.autoApproveProperties}
              onChange={(checked) => handleChange('autoApproveProperties', checked)}
              tone="accent"
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value, 10) || 0)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                min={1}
                max={20}
              />
              <p className="text-xs text-slate-500 mt-1">Users are temporarily locked when this limit is exceeded.</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 lg:col-span-2 animate-slide-in-up" style={stagger(4)}>
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                <FiAlertTriangle className="text-orange-600 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Maintenance Mode</h2>
                <p className="text-sm text-slate-600">Public access control during maintenance window</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${settings.maintenanceMode ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
              {settings.maintenanceMode ? 'Maintenance On' : 'Maintenance Off'}
            </span>
          </div>

          <div className="space-y-4">
            <ToggleRow
              title="Enable Maintenance Mode"
              description="Temporarily disable app access for non-admin users"
              checked={settings.maintenanceMode}
              onChange={(checked) => handleChange('maintenanceMode', checked)}
              tone="orange"
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Maintenance Message
              </label>
              <textarea
                value={settings.maintenanceMessage}
                onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 resize-none transition-all"
              />
              <div className="flex items-center justify-between text-xs mt-1">
                <p className="text-slate-500">This appears on the public maintenance page.</p>
                <p className={`${settings.maintenanceMessage.length > 460 ? 'text-orange-600 font-semibold' : 'text-slate-400'}`}>
                  {settings.maintenanceMessage.length}/500
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminSettings
