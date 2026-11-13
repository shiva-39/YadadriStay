import { Link } from 'react-router-dom'
import { Home, Search, RotateCcw } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <span className="text-8xl" role="img" aria-label="Lost">🧭</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-600 mb-8">
          Looks like you've wandered off the path. The page you're looking for doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary px-8 py-3 flex items-center gap-2">
            <Home className="w-5 h-5" aria-hidden="true" />
            Go Home
          </Link>
          <Link to="/search" className="btn-outline px-8 py-3 flex items-center gap-2">
            <Search className="w-5 h-5" aria-hidden="true" />
            Search Lodges
          </Link>
        </div>
        <div className="mt-12 text-center">
          <p className="text-gray-500">Or try one of these popular pages:</p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link to="/search" className="text-primary hover:underline">Search Lodges</Link>
            <Link to="/login" className="text-primary hover:underline">Login</Link>
            <Link to="/register" className="text-primary hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

