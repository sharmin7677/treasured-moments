import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'

import { useAuth } from '../contexts/AuthContext.jsx'

import {
  getMemories,
} from '../services/mediaService.js'

// ============================================================
// MEMORIES PAGE
//
// FULL MEMORY COLLECTION
//
// IMPORTANT:
// - Access requires owner approval.
// - Only mediaType = memory is loaded.
// - Only image itself is clickable.
// - Full image opens only after clicking the image.
// ============================================================

function Memories() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // ============================================================
  // ACCESS STATE
  // ============================================================

  const [accessStatus, setAccessStatus] =
    useState('checking')

  const [loadingAccess, setLoadingAccess] =
    useState(true)

  // ============================================================
  // MEMORY STATE
  // ============================================================

  const [memories, setMemories] =
    useState([])

  const [loadingMemories, setLoadingMemories] =
    useState(false)

  const [memoryError, setMemoryError] =
    useState('')

  // ============================================================
  // CHECK ACCESS
  // ============================================================

  useEffect(() => {
    if (!user?.uid) {
      setAccessStatus('none')
      setLoadingAccess(false)
      return
    }

    let cancelled = false

    async function checkAccess() {
      try {
        setLoadingAccess(true)

        const response =
          await fetch(
            `https://treasured-moments.vercel.app/api/access/status/${encodeURIComponent(
              user.uid
            )}`
          )

        if (!response.ok) {
          throw new Error(
            'Failed to check access'
          )
        }

        const data =
          await response.json()

        if (cancelled) {
          return
        }

        setAccessStatus(
          data.accessStatus || 'none'
        )
      } catch (error) {
        if (cancelled) {
          return
        }

        console.error(
          '❌ Memories access check failed:',
          error
        )

        setAccessStatus('error')
      } finally {
        if (!cancelled) {
          setLoadingAccess(false)
        }
      }
    }

    checkAccess()

    return () => {
      cancelled = true
    }
  }, [user])

  // ============================================================
  // HANDLE ACCESS RESULT
  // ============================================================

  useEffect(() => {
    if (
      loadingAccess ||
      accessStatus === 'checking'
    ) {
      return
    }

    // NOT LOGGED IN
    if (!user?.uid) {
      navigate('/')
      return
    }

    // APPROVED
    if (accessStatus === 'approved') {
      return
    }

    // PENDING
    if (accessStatus === 'pending') {
      Swal.fire({
        icon: 'info',
        title: 'Request Still Pending ⏳',
        text:
          'Your access request is still waiting for approval.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#d9466f',
      }).then(() => {
        navigate('/home')
      })

      return
    }

    // ERROR
    if (accessStatus === 'error') {
      Swal.fire({
        icon: 'error',
        title: 'Something Went Wrong',
        text:
          'We could not verify your access right now.',
        confirmButtonText: 'Back Home',
        confirmButtonColor: '#d9466f',
      }).then(() => {
        navigate('/home')
      })

      return
    }

    // NO ACCESS
    navigate('/home')
  }, [
    accessStatus,
    loadingAccess,
    navigate,
    user,
  ])

  // ============================================================
  // LOAD ALL MEMORIES
  // ============================================================

  useEffect(() => {
    if (
      loadingAccess ||
      accessStatus !== 'approved' ||
      !user
    ) {
      return
    }

    let cancelled = false

    async function loadMemories() {
      try {
        setLoadingMemories(true)
        setMemoryError('')

        const response =
          await getMemories(user)

        console.log(
          '🧠 MEMORY API RESPONSE:',
          response
        )

        if (cancelled) {
          return
        }

        const memoryData =
          Array.isArray(response?.data)
            ? response.data
            : []

        console.log(
          '🧠 MEMORIES RECEIVED FROM SERVER:',
          memoryData
        )

        setMemories(memoryData)
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
  }, [
    accessStatus,
    loadingAccess,
    user,
  ])

  // ============================================================
  // OPEN FULL IMAGE
  //
  // IMPORTANT:
  // Only image click triggers this.
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
              src="${escapeHtml(memory.url)}"
              alt="${escapeHtml(
                memory.title ||
                  'Memory'
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
  // ACCESS LOADING
  // ============================================================

  if (
    loadingAccess ||
    accessStatus === 'checking'
  ) {
    return (
      <main
        className="
          min-h-screen
          bg-[var(--background)]
          px-4
          py-20
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            mx-auto
            flex
            min-h-[60vh]
            max-w-6xl
            items-center
            justify-center
          "
        >
          <div className="text-center">

            <div
              className="
                mx-auto
                h-10
                w-10
                animate-spin
                rounded-full
                border-4
                border-[var(--border)]
                border-t-[var(--accent-pink)]
              "
            />

            <p
              className="
                mt-5
                text-sm
                font-medium
                text-[var(--secondary-text)]
              "
            >
              Opening our memories...
            </p>

          </div>
        </div>
      </main>
    )
  }

  // ============================================================
  // ACCESS NOT APPROVED
  // ============================================================

  if (
    accessStatus !== 'approved'
  ) {
    return null
  }

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (
    <main
      className="
        min-h-screen
        bg-[var(--background)]
        px-4
        py-10
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
            HEADER
        ======================================================= */}

        <div className="mb-10">

          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.35em]
              text-[var(--accent-purple)]
            "
          >
            Our Memories 🔐
          </p>

          <h1
            className="
              mt-3
              text-4xl
              font-semibold
              text-[var(--text-h)]
              sm:text-5xl
            "
          >
            Our little collection of memories.
          </h1>

          <p
            className="
              mt-4
              max-w-2xl
              text-sm
              leading-7
              text-[var(--secondary-text)]
              sm:text-base
            "
          >
            A collection of moments that deserve
            their own little corner — captured,
            remembered, and kept close.
          </p>

        </div>

        {/* ======================================================
            LOADING
        ======================================================= */}

        {loadingMemories && (
          <section>

            <div
              className="
                grid
                gap-5
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >

              {[1, 2, 3, 4, 5, 6].map(
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

                    {/* IMAGE SKELETON */}

                    <div
                      className="
                        h-[240px]
                        animate-pulse
                        rounded-[1.5rem]
                        bg-[var(--surface-soft)]
                        sm:h-[250px]
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

          </section>
        )}

        {/* ======================================================
            ERROR
        ======================================================= */}

        {!loadingMemories &&
          memoryError && (
            <section>

              <div
                className="
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
                  💔
                </div>

                <h2
                  className="
                    mt-4
                    text-xl
                    font-semibold
                    text-[var(--text-h)]
                  "
                >
                  Memories could not be loaded
                </h2>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-xl
                    text-sm
                    leading-6
                    text-[var(--secondary-text)]
                  "
                >
                  {memoryError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                  className="
                    mt-5
                    rounded-[8px]
                    bg-[var(--accent-pink)]
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

            </section>
          )}

        {/* ======================================================
            EMPTY STATE
        ======================================================= */}

        {!loadingMemories &&
          !memoryError &&
          memories.length === 0 && (
            <section>

              <div
                className="
                  rounded-[1.75rem]
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  p-10
                  text-center
                  shadow-sm
                "
              >

                <div className="text-5xl">
                  📸
                </div>

                <h2
                  className="
                    mt-5
                    text-2xl
                    font-semibold
                    text-[var(--text-h)]
                  "
                >
                  No memories yet
                </h2>

                <p
                  className="
                    mx-auto
                    mt-3
                    max-w-xl
                    text-sm
                    leading-6
                    text-[var(--secondary-text)]
                  "
                >
                  Your beautiful memories will
                  appear here once they are uploaded.
                </p>

              </div>

            </section>
          )}

        {/* ======================================================
            ALL MEMORY CARDS
        ======================================================= */}

        {!loadingMemories &&
          !memoryError &&
          memories.length > 0 && (
            <section>

              {/* COLLECTION HEADER */}

              <div
                className="
                  mb-5
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >

                <div>

                  <p
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-[0.25em]
                      text-[var(--accent-purple)]
                    "
                  >
                    Complete Collection
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-[var(--secondary-text)]
                    "
                  >
                    {memories.length}{' '}
                    {memories.length === 1
                      ? 'memory'
                      : 'memories'}
                  </p>

                </div>

              </div>

              {/* ==================================================
                  MEMORY GRID
              =================================================== */}

              <div
                className="
                  grid
                  gap-5
                  sm:grid-cols-2
                  lg:grid-cols-3
                "
              >

                {memories.map(
                  (memory, index) => (
                    <article
                      key={
                        memory._id ||
                        memory.publicId ||
                        `${memory.url}-${index}`
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
                          IMAGE AREA
                          
                          IMPORTANT:
                          - Full width
                          - Fixed shorter height
                          - object-cover
                          - Image itself clickable
                          - Card itself NOT clickable
                      =================================================== */}

                      <div
                        onClick={() =>
                          handleOpenImage(memory)
                        }
                        className="
                          group
                          relative
                          h-[240px]
                          w-full
                          cursor-zoom-in
                          overflow-hidden
                          rounded-[1.5rem]
                          bg-[var(--surface-soft)]
                          sm:h-[250px]
                        "
                      >

                        <img
                          src={memory.url}
                          alt={
                            memory.title ||
                            'Memory'
                          }
                          loading={
                            index < 6
                              ? 'eager'
                              : 'lazy'
                          }
                          className="
                            block
                            h-full
                            w-full
                            object-cover
                            transition
                            duration-500
                            group-hover:scale-[1.04]
                          "
                        />

                        {/* IMAGE OVERLAY */}

                        <div
                          className="
                            pointer-events-none
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            bg-black/0
                            transition
                            duration-300
                            group-hover:bg-black/10
                          "
                        >
                          <span
                            className="
                              rounded-full
                              bg-white/90
                              px-4
                              py-2
                              text-xs
                              font-semibold
                              text-[var(--text-h)]
                              opacity-0
                              shadow-md
                              backdrop-blur
                              transition
                              duration-300
                              group-hover:opacity-100
                            "
                          >
                            Click to view
                          </span>
                        </div>

                        {/* PHOTO BADGE */}

                        <div
                          className="
                            pointer-events-none
                            absolute
                            right-3
                            top-3
                            rounded-full
                            bg-white/90
                            px-3
                            py-1
                            text-[10px]
                            font-semibold
                            text-[var(--accent-purple)]
                            shadow-sm
                            backdrop-blur
                          "
                        >
                          Photo
                        </div>

                      </div>

                      {/* ==================================================
                          INFORMATION
                      =================================================== */}

                      <div className="mt-4">

                        <h2
                          className="
                            line-clamp-1
                            text-sm
                            font-semibold
                            leading-5
                            text-[var(--text-h)]
                          "
                        >
                          {memory.title ||
                            'Untitled Memory'}
                        </h2>

                        {memory.description && (
                          <p
                            className="
                              mt-2
                              line-clamp-3
                              text-sm
                              leading-6
                              text-[var(--secondary-text)]
                            "
                          >
                            {memory.description}
                          </p>
                        )}

                      </div>

                    </article>
                  )
                )}

              </div>

            </section>
          )}

        {/* ======================================================
            BOTTOM MESSAGE
        ======================================================= */}

        {!loadingMemories &&
          !memoryError &&
          memories.length > 0 && (
            <div
              className="
                mt-12
                rounded-[1.75rem]
                border
                border-[var(--border)]
                bg-[var(--surface-soft)]
                px-6
                py-8
                text-center
              "
            >

              <p
                className="
                  text-lg
                  font-semibold
                  text-[var(--text-h)]
                "
              >
                Some moments are worth keeping
                forever. ❤️
              </p>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-[var(--secondary-text)]
                "
              >
                More memories will find their way
                here as our little vault grows.
              </p>

            </div>
          )}

      </div>

    </main>
  )
}

export default Memories