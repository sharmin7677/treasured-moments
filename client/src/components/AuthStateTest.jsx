import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../contexts/AuthContext.jsx'
import { signInWithGoogle } from '../firebase/googleAuth.js'
import googleIcon from '../assets/google-icon.svg'

function AuthStateTest() {
  const { currentUser, loading } = useAuth()
  const navigate = useNavigate()

  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInError, setSignInError] = useState('')

  // ============================================================
  // GOOGLE LOGIN
  // ============================================================

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    setSignInError('')

    try {
      await signInWithGoogle()

      // ========================================================
      // LOGIN SUCCESS TOAST
      // 1.5 seconds
      // Top-center controlled from App.jsx
      // ========================================================

 toast.success('Login successful! ❤️ ', {
  autoClose: 1500,
})

      // Navigate after toast duration
      setTimeout(() => {
        navigate('/home', { replace: true })
      }, 1500)
    } catch (error) {
      console.error('Google sign-in error:', error)

      setSignInError(
        'Google sign-in failed. Please try again.'
      )

      toast.error(
        'Google sign-in failed. Please try again.',
        {
          autoClose: 1500,
        }
      )
    } finally {
      setIsSigningIn(false)
    }
  }

  // ============================================================
  // AUTH LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div
          className="
            w-full
            max-w-md
            rounded-2xl
            border
            border-base-300
            bg-base-200/70
            p-8
            text-center
            shadow-sm
            backdrop-blur-sm
          "
        >
          <h2 className="text-lg font-semibold text-base-content">
            Checking your vault access...
          </h2>

          <p className="mt-2 text-sm text-base-content/70">
            Please wait while we confirm your sign-in state.
          </p>
        </div>
      </div>
    )
  }

  // ============================================================
  // ALREADY LOGGED IN
  // ============================================================

  if (currentUser) {
    return <Navigate to="/home" replace />
  }

  // ============================================================
  // LOGIN SCREEN
  // ============================================================

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-base-300
          bg-base-200/70
          p-8
          text-center
          shadow-sm
          backdrop-blur-sm
        "
      >
        <h2 className="text-2xl font-semibold text-base-content">
          You're not signed in.
        </h2>

        <p className="mt-2 text-sm text-base-content/70">
          Authentication state is ready for the next step.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="
            mt-6
            flex
            w-full
            cursor-pointer
            items-center
            justify-center
            gap-3
            rounded-lg
            border
            border-primary/30
            bg-primary
            px-4
            py-3
            font-medium
            text-primary-content
            transition
            duration-200
            hover:bg-primary/90
            disabled:cursor-not-allowed
            disabled:opacity-70
          "
        >
          <img
            src={googleIcon}
            alt="Google"
            className="h-5 w-5"
          />

          <span>
            {isSigningIn
              ? 'Opening your vault...'
              : 'Continue with Google'}
          </span>
        </button>

        {signInError && (
          <p className="mt-3 text-sm text-error">
            {signInError}
          </p>
        )}
      </div>
    </div>
  )
}

export default AuthStateTest