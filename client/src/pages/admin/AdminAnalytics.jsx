import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../../utils/api'
import { toast } from 'react-toastify'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  FiTrendingUp, FiUsers, FiHome, FiDollarSign,
  FiActivity, FiRefreshCw, FiTool, FiFileText
} from 'react-icons/fi'

const COLORS = {
  blue:   '#3b82f6',
  green:  '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  red:    '#ef4444',
  teal:   '#14b8a6',
  pink:   '#ec4899',
  yellow: '#eab308'
}

const PIE_PALETTE = Object.values(COLORS)

const fmtNPR = (v) =>
  v >= 1_000_000
    ? `NPR ${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `NPR ${(v / 1_000).toFixed(1)}K`
    : `NPR ${v}`

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

const CustomTooltipRevenue = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name === 'Revenue' ? fmtNPR(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

const SummaryCard = ({ title, value, subtitle, icon: Icon, color, isCurrency = false }) => {
  const bg = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  }[color] || 'bg-gray-50 text-gray-600'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${bg}`}>
          {isCurrency ? (
            <span className="text-lg font-bold">Rs</span>
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}

function AdminAnalytics() {
  const [dashStats, setDashStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAnalytics()
      ])
      setDashStats(dashRes.data.data)
      setAnalytics(analyticsRes.data.data)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Analytics fetch error:', err)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => fetchAll(true), 60_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Loading analytics…</p>
        </div>
      </div>
    )
  }

  const growthData = analytics?.userGrowth?.map((u, i) => ({
    month: u.month,
    Users: u.value,
    Properties: analytics.propertyGrowth?.[i]?.value ?? 0
  })) ?? []

  const revenueData = analytics?.revenueGrowth?.map((r, i) => ({
    month: r.month,
    Revenue: r.value,
    Payments: analytics.revenuePaymentCount?.[i]?.value ?? 0
  })) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Report</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Real-time platform insights
            {lastRefreshed && (
              <span className="ml-2 text-gray-400">
                · Last updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchAll()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Users"
          value={(dashStats?.users?.total ?? 0).toLocaleString()}
          subtitle={`${dashStats?.users?.hosts ?? 0} hosts · ${dashStats?.users?.tenants ?? 0} tenants`}
          icon={FiUsers}
          color="blue"
        />
        <SummaryCard
          title="Total Properties"
          value={(dashStats?.properties?.total ?? 0).toLocaleString()}
          subtitle={`${dashStats?.properties?.active ?? 0} active · ${dashStats?.properties?.pending ?? 0} pending`}
          icon={FiHome}
          color="green"
        />
        <SummaryCard
          title="Active Leases"
          value={(dashStats?.leases?.active ?? 0).toLocaleString()}
          subtitle={`${dashStats?.leases?.expired ?? 0} expired`}
          icon={FiFileText}
          color="purple"
        />
        <SummaryCard
          title="Total Revenue"
          value={fmtNPR(analytics?.totalRevenue ?? 0)}
          subtitle={`${analytics?.totalPayments ?? 0} completed payments`}
          icon={FiDollarSign}
          color="orange"
          isCurrency={true}
        />
      </div>

      {/* Growth chart — full width */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-purple-500" /> Platform Growth (Last 6 Months)
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={growthData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradProps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="Users" stroke={COLORS.blue} fill="url(#gradUsers)" strokeWidth={2} dot={{ r: 3 }} />
            <Area type="monotone" dataKey="Properties" stroke={COLORS.green} fill="url(#gradProps)" strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiDollarSign className="text-orange-500" /> Monthly Revenue (NPR)
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={revenueData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
            <Tooltip content={<CustomTooltipRevenue />} />
            <Legend />
            <Bar dataKey="Revenue" fill={COLORS.orange} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Payments" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row of 3 pie charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* User role distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiUsers className="text-blue-500" /> User Roles
          </h3>
          {analytics?.userRoleDistribution?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.userRoleDistribution}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${capitalize(name)} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {analytics.userRoleDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, capitalize(n)]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyPie />}
        </div>

        {/* Property type distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiHome className="text-green-500" /> Property Types
          </h3>
          {analytics?.propertyTypeDistribution?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.propertyTypeDistribution}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${capitalize(name)} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {analytics.propertyTypeDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, capitalize(n)]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyPie />}
        </div>

        {/* Lease status distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiFileText className="text-purple-500" /> Lease Status
          </h3>
          {analytics?.leaseStatusDistribution?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.leaseStatusDistribution}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${capitalize(name)} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {analytics.leaseStatusDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, capitalize(n)]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyPie />}
        </div>
      </div>

      {/* Row: Payment methods + Maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Payment methods */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiDollarSign className="text-teal-500" /> Payment Methods
          </h3>
          {analytics?.paymentMethodDistribution?.length ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={analytics.paymentMethodDistribution.map(d => ({
                    name: capitalize(d.name),
                    Transactions: d.value,
                    'Revenue (NPR)': d.total
                  }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="Transactions" fill={COLORS.teal} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {analytics.paymentMethodDistribution.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                      {capitalize(d.name)}
                    </span>
                    <span className="font-medium text-gray-700">{fmtNPR(d.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyPie label="No completed payments yet" />}
        </div>

        {/* Maintenance requests */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTool className="text-red-500" /> Maintenance Requests
          </h3>
          {analytics?.maintenanceDistribution?.length ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={analytics.maintenanceDistribution}
                    cx="50%" cy="50%"
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {analytics.maintenanceDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, capitalize(n)]} />
                  <Legend formatter={(v) => capitalize(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {analytics.maintenanceDistribution.map((d, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                      {capitalize(d.name)}
                    </span>
                    <span className="font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyPie label="No maintenance requests yet" />}
        </div>
      </div>
    </div>
  )
}

function EmptyPie({ label = 'No data yet' }) {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm">
      <FiActivity className="w-8 h-8 mb-2 opacity-40" />
      {label}
    </div>
  )
}

export default AdminAnalytics
