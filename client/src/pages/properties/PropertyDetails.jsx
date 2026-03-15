import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { propertiesAPI, messagesAPI, usersAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-toastify'
import UserAvatar from '../../components/UserAvatar'
import GoogleMap from '../../components/GoogleMap'
import { 
  FiMapPin, FiHome, FiUser, FiPhone, FiMail, FiCalendar, 
  FiDollarSign, FiStar, FiHeart, FiShare2, FiChevronLeft, 
  FiChevronRight, FiMessageSquare, FiCheck, FiEye
} from 'react-icons/fi'

function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showContactForm, setShowContactForm] = useState(false)
  const [message, setMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    fetchProperty()
  }, [id])

  useEffect(() => {
    if (user && id) {
      checkFavoriteStatus()
    }
  }, [user, id])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const response = await propertiesAPI.getById(id)
      setProperty(response.data.data)
    } catch (error) {
      console.error('Failed to fetch property:', error)
      toast.error('Failed to load property details')
    } finally {
      setLoading(false)
    }
  }

  const checkFavoriteStatus = async () => {
    try {
      const response = await usersAPI.checkFavorite(id)
      setIsFavorite(response.data.data.isFavorite)
    } catch (error) {
      console.error('Failed to check favorite status:', error)
    }
  }

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please login to add favorites')
      return
    }

    try {
      setFavoriteLoading(true)
      if (isFavorite) {
        await usersAPI.removeFavorite(id)
        setIsFavorite(false)
        toast.success('Removed from favorites')
      } else {
        await usersAPI.addFavorite(id)
        setIsFavorite(true)
        toast.success('Added to favorites')
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      toast.error(error.response?.data?.message || 'Failed to update favorites')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Check out this property: ${property.title}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast.success('Shared successfully!')
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error)
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(window.location.href)
          toast.success('Link copied to clipboard!')
        } catch (clipboardError) {
          toast.error('Failed to share')
        }
      }
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to contact the host')
      return
    }
    if (user._id === property.host._id) {
      toast.error('You are in public view mode. You cannot message yourself.')
      return
    }
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    try {
      setSendingMessage(true)
      
      // First, get or create the conversation
      const convResponse = await messagesAPI.getOrCreateConversation({
        receiverId: property.host._id,
        propertyId: property._id
      })
      
      const conversation = convResponse.data.data
      
      // Then send the message
      await messagesAPI.send({
        conversationId: conversation._id,
        content: message
      })
      
      toast.success('Message sent successfully!')
      setMessage('')
      setShowContactForm(false)
      
      // Navigate to messages with the conversation open
      navigate(`/dashboard/messages?conversation=${conversation._id}`)
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const nextImage = () => {
    if (property?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
    }
  }

  const prevImage = () => {
    if (property?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FiHome className="mx-auto text-6xl text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
        <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
        <Link to="/properties" className="btn-primary">Browse Properties</Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li><Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link to="/properties" className="text-gray-500 hover:text-gray-700">Properties</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium truncate max-w-xs">{property.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-6">
            {property.images && property.images.length > 0 ? (
              <>
                <div className="aspect-video">
                  <img
                    src={property.images[currentImageIndex]?.url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white transition"
                    >
                      <FiChevronLeft className="text-xl" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white transition"
                    >
                      <FiChevronRight className="text-xl" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {property.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="aspect-video flex items-center justify-center">
                <FiHome className="w-20 h-20 text-gray-300" />
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary-100 text-primary-600 text-sm px-3 py-1 rounded-full capitalize">
                    {property.propertyType}
                  </span>
                  {property.verificationStatus === 'verified' && (
                    <span className="bg-green-100 text-green-600 text-sm px-3 py-1 rounded-full flex items-center">
                      <FiCheck className="mr-1" /> Verified
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
                <p className="text-gray-600 flex items-center">
                  <FiMapPin className="mr-2" />
                  {property.address?.street}, {property.address?.city}
                  {property.address?.state && `, ${property.address.state}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className={`p-2 border rounded-lg hover:bg-gray-50 transition ${
                    isFavorite 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200'
                  }`}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <FiHeart className={`${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  title="Share property"
                >
                  <FiShare2 className="text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              <span className="flex items-center"><FiEye className="mr-1" /> {property.views} views</span>
              {property.rating > 0 && (
                <span className="flex items-center">
                  <FiStar className="mr-1 text-yellow-500 fill-current" /> {property.rating} ({property.numReviews} reviews)
                </span>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
              {property.bedrooms && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
                  <p className="text-sm text-gray-600">Bedrooms</p>
                </div>
              )}
              {property.bathrooms && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                  <p className="text-sm text-gray-600">Bathrooms</p>
                </div>
              )}
              {property.area?.value && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{property.area.value}</p>
                  <p className="text-sm text-gray-600">{property.area.unit}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 capitalize">{property.leaseDuration}</p>
                <p className="text-sm text-gray-600">Lease</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
                    >
                      {amenity.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {property.location?.coordinates?.length === 2 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Property Location</h2>
                <GoogleMap
                  initialLocation={{
                    lat: property.location.coordinates[1],
                    lng: property.location.coordinates[0]
                  }}
                  readOnly={true}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Coordinates: {property.location.coordinates[1].toFixed(6)}, {property.location.coordinates[0].toFixed(6)}
                </p>
              </div>
            )}

            {(!property.location?.coordinates || property.location.coordinates.length !== 2) && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Property Location</h2>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">Location not available for this property.</p>
                </div>
              </div>
            )}

            {/* Rules */}
            {property.rules && property.rules.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">House Rules</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {property.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Pricing Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 sticky top-6">
            <div className="mb-4">
              <p className="text-3xl font-bold text-primary-600">
                NPR {property.rent?.toLocaleString()}
                <span className="text-lg font-normal text-gray-500">/month</span>
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Security Deposit</span>
                <span className="font-medium">NPR {property.securityDeposit?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Minimum Lease</span>
                <span className="font-medium capitalize">{property.leaseDuration}</span>
              </div>
              {property.availableFrom && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available From</span>
                  <span className="font-medium">
                    {new Date(property.availableFrom).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Move-in Cost</span>
                <span className="font-bold text-lg">
                  NPR {((property.rent || 0) + (property.securityDeposit || 0)).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500">First month rent + security deposit</p>
            </div>

            {user && user._id === property.host?._id ? (
              <div className="w-full bg-blue-50 text-blue-700 text-center py-3 px-4 rounded-lg text-sm font-medium">
                You are viewing this property in public view mode
              </div>
            ) : (
              <button
                onClick={() => setShowContactForm(true)}
                className="w-full btn-primary flex items-center justify-center"
              >
                <FiMessageSquare className="mr-2" />
                Contact Host
              </button>
            )}
          </div>

          {/* Host Card */}
          {property.host && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Property Host</h3>
              <div className="flex items-center mb-4">
                <UserAvatar name={property.host.name} avatar={property.host.avatar} size="lg" />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{property.host.name}</p>
                  {property.host.rating > 0 && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <FiStar className="text-yellow-500 fill-current mr-1" />
                      {property.host.rating} ({property.host.numReviews} reviews)
                    </p>
                  )}
                </div>
              </div>
              
              {user && user._id !== property.host._id && (
                <div className="space-y-2 text-sm">
                  {property.host.email && (
                    <p className="flex items-center text-gray-600">
                      <FiMail className="mr-2" /> {property.host.email}
                    </p>
                  )}
                  {property.host.phone && (
                    <p className="flex items-center text-gray-600">
                      <FiPhone className="mr-2" /> {property.host.phone}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Host</h3>
            <form onSubmit={handleSendMessage}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={`Hi, I'm interested in "${property.title}". Is it still available?`}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="btn-primary"
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyDetails
