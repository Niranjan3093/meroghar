import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersAPI } from '../../../utils/api'
import { toast } from 'react-toastify'
import { FiHeart, FiMapPin, FiHome, FiTrash2, FiExternalLink } from 'react-icons/fi'

function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getFavorites()
      setFavorites(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
      toast.error('Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (propertyId) => {
    try {
      await usersAPI.removeFavorite(propertyId)
      setFavorites(prev => prev.filter(p => p._id !== propertyId))
      toast.success('Removed from favorites')
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      toast.error('Failed to remove from favorites')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FiHeart className="mr-3 text-red-500" />
          My Favorites
        </h1>
        <p className="text-gray-500 mt-1">Properties you've saved for later</p>
      </div>

      {/* Favorites Grid */}
      {favorites.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <FiHeart className="mx-auto text-5xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Favorites Yet</h3>
          <p className="text-gray-500 mb-6">Start adding properties to your favorites to see them here</p>
          <Link to="/properties" className="btn-primary inline-flex items-center">
            <FiHome className="mr-2" />
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((property) => (
            <div
              key={property._id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition group"
            >
              <Link to={`/properties/${property._id}`} className="block">
                <div className="relative h-48 overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0].url}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <FiHome className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded capitalize">
                      {property.propertyType}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{property.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center mb-3">
                    <FiMapPin className="mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {property.address?.street}, {property.address?.city}
                    </span>
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    {property.bedrooms && <span>{property.bedrooms} Bed</span>}
                    {property.bathrooms && <span>{property.bathrooms} Bath</span>}
                    {property.area?.value && <span>{property.area.value} {property.area.unit}</span>}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-lg font-bold text-primary-600">
                      NPR {property.rent?.toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">/mo</span>
                    </p>
                    {property.host && (
                      <div className="text-xs text-gray-500">
                        by {property.host.name}
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex gap-2">
                <Link
                  to={`/properties/${property._id}`}
                  className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition text-center flex items-center justify-center"
                >
                  <FiExternalLink className="mr-2" size={14} />
                  View Details
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleRemoveFavorite(property._id)
                  }}
                  className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                  title="Remove from favorites"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {favorites.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} in your favorites
        </div>
      )}
    </div>
  )
}

export default Favorites
