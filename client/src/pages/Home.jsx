import { Link } from 'react-router-dom'
import { FiSearch, FiHome, FiUsers, FiShield } from 'react-icons/fi'

function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Find Your Perfect Rental Home
            </h1>
            <p className="text-xl mb-8">
              MeroGhar connects property owners with tenants. Manage leases, payments, and maintenance all in one place.
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-lg p-2 flex items-center max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search by location, property type..."
                className="flex-1 px-4 py-3 text-gray-800 focus:outline-none"
              />
              <Link to="/properties" className="btn-primary flex items-center space-x-2">
                <FiSearch />
                <span>Search</span>
              </Link>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <Link to="/register?role=tenant" className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                Find a Home
              </Link>
              <Link to="/register?role=host" className="bg-primary-500 px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition">
                List Your Property
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose MeroGhar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiHome className="text-3xl text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Properties</h3>
              <p className="text-gray-600">
                All properties are verified by our admin team for your safety and trust.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="text-3xl text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Communication</h3>
              <p className="text-gray-600">
                Real-time chat between hosts and tenants for seamless communication.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShield className="text-3xl text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Integrated payment gateways for safe and secure rent transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Sign Up</h3>
              <p className="text-gray-600 text-sm">Create your account as a host or tenant</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Browse / List</h3>
              <p className="text-gray-600 text-sm">Search properties or list your own</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Connect</h3>
              <p className="text-gray-600 text-sm">Chat with hosts/tenants and schedule viewings</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Move In</h3>
              <p className="text-gray-600 text-sm">Sign lease, make payment, and move in!</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8">Join thousands of happy hosts and tenants on MeroGhar</p>
          <Link to="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block">
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
