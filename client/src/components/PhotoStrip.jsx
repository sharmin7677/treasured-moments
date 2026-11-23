import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import { getIdToken } from 'firebase/auth'

import { useAuth } from '../contexts/AuthContext.jsx'

// ============================================================
// API
// ============================================================

const API_URL = 'https://treasured-moments.vercel.app'

// ============================================================
// PHOTO STRIP
//
// HOME PAGE
//
// IMPORTANT
// ------------------------------------------------------------
// This section ONLY uses:
//
// /api/media/category/photo
//
// It does NOT use:
// /api/media/type/image
//
// Photo upload:
// mediaType = photo
// resourceType = image
//
// Home PhotoStrip:
// - Latest 7 photos
// - Slow right-to-left movement
// - Pause on hover
// - Resume on mouse leave
// - Clicking a photo opens full image
// - Full collection is available from /photos
// ============================================================

function PhotoStrip() {
  const { user } = useAuth()

  // ============================================================
  // STATE
  // ============================================================

  const [photos, setPhotos] = useState([])

  const [accessStatus, setAccessStatus] =
    useState('checking')

  const [accessLoading, setAccessLoading] =
    useState(true)

  const [mediaLoading, setMediaLoading] =
    useState(true)

  const [selectedPhoto, setSelectedPhoto] =
    useState(null)

  // ============================================================
  // LOAD PHOTOS
  //
  // ONLY:
  // /api/media/category/photo
  //
  // Backend already returns:
  // newest -> oldest
  // ============================================================

  useEffect(() => {
    let isMounted = true

    const loadPhotos = async () => {
      try {
        setMediaLoading(true)

        // ------------------------------------------------------
        // FIREBASE TOKEN
        // ------------------------------------------------------

        let token = null

        if (user) {
          token = await getIdToken(user, true)
        }

        // ------------------------------------------------------
        // HEADERS
        // ------------------------------------------------------

        const headers = {}

        if (token) {
          headers.Authorization =
            `Bearer ${token}`
        }

        // ------------------------------------------------------
        // FETCH PHOTO CATEGORY
        // ------------------------------------------------------

        const response = await fetch(
          `${API_URL}/api/media/category/photo`,
          {
            method: 'GET',
            headers,
          }
        )

        const data = await response.json()

        console.log(
          '📸 PhotoStrip API response:',
          data
        )

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load photos'
          )
        }

        // ------------------------------------------------------
        // GET PHOTO COLLECTION
        //
        // Only:
        // mediaType = photo
        // resourceType = image
        // ------------------------------------------------------

        const rawPhotos =
          Array.isArray(data.data)
            ? data.data
            : []

        // ------------------------------------------------------
        // FRONTEND SAFETY FILTER
        // ------------------------------------------------------

        const validPhotos =
          rawPhotos.filter(
            (photo) =>
              photo &&
              photo.mediaType === 'photo' &&
              photo.resourceType === 'image' &&
              typeof photo.url === 'string' &&
              photo.url.trim() !== ''
          )

        // ------------------------------------------------------
        // REMOVE DUPLICATES
        //
        // Normally MongoDB should already contain one document
        // per upload.
        //
        // This protects the Home UI if duplicate records
        // somehow exist.
        //
        // Priority:
        // _id -> publicId -> url
        // ------------------------------------------------------

        const uniquePhotos = []
        const seen = new Set()

        for (const photo of validPhotos) {
          const uniqueKey =
            photo._id ||
            photo.publicId ||
            photo.url

          if (seen.has(uniqueKey)) {
            continue
          }

          seen.add(uniqueKey)
          uniquePhotos.push(photo)
        }

        // ------------------------------------------------------
        // KEEP LATEST 7
        //
        // Backend already sorts newest first.
        // ------------------------------------------------------

        const latestSeven =
          uniquePhotos.slice(0, 7)

        if (isMounted) {
          setPhotos(latestSeven)
        }
      } catch (error) {
        console.error(
          '❌ Photo loading error:',
          error
        )

        if (isMounted) {
          setPhotos([])
        }
      } finally {
        if (isMounted) {
          setMediaLoading(false)
        }
      }
    }

    loadPhotos()

    return () => {
      isMounted = false
    }
  }, [user])

  // ============================================================
  // CHECK ACCESS STATUS
  // ============================================================

  useEffect(() => {
    let isMounted = true

    const loadAccessStatus = async () => {
      // --------------------------------------------------------
      // NOT LOGGED IN
      // --------------------------------------------------------

      if (!user?.uid) {
        if (isMounted) {
          setAccessStatus('none')
          setAccessLoading(false)
        }

        return
      }

      try {
        setAccessLoading(true)

        const response = await fetch(
          `${API_URL}/api/access/status/${encodeURIComponent(
            user.uid
          )}`
        )

        if (!response.ok) {
          throw new Error(
            'Failed to load access status'
          )
        }

        const data =
          await response.json()

        console.log(
          '📸 Photo access status:',
          data
        )

        if (isMounted) {
          setAccessStatus(
            data.accessStatus || 'none'
          )
        }
      } catch (error) {
        console.error(
          '❌ Access status error:',
          error
        )

        if (isMounted) {
          setAccessStatus('error')
        }
      } finally {
        if (isMounted) {
          setAccessLoading(false)
        }
      }
    }

    loadAccessStatus()

    return () => {
      isMounted = false
    }
  }, [user])

  // ============================================================
  // VIEW ALL PHOTOS
  // ============================================================

  const handleViewAllPhotos = async () => {
    if (accessLoading) {
      return
    }

    // ----------------------------------------------------------
    // LOGIN REQUIRED
    // ----------------------------------------------------------

    if (!user?.uid) {
      await Swal.fire({
        icon: 'info',

        title:
          'Login Required 💌',

        text:
          'Please sign in with your Gmail first to explore these treasured photos.',

        confirmButtonText:
          'Okay',

        confirmButtonColor:
          '#c83d67',
      })

      return
    }

    // ----------------------------------------------------------
    // APPROVED
    // ----------------------------------------------------------

    if (
      accessStatus === 'approved'
    ) {
      window.location.href = '/photos'
      return
    }

    // ----------------------------------------------------------
    // PENDING
    // ----------------------------------------------------------

    if (
      accessStatus === 'pending'
    ) {
      await Swal.fire({
        icon: 'info',

        title:
          'Request Pending ⏳',

        text:
          'Your request is safely with me. Please wait a little while — your memories will be waiting for you soon.',

        confirmButtonText:
          'Okay',

        confirmButtonColor:
          '#c83d67',
      })

      return
    }

    // ----------------------------------------------------------
    // ACCESS ERROR
    // ----------------------------------------------------------

    if (
      accessStatus === 'error'
    ) {
      await Swal.fire({
        icon: 'error',

        title:
          'Unable to Check Access',

        text:
          'We could not verify your access right now. Please try again.',

        confirmButtonText:
          'Okay',

        confirmButtonColor:
          '#c83d67',
      })

      return
    }

    // ----------------------------------------------------------
    // NO REQUEST
    // ----------------------------------------------------------

    const result =
      await Swal.fire({
        icon: 'question',

        title:
          'Unlock More Photos 💌',

        text:
          'These photos hold some beautiful little memories. Would you like to request access?',

        showCancelButton: true,

        confirmButtonText:
          'Request Access',

        cancelButtonText:
          'Maybe Later',

        confirmButtonColor:
          '#c83d67',

        cancelButtonColor:
          '#999',

        reverseButtons: true,
      })

    if (!result.isConfirmed) {
      return
    }

    // ----------------------------------------------------------
    // SEND ACCESS REQUEST
    // ----------------------------------------------------------

    try {
      Swal.fire({
        title:
          'Sending your request...',

        text:
          'Just a little moment ❤️',

        allowOutsideClick: false,

        allowEscapeKey: false,

        showConfirmButton: false,

        didOpen: () => {
          Swal.showLoading()
        },
      })

      const token =
        await getIdToken(user, true)

      const response =
        await fetch(
          `${API_URL}/api/access/request`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              firebaseUid:
                user.uid,

              email:
                user.email || '',

              displayName:
                user.displayName || '',

              photoURL:
                user.photoURL || '',
            }),
          }
        )

      const data =
        await response.json()

      console.log(
        '📨 Access request response:',
        data
      )

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Request failed'
        )
      }

      setAccessStatus(
        data.accessStatus ||
          'pending'
      )

      await Swal.fire({
        icon: 'success',

        title:
          'Request Sent 💌',

        text:
          'Your request is safely with me. I will let you know when your treasured photos are ready.',

        confirmButtonText:
          'Okay',

        confirmButtonColor:
          '#c83d67',
      })
    } catch (error) {
      console.error(
        '❌ Access request error:',
        error
      )

      await Swal.fire({
        icon: 'error',

        title:
          'Oops! Something went wrong 💔',

        text:
          error.message ||
          'Your request could not be sent right now. Please try again.',

        confirmButtonText:
          'Try Again',

        confirmButtonColor:
          '#c83d67',
      })
    }
  }

  // ============================================================
  // OPEN FULL IMAGE
  // ============================================================

  const handleOpenPhoto = (photo) => {
    if (!photo?.url) {
      return
    }

    setSelectedPhoto(photo)
  }

  // ============================================================
  // CLOSE FULL IMAGE
  // ============================================================

  const handleClosePhoto = () => {
    setSelectedPhoto(null)
  }

  // ============================================================
  // ESC KEY
  // ============================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.key === 'Escape'
      ) {
        setSelectedPhoto(null)
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
  }, [])

  // ============================================================
  // MARQUEE COLLECTION
  //
  // IMPORTANT
  // ------------------------------------------------------------
  // If there are 1-7 photos:
  //
  // DO NOT duplicate them.
  //
  // This prevents:
  // photo A
  // photo A
  //
  // from appearing when only one photo is uploaded.
  //
  // If there are enough photos, duplicate the collection only
  // for continuous marquee movement.
  // ============================================================

  const marqueePhotos = useMemo(() => {
    if (photos.length === 0) {
      return []
    }

    // ----------------------------------------------------------
    // Do not duplicate small collections.
    //
    // This is the important fix for:
    // "one uploaded photo showing twice"
    // ----------------------------------------------------------

    if (photos.length <= 7) {
      return photos
    }

    return [
      ...photos,
      ...photos,
    ]
  }, [photos])

  // ============================================================
  // SHOULD MARQUEE ANIMATE?
  // ============================================================

  const shouldAnimate =
    photos.length > 1

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <section className="px-4 py-14 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-6xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">
              PHOTOS 📸
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-[var(--text-h)] sm:text-3xl lg:text-4xl">
              A bright strip of treasured moments.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--secondary-text)] sm:text-base">
              A warm collection of our favorite
              moments. Click any photo to see it
              in full.
            </p>

          </div>

          {/* ==================================================
              PHOTO STRIP
          ================================================== */}

          <div
            className="
              group
              mt-8
              overflow-hidden
              rounded-[2rem]
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-3
              sm:p-4
            "
          >

            {/* ==================================================
                LOADING
            ================================================== */}

            {mediaLoading ? (
              <div className="flex min-h-[220px] items-center justify-center">

                <div className="text-center">

                  <div
                    className="
                      mx-auto
                      h-8
                      w-8
                      animate-spin
                      rounded-full
                      border-2
                      border-[var(--border)]
                      border-t-[var(--accent-purple)]
                    "
                  />

                  <p className="mt-3 text-sm text-[var(--secondary-text)]">
                    Loading photos...
                  </p>

                </div>

              </div>
            ) : photos.length === 0 ? (

              /* ==================================================
                  EMPTY
              ================================================== */

              <div className="flex min-h-[220px] items-center justify-center text-center">

                <div>

                  <div className="text-4xl">
                    📸
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[var(--text-h)]">
                    No photos yet
                  </p>

                  <p className="mt-1 text-sm text-[var(--secondary-text)]">
                    Your treasured photos will
                    appear here after they are
                    uploaded.
                  </p>

                </div>

              </div>
            ) : (

              /* ==================================================
                  PHOTO COLLECTION
              ================================================== */

              <div className="overflow-hidden">

                <div
                  className={`
                    flex
                    w-max
                    gap-3
                    ${
                      shouldAnimate
                        ? 'animate-marquee'
                        : ''
                    }
                    pause-on-hover
                  `}
                >

                  {marqueePhotos.map(
                    (photo, index) => (

                      <button
                        key={`
                          ${photo._id ||
                            photo.publicId ||
                            photo.url}
                          -
                          ${index}
                        `}
                        type="button"
                        onClick={() =>
                          handleOpenPhoto(
                            photo
                          )
                        }
                        className="
                          group/card
                          w-[145px]
                          flex-shrink-0
                          cursor-pointer
                          rounded-[1.5rem]
                          border
                          border-[var(--border)]
                          bg-[var(--surface)]
                          p-2.5
                          text-left
                          shadow-sm
                          transition
                          duration-300
                          hover:-translate-y-1
                          hover:shadow-lg
                          focus:outline-none
                          focus:ring-2
                          focus:ring-[var(--accent-purple)]/40

                          sm:w-[155px]
                          sm:p-3
                        "
                        aria-label={`Open ${
                          photo.title ||
                          'photo'
                        } in full size`}
                      >

                        {/* ========================================
                            IMAGE
                        ======================================== */}

                        <div
                          className="
                            relative
                            flex
                            h-[165px]
                            w-full
                            items-center
                            justify-center
                            overflow-hidden
                            rounded-[1.25rem]
                            bg-[var(--surface-soft)]

                            sm:h-[180px]
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
                              transition
                              duration-500
                              group-hover/card:scale-[1.02]
                            "
                            onError={(
                              event
                            ) => {
                              console.error(
                                '❌ Image failed to load:',
                                photo.url
                              )

                              event.currentTarget.style.display =
                                'none'
                            }}
                          />

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
                              group-hover/card:bg-black/20
                              group-hover/card:opacity-100
                            "
                          >

                            <span
                              className="
                                rounded-full
                                bg-white/95
                                px-3
                                py-1.5
                                text-[10px]
                                font-semibold
                                text-gray-800
                                shadow-lg
                              "
                            >
                              View Full
                            </span>

                          </div>

                        </div>

                        {/* ========================================
                            TITLE
                        ======================================== */}

                        <p
                          className="
                            mt-2.5
                            line-clamp-1
                            text-xs
                            font-semibold
                            text-[var(--text-h)]
                          "
                        >
                          {photo.title ||
                            'Untitled Photo'}
                        </p>

                        {/* ========================================
                            DESCRIPTION
                        ======================================== */}

                        <p
                          className="
                            mt-1
                            line-clamp-1
                            text-[11px]
                            leading-4
                            text-[var(--secondary-text)]
                          "
                        >
                          {photo.description ||
                            'A treasured moment from our vault.'}
                        </p>

                      </button>
                    )
                  )}

                </div>

              </div>
            )}

          </div>

          {/* ==================================================
              VIEW ALL PHOTOS
          ================================================== */}

          <div className="mt-7 flex justify-center">

            <button
              type="button"
              onClick={
                handleViewAllPhotos
              }
              disabled={
                accessLoading
              }
              className="
                rounded-full
                border
                border-[var(--border)]
                bg-[var(--surface-soft)]
                px-6
                py-3
                text-sm
                font-semibold
                text-[var(--accent-purple)]
                shadow-sm
                transition
                duration-200
                hover:border-[var(--accent-pink)]
                hover:bg-[var(--accent-pink)]
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {accessLoading
                ? 'Checking...'
                : 'View All Photos →'}
            </button>

          </div>

        </div>

      </section>

      {/* ========================================================
          FULL IMAGE MODAL
      ======================================================== */}

      {selectedPhoto && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/85
            p-4
            backdrop-blur-sm
          "
          onClick={
            handleClosePhoto
          }
          role="dialog"
          aria-modal="true"
          aria-label="Full photo viewer"
        >

          {/* ==================================================
              CLOSE BUTTON
          ================================================== */}

          <button
            type="button"
            onClick={
              handleClosePhoto
            }
            className="
              absolute
              right-4
              top-4
              z-[10001]
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-white
              text-2xl
              font-semibold
              text-gray-800
              shadow-xl
              transition
              hover:scale-105
              hover:bg-gray-100
              focus:outline-none
            "
            aria-label="Close photo"
          >
            ×
          </button>

          {/* ==================================================
              IMAGE VIEWER
          ================================================== */}

          <div
            className="
              relative
              flex
              max-h-[95vh]
              max-w-[96vw]
              flex-col
              items-center
              justify-center
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ================================================
                FULL IMAGE
            ================================================ */}

            <div
              className="
                flex
                max-h-[80vh]
                max-w-[96vw]
                items-center
                justify-center
                overflow-hidden
                rounded-2xl
                bg-black/20
              "
            >

              <img
                src={selectedPhoto.url}
                alt={
                  selectedPhoto.title ||
                  'Full size friendship memory'
                }
                className="
                  block
                  max-h-[80vh]
                  max-w-[96vw]
                  object-contain
                  rounded-2xl
                  shadow-2xl
                "
                onError={(event) => {
                  console.error(
                    '❌ Full image failed to load:',
                    selectedPhoto.url
                  )
                }}
              />

            </div>

            {/* ================================================
                IMAGE INFO
            ================================================ */}

            <div
              className="
                mt-4
                w-full
                max-w-2xl
                rounded-2xl
                border
                border-white/20
                bg-white/95
                px-5
                py-4
                shadow-xl
              "
            >

              <h3
                className="
                  text-base
                  font-semibold
                  text-gray-900
                "
              >
                {selectedPhoto.title ||
                  'Untitled Photo'}
              </h3>

              {selectedPhoto.description && (
                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-gray-600
                  "
                >
                  {selectedPhoto.description}
                </p>
              )}

            </div>

          </div>

        </div>
      )}
    </>
  )
}

export default PhotoStrip