import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { getIdToken } from 'firebase/auth'

import { useAuth } from '../contexts/AuthContext.jsx'


const API_URL = 'https://treasured-moments.vercel.app'


// ============================================================
// QUOTE PREVIEW
//
// Home page-এর জন্য quote preview section.
//
// Backend থেকে image media load করে শুধুমাত্র:
// mediaType === "quote"
// এমন media দেখানো হবে.
//
// Home page-এ সর্বোচ্চ 3টি quote দেখাবে.
// Full collection দেখতে access approval প্রয়োজন.
// ============================================================

function QuotePreview() {

  const { user } = useAuth()

  const navigate = useNavigate()


  // ============================================================
  // STATES
  // ============================================================

  const [quotes, setQuotes] = useState([])

  const [loadingQuotes, setLoadingQuotes] =
    useState(true)

  const [quoteError, setQuoteError] =
    useState('')

  const [accessStatus, setAccessStatus] =
    useState('none')

  const [checkingAccess, setCheckingAccess] =
    useState(true)

  const [selectedQuote, setSelectedQuote] =
    useState(null)


  // ============================================================
  // LOAD QUOTES
  //
  // Backend image endpoint থেকে data নিয়ে
  // শুধু quote media আলাদা করা হচ্ছে.
  // ============================================================

  useEffect(() => {

    let isMounted = true


    const loadQuotes = async () => {

      try {

        setLoadingQuotes(true)

        setQuoteError('')


        // ------------------------------------------------------
        // If user is not logged in, preview এখনও load করা যাবে.
        // ------------------------------------------------------

        const headers = {}


        if (user) {

          try {

            const token =
              await getIdToken(user)

            headers.Authorization =
              `Bearer ${token}`

          } catch (tokenError) {

            console.warn(
              '⚠️ Could not get Firebase token:',
              tokenError
            )

          }

        }


        const response =
          await fetch(
            `${API_URL}/api/media/type/image`,
            {
              method: 'GET',
              headers,
            }
          )


        const data =
          await response.json()


        if (!response.ok) {

          throw new Error(
            data.message ||
              'Failed to load quotes'
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
        //
        // createMediaDocument থেকে:
        //
        // mediaType:
        // - memory
        // - quote
        // - video
        // ------------------------------------------------------

        const quoteItems =
          allImages.filter(
            (item) =>
              item?.mediaType === 'quote' &&
              item?.url
          )


        // ------------------------------------------------------
        // Newest quotes first
        // ------------------------------------------------------

        quoteItems.sort(
          (a, b) => {

            const dateA =
              new Date(
                a.createdAt || 0
              ).getTime()

            const dateB =
              new Date(
                b.createdAt || 0
              ).getTime()

            return dateB - dateA

          }
        )


        setQuotes(quoteItems)

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
  // PREVIEW QUOTES
  //
  // Home page-এ সর্বোচ্চ 3টি quote দেখাবে.
  // ============================================================

  const previewQuotes =
    useMemo(
      () =>
        quotes.slice(0, 3),
      [quotes]
    )


  // ============================================================
  // CHECK ACCESS STATUS
  // ============================================================

  useEffect(() => {

    let isMounted = true


    if (!user?.uid) {

      setAccessStatus('none')

      setCheckingAccess(false)

      return

    }


    const loadAccessStatus =
      async () => {

        try {

          setCheckingAccess(true)


          const response =
            await fetch(
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
              data.accessStatus ||
                'none'
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
  // OPEN QUOTE
  // ============================================================

  const handleOpenQuote = (
    quote
  ) => {

    if (!quote?.url) {
      return
    }


    setSelectedQuote(quote)

  }


  // ============================================================
  // CLOSE QUOTE
  // ============================================================

  const closeQuote = () => {

    setSelectedQuote(null)

  }


  // ============================================================
  // ESC KEY
  // ============================================================

  useEffect(() => {

    const handleEscape = (
      event
    ) => {

      if (
        event.key === 'Escape'
      ) {

        closeQuote()

      }

    }


    if (selectedQuote) {

      document.addEventListener(
        'keydown',
        handleEscape
      )

      document.body.style.overflow =
        'hidden'

    }


    return () => {

      document.removeEventListener(
        'keydown',
        handleEscape
      )

      document.body.style.overflow =
        ''

    }

  }, [selectedQuote])


  // ============================================================
  // LOGIN ALERT
  // ============================================================

  const showLoginAlert =
    async () => {

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

  const showPendingAlert =
    async () => {

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
            these little quotes will be waiting
            for you soon.
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

  const showRequestModal =
    async () => {

      const result =
        await Swal.fire({

          icon: 'question',

          title:
            'A Little More to See 💕',

          html: `
            <p style="margin-bottom:8px;">
              Some of the sweetest words
              in our vault are kept just for you.
            </p>

            <p>
              Would you like to request access
              to the complete quote collection?
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

              body:
                JSON.stringify({

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

  const handleViewAll =
    async () => {

      if (checkingAccess) {
        return
      }


      // --------------------------------------------------------
      // NOT LOGGED IN
      // --------------------------------------------------------

      if (!user?.uid) {

        await showLoginAlert()

        return

      }


      // --------------------------------------------------------
      // APPROVED
      // --------------------------------------------------------

      if (
        accessStatus ===
        'approved'
      ) {

        const result =
          await Swal.fire({

            icon: 'success',

            title:
              "You're In! 💖",

            html: `
              <p style="margin-bottom:8px;">
                Your complete quote collection
                is ready to explore.
              </p>

              <p>
                Take a little walk through
                the words that hold our memories. ✨
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


      // --------------------------------------------------------
      // PENDING
      // --------------------------------------------------------

      if (
        accessStatus ===
        'pending'
      ) {

        await showPendingAlert()

        return

      }


      // --------------------------------------------------------
      // NO REQUEST
      // --------------------------------------------------------

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

        <div className="text-center">

          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.35em]
              text-[var(--accent-purple)]
            "
          >
            Little Words 💌
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
            A few words worth keeping.
          </h2>


          <p
            className="
              mx-auto
              mt-3
              max-w-2xl
              text-sm
              leading-6
              text-[var(--secondary-text)]
            "
          >
            Some little words, feelings, and
            memories collected in one place.
          </p>

        </div>


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
          previewQuotes.length === 0 && (

            <div
              className="
                mt-6
                rounded-[1.75rem]
                border
                border-[var(--border)]
                bg-[var(--surface-soft)]
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
                  leading-6
                  text-[var(--secondary-text)]
                "
              >
                Your special quote memories
                will appear here once they are uploaded.
              </p>

            </div>

          )}


        {/* ======================================================
            QUOTE CARDS
        ======================================================= */}

        {!loadingQuotes &&
          !quoteError &&
          previewQuotes.length > 0 && (

            <div
              className="
                mt-6
                grid
                gap-4
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >

              {previewQuotes.map(
                (quote, index) => (

                  <article
                    key={
                      quote._id ||
                      quote.publicId ||
                      `${quote.title}-${index}`
                    }
                    className="
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
                            index === 0
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

                        <div
                          className="
                            min-w-0
                          "
                        >

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
                              {quote.description}
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
                        VIEW QUOTE →
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}


        {/* ======================================================
            VIEW ALL
        ======================================================= */}

        {quotes.length > 0 && (

          <div
            className="
              mt-6
              flex
              justify-center
            "
          >

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
                : 'VIEW ALL QUOTES →'}

            </button>

          </div>

        )}

      </div>


      {/* ========================================================
          FULL QUOTE MODAL
      ========================================================= */}

      {selectedQuote && (

        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/75
            p-4
            backdrop-blur-sm
            sm:p-6
          "
          role="dialog"
          aria-modal="true"
          aria-label={
            selectedQuote.title ||
            'Quote'
          }
          onMouseDown={(
            event
          ) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeQuote()

            }

          }}
        >

          <div
            className="
              relative
              w-full
              max-w-3xl
              overflow-hidden
              rounded-[1.75rem]
              border
              border-white/10
              bg-[var(--surface)]
              shadow-2xl
            "
          >

            {/* ==================================================
                CLOSE BUTTON
            =================================================== */}

            <button
              type="button"
              onClick={
                closeQuote
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
              aria-label="Close quote"
            >
              ×
            </button>


            {/* ==================================================
                FULL QUOTE IMAGE
            =================================================== */}

            <div
              className="
                flex
                max-h-[75vh]
                items-center
                justify-center
                bg-[var(--surface-soft)]
                p-4
                sm:p-6
              "
            >

              <img
                src={
                  selectedQuote.url
                }
                alt={
                  selectedQuote.title ||
                  'Quote'
                }
                className="
                  max-h-[68vh]
                  w-full
                  object-contain
                  rounded-xl
                "
              />

            </div>


            {/* ==================================================
                QUOTE INFORMATION
            =================================================== */}

            <div
              className="
                p-5
                sm:p-6
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
                Quote 💌
              </p>


              <h3
                className="
                  mt-2
                  text-xl
                  font-semibold
                  text-[var(--text-h)]
                "
              >
                {selectedQuote.title ||
                  'A Little Quote'}
              </h3>


              {selectedQuote.description && (

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-[var(--secondary-text)]
                  "
                >
                  {
                    selectedQuote.description
                  }
                </p>

              )}

            </div>

          </div>

        </div>

      )}

    </section>

  )

}


export default QuotePreview