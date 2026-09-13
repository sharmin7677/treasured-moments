import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { getIdToken } from 'firebase/auth'

import { useAuth } from '../contexts/AuthContext.jsx'

const API_URL = 'http://localhost:5000'

function Photos() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // ============================================================
  // ACCESS STATE
  // ============================================================

  const [accessStatus, setAccessStatus] =
    useState('checking')

  const [loading, setLoading] =
    useState(true)

  // ============================================================
  // PHOTO STATE
  // ============================================================

  const [photos, setPhotos] =
    useState([])

  const [photosLoading, setPhotosLoading] =
    useState(false)

  const [photosError, setPhotosError] =
    useState('')

  // ============================================================
  // FULL IMAGE VIEW STATE
  // ============================================================

  const [selectedPhoto, setSelectedPhoto] =
    useState(null)

  // ============================================================
  // CHECK ACCESS
  // ============================================================

  useEffect(() => {
    let mounted = true

    const checkAccess = async () => {
      if (!user?.uid) {
        if (mounted) {
          setAccessStatus('none')
          setLoading(false)
        }

        return
      }

      try {
        const response = await fetch(
          `${API_URL}/api/access/status/${encodeURIComponent(
            user.uid
          )}`
        )

        const data =
          await response.json()

        console.log(
          '📸 Photos access status:',
          data
        )

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to check access'
          )
        }

        if (mounted) {
          setAccessStatus(
            data.accessStatus ||
              'none'
          )
        }
      } catch (error) {
        console.error(
          '❌ Photos access check failed:',
          error
        )

        if (mounted) {
          setAccessStatus('error')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAccess()

    return () => {
      mounted = false
    }
  }, [user])

  // ============================================================
  // HANDLE ACCESS STATUS
  // ============================================================

  useEffect(() => {
    if (
      loading ||
      accessStatus === 'checking'
    ) {
      return
    }

    // ----------------------------------------------------------
    // NOT LOGGED IN
    // ----------------------------------------------------------

    if (!user?.uid) {
      navigate('/home', {
        replace: true,
      })

      return
    }

    // ----------------------------------------------------------
    // APPROVED
    // ----------------------------------------------------------

    if (
      accessStatus === 'approved'
    ) {
      return
    }

    // ----------------------------------------------------------
    // PENDING
    // ----------------------------------------------------------

    if (
      accessStatus === 'pending'
    ) {
      Swal.fire({
        icon: 'info',
        title:
          'Request Still Pending ⏳',
        text:
          'Your access request is still waiting for approval.',
        confirmButtonText:
          'Back Home',
        confirmButtonColor:
          '#d9466f',
      }).then(() => {
        navigate('/home', {
          replace: true,
        })
      })

      return
    }

    // ----------------------------------------------------------
    // ERROR
    // ----------------------------------------------------------

    if (
      accessStatus === 'error'
    ) {
      Swal.fire({
        icon: 'error',
        title:
          'Something Went Wrong',
        text:
          'We could not verify your access right now.',
        confirmButtonText:
          'Back Home',
        confirmButtonColor:
          '#d9466f',
      }).then(() => {
        navigate('/home', {
          replace: true,
        })
      })

      return
    }

    // ----------------------------------------------------------
    // NO ACCESS
    // ----------------------------------------------------------

    navigate('/home', {
      replace: true,
    })
  }, [
    accessStatus,
    loading,
    navigate,
    user,
  ])

  // ============================================================
  // FETCH ALL PHOTO CATEGORY MEDIA
  //
  // IMPORTANT:
  //
  // ONLY:
  // /api/media/category/photo
  //
  // NOT:
  // /api/media/type/image
  //
  // This page only shows dedicated photo category media.
  // ============================================================

  useEffect(() => {
    if (
      loading ||
      accessStatus !== 'approved' ||
      !user
    ) {
      return
    }

    let mounted = true

    const fetchPhotos = async () => {
      setPhotosLoading(true)
      setPhotosError('')

      try {
        // ------------------------------------------------------
        // GET FIREBASE ID TOKEN
        // ------------------------------------------------------

        const token =
          await getIdToken(
            user,
            true
          )

        // ------------------------------------------------------
        // FETCH PHOTO CATEGORY
        // ------------------------------------------------------

        const response = await fetch(
          `${API_URL}/api/media/category/photo`,
          {
            method: 'GET',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

        const data =
          await response.json()

        console.log(
          '📸 Photos API response:',
          data
        )

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Failed to fetch photos (${response.status})`
          )
        }

        if (!data.success) {
          throw new Error(
            data.message ||
              'Failed to load photos'
          )
        }

        // ------------------------------------------------------
        // PHOTO CATEGORY COLLECTION
        //
        // Backend already filters by:
        // mediaType: "photo"
        //
        // Additional resourceType check keeps this page
        // image-only.
        // ------------------------------------------------------

        const fetchedPhotos =
          Array.isArray(data.data)
            ? data.data.filter(
                (photo) =>
                  photo?.resourceType ===
                  'image'
              )
            : []

        // ------------------------------------------------------
        // NEWEST FIRST
        // ------------------------------------------------------

        fetchedPhotos.sort(
          (a, b) =>
            new Date(
              b.createdAt || 0
            ).getTime() -
            new Date(
              a.createdAt || 0
            ).getTime()
        )

        if (mounted) {
          setPhotos(
            fetchedPhotos
          )
        }
      } catch (error) {
        console.error(
          '❌ Failed to load photos:',
          error
        )

        if (mounted) {
          setPhotosError(
            error.message ||
              'We could not load the photos right now.'
          )

          setPhotos([])
        }
      } finally {
        if (mounted) {
          setPhotosLoading(false)
        }
      }
    }

    fetchPhotos()

    return () => {
      mounted = false
    }
  }, [
    accessStatus,
    loading,
    user,
  ])

  // ============================================================
  // OPEN FULL IMAGE
  //
  // ONLY THE PHOTO WILL BE SHOWN.
  //
  // No:
  // - title
  // - description
  // - date
  // ============================================================

  const handleOpenPhoto = (photo) => {
    if (!photo?.url) {
      return
    }

    setSelectedPhoto(photo)

    // Prevent background page scrolling
    document.body.style.overflow = 'hidden'
  }

  // ============================================================
  // CLOSE FULL IMAGE
  // ============================================================

  const handleClosePhoto = () => {
    setSelectedPhoto(null)

    // Restore background scrolling
    document.body.style.overflow = ''
  }

  // ============================================================
  // ESC KEY
  // ============================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.key === 'Escape' &&
        selectedPhoto
      ) {
        handleClosePhoto()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [selectedPhoto])

  // ============================================================
  // CLEANUP BODY SCROLL
  // ============================================================

  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (
    loading ||
    accessStatus === 'checking'
  ) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">

          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-xl shadow-sm">
              📸
            </div>

            <p className="mt-5 text-sm font-medium text-[var(--secondary-text)]">
              Opening our treasured photos...
            </p>

          </div>

        </div>
      </main>
    )
  }

  // ============================================================
  // DON'T RENDER WHILE REDIRECTING
  // ============================================================

  if (
    accessStatus !== 'approved'
  ) {
    return null
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      <main className="min-h-screen bg-[var(--bg)] px-4 py-12 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-6xl">

          {/* ======================================================
              HEADER
          ====================================================== */}

          <header className="text-center">

            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">
              OUR PHOTOS 📸
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-[var(--text-h)] sm:text-4xl lg:text-5xl">
              All our treasured moments.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--secondary-text)] sm:text-base">
              A private collection of little moments,
              happy days, quiet memories, and everything
              worth keeping close.
            </p>

            <div className="mt-5 flex justify-center">

              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-semibold text-[var(--accent-purple)]">
                🔐 Private Photo Collection
              </span>

            </div>

          </header>

          {/* ======================================================
              PHOTO SECTION
          ====================================================== */}

          <section className="mt-10">

            {/* ====================================================
                LOADING
            ==================================================== */}

            {photosLoading && (
              <div className="flex min-h-[280px] items-center justify-center">

                <div className="text-center">

                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent-purple)]" />

                  <p className="mt-4 text-sm font-medium text-[var(--secondary-text)]">
                    Loading treasured photos...
                  </p>

                </div>

              </div>
            )}

            {/* ====================================================
                ERROR
            ==================================================== */}

            {!photosLoading &&
              photosError && (
                <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-12 text-center">

                  <div className="text-4xl">
                    😔
                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-red-700">
                    Unable to load photos
                  </h2>

                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-600">
                    {photosError}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      window.location.reload()
                    }
                    className="mt-5 rounded-full bg-[#d9466f] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Try Again
                  </button>

                </div>
              )}

            {/* ====================================================
                EMPTY
            ==================================================== */}

            {!photosLoading &&
              !photosError &&
              photos.length === 0 && (
                <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-soft)] px-6 py-16 text-center">

                  <div className="text-5xl">
                    📸
                  </div>

                  <h2 className="mt-5 text-xl font-semibold text-[var(--text-h)]">
                    No photos yet
                  </h2>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--secondary-text)]">
                    Your uploaded photos will appear
                    here once they are added to the vault.
                  </p>

                </div>
              )}

            {/* ====================================================
                PHOTO GRID
            ==================================================== */}

            {!photosLoading &&
              !photosError &&
              photos.length > 0 && (
                <>

                  <div className="mb-5 flex items-center justify-between">

                    <p className="text-sm font-medium text-[var(--secondary-text)]">
                      {photos.length}{' '}
                      {photos.length === 1
                        ? 'photo'
                        : 'photos'}{' '}
                      in our collection
                    </p>

                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                    {photos.map(
                      (photo, index) => (
                        <article
                          key={
                            photo._id ||
                            photo.publicId ||
                            `${photo.url}-${index}`
                          }
                          className="
                            group
                            overflow-hidden
                            rounded-[1.5rem]
                            border
                            border-[var(--border)]
                            bg-[var(--surface)]
                            p-3
                            shadow-sm
                            transition
                            duration-300
                            hover:-translate-y-1
                            hover:shadow-lg
                          "
                        >

                          {/* ==========================================
                              CLICKABLE IMAGE AREA
                          ========================================== */}

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenPhoto(
                                photo
                              )
                            }
                            className="
                              group/photo
                              relative
                              block
                              w-full
                              cursor-zoom-in
                              overflow-hidden
                              rounded-[1.25rem]
                              bg-[var(--surface-soft)]
                              focus:outline-none
                              focus:ring-2
                              focus:ring-[var(--accent-purple)]/50
                            "
                            aria-label="View photo in full size"
                          >

                            <div
                              className="
                                relative
                                flex
                                h-[220px]
                                items-center
                                justify-center
                                sm:h-[230px]
                              "
                            >

                              <img
                                src={photo.url}
                                alt={
                                  photo.title ||
                                  'Friendship Vault photo'
                                }
                                loading="lazy"
                                className="
                                  block
                                  h-full
                                  w-full
                                  object-contain
                                  p-1
                                  transition
                                  duration-500
                                  group-hover/photo:scale-[1.02]
                                "
                                onError={(
                                  event
                                ) => {
                                  console.error(
                                    '❌ Image failed:',
                                    photo.url
                                  )

                                  event.currentTarget.style.display =
                                    'none'
                                }}
                              />

                              {/* ========================================
                                  PHOTO LABEL
                              ======================================== */}

                              <div className="absolute right-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold text-[var(--accent-purple)] shadow-sm backdrop-blur-sm">
                                Photo
                              </div>

                              {/* ========================================
                                  VIEW FULL OVERLAY
                              ======================================== */}

                              <div
                                className="
                                  absolute
                                  inset-0
                                  flex
                                  items-center
                                  justify-center
                                  bg-black/0
                                  opacity-0
                                  transition
                                  duration-300
                                  group-hover/photo:bg-black/15
                                  group-hover/photo:opacity-100
                                "
                              >

                                <span
                                  className="
                                    rounded-full
                                    bg-white/95
                                    px-4
                                    py-2
                                    text-xs
                                    font-semibold
                                    text-gray-800
                                    shadow-lg
                                  "
                                >
                                  View Full
                                </span>

                              </div>

                            </div>

                          </button>

                          {/* ==========================================
                              INFO
                          ========================================== */}

                          <div className="px-1 pb-1 pt-3">

                            <h2 className="line-clamp-1 text-sm font-semibold text-[var(--text-h)]">
                              {photo.title ||
                                'Untitled Memory'}
                            </h2>

                            {photo.description && (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--secondary-text)]">
                                {
                                  photo.description
                                }
                              </p>
                            )}

                            {photo.createdAt && (
                              <p className="mt-2 text-[10px] font-medium text-[var(--secondary-text)] opacity-70">
                                {new Date(
                                  photo.createdAt
                                ).toLocaleDateString(
                                  'en-US',
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                )}
                              </p>
                            )}

                          </div>

                        </article>
                      )
                    )}

                  </div>

                </>
              )}

          </section>

          {/* ======================================================
              BOTTOM MESSAGE
          ====================================================== */}

          <section className="mt-12 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-soft)] px-6 py-8 text-center">

            <p className="text-lg font-semibold text-[var(--text-h)]">
              Every picture keeps a little piece of
              the story. ❤️
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[var(--secondary-text)]">
              More beautiful memories will be added
              here as our little vault continues to
              grow.
            </p>

          </section>

        </div>

      </main>

      {/* ============================================================
          FULL PHOTO MODAL
          
          IMPORTANT:
          ONLY THE IMAGE IS SHOWN.
          
          NO:
          - TITLE
          - DESCRIPTION
          - DATE
          ============================================================ */}

      {selectedPhoto && (
        <div
          className="
            fixed
            inset-0
            z-[999]
            flex
            items-center
            justify-center
            bg-black/90
            p-3
            sm:p-5
          "
          onClick={handleClosePhoto}
          role="dialog"
          aria-modal="true"
          aria-label="Full size photo viewer"
        >

          {/* ========================================================
              CLOSE BUTTON
          ======================================================== */}

          <button
            type="button"
            onClick={handleClosePhoto}
            className="
              absolute
              right-4
              top-4
              z-[1000]
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-white/90
              text-2xl
              font-medium
              leading-none
              text-gray-800
              shadow-xl
              transition
              duration-200
              hover:scale-105
              hover:bg-white
              focus:outline-none
              focus:ring-2
              focus:ring-white
            "
            aria-label="Close full photo"
          >
            ×
          </button>

          {/* ========================================================
              IMAGE ONLY
          ======================================================== */}

          <div
            className="
              flex
              max-h-[94vh]
              max-w-[98vw]
              items-center
              justify-center
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <img
              src={selectedPhoto.url}
              alt={
                selectedPhoto.title ||
                'Full size friendship photo'
              }
              className="
                block
                max-h-[94vh]
                max-w-[98vw]
                rounded-lg
                object-contain
                shadow-2xl
                sm:rounded-xl
              "
            />

          </div>

        </div>
      )}
    </>
  )
}

export default Photos