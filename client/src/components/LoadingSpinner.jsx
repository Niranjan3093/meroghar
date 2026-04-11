function LoadingSpinner({ 
  size = 'md', // 'sm', 'md', 'lg'
  color = 'primary',
  showText = false,
  text = 'Loading...'
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'border-primary-600',
    white: 'border-white',
    accent: 'border-accent-600'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 ${colorClasses[color]}`}></div>
      {showText && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
