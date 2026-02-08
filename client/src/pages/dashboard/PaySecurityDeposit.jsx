import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { leaseRequestsAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-toastify'
import { 
  FiDollarSign, FiHome, FiCalendar, FiClock, 
  FiCheck, FiShield, FiCreditCard, FiArrowLeft,
  FiUser, FiMapPin
} from 'react-icons/fi'

function PaySecurityDeposit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [leaseRequest, setLeaseRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [paymentStep, setPaymentStep] = useState('select') // 'select', 'confirm', 'processing', 'success'

  const paymentMethods = [
    { id: 'khalti', name: 'Khalti', icon: '💜', description: 'Pay with Khalti digital wallet' },
    { id: 'esewa', name: 'eSewa', icon: '💚', description: 'Pay with eSewa digital wallet' },
    { id: 'bank-transfer', name: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer (Demo)' }
  ]

  useEffect(() => {
    // Fetch lease request when id is available
    if (id) {
      fetchLeaseRequest()
    }
  }, [id])

  const fetchLeaseRequest = async () => {
    try {
      setLoading(true)
      const response = await leaseRequestsAPI.getById(id)
      const request = response.data.data

      // Backend already verifies user access, just check status here
      if (request.status !== 'approved') {
        toast.error('This lease request is not approved for payment')
        navigate('/dashboard/lease-requests')
        return
      }

      if (request.securityDepositPaid) {
        toast.info('Security deposit has already been paid')
        navigate('/dashboard/leases')
        return
      }

      setLeaseRequest(request)
    } catch (error) {
      console.error('Failed to fetch lease request:', error)
      // If backend returns 403, it means access denied
      if (error.response?.status === 403) {
        toast.error('Access denied')
      } else {
        toast.error('Failed to load lease request')
      }
      navigate('/dashboard/lease-requests')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    if (!agreeToTerms) {
      toast.error('Please agree to the terms and conditions')
      return
    }

    // Show confirmation modal
    setShowConfirmModal(true)
  }

  const confirmPayment = async () => {
    setShowConfirmModal(false)
    setProcessing(true)
    setPaymentStep('processing')

    try {
      // Simulate payment gateway redirect and processing
      if (selectedPaymentMethod === 'khalti') {
        toast.info('Connecting to Khalti...')
        await new Promise(resolve => setTimeout(resolve, 1500))
        toast.info('Processing payment...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else if (selectedPaymentMethod === 'esewa') {
        toast.info('Connecting to eSewa...')
        await new Promise(resolve => setTimeout(resolve, 1500))
        toast.info('Processing payment...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        toast.info('Verifying bank transfer...')
        await new Promise(resolve => setTimeout(resolve, 2500))
      }

      // Generate transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      // Call backend to process payment
      const response = await leaseRequestsAPI.payDeposit(id, {
        paymentMethod: selectedPaymentMethod,
        transactionId,
        paymentGatewayResponse: {
          status: 'success',
          method: selectedPaymentMethod,
          timestamp: new Date().toISOString()
        }
      })

      setPaymentStep('success')
      toast.success('Payment successful! Your lease has been created.')
      
      // Wait a moment before redirecting
      setTimeout(() => {
        navigate(`/dashboard/leases/${response.data.lease._id}`)
      }, 2000)
    } catch (error) {
      console.error('Payment failed:', error)
      setPaymentStep('select')
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (!leaseRequest) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Pay Security Deposit</h1>

            {/* Property Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-4">
                {leaseRequest.property.images?.[0] && (
                  <img
                    src={leaseRequest.property.images[0].url}
                    alt={leaseRequest.property.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{leaseRequest.property.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <FiMapPin className="mr-1" size={14} />
                    {leaseRequest.property.address?.street}, {leaseRequest.property.address?.city}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <FiUser className="mr-1" size={14} />
                    Host: {leaseRequest.host.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Lease Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center">
                  <FiCalendar className="mr-2" /> Move-in Date
                </span>
                <span className="font-medium">
                  {new Date(leaseRequest.proposedMoveIn).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center">
                  <FiClock className="mr-2" /> Lease Duration
                </span>
                <span className="font-medium capitalize">{leaseRequest.proposedDuration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center">
                  <FiHome className="mr-2" /> Monthly Rent
                </span>
                <span className="font-medium">NPR {leaseRequest.monthlyRent?.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Select Payment Method</h3>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedPaymentMethod === method.id}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{method.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{method.name}</p>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <FiCheck className="text-primary-600 text-xl" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Terms Agreement */}
            <label className="flex items-start space-x-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                I agree to the <a href="#" className="text-primary-600 hover:underline">Terms and Conditions</a> and 
                understand that the security deposit is refundable as per the lease agreement terms.
              </span>
            </label>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing || !selectedPaymentMethod || !agreeToTerms}
              className="w-full btn-primary py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiCreditCard className="mr-2" />
                  Pay NPR {leaseRequest.securityDeposit?.toLocaleString()}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Security Deposit</span>
                <span className="font-medium">NPR {leaseRequest.securityDeposit?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Processing Fee</span>
                <span className="text-green-600">Free</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-primary-600">
                  NPR {leaseRequest.securityDeposit?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="text-green-600 text-xl flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Secure Payment</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your payment information is encrypted and secure. The security deposit 
                    is held safely and will be refunded as per the lease terms.
                  </p>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">What happens next?</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3 text-sm">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">1</span>
                  <span className="text-gray-600">Your payment is processed securely</span>
                </li>
                <li className="flex items-start space-x-3 text-sm">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">2</span>
                  <span className="text-gray-600">Lease agreement is created automatically</span>
                </li>
                <li className="flex items-start space-x-3 text-sm">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">3</span>
                  <span className="text-gray-600">Both parties sign the lease digitally</span>
                </li>
                <li className="flex items-start space-x-3 text-sm">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">4</span>
                  <span className="text-gray-600">Move in on your scheduled date!</span>
                </li>
              </ul>
            </div>

            {/* Host Response Message */}
            {leaseRequest.hostResponse?.message && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Message from Host</h4>
                <p className="text-sm text-blue-700">{leaseRequest.hostResponse.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiDollarSign className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Payment</h3>
              <p className="text-gray-600">
                You are about to pay the security deposit for this property.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Property</span>
                <span className="font-medium text-gray-900">{leaseRequest.property?.title}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium text-gray-900 capitalize">{selectedPaymentMethod}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">Amount to Pay</span>
                <span className="font-bold text-primary-600">NPR {leaseRequest.securityDeposit?.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> This is a simulated payment for demonstration purposes. 
                No actual money will be charged.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center max-w-sm w-full mx-4">
            {paymentStep === 'processing' && (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
                <p className="text-gray-600">Please wait while we process your payment...</p>
                <p className="text-sm text-gray-500 mt-2">Do not close this window</p>
              </>
            )}
            {paymentStep === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600">Your lease has been created. Redirecting...</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PaySecurityDeposit
