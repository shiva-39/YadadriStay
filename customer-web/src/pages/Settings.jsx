import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Fragment } from 'react'
import { 
  Bell, Moon, Sun, Globe, Shield, CreditCard, 
  Trash2, LogOut, Save, Loader2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function NotificationItem({ label, desc, checked, onChange }) {
  return (
    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
      />
    </label>
  )
}

function Settings() {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState('notifications')
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    whatsappNotifications: false,
    darkMode: false,
    language: 'en',
    currency: 'INR',
  })
  const [loading, setLoading] = useState(false)

  const sections = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'language', label: 'Language & Region', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'account', label: 'Account', icon: Trash2 },
  ]

  const handleSave = async (section) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved!`)
    setLoading(false)
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <h1 className="page-title mb-8">Settings</h1>

        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold">Account Settings</h2>
              <p className="text-gray-500 mt-1">Manage your preferences and account settings</p>
            </div>

            <div className="flex flex-col md:flex-row">
              <nav className="w-full md:w-48 border-r border-gray-100 md:border-r-0 md:border-l-0" aria-label="Settings sections">
                <ul className="py-2" role="tablist">
                  {sections.map(section => (
                    <li key={section.id} role="presentation">
                      <button
                        role="tab"
                        aria-selected={activeSection === section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${
                          activeSection === section.id
                            ? 'bg-primary/10 text-primary border-r-2 border-primary'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <section.icon className="w-5 h-5" aria-hidden="true" />
                        {section.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="flex-1 p-6" role="tabpanel">
                {activeSection === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="section-title">Notification Preferences</h3>
                    <p className="text-gray-500">Choose how you want to receive updates</p>
                    <div className="space-y-4">
                      <NotificationItem 
                        key="emailNotifications" 
                        label="Email Notifications" 
                        desc="Booking confirmations, payment updates, offers" 
                        checked={prefs.emailNotifications}
                        onChange={(checked) => setPrefs(prev => ({ ...prev, emailNotifications: checked }))}
                      />
                      <NotificationItem 
                        key="smsNotifications" 
                        label="SMS Notifications" 
                        desc="Booking alerts, payment reminders, OTP" 
                        checked={prefs.smsNotifications}
                        onChange={(checked) => setPrefs(prev => ({ ...prev, smsNotifications: checked }))}
                      />
                      <NotificationItem 
                        key="pushNotifications" 
                        label="Push Notifications" 
                        desc="Real-time alerts on your device" 
                        checked={prefs.pushNotifications}
                        onChange={(checked) => setPrefs(prev => ({ ...prev, pushNotifications: checked }))}
                      />
                      <NotificationItem 
                        key="whatsappNotifications" 
                        label="WhatsApp Notifications" 
                        desc="Booking updates via WhatsApp" 
                        checked={prefs.whatsappNotifications}
                        onChange={(checked) => setPrefs(prev => ({ ...prev, whatsappNotifications: checked }))}
                      />
                    </div>
                    <button onClick={() => handleSave('notifications')} disabled={loading} className="btn-primary w-full sm:w-auto">
                      Save Changes
                    </button>
                  </div>
                )}

                {activeSection === 'appearance' && (
                  <div className="space-y-6">
                    <h3 className="section-title">Appearance</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Dark Mode</p>
                          <p className="text-sm text-gray-500">Use dark theme across the app</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={prefs.darkMode} onChange={(e) => setPrefs(prev => ({ ...prev, darkMode: e.target.checked }))} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                    </div>
                    <button onClick={() => handleSave('appearance')} className="btn-primary w-full sm:w-auto">Save Changes</button>
                  </div>
                )}

                {activeSection === 'language' && (
                  <div className="space-y-6">
                    <h3 className="section-title">Language & Region</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Language</label>
                        <select value={prefs.language} onChange={(e) => setPrefs(prev => ({ ...prev, language: e.target.value }))} className="input-field">
                          <option value="en">English</option>
                          <option value="te">Telugu (తెలుగు)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Currency</label>
                        <select value={prefs.currency} onChange={(e) => setPrefs(prev => ({ ...prev, currency: e.target.value }))} className="input-field">
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={() => handleSave('language')} className="btn-primary w-full sm:w-auto">Save Changes</button>
                  </div>
                )}

                {activeSection === 'security' && (
                  <div className="space-y-6">
                    <h3 className="section-title">Security</h3>
                    <Link to="/profile" className="btn-outline w-full sm:w-auto">Change Password</Link>
                    <p className="text-sm text-gray-500">Your account is protected with secure authentication. Phone number is verified.</p>
                  </div>
                )}

                {activeSection === 'payments' && (
                  <div className="space-y-6">
                    <h3 className="section-title">Payment Methods</h3>
                    <p className="text-gray-500">UPI is the default payment method. Saved payment methods will appear here.</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41 4.09 4.08 7.09-7.09L19.62 12 9.83 19.18z"/></svg>
                          </div>
                          <div>
                            <p className="font-medium">UPI</p>
                            <p className="text-sm text-gray-500">yadadristay@upi</p>
                          </div>
                        </div>
                        <button className="btn-outline text-sm">Change</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'account' && (
                  <div className="space-y-6">
                    <h3 className="section-title">Account Management</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2">Delete Account</h4>
                      <p className="text-red-700 mb-4">This action is irreversible. All your bookings, payment history, and personal data will be permanently deleted.</p>
                      <button type="button" className="btn-outline text-red-600 border-red-300 hover:bg-red-50" onClick={() => { if (confirm('Are you sure you want to delete your account? This cannot be undone.')) { toast.error('Account deletion not implemented in demo') } }}>Delete My Account</button>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <button onClick={handleLogout} className="btn-outline w-full text-red-600 border-red-300 hover:bg-red-50 flex items-center justify-center gap-2">
                        <LogOut className="w-5 h-5" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings