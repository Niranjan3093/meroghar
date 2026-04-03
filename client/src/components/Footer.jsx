import { Link } from 'react-router-dom'
import { FiMail, FiPhone, FiMapPin, FiHome, FiBriefcase, FiBook, FiHelpCircle, FiLock, FiFile, FiKey } from 'react-icons/fi'

function Footer() {
  return (
    <footer className="bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-white py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4 group hover-glow">
              <div className="bg-gradient-to-br from-accent-400 to-accent-500 p-2 rounded-lg group-hover:shadow-lg transition-all">
                <FiHome className="text-xl text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-accent-300 to-accent-200 bg-clip-text text-transparent">MeroGhar</h3>
            </div>
            <p className="text-primary-200 text-sm leading-relaxed">
              Your trusted platform for rental management. Connecting hosts and tenants seamlessly across the nation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-accent-300">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/properties" className="text-primary-100 hover:text-accent-300 transition-colors duration-300 font-medium inline-flex items-center gap-2"><FiBriefcase className="flex-shrink-0" /> Browse Properties</Link></li>
              <li><Link to="/about" className="text-primary-100 hover:text-accent-300 transition-colors duration-300 font-medium inline-flex items-center gap-2"><FiBook className="flex-shrink-0" /> About Us</Link></li>
              <li><Link to="/contact" className="text-primary-100 hover:text-accent-300 transition-colors duration-300 font-medium inline-flex items-center gap-2"><FiPhone className="flex-shrink-0" /> Contact</Link></li>
              <li><Link to="/faq" className="text-primary-100 hover:text-accent-300 transition-colors duration-300 font-medium inline-flex items-center gap-2"><FiHelpCircle className="flex-shrink-0" /> FAQ</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-accent-300">For Users</h3>
            <ul className="space-y-3">
              <li><Link to="/register?role=tenant" className="text-primary-100 hover:text-accent-300 transition-colors duration-300 font-medium inline-flex items-center gap-2"><FiHome className="flex-shrink-0" /> Find Rental</Link></li>
              <li><Link to="/register?role=host" className="text-primary-100 hover:text-accent-300 transition-colors duration-300 font-medium inline-flex items-center gap-2"><FiKey className="flex-shrink-0" /> List Property</Link></li>
              <li><Link to="/terms" className="text-primary-100 hover:text-accent-300 transition-colors duration-300 font-medium inline-flex items-center gap-2"><FiFile className="flex-shrink-0" /> Terms</Link></li>
              <li><Link to="/privacy" className="text-primary-100 hover:text-accent-300 transition-colors duration-300 font-medium inline-flex items-center gap-2"><FiLock className="flex-shrink-0" /> Privacy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-accent-300">Get in Touch</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 group">
                <div className="text-accent-400 mt-1 group-hover:scale-110 transition-transform">
                  <FiMail className="text-lg" />
                </div>
                <div>
                  <p className="text-xs text-primary-200">Email</p>
                  <span className="text-primary-100 font-semibold hover:text-accent-300 transition-colors cursor-pointer">info@meroghar.com</span>
                </div>
              </li>
              <li className="flex items-start space-x-3 group">
                <div className="text-accent-400 mt-1 group-hover:scale-110 transition-transform">
                  <FiPhone className="text-lg" />
                </div>
                <div>
                  <p className="text-xs text-primary-200">Phone</p>
                  <span className="text-primary-100 font-semibold hover:text-accent-300 transition-colors cursor-pointer">+977 1234567890</span>
                </div>
              </li>
              <li className="flex items-start space-x-3 group">
                <div className="text-accent-400 mt-1 group-hover:scale-110 transition-transform">
                  <FiMapPin className="text-lg" />
                </div>
                <div>
                  <p className="text-xs text-primary-200">Location</p>
                  <span className="text-primary-100 font-semibold">Kathmandu, Nepal</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-primary-200 text-sm font-medium">&copy; {new Date().getFullYear()} MeroGhar. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-primary-300 hover:text-accent-300 transition-colors duration-300 text-sm font-medium">Terms</a>
              <a href="#" className="text-primary-300 hover:text-accent-300 transition-colors duration-300 text-sm font-medium">Privacy</a>
              <a href="#" className="text-primary-300 hover:text-accent-300 transition-colors duration-300 text-sm font-medium">Security</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
