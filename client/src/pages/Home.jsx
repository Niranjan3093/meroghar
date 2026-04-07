import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiHome, FiUsers, FiShield, FiMapPin, FiTrendingUp, FiAward, FiKey, FiStar } from 'react-icons/fi'
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
      <section className="relative text-white py-12 md:py-20 lg:py-28 overflow-hidden" style={{
        backgroundImage: 'url(/assets/dashboard.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {/* Animated Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-800/90 to-accent-900/85"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Logo and Animated Title with gradient */}
            <div className="text-center mb-6 md:mb-8 animate-fade-in">
              <div className="mb-4 md:mb-6 flex justify-center">
                <img 
                  src="/assets/app_logo.png" 
                  alt="MeroGhar Logo" 
                  className="h-16 md:h-24 w-auto object-contain drop-shadow-xl hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
                Find Your Perfect <span className="bg-gradient-to-r from-accent-300 to-accent-200 bg-clip-text text-transparent">Rental Home</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-2xl text-primary-100 mb-8 md:mb-10 max-w-2xl mx-auto">
                MeroGhar connects property owners with tenants. Manage leases, payments, and maintenance all in one place.
              </p>
            </div>
            
            {/* Search Bar - Modern Design */}
            <form onSubmit={handleSearch} className="mb-6 md:mb-8">
              <div className="bg-white rounded-2xl p-2 md:p-4 flex flex-col sm:flex-row items-center gap-3 max-w-3xl mx-auto shadow-2xl hover:shadow-3xl transition-shadow">
                <FiMapPin className="text-primary-600 flex-shrink-0 hidden sm:block text-xl" />
                <input
                  type="text"
                  placeholder="Search by location, property type, price..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 px-4 md:px-6 py-3 md:py-4 text-slate-900 focus:outline-none w-full sm:w-auto text-sm md:text-base placeholder-slate-400"
                />
                <button 
                  type="submit"
                  className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-sm md:text-base shadow-lg"
                >
                  <FiSearch className="text-lg" />
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* CTA Buttons - Modern Stack */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
              <Link 
                to="/register?role=tenant" 
                className="bg-white text-primary-700 px-8 md:px-10 py-3 md:py-4 rounded-lg font-bold hover:bg-primary-50 transition-all transform hover:scale-105 text-center text-sm md:text-base shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
              >
                <FiHome className="text-xl" />
                Find a Home
              </Link>
              <Link 
                to="/register?role=host" 
                className="bg-accent-500 text-white px-8 md:px-10 py-3 md:py-4 rounded-lg font-bold hover:bg-accent-600 transition-all transform hover:scale-105 text-center text-sm md:text-base shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
              >
                <FiKey className="text-xl" />
                List Your Property
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Premium Cards */}
      <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-white via-primary-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 md:mb-6">
              Why Choose <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">MeroGhar?</span>
            </h2>
            <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">Everything you need for seamless property management and rental experience</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  onMouseEnter={() => setHoveredCard(feature.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`p-8 md:p-10 rounded-2xl transition-all duration-300 transform cursor-pointer card-premium group ${
                    hoveredCard === feature.id 
                      ? 'shadow-2xl scale-105 border-accent-300' 
                      : 'hover:shadow-2xl'
                  }`}
                >
                  <div className="flex justify-center mb-6 md:mb-8">
                    <div className={`bg-gradient-to-br from-primary-100 to-accent-100 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 group-hover:shadow-lg ${hoveredCard === feature.id ? 'scale-110 rotate-12' : 'group-hover:scale-105'}`}>
                      <Icon className="text-4xl md:text-5xl bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent" />
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-center text-slate-900 group-hover:text-primary-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-center text-sm md:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works - Interactive Timeline */}
      <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-r from-primary-900 via-primary-800 to-accent-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6">
              Get Started in 4 Simple <span className="text-accent-300">Steps</span>
            </h2>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto">Join our community and find your perfect home or tenant</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative">
            {/* Connecting Lines - Desktop Only */}
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-400 to-transparent"></div>

            {steps.map((step, index) => (
              <div
                key={step.number}
                onMouseEnter={() => setActiveStep(step.number)}
                onMouseLeave={() => setActiveStep(null)}
                className="text-center group relative"
              >
                <div className="relative z-20">
                  <div className={`bg-gradient-to-br from-accent-400 to-accent-500 text-white w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl md:text-3xl font-bold transition-all duration-300 transform shadow-lg ${
                    activeStep === step.number ? 'scale-125 shadow-2xl ring-4 ring-accent-200' : 'group-hover:scale-110 group-hover:shadow-xl'
                  }`}>
                    {step.number}
                  </div>
                  <h3 className="font-bold mb-3 text-white text-lg md:text-xl group-hover:text-accent-200 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-primary-100 text-sm md:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Key Metrics */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 hover:shadow-xl transition-all transform hover:scale-105 group">
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent group-hover:from-primary-700 group-hover:to-accent-600">50K+</p>
              <p className="text-slate-600 text-sm md:text-base mt-2 font-semibold">Active Users</p>
            </div>
            <div className="text-center p-6 md:p-8 rounded-2xl bg-gradient-to-br from-accent-50 to-orange-100 hover:shadow-xl transition-all transform hover:scale-105 group">
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent-500 to-accent-600 bg-clip-text text-transparent group-hover:from-accent-600 group-hover:to-orange-600">10K+</p>
              <p className="text-slate-600 text-sm md:text-base mt-2 font-semibold">Properties</p>
            </div>
            <div className="text-center p-6 md:p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 hover:shadow-xl transition-all transform hover:scale-105 group">
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-emerald-700">100%</p>
              <p className="text-slate-600 text-sm md:text-base mt-2 font-semibold">Verified</p>
            </div>
            <div className="text-center p-6 md:p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-100 hover:shadow-xl transition-all transform hover:scale-105 group">
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-cyan-700">24/7</p>
              <p className="text-slate-600 text-sm md:text-base mt-2 font-semibold">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Premium Call to Action */}
      <section className="relative text-white py-12 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-800 to-accent-900"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg width=%22120%22 height=%22120%22 viewBox=%220 0 120 120%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M60 60v15m-15-15h30M60 15v30M30 60v15m60-15v15m0-45h15M75 15v30M15 75h15m60 0h15%22 transform=%22rotate(45 60 60)%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-fade-in max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
              Ready to Get <span className="text-accent-300">Started?</span>
            </h2>
            <p className="text-lg md:text-xl text-primary-100 mb-8 md:mb-10">
              Join thousands of happy hosts and tenants transforming their rental experience with MeroGhar
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/register" 
                className="bg-white text-primary-700 px-8 md:px-12 py-4 md:py-5 rounded-lg font-bold hover:bg-primary-50 transition-all transform hover:scale-105 inline-block shadow-2xl hover:shadow-3xl text-base md:text-lg flex items-center justify-center gap-2"
              >
                <FiStar className="text-xl" />
                Create Free Account
              </Link>
              <Link 
                to="/properties" 
                className="border-2 border-white text-white px-8 md:px-12 py-4 md:py-5 rounded-lg font-bold hover:bg-white/10 transition-all transform hover:scale-105 inline-block shadow-lg text-base md:text-lg flex items-center justify-center gap-2"
              >
                <FiSearch className="text-xl" />
                Browse Properties
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
