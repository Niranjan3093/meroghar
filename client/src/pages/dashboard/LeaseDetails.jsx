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
      <div className="flex min-h-screen w-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!lease) return null

  const canSign = lease.status === 'pending' && !hasUserSigned()
  const canRenew = (lease.status === 'active' || lease.displayStatus === 'expiring') && !lease.renewalRequested
  const isDocuSignSignedFile = contractPreviewType.includes('application/pdf')

  return (
    <div className="min-h-screen w-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/leases')}
          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <FiArrowLeft className="mr-2" /> Back to Leases
        </button>
      </div>

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="h-24 w-32 overflow-hidden rounded-xl bg-gray-100">
              {lease.property?.images?.[0]?.url || lease.property?.images?.[0] ? (
                <img
                  src={lease.property?.images?.[0]?.url || lease.property?.images?.[0]}
                  alt={lease.property?.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FiHome className="text-2xl text-gray-400" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="line-clamp-2 text-xl font-bold text-gray-900">{lease.property?.title || 'Lease Details'}</h1>
              <p className="mt-1 flex items-center text-sm text-gray-500">
                <FiMapPin className="mr-1.5" />
                <span className="line-clamp-1">{lease.property?.address?.street}, {lease.property?.address?.city}</span>
              </p>
              <div className="mt-3">{statusBadge(lease.displayStatus || lease.status)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:min-w-[260px]">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Monthly Rent</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">NPR {(lease.monthlyRent || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Days Remaining</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{lease.daysRemaining}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Lease Timeline</h2>
          <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-primary-600" style={{ width: `${leaseProgress}%` }}></div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{new Date(lease.startDate).toLocaleDateString()}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">End Date</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{new Date(lease.endDate).toLocaleDateString()}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Duration</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 24 * 30))} months</p>
            </div>
          </div>

          {lease.displayStatus === 'expiring' && (
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
              Lease is expiring soon. Consider requesting renewal.
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions</h2>
            <div className="space-y-2.5">
              {canSign && (
                <button
                  onClick={() => setShowSignModal(true)}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
                >
                  <FiPenTool className="mr-1.5" /> Sign Lease
                </button>
              )}

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                <FiDownload className="mr-1.5" /> {downloading ? 'Downloading...' : 'Download Contract'}
              </button>

              <button
                onClick={syncDocuSignStatus}
                disabled={syncing}
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                <FiRefreshCw className="mr-1.5" /> {syncing ? 'Syncing...' : 'Refresh Signature Status'}
              </button>

              {canRenew && (
                <button
                  onClick={requestRenewal}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FiRefreshCw className="mr-1.5" /> Request Renewal
                </button>
              )}

              {lease.renewalRequested && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                  Renewal request already submitted.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Signature Status</h2>
            <div className="space-y-3 text-sm">
              <div className={`rounded-lg border p-3 ${lease.hostSignature?.signed ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-xs text-gray-500">Host Signature</p>
                <p className="mt-1 font-semibold text-gray-900">{lease.host?.name}</p>
                <p className="mt-1 text-xs text-gray-600">{lease.hostSignature?.signed ? `Signed on ${new Date(lease.hostSignature.signedAt).toLocaleDateString()}` : 'Awaiting signature'}</p>
              </div>
              <div className={`rounded-lg border p-3 ${lease.tenantSignature?.signed ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <p className="text-xs text-gray-500">Tenant Signature</p>
                <p className="mt-1 font-semibold text-gray-900">{lease.tenant?.name}</p>
                <p className="mt-1 text-xs text-gray-600">{lease.tenantSignature?.signed ? `Signed on ${new Date(lease.tenantSignature.signedAt).toLocaleDateString()}` : 'Awaiting signature'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{user?.role === 'host' ? 'Tenant Contact' : 'Host Contact'}</h2>
            <div className="mb-4 flex items-center gap-3">
              <UserAvatar name={user?.role === 'host' ? lease.tenant?.name : lease.host?.name} avatar={user?.role === 'host' ? lease.tenant?.avatar : lease.host?.avatar} size="md" />
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-semibold text-gray-900">{user?.role === 'host' ? lease.tenant?.name : lease.host?.name}</p>
                <p className="line-clamp-1 text-xs text-gray-500">{otherParty?.email || 'No email available'}</p>
              </div>
            </div>

            <div className="space-y-2">
              {otherParty?.email && (
                <a href={`mailto:${otherParty.email}`} className="flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <FiMail className="mr-2" /> {otherParty.email}
                </a>
              )}
              {otherParty?.phone && (
                <a href={`tel:${otherParty.phone}`} className="flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <FiPhone className="mr-2" /> {otherParty.phone}
                </a>
              )}
              <button
                onClick={() => navigate('/dashboard/messages')}
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FiMessageSquare className="mr-1.5" /> Open Messages
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lease Contract</h2>
            <p className="text-xs text-gray-500">
              {isDocuSignSignedFile
                ? 'Showing signed DocuSign document with signatures.'
                : 'Showing current lease contract preview.'}
            </p>
          </div>
          <button
            onClick={() => setShowContractFullscreen(true)}
            disabled={!contractPreviewUrl}
            className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <FiExternalLink className="mr-1.5" /> Full Screen Contract
          </button>
        </div>

        <div className="h-[78vh] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {contractLoading ? (
            <div className="flex h-full items-center justify-center text-gray-500">Loading contract...</div>
          ) : contractPreviewUrl ? (
            <iframe title="Lease Contract" src={contractPreviewUrl} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">Contract preview is unavailable.</div>
          )}
        </div>
      </div>

      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <div className="mb-4 flex items-start gap-2">
              <FiAlertCircle className="mt-0.5 text-blue-600" />
              <div>
                <h3 className="text-base font-semibold text-gray-900">Sign lease agreement</h3>
                <p className="mt-1 text-sm text-gray-600">Proceed with secure signing. If DocuSign is unavailable, local e-sign will be used.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSignModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={initiateSigning}
                disabled={signing}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {signing ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showContractFullscreen && (
        <div className="fixed inset-0 z-[60] bg-black/70">
          <div className="flex h-full w-full flex-col bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Lease Contract - Full Screen</h3>
                <p className="text-xs text-gray-500">
                  {isDocuSignSignedFile
                    ? 'Signed DocuSign contract with signatures.'
                    : 'Contract preview'}
                </p>
              </div>
              <button
                onClick={() => setShowContractFullscreen(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-2">
              {contractPreviewUrl ? (
                <iframe title="Full Screen Lease Contract" src={contractPreviewUrl} className="h-full w-full rounded border border-gray-300 bg-white" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">Contract preview is unavailable.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaseDetails
