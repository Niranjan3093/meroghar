import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import Sidebar from '../components/dashboard/Sidebar'
import DashboardNavbar from '../components/dashboard/DashboardNavbar'

function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const contentRef = useRef(null)
  const isLeaseDetailsPage = /^\/dashboard\/leases\/[^/]+$/.test(location.pathname)

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Reset dashboard content scroll on route changes.
  useEffect(() => {
    if (contentRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      contentRef.current.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    }
  }, [location.pathname, location.search])

  const handleLogoutRequest = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    navigate('/')
  }

  if (isLeaseDetailsPage) {
    return (
      <div className="h-screen w-full overflow-y-auto bg-primary-50">
        <Outlet />
      </div>
    )
  }
  
  // Pages that need full-bleed (no padding) layout
  const fullBleedPages = ['/dashboard/leases']
  const isFullBleed = fullBleedPages.some(page => location.pathname.startsWith(page))

  return (
    <div className="flex h-screen bg-primary-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogoutClick={handleLogoutRequest} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main ref={contentRef} className="flex-1 overflow-y-auto w-full">
          {isFullBleed ? (
            <Outlet />
          ) : (
            <div className="p-2 md:p-3 lg:p-4">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      {/* Logout Confirmation Modal - Rendered at layout level to escape overflow constraints */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Logout</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="btn-accent text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardLayout

