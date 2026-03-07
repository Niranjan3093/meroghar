import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../../store/authStore'
import { useAppSettingsStore } from '../../store/appSettingsStore'

function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { settings } = useAppSettingsStore()

  useEffect(() => {
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')
    const isNewUser = searchParams.get('isNewUser') === 'true'
    const error = searchParams.get('error')

    if (error) {
      toast.error(decodeURIComponent(error) || 'Authentication failed. Please try again.')
      navigate('/login')
      return
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam))
        setAuth(user, token)
        
        if (isNewUser) {
          // New user - redirect to role selection
          toast.info(`Please select how you want to use ${settings.platformName}`)
          navigate('/select-role')
        } else {
          // Existing user - redirect to dashboard
          toast.success('Login successful!')
          navigate(`/dashboard/${user.role || 'tenant'}`)
        }
      } catch (err) {
        toast.error('Authentication failed. Please try again.')
        navigate('/login')
      }
    } else {
      navigate('/login')
    }
  }, [searchParams, navigate, setAuth, settings.platformName])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}

export default OAuthCallback
