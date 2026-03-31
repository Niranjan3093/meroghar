import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiHome, FiUsers, FiShield, FiMapPin, FiTrendingUp, FiAward } from 'react-icons/fi'
import { useState } from 'react'

function Home() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [hoveredCard, setHoveredCard] = useState(null)
  const [activeStep, setActiveStep] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchInput)}`)
    } else {
      navigate('/properties')
    }
  }

  const features = [
    {
      id: 1,
      icon: FiHome,
      title: 'Verified Properties',
      description: 'All properties are verified by our admin team for your safety and trust.',
      color: 'primary'
    },
    {
      id: 2,
      icon: FiUsers,
      title: 'Easy Communication',
      description: 'Real-time chat between hosts and tenants for seamless communication.',
      color: 'primary'
    },
    {
      id: 3,
      icon: FiShield,
      title: 'Secure Payments',
      description: 'Integrated payment gateways for safe and secure rent transactions.',
      color: 'primary'
    }
  ]

  const steps = [
    { number: 1, title: 'Sign Up', description: 'Create your account as a host or tenant' },
    { number: 2, title: 'Browse / List', description: 'Search properties or list your own' },
    { number: 3, title: 'Connect', description: 'Chat with hosts/tenants and schedule viewings' },
    { number: 4, title: 'Move In', description: 'Sign lease, make payment, and move in!' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative text-white py-12 md:py-20 lg:py-24 overflow-hidden" style={{
        backgroundImage: 'url(/assets/dashboard.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-700/85 via-primary-800/85 to-primary-900/85"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Animated Title */}
            <div className="text-center mb-6 md:mb-8 animate-fade-in">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                Find Your Perfect Rental Home
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-primary-100 mb-8 md:mb-10">
                MeroGhar connects property owners with tenants. Manage leases, payments, and maintenance all in one place.
              </p>
            </div>
            
            {/* Search Bar - Responsive */}
            <form onSubmit={handleSearch} className="mb-6 md:mb-8">
              <div className="bg-white rounded-lg p-2 md:p-3 flex flex-col sm:flex-row items-center gap-2 max-w-3xl mx-auto shadow-lg">
                <FiMapPin className="text-primary-600 flex-shrink-0 hidden sm:block" />
                <input
                  type="text"
                  placeholder="Search by location, property type..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 px-3 md:px-4 py-2 md:py-3 text-gray-800 focus:outline-none w-full sm:w-auto text-sm md:text-base"
                />
                <button 
                  type="submit"
                  className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 text-sm md:text-base hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <FiSearch />
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* CTA Buttons - Responsive Stack */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
              <Link 
                to="/register?role=tenant" 
                className="bg-white text-primary-600 px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all transform hover:scale-105 text-center text-sm md:text-base"
              >
                Find a Home
              </Link>
              <Link 
                to="/register?role=host" 
                className="bg-primary-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-primary-400 transition-all transform hover:scale-105 text-center text-sm md:text-base"
              >
                List Your Property
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Interactive Cards */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-900 mb-3 md:mb-4">
              Why Choose MeroGhar?
            </h2>
            <p className="text-gray-600 text-sm md:text-base">Everything you need for seamless property management</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  onMouseEnter={() => setHoveredCard(feature.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`p-6 md:p-8 rounded-xl transition-all duration-300 transform cursor-pointer ${
                    hoveredCard === feature.id 
                      ? 'bg-primary-50 shadow-xl scale-105 border-2 border-primary-300' 
                      : 'bg-primary-50 shadow-md border-2 border-transparent hover:shadow-xl'
                  }`}
                >
                  <div className="flex justify-center mb-4 md:mb-6">
                    <div className={`bg-primary-100 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-transform duration-300 ${hoveredCard === feature.id ? 'scale-110 rotate-12' : ''}`}>
                      <Icon className="text-3xl md:text-4xl text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-center text-primary-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-center text-sm md:text-base">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works - Interactive Steps */}
      <section className="py-12 md:py-16 lg:py-20 bg-primary-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-900 mb-3 md:mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-sm md:text-base">Simple steps to get started</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                onMouseEnter={() => setActiveStep(step.number)}
                onMouseLeave={() => setActiveStep(null)}
                className="text-center group"
              >
                {/* Connector Line - Hidden on mobile */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute w-20 h-1 bg-primary-300 top-6 "
                    style={{ left: 'calc(50% + 40px)', right: 'auto' }}
                  />
                )}

                <div className="relative">
                  <div className={`bg-primary-600 text-white w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-lg md:text-2xl font-bold transition-all duration-300 transform ${
                    activeStep === step.number ? 'scale-125 shadow-lg bg-primary-700' : 'group-hover:scale-110 group-hover:shadow-md'
                  }`}>
                    {step.number}
                  </div>
                  <h3 className="font-semibold mb-2 text-primary-900 text-sm md:text-base">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center p-4 md:p-6 rounded-lg bg-primary-50 hover:shadow-md transition-shadow">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-700">50K+</p>
              <p className="text-gray-600 text-xs md:text-sm mt-2">Active Users</p>
            </div>
            <div className="text-center p-4 md:p-6 rounded-lg bg-primary-50 hover:shadow-md transition-shadow">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-700">10K+</p>
              <p className="text-gray-600 text-xs md:text-sm mt-2">Properties</p>
            </div>
            <div className="text-center p-4 md:p-6 rounded-lg bg-primary-50 hover:shadow-md transition-shadow">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-700">100%</p>
              <p className="text-gray-600 text-xs md:text-sm mt-2">Verified</p>
            </div>
            <div className="text-center p-4 md:p-6 rounded-lg bg-primary-50 hover:shadow-md transition-shadow">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-700">24/7</p>
              <p className="text-gray-600 text-xs md:text-sm mt-2">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Final Call to Action */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-primary-100 mb-8 md:mb-10">
            Join thousands of happy hosts and tenants on MeroGhar
          </p>
          <Link 
            to="/register" 
            className="bg-white text-primary-600 px-8 md:px-12 py-3 md:py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all transform hover:scale-105 inline-block text-sm md:text-base shadow-lg"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
