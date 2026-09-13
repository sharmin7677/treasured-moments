import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function LandingPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // ============================================================
  // ALREADY LOGGED IN
  // If user visits "/" while already logged in,
  // send them directly to Home.
  // ============================================================

  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true })
    }
  }, [user, loading, navigate])


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="landing-page flex min-h-screen items-center justify-center overflow-hidden">

        <div className="text-center">

          <div className="mb-4 animate-pulse text-3xl text-[var(--accent-purple)]">
            ✦
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--secondary-text)] sm:text-xs">
            Opening our little story
          </p>

        </div>

      </main>
    )
  }


  // ============================================================
  // USER EXISTS
  // Waiting for redirect to /home
  // ============================================================

  if (user) {
    return null
  }


  // ============================================================
  // LANDING PAGE
  // ============================================================

  return (
    <main
      className="
        landing-page
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        px-6
        py-12
      "
    >

      {/* ======================================================
          SOFT BACKGROUND GLOW
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="landing-glow landing-glow-one" />

        <div className="landing-glow landing-glow-two" />

        <div className="landing-glow landing-glow-three" />

      </div>


      {/* ======================================================
          DECORATIVE STARS
      ====================================================== */}

      <span className="landing-star landing-star-one">
        ✦
      </span>

      <span className="landing-star landing-star-two">
        ✧
      </span>

      <span className="landing-star landing-star-three">
        ✦
      </span>

      <span className="landing-star landing-star-four">
        ·
      </span>

      <span className="landing-star landing-star-five">
        ✧
      </span>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <section
        className="
          relative
          z-10
          mx-auto
          flex
          w-full
          max-w-3xl
          flex-col
          items-center
          text-center
        "
      >

        {/* ==================================================
            TOP SYMBOL
        ================================================== */}

        <div
          className="
            landing-symbol
            mb-7
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            border
            border-[var(--accent-purple)]/20
            bg-white/60
            text-xl
            text-[var(--accent-purple)]
            shadow-sm
            backdrop-blur-sm
          "
        >
          ✦
        </div>


        {/* ==================================================
            SMALL LABEL
        ================================================== */}

        <p
          className="
            mb-5
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.45em]
            text-[var(--accent-purple)]
            sm:text-xs
          "
        >
          A little place for us
        </p>


        {/* ==================================================
            MAIN TITLE
        ================================================== */}

        <h1
          className="
            landing-title
            max-w-3xl
            font-serif
            text-5xl
            font-semibold
            leading-[1.05]
            text-[var(--text-h)]
            sm:text-6xl
            md:text-7xl
          "
        >
          Happy Friendship Day
        </h1>


        {/* ==================================================
            DECORATIVE DIVIDER
        ================================================== */}

        <div className="my-8 flex items-center gap-3">

          <span className="h-px w-10 bg-[var(--accent-purple)]/25 sm:w-16" />

          <span className="text-sm text-[var(--accent-pink)]">
            ♡
          </span>

          <span className="h-px w-10 bg-[var(--accent-purple)]/25 sm:w-16" />

        </div>


        {/* ==================================================
            MAIN MESSAGE
        ================================================== */}

        <div
          className="
            max-w-xl
            space-y-2
            text-base
            leading-8
            text-[var(--secondary-text)]
            sm:text-lg
          "
        >

          <p>
            Some friendships are forever.
          </p>

          <p>
            Some are gifts from Allah.
          </p>

          <p>
            And some become family.
          </p>

        </div>


        {/* ==================================================
            ENTER BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="
            landing-enter-button
            group
            mt-10
            inline-flex
            items-center
            gap-3
            rounded-full
            border
            border-[var(--accent-purple)]
            bg-[var(--accent-purple)]
            px-9
            py-3.5
            text-sm
            font-semibold
            tracking-[0.18em]
            text-white
            shadow-lg
            shadow-[var(--accent-purple)]/15
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-xl
            hover:shadow-[var(--accent-purple)]/20
            focus:outline-none
            focus:ring-4
            focus:ring-[var(--accent-purple)]/20
            active:translate-y-0
          "
        >

          <span>
            ENTER
          </span>

          <span
            className="
              transition-transform
              duration-300
              group-hover:translate-x-1
            "
          >
            →
          </span>

        </button>


        {/* ==================================================
            VERY SUBTLE FOOTER TEXT
        ================================================== */}

        <p
          className="
            mt-8
            text-[9px]
            uppercase
            tracking-[0.3em]
            text-[var(--secondary-text)]/50
          "
        >
          A tiny vault of treasured moments
        </p>

      </section>

    </main>
  )
}

export default LandingPage