import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Calendar, MapPin, Filter, X, ChevronDown, 
  Bed, Users, Star, Home as HomeIcon, Building, 
  Loader2, MapPin as MapPinIcon
} from 'lucide-react'
import { lodgesAPI } from '../services/api'
import toast from 'react-hot-toast'

const AMENITIES = [
  { key: 'wifi', label: 'WiFi', icon: '📶' },
  { key: 'parking', label: 'Parking', icon: '🅿️' },
  { key: 'ac', label: 'AC', icon: '❄️' },
  { key: 'hotWater', label: 'Hot Water', icon: '🚿' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { key: 'roomService', label: 'Room Service', icon: '🛎️' },
  { key: 'laundry', label: 'Laundry', icon: '🧺' },
  { key: 'pickupDrop', label: 'Pickup/Drop', icon: '🚗' },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'distance', label: 'Nearest to Temple' },
]

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [lodges, setLodges] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('adults') || '1'),
    rooms: parseInt(searchParams.get('rooms') || '1'),
    minPrice: '',
    maxPrice: '',
    amenities: [],
    sortBy: 'relevance',
    page: 1,
  })
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [totalResults, setTotalResults] = useState(0)

  useEffect(() => {
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    if (checkIn && checkOut) {
      setFilters(prev => ({ ...prev, checkIn, checkOut }))
      searchLodges()
    }
  }, [searchParams])

  const searchLodges = async (page = 1) => {
    setLoading(true)
    try {
      const params = {
        checkInDate: filters.checkIn,
        checkOutDate: filters.checkOut,
        adults: filters.guests,
        rooms: filters.rooms,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        amenities: filters.amenities.length > 0 ? filters.amenities.join(',') : undefined,
        sortBy: filters.sortBy,
        page,
        limit: 12,
      }
      
      const response = await lodgesAPI.search(params)
      setLodges(response.data.data.lodges || [])
      setTotalResults(response.data.data.pagination?.total || 0)
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Failed to search lodges')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const toggleAmenity = (amenityKey) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityKey)
        ? prev.amenities.filter(a => a !== amenityKey)
        : [...prev.amenities, amenityKey],
      page: 1,
    }))
  }

  const clearFilters = () => {
    setFilters(prev => ({
      ...prev,
      minPrice: '',
      maxPrice: '',
      amenities: [],
      sortBy: 'relevance',
      page: 1,
    }))
  }

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.amenities.length > 0 || filters.sortBy !== 'relevance'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="container-custom py-4">
          <form onSubmit={(e) => { e.preventDefault(); searchLodges(); } } className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <label htmlFor="search-checkIn" className="sr-only">Check-in</label>
              <input
                id="search-checkIn"
                type="date"
                value={filters.checkIn}
                onChange={(e) => handleFilterChange('checkIn', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input-field w-full md:w-48"
                required
              />
              <label htmlFor="search-checkOut" className="sr-only">Check-out</label>
              <input
                id="search-checkOut"
                type="date"
                value={filters.checkOut}
                onChange={(e) => handleFilterChange('checkOut', e.target.value)}
                min={filters.checkIn}
                className="input-field w-full md:w-48"
                required
              />
            </div>
            <div className="flex gap-2">
              <select value={filters.guests} onChange={(e) => handleFilterChange('guests', parseInt(e.target.value))} className="input-field w-32">
                {[1,2,3,4,5,6,7,8].map(g => <option key={g} value={g}>{g} Guest{g > 1 ? 's' : ''}</option>)}
              </select>
              <select value={filters.rooms} onChange={(e) => handleFilterChange('rooms', parseInt(e.target.value))} className="input-field w-32">
                {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} Room{r > 1 ? 's' : ''}</option>)}
              </select>
              <button type="submit" className="btn-primary px-6 flex items-center gap-2 whitespace-nowrap">
                <Search className="w-4 h-4" aria-hidden="true" />
                Search
              </button>
            </div>
            <button 
              type="button"
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className={`btn-outline flex items-center gap-2 ${hasActiveFilters ? 'border-accent text-accent' : ''}`}
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              Filters {hasActiveFilters && <span className="bg-accent text-primary text-xs px-1.5 py-0.5 rounded-full">{[filters.minPrice, filters.maxPrice, filters.amenities.length].filter(Boolean).length}</span>}
            </button>
          </form>
        </div>
      </div>

      {/* Filter Panel */}
      {filterPanelOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setFilterPanelOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ${filterPanelOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0 md:shadow-none md:w-auto md:bg-transparent`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between md:hidden">
          <h3 className="font-semibold">Filters</h3>
          <button onClick={() => setFilterPanelOpen(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => handleFilterChange('minPrice', e.target.value)} className="input-field" />
              <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(amenity => (
                <label key={amenity.key} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors ${filters.amenities.includes(amenity.key) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 hover:border-primary/50'}`}>
                  <input type="checkbox" value={amenity.key} checked={filters.amenities.includes(amenity.key)} onChange={() => toggleAmenity(amenity.key)} className="w-4 h-4 text-primary" />
                  <span className="flex items-center gap-1 text-sm">{amenity.icon} {amenity.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} className="input-field">
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="pt-4 border-t border-gray-100 flex gap-2">
            <button onClick={clearFilters} className="btn-outline flex-1">Clear All</button>
            <button onClick={() => { searchLodges(); setFilterPanelOpen(false); }} className="btn-primary flex-1">Apply Filters</button>
          </div>
        </div>
      </aside>

      {/* Results */}
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">{totalResults} {totalResults === 1 ? 'Lodge' : 'Lodges'} Found</h1>
            <p className="text-gray-600">Showing {lodges.length} of {totalResults} results</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} className="input-field w-48">
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card overflow-hidden">
                <div className="animate-pulse bg-gray-200 h-48 w-full" />
                <div className="p-6 space-y-4">
                  <div className="animate-pulse bg-gray-200 h-6 w-3/4 rounded" />
                  <div className="animate-pulse bg-gray-200 h-4 w-1/2 rounded" />
                  <div className="animate-pulse bg-gray-200 h-4 w-1/3 rounded" />
                  <div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : lodges.length === 0 ? (
          <div className="text-center py-16">
            <MapPinIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No lodges found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search criteria or dates</p>
            <button onClick={clearFilters} className="btn-outline">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lodges.map(lodge => (
                <Link to={`/lodge/${lodge._id}`} key={lodge._id} className="card overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    {lodge.images?.[0]?.url ? (
                      <img src={lodge.images[0].url} alt={lodge.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-6xl" role="img" aria-label="Lodge">🏨</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-primary">
                      {lodge.distanceFromTemple ? `${lodge.distanceFromTemple} km from Temple` : 'Near Temple'}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors mb-1">
                      {lodge.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" aria-hidden="true" />
                      {lodge.address?.city}, {lodge.address?.state}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      {lodge.averageRating > 0 ? (
                        <>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                          <span className="font-semibold">{lodge.averageRating.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm">({lodge.reviewCount} reviews)</span>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">No reviews yet</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-2xl font-bold text-primary">₹{lodge.pricing?.basePrice || 0}</span>
                        <span className="text-gray-500 text-sm ml-1">/ night</span>
                      </div>
                      <span className="btn-primary px-4 py-2 text-sm">View Details</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

