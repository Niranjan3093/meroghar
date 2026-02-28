import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'

function VerifyEmail() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [searchParams] = useSearchParams()
  const email = location.state?.email || searchParams.get('email') || sessionStorage.getItem('pendingVerificationEmail')

  useEffect(() => {
    if (!email) {
      navigate('/login')
    }
  }, [email, navigate])

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^[0-9]$/.test(value)) return
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto focus next input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus()
    }
  }

  const handleVerify = async () => {
    const verificationCode = code.join('')
    if (verificationCode.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    setLoading(true)
    try {
      const response = await authAPI.verifyEmail({
        email,
        token: verificationCode
      })
      const { token, ...user } = response.data.data
      setAuth(user, token)
      sessionStorage.removeItem('pendingVerificationEmail')
      sessionStorage.removeItem('pendingVerificationSource')
      toast.success('Email verified successfully!')
      navigate(`/dashboard/${user.role}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await authAPI.resendVerification({ email })
      sessionStorage.setItem('pendingVerificationEmail', email)
      toast.success('Verification code sent!')
    } catch (error) {
      toast.error('Failed to resend code')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="text-gray-600 mt-2">
            We've sent a verification code to <strong>{email}</strong>
          </p>
        </div>

        <div className="card">
          <div className="space-y-6">
            {/* Verification Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter 6-digit code
              </label>
              <div className="flex justify-center space-x-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      // Handle backspace to move to previous input
                      if (e.key === 'Backspace' && !digit && index > 0) {
                        document.getElementById(`code-${index - 1}`)?.focus()
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault()
                      const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
                      if (paste) {
                        const newCode = [...code]
                        for (let i = 0; i < paste.length && i + index < 6; i++) {
                          newCode[i + index] = paste[i]
                        }
                        setCode(newCode)
                        const focusIdx = Math.min(index + paste.length, 5)
                        document.getElementById(`code-${focusIdx}`)?.focus()
                      }
                    }}
                    className="w-12 h-12 text-center text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend Code */}
            <div className="text-center">
              <button
                onClick={handleResend}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
