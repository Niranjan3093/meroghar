import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiHome,
  FiMapPin,
  FiPenTool,
  FiRefreshCw,
  FiSearch,
  FiX
} from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import { leasesAPI } from '../../utils/api'
import UserAvatar from '../../components/UserAvatar'

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' }
]

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

const leaseStatusPriority = {
  active: 6,
  renewed: 5,
  pending: 4,
  expired: 3,
  terminated: 2,
  archived: 1
}

const pickPreferredLease = (currentLease, candidateLease) => {
  const currentPriority = leaseStatusPriority[currentLease?.status] || 0
  const candidatePriority = leaseStatusPriority[candidateLease?.status] || 0

  if (candidatePriority > currentPriority) {
    return candidateLease
  }

  if (candidatePriority < currentPriority) {
    return currentLease
  }

  const currentCreatedAt = new Date(currentLease?.createdAt || 0).getTime()
  const candidateCreatedAt = new Date(candidateLease?.createdAt || 0).getTime()

  return candidateCreatedAt >= currentCreatedAt ? candidateLease : currentLease
}

const dedupeLeasesByProperty = (leaseList) => {
  const leaseMap = new Map()

  leaseList.forEach((lease) => {
    const propertyId = lease?.property?._id
    if (!propertyId) {
      leaseMap.set(lease._id, lease)
      return
    }

    const existingLease = leaseMap.get(propertyId)
    if (!existingLease) {
      leaseMap.set(propertyId, lease)
      return
    }

    leaseMap.set(propertyId, pickPreferredLease(existingLease, lease))
  })

  return Array.from(leaseMap.values())
}

const getStatusBadge = (status) => {
  if (status === 'active') {
    return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"><FiCheckCircle className="mr-1" />Active</span>
  }

  if (status === 'pending') {
    return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"><FiClock className="mr-1" />Pending</span>
  }

  if (status === 'expiring') {
    return <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700"><FiClock className="mr-1" />Expiring Soon</span>
  }

  if (status === 'expired') {
    return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"><FiX className="mr-1" />Expired</span>
  }

  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{status}</span>
}

function Leases() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()

  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')

  const [showSignModal, setShowSignModal] = useState(false)
  const [selectedLease, setSelectedLease] = useState(null)
  const [signing, setSigning] = useState(false)
  const [signatureInput, setSignatureInput] = useState('')
  const [signStep, setSignStep] = useState(1)

  const [downloading, setDownloading] = useState({})
  const [syncing, setSyncing] = useState({})

  useEffect(() => {
    fetchLeases()
  }, [])

  useEffect(() => {
    const signing = searchParams.get('signing')
    const leaseId = searchParams.get('leaseId')

    if (signing === 'complete' && leaseId) {
      syncDocuSignStatus(leaseId)
      navigate('/dashboard/leases', { replace: true })
    }
  }, [searchParams])

  const fetchLeases = async () => {
    try {
      setLoading(true)
      const response = await leasesAPI.getAll()
      const rawLeases = response.data.data || []
      const uniqueLeases = dedupeLeasesByProperty(rawLeases)

      const withDerived = uniqueLeases.map((lease) => {
        const derived = getDisplayStatus(lease)
        return {
          ...lease,
          displayStatus: derived.status,
          daysRemaining: derived.daysRemaining
        }
      })

      setLeases(withDerived)
    } catch (error) {
      console.error('Failed to fetch leases:', error)
      toast.error('Failed to load leases')
    } finally {
      setLoading(false)
    }
  }

  const hasUserSigned = (lease) => {
    if (user?.role === 'host') {
      return lease.hostSignature?.signed
    }
    return lease.tenantSignature?.signed
  }

  const otherParty = (lease) => {
    if (user?.role === 'host') {
      return lease.tenant
    }
    return lease.host
  }

  const filteredLeases = useMemo(() => {
    return leases.filter((lease) => {
      const matchesStatus = statusFilter === 'all' || lease.displayStatus === statusFilter

      const text = `${lease.property?.title || ''} ${lease.property?.address?.city || ''} ${otherParty(lease)?.name || ''}`.toLowerCase()
      const matchesQuery = query.trim() === '' || text.includes(query.toLowerCase())

      return matchesStatus && matchesQuery
    })
  }, [leases, statusFilter, query, user])

  const stats = useMemo(() => {
    return {
      total: leases.length,
      active: leases.filter((lease) => lease.displayStatus === 'active').length,
      pending: leases.filter((lease) => lease.displayStatus === 'pending').length,
      expiring: leases.filter((lease) => lease.displayStatus === 'expiring').length
    }
  }, [leases])

  const handleDownload = async (leaseId) => {
    try {
      setDownloading((prev) => ({ ...prev, [leaseId]: true }))
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
      setDownloading((prev) => ({ ...prev, [leaseId]: false }))
    }
  }

  const openSignModal = (lease) => {
    setSelectedLease(lease)
    setSignatureInput('')
    setSignStep(1)
    setShowSignModal(true)
  }

  const initiateSigning = async () => {
    if (!selectedLease?._id) return

    try {
      setSigning(true)

      let envelope
      try {
        const statusRes = await leasesAPI.getDocuSignStatus(selectedLease._id)
        envelope = statusRes.data.data
      } catch {
        const createRes = await leasesAPI.createEnvelope(selectedLease._id)
        envelope = createRes.data.data
        if (createRes.data.message) {
          toast.info(createRes.data.message)
        }
      }

      if (envelope.useLocalSigning) {
        setSignStep(2)
        return
      }

      const urlRes = await leasesAPI.getSigningUrl(selectedLease._id)
      if (urlRes.data.data.signingUrl) {
        toast.info('Redirecting to DocuSign...')
        window.location.href = urlRes.data.data.signingUrl
        return
      }

      if (urlRes.data.data.useLocalSigning) {
        setSignStep(2)
      }
    } catch (error) {
      console.error('Failed to initiate signing:', error)
      toast.error(error.response?.data?.message || 'Failed to start signing')
    } finally {
      setSigning(false)
    }
  }

  const completeLocalSign = async () => {
    if (!selectedLease?._id) return

    if (!signatureInput.trim()) {
      toast.error('Please enter your full name to sign')
      return
    }

    try {
      setSigning(true)
      const signature = `${signatureInput.trim()} (Signed electronically on ${new Date().toLocaleString()})`
      const response = await leasesAPI.sign(selectedLease._id, signature)
      toast.success(response.data.message || 'Lease signed successfully')
      setShowSignModal(false)
      setSelectedLease(null)
      setSignStep(1)
      setSignatureInput('')
      fetchLeases()
    } catch (error) {
      console.error('Failed to sign lease:', error)
      toast.error(error.response?.data?.message || 'Failed to sign lease')
    } finally {
      setSigning(false)
    }
  }

  const syncDocuSignStatus = async (leaseId) => {
    try {
      setSyncing((prev) => ({ ...prev, [leaseId]: true }))
      const response = await leasesAPI.syncDocuSign(leaseId)

      if (response.data.success) {
        toast.success('Signing status updated')
        fetchLeases()
      }
    } catch (error) {
      console.error('Failed to sync DocuSign status:', error)
      toast.error('Failed to sync signing status')
    } finally {
      setSyncing((prev) => ({ ...prev, [leaseId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900">{user?.role === 'host' ? 'Lease Management' : 'My Leases'}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {user?.role === 'host' ? 'Track tenant agreements and signatures' : 'Track your current and past rental agreements'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">Total</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-xs font-medium text-green-700">Active</p>
            <p className="mt-1 text-xl font-bold text-green-800">{stats.active}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs font-medium text-amber-700">Pending</p>
            <p className="mt-1 text-xl font-bold text-amber-800">{stats.pending}</p>
          </div>
          <div className="rounded-xl bg-orange-50 p-4">
            <p className="text-xs font-medium text-orange-700">Expiring</p>
            <p className="mt-1 text-xl font-bold text-orange-800">{stats.expiring}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by property, city, or person"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {statusFilters.map((item) => (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  statusFilter === item.value
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredLeases.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <FiFileText className="mx-auto mb-3 text-4xl text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900">No leases found</h2>
          <p className="mt-1 text-sm text-gray-500">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredLeases.map((lease) => {
            const party = otherParty(lease)
            const userSigned = hasUserSigned(lease)
            const canSign = lease.status === 'pending' && !userSigned

            return (
              <div key={lease._id} className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
                <div className="flex items-start gap-4">
                  <div className="h-24 w-28 overflow-hidden rounded-xl bg-gray-100">
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

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="line-clamp-1 text-base font-semibold text-gray-900">{lease.property?.title || 'Untitled property'}</h3>
                      {getStatusBadge(lease.displayStatus || lease.status)}
                    </div>

                    <p className="mb-2 flex items-center text-sm text-gray-500">
                      <FiMapPin className="mr-1.5" />
                      <span className="line-clamp-1">{lease.property?.address?.street}, {lease.property?.address?.city}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-500">Monthly Rent</p>
                        <p className="font-semibold text-gray-900">NPR {(lease.monthlyRent || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-500">Days Remaining</p>
                        <p className="font-semibold text-gray-900">{lease.daysRemaining}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{user?.role === 'host' ? 'Tenant' : 'Host'}</p>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={party?.name} avatar={party?.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-medium text-gray-900">{party?.name || 'N/A'}</p>
                        <p className="line-clamp-1 text-xs text-gray-500">{party?.email || 'No email'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Lease Period</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}</p>
                    <p className="mt-1 text-xs text-gray-500 flex items-center"><FiCalendar className="mr-1" />{lease.displayStatus === 'expiring' ? 'Expiring in 30 days or less' : 'Within lease timeline'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => navigate(`/dashboard/leases/${lease._id}`)}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    View Details <FiArrowRight className="ml-1" />
                  </button>

                  <button
                    onClick={() => handleDownload(lease._id)}
                    disabled={downloading[lease._id]}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiDownload className="mr-1" /> {downloading[lease._id] ? 'Downloading...' : 'Download'}
                  </button>

                  {canSign && (
                    <button
                      onClick={() => openSignModal(lease)}
                      className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      <FiPenTool className="mr-1" /> Sign Lease
                    </button>
                  )}

                  {lease.status === 'pending' && userSigned && (
                    <button
                      onClick={() => syncDocuSignStatus(lease._id)}
                      disabled={syncing[lease._id]}
                      className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiRefreshCw className="mr-1" /> {syncing[lease._id] ? 'Syncing...' : 'Refresh Signature Status'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showSignModal && selectedLease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5">
            <h3 className="text-lg font-semibold text-gray-900">Sign Lease Agreement</h3>
            <p className="mt-1 text-sm text-gray-500">Property: {selectedLease.property?.title}</p>

            {signStep === 1 ? (
              <div className="mt-5">
                <p className="text-sm text-gray-700">Continue to secure signing. If DocuSign is unavailable, local signing will be used.</p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowSignModal(false)
                      setSelectedLease(null)
                      setSignStep(1)
                    }}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={initiateSigning}
                    disabled={signing}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {signing ? 'Starting...' : 'Continue'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">Enter your full name</label>
                <input
                  value={signatureInput}
                  onChange={(e) => setSignatureInput(e.target.value)}
                  placeholder="Your full legal name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                />

                <div className="mt-5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSignStep(1)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={completeLocalSign}
                    disabled={signing}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {signing ? 'Signing...' : 'Sign Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Leases
