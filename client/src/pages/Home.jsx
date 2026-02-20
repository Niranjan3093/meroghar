import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiHome, FiUsers, FiShield, FiMapPin, FiTrendingUp, FiAward, FiKey, FiUser, FiList, FiMessageCircle, FiCheckCircle, FiFileText, FiCreditCard, FiTool, FiBarChart2, FiClock, FiArrowRight } from 'react-icons/fi'
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
      icon: FiSearch,
      title: 'Smart Property Search',
      description: 'Find your ideal home with advanced filters for location, price, amenities, and more. View properties on an interactive map.'
    },
    {
      id: 2,
      icon: FiFileText,
      title: 'Digital Contracts',
      description: 'Sign lease agreements digitally with secure e-signatures. No paperwork, no hassle — legally binding and instantly accessible.'
    },
    {
      id: 3,
      icon: FiCreditCard,
      title: 'Secure Payments',
      description: 'Pay rent and deposits through Khalti or eSewa. Automated reminders and digital receipts for every transaction.'
    },
    {
      id: 4,
      icon: FiMessageCircle,
      title: 'Real-time Chat',
      description: 'Communicate directly with hosts or tenants. Schedule viewings, negotiate terms, and get quick responses.'
    },
    {
      id: 5,
      icon: FiTool,
      title: 'Maintenance Tracking',
      description: 'Report and track maintenance issues with photos. Get updates on repair status and resolution times.'
    },
    {
      id: 6,
      icon: FiBarChart2,
      title: 'Analytics Dashboard',
      description: 'Hosts get insights on earnings, occupancy rates, and market trends. Make data-driven decisions.'
    },
    {
      id: 7,
      icon: FiShield,
      title: 'Verified Users',
      description: 'All users and properties go through verification. Rent with confidence knowing everyone is authenticated.'
    },
    {
      id: 8,
      icon: FiClock,
      title: 'Automated Renewals',
      description: 'Get timely renewal reminders. Easily extend leases or gracefully end them with proper notice.'
    }
  ]

  const steps = [
    { 
      number: 1, 
      title: 'Sign Up', 
      description: 'Create your account as a host or tenant',
      icon: FiUser,
      link: '/register'
    },
    { 
      number: 2, 
      title: 'Browse / List', 
      description: 'Search properties or list your own',
      icon: FiList,
      link: '/properties'
    },
    { 
      number: 3, 
      title: 'Connect', 
      description: 'Chat with hosts/tenants and schedule viewings',
      icon: FiMessageCircle,
      link: '/dashboard'
    },
    { 
      number: 4, 
      title: 'Move In', 
      description: 'Sign lease, make payment, and move in!',
      icon: FiCheckCircle,
      link: '#'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative text-white py-12 md:py-20 lg:py-28 overflow-hidden min-h-screen flex items-center" style={{
        backgroundImage: 'url(/assets/dashboard.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
        backgroundAttachment: 'fixed'
      }}>
        {/* Directional Overlay - Left to Right Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/70 to-transparent"></div>
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            {/* Animated Title with gradient */}
            <div className="mb-6 md:mb-8 animate-fade-in">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 leading-tight text-left">
                Find Your Perfect <span className="bg-gradient-to-r from-accent-300 via-accent-200 to-yellow-200 bg-clip-text text-transparent animate-pulse">Rental Home</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-xl text-primary-100 mb-8 md:mb-10 leading-relaxed text-left">
                Welcome to <span className="font-bold text-accent-300">MeroGhar</span> - Your trusted platform for property management and rental solutions. Connect with verified landlords and tenants effortlessly.
              </p>
            </div>
            
            {/* Search Bar - Modern Design */}
            <form onSubmit={handleSearch} className="mb-6 md:mb-8 max-w-lg">
              <div className="bg-white rounded-xl p-2 md:p-3 flex flex-col sm:flex-row items-center gap-2 shadow-lg hover:shadow-xl transition-shadow">
                <FiMapPin className="text-primary-600 flex-shrink-0 hidden sm:block text-lg" />
                <input
                  type="text"
                  placeholder="Search by location, property type, price..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 px-3 md:px-4 py-2 md:py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400 w-full sm:w-auto text-xs md:text-sm placeholder-slate-400 rounded-lg transition-all"
                />
                <button 
                  type="submit"
                  className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto px-5 md:px-6 py-2 md:py-3 text-xs md:text-sm shadow-md hover:shadow-lg transition-shadow"
                >
                  <FiSearch className="text-base" />
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* CTA Buttons - Modern Stack */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-5">
              <Link 
                to="/register?role=tenant" 
                className="bg-white text-primary-700 px-7 md:px-9 py-3 md:py-3.5 rounded-lg font-semibold hover:bg-primary-50 transition-all text-center text-sm md:text-base shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-white hover:border-primary-200"
              >
                <FiSearch className="text-base" />
                Find a Home
              </Link>
              <Link 
                to="/register?role=host" 
                className="bg-accent-500 hover:bg-accent-600 text-white px-7 md:px-9 py-3 md:py-3.5 rounded-lg font-semibold transition-all text-center text-sm md:text-base shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-accent-500 hover:border-accent-700"
              >
                <FiKey className="text-base" />
                List Property
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Grid Layout */}
      <section className="py-12 md:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-20">
            <p className="text-primary-600 text-sm md:text-base font-semibold uppercase tracking-wide mb-3">FEATURES</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 md:mb-6">
              Everything You Need to Manage <span className="text-slate-900">Rentals</span>
            </h2>
            <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto">From property discovery to lease management, MeroGhar handles every aspect of the rental journey.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  onMouseEnter={() => setHoveredCard(feature.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="p-6 md:p-7 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-primary-300 transition-all duration-300 transform hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg mb-5 group-hover:from-primary-200 group-hover:to-primary-100 transition-all">
                    <Icon className="text-lg text-primary-700" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-primary-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-20">
            <p className="text-primary-600 text-sm md:text-base font-semibold uppercase tracking-wide mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 md:mb-6">
              Simple Steps to Your New Home
            </h2>
            <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto">Whether you're renting out or moving in, getting started takes just minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
            {steps.map((step) => {
              const StepIcon = step.icon
              return (
                <div
                  key={step.number}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="relative mb-6 w-16 h-16">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl w-16 h-16 flex items-center justify-center group-hover:shadow-lg transition-all">
                      <StepIcon className="text-2xl text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-accent-400 to-accent-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs shadow-md border-2 border-white">
                      {String(step.number).padStart(2, '0')}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-primary-700 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section - Key Metrics */}
      <section className="py-16 md:py-24 lg:py-28 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3">
              Trusted by Thousands
            </h2>
            <p className="text-gray-600 text-base md:text-lg">Millions of rupees in secure transactions processed every month</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7">
            {/* Card 1 */}
            <div className="p-6 md:p-7 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-100">
                  <FiUsers className="text-cyan-700 text-lg" />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-3xl md:text-4xl font-bold text-slate-900">50K+</div>
              </div>
              <p className="text-slate-700 font-semibold text-sm mb-1">Active Users</p>
              <p className="text-gray-600 text-xs">Growing every day</p>
            </div>

            {/* Card 2 */}
            <div className="p-6 md:p-7 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-100">
                  <FiHome className="text-red-700 text-lg" />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-3xl md:text-4xl font-bold text-slate-900">10K+</div>
              </div>
              <p className="text-slate-700 font-semibold text-sm mb-1">Properties</p>
              <p className="text-gray-600 text-xs">Verified listings</p>
            </div>

            {/* Card 3 */}
            <div className="p-6 md:p-7 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
                  <FiShield className="text-green-700 text-lg" />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-3xl md:text-4xl font-bold text-slate-900">100%</div>
              </div>
              <p className="text-slate-700 font-semibold text-sm mb-1">Verified</p>
              <p className="text-gray-600 text-xs">Peace of mind</p>
            </div>

            {/* Card 4 */}
            <div className="p-6 md:p-7 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                  <FiAward className="text-blue-700 text-lg" />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-3xl md:text-4xl font-bold text-slate-900">24/7</div>
              </div>
              <p className="text-slate-700 font-semibold text-sm mb-1">Support</p>
              <p className="text-gray-600 text-xs">Always here to help</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Premium Call to Action */}
      <section className="relative text-white py-16 md:py-24 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-800 to-accent-900"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=%22120%22 height=%22120%22 viewBox=%220 0 120 120%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M60 60v15m-15-15h30M60 15v30M30 60v15m60-15v15m0-45h15M75 15v30M15 75h15m60 0h15%22 transform=%22rotate(45 60 60)%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 md:mb-6 leading-tight">
              Ready to Find Your <span className="text-accent-300">Perfect Match?</span>
            </h2>
            <p className="text-base md:text-lg text-primary-100 mb-8 md:mb-10 leading-relaxed">
              Join thousands of satisfied hosts and tenants who have already transformed their rental experience with MeroGhar.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
              <Link 
                to="/register" 
                className="bg-white text-primary-700 px-8 md:px-12 py-3 md:py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all text-base md:text-base shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
              >
                Create Free Account
                <FiArrowRight className="text-base" />
              </Link>
              <Link 
                to="/properties" 
                className="bg-primary-700/40 hover:bg-primary-700/60 text-white px-8 md:px-12 py-3 md:py-4 rounded-lg font-semibold transition-all text-base md:text-base inline-flex items-center justify-center gap-2 border border-primary-500 hover:border-primary-400"
              >
                <FiSearch className="text-base" />
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
