import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layouts
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AdminAuth from './pages/auth/AdminAuth'
import VerifyEmail from './pages/auth/VerifyEmail'
import OAuthCallback from './pages/auth/OAuthCallback'
import Properties from './pages/properties/Properties'
import PropertyDetails from './pages/properties/PropertyDetails'

// Dashboard Pages
import HostDashboard from './pages/dashboard/host/HostDashboard'
import TenantDashboard from './pages/dashboard/tenant/TenantDashboard'
import AdminDashboard from './pages/dashboard/admin/AdminDashboard'
import PropertyVerification from './pages/dashboard/admin/PropertyVerification'
import UserManagement from './pages/dashboard/admin/UserManagement'
import AdminProperties from './pages/dashboard/admin/AdminProperties'
import AdminLeases from './pages/dashboard/admin/AdminLeases'
import AdminSettings from './pages/dashboard/admin/AdminSettings'
import MyProperties from './pages/dashboard/host/MyProperties'
import AddProperty from './pages/dashboard/host/AddProperty'
import Messages from './pages/dashboard/Messages'
import Leases from './pages/dashboard/Leases'
import LeaseRequests from './pages/dashboard/LeaseRequests'
import LeaseDetails from './pages/dashboard/LeaseDetails'
import PaySecurityDeposit from './pages/dashboard/PaySecurityDeposit'
import Payments from './pages/dashboard/Payments'
import Maintenance from './pages/dashboard/Maintenance'
import Profile from './pages/dashboard/Profile'
import Notifications from './pages/dashboard/Notifications'

// Protected Route Component - Redirects to login if not authenticated
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

// Public Route Component - Redirects to dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  
  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'host':
        return <Navigate to="/dashboard/host" replace />
      case 'admin':
        return <Navigate to="/dashboard/admin" replace />
      case 'tenant':
      default:
        return <Navigate to="/dashboard/tenant" replace />
    }
  }
  
  return children
}

// Dashboard Index Route - Redirects to appropriate dashboard based on role
const DashboardIndex = () => {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }
  
  switch (user.role) {
    case 'host':
      return <Navigate to="/dashboard/host" replace />
    case 'admin':
      return <Navigate to="/dashboard/admin" replace />
    case 'tenant':
    default:
      return <Navigate to="/dashboard/tenant" replace />
  }
}

function App() {
  return (
    <Routes>
      {/* Public Routes - Redirect to dashboard if logged in */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={
          <PublicRoute>
            <Home />
          </PublicRoute>
        } />
        <Route path="admin" element={
          <PublicRoute>
            <AdminAuth />
          </PublicRoute>
        } />
        <Route path="login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="oauth-callback" element={<OAuthCallback />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/:id" element={<PropertyDetails />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        {/* Default Dashboard Route */}
        <Route index element={<DashboardIndex />} />
        
        {/* Host Routes */}
        <Route path="host" element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostDashboard />
          </ProtectedRoute>
        } />
        <Route path="host/properties" element={
          <ProtectedRoute allowedRoles={['host']}>
            <MyProperties />
          </ProtectedRoute>
        } />
        <Route path="host/properties/add" element={
          <ProtectedRoute allowedRoles={['host']}>
            <AddProperty />
          </ProtectedRoute>
        } />

        {/* Tenant Routes */}
        <Route path="tenant" element={
          <ProtectedRoute allowedRoles={['tenant']}>
            <TenantDashboard />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/properties" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProperties />
          </ProtectedRoute>
        } />
        <Route path="admin/properties/pending" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PropertyVerification />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="admin/leases" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLeases />
          </ProtectedRoute>
        } />
        <Route path="admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        } />

        {/* Common Routes */}
        <Route path="messages" element={<Messages />} />
        <Route path="leases" element={<Leases />} />
        <Route path="leases/:id" element={<LeaseDetails />} />
        <Route path="lease-requests" element={<LeaseRequests />} />
        <Route path="lease-requests/:id/pay" element={
          <ProtectedRoute allowedRoles={['tenant']}>
            <PaySecurityDeposit />
          </ProtectedRoute>
        } />
        <Route path="payments" element={<Payments />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  )
}

export default App