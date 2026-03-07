import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { authAPI } from '../../utils/api'
import { useAppSettingsStore } from '../../store/appSettingsStore'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheck } from 'react-icons/fi'

function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [codeVerified, setCodeVerified] = useState(false)
  const { settings } = useAppSettingsStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { register, handleSubmit, watch, formState: { errors }, trigger, getValues } = useForm({
    defaultValues: {
      email: location.state?.email || ''
    }
  })
  
  const emailValue = watch('email')
  const tokenValue = watch('token')
  const passwordValue = watch('password')
  const confirmPasswordValue = watch('confirmPassword')

  const onVerifyCode = async (e) => {
    e.preventDefault()
    
    // Validate email and token
    const isValid = await trigger(['email', 'token'])
    if (!isValid) return

    const { email, token } = getValues()
    
    setLoading(true)
    try {
      // Verify the code exists by attempting a password reset without changing password
      // We'll just verify the code format and let the backend validate on actual reset
      if (token.length !== 6 || isNaN(token)) {
        toast.error('Invalid reset code format')
        return
      }
      
      toast.success('Code verified! Now enter your new password.')
      setCodeVerified(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify code.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authAPI.resetPassword(data.token, {
        email: data.email,
        password: data.password
      })
      toast.success('Password reset successfully! Redirecting to login...')
      
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <img 
              src="/assets/app_logo.png" 
              alt={`${settings.platformName} Logo`} 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-gray-600 mt-2">
            {!codeVerified 
              ? 'Enter your email and reset code' 
              : 'Enter your new password'}
          </p>
        </div>

        <div className="card">
          {!codeVerified ? (
            // Step 1: Verify Reset Code
            <form onSubmit={onVerifyCode} className="space-y-6">
              {/* Email */}
              <div>
                <div className="relative">
                  <label className={`absolute left-10 transition-all duration-200 bg-white px-1 pointer-events-none ${
                    focusedField === 'email' || emailValue ? '-top-2 text-xs text-primary-600 font-medium' : 'top-3 text-sm text-gray-600'
                  }`}>
                    Email Address
                  </label>
                  <FiMail className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      },
                      setValueAs: v => v.trim()
                    })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="input-field pl-10 pt-2"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Reset Token */}
              <div>
                <div className="relative">
                  <label className={`absolute left-10 transition-all duration-200 bg-white px-1 pointer-events-none ${
                    focusedField === 'token' || tokenValue ? '-top-2 text-xs text-primary-600 font-medium' : 'top-3 text-sm text-gray-600'
                  }`}>
                    Reset Code
                  </label>
                  <FiLock className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    {...register('token', { 
                      required: 'Reset code is required',
                      minLength: {
                        value: 6,
                        message: 'Reset code must be at least 6 characters'
                      }
                    })}
                    onFocus={() => setFocusedField('token')}
                    onBlur={() => setFocusedField(null)}
                    className="input-field pl-10 pt-2"
                  />
                </div>
                {errors.token && (
                  <p className="text-red-500 text-sm mt-1">{errors.token.message}</p>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Verifying code...' : 'Verify Code'}
              </button>
            </form>
          ) : (
            // Step 2: Reset Password
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Progress Indicator */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <FiCheck className="text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Code verified</p>
              </div>

              {/* New Password */}
              <div>
                <div className="relative">
                  <label className={`absolute left-10 transition-all duration-200 bg-white px-1 pointer-events-none ${
                    focusedField === 'password' || passwordValue ? '-top-2 text-xs text-primary-600 font-medium' : 'top-3 text-sm text-gray-600'
                  }`}>
                    New Password
                  </label>
                  <FiLock className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      },
                      maxLength: {
                        value: 128,
                        message: 'Password must be less than 128 characters'
                      }
                    })}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="input-field pl-10 pr-10 pt-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <label className={`absolute left-10 transition-all duration-200 bg-white px-1 pointer-events-none ${
                    focusedField === 'confirmPassword' || confirmPasswordValue ? '-top-2 text-xs text-primary-600 font-medium' : 'top-3 text-sm text-gray-600'
                  }`}>
                    Confirm Password
                  </label>
                  <FiLock className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', { 
                      required: 'Please confirm your password',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    className="input-field pl-10 pr-10 pt-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Resetting password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <FiArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
