import { Link } from 'react-router-dom'
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi'

function Footer() {
  return (
    <footer className="bg-primary-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">MeroGhar</h3>
            <p className="text-gray-400">
              Your trusted platform for rental management. Connecting hosts and tenants seamlessly.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/properties" className="text-gray-400 hover:text-white">Browse Properties</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-white">FAQ</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Users</h3>
            <ul className="space-y-2">
              <li><Link to="/register?role=tenant" className="text-gray-400 hover:text-white">Find Rental</Link></li>
              <li><Link to="/register?role=host" className="text-gray-400 hover:text-white">List Property</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-gray-400">
                <FiMail />
                <span>info@meroghar.com</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <FiPhone />
                <span>+977 1234567890</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <FiMapPin />
                <span>Kathmandu, Nepal</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-700 mt-8 pt-6 text-center text-primary-100">
          <p>&copy; {new Date().getFullYear()} MeroGhar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
