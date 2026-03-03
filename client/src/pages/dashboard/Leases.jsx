import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { leasesAPI } from '../../utils/api'
import { toast } from 'react-toastify'
import UserAvatar from '../../components/UserAvatar'
import { FiFileText, FiCalendar, FiHome, FiUser, FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle, FiDownload, FiEye, FiEdit, FiRefreshCw, FiX, FiFilter, FiPenTool, FiExternalLink } from 'react-icons/fi'

function Leases() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [leases, setLeases] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedLease, setSelectedLease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [contractHtml, setContractHtml] = useState('')
  const [signatureStatus, setSignatureStatus] = useState(null)
  const [signing, setSigning] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [localSignContract, setLocalSignContract] = useState('')
  const [signatureInput, setSignatureInput] = useState('')
  const [signingMode, setSigningMode] = useState(null) // 'docusign' or 'local'
  const [signStep, setSignStep] = useState(1) // 1 = review contract, 2 = enter signature

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
      // Remove the query param
      navigate(window.location.pathname, { replace: true })
    }
  }, [user, searchParams])

  const syncDocuSignStatus = async (leaseId) => {
    try {
      toast.info('Syncing signature status...')
      const response = await leasesAPI.syncDocuSign(leaseId)
      
      if (response.data.success) {
        // Refresh the leases list
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
    }
  }

  const fetchLeases = async () => {
    try {
      setLoading(true)
      const response = await leasesAPI.getAll()
      const leasesData = response.data.data || []
      
      // Check for expiring leases (within 30 days)
      const processedLeases = leasesData.map(lease => {
        const endDate = new Date(lease.endDate)
        const today = new Date()
        const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
        
        let status = lease.status
        if (status === 'active' && daysUntilEnd <= 30 && daysUntilEnd > 0) {
          status = 'expiring'
        } else if (daysUntilEnd <= 0 && status === 'active') {
          status = 'expired'
        }
        
        return { ...lease, displayStatus: status }
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

  const filteredLeases = filter === 'all' ? leases : leases.filter(l => l.displayStatus === filter)

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate)
    const today = new Date()
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  // Handle View Contract
  const handleViewContract = async (lease) => {
    try {
      setSelectedLease(lease)
      const response = await leasesAPI.getContract(lease._id)
      setContractHtml(response.data.data.html)
      setSignatureStatus(response.data.data.signatureStatus)
      setShowViewModal(true)
    } catch (error) {
      console.error('Failed to load contract:', error)
      toast.error('Failed to load contract')
    }
  }

  // Handle Download Contract
  const handleDownload = async (lease) => {
    try {
      setDownloading(true)
      const response = await leasesAPI.download(lease._id)
      
      // Create blob from response
      const blob = new Blob([response.data], { 
        type: response.headers?.['content-type'] || 'text/html' 
      })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lease-agreement-${lease._id}.html`
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

  // Handle Sign Lease
  const handleSignLease = async (lease) => {
    setSelectedLease(lease)
    setSignStep(1)
    setSignatureInput('')
    setSigningMode(null)
    setLocalSignContract('')
    setShowSignModal(true)
  }

  // Initialize DocuSign or local signing
  const initiateSigning = async () => {
    if (!selectedLease) return

    try {
      setSigning(true)

      // First check if envelope exists, if not create one
      let envelope
      try {
        const statusRes = await leasesAPI.getDocuSignStatus(selectedLease._id)
        envelope = statusRes.data.data
      } catch {
        // Create envelope if doesn't exist
        const createRes = await leasesAPI.createEnvelope(selectedLease._id)
        envelope = createRes.data.data
        toast.info(createRes.data.message)
      }

      if (envelope.useLocalSigning) {
        // Use local signing - show contract preview first
        setSigningMode('local')
        try {
          const contractRes = await leasesAPI.getContract(selectedLease._id)
          setLocalSignContract(contractRes.data.data.html)
          setSignStep(2) // Move to contract review step
        } catch (err) {
          toast.error('Failed to load contract for signing')
        }
      } else {
        // Get DocuSign signing URL
        setSigningMode('docusign')
        const urlRes = await leasesAPI.getSigningUrl(selectedLease._id)
        if (urlRes.data.data.signingUrl) {
          // Redirect to DocuSign
          toast.info('Redirecting to DocuSign for secure signing...')
          window.location.href = urlRes.data.data.signingUrl
        } else if (urlRes.data.data.useLocalSigning) {
          // Fallback to local signing
          setSigningMode('local')
          try {
            const contractRes = await leasesAPI.getContract(selectedLease._id)
            setLocalSignContract(contractRes.data.data.html)
            setSignStep(2)
          } catch (err) {
            toast.error('Failed to load contract for signing')
          }
        }
      }
    } catch (error) {
      console.error('Failed to initiate signing:', error)
      toast.error(error.response?.data?.message || 'Failed to initiate signing')
    } finally {
      setSigning(false)
    }
  }

  // Perform local signature
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

  // Handle Renewal
  const handleRenewal = async (lease) => {
    try {
      await leasesAPI.requestRenewal(lease._id)
      toast.success('Renewal request submitted successfully')
      fetchLeases()
    } catch (error) {
      console.error('Failed to request renewal:', error)
      toast.error(error.response?.data?.message || 'Failed to request renewal')
    }
  }

  // Check if current user has signed
  const hasUserSigned = (lease) => {
    if (user?.role === 'host') {
      return lease.hostSignature?.signed
    } else {
      return lease.tenantSignature?.signed
    }
  }

  // Check if waiting for other party
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
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
        
        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
          {['all', 'active', 'pending', 'expiring', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                filter === f
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Leases</p>
              <p className="text-2xl font-bold text-gray-900">{leases.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <FiFileText className="text-xl text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{leases.filter(l => l.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheckCircle className="text-xl text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{leases.filter(l => l.status === 'pending').length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FiClock className="text-xl text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-600">{leases.filter(l => l.status === 'expiring').length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiAlertCircle className="text-xl text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Leases List */}
      <div className="space-y-4">
        {filteredLeases.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <FiFileText className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leases found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'You don\'t have any lease agreements yet.'
                : `No ${filter} leases found.`
              }
            </p>
          </div>
        ) : (
          filteredLeases.map((lease) => (
            <div key={lease._id} className="bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Property Image */}
                  <div className="w-full lg:w-40 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={lease.property?.images?.[0]?.url || lease.property?.images?.[0] || 'https://via.placeholder.com/200x150?text=Property'} 
                      alt={lease.property?.title || 'Property'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  {/* Lease Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{lease.property?.title || 'Property'}</h3>
                          {getStatusBadge(lease.displayStatus || lease.status)}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center">
                          <FiHome className="mr-1" /> {lease.property?.address?.city || 'Address not available'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">NPR {(lease.monthlyRent || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-500">per month</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {user?.role === 'host' ? 'Tenant' : 'Landlord'}
                        </p>
                        <div className="flex items-center">
                          <UserAvatar 
                            name={user?.role === 'host' ? (lease.tenant?.name || 'Tenant') : (lease.host?.name || 'Landlord')} 
                            avatar={user?.role === 'host' ? lease.tenant?.avatar : lease.host?.avatar} 
                            size="xs" 
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {user?.role === 'host' 
                              ? (lease.tenant?.name || 'Tenant') 
                              : (lease.host?.name || 'Landlord')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Start Date</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <FiCalendar className="mr-1 text-gray-400" />
                          {new Date(lease.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">End Date</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <FiCalendar className="mr-1 text-gray-400" />
                          {new Date(lease.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Security Deposit</p>
                        <p className="text-sm font-medium text-gray-900">
                          NPR {(lease.securityDeposit || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
                      <div className="flex items-center gap-4">
                        {lease.displayStatus === 'expiring' && (
                          <p className="text-sm text-orange-600 flex items-center">
                            <FiAlertCircle className="mr-1" />
                            Expires in {getDaysRemaining(lease.endDate)} days
                          </p>
                        )}
                        {lease.displayStatus === 'active' && (
                          <p className="text-sm text-green-600 flex items-center">
                            <FiCheckCircle className="mr-1" />
                            {getDaysRemaining(lease.endDate)} days remaining
                          </p>
                        )}
                        {lease.status === 'pending' && (
                          <div className="text-sm text-yellow-600">
                            {lease.hostSignature?.signed && !lease.tenantSignature?.signed && (
                              <span className="flex items-center"><FiClock className="mr-1" /> Waiting for tenant signature</span>
                            )}
                            {!lease.hostSignature?.signed && lease.tenantSignature?.signed && (
                              <span className="flex items-center"><FiClock className="mr-1" /> Waiting for host signature</span>
                            )}
                            {!lease.hostSignature?.signed && !lease.tenantSignature?.signed && (
                              <span className="flex items-center"><FiClock className="mr-1" /> Awaiting signatures</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/dashboard/leases/${lease._id}`)}
                          className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition flex items-center"
                        >
                          <FiEye className="mr-2" /> Details
                        </button>
                        <button 
                          onClick={() => handleDownload(lease)}
                          disabled={downloading}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center disabled:opacity-50"
                        >
                          <FiDownload className="mr-2" /> {downloading ? 'Downloading...' : 'Download'}
                        </button>
                        <button 
                          onClick={() => handleViewContract(lease)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center"
                        >
                          <FiFileText className="mr-2" /> Contract
                        </button>
                        {lease.displayStatus === 'expiring' && !lease.renewalRequested && (
                          <button 
                            onClick={() => handleRenewal(lease)}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition flex items-center"
                          >
                            <FiRefreshCw className="mr-2" /> Renew
                          </button>
                        )}
                        {lease.renewalRequested && (
                          <span className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-100 rounded-lg flex items-center">
                            <FiRefreshCw className="mr-2" /> Renewal Requested
                          </span>
                        )}
                        {lease.status === 'pending' && !hasUserSigned(lease) && (
                          <button 
                            onClick={() => handleSignLease(lease)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center"
                          >
                            <FiPenTool className="mr-2" /> Sign Lease
                          </button>
                        )}
                        {lease.status === 'pending' && isWaitingForOther(lease) && (
                          <span className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg flex items-center">
                            <FiCheckCircle className="mr-2" /> You've Signed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Contract Modal */}
      {showViewModal && selectedLease && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Lease Agreement</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            {/* Signature Status Bar */}
            {signatureStatus && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${signatureStatus.hostSigned ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className="text-sm">
                      Host: {signatureStatus.hostSigned 
                        ? `Signed on ${new Date(signatureStatus.hostSignedAt).toLocaleDateString()}` 
                        : 'Not signed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${signatureStatus.tenantSigned ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className="text-sm">
                      Tenant: {signatureStatus.tenantSigned 
                        ? `Signed on ${new Date(signatureStatus.tenantSignedAt).toLocaleDateString()}` 
                        : 'Not signed'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-auto p-4">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: contractHtml }}
              />
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => handleDownload(selectedLease)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center"
              >
                <FiDownload className="mr-2" /> Download
              </button>
              {selectedLease.status === 'pending' && !hasUserSigned(selectedLease) && (
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    handleSignLease(selectedLease)
                  }}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center"
                >
                  <FiPenTool className="mr-2" /> Sign This Lease
                </button>
              )}
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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

            {/* Step 1: Initial Info */}
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

            {/* Step 2: Contract Review & Signature (for local signing) */}
            {signStep === 2 && signingMode === 'local' && (
              <>
                {/* Contract Preview */}
                <div className="flex-1 overflow-auto border border-gray-200 rounded-lg mb-6 max-h-[400px]">
                  <div 
                    className="p-4 prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: localSignContract }}
                  />
                </div>

                {/* Signature Input */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <label className="block text-sm font-medium text-yellow-800 mb-2">
                    Type your full name to sign this lease agreement:
                  </label>
                  <input
                    type="text"
                    value={signatureInput}
                    onChange={(e) => setSignatureInput(e.target.value)}
                    placeholder={user?.name || 'Your full legal name'}
                    className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none font-signature text-lg"
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
              
              {/* Step 1: Start Signing Process */}
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
              
              {/* Step 2: Complete Local Signature */}
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
