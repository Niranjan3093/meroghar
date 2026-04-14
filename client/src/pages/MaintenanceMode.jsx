import { FiTool, FiMail, FiClock, FiRefreshCw, FiShield } from 'react-icons/fi'
import { useAppSettingsStore } from '../store/appSettingsStore'

function MaintenanceMode() {
  const { settings } = useAppSettingsStore()

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-primary-50 to-accent-50 flex items-center justify-center px-4 py-10">
      <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent-200/40 blur-3xl" />

      <div className="relative w-full max-w-3xl bg-white/90 backdrop-blur-xl rounded-3xl border border-primary-100 shadow-2xl p-6 md:p-10">
        <div className="flex items-center justify-center mb-5">
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-100 to-primary-100 text-accent-700 flex items-center justify-center shadow-lg">
            <FiTool className="text-3xl" />
            <span className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-accent-500 animate-pulse" />
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-50 text-accent-700 text-xs font-semibold tracking-wide uppercase border border-accent-100 mb-4">
            <FiClock className="text-sm" />
            Scheduled Service Window
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{settings.platformName} is under maintenance</h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">{settings.maintenanceMessage}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 text-center">
            <FiRefreshCw className="mx-auto text-primary-700 text-xl mb-2" />
            <p className="text-sm font-semibold text-slate-800">Live Updates</p>
            <p className="text-xs text-slate-600 mt-1">Please refresh in a few minutes</p>
          </div>
          <div className="rounded-xl bg-accent-50 border border-accent-100 p-4 text-center">
            <FiShield className="mx-auto text-accent-700 text-xl mb-2" />
            <p className="text-sm font-semibold text-slate-800">Data Safe</p>
            <p className="text-xs text-slate-600 mt-1">Your account and data are secure</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center">
            <FiTool className="mx-auto text-emerald-700 text-xl mb-2" />
            <p className="text-sm font-semibold text-slate-800">Improvements</p>
            <p className="text-xs text-slate-600 mt-1">Performance and reliability upgrades</p>
          </div>
        </div>

        <div className="flex justify-center">
          <a
            href={`mailto:${settings.supportEmail}`}
            className="inline-flex items-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-800 px-5 py-3 rounded-xl border border-primary-100 transition-all duration-300 shadow-sm hover:shadow"
          >
            <FiMail />
            <span className="text-sm font-semibold">Need help? Contact {settings.supportEmail}</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default MaintenanceMode
