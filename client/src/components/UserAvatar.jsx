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
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
  'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'
]

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0][0].toUpperCase()
}

function getColorFromName(name) {
  if (!name) return COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function isPlaceholder(avatar) {
  return !avatar || avatar.includes('placeholder') || avatar.includes('via.placeholder')
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl'
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
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold select-none ${className}`}
      title={name}
    >
      {initials}
    </div>
  )
}

export default UserAvatar
