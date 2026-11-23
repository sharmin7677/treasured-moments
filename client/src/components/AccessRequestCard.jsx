import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

const API_URL = 'https://treasured-moments.vercel.app'

export default function AccessRequestCard() {
  const { user } = useAuth()

  const [accessStatus, setAccessStatus] =
    useState('loading')

  const [submitting, setSubmitting] =
    useState(false)

  const [message, setMessage] =
    useState('')

  // ============================================================
  // LOAD ACCESS STATUS
  // ============================================================

  useEffect(() => {
    if (!user?.uid) {
      return
    }

    async function loadAccessStatus() {
      try {
        const response = await fetch(
          `${API_URL}/api/access/status/${encodeURIComponent(
            user.uid
          )}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load access status'
          )
        }

        setAccessStatus(
          data.accessStatus
        )
      } catch (error) {
        console.error(
          '❌ Access status error:',
          error.message
        )

        setAccessStatus('none')
      }
    }

    loadAccessStatus()
  }, [user])

  // ============================================================
  // REQUEST ACCESS
  // ============================================================

  const requestAccess = async () => {
    if (!user?.uid) {
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch(
        `${API_URL}/api/access/request`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            firebaseUid: user.uid,
            email: user.email || '',
            displayName:
              user.displayName || '',
            photoURL:
              user.photoURL || '',
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Access request failed'
        )
      }

      setAccessStatus(
        data.accessStatus
      )

      setMessage(data.message)
    } catch (error) {
      console.error(
        '❌ Access request error:',
        error.message
      )

      setMessage(
        'Something went wrong. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // NOT LOGGED IN
  // ============================================================

  if (!user) {
    return null
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (accessStatus === 'loading') {
    return null
  }

  // ============================================================
  // APPROVED
  // ============================================================

  if (accessStatus === 'approved') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
        <p className="text-sm font-semibold text-emerald-700">
          🔓 Full access approved
        </p>

        <p className="mt-1 text-xs text-emerald-600">
          You can explore the private memories.
        </p>
      </div>
    )
  }

  // ============================================================
  // PENDING
  // ============================================================

  if (accessStatus === 'pending') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-center">
        <p className="text-sm font-semibold text-amber-700">
          ⏳ Access request pending
        </p>

        <p className="mt-1 text-xs text-amber-600">
          Your request has been sent to the owner.
        </p>
      </div>
    )
  }

  // ============================================================
  // REVOKED
  // ============================================================

  if (accessStatus === 'revoked') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center">
        <p className="text-sm font-semibold text-slate-700">
          🔒 Access has been removed
        </p>

        <p className="mt-1 text-xs text-slate-600">
          Your previous access to the private memories
          has been removed by the owner.
        </p>

        <button
          type="button"
          onClick={requestAccess}
          disabled={submitting}
          className="mt-3 rounded-full bg-[var(--accent-purple)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? 'Sending...'
            : 'Request Access Again'}
        </button>

        {message && (
          <p className="mt-3 text-xs text-[var(--secondary-text)]">
            {message}
          </p>
        )}
      </div>
    )
  }

  // ============================================================
  // REJECTED
  // ============================================================

  if (accessStatus === 'rejected') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 text-center">
        <p className="text-sm font-semibold text-red-700">
          Access request was not approved.
        </p>

        <button
          type="button"
          onClick={requestAccess}
          disabled={submitting}
          className="mt-3 rounded-full bg-[var(--accent-purple)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? 'Sending...'
            : 'Request Again'}
        </button>

        {message && (
          <p className="mt-3 text-xs text-[var(--secondary-text)]">
            {message}
          </p>
        )}
      </div>
    )
  }

  // ============================================================
  // NO ACCESS YET
  // ============================================================

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
        Private Access
      </p>

      <h3 className="mt-2 text-xl font-semibold text-[var(--text-h)]">
        Unlock more memories
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--secondary-text)]">
        Request access to explore the private memories,
        photos, videos, stories, letters, and wish cards.
      </p>

      <button
        type="button"
        onClick={requestAccess}
        disabled={submitting}
        className="mt-5 rounded-full bg-[var(--accent-purple)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-pink)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? 'Sending Request...'
          : 'Request Access'}
      </button>

      {message && (
        <p className="mt-3 text-xs text-[var(--secondary-text)]">
          {message}
        </p>
      )}
    </div>
  )
}