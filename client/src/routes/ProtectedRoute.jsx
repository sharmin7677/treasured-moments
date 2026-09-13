import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

const ADMIN_EMAIL = 'orthi7677@gmail.com'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()

  // Auth state is still loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <div className="mb-4 text-2xl text-[var(--accent-purple)]">
            ✦
          </div>

          <h2 className="text-lg font-semibold text-[var(--text-h)]">
            Loading your vault...
          </h2>

          <p className="mt-2 text-sm text-[var(--secondary-text)]">
            Please wait while we check your access.
          </p>
        </div>
      </div>
    )
  }

  // User is not logged in
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Admin-only route
  if (adminOnly) {
    const isAdmin =
      user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

    if (!isAdmin) {
      return <Navigate to="/home" replace />
    }
  }

  return children
}

export default ProtectedRoute