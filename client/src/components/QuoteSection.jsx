
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { getIdToken } from 'firebase/auth'

import { useAuth } from '../contexts/AuthContext.jsx'

const API_URL = 'https://treasured-moments.vercel.app'

// ============================================================
// QUOTE SECTION
// ============================================================

function QuoteSection() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [quotes, setQuotes] = useState([])

  const [activeIndex, setActiveIndex] = useState(0)

  const [accessStatus, setAccessStatus] =
    useState('none')

  const [checkingAccess, setCheckingAccess] =
    useState(true)

  const [loadingQuotes, setLoadingQuotes] =
    useState(true)

  const [quoteError, setQuoteError] =
    useState('')

  const trackRef = useRef(null)

  // ============================================================
  // LOAD QUOTES
  //
  // Quotes are stored as:
  //
  // resourceType: image
  // mediaType: quote
  //
  // We load image resources and then keep only quote media.
  // ============================================================

  useEffect(() => {
    let isMounted = true

    async function loadQuotes() {
      try {
        setLoadingQuotes(true)
        setQuoteError('')

        const token = user
          ? await getIdToken(user)
          : null

        const response = await fetch(
          `${API_URL}/api/media/type/image`,
          {
            method: 'GET',

            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load quotes'
          )
        }

        if (!isMounted) {
          return
        }

        const imageData =
          Array.isArray(data.data)
            ? data.data
            : []

        // --------------------------------------------------------
        // ONLY QUOTE MEDIA
        // --------------------------------------------------------

        const quoteData =
          imageData.filter(
            (item) =>
              item?.mediaType === 'quote'
          )

        setQuotes(quoteData)
        setActiveIndex(0)
      } catch (error) {
        console.error(
          '❌ Quote loading error:',
          error
        )

        if (isMounted) {
          setQuoteError(
            'Quotes could not be loaded right now.'
          )

          setQuotes([])
        }
      } finally {
        if (isMounted) {
          setLoadingQuotes(false)
        }
      }
    }

    loadQuotes()

    return () => {
      isMounted = false
    }
  }, [user])

  // ============================================================
  // CHECK ACCESS STATUS
  // ============================================================

  useEffect(() => {
    let isMounted = true

    if (!user?.uid) {
      setAccessStatus('none')
      setCheckingAccess(false)

      return () => {
        isMounted = false
      }
    }

    async function loadAccessStatus() {
      try {
        setCheckingAccess(true)

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

        if (isMounted) {
          setAccessStatus(
            data.accessStatus || 'none'
          )
        }
      } catch (error) {
        console.error(
          '❌ Quote access status error:',
          error
        )

        if (isMounted) {
          setAccessStatus('none')
        }
      } finally {
        if (isMounted) {
          setCheckingAccess(false)
        }
      }
    }

    loadAccessStatus()

    return () => {
      isMounted = false
    }
  }, [user])

  // ============================================================
  // KEEP ACTIVE INDEX VALID
  // ============================================================

  useEffect(() => {
    if (quotes.length === 0) {
      setActiveIndex(0)
      return
    }

    if (activeIndex >= quotes.length) {
      setActiveIndex(
        quotes.length - 1
      )
    }
  }, [quotes.length, activeIndex])

  // ============================================================
  // SLIDER
  // ============================================================

  const handleSlide = (direction) => {
    if (!quotes.length) {
      return
    }

    const nextIndex =
      direction === 'next'
        ? Math.min(
            activeIndex + 1,
            quotes.length - 1
          )
        : Math.max(
            activeIndex - 1,
            0
          )

    setActiveIndex(nextIndex)

    const track = trackRef.current

    if (track) {
      const slide =
        track.children[nextIndex]

      slide?.scrollIntoView({
        behavior: 'smooth',
        inline: 'start',
        block: 'nearest',
      })
    }
  }

  // ============================================================
  // ESCAPE HTML
  // ============================================================

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  // ============================================================
  // OPEN FULL QUOTE
  // ============================================================

  const handleOpenQuote = (quote) => {
    if (!quote?.url) {
      return
    }

    Swal.fire({
      width: 'min(1000px, 95vw)',

      background:
        'var(--surface)',

      color:
        'var(--text-h)',

      showConfirmButton: false,

      showCloseButton: true,

      padding: '1rem',

      html: `
        <div
          style="
            width:100%;
            text-align:left;
          "
        >

          <div
            style="
              width:100%;
              display:flex;
              justify-content:center;
              align-items:center;
              background:var(--surface-soft);
              border-radius:18px;
              overflow:hidden;
              margin-bottom:18px;
            "
          >

            <img
              src="${quote.url}"
              alt="${escapeHtml(
                quote.title ||
                  'Quote'
              )}"
              style="
                display:block;
                width:100%;
                max-height:75vh;
                object-fit:contain;
                border-radius:18px;
              "
            />

          </div>

          <div
            style="
              padding:0 6px 4px;
            "
          >

            <p
              style="
                margin:0;
                font-size:11px;
                font-weight:700;
                letter-spacing:0.25em;
                text-transform:uppercase;
                color:var(--accent-purple);
              "
            >
              Quote 💌
            </p>

            <h3
              style="
                margin:8px 0 0;
                font-size:22px;
                font-weight:700;
                color:var(--text-h);
              "
            >
              ${escapeHtml(
                quote.title ||
                  'A Little Quote'
              )}
            </h3>

            ${
              quote.description
                ? `
                  <p
                    style="
                      margin:8px 0 0;
                      font-size:14px;
                      line-height:1.7;
                      color:var(--secondary-text);
                    "
                  >
                    ${escapeHtml(
                      quote.description
                    )}
                  </p>
                `
                : ''
            }

          </div>

        </div>
      `,
    })
  }

  // ============================================================
  // LOGIN ALERT
  // ============================================================

  const showLoginAlert = async () => {
    await Swal.fire({
      icon: 'info',

      title:
        'A Little Something Special 💌',

      text:
        'Please sign in with Google first to explore these private quotes.',

      confirmButtonText:
        'Okay ❤️',

      confirmButtonColor:
        '#d9466f',
    })
  }

  // ============================================================
  // PENDING ALERT
  // ============================================================

  const showPendingAlert = async () => {
    await Swal.fire({
      icon: 'info',

      title:
        'Request Pending ⏳',

      html: `
        <p style="margin-bottom:8px;">
          Your request is safely with me. ❤️
        </p>

        <p>
          Please wait a little while —
          these little quotes will be
          waiting for you soon.
        </p>
      `,

      confirmButtonText:
        'Okay',

      confirmButtonColor:
        '#d9466f',
    })
  }

  // ============================================================
  // REQUEST ACCESS MODAL
  // ============================================================

  const showRequestModal = async () => {
    const result =
      await Swal.fire({
        icon: 'question',

        title:
          'A Little More to See 💕',

        html: `
          <p style="margin-bottom:8px;">
            Some little words and feelings
            are kept just for you.
          </p>

          <p>
            Would you like to request access
            to these private quotes?
          </p>
        `,

        showCancelButton: true,

        confirmButtonText:
          'Request Access 💌',

        cancelButtonText:
          'Maybe Later',

        confirmButtonColor:
          '#d9466f',

        cancelButtonColor:
          '#aaa',

        reverseButtons: true,
      })

    if (!result.isConfirmed) {
      return
    }

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
        await getIdToken(user)

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
          'Request Sent! 💌',

        html: `
          <p style="margin-bottom:8px;">
            Your request is now waiting
            for a little approval.
          </p>

          <p>
            I'll let you in as soon as
            your access is approved. ❤️
          </p>
        `,

        confirmButtonText:
          'Lovely',

        confirmButtonColor:
          '#d9466f',
      })
    } catch (error) {
      console.error(
        '❌ Quote access request error:',
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
          '#d9466f',
      })
    }
  }

  // ============================================================
  // VIEW ALL QUOTES
  // ============================================================

  const handleViewAll = async () => {
    if (checkingAccess) {
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
      const result =
        await Swal.fire({
          icon: 'success',

          title:
            "You're In! 💖",

          html: `
            <p style="margin-bottom:8px;">
              Your little collection of
              quotes is ready to explore.
            </p>

            <p>
              Come take a look at the words
              that hold a little meaning. ✨
            </p>
          `,

          confirmButtonText:
            'Open Quotes',

          confirmButtonColor:
            '#d9466f',
        })

      if (result.isConfirmed) {
        navigate('/quotes')
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
    <section
      className="
        px-4
        py-14
        sm:px-6
        lg:px-8
      "
    >

      <div
        className="
          mx-auto
          max-w-6xl
        "
      >

        {/* ======================================================
            HEADING
        ======================================================= */}

        <p
          className="
            text-sm
            font-semibold
            uppercase
            tracking-[0.35em]
            text-[var(--accent-purple)]
          "
        >
          Little Quotes 💌
        </p>

        <h2
          className="
            mt-2
            text-2xl
            font-semibold
            text-[var(--text-h)]
            sm:text-3xl
          "
        >
          A few words worth keeping close.
        </h2>

        <p
          className="
            mt-2
            max-w-2xl
            text-sm
            leading-6
            text-[var(--secondary-text)]
          "
        >
          Little words, feelings, and thoughts
          saved as tiny pieces of our story.
        </p>

        {/* ======================================================
            LOADING
        ======================================================= */}

        {loadingQuotes && (
          <div
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >

            {[1, 2, 3].map(
              (item) => (
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
                      aspect-[4/3]
                      animate-pulse
                      rounded-[1.5rem]
                      bg-[var(--surface-soft)]
                    "
                  />

                  <div
                    className="
                      mt-4
                      h-4
                      w-2/3
                      animate-pulse
                      rounded
                      bg-[var(--surface-soft)]
                    "
                  />

                  <div
                    className="
                      mt-2
                      h-3
                      w-full
                      animate-pulse
                      rounded
                      bg-[var(--surface-soft)]
                    "
                  />

                </div>
              )
            )}

          </div>
        )}

        {/* ======================================================
            ERROR
        ======================================================= */}

        {!loadingQuotes &&
          quoteError && (
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

              <p
                className="
                  text-sm
                  font-medium
                  text-[var(--secondary-text)]
                "
              >
                {quoteError}
              </p>

            </div>
          )}

        {/* ======================================================
            EMPTY
        ======================================================= */}

        {!loadingQuotes &&
          !quoteError &&
          quotes.length === 0 && (
            <div
              className="
                mt-6
                rounded-[1.75rem]
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-8
                text-center
                shadow-sm
              "
            >

              <div className="text-4xl">
                💌
              </div>

              <h3
                className="
                  mt-4
                  text-xl
                  font-semibold
                  text-[var(--text-h)]
                "
              >
                No quotes yet
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  text-[var(--secondary-text)]
                "
              >
                Your little quote collection
                will appear here once quote
                images are uploaded.
              </p>

            </div>
          )}

        {/* ======================================================
            QUOTE CARDS
        ======================================================= */}

        {!loadingQuotes &&
          !quoteError &&
          quotes.length > 0 && (
            <>
              <div
                className="
                  mt-6
                  overflow-hidden
                "
              >

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

                  {quotes.map(
                    (quote, index) => (
                      <article
                        key={
                          quote._id ||
                          quote.publicId ||
                          `${quote.title}-${index}`
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
                          hover:-translate-y-1
                          hover:shadow-lg
                          sm:min-w-[48%]
                          lg:min-w-[32%]
                        "
                      >

                        {/* ==================================================
                            QUOTE IMAGE
                        =================================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenQuote(
                              quote
                            )
                          }
                          className="
                            group
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
                          aria-label={`Open ${
                            quote.title ||
                            'quote'
                          }`}
                        >

                          <div
                            className="
                              aspect-[4/3]
                              w-full
                              overflow-hidden
                            "
                          >

                            <img
                              src={quote.url}
                              alt={
                                quote.title ||
                                'Quote'
                              }
                              loading={
                                index < 3
                                  ? 'eager'
                                  : 'lazy'
                              }
                              className="
                                h-full
                                w-full
                                object-cover
                                transition
                                duration-500
                                group-hover:scale-105
                              "
                            />

                          </div>

                        </button>

                        {/* ==================================================
                            QUOTE INFO
                        =================================================== */}

                        <div className="mt-4">

                          <div
                            className="
                              flex
                              items-start
                              justify-between
                              gap-3
                            "
                          >

                            <div className="min-w-0">

                              <p
                                className="
                                  truncate
                                  text-sm
                                  font-semibold
                                  text-[var(--text-h)]
                                "
                              >
                                {quote.title ||
                                  'A Little Quote'}
                              </p>

                              {quote.description && (
                                <p
                                  className="
                                    mt-1
                                    line-clamp-2
                                    text-sm
                                    leading-6
                                    text-[var(--secondary-text)]
                                  "
                                >
                                  {
                                    quote.description
                                  }
                                </p>
                              )}

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
                              Quote
                            </span>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenQuote(
                                quote
                              )
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
                            VIEW FULL QUOTE →
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

              <div
                className="
                  mt-6
                  flex
                  justify-center
                  gap-3
                "
              >

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
                  aria-label="Previous quote"
                >
                  ←
                </button>

                {/* VIEW ALL */}

                <button
                  type="button"
                  onClick={
                    handleViewAll
                  }
                  disabled={
                    checkingAccess
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
                  {checkingAccess
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
                    quotes.length - 1
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
                  aria-label="Next quote"
                >
                  →
                </button>

              </div>
            </>
          )}

        {/* ============================================================
            APPROVED ACCESS INFO
        ============================================================ */}

        {accessStatus === 'approved' && (
          <div
            className="
              mt-8
              rounded-[1.75rem]
              border
              border-[var(--border)]
              bg-[var(--surface-soft)]
              p-5
            "
          >

            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.3em]
                text-[var(--accent-purple)]
              "
            >
              Private Quotes 🔓
            </p>

            <h3
              className="
                mt-2
                text-xl
                font-semibold
                text-[var(--text-h)]
              "
            >
              Your access is approved ❤️
            </h3>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-[var(--secondary-text)]
              "
            >
              You can now explore the complete
              collection of private content.
            </p>

          </div>
        )}

      </div>
    </section>
  )
}

export default QuoteSection

