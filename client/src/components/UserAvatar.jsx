/**
 * UserAvatar - Shows user's profile picture or initials (like Gmail).
 * 
 * Props:
 *   name     - User's name (used to generate initials)
 *   avatar   - URL of profile picture (optional)
 *   size     - 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 *   className - additional classes
 */

const COLORS = [
  'bg-primary-600', 'bg-primary-500', 'bg-accent-600', 'bg-accent-500',
  'bg-blue-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600',
  'bg-cyan-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600'
]

function getInitials(name) {
  if (!name || name.trim() === '') return '?'
  const parts = name.trim().split(/\s+/).filter(p => p.length > 0)
  if (parts.length === 0) return '?'
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].substring(0, 2).toUpperCase()
}

function getColorFromName(name) {
  if (!name || name.trim() === '') return COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function isPlaceholder(avatar) {
  return !avatar || avatar.trim() === '' || avatar.includes('placeholder') || avatar.includes('via.placeholder')
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px] leading-6',
  sm: 'w-8 h-8 text-xs leading-8',
  md: 'w-10 h-10 text-sm leading-10',
  lg: 'w-12 h-12 text-base leading-12',
  xl: 'w-16 h-16 text-lg leading-16',
  '2xl': 'w-24 h-24 text-2xl leading-24'
}

function UserAvatar({ name, avatar, size = 'md', className = '' }) {
  const initials = getInitials(name)
  const bgColor = getColorFromName(name)
  const sizeClass = sizeClasses[size] || sizeClasses.md

  if (!isPlaceholder(avatar)) {
    return (
      <img
        src={avatar}
        alt={name || 'User'}
        className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-md ${className}`}
        onError={(e) => {
          e.target.style.display = 'none'
        }}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center text-white font-bold select-none border-2 border-white shadow-md ${className}`}
      title={name || 'User'}
    >
      {initials}
    </div>
  )
}

export default UserAvatar
