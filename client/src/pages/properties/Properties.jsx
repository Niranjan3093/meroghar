import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { propertiesAPI } from '../../utils/api'
import { FiSearch, FiMapPin, FiHome, FiFilter } from 'react-icons/fi'
import { toast } from 'react-toastify'

function Properties() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    propertyType: searchParams.get('propertyType') || '',
    minRent: searchParams.get('minRent') || '',
    maxRent: searchParams.get('maxRent') || '',
    amenities: searchParams.get('amenities') || ''
  })

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  const cities = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Birgunj']
  const propertyTypes = ['apartment', 'room', 'house', 'office', 'studio', 'villa']

  useEffect(() => {
    fetchProperties()
  }, [searchParams])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const params = {
        page: searchParams.get('page') || 1,
        limit: 12,
        city: searchParams.get('city') || undefined,
        propertyType: searchParams.get('propertyType') || undefined,
        minRent: searchParams.get('minRent') || undefined,
        maxRent: searchParams.get('maxRent') || undefined,
        amenities: searchParams.get('amenities') || undefined
      }

      Object.keys(params).forEach(key => params[key] === undefined && delete params[key])

      const response = await propertiesAPI.getAll(params)
      setProperties(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      handleSearchQuery()
    }
  }

  const handleSearchQuery = async () => {
    try {
      setLoading(true)
      const response = await propertiesAPI.search(searchQuery)
      setProperties(response.data.data)
      setPagination({ page: 1, pages: 1, total: response.data.count })
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (filters.city) params.set('city', filters.city)
    if (filters.propertyType) params.set('propertyType', filters.propertyType)
    if (filters.minRent) params.set('minRent', filters.minRent)
    if (filters.maxRent) params.set('maxRent', filters.maxRent)
    if (filters.amenities) params.set('amenities', filters.amenities)
    setSearchParams(params)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({ city: '', propertyType: '', minRent: '', maxRent: '', amenities: '' })
    setSearchParams({})
    setSearchQuery('')
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage)
    setSearchParams(params)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Properties</h1>
        <p className="text-gray-600">Find your perfect rental home from verified listings</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by location, title..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <FiFilter className="mr-2" />
            Filters
            {Object.values(filters).some(v => v) && (
              <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city.toLowerCase()}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                <select
                  value={filters.propertyType}
                  onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Rent (NPR)</label>
                <input
                  type="number"
                  value={filters.minRent}
                  onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Rent (NPR)</label>
                <input
                  type="number"
                  value={filters.maxRent}
                  onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                  placeholder="Any"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              <button onClick={clearFilters} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition">
                Clear All
              </button>
              <button onClick={applyFilters} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {loading ? 'Loading...' : `${pagination.total} properties found`}
        </p>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <FiHome className="mx-auto text-5xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or search criteria</p>
          <button onClick={clearFilters} className="text-primary-600 hover:text-primary-700 font-medium">
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <Link
                key={property._id}
                to={`/properties/${property._id}`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition group"
              >
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
                    <span className="line-clamp-1">{property.address?.street}, {property.address?.city}</span>
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    {property.bedrooms && <span>{property.bedrooms} Bed</span>}
                    {property.bathrooms && <span>{property.bathrooms} Bath</span>}
                    {property.area?.value && <span>{property.area.value} {property.area.unit}</span>}
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-lg font-bold text-primary-600">
                      NPR {property.rent?.toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">/mo</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center mt-8 gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 rounded-lg ${
                    pagination.page === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Properties
