import { FiCheck, FiClock, FiX, FiSlash } from 'react-icons/fi'

const PropertyStatusBadge = ({ status, verificationStatus, className = '' }) => {
  const getStatusConfig = () => {
    // If property is rejected
    if (status === 'rejected' || verificationStatus === 'rejected') {
      return {
        text: 'Rejected',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: FiX
      }
    }

    // If property is pending approval
    if (verificationStatus === 'pending') {
      return {
        text: 'Pending Approval',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        icon: FiClock
      }
    }

    // If property is active and verified
    if (status === 'active' && verificationStatus === 'verified') {
      return {
        text: 'Active',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: FiCheck
      }
    }

    // If property is inactive
    if (status === 'inactive') {
      return {
        text: 'Inactive',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        icon: FiSlash
      }
    }

    // If property is rented
    if (status === 'rented') {
      return {
        text: 'Rented',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        icon: FiCheck
      }
    }

    // Default case
    return {
      text: status || 'Unknown',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      icon: FiClock
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.text}
    </span>
  )
}

export default PropertyStatusBadge
