import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import DashboardNavbar from '../components/dashboard/DashboardNavbar'

function DashboardLayout() {
  const location = useLocation()
  
  // Pages that need full-bleed (no padding) layout
  const fullBleedPages = ['/dashboard/leases/']
  const isFullBleed = fullBleedPages.some(page => location.pathname.includes(page) && location.pathname !== '/dashboard/leases')

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto">
          <div className={isFullBleed ? '' : 'p-2 md:p-3 lg:p-4'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

