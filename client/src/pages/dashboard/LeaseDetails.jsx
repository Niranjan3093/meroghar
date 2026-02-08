import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { leasesAPI } from '../../utils/api'
import { toast } from 'react-toastify'
import { 
  FiFileText, FiCalendar, FiUser, 
  FiClock, FiCheckCircle, FiAlertCircle, FiDownload, 
  FiArrowLeft, FiPenTool, FiRefreshCw, FiX, FiMapPin,
  FiPhone, FiMail
} from 'react-icons/fi'

function LeaseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [lease, setLease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contractHtml, setContractHtml] = useState('')
  const [showSignModal, setShowSignModal] = useState(false)
  const [signing, setSigning] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchLease()
    
    if (searchParams.get('signing') === 'complete') {
      const event = searchParams.get('event')
      
      if (event === 'signing_complete') {
        syncDocuSignStatus()
      } else if (event === 'decline') {
        toast.error('You declined to sign the lease agreement.')
      } else if (event === 'cancel') {
        toast.warning('Signing was cancelled.')
      } else if (event === 'ttl_expired') {
        toast.warning('Signing session expired. Please try again.')
      } else {
        syncDocuSignStatus()
      }
      
      navigate(window.location.pathname, { replace: true })
    }
  }, [id, searchParams])

  const syncDocuSignStatus = async () => {
    try {
      toast.info('Syncing signature status...')
      const response = await leasesAPI.syncDocuSign(id)
      
      if (response.data.success) {
        setLease(response.data.data)
        
        try {
          const contractRes = await leasesAPI.getContract(id)
          setContractHtml(contractRes.data.data.html)
        } catch (e) {
          console.error('Failed to load contract HTML:', e)
        }
        
        if (response.data.docusignStatus === 'completed') {
          toast.success('Lease agreement fully signed!')
        } else if (response.data.synced) {
          toast.success('Signature recorded successfully!')
        } else {
          toast.success('Signing status verified.')
        }
      }
    } catch (error) {
      console.error('Failed to sync DocuSign status:', error)
      toast.error('Failed to sync signing status.')
      fetchLease()
    }
  }

  const fetchLease = async () => {
    try {
      setLoading(true)
      const response = await leasesAPI.getById(id)
      setLease(response.data.data)
      
      try {
        const contractRes = await leasesAPI.getContract(id)
        setContractHtml(contractRes.data.data.html)
      } catch (e) {
        console.error('Failed to load contract HTML:', e)
      }
    } catch (error) {
      console.error('Failed to fetch lease:', error)
      toast.error('Failed to load lease details')
      navigate('/dashboard/leases')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const endDate = new Date(lease?.endDate)
    const today = new Date()
    const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    
    if (status === 'active' && daysUntilEnd <= 30 && daysUntilEnd > 0) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"><FiClock className="mr-1" /> Expiring Soon</span>
    }
    
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"><FiCheckCircle className="mr-1" /> Active</span>
      case 'pending':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"><FiClock className="mr-1" /> Pending</span>
      case 'expired':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"><FiX className="mr-1" /> Expired</span>
      case 'terminated':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"><FiX className="mr-1" /> Terminated</span>
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const response = await leasesAPI.download(id)
      
      const blob = new Blob([response.data], { 
        type: response.headers?.['content-type'] || 'text/html' 
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lease-agreement-${id}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Contract downloaded successfully')
    } catch (error) {
      console.error('Failed to download contract:', error)
      toast.error('Failed to download contract')
    } finally {
      setDownloading(false)
    }
  }

  const initiateSigning = async () => {
    try {
      setSigning(true)

      let envelope
      try {
        const statusRes = await leasesAPI.getDocuSignStatus(id)
        envelope = statusRes.data.data
      } catch {
        const createRes = await leasesAPI.createEnvelope(id)
        envelope = createRes.data.data
        toast.info(createRes.data.message)
      }

      if (envelope.useLocalSigning) {
        await performLocalSign()
      } else {
        const urlRes = await leasesAPI.getSigningUrl(id)
        if (urlRes.data.data.signingUrl) {
          window.location.href = urlRes.data.data.signingUrl
        } else if (urlRes.data.data.useLocalSigning) {
          await performLocalSign()
        }
      }
    } catch (error) {
      console.error('Failed to initiate signing:', error)
      toast.error(error.response?.data?.message || 'Failed to initiate signing')
    } finally {
      setSigning(false)
    }
  }

  const performLocalSign = async () => {
    try {
      const signature = `Signed electronically by ${user.name} on ${new Date().toLocaleString()}`
      const response = await leasesAPI.sign(id, signature)
      
      toast.success(response.data.message)
      setShowSignModal(false)
      fetchLease()
    } catch (error) {
      console.error('Failed to sign lease:', error)
      toast.error(error.response?.data?.message || 'Failed to sign lease')
    }
  }

  const handleRenewal = async () => {
    try {
      await leasesAPI.requestRenewal(id)
      toast.success('Renewal request submitted successfully')
      fetchLease()
    } catch (error) {
      console.error('Failed to request renewal:', error)
      toast.error(error.response?.data?.message || 'Failed to request renewal')
    }
  }

  const hasUserSigned = () => {
    if (user?.role === 'host') {
      return lease?.hostSignature?.signed
    } else {
      return lease?.tenantSignature?.signed
    }
  }

  const getDaysRemaining = () => {
    const end = new Date(lease?.endDate)
    const today = new Date()
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!lease) {
    return null
  }

  const otherParty = user?.role === 'host' ? lease.tenant : lease.host
  const isExpiringSoon = getDaysRemaining() <= 30 && getDaysRemaining() > 0 && lease.status === 'active'

  return (
    <div className="w-full">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard/leases')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <FiArrowLeft className="mr-2" /> Back to Leases
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <img
            src={lease.property?.images?.[0]?.url || lease.property?.images?.[0] || 'https://via.placeholder.com/200x150?text=Property'}
            alt={lease.property?.title}
            className="w-full lg:w-64 h-52 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{lease.property?.title}</h1>
                <p className="text-gray-500 flex items-center text-lg">
                  <FiMapPin className="mr-2" />
                  {lease.property?.address?.street}, {lease.property?.address?.city}
                </p>
              </div>
              {getStatusBadge(lease.status)}
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-100">
              <div>
                <p className="text-sm text-gray-500 mb-1">Monthly Rent</p>
                <p className="text-2xl font-bold text-primary-600">NPR {lease.monthlyRent?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Security Deposit</p>
                <p className="text-2xl font-bold text-gray-900">NPR {lease.securityDeposit?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Start Date</p>
                <p className="text-xl font-semibold text-gray-900">
                  {new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">End Date</p>
                <p className="text-xl font-semibold text-gray-900">
                  {new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lease Term */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiCalendar className="mr-2 text-primary-500" />
              Lease Term
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Start Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">End Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className={`rounded-lg p-4 text-center ${isExpiringSoon ? 'bg-orange-50' : 'bg-green-50'}`}>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Days Left</p>
                <p className={`font-semibold ${isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`}>
                  {getDaysRemaining()} days
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                <p className="font-semibold text-blue-600">
                  {Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 24 * 30))} months
                </p>
              </div>
            </div>

            {isExpiringSoon && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start">
                <FiAlertCircle className="text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Lease Expiring Soon</p>
                  <p className="text-sm text-orange-700">
                    Your lease expires in {getDaysRemaining()} days. Consider requesting a renewal.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Signature Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiPenTool className="mr-2 text-primary-500" />
              Signature Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Host Signature */}
              <div className={`p-4 rounded-lg border-2 ${lease.hostSignature?.signed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lease.hostSignature?.signed ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <FiUser className={lease.hostSignature?.signed ? 'text-green-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Host/Landlord</p>
                      <p className="text-sm text-gray-600">{lease.host?.name}</p>
                    </div>
                  </div>
                  {lease.hostSignature?.signed ? (
                    <span className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
                      <FiCheckCircle className="mr-1" /> Signed
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                      <FiClock className="mr-1" /> Pending
                    </span>
                  )}
                </div>
                {lease.hostSignature?.signedAt && (
                  <p className="text-xs text-gray-500 mt-3 ml-13">
                    Signed on {new Date(lease.hostSignature.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Tenant Signature */}
              <div className={`p-4 rounded-lg border-2 ${lease.tenantSignature?.signed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lease.tenantSignature?.signed ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <FiUser className={lease.tenantSignature?.signed ? 'text-green-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Tenant</p>
                      <p className="text-sm text-gray-600">{lease.tenant?.name}</p>
                    </div>
                  </div>
                  {lease.tenantSignature?.signed ? (
                    <span className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
                      <FiCheckCircle className="mr-1" /> Signed
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                      <FiClock className="mr-1" /> Pending
                    </span>
                  )}
                </div>
                {lease.tenantSignature?.signedAt && (
                  <p className="text-xs text-gray-500 mt-3 ml-13">
                    Signed on {new Date(lease.tenantSignature.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contract Preview */}
          {contractHtml && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiFileText className="mr-2 text-primary-500" />
                  Lease Agreement
                </h2>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center"
                >
                  <FiDownload className="mr-2" /> {downloading ? 'Downloading...' : 'Download'}
                </button>
              </div>
              <div className="p-6 max-h-[500px] overflow-auto">
                <div 
                  className="prose max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: contractHtml }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {lease.status === 'pending' && !hasUserSigned() && (
                <button
                  onClick={() => setShowSignModal(true)}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center font-medium"
                >
                  <FiPenTool className="mr-2" /> Sign Lease Agreement
                </button>
              )}
              
              {lease.status === 'pending' && hasUserSigned() && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <FiCheckCircle className="mx-auto text-2xl text-blue-600 mb-2" />
                  <p className="font-medium text-blue-800">You've signed this lease</p>
                  <p className="text-sm text-blue-600">Waiting for other party to sign</p>
                </div>
              )}

              {(lease.status === 'active' || isExpiringSoon) && !lease.renewalRequested && (
                <button
                  onClick={handleRenewal}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center font-medium"
                >
                  <FiRefreshCw className="mr-2" /> Request Renewal
                </button>
              )}

              {lease.renewalRequested && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                  <FiRefreshCw className="mx-auto text-2xl text-purple-600 mb-2" />
                  <p className="font-medium text-purple-800">Renewal Requested</p>
                  <p className="text-sm text-purple-600">Waiting for response</p>
                </div>
              )}

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center font-medium"
              >
                <FiDownload className="mr-2" /> Download Contract
              </button>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {user?.role === 'host' ? 'Tenant Contact' : 'Landlord Contact'}
            </h2>
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <img
                src={otherParty?.avatar || 'https://via.placeholder.com/60'}
                alt={otherParty?.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-gray-900">{otherParty?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role === 'host' ? 'Tenant' : 'Host'}</p>
              </div>
            </div>
            <div className="space-y-3">
              {otherParty?.email && (
                <a 
                  href={`mailto:${otherParty.email}`}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition"
                >
                  <FiMail className="mr-3 text-gray-400" />
                  <span className="text-sm truncate">{otherParty.email}</span>
                </a>
              )}
              {otherParty?.phone && (
                <a 
                  href={`tel:${otherParty.phone}`}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition"
                >
                  <FiPhone className="mr-3 text-gray-400" />
                  <span className="text-sm">{otherParty.phone}</span>
                </a>
              )}
            </div>
            <button
              onClick={() => navigate('/dashboard/messages')}
              className="w-full mt-4 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Send Message
            </button>
          </div>

          {/* Lease Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lease Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Lease ID</span>
                <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {lease._id?.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Created</span>
                <span className="font-medium text-gray-900 text-sm">
                  {new Date(lease.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500 text-sm">Last Updated</span>
                <span className="font-medium text-gray-900 text-sm">
                  {new Date(lease.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Sign Lease Agreement</h3>
              <button 
                onClick={() => setShowSignModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiAlertCircle className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Electronic Signature Agreement</p>
                  <p>By clicking "Sign Lease", you agree to electronically sign this lease agreement. This signature will be legally binding.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                disabled={signing}
              >
                Cancel
              </button>
              <button
                onClick={initiateSigning}
                disabled={signing}
                className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center disabled:opacity-50"
              >
                {signing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiPenTool className="mr-2" /> Sign Lease
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaseDetails
