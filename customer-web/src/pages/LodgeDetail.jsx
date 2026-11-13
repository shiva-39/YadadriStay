import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { 
  MapPin, Star, Heart, Shield, Truck, Wifi, Utensils, Bed, Waves,
  ChevronLeft, ChevronRight, MapPin as MapPinIcon, Calendar, Users, Check, X
} from 'lucide-react'
import { lodgesAPI, inventoryAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function LodgeDetail() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [lodge, setLodge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '')
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '')
  const [guests, setGuests] = useState(1)

  useEffect(() => {
    loadLodgeDetail()
  }, [id, checkIn, checkOut])

  const loadLodgeDetail = async () => {
    setLoading(true)
    try {
      const params = checkIn && checkOut ? { checkInDate: checkIn, checkOutDate: checkOut } : {}
      const response = await lodgesAPI.getById(id, params)
      setLodge(response.data.data)
    } catch (error) {
      console.error('Failed to load lodge:', error)
      toast.error('Failed to load lodge details')
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (newCheckIn, newCheckOut) => {
    setCheckIn(newCheckIn)
    setCheckOut(newCheckOut)
    setSearchParams({ checkIn: newCheckIn, checkOut: newCheckOut })
  }

  const handleBookRoom = (room) => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates first')
      return
    }
    setSelectedRoom(room)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!lodge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Lodge not found</h2>
          <Link to="/search" className="btn-primary inline-block mt-4">Back to Search</Link>
        </div>
      </div>
    )
  }

  const images = lodge.images?.length ? lodge.images.map(img => img.url) : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800']

  const amenitiesList = [
    { key: 'wifi', label: 'Free WiFi', icon: Wifi },
    { key: 'parking', label: 'Parking', icon: Shield },
    { key: 'ac', label: 'Air Conditioning', icon: Waves },
    { key: 'restaurant', label: 'Restaurant', icon: Utensils },
    { key: 'roomService', label: 'Room Service', icon: Heart },
    { key: 'laundry', label: 'Laundry', icon: '🧺' },
    { key: 'pickupDrop', label: 'Pickup/Drop', icon: Truck },
    { key: 'hotWater', label: 'Hot Water', icon: Waves },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery */}
      <div className="relative h-[500px] md:h-[600px]">
        <div className="relative h-full">
          <img
            src={images[activeImage]}
            alt={lodge.name}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
                <button
                  onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors pointer-events-auto"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-primary" />
                </button>
                <button
                  onClick={() => setActiveImage((activeImage + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors pointer-events-auto"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-primary" />
                </button>
              </div>
            )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`w-2 h-2 rounded-full transition-colors ${activeImage === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Link to="/search" className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors">
            <MapPin className="w-5 h-5 text-primary" />
          </Link>
          <Link to="/search" className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </div>

      {/* Lodge Info */}
      <div className="container-custom -mt-6 pb-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <MapPinIcon className="w-4 h-4" aria-hidden="true" />
                <span>{lodge.address?.city}, {lodge.address?.state} - {lodge.address?.pincode}</span>
                {lodge.distanceFromTemple && (
                  <> | <span className="text-primary font-medium">{lodge.distanceFromTemple} km from Temple</span> </>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{lodge.name}</h1>
              <p className="text-gray-600 mt-2">{lodge.shortDescription || lodge.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center bg-primary/10 rounded-xl px-4 py-3">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                <div className="text-2xl font-bold text-primary">{lodge.averageRating || 0}</div>
                <div className="text-sm text-gray-500">({lodge.reviewCount || 0} reviews)</div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-8">
            <h3 className="section-title mb-4">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {amenitiesList.map(amenity => (
                <div key={amenity.key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl" role="img">{amenity.icon === '🚿' ? '🚿' : amenity.icon === '🧺' ? '🧺' : amenity.icon === '🚗' ? '🚗' : ''}</span>
                  <span className="text-sm text-gray-700" aria-hidden="true">{amenity.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Room Categories */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Available Rooms</h3>
              <div className="flex items-center gap-2">
                <label htmlFor="detail-checkIn" className="text-sm text-gray-600">Check-in</label>
                <input
                  id="detail-checkIn"
                  type="date"
                  value={checkIn}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange(e.target.value, checkOut)}
                  className="input-field w-40 py-2"
                />
                <label htmlFor="detail-checkOut" className="text-sm text-gray-600">Check-out</label>
                <input
                  id="detail-checkOut"
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => handleDateChange(checkIn, e.target.value)}
                  className="input-field w-40 py-2"
                />
                <select value={guests} onChange={(e) => setGuests(parseInt(e.target.value))} className="input-field w-32 py-2">
                  {[1,2,3,4,5,6,7,8].map(g => <option key={g} value={g}>{g} Guest{g > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>

            {lodge.roomCategories?.map(room => (
              <div key={room._id} className="card p-5 mb-4 group">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-1">{room.name}</h4>
                    <p className="text-gray-600 text-sm mb-2">{room.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {room.capacity?.maxOccupancy || room.capacity?.maxOccupancy || 2} Guests</span>
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {room.totalRooms} Rooms</span>
                      <span className="flex items-center gap-1"><HomeIcon className="w-4 h-4" /> {room.type} • {room.acType}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:w-64 md:flex-shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">₹{room.pricing?.basePrice || room.pricing?.basePrice || 0}</div>
                      <div className="text-gray-500 text-sm">/ night</div>
                    </div>
                    <button
                      onClick={() => handleBookRoom(room)}
                      disabled={!checkIn || !checkOut}
                      className={`btn-primary w-full md:w-auto ${!checkIn || !checkOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Select Room
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Policies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="section-title mb-4">Policies</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Check-in</dt>
                  <dd className="font-medium">{lodge.policies?.checkInTime || '12:00 PM'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Check-out</dt>
                  <dd className="font-medium">{lodge.policies?.checkOutTime || '11:00 AM'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Cancellation</dt>
                  <dd className="font-medium capitalize">{lodge.policies?.cancellationPolicy || 'moderate'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Advance Payment</dt>
                  <dd className="font-medium">{lodge.policies?.advancePaymentPercentage || 20}%</dd>
                </div>
              </dl>
            </div>
            <div className="card p-6">
              <h3 className="section-title mb-4">House Rules</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> No smoking in rooms</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> Pets not allowed</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> Valid ID required at check-in</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> Quiet hours: 10 PM - 7 AM</li>
              </ul>
            </div>
          </div>

          {/* Reviews Summary */}
          {lodge.reviews && lodge.reviews.length > 0 && (
            <div className="card p-6 mt-6">
              <h3 className="section-title mb-4">Recent Reviews</h3>
              <div className="space-y-4">
                {lodge.reviews.slice(0, 3).map((review, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">{review.customerName?.charAt(0) || 'U'}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{review.customerName || 'Guest'}</p>
                        <div className="flex items-center gap-1 text-sm text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-2">{review.comment}</p>
                  </div>
                ))}
              </div>
              <Link to={`/lodge/${lodge._id}/reviews`} className="btn-outline mt-4 inline-block">View All Reviews</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

