import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light'
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
        return { theme: newTheme }
      }),
      setTheme: (theme) => set(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        return { theme }
      }),
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme-storage')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      document.documentElement.classList.toggle('dark', state.theme === 'dark')
    } catch (e) {
      console.error('Failed to parse theme storage', e)
    }
  }
}
