import { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { getIdToken } from 'firebase/auth'

import { useAuth } from '../contexts/AuthContext.jsx'

const API_URL = 'https://treasured-moments.vercel.app'

function AdminAccessRequests() {
  const { user } = useAuth()

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  // ============================================================
  // GET FRESH FIREBASE ID TOKEN
  // ============================================================

  const getFreshToken = useCallback(async () => {
    if (!user) {
      throw new Error('You must be logged in.')
    }

    const token = await getIdToken(user, true)

    if (!token) {
      throw new Error(
        'Could not get Firebase authentication token.'
      )
    }

    return token
  }, [user])

  // ============================================================
  // FETCH WITH AUTH + ONE RETRY
  // ============================================================

  const authenticatedFetch = useCallback(
    async (url, options = {}) => {
      let token = await getFreshToken()

      let response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      // Retry once if Firebase token is rejected
      if (response.status === 401) {
        token = await getIdToken(user, true)

        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }

      return response
    },
    [getFreshToken, user]
  )

  // ============================================================
  // LOAD ACCESS REQUESTS
  // ============================================================

  const loadRequests = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      setLoading(true)

      const response = await authenticatedFetch(
        `${API_URL}/api/access/requests`,
        {
          method: 'GET',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load access requests.'
        )
      }

      /*
       * Revoked users are intentionally hidden from the admin UI.
       * Their access can still be requested again later.
       */
      const visibleRequests = (data.requests || []).filter(
        (request) => request.accessStatus !== 'revoked'
      )

      setRequests(visibleRequests)
    } catch (error) {
      console.error('❌ Admin requests loading error:', error)

      await Swal.fire({
        icon: 'error',
        title: 'Could not load requests',
        text:
          error.message ||
          'Access requests could not be loaded right now.',
        confirmButtonColor: '#c83d67',
      })
    } finally {
      setLoading(false)
    }
  }, [authenticatedFetch, user])

  // ============================================================
  // LOAD WHEN ADMIN USER IS AVAILABLE
  // ============================================================

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    loadRequests()
  }, [user, loadRequests])

  // ============================================================
  // APPROVE ACCESS
  // ============================================================

  const handleApprove = async (firebaseUid) => {
    const result = await Swal.fire({
      title: 'Approve Access? 💚',
      text:
        'This user will be able to access private memories, photos, videos and other protected content.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#22a06b',
      cancelButtonColor: '#999',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      setActionLoading(firebaseUid)

      const response = await authenticatedFetch(
        `${API_URL}/api/access/approve/${encodeURIComponent(
          firebaseUid
        )}`,
        {
          method: 'PUT',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Approval failed.'
        )
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.firebaseUid === firebaseUid
            ? {
                ...request,
                accessStatus: 'approved',
                accessApprovedAt:
                  new Date().toISOString(),
                accessRejectedAt: null,
                accessRevokedAt: null,
              }
            : request
        )
      )

      await Swal.fire({
        icon: 'success',
        title: 'Access Approved 💖',
        text:
          'The user can now access the protected content.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#c83d67',
      })
    } catch (error) {
      console.error('❌ Approval error:', error)

      await Swal.fire({
        icon: 'error',
        title: 'Approval Failed',
        text:
          error.message ||
          'Could not approve this request.',
        confirmButtonColor: '#c83d67',
      })
    } finally {
      setActionLoading(null)
    }
  }

  // ============================================================
  // REJECT ACCESS
  // ============================================================

  const handleReject = async (firebaseUid) => {
    const result = await Swal.fire({
      title: 'Reject Access? ❤️‍🩹',
      text:
        'This user will not be able to access the protected content.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#999',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      setActionLoading(firebaseUid)

      const response = await authenticatedFetch(
        `${API_URL}/api/access/reject/${encodeURIComponent(
          firebaseUid
        )}`,
        {
          method: 'PUT',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Rejection failed.'
        )
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.firebaseUid === firebaseUid
            ? {
                ...request,
                accessStatus: 'rejected',
                accessRejectedAt:
                  new Date().toISOString(),
                accessApprovedAt: null,
                accessRevokedAt: null,
              }
            : request
        )
      )

      await Swal.fire({
        icon: 'info',
        title: 'Access Rejected',
        text:
          'The access request has been rejected.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#c83d67',
      })
    } catch (error) {
      console.error('❌ Rejection error:', error)

      await Swal.fire({
        icon: 'error',
        title: 'Rejection Failed',
        text:
          error.message ||
          'Could not reject this request.',
        confirmButtonColor: '#c83d67',
      })
    } finally {
      setActionLoading(null)
    }
  }

  // ============================================================
  // REVOKE ACCESS
  // ============================================================

  const handleRevoke = async (
    firebaseUid,
    displayName
  ) => {
    const result = await Swal.fire({
      title: 'Remove Access? 🔒',
      text: `${
        displayName || 'This user'
      } will immediately lose access to the protected content. They can request access again later.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove Access',
      cancelButtonText: 'Keep Access',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#999',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      setActionLoading(firebaseUid)

      const response = await authenticatedFetch(
        `${API_URL}/api/access/revoke/${encodeURIComponent(
          firebaseUid
        )}`,
        {
          method: 'PUT',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Access revoke failed.'
        )
      }

      /*
       * IMPORTANT:
       * Remove the revoked user completely from the UI.
       */
      setRequests((currentRequests) =>
        currentRequests.filter(
          (request) =>
            request.firebaseUid !== firebaseUid
        )
      )

      await Swal.fire({
        icon: 'success',
        title: 'Access Removed 🔒',
        text:
          'This user can no longer access the protected content.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#c83d67',
      })
    } catch (error) {
      console.error('❌ Revoke error:', error)

      await Swal.fire({
        icon: 'error',
        title: 'Could Not Remove Access',
        text:
          error.message ||
          'Could not revoke this user access.',
        confirmButtonColor: '#c83d67',
      })
    } finally {
      setActionLoading(null)
    }
  }

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusStyle = (status) => {
    if (status === 'approved') {
      return 'bg-green-100 text-green-700 border-green-200'
    }

    if (status === 'rejected') {
      return 'bg-red-100 text-red-700 border-red-200'
    }

    return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  }

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return '—'
    }

    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center">
          <p className="text-sm font-medium text-[var(--secondary-text)]">
            Loading access requests...
          </p>
        </div>
      </main>
    )
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
            ADMIN PANEL 🔐
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-[var(--text-h)] sm:text-3xl">
            Access Requests
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--secondary-text)]">
            Review and manage who can explore the private
            memories inside The Friendship Vault.
          </p>
        </div>

        {/* STATS */}

        <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">

          {/* Pending */}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-600 sm:text-xs">
              Pending
            </p>

            <p className="mt-1 text-2xl font-semibold text-[var(--text-h)]">
              {
                requests.filter(
                  (request) =>
                    request.accessStatus === 'pending'
                ).length
              }
            </p>
          </div>

          {/* Approved */}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-600 sm:text-xs">
              Approved
            </p>

            <p className="mt-1 text-2xl font-semibold text-[var(--text-h)]">
              {
                requests.filter(
                  (request) =>
                    request.accessStatus === 'approved'
                ).length
              }
            </p>
          </div>

          {/* Rejected */}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-600 sm:text-xs">
              Rejected
            </p>

            <p className="mt-1 text-2xl font-semibold text-[var(--text-h)]">
              {
                requests.filter(
                  (request) =>
                    request.accessStatus === 'rejected'
                ).length
              }
            </p>
          </div>

        </div>

        {/* REQUEST LIST */}

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center shadow-sm">
            <p className="text-base font-semibold text-[var(--text-h)]">
              No access requests yet 💌
            </p>

            <p className="mt-1.5 text-sm text-[var(--secondary-text)]">
              New requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">

            {requests.map((request) => {
              const isActionLoading =
                actionLoading === request.firebaseUid

              return (
                <article
                  key={request.firebaseUid}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:shadow-md"
                >

                  {/* ==================================================
                      DESKTOP / TABLET
                  ================================================== */}

                  <div className="hidden min-w-[850px] items-center px-4 py-3 lg:flex">

                    {/* PHOTO */}

                    <div className="w-[58px] shrink-0">
                      {request.photoURL ? (
                        <img
                          src={request.photoURL}
                          alt=""
                          className="h-10 w-10 rounded-full border border-[var(--border)] object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-soft)] text-base">
                          👤
                        </div>
                      )}
                    </div>

                    {/* NAME */}

                    <div className="w-[155px] shrink-0 pr-4">
                      <p
                        title={
                          request.displayName ||
                          'Unknown Friend'
                        }
                        className="truncate text-sm font-semibold text-[var(--text-h)]"
                      >
                        {request.displayName ||
                          'Unknown Friend'}
                      </p>
                    </div>

                    {/* EMAIL */}

                    <div className="w-[235px] shrink-0 pr-4">
                      <p
                        title={
                          request.email ||
                          'No email available'
                        }
                        className="truncate text-xs text-[var(--secondary-text)]"
                      >
                        {request.email ||
                          'No email available'}
                      </p>
                    </div>

                    {/* DATE */}

                    <div className="w-[175px] shrink-0 pr-4">
                      <p className="truncate text-xs text-[var(--secondary-text)]">
                        {formatDate(
                          request.accessRequestedAt
                        )}
                      </p>
                    </div>

                    {/* STATUS */}

                    <div className="w-[100px] shrink-0">
                      <span
                        className={`inline-flex min-w-[82px] justify-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${getStatusStyle(
                          request.accessStatus
                        )}`}
                      >
                        {request.accessStatus}
                      </span>
                    </div>

                    {/* ACTIONS */}

                    <div className="ml-auto flex w-[190px] shrink-0 justify-end gap-1.5">

                      {/* PENDING */}

                      {request.accessStatus ===
                        'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() =>
                              handleApprove(
                                request.firebaseUid
                              )
                            }
                            className="rounded-full bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isActionLoading
                              ? 'Wait...'
                              : '✓ Approve'}
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() =>
                              handleReject(
                                request.firebaseUid
                              )
                            }
                            className="rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isActionLoading
                              ? 'Wait...'
                              : '✕ Reject'}
                          </button>
                        </>
                      )}

                      {/* APPROVED */}

                      {request.accessStatus ===
                        'approved' && (
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() =>
                            handleRevoke(
                              request.firebaseUid,
                              request.displayName
                            )
                          }
                          className="rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isActionLoading
                            ? 'Wait...'
                            : '🔒 Revoke'}
                        </button>
                      )}

                      {/* REJECTED */}

                      {request.accessStatus ===
                        'rejected' && (
                        <span className="text-[11px] text-[var(--secondary-text)]">
                          No action
                        </span>
                      )}

                    </div>
                  </div>

                  {/* ==================================================
                      MOBILE
                  ================================================== */}

                  <div className="flex items-center gap-3 p-3 lg:hidden">

                    {/* PHOTO */}

                    <div className="shrink-0">
                      {request.photoURL ? (
                        <img
                          src={request.photoURL}
                          alt=""
                          className="h-10 w-10 rounded-full border border-[var(--border)] object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-soft)] text-base">
                          👤
                        </div>
                      )}
                    </div>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">

                      <p
                        title={
                          request.displayName ||
                          'Unknown Friend'
                        }
                        className="truncate text-sm font-semibold text-[var(--text-h)]"
                      >
                        {request.displayName ||
                          'Unknown Friend'}
                      </p>

                      <p
                        title={
                          request.email ||
                          'No email available'
                        }
                        className="mt-0.5 truncate text-[11px] text-[var(--secondary-text)]"
                      >
                        {request.email ||
                          'No email available'}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-[var(--secondary-text)]">
                        {formatDate(
                          request.accessRequestedAt
                        )}
                      </p>

                    </div>

                    {/* RIGHT SIDE */}

                    <div className="flex shrink-0 flex-col items-end gap-1.5">

                      {/* STATUS */}

                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-wide ${getStatusStyle(
                          request.accessStatus
                        )}`}
                      >
                        {request.accessStatus}
                      </span>

                      {/* PENDING BUTTONS */}

                      {request.accessStatus ===
                        'pending' && (
                        <div className="flex gap-1">

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() =>
                              handleApprove(
                                request.firebaseUid
                              )
                            }
                            className="rounded-full bg-green-600 px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                          >
                            ✓
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() =>
                              handleReject(
                                request.firebaseUid
                              )
                            }
                            className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                          >
                            ✕
                          </button>

                        </div>
                      )}

                      {/* REVOKE BUTTON */}

                      {request.accessStatus ===
                        'approved' && (
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() =>
                            handleRevoke(
                              request.firebaseUid,
                              request.displayName
                            )
                          }
                          className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                        >
                          {isActionLoading
                            ? '...'
                            : '🔒'}
                        </button>
                      )}

                    </div>
                  </div>

                </article>
              )
            })}

          </div>
        )}

      </div>
    </main>
  )
}

export default AdminAccessRequests