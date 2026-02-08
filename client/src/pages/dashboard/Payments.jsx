import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { paymentsAPI } from '../../utils/api'
import { toast } from 'react-toastify'
import { FiDollarSign, FiCalendar, FiCreditCard, FiCheckCircle, FiClock, FiAlertCircle, FiDownload, FiFilter, FiTrendingUp, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi'

function Payments() {
  const { user } = useAuthStore()
  const [payments, setPayments] = useState([])
  const [upcomingPayments, setUpcomingPayments] = useState([])
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingAmount: 0,
    thisMonth: 0,
    lastMonth: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await paymentsAPI.getAll()
      const paymentsData = response.data.data || []
      
      // Separate completed and pending payments
      const completed = paymentsData.filter(p => p.status === 'completed' || p.status === 'paid')
      const pending = paymentsData.filter(p => p.status === 'pending')
      
      // Calculate upcoming payments (pending)
      const upcoming = pending.map(p => ({
        ...p,
        daysLeft: Math.ceil((new Date(p.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      })).filter(p => p.daysLeft > 0)
      
      // Calculate stats
      const now = new Date()
      const thisMonth = now.getMonth()
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
      const thisYear = now.getFullYear()
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear
      
      const thisMonthPayments = completed.filter(p => {
        const d = new Date(p.date || p.createdAt)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      })
      
      const lastMonthPayments = completed.filter(p => {
        const d = new Date(p.date || p.createdAt)
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
      })
      
      setPayments(paymentsData)
      setUpcomingPayments(upcoming)
      setStats({
        totalPaid: completed.reduce((sum, p) => sum + (p.amount || 0), 0),
        pendingAmount: pending.reduce((sum, p) => sum + (p.amount || 0), 0),
        thisMonth: thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        lastMonth: lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      })
    } catch (error) {
      console.error('Failed to fetch payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><FiCheckCircle className="mr-1" /> Completed</span>
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><FiClock className="mr-1" /> Pending</span>
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><FiAlertCircle className="mr-1" /> Failed</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getMethodIcon = (method) => {
    switch (method) {
      case 'khalti':
        return <span className="text-purple-600 font-medium">Khalti</span>
      case 'esewa':
        return <span className="text-green-600 font-medium">eSewa</span>
      case 'bank-transfer':
        return <span className="text-blue-600 font-medium">Bank</span>
      case 'cash':
        return <span className="text-gray-600 font-medium">Cash</span>
      default:
        return <span className="text-gray-600 font-medium">{method || 'Other'}</span>
    }
  }

  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(p => p.paymentType === filter)

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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'host' 
              ? 'Track all incoming payments from tenants'
              : 'Manage your rent payments and history'
            }
          </p>
        </div>
        {user?.role === 'tenant' && upcomingPayments.length > 0 && (
          <button className="btn-primary flex items-center">
            <FiDollarSign className="mr-2" />
            Pay Now - NPR {upcomingPayments[0].amount.toLocaleString()}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">NPR {stats.totalPaid.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheckCircle className="text-xl text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-orange-600">NPR {stats.pendingAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiClock className="text-xl text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">NPR {stats.thisMonth.toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <FiArrowUpRight className="mr-1" /> Same as last month
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <FiTrendingUp className="text-xl text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Payment Methods</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Khalti</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">eSewa</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Bank</span>
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FiCreditCard className="text-xl text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Upcoming Payment Due</h3>
              <p className="text-orange-100 text-sm">{upcomingPayments[0].property?.title || 'Property'}</p>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <p className="text-orange-200 text-xs">Amount</p>
                  <p className="text-2xl font-bold">NPR {(upcomingPayments[0].amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-orange-200 text-xs">Due Date</p>
                  <p className="text-lg font-semibold">{new Date(upcomingPayments[0].dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-orange-200 text-xs">Days Left</p>
                  <p className="text-lg font-semibold">{upcomingPayments[0].daysLeft} days</p>
                </div>
              </div>
            </div>
            {user?.role === 'tenant' && (
              <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-orange-50 transition">
                Pay Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
          {['all', 'rent', 'maintenance', 'security-deposit'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                filter === f
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center">
          <FiDownload className="mr-2" /> Export
        </button>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.receipt?.receiptNumber || '-'}</p>
                      <p className="text-xs text-gray-500">{payment.transactionId || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{payment.property?.title || 'Property'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.paymentType === 'rent' ? 'bg-blue-100 text-blue-800' :
                      payment.paymentType === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {payment.paymentType?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Other'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">NPR {(payment.amount || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    {getMethodIcon(payment.paymentMethod)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                      <FiDownload className="mr-1" /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="p-12 text-center">
            <FiDollarSign className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'No payment history available yet.'
                : `No ${filter} payments found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Payments
