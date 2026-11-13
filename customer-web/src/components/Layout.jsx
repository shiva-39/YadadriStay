import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  MapPin, LogIn, User, LogOut, Heart, 
  Menu, X, Search, ChevronDown, Settings
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [searchDates, setSearchDates] = useState({ checkIn: '', checkOut: '' })

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchDates.checkIn || !searchDates.checkOut) {
      return
    }
    navigate(`/search?checkIn=${searchDates.checkIn}&checkOut=${searchDates.checkOut}`)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <nav className="container-custom" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" aria-label="Yadadri Stay Home">
              <span className="text-3xl" role="img" aria-label="Temple">🕉️</span>
              <span className="text-xl font-bold text-primary hidden sm:block">Yadadri Stay</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/search" className="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors">
                <MapPin className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-medium">Near Temple</span>
              </Link>
              
              <AuthSection 
                isAuthenticated={isAuthenticated} 
                user={user} 
                profileDropdownOpen={profileDropdownOpen}
                setProfileDropdownOpen={setProfileDropdownOpen}
                logout={logout}
                user={user}
              />
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-primary text-white py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <span className="text-2xl" role="img" aria-label="Temple">🕉️</span>
                <span className="text-xl font-bold">Yadadri Stay</span>
              </Link>
              <p className="text-primary-light text-sm">Comfortable stays near Yadadri Temple for pilgrims and tourists.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/search" className="text-primary-light hover:text-white transition-colors">Search Lodges</Link></li>
                <li><Link to="/login" className="text-primary-light hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/register" className="text-primary-light hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-primary-light hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-primary-light hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-primary-light hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-primary-light">
                <li>📞 +91 98765 43210</li>
                <li>✉️ support@yadadristay.com</li>
                <li>📍 Yadadri, Telangana</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-light mt-8 pt-8 text-center text-sm text-primary-light">
            © 2026 Yadadri Stay. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function AuthSection({ isAuthenticated, user, profileDropdownOpen, setProfileDropdownOpen, logout }) {
  if (isAuthenticated) {
    return (
      <div className="relative profile-dropdown">
        <button
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-expanded={profileDropdownOpen}
          aria-haspopup="true"
          aria-label="User menu"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" aria-hidden="true" />
        </button>
        
        {profileDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="font-semibold text-sm">{user?.fullName}</p>
              <p className="text-xs text-gray-500">{user?.phone}</p>
            </div>
            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => setProfileDropdownOpen(false)}>
              <User className="w-4 h-4" aria-hidden="true" />
              My Profile
            </Link>
            <Link to="/bookings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => setProfileDropdownOpen(false)}>
              <Heart className="w-4 h-4" aria-hidden="true" />
              My Bookings
            </Link>
            <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => setProfileDropdownOpen(false)}>
              <Settings className="w-4 h-4" aria-hidden="true" />
              Settings
            </Link>
            <hr className="my-1 border-gray-100" />
            <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2">
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-2">
      <Link to="/login" className="btn-outline px-4 py-2 text-sm">
        <LogIn className="w-4 h-4 mr-1" aria-hidden="true" />
        Login
      </Link>
      <Link to="/register" className="btn-primary px-4 py-2 text-sm">
        Sign Up
      </Link>
    </div>
  )
}

function MobileMenu({ searchDates, setSearchDates, handleSearch, isAuthenticated, logout, setMobileMenuOpen }) {
  return (
    <div id="mobile-menu" className="md:hidden py-4 border-t border-gray-100">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 mb-4" role="search">
        <label htmlFor="mobile-checkIn" className="sr-only">Check-in date</label>
        <input
          id="mobile-checkIn"
          type="date"
          value={searchDates.checkIn}
          onChange={(e) => setSearchDates(prev => ({ ...prev, checkIn: e.target.value }))}
          min={new Date().toISOString().split('T')[0]}
          className="input-field"
          required
        />
        <label htmlFor="mobile-checkOut" className="sr-only">Check-out date</label>
        <input
          id="mobile-checkOut"
          type="date"
          value={searchDates.checkOut}
          onChange={(e) => setSearchDates(prev => ({ ...prev, checkOut: e.target.value }))}
          min={searchDates.checkIn || new Date().toISOString().split('T')[0]}
          className="input-field"
          required
        />
        <button type="submit" className="btn-primary">Search</button>
      </form>
      <div className="space-y-2">
        <Link to="/search" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <span role="img" aria-label="map pin">📍</span>
          Near Temple
        </Link>
        <AuthenticatedMobileMenu logout={logout} setMobileMenuOpen={setMobileMenuOpen} />
        <UnauthenticatedMobileMenu setMobileMenuOpen={setMobileMenuOpen} />
      </div>
    </div>
  )
}

function AuthenticatedMobileMenu({ logout, setMobileMenuOpen }) {
  return (
    <div>
      <a href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2">
        <span role="img" aria-label="user">👤</span>
        My Profile
      </a>
      <a href="/bookings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2">
        <span role="img" aria-label="heart">❤️</span>
        My Bookings
      </a>
      <a href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2">
        <span role="img" aria-label="settings">⚙️</span>
        Settings
      </a>
      <button onClick={() => { logout(); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-lg flex items-center gap-2">
        <span role="img" aria-label="logout">🚪</span>
        Logout
      </button>
    </div>
  )
}

function UnauthenticatedMobileMenu({ setMobileMenuOpen }) {
  return (
    <div>
      <a href="/login" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2">
        <span role="img" aria-label="login">🔑</span>
        Login
      </a>
      <a href="/register" className="btn-primary w-full text-center">
        Sign Up
      </a>
    </div>
)
}