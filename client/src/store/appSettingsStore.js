import { create } from 'zustand'
import { settingsAPI } from '../utils/api'

const defaultSettings = {
  platformName: 'MeroGhar',
  supportEmail: 'support@meroghar.com',
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back later.'
}

export const useAppSettingsStore = create((set) => ({
  settings: defaultSettings,
  loading: false,
  initialized: false,
  fetchSettings: async () => {
    try {
      set({ loading: true })
      const response = await settingsAPI.getPublic()
      if (response.data?.success) {
        set({
          settings: {
            ...defaultSettings,
            ...response.data.data
          },
          initialized: true
        })
      }
    } catch (_error) {
      set({ initialized: true })
    } finally {
      set({ loading: false })
    }
  }
}))
