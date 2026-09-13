import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'

import { useAuth } from '../contexts/AuthContext.jsx'

const API_URL = 'http://localhost:5000'

function VideoPreview() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [videos, setVideos] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)

  const [accessStatus, setAccessStatus] = useState('none')
  const [accessLoading, setAccessLoading] = useState(true)

  const [loadingVideos, setLoadingVideos] = useState(true)
  const [videoError, setVideoError] = useState('')

  const [selectedVideo, setSelectedVideo] = useState(null)

  const trackRef = useRef(null)

  // ============================================================
  // LOAD VIDEOS FROM BACKEND
  // ============================================================

  useEffect(() => {
    let isMounted = true

    const loadVideos = async () => {
      try {
        setLoadingVideos(true)
        setVideoError('')

        const response = await fetch(
          `${API_URL}/api/media/type/video`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Failed to load videos'
          )
        }

        if (!isMounted) {
          return
        }

        const fetchedVideos = Array.isArray(data.data)
          ? data.data
          : []

        setVideos(fetchedVideos)
        setActiveIndex(0)
      } catch (error) {
        console.error(
          '❌ Video loading error:',
          error
        )

        if (isMounted) {
          setVideoError(
            'Videos could not be loaded right now.'
          )

          setVideos([])
        }
      } finally {
        if (isMounted) {
          setLoadingVideos(false)
        }
      }
    }

    loadVideos()

    return () => {
      isMounted = false
    }
  }, [])

  // ============================================================
  // CHECK ACCESS STATUS
  // ============================================================

  useEffect(() => {
    let isMounted = true

    const loadAccessStatus = async () => {
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

        const data = await response.json()

        if (isMounted) {
          setAccessStatus(
            data.accessStatus || 'none'
          )
        }
      } catch (error) {
        console.error(
          'Access status error:',
          error
        )

        if (isMounted) {
          setAccessStatus('none')
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
  // CLOSE VIDEO MODAL WITH ESC
  // ============================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedVideo(null)
      }
    }

    if (selectedVideo) {
      document.addEventListener(
        'keydown',
        handleEscape
      )

      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      )

      document.body.style.overflow = ''
    }
  }, [selectedVideo])

  // ============================================================
  // HOVER VIDEO PLAY
  //
  // Mouse enter:
  //   → muted autoplay
  //
  // Mouse leave:
  //   → pause
  //   → return to beginning
  // ============================================================

  const handleVideoMouseEnter = async (event) => {
    const video = event.currentTarget

    if (!video) {
      return
    }

    try {
      video.currentTime = 0

      await video.play()
    } catch (error) {
      // Browser may block autoplay in some situations.
      // Since video is muted, this normally works.
      console.debug(
        'Video autoplay was prevented:',
        error
      )
    }
  }

  const handleVideoMouseLeave = (event) => {
    const video = event.currentTarget

    if (!video) {
      return
    }

    video.pause()

    try {
      video.currentTime = 0
    } catch (error) {
      console.debug(
        'Could not reset video:',
        error
      )
    }
  }

  // ============================================================
  // SLIDER
  // ============================================================

  const handleSlide = (direction) => {
    if (!videos.length) {
      return
    }

    const nextIndex =
      direction === 'next'
        ? Math.min(
            activeIndex + 1,
            videos.length - 1
          )
        : Math.max(activeIndex - 1, 0)

    setActiveIndex(nextIndex)

    const track = trackRef.current

    if (track) {
      const slide =
        track.children[nextIndex]

      slide?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      })
    }
  }

  // ============================================================
  // OPEN FULL VIDEO
  // ============================================================

  const handleOpenVideo = (video) => {
    if (!video?.url) {
      return
    }

    setSelectedVideo(video)
  }

  // ============================================================
  // LOGIN ALERT
  // ============================================================

  const showLoginAlert = async () => {
    await Swal.fire({
      icon: 'info',

      title: 'Login Required 💌',

      text:
        'Please sign in with your Gmail first to explore these private videos.',

      confirmButtonText: 'Okay ❤️',

      confirmButtonColor: '#c83d67',
    })
  }

  // ============================================================
  // PENDING ALERT
  // ============================================================

  const showPendingAlert = async () => {
    await Swal.fire({
      icon: 'info',

      title: 'Request Pending ⏳',

      html: `
        <p style="margin-bottom: 8px;">
          Your request is safely with me. ❤️
        </p>

        <p>
          Please wait a little while — your videos will be waiting for you soon.
        </p>
      `,

      confirmButtonText: 'Okay',

      confirmButtonColor: '#c83d67',
    })
  }

  // ============================================================
  // REQUEST ACCESS
  // ============================================================

  const showRequestModal = async () => {
    const result = await Swal.fire({
      icon: 'question',

      title: 'A Little More to See 💕',

      html: `
        <p style="margin-bottom: 8px;">
          Some of our sweetest moments are kept just for you.
        </p>

        <p>
          Would you like to request access to these private videos?
        </p>
      `,

      showCancelButton: true,

      confirmButtonText: 'Request Access 💌',

      cancelButtonText: 'Maybe Later',

      confirmButtonColor: '#c83d67',

      cancelButtonColor: '#999',

      reverseButtons: true,
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      Swal.fire({
        title: 'Sending your request...',

        text: 'Just a little moment ❤️',

        allowOutsideClick: false,

        allowEscapeKey: false,

        showConfirmButton: false,

        didOpen: () => {
          Swal.showLoading()
        },
      })

      const response = await fetch(
        `${API_URL}/api/access/request`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            firebaseUid: user.uid,

            email: user.email,

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
          data.message || 'Request failed'
        )
      }

      setAccessStatus(
        data.accessStatus || 'pending'
      )

      await Swal.fire({
        icon: 'success',

        title: 'Request Sent 💌',

        html: `
          <p style="margin-bottom: 8px;">
            Your request is safely with me. ❤️
          </p>

          <p>
            I will let you know when your videos are ready.
          </p>
        `,

        confirmButtonText: 'Okay',

        confirmButtonColor: '#c83d67',
      })
    } catch (error) {
      console.error(
        'Access request error:',
        error
      )

      await Swal.fire({
        icon: 'error',

        title:
          'Oops! Something went wrong 💔',

        text:
          'Your request could not be sent right now. Please try again.',

        confirmButtonText: 'Try Again',

        confirmButtonColor: '#c83d67',
      })
    }
  }

  // ============================================================
  // VIEW ALL
  // ============================================================

  const handleViewAll = async () => {
    if (accessLoading) {
      return
    }

    // ----------------------------------------------------------
    // NOT LOGGED IN
    // ----------------------------------------------------------

    if (!user?.uid) {
      await showLoginAlert()
      return
    }

    // ----------------------------------------------------------
    // APPROVED
    // ----------------------------------------------------------

    if (accessStatus === 'approved') {
      const result = await Swal.fire({
        icon: 'success',

        title: "You're In! 💖",

        html: `
          <p style="margin-bottom: 8px;">
            Your private video collection is ready to explore.
          </p>

          <p>
            Come take a look at the moments that move. 🎥✨
          </p>
        `,

        confirmButtonText: 'Open Videos',

        confirmButtonColor: '#c83d67',
      })

      if (result.isConfirmed) {
        navigate('/videos')
      }

      return
    }

    // ----------------------------------------------------------
    // PENDING
    // ----------------------------------------------------------

    if (accessStatus === 'pending') {
      await showPendingAlert()
      return
    }

    // ----------------------------------------------------------
    // NO REQUEST
    // ----------------------------------------------------------

    await showRequestModal()
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ======================================================
            HEADING
        ======================================================= */}

        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">
          Latest Videos 🎥
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-[var(--text-h)]">
          The moments that move.
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">
          Little moving memories from our vault.
          Click a video to watch it in full.
        </p>

        {/* ======================================================
            LOADING
        ======================================================= */}

        {loadingVideos && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="
                  overflow-hidden
                  rounded-[1.75rem]
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  p-4
                  shadow-sm
                "
              >
                <div
                  className="
                    aspect-video
                    animate-pulse
                    rounded-[1.5rem]
                    bg-[var(--surface-soft)]
                  "
                />

                <div className="mt-4 space-y-2">

                  <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--surface-soft)]" />

                  <div className="h-3 w-full animate-pulse rounded bg-[var(--surface-soft)]" />

                  <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--surface-soft)]" />

                </div>
              </div>
            ))}

          </div>
        )}

        {/* ======================================================
            ERROR
        ======================================================= */}

        {!loadingVideos && videoError && (
          <div
            className="
              mt-6
              rounded-[1.5rem]
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-6
              text-center
              shadow-sm
            "
          >
            <p className="text-sm font-medium text-[var(--text-h)]">
              {videoError}
            </p>

            <p className="mt-2 text-xs text-[var(--secondary-text)]">
              Please refresh the page and try again.
            </p>
          </div>
        )}

        {/* ======================================================
            EMPTY
        ======================================================= */}

        {!loadingVideos &&
          !videoError &&
          videos.length === 0 && (
            <div
              className="
                mt-6
                rounded-[1.5rem]
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-8
                text-center
                shadow-sm
              "
            >
              <div className="text-3xl">
                🎥
              </div>

              <p className="mt-3 text-sm font-semibold text-[var(--text-h)]">
                No videos yet
              </p>

              <p className="mt-1 text-sm text-[var(--secondary-text)]">
                New memories will appear here once they are uploaded.
              </p>
            </div>
          )}

        {/* ======================================================
            VIDEO CARDS
        ======================================================= */}

        {!loadingVideos &&
          !videoError &&
          videos.length > 0 && (
            <>
              <div className="mt-6 overflow-hidden">

                <div
                  ref={trackRef}
                  className="
                    flex
                    gap-4
                    overflow-x-auto
                    pb-4
                    scroll-smooth
                  "
                  style={{
                    scrollSnapType:
                      'x mandatory',
                  }}
                >

                  {videos.map(
                    (video, index) => (
                      <article
                        key={
                          video._id ||
                          video.publicId ||
                          `${video.title}-${index}`
                        }
                        className="
                          min-w-[88%]
                          snap-start
                          overflow-hidden
                          rounded-[1.75rem]
                          border
                          border-[var(--border)]
                          bg-[var(--surface)]
                          p-4
                          shadow-sm
                          transition
                          duration-300
                          hover:-translate-y-0.5
                          hover:shadow-md
                          sm:min-w-[48%]
                          lg:min-w-[32%]
                        "
                      >

                        {/* ==================================================
                            VIDEO THUMBNAIL
                        =================================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenVideo(video)
                          }
                          className="
                            group
                            relative
                            block
                            w-full
                            cursor-pointer
                            overflow-hidden
                            rounded-[1.5rem]
                            bg-[var(--surface-soft)]
                            text-left
                            focus:outline-none
                            focus:ring-2
                            focus:ring-[var(--accent-purple)]/40
                          "
                          aria-label={`Play ${
                            video.title ||
                            'video'
                          }`}
                        >

                          <div className="aspect-video w-full">

                            <video
                              src={video.url}
                              preload="metadata"
                              muted
                              playsInline
                              loop
                              onMouseEnter={
                                handleVideoMouseEnter
                              }
                              onMouseLeave={
                                handleVideoMouseLeave
                              }
                              className="
                                h-full
                                w-full
                                object-cover
                                transition
                                duration-300
                                group-hover:scale-[1.03]
                              "
                            />

                          </div>

                          {/* Dark overlay */}

                          <div
                            className="
                              pointer-events-none
                              absolute
                              inset-0
                              bg-black/10
                              transition
                              duration-300
                              group-hover:bg-black/25
                            "
                          />

                          {/* Play button */}

                          <span
                            className="
                              pointer-events-none
                              absolute
                              left-1/2
                              top-1/2
                              flex
                              h-14
                              w-14
                              -translate-x-1/2
                              -translate-y-1/2
                              items-center
                              justify-center
                              rounded-full
                              border
                              border-white/70
                              bg-white/90
                              pl-1
                              text-xl
                              text-[var(--accent-purple)]
                              shadow-lg
                              transition
                              duration-300
                              group-hover:scale-110
                              group-hover:bg-white
                            "
                          >
                            ▶
                          </span>

                        </button>

                        {/* ==================================================
                            TITLE + DESCRIPTION
                        =================================================== */}

                        <div className="mt-4">

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-[var(--text-h)]">
                                {video.title ||
                                  'Untitled Video'}
                              </p>

                              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--secondary-text)]">
                                {video.description ||
                                  'A special moment from The Friendship Vault.'}
                              </p>

                            </div>

                            <span
                              className="
                                shrink-0
                                rounded-full
                                bg-[var(--surface-soft)]
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                text-[var(--accent-purple)]
                              "
                            >
                              Video
                            </span>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenVideo(video)
                            }
                            className="
                              mt-4
                              inline-flex
                              w-full
                              items-center
                              justify-center
                              rounded-xl
                              border
                              border-[var(--border)]
                              bg-[var(--surface-soft)]
                              px-4
                              py-2.5
                              text-xs
                              font-semibold
                              text-[var(--accent-purple)]
                              transition
                              duration-200
                              hover:border-[var(--accent-pink)]
                              hover:bg-[var(--accent-pink)]
                              hover:text-white
                            "
                          >
                            WATCH FULL VIDEO ▶
                          </button>

                        </div>

                      </article>
                    )
                  )}

                </div>

              </div>

              {/* ========================================================
                  CONTROLS
              ========================================================= */}

              <div className="mt-6 flex justify-center gap-3">

                {/* PREVIOUS */}

                <button
                  type="button"
                  onClick={() =>
                    handleSlide('prev')
                  }
                  disabled={
                    activeIndex === 0
                  }
                  className="
                    inline-flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-[8px]
                    border
                    border-[var(--border)]
                    bg-[var(--surface-soft)]
                    text-lg
                    font-semibold
                    text-[var(--accent-purple)]
                    transition
                    duration-200
                    hover:bg-[var(--accent-pink)]
                    hover:text-white
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                  aria-label="Previous video"
                >
                  ←
                </button>

                {/* VIEW ALL */}

                <button
                  type="button"
                  onClick={handleViewAll}
                  disabled={
                    accessLoading
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-[8px]
                    border
                    border-[var(--border)]
                    bg-[var(--surface-soft)]
                    px-6
                    py-3
                    text-sm
                    font-semibold
                    text-[var(--accent-purple)]
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
                    ? 'CHECKING...'
                    : 'VIEW ALL'}
                </button>

                {/* NEXT */}

                <button
                  type="button"
                  onClick={() =>
                    handleSlide('next')
                  }
                  disabled={
                    activeIndex ===
                    videos.length - 1
                  }
                  className="
                    inline-flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-[8px]
                    border
                    border-[var(--border)]
                    bg-[var(--surface-soft)]
                    text-lg
                    font-semibold
                    text-[var(--accent-purple)]
                    transition
                    duration-200
                    hover:bg-[var(--accent-pink)]
                    hover:text-white
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                  aria-label="Next video"
                >
                  →
                </button>

              </div>
            </>
          )}

      </div>

      {/* ============================================================
          FULL VIDEO MODAL
      ============================================================ */}

      {selectedVideo && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/80
            p-4
            backdrop-blur-sm
            sm:p-6
          "
          role="dialog"
          aria-modal="true"
          aria-label={
            selectedVideo.title ||
            'Full video'
          }
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedVideo(null)
            }
          }}
        >

          <div
            className="
              relative
              w-full
              max-w-5xl
              overflow-hidden
              rounded-[1.5rem]
              border
              border-white/10
              bg-[var(--surface)]
              shadow-2xl
            "
          >

            {/* CLOSE */}

            <button
              type="button"
              onClick={() =>
                setSelectedVideo(null)
              }
              className="
                absolute
                right-3
                top-3
                z-20
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-black/60
                text-xl
                font-semibold
                text-white
                transition
                hover:bg-black/80
              "
              aria-label="Close video"
            >
              ×
            </button>

            {/* FULL VIDEO */}

            <div className="bg-black">

              <video
                key={selectedVideo.url}
                src={selectedVideo.url}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="
                  max-h-[72vh]
                  w-full
                  object-contain
                "
              />

            </div>

            {/* VIDEO INFORMATION */}

            <div className="p-5 sm:p-6">

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
                    Video
                  </p>

                  <h3 className="mt-2 text-xl font-semibold text-[var(--text-h)]">
                    {selectedVideo.title ||
                      'Untitled Video'}
                  </h3>

                  {selectedVideo.description && (
                    <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">
                      {
                        selectedVideo.description
                      }
                    </p>
                  )}

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedVideo(null)
                  }
                  className="
                    shrink-0
                    rounded-xl
                    border
                    border-[var(--border)]
                    bg-[var(--surface-soft)]
                    px-4
                    py-2
                    text-xs
                    font-semibold
                    text-[var(--accent-purple)]
                    transition
                    hover:bg-[var(--accent-pink)]
                    hover:text-white
                  "
                >
                  CLOSE
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </section>
  )
}

export default VideoPreview