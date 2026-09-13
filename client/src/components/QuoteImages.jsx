import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

const API_URL = 'http://localhost:5000'

// ============================================================
// QUOTE IMAGES
//
// Loads media with:
// resourceType: image
// mediaType: quote
//
// This component is responsible only for displaying
// quote images.
// ============================================================

function QuoteImages() {
  const [quotes, setQuotes] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // ==========================================================
  // LOAD QUOTE IMAGES
  // ==========================================================

  useEffect(() => {
    let isMounted = true

    const loadQuotes = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_URL}/api/media/type/image`
        )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load quote images'
          )
        }

        if (!isMounted) {
          return
        }

        const allImages =
          Array.isArray(data.data)
            ? data.data
            : []

        // ------------------------------------------------------
        // ONLY QUOTE MEDIA
        // ------------------------------------------------------

        const quoteImages =
          allImages.filter(
            (item) =>
              item?.mediaType === 'quote'
          )

        setQuotes(quoteImages)
      } catch (error) {
        console.error(
          '❌ Quote images loading error:',
          error
        )

        if (isMounted) {
          setQuotes([])

          setError(
            'Quote images could not be loaded right now.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadQuotes()

    return () => {
      isMounted = false
    }
  }, [])

  // ==========================================================
  // OPEN QUOTE IMAGE
  // ==========================================================

  const handleOpenQuote = (quote) => {
    if (!quote?.url) {
      return
    }

    Swal.fire({
      width: 'min(900px, 95vw)',

      background: 'var(--surface)',

      color: 'var(--text-h)',

      showConfirmButton: false,

      showCloseButton: true,

      padding: '1rem',

      html: `
        <div
          style="
            width:100%;
            text-align:center;
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
            "
          >

            <img
              src="${escapeHtml(
                quote.url
              )}"
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

          ${
            quote.title
              ? `
                <h3
                  style="
                    margin:16px 4px 0;
                    font-size:20px;
                    font-weight:700;
                    color:var(--text-h);
                  "
                >
                  ${escapeHtml(
                    quote.title
                  )}
                </h3>
              `
              : ''
          }

          ${
            quote.description
              ? `
                <p
                  style="
                    margin:8px 4px 0;
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
      `,
    })
  }

  // ==========================================================
  // ESCAPE HTML
  // ==========================================================

  function escapeHtml(value) {
    return String(value)
      .replaceAll(
        '&',
        '&amp;'
      )
      .replaceAll(
        '<',
        '&lt;'
      )
      .replaceAll(
        '>',
        '&gt;'
      )
      .replaceAll(
        '"',
        '&quot;'
      )
      .replaceAll(
        "'",
        '&#039;'
      )
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="
                overflow-hidden
                rounded-[1.5rem]
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-3
                shadow-sm
              "
            >

              <div
                className="
                  aspect-[4/5]
                  animate-pulse
                  rounded-[1.25rem]
                  bg-[var(--surface-soft)]
                "
              />

            </div>
          )
        )}

      </div>
    )
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
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

        <p className="text-sm font-medium text-[var(--secondary-text)]">
          {error}
        </p>

      </div>
    )
  }

  // ==========================================================
  // EMPTY
  // ==========================================================

  if (quotes.length === 0) {
    return (
      <div
        className="
          mt-6
          rounded-[1.5rem]
          border
          border-[var(--border)]
          bg-[var(--surface-soft)]
          p-8
          text-center
        "
      >

        <div className="text-3xl">
          💌
        </div>

        <p className="mt-3 text-sm font-semibold text-[var(--text-h)]">
          No quote cards yet
        </p>

        <p className="mt-1 text-sm text-[var(--secondary-text)]">
          Beautiful quote cards will appear here
          once they are uploaded.
        </p>

      </div>
    )
  }

  // ==========================================================
  // QUOTE IMAGES
  // ==========================================================

  return (
    <div className="mt-6">

      <div
        className="
          grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >

        {quotes.map(
          (quote, index) => (
            <article
              key={
                quote._id ||
                quote.publicId ||
                `${quote.title}-${index}`
              }
              onClick={() =>
                handleOpenQuote(
                  quote
                )
              }
              className="
                group
                cursor-pointer
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

              {/* ==============================================
                  QUOTE IMAGE
              =============================================== */}

              <div
                className="
                  relative
                  aspect-[4/5]
                  overflow-hidden
                  rounded-[1.25rem]
                  bg-[var(--surface-soft)]
                "
              >

                <img
                  src={quote.url}
                  alt={
                    quote.title ||
                    'Quote'
                  }
                  loading={
                    index < 4
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

                {/* ==========================================
                    HOVER OVERLAY
                =========================================== */}

                <div
                  className="
                    absolute
                    inset-0
                    flex
                    items-center
                    justify-center
                    bg-black/0
                    transition
                    duration-300
                    group-hover:bg-black/15
                  "
                >

                  <span
                    className="
                      flex
                      h-11
                      w-11
                      scale-90
                      items-center
                      justify-center
                      rounded-full
                      bg-white/90
                      text-lg
                      text-[var(--accent-purple)]
                      opacity-0
                      shadow-lg
                      transition
                      duration-300
                      group-hover:scale-100
                      group-hover:opacity-100
                    "
                  >
                    ↗
                  </span>

                </div>

              </div>

              {/* ==============================================
                  QUOTE INFO
              =============================================== */}

              <div className="px-1 pb-1 pt-3">

                <div className="flex items-start justify-between gap-2">

                  <p className="min-w-0 truncate text-sm font-semibold text-[var(--text-h)]">
                    {quote.title ||
                      'A Little Quote'}
                  </p>

                  <span
                    className="
                      shrink-0
                      rounded-full
                      bg-[var(--surface-soft)]
                      px-2.5
                      py-1
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-[var(--accent-purple)]
                    "
                  >
                    Quote
                  </span>

                </div>

                {quote.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--secondary-text)]">
                    {quote.description}
                  </p>
                )}

                <p className="mt-2 text-[11px] font-medium text-[var(--accent-purple)]">
                  Click to view ✨
                </p>

              </div>

            </article>
          )
        )}

      </div>

    </div>
  )
}

export default QuoteImages