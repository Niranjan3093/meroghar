import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { leasesAPI } from '../../utils/api'
import { toast } from 'react-toastify'
import UserAvatar from '../../components/UserAvatar'
import PropertyStatusBadge from '../../components/PropertyStatusBadge'
import { 
  FiFileText, FiCalendar, FiHome, FiUser, FiDollarSign, FiClock, 
  FiCheckCircle, FiAlertCircle, FiDownload, FiEye, FiEdit, FiRefreshCw, 
  FiX, FiFilter, FiPenTool, FiExternalLink, FiMapPin, FiPhone, FiMail, 
  FiMessageCircle 
} from 'react-icons/fi'

function Leases() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSignModal, setShowSignModal] = useState(false)
  const [selectedLease, setSelectedLease] = useState(null)
  const [signing, setSigning] = useState(false)
  const [downloading, setDownloading] = useState({})
  const [localSignContract, setLocalSignContract] = useState('')
  const [signatureInput, setSignatureInput] = useState('')
  const [signingMode, setSigningMode] = useState(null)
  const [signStep, setSignStep] = useState(1)
  const [syncing, setSyncing] = useState({})

  useEffect(() => {
    fetchLeases()
    
    // Check if returning from DocuSign
    if (searchParams.get('signing') === 'complete') {
      const leaseId = searchParams.get('leaseId')
      if (leaseId) {
        syncDocuSignStatus(leaseId)
      } else {
        toast.success('Signing process completed!')
      }
      navigate(window.location.pathname, { replace: true })
    }
  }, [user, searchParams])

  const syncDocuSignStatus = async (leaseId) => {
    try {
      setSyncing(prev => ({ ...prev, [leaseId]: true }))
      toast.info('Syncing signature status...')
      const response = await leasesAPI.syncDocuSign(leaseId)
      
      if (response.data.success) {
        fetchLeases()
        
        if (response.data.docusignStatus === 'completed') {
          toast.success('Lease agreement fully signed! Both parties have completed signing.')
        } else if (response.data.synced) {
          toast.success('Signature recorded successfully!')
        } else {
          toast.success('Signing status verified.')
        }
      }
    } catch (error) {
      console.error('Failed to sync DocuSign status:', error)
      toast.error('Failed to sync signing status. Please refresh the page.')
      fetchLeases()
    } finally {
      setSyncing(prev => ({ ...prev, [leaseId]: false }))
    }
  }

  const fetchLeases = async () => {
    try {
      setLoading(true)
      const response = await leasesAPI.getAll()
      const leasesData = response.data.data || []
      
      // Fetch contracts for all leases
      const leasesWithContracts = await Promise.all(
        leasesData.map(async (lease) => {
          try {
            const contractRes = await leasesAPI.getContract(lease._id)
            return {
              ...lease,
              contractHtml: contractRes.data.data.html,
              signatureStatus: contractRes.data.data.signatureStatus
            }
          } catch (error) {
            console.error(`Failed to fetch contract for lease ${lease._id}:`, error)
            return lease
          }
        })
      )
      
      // Process lease statuses
      const processedLeases = leasesWithContracts.map(lease => {
        const endDate = new Date(lease.endDate)
        const today = new Date()
        const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
        
        let status = lease.status
        if (status === 'active' && daysUntilEnd <= 30 && daysUntilEnd > 0) {
          status = 'expiring'
        } else if (daysUntilEnd <= 0 && status === 'active') {
          status = 'expired'
        }
        
        return { ...lease, displayStatus: status, daysRemaining: daysUntilEnd }
      })
      
      setLeases(processedLeases)
    } catch (error) {
      console.error('Failed to fetch leases:', error)
      toast.error('Failed to load leases')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><FiCheckCircle className="mr-1" /> Active</span>
      case 'expiring':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><FiClock className="mr-1" /> Expiring Soon</span>
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><FiClock className="mr-1" /> Pending Signatures</span>
      case 'expired':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><FiX className="mr-1" /> Expired</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const handleDownload = async (leaseId) => {
    try {
      setDownloading(prev => ({ ...prev, [leaseId]: true }))
      const response = await leasesAPI.download(leaseId)
      
      const blob = new Blob([response.data], { 
        type: response.headers?.['content-type'] || 'text/html' 
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lease-agreement-${leaseId}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Contract downloaded successfully')
    } catch (error) {
      console.error('Failed to download contract:', error)
      toast.error('Failed to download contract')
    } finally {
      setDownloading(prev => ({ ...prev, [leaseId]: false }))
    }
  }

  const handleSignLease = async (lease) => {
    setSelectedLease(lease)
    setSignStep(1)
    setSignatureInput('')
    setSigningMode(null)
    setLocalSignContract('')
    setShowSignModal(true)
  }

  const initiateSigning = async () => {
    if (!selectedLease) return

    try {
      setSigning(true)

      let envelope
      try {
        const statusRes = await leasesAPI.getDocuSignStatus(selectedLease._id)
        envelope = statusRes.data.data
      } catch {
        const createRes = await leasesAPI.createEnvelope(selectedLease._id)
        envelope = createRes.data.data
        toast.info(createRes.data.message)
      }

      if (envelope.useLocalSigning) {
        setSigningMode('local')
        setLocalSignContract(selectedLease.contractHtml || '')
        setSignStep(2)
      } else {
        setSigningMode('docusign')
        const urlRes = await leasesAPI.getSigningUrl(selectedLease._id)
        if (urlRes.data.data.signingUrl) {
          toast.info('Redirecting to DocuSign for secure signing...')
          window.location.href = urlRes.data.data.signingUrl
        } else if (urlRes.data.data.useLocalSigning) {
          setSigningMode('local')
          setLocalSignContract(selectedLease.contractHtml || '')
          setSignStep(2)
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
    if (!signatureInput.trim()) {
      toast.error('Please type your full name to sign')
      return
    }
    
    try {
      setSigning(true)
      const signature = `${signatureInput} (Signed electronically on ${new Date().toLocaleString()})`
      const response = await leasesAPI.sign(selectedLease._id, signature)
      
      toast.success(response.data.message)
      setShowSignModal(false)
      setSignatureInput('')
      setSignStep(1)
      setSigningMode(null)
      fetchLeases()
    } catch (error) {
      console.error('Failed to sign lease:', error)
      toast.error(error.response?.data?.message || 'Failed to sign lease')
    } finally {
      setSigning(false)
    }
  }

  const hasUserSigned = (lease) => {
    if (user?.role === 'host') {
      return lease.hostSignature?.signed
    } else {
      return lease.tenantSignature?.signed
    }
  }

  const isWaitingForOther = (lease) => {
    const userSigned = hasUserSigned(lease)
    const otherSigned = user?.role === 'host' 
      ? lease.tenantSignature?.signed 
      : lease.hostSignature?.signed
    return userSigned && !otherSigned
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="px-6 md:px-8 lg:px-12 py-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'host' ? 'Lease Management' : 'My Leases'}
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.role === 'host' 
            ? 'Manage all your property lease agreements'
            : 'View and manage your rental agreements'
          }
        </p>
      </div>

      {/* Alert for unsigned leases */}
      {leases.some(lease => lease.status === 'pending' && !hasUserSigned(lease)) && (
        <div className="mx-6 md:mx-8 lg:mx-12 mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <FiAlertCircle className="text-yellow-600 text-xl mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Action Required: Sign Your Lease Contract</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You have unsigned lease agreement(s). Please review and sign below to activate your lease.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Leases */}
      {leases.length === 0 ? (
        <div className="bg-white p-12 text-center min-h-screen flex flex-col items-center justify-center">
          <FiFileText className="mx-auto text-4xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leases found</h3>
          <p className="text-gray-500">You don't have any lease agreements yet.</p>
        </div>
      ) : (
        /* Leases Details */
        leases.map((lease) => (
          <div key={lease._id} className="bg-white shadow-sm border-b border-gray-100 last:border-b-0">
            {/* Property Header */}
            <div className="relative h-64 md:h-80 lg:h-96 bg-gray-200 overflow-hidden">
              <img 
                src={lease.property?.images?.[0]?.url || lease.property?.images?.[0] || 'https://via.placeholder.com/800x300?text=Property'} 
                alt={lease.property?.title || 'Property'} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-6 left-6 md:left-8 lg:left-12">
                {getStatusBadge(lease.displayStatus || lease.status)}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-6 md:px-8 lg:px-12 py-6 md:py-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white">{lease.property?.title || 'Property'}</h2>
                <p className="text-white/90 flex items-center mt-1">
                  <FiMapPin className="mr-2" />
                  {lease.property?.address?.street}, {lease.property?.address?.city}
                </p>
              </div>
            </div>

            <div className="px-6 md:px-8 lg:px-12 xl:px-16 py-8 md:py-10 lg:py-12 space-y-8">
              {/* Financial Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-primary-50 rounded-lg p-6">
                  <p className="text-sm text-primary-600 mb-1">Monthly Rent</p>
                  <p className="text-2xl font-bold text-primary-900">NPR {(lease.monthlyRent || 0).toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-6">
                  <p className="text-sm text-blue-600 mb-1">Security Deposit</p>
                  <p className="text-2xl font-bold text-blue-900">NPR {(lease.securityDeposit || 0).toLocaleString()}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <p className="text-sm text-green-600 mb-1">Lease Duration</p>
                  <p className="text-2xl font-bold text-green-900">
                    {Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 24 * 30))} months
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-6">
                  <p className="text-sm text-orange-600 mb-1">Days Remaining</p>
                  <p className="text-2xl font-bold text-orange-900">{lease.daysRemaining || 0}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiCalendar className="mr-2" /> Lease Timeline
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="text-xl font-medium text-gray-900">{new Date(lease.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="text-xl font-medium text-gray-900">{new Date(lease.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-base mb-3">
                      <span className="text-gray-600 font-medium">Progress</span>
                      <span className="font-bold text-gray-900 text-lg">
                        {Math.max(0, Math.min(100, Math.round(((new Date() - new Date(lease.startDate)) / (new Date(lease.endDate) - new Date(lease.startDate))) * 100)))}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all ${
                          lease.displayStatus === 'expiring' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                          lease.displayStatus === 'active' ? 'bg-gradient-to-r from-green-500 to-blue-500' :
                          'bg-gray-400'
                        }`}
                        style={{ 
                          width: `${Math.max(0, Math.min(100, Math.round(((new Date() - new Date(lease.startDate)) / (new Date(lease.endDate) - new Date(lease.startDate))) * 100)))}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Status */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className={`rounded-lg p-6 border-2 ${lease.hostSignature?.signed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Host Signature</p>
                      <p className="font-medium text-gray-900">{lease.host?.name || 'Host'}</p>
                    </div>
                    {lease.hostSignature?.signed ? (
                      <FiCheckCircle className="text-2xl text-green-600" />
                    ) : (
                      <FiClock className="text-2xl text-gray-400" />
                    )}
                  </div>
                  {lease.hostSignature?.signed && (
                    <p className="text-xs text-gray-500 mt-2">
                      Signed on {new Date(lease.hostSignature.signedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className={`rounded-lg p-6 border-2 ${lease.tenantSignature?.signed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tenant Signature</p>
                      <p className="font-medium text-gray-900">{lease.tenant?.name || 'Tenant'}</p>
                    </div>
                    {lease.tenantSignature?.signed ? (
                      <FiCheckCircle className="text-2xl text-green-600" />
                    ) : (
                      <FiClock className="text-2xl text-gray-400" />
                    )}
                  </div>
                  {lease.tenantSignature?.signed && (
                    <p className="text-xs text-gray-500 mt-2">
                      Signed on {new Date(lease.tenantSignature.signedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Contract Preview */}
              {lease.contractHtml && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <FiFileText className="mr-2" /> Lease Contract
                    </h3>
                    <button
                      onClick={() => handleDownload(lease._id)}
                      disabled={downloading[lease._id]}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center disabled:opacity-50"
                    >
                      <FiDownload className="mr-1" /> 
                      {downloading[lease._id] ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                  <div className="max-h-[400px] overflow-auto">
                    <div className="p-4">
                      <div 
                        className="prose prose-sm max-w-none text-sm [&_table]:w-full [&_table]:table-auto [&_td]:break-words [&_th]:break-words"
                        dangerouslySetInnerHTML={{ __html: lease.contractHtml }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact & Actions */}
              <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Card */}
                <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <FiUser className="mr-2" /> Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <UserAvatar 
                        name={user?.role === 'host' ? (lease.tenant?.name || 'Tenant') : (lease.host?.name || 'Landlord')} 
                        avatar={user?.role === 'host' ? lease.tenant?.avatar : lease.host?.avatar} 
                        size="md" 
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {user?.role === 'host' ? (lease.tenant?.name || 'Tenant') : (lease.host?.name || 'Landlord')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user?.role === 'host' ? 'Tenant' : 'Landlord'}
                        </p>
                      </div>
                    </div>
                    
                    {(user?.role === 'tenant' ? lease.host : lease.tenant) && (
                      <div className="space-y-2">
                        {(user?.role === 'tenant' ? lease.host?.email : lease.tenant?.email) && (
                          <a 
                            href={`mailto:${user?.role === 'tenant' ? lease.host.email : lease.tenant.email}`}
                            className="flex items-center text-sm text-gray-600 hover:text-primary-600"
                          >
                            <FiMail className="mr-2" /> 
                            {user?.role === 'tenant' ? lease.host.email : lease.tenant.email}
                          </a>
                        )}
                        {(user?.role === 'tenant' ? lease.host?.phone : lease.tenant?.phone) && (
                          <a 
                            href={`tel:${user?.role === 'tenant' ? lease.host.phone : lease.tenant.phone}`}
                            className="flex items-center text-sm text-gray-600 hover:text-primary-600"
                          >
                            <FiPhone className="mr-2" /> 
                            {user?.role === 'tenant' ? lease.host.phone : lease.tenant.phone}
                          </a>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={() => navigate(`/dashboard/messages?userId=${user?.role === 'host' ? lease.tenant?._id : lease.host?._id}`)}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center"
                    >
                      <FiMessageCircle className="mr-2" /> Send Message
                    </button>
                  </div>
                </div>

                {/* Actions & Summary */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Quick Actions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {lease.status === 'pending' && !hasUserSigned(lease) && (
                        <button 
                          onClick={() => handleSignLease(lease)}
                          className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center text-base font-semibold shadow-md hover:shadow-lg"
                        >
                          <FiPenTool className="mr-2" /> Sign Contract Now
                        </button>
                      )}
                      {lease.status === 'pending' && isWaitingForOther(lease) && (
                        <>
                          <span className="px-4 py-2 text-blue-600 bg-blue-100 rounded-lg flex items-center text-sm">
                            <FiCheckCircle className="mr-2" /> You've Signed
                          </span>
                          <button
                            onClick={() => syncDocuSignStatus(lease._id)}
                            disabled={syncing[lease._id]}
                            className="px-4 py-2 text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition flex items-center text-sm disabled:opacity-50"
                          >
                            <FiRefreshCw className={`mr-2 ${syncing[lease._id] ? 'animate-spin' : ''}`} /> 
                            {syncing[lease._id] ? 'Syncing...' : 'Sync Status'}
                          </button>
                        </>
                      )}
                      {lease.displayStatus === 'expiring' && !lease.renewalRequested && (
                        <button 
                          onClick={async () => {
                            try {
                              await leasesAPI.requestRenewal(lease._id)
                              toast.success('Renewal request submitted successfully')
                              fetchLeases()
                            } catch (error) {
                              toast.error(error.response?.data?.message || 'Failed to request renewal')
                            }
                          }}
                          className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition flex items-center text-sm"
                        >
                          <FiRefreshCw className="mr-2" /> Request Renewal
                        </button>
                      )}
                      {lease.renewalRequested && (
                        <span className="px-4 py-2 text-purple-600 bg-purple-100 rounded-lg flex items-center text-sm">
                          <FiRefreshCw className="mr-2" /> Renewal Requested
                        </span>
                      )}
                      <button 
                        onClick={() => navigate('/dashboard/payments')}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center text-sm"
                      >
                        <FiDollarSign className="mr-2" /> View Payments
                      </button>
                      <button 
                        onClick={() => navigate('/dashboard/maintenance')}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center text-sm"
                      >
                        <FiEdit className="mr-2" /> Maintenance
                      </button>
                    </div>
                  </div>

                  {/* Lease Summary */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3">Lease Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600 mb-1">Lease Type</p>
                        <p className="text-blue-900 font-medium capitalize">{lease.property?.type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 mb-1">Payment Frequency</p>
                        <p className="text-blue-900 font-medium">Monthly</p>
                      </div>
                      <div>
                        <p className="text-blue-600 mb-1">Lease ID</p>
                        <p className="text-blue-900 font-mono text-xs">{lease._id}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 mb-1">Created On</p>
                        <p className="text-blue-900 font-medium">{new Date(lease.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Sign Lease Modal */}
      {showSignModal && selectedLease && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-xl w-full ${signStep === 2 ? 'max-w-4xl max-h-[90vh] flex flex-col' : 'max-w-md'} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Sign Lease Agreement</h3>
                {signStep === 2 && signingMode === 'local' && (
                  <p className="text-sm text-gray-500 mt-1">Step 2: Review contract & sign</p>
                )}
              </div>
              <button 
                onClick={() => {
                  setShowSignModal(false)
                  setSignStep(1)
                  setSignatureInput('')
                  setSigningMode(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {signStep === 1 && (
              <>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedLease.property?.title}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Monthly Rent: NPR {selectedLease.monthlyRent?.toLocaleString()}</p>
                    <p>Start Date: {new Date(selectedLease.startDate).toLocaleDateString()}</p>
                    <p>End Date: {new Date(selectedLease.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <FiAlertCircle className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Electronic Signature Process</p>
                      <p>You will be asked to review the complete lease agreement and provide your signature. This signature will be legally binding.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Signature Status:</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Host Signature</span>
                      {selectedLease.hostSignature?.signed ? (
                        <span className="text-green-600 flex items-center text-sm">
                          <FiCheckCircle className="mr-1" /> Signed
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center text-sm">
                          <FiClock className="mr-1" /> Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tenant Signature</span>
                      {selectedLease.tenantSignature?.signed ? (
                        <span className="text-green-600 flex items-center text-sm">
                          <FiCheckCircle className="mr-1" /> Signed
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center text-sm">
                          <FiClock className="mr-1" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {signStep === 2 && signingMode === 'local' && (
              <>
                <div className="flex-1 overflow-auto border border-gray-200 rounded-lg mb-6 max-h-[400px]">
                  <div 
                    className="p-4 prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: localSignContract }}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <label className="block text-sm font-medium text-yellow-800 mb-2">
                    Type your full name to sign this lease agreement:
                  </label>
                  <input
                    type="text"
                    value={signatureInput}
                    onChange={(e) => setSignatureInput(e.target.value)}
                    placeholder={user?.name || 'Your full legal name'}
                    className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none text-lg"
                  />
                  <p className="text-xs text-yellow-700 mt-2">
                    By typing your name and clicking "Complete Signature", you acknowledge that this electronic signature is legally binding.
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              {signStep === 2 && (
                <button
                  onClick={() => {
                    setSignStep(1)
                    setSignatureInput('')
                    setSigningMode(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  disabled={signing}
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  setShowSignModal(false)
                  setSignStep(1)
                  setSignatureInput('')
                  setSigningMode(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                disabled={signing}
              >
                Cancel
              </button>
              
              {signStep === 1 && (
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
                      <FiPenTool className="mr-2" /> Begin Signing
                    </>
                  )}
                </button>
              )}
              
              {signStep === 2 && signingMode === 'local' && (
                <button
                  onClick={performLocalSign}
                  disabled={signing || !signatureInput.trim()}
                  className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="mr-2" /> Complete Signature
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Leases
