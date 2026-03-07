import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import { useAppSettingsStore } from '../../store/appSettingsStore'
import { FiHome, FiUser } from 'react-icons/fi'

function SelectRole() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, token, setAuth } = useAuthStore()
  const { settings } = useAppSettingsStore()

  const handleRoleSelect = async () => {
    if (!selectedRole) {
      toast.error('Please select a role')
      return
    }

    setLoading(true)
    try {
      const response = await authAPI.selectRole({ role: selectedRole })
      const updatedUser = response.data.data
      setAuth(updatedUser, token)
      toast.success(`Welcome to ${settings.platformName}!`)
      navigate(`/dashboard/${updatedUser.role}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to set role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to {settings.platformName}!</h2>
          <p className="text-gray-600 mt-2">
            How would you like to use {settings.platformName}?
          </p>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Tenant Option */}
            <button
              type="button"
              onClick={() => setSelectedRole('tenant')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedRole === 'tenant'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                selectedRole === 'tenant' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <FiUser className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                I'm looking for a place
              </h3>
              <p className="text-sm text-gray-600">
                Browse properties, send lease requests, and manage your rentals as a tenant.
              </p>
            </button>

            {/* Host Option */}
            <button
              type="button"
              onClick={() => setSelectedRole('host')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedRole === 'host'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                selectedRole === 'host' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <FiHome className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                I have property to rent
              </h3>
              <p className="text-sm text-gray-600">
                List your properties, manage tenants, and track payments as a host.
              </p>
            </button>
          </div>

          <button
            onClick={handleRoleSelect}
            disabled={!selectedRole || loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up your account...' : 'Continue'}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            You can change this later in your profile settings.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SelectRole
