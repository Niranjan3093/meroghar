import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-2xl font-bold">
          404
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-600 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-white font-medium hover:bg-primary-700 transition"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}

export default NotFound