import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiHome,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPenTool,
  FiPhone,
  FiRefreshCw,
  FiX
} from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import { leasesAPI } from '../../utils/api'
import UserAvatar from '../../components/UserAvatar'

const getDisplayStatus = (lease) => {
  const endDate = new Date(lease.endDate)
  const today = new Date()
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))

  if (lease.status === 'active' && daysRemaining <= 30 && daysRemaining > 0) {
    return { status: 'expiring', daysRemaining }
  }

  if (lease.status === 'active' && daysRemaining <= 0) {
    return { status: 'expired', daysRemaining }
  }

  return { status: lease.status, daysRemaining }
}

const statusBadge = (status) => {
  if (status === 'active') {
    return <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"><FiCheckCircle className="mr-1" />Active</span>
  }

  if (status === 'pending') {
    return <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"><FiClock className="mr-1" />Pending Signatures</span>
  }

  if (status === 'expiring') {
    return <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700"><FiClock className="mr-1" />Expiring Soon</span>
  }

  if (status === 'expired' || status === 'terminated') {
    return <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"><FiX className="mr-1" />{status === 'terminated' ? 'Terminated' : 'Expired'}</span>
  }

  return <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{status}</span>
}

function LeaseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()

  const [lease, setLease] = useState(null)
  const [loading, setLoading] = useState(true)

  const [contractPreviewUrl, setContractPreviewUrl] = useState('')
  const [contractPreviewType, setContractPreviewType] = useState('')
  const [contractLoading, setContractLoading] = useState(false)
  const [showContractFullscreen, setShowContractFullscreen] = useState(false)

  const [showSignModal, setShowSignModal] = useState(false)
  const [signing, setSigning] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchLease()
  }, [id])

  useEffect(() => {
    return () => {
      if (contractPreviewUrl) {
        window.URL.revokeObjectURL(contractPreviewUrl)
      }
    }
  }, [contractPreviewUrl])

  useEffect(() => {
    const signing = searchParams.get('signing')
    if (!signing) return

    if (signing === 'complete') {
      syncDocuSignStatus()
    } else {
      fetchLease()
    }

    navigate(`/dashboard/leases/${id}`, { replace: true })
  }, [searchParams])

  const loadContractPreview = async () => {
    try {
      setContractLoading(true)

      const response = await leasesAPI.download(id)
      const contentType = response.headers?.['content-type'] || 'application/octet-stream'
      const blob = new Blob([response.data], { type: contentType })
      const objectUrl = window.URL.createObjectURL(blob)

      setContractPreviewUrl((prev) => {
        if (prev) {
          window.URL.revokeObjectURL(prev)
        }
        return objectUrl
      })
      setContractPreviewType(contentType)
    } catch (error) {
      console.error('Failed to load contract preview:', error)
      setContractPreviewUrl('')
      setContractPreviewType('')
    } finally {
      setContractLoading(false)
    }
  }

  const fetchLease = async () => {
    try {
      setLoading(true)
      const response = await leasesAPI.getById(id)
      const rawLease = response.data.data
      const derived = getDisplayStatus(rawLease)

      setLease({
        ...rawLease,
        displayStatus: derived.status,
        daysRemaining: derived.daysRemaining
      })

      await loadContractPreview()
    } catch (error) {
      console.error('Failed to fetch lease:', error)
      toast.error('Failed to load lease details')
      navigate('/dashboard/leases')
    } finally {
      setLoading(false)
    }
  }

  const syncDocuSignStatus = async () => {
    try {
      setSyncing(true)
      toast.info('Syncing signature status...')
      const response = await leasesAPI.syncDocuSign(id)

      if (response.data.success) {
        toast.success('Signature status synced')
      }

      await fetchLease()
    } catch (error) {
      console.error('Failed to sync DocuSign status:', error)
      toast.error('Failed to sync signing status')
      await fetchLease()
    } finally {
      setSyncing(false)
    }
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const response = await leasesAPI.download(id)

      const blob = new Blob([response.data], {
        type: response.headers?.['content-type'] || 'application/octet-stream'
      })

      const url = window.URL.createObjectURL(blob)
      const extension = (response.headers?.['content-type'] || '').includes('pdf') ? 'pdf' : 'html'

      const a = document.createElement('a')
      a.href = url
      a.download = `lease-agreement-${id}.${extension}`
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
        const statusResponse = await leasesAPI.getDocuSignStatus(id)
        envelope = statusResponse.data.data
      } catch {
        const createResponse = await leasesAPI.createEnvelope(id)
        envelope = createResponse.data.data
        if (createResponse.data.message) {
          toast.info(createResponse.data.message)
        }
      }

      if (envelope.useLocalSigning) {
        await performLocalSign()
        return
      }

      const signingUrlResponse = await leasesAPI.getSigningUrl(id)
      if (signingUrlResponse.data.data.signingUrl) {
        window.location.href = signingUrlResponse.data.data.signingUrl
        return
      }

      if (signingUrlResponse.data.data.useLocalSigning) {
        await performLocalSign()
      }
    } catch (error) {
      console.error('Failed to initiate signing:', error)
      toast.error(error.response?.data?.message || 'Failed to start signing')
    } finally {
      setSigning(false)
    }
  }

  const performLocalSign = async () => {
    try {
      const signature = `Signed electronically by ${user?.name || 'User'} on ${new Date().toLocaleString()}`
      const response = await leasesAPI.sign(id, signature)

      toast.success(response.data.message || 'Lease signed successfully')
      setShowSignModal(false)
      await fetchLease()
    } catch (error) {
      console.error('Failed to sign lease:', error)
      toast.error(error.response?.data?.message || 'Failed to sign lease')
    }
  }

  const requestRenewal = async () => {
    try {
      await leasesAPI.requestRenewal(id)
      toast.success('Renewal request submitted successfully')
      await fetchLease()
    } catch (error) {
      console.error('Failed to request renewal:', error)
      toast.error(error.response?.data?.message || 'Failed to request renewal')
    }
  }

  const hasUserSigned = () => {
    if (!lease) return false
    if (user?.role === 'host') return Boolean(lease.hostSignature?.signed)
    return Boolean(lease.tenantSignature?.signed)
  }

  const otherParty = useMemo(() => {
    if (!lease) return null
    return user?.role === 'host' ? lease.tenant : lease.host
  }, [lease, user])

  const leaseProgress = useMemo(() => {
    if (!lease) return 0

    const startTime = new Date(lease.startDate).getTime()
    const endTime = new Date(lease.endDate).getTime()
    const now = Date.now()
    const total = endTime - startTime
    const elapsed = now - startTime

    if (total <= 0) return 0
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)))
  }, [lease])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lease details...</p>
        </div>
      </div>
    )
  }

  if (!lease) return null

  const canSign = lease.status === 'pending' && !hasUserSigned()
  const canRenew = (lease.status === 'active' || lease.displayStatus === 'expiring') && !lease.renewalRequested
  const isDocuSignSignedFile = contractPreviewType.includes('application/pdf')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard/leases')}
          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm mb-6"
        >
          <FiArrowLeft size={18} /> Back to Leases
        </button>

        {/* Main Container */}
        <div className="space-y-4">
          {/* Header Card */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex gap-4">
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {lease.property?.images?.[0]?.url || lease.property?.images?.[0] ? (
                    <img
                      src={lease.property?.images?.[0]?.url || lease.property?.images?.[0]}
                      alt={lease.property?.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FiHome className="text-3xl text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{lease.property?.title}</h1>
                  <p className="text-gray-600 flex items-center gap-1 mb-3">
                    <FiMapPin size={16} />
                    {lease.property?.address?.street}, {lease.property?.address?.city}
                  </p>
                  <div>{statusBadge(lease.displayStatus || lease.status)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 lg:min-w-fit">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
                  <p className="text-xs font-semibold text-primary-700 mb-1">Monthly Rent</p>
                  <p className="text-2xl font-bold text-primary-900">NPR {(lease.monthlyRent || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <p className="text-xs font-semibold text-orange-700 mb-1">Days Left</p>
                  <p className="text-2xl font-bold text-orange-900">{lease.daysRemaining}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Timeline */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">📅 Lease Timeline</h3>
                <div className="mb-4 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full" style={{ width: `${leaseProgress}%` }}></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Start Date</p>
                    <p className="font-semibold text-gray-900">{new Date(lease.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">End Date</p>
                    <p className="font-semibold text-gray-900">{new Date(lease.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Duration</p>
                    <p className="font-semibold text-gray-900">{Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 24 * 30))} months</p>
                  </div>
                </div>
                {lease.displayStatus === 'expiring' && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                    ⚠️ Lease expiring soon! Consider requesting renewal.
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">✍️ Signature Status</h3>
                <div className="space-y-3">
                  <div className={`rounded-lg border-2 p-4 transition ${lease.hostSignature?.signed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600">Host</p>
                        <p className="font-semibold text-gray-900 mt-1">{lease.host?.name}</p>
                      </div>
                      {lease.hostSignature?.signed && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          <FiCheckCircle size={14} /> Signed
                        </span>
                      )}
                    </div>
                    {lease.hostSignature?.signed && (
                      <p className="text-xs text-gray-600 mt-2">Signed on {new Date(lease.hostSignature.signedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  
                  <div className={`rounded-lg border-2 p-4 transition ${lease.tenantSignature?.signed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600">Tenant</p>
                        <p className="font-semibold text-gray-900 mt-1">{lease.tenant?.name}</p>
                      </div>
                      {lease.tenantSignature?.signed && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          <FiCheckCircle size={14} /> Signed
                        </span>
                      )}
                    </div>
                    {lease.tenantSignature?.signed && (
                      <p className="text-xs text-gray-600 mt-2">Signed on {new Date(lease.tenantSignature.signedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contract Preview - Direct Button */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">📄 Lease Contract</h3>
                  <p className="text-xs text-gray-600">
                    {isDocuSignSignedFile ? 'Signed' : 'Ready to review'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowContractFullscreen(true)}
                    disabled={!contractPreviewUrl}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FiExternalLink size={16} /> Preview Contract
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="px-4 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <FiDownload size={16} /> Download
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">⚡ Actions</h3>
                <div className="space-y-2.5">
                  {canSign && (
                    <button
                      onClick={() => setShowSignModal(true)}
                      className="w-full px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2"
                    >
                      <FiPenTool size={16} /> Sign Lease
                    </button>
                  )}
                  <button
                    onClick={syncDocuSignStatus}
                    disabled={syncing}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <FiRefreshCw className={syncing ? 'animate-spin' : ''} size={16} /> Refresh
                  </button>
                  {canRenew && (
                    <button
                      onClick={requestRenewal}
                      className="w-full px-4 py-2.5 border-2 border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
                    >
                      <FiRefreshCw size={16} /> Request Renewal
                    </button>
                  )}
                  {lease.renewalRequested && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 text-center font-medium">
                      Renewal requested
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Card */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">👤 {user?.role === 'host' ? 'Tenant' : 'Host'}</h3>
                <div className="mb-4 flex items-center gap-3">
                  <UserAvatar 
                    name={user?.role === 'host' ? lease.tenant?.name : lease.host?.name} 
                    avatar={user?.role === 'host' ? lease.tenant?.avatar : lease.host?.avatar} 
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{user?.role === 'host' ? lease.tenant?.name : lease.host?.name}</p>
                    <p className="text-xs text-gray-600">{otherParty?.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {otherParty?.email && (
                    <a 
                      href={`mailto:${otherParty.email}`} 
                      className="flex items-center gap-2 px-3 py-2.5 border-2 border-primary-100 text-primary-600 rounded-lg hover:bg-primary-50 transition text-sm font-medium"
                    >
                      <FiMail size={16} /> Email
                    </a>
                  )}
                  {otherParty?.phone && (
                    <a 
                      href={`tel:${otherParty.phone}`} 
                      className="flex items-center gap-2 px-3 py-2.5 border-2 border-primary-100 text-primary-600 rounded-lg hover:bg-primary-50 transition text-sm font-medium"
                    >
                      <FiPhone size={16} /> Call
                    </a>
                  )}
                  <button
                    onClick={() => navigate('/dashboard/messages')}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2 text-sm"
                  >
                    <FiMessageSquare size={16} /> Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FiAlertCircle className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sign Lease Agreement</h3>
                  <p className="text-sm text-gray-600 mt-1">Proceed with secure electronic signing.</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                If DocuSign is unavailable, local e-signature will be used. You can sign with your name.
              </p>
            </div>

            <div className="flex gap-2 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowSignModal(false)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={initiateSigning}
                disabled={signing}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {signing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiPenTool size={16} /> Continue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Contract Modal */}
      {showContractFullscreen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Lease Contract</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isDocuSignSignedFile ? 'Signed contract with all signatures' : 'Contract preview'}
                </p>
              </div>
              <button
                onClick={() => setShowContractFullscreen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX size={24} className="text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              {contractPreviewUrl ? (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
                  <iframe title="Full Screen Lease Contract" src={contractPreviewUrl} className="h-full w-full border-0" />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-gray-600">
                    <FiFileText size={48} className="mx-auto mb-2 opacity-30" />
                    <p>Contract preview unavailable</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaseDetails
