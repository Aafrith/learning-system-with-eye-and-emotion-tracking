'use client'

import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Bell, Shield, Database, Users, Lock, Palette, Sun, Moon, ArrowLeft, Check, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Settings {
  notifications: {
    email: boolean
    push: boolean
    sessionAlerts: boolean
    weeklyReports: boolean
  }
  privacy: {
    showProfile: boolean
    showActivity: boolean
    allowAnalytics: boolean
  }
  appearance: {
    language: string
  }
}

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true,
      sessionAlerts: true,
      weeklyReports: false,
    },
    privacy: {
      showProfile: true,
      showActivity: false,
      allowAnalytics: true,
    },
    appearance: {
      language: 'en',
    },
  })

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
      } catch (e) {
        console.error('Failed to parse saved settings')
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  const saveSettings = () => {
    setSaveStatus('saving')
    localStorage.setItem('userSettings', JSON.stringify(settings))
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 500)
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handleToggle = (category: 'notifications' | 'privacy', key: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !(prev[category] as any)[key],
      },
    }))
  }

  // Show loading while auth is being checked
  if (isLoading || !user) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/50 transition-colors duration-200">
          <div className="container mx-auto px-6 py-4">
            {/* Back to Dashboard Button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => router.push(`/${user?.role}/dashboard`)}
              className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </motion.button>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <button
                onClick={saveSettings}
                disabled={saveStatus === 'saving'}
                className="btn btn-primary flex items-center gap-2"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Appearance - Theme Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-700/50 p-6 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customize your interface</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={`relative flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                        theme === 'light'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'}`} />
                      <span className={`font-medium ${theme === 'light' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Light
                      </span>
                      {theme === 'light' && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`relative flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`} />
                      <span className={`font-medium ${theme === 'dark' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Dark
                      </span>
                      {theme === 'dark' && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Language</label>
                  <select
                    value={settings.appearance.language}
                    onChange={(e) => setSettings({ ...settings, appearance: { ...settings.appearance, language: e.target.value } })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-700/50 p-6 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your notification preferences</p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {key === 'email' && 'Receive email notifications'}
                        {key === 'push' && 'Receive push notifications'}
                        {key === 'sessionAlerts' && 'Get alerts during sessions'}
                        {key === 'weeklyReports' && 'Receive weekly performance reports'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('notifications', key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Privacy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-700/50 p-6 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacy</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Control your privacy settings</p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(settings.privacy).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {key === 'showProfile' && 'Make your profile visible to others'}
                        {key === 'showActivity' && 'Show your activity status'}
                        {key === 'allowAnalytics' && 'Allow usage analytics for improvement'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('privacy', key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Account Actions */}
            {user.role === 'admin' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-700/50 p-6 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Actions</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">System management options</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Export System Data</span>
                      <Database className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                  <button className="w-full px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Manage Users</span>
                      <Users className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                  <button className="w-full px-4 py-3 text-left border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Reset System Settings</span>
                      <Lock className="w-5 h-5" />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
