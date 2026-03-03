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

  const leaseProgress = Math.max(0, Math.min(100, Math.round((1 - getDaysRemaining() / Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 24))) * 100)))

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard/leases')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors font-medium text-sm"
        >
          <FiArrowLeft className="mr-2" /> Back to Leases
        </button>

        {/* Property Header - Image + Title */}
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Property Image */}
          <div className="w-full sm:w-44 md:w-48 h-36 sm:h-40 flex-shrink-0 rounded-xl overflow-hidden shadow-md">
            {lease.property?.images?.[0]?.url || lease.property?.images?.[0] ? (
              <img
                src={lease.property?.images?.[0]?.url || lease.property?.images?.[0]}
                alt={lease.property?.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300">
                <div className="text-center p-4">
                  <FiFileText className="text-gray-400 text-4xl mx-auto mb-2" />
                  <p className="text-gray-500 font-medium text-sm">No Image</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Property Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
              {lease.property?.title}
            </h1>
            <p className="text-gray-600 flex items-center text-sm mb-3">
              <FiMapPin className="mr-1.5 flex-shrink-0" />
              <span>{lease.property?.address?.street}, {lease.property?.address?.city}</span>
            </p>
            {getStatusBadge(lease.status)}
          </div>
        </div>
        
        {/* Financial Stats - Full width below image */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-3 border border-primary-200">
            <p className="text-[10px] font-semibold text-primary-700 uppercase tracking-wide mb-1">Monthly Rent</p>
            <p className="text-sm md:text-base font-bold text-primary-900">
              NPR {lease.monthlyRent?.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1">Security Deposit</p>
            <p className="text-sm md:text-base font-bold text-gray-900">
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

      {/* Main Content Container */}
      <div className="bg-gray-50 px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="xl:col-span-2 space-y-6 min-w-0">
            {/* Lease Term Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-5 flex items-center">
                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center mr-3">
                  <FiCalendar className="text-primary-600 text-lg" />
                </div>
                Lease Timeline
              </h2>
              
              {/* Progress Bar */}
              <div className="mb-6">
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

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <p className="text-[10px] text-blue-700 uppercase tracking-wide mb-1 font-semibold">Start Date</p>
                  <p className="font-bold text-base text-blue-900">
                    {new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <p className="text-[10px] text-green-700 uppercase tracking-wide mb-1 font-semibold">End Date</p>
                  <p className="font-bold text-base text-green-900">
                    {new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className={`rounded-lg p-4 border ${isExpiringSoon ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300' : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300'}`}>
                  <p className={`text-[10px] uppercase tracking-wide mb-1 font-semibold ${isExpiringSoon ? 'text-orange-700' : 'text-emerald-700'}`}>Days Remaining</p>
                  <p className={`font-bold text-xl ${isExpiringSoon ? 'text-orange-900' : 'text-emerald-900'}`}>
                    {getDaysRemaining()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <p className="text-[10px] text-purple-700 uppercase tracking-wide mb-1 font-semibold">Duration</p>
                  <p className="font-bold text-base text-purple-900">
                    {Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 24 * 30))} months
                  </p>
                </div>
              </div>

              {isExpiringSoon && (
                <div className="mt-5 p-4 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg flex items-start">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <FiAlertCircle className="text-orange-600 text-lg" />
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-5 flex items-center">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                  <FiPenTool className="text-green-600 text-lg" />
                </div>
                Signature Status
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Host Signature */}
                <div className={`p-5 rounded-xl border transition-all ${lease.hostSignature?.signed ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${lease.hostSignature?.signed ? 'bg-green-100' : 'bg-gray-200'}`}>
                      <FiUser className={`text-xl ${lease.hostSignature?.signed ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 truncate">Host/Landlord</p>
                      <p className="text-sm text-gray-600 truncate">{lease.host?.name}</p>
                    </div>
                  </div>
                  {lease.hostSignature?.signed ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-center w-full p-2.5 bg-green-100 rounded-lg">
                        <FiCheckCircle className="text-green-600 mr-2" />
                        <span className="text-green-700 font-bold text-sm">Successfully Signed</span>
                      </div>
                      <p className="text-[11px] text-center text-gray-500">
                        {new Date(lease.hostSignature.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full p-2.5 bg-gray-100 rounded-lg">
                      <FiClock className="text-gray-500 mr-2" />
                      <span className="text-gray-600 font-semibold text-sm">Awaiting Signature</span>
                    </div>
                  )}
                </div>

                {/* Tenant Signature */}
                <div className={`p-5 rounded-xl border transition-all ${lease.tenantSignature?.signed ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${lease.tenantSignature?.signed ? 'bg-green-100' : 'bg-gray-200'}`}>
                      <FiUser className={`text-xl ${lease.tenantSignature?.signed ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 truncate">Tenant</p>
                      <p className="text-sm text-gray-600 truncate">{lease.tenant?.name}</p>
                    </div>
                  </div>
                  {lease.tenantSignature?.signed ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-center w-full p-2.5 bg-green-100 rounded-lg">
                        <FiCheckCircle className="text-green-600 mr-2" />
                        <span className="text-green-700 font-bold text-sm">Successfully Signed</span>
                      </div>
                      <p className="text-[11px] text-center text-gray-500">
                        {new Date(lease.tenantSignature.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full p-2.5 bg-gray-100 rounded-lg">
                      <FiClock className="text-gray-500 mr-2" />
                      <span className="text-gray-600 font-semibold text-sm">Awaiting Signature</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contract Preview */}
            {contractHtml && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                      <FiFileText className="text-blue-600 text-lg" />
                    </div>
                    Lease Agreement Document
                  </h2>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition flex items-center shadow-sm disabled:opacity-50"
                  >
                    <FiDownload className="mr-2" /> {downloading ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
                <div className="p-6 max-h-[500px] lg:max-h-[700px] overflow-auto bg-gray-50">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div 
                      className="prose prose-sm lg:prose-base max-w-none"
                      dangerouslySetInnerHTML={{ __html: contractHtml }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className="xl:col-span-1 space-y-6 min-w-0">
            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center mr-3">
                  <FiCheckCircle className="text-primary-600 text-lg" />
                </div>
                Quick Actions
              </h2>
              <div className="space-y-3">
                {lease.status === 'pending' && !hasUserSigned() && (
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="w-full px-5 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center font-bold shadow-md hover:shadow-lg text-sm"
                  >
                    <FiPenTool className="mr-2" /> Sign Lease Agreement
                  </button>
                )}
                
                {lease.status === 'pending' && hasUserSigned() && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg text-center">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2.5">
                      <FiCheckCircle className="text-2xl text-blue-600" />
                    </div>
                    <p className="font-bold text-blue-900 mb-0.5">You've Signed!</p>
                    <p className="text-xs text-blue-700">Waiting for other party to sign</p>
                  </div>
                )}

                {(lease.status === 'active' || isExpiringSoon) && !lease.renewalRequested && (
                  <button
                    onClick={handleRenewal}
                    className="w-full px-5 py-3.5 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-lg hover:from-primary-700 hover:to-blue-700 transition-all flex items-center justify-center font-bold shadow-md hover:shadow-lg text-sm"
                  >
                    <FiRefreshCw className="mr-2" /> Request Renewal
                  </button>
                )}

                {lease.renewalRequested && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg text-center">
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2.5">
                      <FiRefreshCw className="text-2xl text-purple-600" />
                    </div>
                    <p className="font-bold text-purple-900 mb-0.5">Renewal Requested</p>
                    <p className="text-xs text-purple-700">Waiting for host response</p>
                  </div>
                )}

                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full px-5 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center font-semibold border border-gray-200 hover:border-gray-300 text-sm"
                >
                  <FiDownload className="mr-2" /> {downloading ? 'Downloading...' : 'Download Contract'}
                </button>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {user?.role === 'host' ? 'Tenant Contact' : 'Landlord Contact'}
              </h2>
              <div className="flex flex-col items-center mb-5 pb-5 border-b border-gray-200">
                <UserAvatar 
                  name={otherParty?.name}
                  avatar={otherParty?.avatar}
                  size="xl"
                  className="flex-shrink-0 shadow-md mb-3 border-2 border-gray-100"
                />
                <div className="text-center">
                  <p className="font-bold text-gray-900 mb-1">{otherParty?.name}</p>
                  <p className="text-xs text-gray-500 capitalize px-2.5 py-0.5 bg-gray-100 rounded-full inline-block">
                    {user?.role === 'host' ? 'Tenant' : 'Landlord'}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {otherParty?.email && (
                  <a 
                    href={`mailto:${otherParty.email}`}
                    className="flex items-center p-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition rounded-lg border border-gray-200 hover:border-primary-300"
                  >
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center mr-2.5 flex-shrink-0">
                      <FiMail className="text-gray-600 text-sm" />
                    </div>
                    <span className="text-xs font-medium truncate">{otherParty.email}</span>
                  </a>
                )}
                {otherParty?.phone && (
                  <a 
                    href={`tel:${otherParty.phone}`}
                    className="flex items-center p-2.5 text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition rounded-lg border border-gray-200 hover:border-primary-300"
                  >
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center mr-2.5 flex-shrink-0">
                      <FiPhone className="text-gray-600 text-sm" />
                    </div>
                    <span className="text-xs font-medium break-words">{otherParty.phone}</span>
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
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Lease Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-gray-200">
                  <span className="text-gray-600 text-xs font-medium">Lease ID</span>
                  <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md border border-primary-200">
                    {lease._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-200">
                  <span className="text-gray-600 text-xs font-medium">Created On</span>
                  <span className="font-semibold text-gray-900 text-xs">
                    {new Date(lease.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
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

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Sign Lease Agreement</h3>
              <button 
                onClick={() => setShowSignModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start">
                <FiAlertCircle className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Electronic Signature Agreement</p>
                  <p>By clicking "Sign Lease", you agree to electronically sign this lease agreement. This signature will be legally binding.</p>
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
