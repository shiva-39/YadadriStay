import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Building2,
  CreditCard,
  Shield,
  Bell,
  Globe,
  Database,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  Users,
  Mail,
  Phone,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'commission', label: 'Commission', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'localization', label: 'Localization', icon: Globe },
  { id: 'database', label: 'Database', icon: Database },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // General
    platformName: 'Yadadri Stay',
    platformTagline: 'Your spiritual stay companion',
    supportEmail: 'support@yadadristay.com',
    supportPhone: '+91-9876543210',
    address: 'Yadadri Bhuvanagiri, Telangana, India',
    timezone: 'Asia/Kolkata',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    requirePhoneVerification: true,

    // Commission
    defaultCommissionRate: 10,
    minCommissionRate: 5,
    maxCommissionRate: 20,
    platformFeePercentage: 2,
    taxPercentage: 18,

    // Security
    jwtAccessTokenExpiry: '15m',
    jwtRefreshTokenExpiry: '7d',
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    twoFactorEnabled: false,
    sessionTimeout: 30,

    // Notifications
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    bookingConfirmationEmail: true,
    bookingConfirmationSMS: true,
    paymentVerificationEmail: true,
    paymentVerificationSMS: true,
    lodgeApprovalEmail: true,
    lodgeApprovalSMS: true,
    promotionalEmails: false,
    promotionalSMS: false,

    // Localization
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'hi', 'te', 'ta'],
    defaultCurrency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: 'en-IN',

    // Database
    backupFrequency: 'daily',
    backupRetention: 30,
    logRetention: 90,
    analyticsEnabled: true,
    debugMode: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings');
      if (response.data.data) {
        setSettings(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use defaults if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleLanguage = (lang) => {
    const langs = settings.supportedLanguages.includes(lang)
      ? settings.supportedLanguages.filter(l => l !== lang)
      : [...settings.supportedLanguages, lang];
    handleChange('supportedLanguages', langs);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  Platform Information
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Platform Name</label>
                    <input
                      type="text"
                      value={settings.platformName}
                      onChange={(e) => handleChange('platformName', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Tagline</label>
                    <input
                      type="text"
                      value={settings.platformTagline}
                      onChange={(e) => handleChange('platformTagline', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Support Email</label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleChange('supportEmail', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Support Phone</label>
                    <input
                      type="tel"
                      value={settings.supportPhone}
                      onChange={(e) => handleChange('supportPhone', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Address</label>
                    <textarea
                      value={settings.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="input-field"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-600" />
                  Platform Settings
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      className="input-field"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (UTC-5)</option>
                      <option value="Europe/London">Europe/London (UTC+0)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Date Format</label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => handleChange('dateFormat', e.target.value)}
                      className="input-field"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Maintenance Mode (disable all bookings)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistrations}
                      onChange={(e) => handleChange('allowRegistrations', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Allow New User Registrations</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireEmailVerification}
                      onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Require Email Verification</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requirePhoneVerification}
                      onChange={(e) => handleChange('requirePhoneVerification', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Require Phone Verification</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'commission':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                  Commission Settings
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="label">Default Commission Rate (%)</label>
                    <input
                      type="number"
                      min={settings.minCommissionRate}
                      max={settings.maxCommissionRate}
                      value={settings.defaultCommissionRate}
                      onChange={(e) => handleChange('defaultCommissionRate', parseInt(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Min Commission Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={settings.maxCommissionRate}
                      value={settings.minCommissionRate}
                      onChange={(e) => handleChange('minCommissionRate', parseInt(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Max Commission Rate (%)</label>
                    <input
                      type="number"
                      min={settings.minCommissionRate}
                      max={100}
                      value={settings.maxCommissionRate}
                      onChange={(e) => handleChange('maxCommissionRate', parseInt(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Platform Fee (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={settings.platformFeePercentage}
                      onChange={(e) => handleChange('platformFeePercentage', parseFloat(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Tax Percentage (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={0.1}
                      value={settings.taxPercentage}
                      onChange={(e) => handleChange('taxPercentage', parseFloat(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Commission Structure
                  </h4>
                  <p className="text-sm text-blue-700">
                    The platform charges a commission on each booking. Individual lodge owners can have custom
                    commission rates between {settings.minCommissionRate}% and {settings.maxCommissionRate}%.
                    The platform fee is an additional percentage charged on top of the commission.
                    Tax is applied on the total amount including commission and platform fee.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary-600" />
                  Authentication & Tokens
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Access Token Expiry</label>
                    <select
                      value={settings.jwtAccessTokenExpiry}
                      onChange={(e) => handleChange('jwtAccessTokenExpiry', e.target.value)}
                      className="input-field"
                    >
                      <option value="5m">5 minutes</option>
                      <option value="15m">15 minutes</option>
                      <option value="30m">30 minutes</option>
                      <option value="1h">1 hour</option>
                      <option value="2h">2 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Refresh Token Expiry</label>
                    <select
                      value={settings.jwtRefreshTokenExpiry}
                      onChange={(e) => handleChange('jwtRefreshTokenExpiry', e.target.value)}
                      className="input-field"
                    >
                      <option value="1d">1 day</option>
                      <option value="3d">3 days</option>
                      <option value="7d">7 days</option>
                      <option value="14d">14 days</option>
                      <option value="30d">30 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      min={5}
                      max={1440}
                      value={settings.sessionTimeout}
                      onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value) || 30)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Max Login Attempts</label>
                    <input
                      type="number"
                      min={3}
                      max={20}
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value) || 5)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={settings.lockoutDuration}
                      onChange={(e) => handleChange('lockoutDuration', parseInt(e.target.value) || 15)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Two-Factor Authentication</h4>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorEnabled}
                      onChange={(e) => handleChange('twoFactorEnabled', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Enable 2FA for all admin users</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary-600" />
                  Password Policy
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Minimum Length</label>
                    <input
                      type="number"
                      min={6}
                      max={50}
                      value={settings.passwordMinLength}
                      onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value) || 8)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.passwordRequireUppercase}
                      onChange={(e) => handleChange('passwordRequireUppercase', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Require Uppercase Letters</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.passwordRequireLowercase}
                      onChange={(e) => handleChange('passwordRequireLowercase', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Require Lowercase Letters</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.passwordRequireNumbers}
                      onChange={(e) => handleChange('passwordRequireNumbers', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Require Numbers</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.passwordRequireSpecialChars}
                      onChange={(e) => handleChange('passwordRequireSpecialChars', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Require Special Characters</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary-600" />
                  Notification Channels
                </h3>
              </div>
              <div className="card-body space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Enable Email Notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Enable SMS Notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Enable Push Notifications</span>
                </label>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary-600" />
                  Email Templates
                </h3>
              </div>
              <div className="card-body space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.bookingConfirmationEmail}
                    onChange={(e) => handleChange('bookingConfirmationEmail', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Booking Confirmation Email</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentVerificationEmail}
                    onChange={(e) => handleChange('paymentVerificationEmail', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Payment Verification Email</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.lodgeApprovalEmail}
                    onChange={(e) => handleChange('lodgeApprovalEmail', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Lodge Approval Email</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.promotionalEmails}
                    onChange={(e) => handleChange('promotionalEmails', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Promotional Emails</span>
                </label>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary-600" />
                  SMS Templates
                </h3>
              </div>
              <div className="card-body space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.bookingConfirmationSMS}
                    onChange={(e) => handleChange('bookingConfirmationSMS', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Booking Confirmation SMS</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentVerificationSMS}
                    onChange={(e) => handleChange('paymentVerificationSMS', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Payment Verification SMS</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.lodgeApprovalSMS}
                    onChange={(e) => handleChange('lodgeApprovalSMS', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Lodge Approval SMS</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.promotionalSMS}
                    onChange={(e) => handleChange('promotionalSMS', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Promotional SMS</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'localization':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-600" />
                  Language & Regional Settings
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Default Language</label>
                    <select
                      value={settings.defaultLanguage}
                      onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                      className="input-field"
                    >
                      {settings.supportedLanguages.map(lang => (
                        <option key={lang} value={lang}>
                          {lang === 'en' && 'English'}
                          {lang === 'hi' && 'Hindi (हिंदी)'}
                          {lang === 'te' && 'Telugu (తెలుగు)'}
                          {lang === 'ta' && 'Tamil (தமிழ்)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Default Currency</label>
                    <select
                      value={settings.defaultCurrency}
                      onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                      className="input-field"
                    >
                      <option value="INR">INR - Indian Rupee (₹)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Time Format</label>
                    <select
                      value={settings.timeFormat}
                      onChange={(e) => handleChange('timeFormat', e.target.value)}
                      className="input-field"
                    >
                      <option value="12h">12 Hour (AM/PM)</option>
                      <option value="24h">24 Hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Number Format</label>
                    <select
                      value={settings.numberFormat}
                      onChange={(e) => handleChange('numberFormat', e.target.value)}
                      className="input-field"
                    >
                      <option value="en-IN">Indian (1,00,000)</option>
                      <option value="en-US">US (100,000)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Supported Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {['en', 'hi', 'te', 'ta'].map(lang => (
                      <label key={lang} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.supportedLanguages.includes(lang)}
                          onChange={() => toggleLanguage(lang)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                          {lang === 'en' && 'English'}
                          {lang === 'hi' && 'Hindi (हिंदी)'}
                          {lang === 'te' && 'Telugu (తెలుగు)'}
                          {lang === 'ta' && 'Tamil (தமிழ்)'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary-600" />
                  Backup & Maintenance
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Backup Frequency</label>
                    <select
                      value={settings.backupFrequency}
                      onChange={(e) => handleChange('backupFrequency', e.target.value)}
                      className="input-field"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Backup Retention (days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={settings.backupRetention}
                      onChange={(e) => handleChange('backupRetention', parseInt(e.target.value) || 30)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Log Retention (days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={settings.logRetention}
                      onChange={(e) => handleChange('logRetention', parseInt(e.target.value) || 90)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.analyticsEnabled}
                      onChange={(e) => handleChange('analyticsEnabled', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Enable Analytics Collection</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.debugMode}
                      onChange={(e) => handleChange('debugMode', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Debug Mode (verbose logging)</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                  <button
                    className="btn-outline flex items-center gap-2"
                    onClick={() => toast.success('Manual backup initiated (simulated)')}
                  >
                    <Download className="w-4 h-4" />
                    Trigger Backup Now
                  </button>
                  <button
                    className="btn-outline flex items-center gap-2"
                    onClick={() => toast.success('Database optimization started (simulated)')}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Optimize Database
                  </button>
                  <button
                    className="btn-outline flex items-center gap-2 text-red-600 hover:bg-red-50 border-red-200"
                    onClick={() => {
                      if (window.confirm('Are you sure? This will delete all logs older than retention period.')) {
                        toast.success('Old logs cleaned up (simulated)');
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clean Old Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure platform settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4" aria-label="Settings tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="card-body pt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}