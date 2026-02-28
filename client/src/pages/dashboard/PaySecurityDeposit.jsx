import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { leaseRequestsAPI, paymentsAPI } from '../../utils/api'
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
  const location = useLocation()
  const { user } = useAuthStore()
  const [leaseRequest, setLeaseRequest] = useState(null)
  const [paymentConfig, setPaymentConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [paymentStep, setPaymentStep] = useState('select') // 'select', 'confirm', 'processing', 'success'
  const [completedPaymentId, setCompletedPaymentId] = useState(null)

  const KhaltiLogo = () => (
    <img 
      src="/assets/khalti-logo.png" 
      alt="Khalti Logo" 
      className="w-8 h-8"
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  )

  const EsewaLogo = () => (
    <img 
      src="/assets/esewa-logo.png" 
      alt="eSewa Logo" 
      className="w-8 h-8"
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  )

  const paymentMethods = [
    { id: 'khalti', name: 'Khalti', icon: <KhaltiLogo />, description: 'Pay with Khalti digital wallet' },
    { id: 'esewa', name: 'eSewa', icon: <EsewaLogo />, description: 'Pay with eSewa digital wallet' }
  ]

  const formatDuration = (duration) => {
    const durationMap = {
      'monthly': '1 Month',
      '3-months': '3 Months',
      '6-months': '6 Months',
      'yearly': '12 Months'
    }
    return durationMap[duration] || duration
  }

  // Check for payment callbacks
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    
    console.log('Checking for payment callback...');
    console.log('   Current URL:', location.pathname + location.search);
    console.log('   URL Params:', Object.fromEntries(params.entries()));
    
    // Check for Khalti callback
    const pidx = params.get('pidx')
    const status = params.get('status')
    const txnId = params.get('transaction_id')
    const amount = params.get('amount')
    const purchaseOrderId = params.get('purchase_order_id')
    const purchaseOrderName = params.get('purchase_order_name')
    
    console.log('   Khalti params:', { pidx, status, txnId, amount, purchaseOrderId });
    
    if (pidx && status) {
      console.log('Khalti callback detected! Status:', status);
      if (status === 'Completed') {
        handleKhaltiSuccess({ pidx, txnId, amount })
      } else {
        toast.error(`Khalti payment ${status.toLowerCase()}. Please try again.`)
        navigate(`/dashboard/pay-deposit/${id}`, { replace: true })
      }
      return
    }
    
    // Check for eSewa callback (v2 sends base64 data in query)
    const encodedEsewaData = params.get('data')

    if (location.pathname.includes('/esewa-success') && encodedEsewaData) {
      try {
        const normalizedBase64 = decodeURIComponent(encodedEsewaData).replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = JSON.parse(atob(normalizedBase64));
        handleEsewaSuccess(decodedPayload)
      } catch (decodeError) {
        console.error('Failed to decode eSewa callback payload:', decodeError)
        toast.error('Invalid eSewa callback payload')
        navigate(`/dashboard/pay-deposit/${id}`, { replace: true })
      }
    } else if (location.pathname.includes('/esewa-failure')) {
      toast.error('eSewa payment failed or was cancelled')
      navigate(`/dashboard/pay-deposit/${id}`, { replace: true })
    }
  }, [location])

  const handleKhaltiSuccess = async (params) => {
    try {
      console.log('💳 Processing Khalti payment...', params);
      setProcessing(true)
      setPaymentStep('processing')
      
      // Verify payment with backend (with retries)
      console.log('🔐 Verifying payment with backend...');
      let verifyResponse;
      let verifyAttempt = 0;
      const maxVerifyRetries = 5; // More retries for pending payments
      
      while (verifyAttempt < maxVerifyRetries) {
        try {
          verifyResponse = await paymentsAPI.verifyKhalti({
            pidx: params.pidx,
            amount: params.amount
          })
          
          console.log(`Verification attempt ${verifyAttempt + 1} response:`, verifyResponse.data);
          
          // Check if payment is successfully verified
          if (verifyResponse.data.success) {
            console.log('✅ Payment successfully verified');
            break; // Payment confirmed, proceed to create lease
          }
          
          // If payment is still pending (202 status), retry with longer delay
          if (verifyResponse.status === 202 || !verifyResponse.data.success) {
            verifyAttempt++;
            console.log(`⏳ Payment status: ${verifyResponse.data.status}. Waiting...`);
            
            if (verifyAttempt < maxVerifyRetries) {
              // Longer delays for pending checks (2s, 3s, 4s, 5s, 6s)
              const delayMs = (verifyAttempt + 1) * 1000;
              console.log(`⏳ Retrying verification in ${delayMs}ms (attempt ${verifyAttempt}/${maxVerifyRetries})...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
              throw new Error(`Payment verification timeout. Status: ${verifyResponse.data.status}. Please try again.`);
            }
          } else {
            break; // Unexpected response
          }
        } catch (verifyError) {
          verifyAttempt++;
          console.error(`❌ Verification attempt ${verifyAttempt} failed:`, verifyError.message);
          
          if (verifyAttempt < maxVerifyRetries) {
            const delayMs = Math.pow(2, verifyAttempt - 1) * 1000;
            console.log(`⏳ Retrying verification in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            throw verifyError; // All retries exhausted
          }
        }
      }
      
      console.log('Final verification response:', verifyResponse?.data);
      
      if (verifyResponse?.data?.success) {
        // Payment verified, create lease
        console.log('Creating lease and processing payment...');
        const response = await leaseRequestsAPI.payDeposit(id, {
          paymentMethod: 'khalti',
          transactionId: params.txnId || params.pidx,
          paymentGatewayResponse: verifyResponse.data.data
        })

        console.log('Payment processing complete!', response.data);
        console.log('   Lease Request Status:', response.data.data?.status);
        console.log('   Security Deposit Paid:', response.data.data?.securityDepositPaid);

        setPaymentStep('success')
        setCompletedPaymentId(response.data.payment?._id)
        toast.success('Payment successful! Your lease has been created. You can now sign the contract.')
        
        setTimeout(() => {
          console.log('Redirecting to leases page for contract signing...');
          navigate('/dashboard/leases', { replace: true })
        }, 3000)
      } else {
        throw new Error(verifyResponse?.data?.message || 'Payment verification failed after retries. Please try again.')
      }
    } catch (error) {
      console.error('Khalti verification failed:', error)
      const errorMessage = error.message || 'Payment verification failed. Please contact support if the payment was deducted.';
      toast.error(errorMessage)
      setPaymentStep('select')
      setProcessing(false)
      // Move back to payment page instead of redirecting away immediately
      // navigate(`/dashboard/pay-deposit/${id}`, { replace: true })
    }
  }

  const handleEsewaSuccess = async (params) => {
    try {
      setProcessing(true)
      setPaymentStep('processing')

      if (!params?.transaction_uuid || !params?.total_amount) {
        throw new Error('Missing required eSewa callback details')
      }
      
      // Verify payment with backend
      const verifyResponse = await paymentsAPI.verifyEsewa({
        transaction_uuid: params.transaction_uuid,
        total_amount: params.total_amount,
        product_code: params.product_code,
        transaction_code: params.transaction_code
      })
      
      if (verifyResponse.data.success) {
        // Payment verified, create lease
        const response = await leaseRequestsAPI.payDeposit(id, {
          paymentMethod: 'esewa',
          transactionId: params.transaction_code || params.transaction_uuid,
          paymentGatewayResponse: verifyResponse.data.data
        })

        setPaymentStep('success')
        setCompletedPaymentId(response.data.payment?._id)
        toast.success('Payment successful! Your lease has been created. You can now sign the contract.')
        
        setTimeout(() => {
          navigate('/dashboard/leases', { replace: true })
        }, 3000)
      } else {
        throw new Error(verifyResponse.data.message || 'Payment verification failed')
      }
    } catch (error) {
      console.error('eSewa verification failed:', error)
      toast.error(error.message || 'Payment verification failed')
      navigate(`/dashboard/pay-deposit/${id}`, { replace: true })
      setProcessing(false)
    }
  }

  useEffect(() => {
    // Fetch payment config and lease request when id is available
    if (id && !location.pathname.includes('/esewa-success')) {
      fetchPaymentConfig()
      fetchLeaseRequest()
    }
  }, [id])

  const fetchPaymentConfig = async () => {
    try {
      const response = await paymentsAPI.getConfig()
      console.log('Payment Config Response:', response.data.data)
      setPaymentConfig(response.data.data)
    } catch (error) {
      console.error('Failed to fetch payment config:', error)
      toast.error('Failed to load payment configuration')
    }
  }

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
      if (selectedPaymentMethod === 'khalti') {
        // Check if payment config is loaded
        if (!paymentConfig?.khalti?.enabled) {
          console.error('Payment config missing:', paymentConfig)
          toast.error('Khalti payment gateway is not configured. Please contact support.')
          setProcessing(false)
          setPaymentStep('select')
          return
        }

        // Initiate payment with backend (server-side)
        const initiateResponse = await paymentsAPI.initiateKhalti({
          amount: leaseRequest.securityDeposit,
          productIdentity: id,
          productName: `Security Deposit - ${leaseRequest.property.title}`,
          productUrl: window.location.origin,
          returnUrl: `${window.location.origin}/dashboard/pay-deposit/${id}`
        });

        console.log('🚀 Khalti Initiation Response:', initiateResponse.data);

        if (!initiateResponse.data.success) {
          throw new Error(initiateResponse.data.message || 'Payment initiation failed');
        }

        const paymentUrl = initiateResponse.data.data?.payment_url;
        if (!paymentUrl) {
          console.error('❌ Missing payment_url in response:', initiateResponse.data.data);
          throw new Error('Payment gateway returned invalid response. Please try again.');
        }

        // Redirect to Khalti payment page
        console.log('🔗 Redirecting to:', paymentUrl);
        window.location.href = paymentUrl;
        
      } else if (selectedPaymentMethod === 'esewa') {
        // Check if payment config is loaded
        if (!paymentConfig?.esewa?.enabled) {
          toast.error('eSewa payment gateway is not configured. Please contact support.')
          setProcessing(false)
          setPaymentStep('select')
          return
        }

        const initiateResponse = await paymentsAPI.initiateEsewa({
          amount: leaseRequest.securityDeposit,
          productIdentity: id,
          successUrl: `${window.location.origin}/dashboard/pay-deposit/${id}/esewa-success`,
          failureUrl: `${window.location.origin}/dashboard/pay-deposit/${id}/esewa-failure`
        })

        if (!initiateResponse.data.success || !initiateResponse.data.data?.url || !initiateResponse.data.data?.fields) {
          throw new Error(initiateResponse.data.message || 'eSewa payment initiation failed')
        }

        const esewaPath = initiateResponse.data.data.url
        const params = initiateResponse.data.data.fields

        // Create form and submit
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = esewaPath

        Object.keys(params).forEach(key => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(params[key])
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStep('select');
      
      // Provide more detailed error message based on error type
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        errorMessage = 'Payment gateway connection timeout. Please check your internet and try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setProcessing(false);
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
                <span className="font-medium">{formatDuration(leaseRequest.proposedDuration)}</span>
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
                    <span className="mr-3">{method.icon}</span>
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
                <span className="text-2xl font-bold text-yellow-600">Rs</span>
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Secure Payment:</strong> You will be redirected to {selectedPaymentMethod === 'khalti' ? 'Khalti' : 'eSewa'} to complete your payment securely. 
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h3>
                <p className="text-gray-600 mb-2">Your security deposit has been received and your lease has been created.</p>
                <p className="text-sm text-gray-500 mb-4">Next: You'll be redirected to your leases page to sign the contract.</p>
                {completedPaymentId && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await paymentsAPI.downloadReceipt(completedPaymentId)
                        const blob = new Blob([response.data], { type: 'text/html' })
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `payment-receipt-${completedPaymentId}.html`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        window.URL.revokeObjectURL(url)
                        toast.success('Receipt downloaded!')
                      } catch (error) {
                        console.error('Failed to download receipt:', error)
                        toast.error('Failed to download receipt')
                      }
                    }}
                    className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center mx-auto"
                  >
                    <FiCheck className="mr-2" /> Download Receipt
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PaySecurityDeposit
