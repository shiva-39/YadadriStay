import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Calendar, Heart, Star, Shield, Truck, Wifi, Utensils, Bed, Waves } from 'lucide-react'
import { lodgesAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Home() {
  const [featuredLodges, setFeaturedLodges] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchDates, setSearchDates] = useState({
    checkIn: '',
    checkOut: '',
  })

  useEffect(() => {
    loadFeaturedLodges()
    // Set default dates
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)
    setSearchDates({
      checkIn: tomorrow.toISOString().split('T')[0],
      checkOut: dayAfter.toISOString().split('T')[0],
    })
  }, [])

  const loadFeaturedLodges = async () => {
    try {
      const response = await lodgesAPI.getFeatured()
      setFeaturedLodges(response.data.data.lodges || [])
    } catch (error) {
      console.error('Failed to load featured lodges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchDates.checkIn || !searchDates.checkOut) {
      toast.error('Please select check-in and check-out dates')
      return
    }
    window.location.href = `/search?checkIn=${searchDates.checkIn}&checkOut=${searchDates.checkOut}`
  }

  const amenities = [
    { icon: Wifi, label: 'Free WiFi' },
    { icon: Utensils, label: 'Restaurant' },
    { icon: Waves, label: 'Hot Water' },
    { icon: Bed, label: 'Comfortable Beds' },
    { icon: Shield, label: '24/7 Security' },
    { icon: Truck, label: 'Pickup Service' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-light to-accent-light text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container-custom py-20 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect Stay Near <br />
              <span className="text-accent">Yadadri Temple</span>
            </h1>
            <p className="text-xl text-primary-light mb-8 max-w-2xl">
              Book comfortable, affordable lodges near the sacred Yadadri Lakshmi Narasimha Swamy Temple. 
              Verified properties, secure payments, and 24/7 support.
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); window.location.href = `/search?checkIn=${document.getElementById('home-checkIn').value}&checkOut=${document.getElementById('home-checkOut').value}`; } } className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="home-checkIn" className="block text-sm font-medium text-gray-600 mb-1">Check-in</label>
                  <input
                    id="home-checkIn"
                    type="date"
                    defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="home-checkOut" className="block text-sm font-medium text-gray-600 mb-1">Check-out</label>
                  <input
                    id="home-checkOut"
                    type="date"
                    defaultValue={new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
                <button type="submit" className="btn-accent w-full py-4 text-lg font-semibold rounded-xl hover:bg-accent-light transition-colors flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" aria-hidden="true" />
                  Search Lodges
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {amenities.map((amenity, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <amenity.icon className="w-8 h-8 text-primary group-hover:text-white transition-colors" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900">{amenity.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Lodges */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="page-title">Featured Lodges</h2>
            <Link to="/search" className="btn-outline">View All</Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="skeleton h-48 w-full" />
                  <div className="p-6 space-y-4">
                    <div className="skeleton h-6 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredLodges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No featured lodges available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredLodges.slice(0, 6).map((lodge) => (
                <Link to={`/lodge/${lodge._id}`} key={lodge._id} className="card overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    {lodge.images?.[0]?.url ? (
                      <img
                        src={lodge.images[0].url}
                        alt={lodge.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
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
                      <MapPin className="w-4 h-4" aria-hidden="true" />
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
                        <span className="text-2xl font-bold text-primary">₹{lodge.pricing?.basePrice || lodge.pricing?.basePrice || 0}</span>
                        <span className="text-gray-500 text-sm ml-1">/ night</span>
                      </div>
                      <span className="btn-primary px-4 py-2 text-sm">Book Now</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="page-title text-center mb-12">Why Choose Yadadri Stay?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Properties</h3>
              <p className="text-gray-600">All lodges are personally verified for quality, safety, and hygiene standards.</p>
            </div>
            <div className="text-center p-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Heart className="w-10 h-10 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">UPI-based payments with admin verification. Your money is safe until check-in.</p>
            </div>
            <div className="text-center p-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Truck className="w-10 h-10 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Dedicated customer support for booking, payment, and stay-related queries.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-light text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready for Your Pilgrimage?</h2>
          <p className="text-xl text-primary-light mb-8 max-w-2xl mx-auto">
            Book your stay near Yadadri Temple today. Secure, comfortable, and hassle-free.
          </p>
          <Link to="/search" className="btn-secondary text-lg px-10 py-4 inline-flex items-center gap-2">
            <Search className="w-5 h-5" aria-hidden="true" />
            Find Your Lodge
          </Link>
        </div>
      </section>
    </div>
  )
}

