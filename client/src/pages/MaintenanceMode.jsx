import { FiTool, FiMail } from 'react-icons/fi'
import { useAppSettingsStore } from '../store/appSettingsStore'

function MaintenanceMode() {
  const { settings } = useAppSettingsStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-accent-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur rounded-2xl border border-primary-100 shadow-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-accent-100 text-accent-700 flex items-center justify-center mb-5">
          <FiTool className="text-3xl" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">{settings.platformName} is under maintenance</h1>
        <p className="text-slate-600 text-base md:text-lg mb-6">{settings.maintenanceMessage}</p>

        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-800 px-4 py-2 rounded-lg border border-primary-100">
          <FiMail />
          <span className="text-sm font-medium">Need help? Contact {settings.supportEmail}</span>
        </div>
      </div>
    </div>
  )
}

export default MaintenanceMode
