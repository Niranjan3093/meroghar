import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { authAPI } from '../../utils/api'
import { FiMail, FiArrowLeft } from 'react-icons/fi'

function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [emailSent, setEmailSent] = useState(false)
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm()
  const emailValue = watch('email')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authAPI.forgotPassword(data)
      toast.success('Password reset code sent to your email!')
      setEmailSent(true)
      reset()
      
      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        navigate('/reset-password', { state: { email: data.email } })
      }, 2000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset code. Please try again.')
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
              alt="MeroGhar Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Forgot Password</h2>
          <p className="text-gray-600 mt-2">
            {emailSent 
              ? 'Check your email for the reset code' 
              : 'Enter your email to receive a password reset code'}
          </p>
        </div>

        {!emailSent ? (
          <div className="card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      maxLength: { value: 100, message: 'Email must be less than 100 characters' },
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      },
                      setValueAs: v => v.trim()
                    })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="input-field pl-10 pt-2"
                    maxLength={100}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Sending code...' : 'Send Reset Code'}
              </button>
            </form>

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
        ) : (
          <div className="card text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              We've sent a password reset code to your email. Check your inbox and spam folder.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to reset password page...
            </p>
            <Link 
              to="/reset-password"
              className="inline-block btn-primary"
            >
              Enter Reset Code
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
