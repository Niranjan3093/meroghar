import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { leasesAPI } from '../../utils/api'
import { toast } from 'react-toastify'
import UserAvatar from '../../components/UserAvatar'
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
      return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-500 text-white shadow-sm"><FiClock className="mr-1.5" /> Expiring Soon</span>
    }
    
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-500 text-white shadow-sm"><FiCheckCircle className="mr-1.5" /> Active</span>
      case 'pending':
        return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-yellow-500 text-white shadow-sm"><FiClock className="mr-1.5" /> Pending</span>
      case 'expired':
        return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-red-500 text-white shadow-sm"><FiX className="mr-1.5" /> Expired</span>
      case 'terminated':
        return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-red-500 text-white shadow-sm"><FiX className="mr-1.5" /> Terminated</span>
      default:
        return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-500 text-white shadow-sm">{status}</span>
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
        } else if(urlRes.data.data.useLocalSigning) {
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

  const leaseProgress = Math.max(0, Math.min(100, Math.round((1 - getDaysRemaining() / Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 24))) * 100)))

  return (
    <div className="bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => navigate('/dashboard/leases')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
          >
            <FiArrowLeft className="mr-2" /> Back to Leases
          </button>
        </div>
      </div>

      {/* Property Header Section */}
      <div className="bg-white border-b border-gray-200 py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {/* Property Image + Title */}
            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              {/* Property Image */}
              <div className="w-full sm:w-40 h-32 flex-shrink-0 rounded-lg overflow-hidden shadow">
                {lease.property?.images?.[0]?.url || lease.property?.images?.[0] ? (
                  <img
                    src={lease.property?.images?.[0]?.url || lease.property?.images?.[0]}
                    alt={lease.property?.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <FiFileText className="text-gray-400 text-3xl" />
                  </div>
                )}
              </div>
              
              {/* Property Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {lease.property?.title}
                </h1>
                <p className="text-gray-600 flex items-center text-sm mb-3">
                  <FiMapPin className="mr-1.5 flex-shrink-0" />
                  <span>{lease.property?.address?.street}, {lease.property?.address?.city}</span>
                </p>
                {getStatusBadge(lease.status)}
              </div>
            </div>
            
            {/* Financial Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-3 border border-primary-200">
                <p className="text-[10px] font-semibold text-primary-700 uppercase tracking-wide mb-1">Monthly Rent</p>
                <p className="text-sm font-bold text-primary-900">
                  NPR {lease.monthlyRent?.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1">Security Deposit</p>
                <p className="text-sm font-bold text-gray-900">
                  NPR {lease.securityDeposit?.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Start Date</p>
                <p className="text-sm font-bold text-blue-900">
                  {new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-1">End Date</p>
                <p className="text-sm font-bold text-green-900">
                  {new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="py-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-5">
                {/* Lease Term Progress */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center mr-2.5">
                      <FiCalendar className="text-primary-600" />
                    </div>
                    Lease Timeline
                  </h2>
                  
                  {/* Progress Bar */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Lease Progress</span>
                      <span className="text-sm font-semibold text-primary-600">{leaseProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isExpiringSoon ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-primary-500 to-primary-600'}`}
                        style={{ width: `${leaseProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                      <p className="text-[10px] text-blue-700 uppercase tracking-wide mb-1 font-semibold">Start Date</p>
                      <p className="font-bold text-sm text-blue-900">
                        {new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                      <p className="text-[10px] text-green-700 uppercase tracking-wide mb-1 font-semibold">End Date</p>
                      <p className="font-bold text-sm text-green-900">
                        {new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border ${isExpiringSoon ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300' : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300'}`}>
                      <p className={`text-[10px] uppercase tracking-wide mb-1 font-semibold ${isExpiringSoon ? 'textoran-700' : 'text-emerald-700'}`}>Days Remaining</p>
                      <p className={`font-bold text-lg ${isExpiringSoon ? 'text-orange-900' : 'text-emerald-900'}`}>
                        {getDaysRemaining()}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                      <p className="text-[10px] text-purple-700 uppercase tracking-wide mb-1 font-semibold">Duration</p>
                      <p className="font-bold text-sm text-purple-900">
                        {Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 24 * 30))} months
                      </p>
                    </div>
                  </div>

                  {isExpiringSoon && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg flex items-start">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center mr-2.5 flex-shrink-0">
                        <FiAlertCircle className="text-orange-600" />
                      </div>
                      <div>
                        <p className="font-bold text-orange-900 mb-0.5 text-sm">Lease Expiring Soon!</p>
                        <p className="text-xs text-orange-800">
                          Your lease expires in {getDaysRemaining()} days. Consider requesting a renewal to avoid any interruptions.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Signature Status */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-2.5">
                      <FiPenTool className="text-green-600" />
                    </div>
                    Signature Status
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Host Signature */}
                    <div className={`p-4 rounded-lg border transition-all ${lease.hostSignature?.signed ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm' : 'bg-gray-50 border-gray-300'}`}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${lease.hostSignature?.signed ? 'bg-green-100' : 'bg-gray-200'}`}>
                          <FiUser className={`${lease.hostSignature?.signed ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 truncate text-sm">Host/Landlord</p>
                          <p className="text-xs text-gray-600 truncate">{lease.host?.name}</p>
                        </div>
                      </div>
                      {lease.hostSignature?.signed ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-center w-full p-2 bg-green-100 rounded-lg">
                            <FiCheckCircle className="text-green-600 mr-2 text-sm" />
                            <span className="text-green-700 font-bold text-xs">Successfully Signed</span>
                          </div>
                          <p className="text-[10px] text-center text-gray-500">
                            {new Date(lease.hostSignature.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full p-2 bg-gray-100 rounded-lg">
                          <FiClock className="text-gray-500 mr-2 text-sm" />
                          <span className="text-gray-600 font-semibold text-xs">Awaiting Signature</span>
                        </div>
                      )}
                    </div>

                    {/* Tenant Signature */}
                    <div className={`p-4 rounded-lg border transition-all ${lease.tenantSignature?.signed ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm' : 'bg-gray-50 border-gray-300'}`}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${lease.tenantSignature?.signed ? 'bg-green-100' : 'bg-gray-200'}`}>
                          <FiUser className={`${lease.tenantSignature?.signed ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 truncate text-sm">Tenant</p>
                          <p className="text-xs text-gray-600 truncate">{lease.tenant?.name}</p>
                        </div>
                      </div>
                      {lease.tenantSignature?.signed ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-center w-full p-2 bg-green-100 rounded-lg">
                            <FiCheckCircle className="text-green-600 mr-2 text-sm" />
                            <span className="text-green-700 font-bold text-xs">Successfully Signed</span>
                          </div>
                          <p className="text-[10px] text-center text-gray-500">
                            {new Date(lease.tenantSignature.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full p-2 bg-gray-100 rounded-lg">
                          <FiClock className="text-gray-500 mr-2 text-sm" />
                          <span className="text-gray-600 font-semibold text-xs">Awaiting Signature</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contract Preview */}
                {contractHtml && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-2.5">
                          <FiFileText className="text-blue-600" />
                        </div>
                        Lease Agreement
                      </h2>
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="px-3 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition flex items-center shadow-sm disabled:opacity-50"
                      >
                        <FiDownload className="mr-1.5" /> {downloading ? 'Downloading...' : 'Download'}
                      </button>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-auto bg-gray-50">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: contractHtml }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:col-span-1 space-y-5">
                {/* Actions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center mr-2.5">
                      <FiCheckCircle className="text-primary-600" />
                    </div>
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    {lease.status === 'pending' && !hasUserSigned() && (
                      <button
                        onClick={() => setShowSignModal(true)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center font-bold shadow-md hover:shadow-lg text-sm"
                      >
                        <FiPenTool className="mr-2" /> Sign Lease Agreement
                      </button>
                    )}
                    
                    {lease.status === 'pending' && hasUserSigned() && (
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg text-center">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                          <FiCheckCircle className="text-xl text-blue-600" />
                        </div>
                        <p className="font-bold text-blue-900 text-sm mb-0.5">You've Signed!</p>
                        <p className="text-xs text-blue-700">Waiting for other party</p>
                      </div>
                    )}

                    {(lease.status === 'active' || isExpiringSoon) && !lease.renewalRequested && (
                      <button
                        onClick={handleRenewal}
                        className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-lg hover:from-primary-700 hover:to-blue-700 transition-all flex items-center justify-center font-bold shadow-md hover:shadow-lg text-sm"
                      >
                        <FiRefreshCw className="mr-2" /> Request Renewal
                      </button>
                    )}

                    {lease.renewalRequested && (
                      <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg text-center">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                          <FiRefreshCw className="text-xl text-purple-600" />
                        </div>
                        <p className="font-bold text-purple-900 text-sm mb-0.5">Renewal Requested</p>
                        <p className="text-xs text-purple-700">Waiting for host response</p>
                      </div>
                    )}

                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center font-semibold border border-gray-200 hover:border-gray-300 text-sm"
                    >
                      <FiDownload className="mr-2" /> {downloading ? 'Downloading...' : 'Download Contract'}
                    </button>
                  </div>
                </div>

                {/* Contact Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    {user?.role === 'host' ? 'Tenant Contact' : 'Landlord Contact'}
                  </h2>
                  <div className="flex flex-col items-center mb-4 pb-4 border-b border-gray-200">
                    <UserAvatar 
                      name={otherParty?.name}
                      avatar={otherParty?.avatar}
                      size="lg"
                      className="flex-shrink-0 shadow-md mb-2.5 border-2 border-gray-100"
                    />
                    <div className="text-center">
                      <p className="font-bold text-gray-900 mb-1 text-sm">{otherParty?.name}</p>
                      <p className="text-xs text-gray-500 capitalize px-2 py-0.5 bg-gray-100 rounded-full inline-block">
                        {user?.role === 'host' ? 'Tenant' : 'Land lord'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {otherParty?.email && (
                      <a 
                        href={`mailto:${otherParty.email}`}
                        className="flex items-center p-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition rounded-lg border border-gray-200 hover:border-primary-300"
                      >
                        <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center mr-2 flex-shrink-0">
                          <FiMail className="text-gray-600 text-xs" />
                        </div>
                        <span className="text-xs font-medium truncate">{otherParty.email}</span>
                      </a>
                    )}
                    {otherParty?.phone && (
                      <a 
                        href={`tel:${otherParty.phone}`}
                        className="flex items-center p-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition rounded-lg border border-gray-200 hover:border-primary-300"
                      >
                        <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center mr-2 flex-shrink-0">
                          <FiPhone className="text-gray-600 text-xs" />
                        </div>
                        <span className="text-xs font-medium">{otherParty.phone}</span>
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/messages')}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-lg hover:from-primary-700 hover:to-blue-700 transition-all font-semibold shadow-sm text-sm"
                  >
                    Send Message
                  </button>
                </div>

                {/* Lease Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Lease Summary</h2>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600 text-xs font-medium">Lease ID</span>
                      <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-200">
                        {lease._id?.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600 text-xs font-medium">Created On</span>
                      <span className="font-semibold text-gray-900 text-xs">
                        {new Date(lease.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600 text-xs font-medium">Last Updated</span>
                      <span className="font-semibold text-gray-900 text-xs">
                        {new Date(lease.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Sign Lease Agreement</h3>
              <button 
                onClick={() => setShowSignModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5">
              <div className="flex items-start">
                <FiAlertCircle className="text-blue-500 mt-0.5 mr-2.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Electronic Signature Agreement</p>
                  <p className="text-xs">By clicking "Sign Lease", you agree to electronically sign this lease agreement. This signature will be legally binding.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowSignModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition order-2 sm:order-1"
                disabled={signing}
              >
                Cancel
              </button>
              <button
                onClick={initiateSigning}
                disabled={signing}
                className="w-full sm:w-auto px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center justify-center disabled:opacity-50 order-1 sm:order-2"
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
