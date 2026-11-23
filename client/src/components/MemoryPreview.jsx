import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { getIdToken } from 'firebase/auth'

import { useAuth } from '../contexts/AuthContext.jsx'

const API_URL = 'https://treasured-moments.vercel.app'

// ============================================================
// MEMORY PREVIEW
//
// HOME PAGE
//
// Shows ONLY the latest 3 MEMORY images.
//
// IMPORTANT:
// - memory category only
// - photo category excluded
// - quote category excluded
// - backend returns newest first
// - only latest 3 memories are shown
// - full collection opens at /memories
// ============================================================

function MemoryPreview() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [memories, setMemories] = useState([])

  const [accessStatus, setAccessStatus] =
    useState('none')

  const [checkingAccess, setCheckingAccess] =
    useState(true)

  const [loadingMemories, setLoadingMemories] =
    useState(true)

  const [memoryError, setMemoryError] =
    useState('')

  // ============================================================
  // LOAD LATEST MEMORY IMAGES
  //
  // Endpoint:
  // GET /api/media/category/memory
  //
  // This endpoint returns ONLY:
  //
  // mediaType = memory
  //
  // Therefore:
  // photo  ❌
  // quote  ❌
  // video  ❌
  // memory ✅
  // ============================================================

  useEffect(() => {
    let cancelled = false

    const loadMemories = async () => {
      if (!user) {
        if (!cancelled) {
          setMemories([])
          setLoadingMemories(false)
        }

        return
      }

      try {
        setLoadingMemories(true)
        setMemoryError('')

        // ------------------------------------------------------
        // GET FIREBASE TOKEN
        // ------------------------------------------------------

        const token =
          await getIdToken(user, true)

        // ------------------------------------------------------
        // FETCH MEMORY CATEGORY
        // ------------------------------------------------------

        const response = await fetch(
          `${API_URL}/api/media/category/memory`,
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
          '📸 MemoryPreview API response:',
          data
        )

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load memories'
          )
        }

        if (!data.success) {
          throw new Error(
            data.message ||
              'Failed to load memories'
          )
        }

        // ------------------------------------------------------
        // ONLY MEMORY MEDIA
        // ------------------------------------------------------

        const memoryItems =
          Array.isArray(data.data)
            ? data.data.filter(
                (memory) =>
                  memory?.mediaType ===
                    'memory' &&
                  memory?.resourceType ===
                    'image'
              )
            : []

        // ------------------------------------------------------
        // NEWEST FIRST
        //
        // Backend already sorts by createdAt DESC.
        // Sorting again here keeps frontend safe.
        // ------------------------------------------------------

        memoryItems.sort(
          (a, b) =>
            new Date(
              b.createdAt || 0
            ).getTime() -
            new Date(
              a.createdAt || 0
            ).getTime()
        )

        if (!cancelled) {
          setMemories(memoryItems)
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        console.error(
          '❌ Failed to load memories:',
          error
        )

        setMemoryError(
          error.message ||
            'Memories could not be loaded right now.'
        )

        setMemories([])
      } finally {
        if (!cancelled) {
          setLoadingMemories(false)
        }
      }
    }

    loadMemories()

    return () => {
      cancelled = true
    }
  }, [user])

  // ============================================================
  // CHECK ACCESS STATUS
  //
  // Normal memory access uses the existing
  // email-based owner approval system.
  //
  // Secret Corner is completely separate.
  // ============================================================

  useEffect(() => {
    let cancelled = false

    const loadAccessStatus = async () => {
      if (!user?.uid) {
        if (!cancelled) {
          setAccessStatus('none')
          setCheckingAccess(false)
        }

        return
      }

      try {
        setCheckingAccess(true)

        const response = await fetch(
          `${API_URL}/api/access/status/${encodeURIComponent(
            user.uid
          )}`
        )

        const data =
          await response.json()

        console.log(
          '🔐 Memory access status:',
          data
        )

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load access status'
          )
        }

        if (!cancelled) {
          setAccessStatus(
            data.accessStatus ||
              'none'
          )
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        console.error(
          '❌ Access status error:',
          error
        )

        setAccessStatus('none')
      } finally {
        if (!cancelled) {
          setCheckingAccess(false)
        }
      }
    }

    loadAccessStatus()

    return () => {
      cancelled = true
    }
  }, [user])

  // ============================================================
  // ESCAPE HTML
  // ============================================================

  const escapeHtml = (value) => {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  // ============================================================
  // OPEN FULL IMAGE
  //
  // No React / Comment / Share UI.
  // ============================================================

  const handleOpenImage = (memory) => {
    if (!memory?.url) {
      return
    }

    Swal.fire({
      width: 'min(1100px, 95vw)',

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
              src="${escapeHtml(
                memory.url
              )}"
              alt="${escapeHtml(
                memory.title ||
                  'Memory'
              )}"
              style="
                display:block;
                width:100%;
                max-height:70vh;
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

            <h3
              style="
                margin:0;
                font-size:22px;
                font-weight:700;
                color:var(--text-h);
              "
            >
              ${escapeHtml(
                memory.title ||
                  'Untitled Memory'
              )}
            </h3>

            ${
              memory.description
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
                      memory.description
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

  const showLoginAlert = () => {
    Swal.fire({
      icon: 'info',

      title:
        'A Little Something Special 💌',

      text:
        'Please sign in with Google first to explore these private memories.',

      confirmButtonText:
        'Okay ❤️',

      confirmButtonColor:
        '#d9466f',
    })
  }

  // ============================================================
  // PENDING ALERT
  // ============================================================

  const showPendingAlert = () => {
    Swal.fire({
      icon: 'info',

      title:
        'Request Pending ⏳',

      html: `
        <p style="margin-bottom:8px;">
          Your request is safely with me. ❤️
        </p>

        <p>
          Please wait a little while — your memories
          will be waiting for you soon.
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
            Some of our sweetest memories are kept
            just for you.
          </p>

          <p>
            Would you like to request access
            to these private memories?
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
      // --------------------------------------------------------
      // LOADING ALERT
      // --------------------------------------------------------

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

      // --------------------------------------------------------
      // GET FRESH FIREBASE TOKEN
      // --------------------------------------------------------

      const token =
        await getIdToken(user, true)

      // --------------------------------------------------------
      // SEND ACCESS REQUEST
      // --------------------------------------------------------

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
        '📨 Memory access request response:',
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
          '#d9466f',
      })
    }
  }

  // ============================================================
  // VIEW ALL MEMORIES
  // ============================================================

  const handleViewAll = async () => {
    if (checkingAccess) {
      return
    }

    // ----------------------------------------------------------
    // NOT LOGGED IN
    // ----------------------------------------------------------

    if (!user?.uid) {
      showLoginAlert()
      return
    }

    // ----------------------------------------------------------
    // APPROVED
    // ----------------------------------------------------------

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
              Your little collection of memories
              is ready to explore.
            </p>

            <p>
              Come in and take a walk through
              our favorite moments. ✨
            </p>
          `,

          confirmButtonText:
            'Open Memories',

          confirmButtonColor:
            '#d9466f',
        })

      if (result.isConfirmed) {
        navigate('/memories')
      }

      return
    }

    // ----------------------------------------------------------
    // PENDING
    // ----------------------------------------------------------

    if (
      accessStatus ===
      'pending'
    ) {
      showPendingAlert()
      return
    }

    // ----------------------------------------------------------
    // NO REQUEST
    // ----------------------------------------------------------

    await showRequestModal()
  }

  // ============================================================
  // ONLY LATEST 3 MEMORY ITEMS
  // ============================================================

  const latestMemories =
    memories.slice(0, 3)

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="text-center">

          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">
            Latest Memories 📸
          </p>

          <h2 className="mt-3 text-3xl font-semibold text-[var(--text-h)] sm:text-4xl">
            A little glimpse into our favorite moments.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--secondary-text)]">
            The latest memories added to our
            little friendship vault.
          </p>

        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loadingMemories && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

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

        {/* ====================================================
            ERROR
        ==================================================== */}

        {!loadingMemories &&
          memoryError && (
            <div
              className="
                mt-8
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
                😔
              </div>

              <p className="mt-3 text-sm font-medium text-[var(--secondary-text)]">
                {memoryError}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="
                  mt-5
                  rounded-full
                  bg-[#d9466f]
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:opacity-90
                "
              >
                Try Again
              </button>

            </div>
          )}

        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!loadingMemories &&
          !memoryError &&
          latestMemories.length === 0 && (
            <div
              className="
                mt-8
                rounded-[1.75rem]
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-10
                text-center
                shadow-sm
              "
            >

              <div className="text-4xl">
                📸
              </div>

              <h3 className="mt-4 text-xl font-semibold text-[var(--text-h)]">
                No memories yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--secondary-text)]">
                Your beautiful memories will
                appear here once they are uploaded.
              </p>

            </div>
          )}

        {/* ====================================================
            LATEST 3 MEMORY CARDS
        ==================================================== */}

        {!loadingMemories &&
          !memoryError &&
          latestMemories.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {latestMemories.map(
                (memory, index) => (
                  <article
                    key={
                      memory._id ||
                      memory.publicId ||
                      `${memory.url}-${index}`
                    }
                    onClick={() =>
                      handleOpenImage(
                        memory
                      )
                    }
                    className="
                      group
                      cursor-pointer
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
                        IMAGE
                    ================================================== */}

                    <div
                      className="
                        flex
                        aspect-[4/3]
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-[1.5rem]
                        bg-[var(--surface-soft)]
                      "
                    >

                      <img
                        src={memory.url}
                        alt={
                          memory.title ||
                          'Friendship Vault memory'
                        }
                        loading="lazy"
                        className="
                          h-full
                          w-full
                          object-contain
                          p-1
                          transition
                          duration-500
                          group-hover:scale-[1.03]
                        "
                        onError={(event) => {
                          console.error(
                            '❌ Memory image failed:',
                            memory.url
                          )

                          event.currentTarget.style.display =
                            'none'
                        }}
                      />

                    </div>

                    {/* ==================================================
                        INFO
                    ================================================== */}

                    <div className="mt-4">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-[var(--text-h)]">
                            {memory.title ||
                              'Untitled Memory'}
                          </p>

                          {memory.description && (
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--secondary-text)]">
                              {
                                memory.description
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
                          Memory
                        </span>

                      </div>

                      <p className="mt-3 text-xs font-medium text-[var(--accent-purple)]">
                        Click to view full photo →
                      </p>

                    </div>

                  </article>
                )
              )}

            </div>
          )}

        {/* ====================================================
            VIEW ALL
        ==================================================== */}

        {memories.length > 0 && (
          <div className="mt-7 flex justify-center">

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
              {checkingAccess
                ? 'CHECKING...'
                : 'VIEW ALL MEMORIES →'}
            </button>

          </div>
        )}

        {/* ====================================================
            APPROVED ACCESS INFO
        ==================================================== */}

        {accessStatus ===
          'approved' && (
          <div
            className="
              mt-8
              rounded-[1.75rem]
              border
              border-[var(--border)]
              bg-[var(--surface-soft)]
              p-5
              text-center
            "
          >

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
              Private Memories 🔓
            </p>

            <h3 className="mt-2 text-xl font-semibold text-[var(--text-h)]">
              Your access is approved ❤️
            </h3>

            <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">
              You can now explore the complete
              collection of memories.
            </p>

          </div>
        )}

      </div>

    </section>
  )
}

export default MemoryPreview