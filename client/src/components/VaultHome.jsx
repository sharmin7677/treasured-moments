import { useEffect, useMemo, useState } from 'react'

import HeroCarousel from './HeroCarousel.jsx'
import MemoryPreview from './MemoryPreview.jsx'
import QuotePreview from './QuotePreview.jsx'
import VideoPreview from './VideoPreview.jsx'
import PhotoStrip from './PhotoStrip.jsx'
import MediaShowcase from './MediaShowcase.jsx'
import OurStoryPreview from './OurStoryPreview.jsx'
import FriendshipNotes from './FriendshipNotes.jsx'
import FutureContentPreview from './FutureContentPreview.jsx'
import SecretCornerTeaser from './SecretCornerTeaser.jsx'
import Footer from './Footer.jsx'


// ============================================================
// FRIENDSHIP CONFIG
// ============================================================

// First communication:
// 18 October 2021

const friendshipStartDate = '2021-10-18T00:00:00'


// Friend's birthday:
// 25 December

const birthdayConfig = {
  month: 12,
  day: 25,
}


const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]


// ============================================================
// CALCULATE FRIENDSHIP DURATION
// ============================================================

function calculateFriendship(startDate) {
  const start = new Date(startDate)
  const now = new Date()

  let years =
    now.getFullYear() -
    start.getFullYear()

  let months =
    now.getMonth() -
    start.getMonth()

  let days =
    now.getDate() -
    start.getDate()


  // ==========================================================
  // CORRECT NEGATIVE DAYS
  // ==========================================================

  if (days < 0) {
    months -= 1

    const previousMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    )

    days += previousMonth.getDate()
  }


  // ==========================================================
  // CORRECT NEGATIVE MONTHS
  // ==========================================================

  if (months < 0) {
    years -= 1
    months += 12
  }


  // ==========================================================
  // TOTAL DAYS
  // ==========================================================

  const totalDays = Math.floor(
    (now - start) /
      (1000 * 60 * 60 * 24)
  )


  return {
    years,
    months,
    days,
    totalDays,
  }
}


// ============================================================
// GET NEXT BIRTHDAY
// ============================================================

function getNextBirthday({
  month,
  day,
}) {
  const now = new Date()

  const currentYear =
    now.getFullYear()


  const birthdayThisYear =
    new Date(
      currentYear,
      month - 1,
      day,
      0,
      0,
      0
    )


  // ==========================================================
  // BIRTHDAY TODAY
  // ==========================================================

  if (
    birthdayThisYear.getMonth() ===
      now.getMonth() &&
    birthdayThisYear.getDate() ===
      now.getDate()
  ) {
    return {
      target: birthdayThisYear,
      isToday: true,
    }
  }


  // ==========================================================
  // BIRTHDAY HAS PASSED
  // ==========================================================

  if (birthdayThisYear <= now) {
    return {
      target: new Date(
        currentYear + 1,
        month - 1,
        day,
        0,
        0,
        0
      ),
      isToday: false,
    }
  }


  // ==========================================================
  // BIRTHDAY IS UPCOMING
  // ==========================================================

  return {
    target: birthdayThisYear,
    isToday: false,
  }
}


// ============================================================
// CALCULATE COUNTDOWN
// ============================================================

function calculateCountdown(target) {
  const now = new Date()

  const diff = Math.max(
    target - now,
    0
  )


  const days = Math.floor(
    diff /
      (1000 * 60 * 60 * 24)
  )


  const hours = Math.floor(
    (diff /
      (1000 * 60 * 60)) %
      24
  )


  const minutes = Math.floor(
    (diff /
      (1000 * 60)) %
      60
  )


  const seconds = Math.floor(
    (diff / 1000) % 60
  )


  return {
    days,
    hours,
    minutes,
    seconds,
  }
}


// ============================================================
// BIRTHDAY WISH ENVELOPE
//
// Available only on December 25.
// ============================================================

function BirthdayWishEnvelope({
  isBirthday,
}) {
  if (!isBirthday) {
    return null
  }


  return (
    <section className="px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center shadow-sm sm:p-10">

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">
            A little birthday surprise
          </p>


          <h3 className="mt-3 text-3xl font-semibold text-[var(--text-h)]">
            Happy Birthday 🎂❤️
          </h3>


          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--secondary-text)]">
            There is a little birthday wish waiting inside.
          </p>


          {/* ==================================================
              ENVELOPE
          =================================================== */}

          <div className="mx-auto mt-8 flex max-w-sm justify-center">

            <div className="relative w-full max-w-[320px]">

              {/* Envelope shadow */}

              <div className="absolute inset-x-5 bottom-0 h-5 rounded-full bg-black/10 blur-md" />


              {/* Envelope */}

              <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-md">

                {/* Envelope top flap */}

                <div
                  className="absolute left-1/2 top-0 z-20 h-0 w-0 -translate-x-1/2 border-l-[155px] border-r-[155px] border-t-[110px] border-l-transparent border-r-transparent border-t-[var(--surface-soft)]"
                  aria-hidden="true"
                />


                {/* Letter */}

                <div className="relative z-10 mx-7 mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">

                  <div className="text-4xl">
                    💌
                  </div>


                  <p className="mt-3 text-sm font-medium text-[var(--secondary-text)]">
                    Your birthday wish is waiting...
                  </p>


                  <button
                    type="button"
                    className="mt-5 rounded-full bg-[var(--accent-purple)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] hover:opacity-90"
                  >
                    Open Your Wish 💜
                  </button>

                </div>


                {/* Envelope bottom */}

                <div className="h-28 bg-[var(--surface-soft)]" />

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  )
}


// ============================================================
// VAULT HOME
// ============================================================

function VaultHome() {

  // ==========================================================
  // FRIENDSHIP COUNTER
  // ==========================================================

  const friendship = useMemo(
    () =>
      calculateFriendship(
        friendshipStartDate
      ),
    []
  )


  // ==========================================================
  // BIRTHDAY COUNTDOWN
  // ==========================================================

  const [countdown, setCountdown] =
    useState(() => {

      const nextBirthday =
        getNextBirthday(
          birthdayConfig
        )


      return {
        ...calculateCountdown(
          nextBirthday.target
        ),

        isToday:
          nextBirthday.isToday,
      }
    })


  // ==========================================================
  // UPDATE COUNTDOWN EVERY SECOND
  // ==========================================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        const nextBirthday =
          getNextBirthday(
            birthdayConfig
          )


        setCountdown({
          ...calculateCountdown(
            nextBirthday.target
          ),

          isToday:
            nextBirthday.isToday,
        })

      }, 1000)


    return () =>
      clearInterval(interval)

  }, [])


  const nextBirthdayText =
    `${
      monthNames[
        birthdayConfig.month - 1
      ]
    } ${birthdayConfig.day}`


  return (
    <main className="w-full">

      {/* ======================================================
          HERO
      ====================================================== */}

      <HeroCarousel />


      {/* ======================================================
          FRIENDSHIP & BIRTHDAY STATS
      ====================================================== */}

      <section
        id="friendship"
        className="px-4 pb-14 sm:px-6 lg:px-8"
      >

        <div className="mx-auto max-w-6xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">
                Quick stats
              </p>


              <h3 className="mt-2 text-2xl font-semibold text-[var(--text-h)]">
                Friendship and birthday at a glance
              </h3>

            </div>


            <p className="max-w-xl text-sm text-[var(--secondary-text)]">
              Little moments and milestones that make our friendship special.
            </p>

          </div>


          <div className="mt-5 grid gap-4 lg:grid-cols-2">

            {/* ==================================================
                FRIENDSHIP COUNTER
            =================================================== */}

            <div className="countdown-card h-full rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-soft)] p-6 shadow-sm">

              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">
                Friendship Counter
              </p>


              <h3 className="mt-3 text-2xl font-semibold text-[var(--text-h)]">
                How long we&apos;ve been together
              </h3>


              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--secondary-text)]">
                From our first communication on October 18, 2021, every day has become another chapter in our story.
              </p>


              <div className="mt-6 grid grid-cols-2 gap-3 rounded-[1.75rem] border border-[var(--border)] bg-white/80 p-4 shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-[var(--border)]">

                {[
                  {
                    label: 'Years',
                    value: friendship.years,
                  },
                  {
                    label: 'Months',
                    value: friendship.months,
                  },
                  {
                    label: 'Days',
                    value: friendship.days,
                  },
                ].map((item) => (

                  <div
                    key={item.label}
                    className="flex flex-col items-center justify-center px-2 py-4 text-center"
                  >

                    <p className="text-[2.35rem] font-semibold leading-none text-[var(--text-h)] sm:text-[3rem]">
                      {item.value}
                    </p>


                    <span className="countdown-label mt-2 text-[11px] uppercase tracking-[0.3em] text-[var(--accent-purple)]">
                      {item.label}
                    </span>

                  </div>

                ))}

              </div>

            </div>


            {/* ==================================================
                BIRTHDAY COUNTDOWN
            =================================================== */}

            <div className="countdown-card h-full rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-soft)] p-6 shadow-sm">

              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">
                Birthday Countdown
              </p>


              <h3 className="mt-3 text-2xl font-semibold text-[var(--text-h)]">
                Next birthday: {nextBirthdayText}
              </h3>


              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--secondary-text)]">
                Counting down to December 25 — a special day worth celebrating. 🎂
              </p>


              <div className="mt-6 grid grid-cols-2 gap-3 rounded-[1.75rem] border border-[var(--border)] bg-white/80 p-4 shadow-sm sm:grid-cols-4 sm:divide-x sm:divide-[var(--border)]">

                {[
                  {
                    label: 'Days',
                    value: countdown.days,
                  },
                  {
                    label: 'Hours',
                    value: countdown.hours,
                  },
                  {
                    label: 'Minutes',
                    value: countdown.minutes,
                  },
                  {
                    label: 'Seconds',
                    value: countdown.seconds,
                  },
                ].map((item) => (

                  <div
                    key={item.label}
                    className="flex flex-col items-center justify-center px-2 py-4 text-center"
                  >

                    <p className="text-[2.35rem] font-semibold leading-none text-[var(--text-h)] sm:text-[3rem]">
                      {item.value
                        .toString()
                        .padStart(2, '0')}
                    </p>


                    <span className="countdown-label mt-2 text-[11px] uppercase tracking-[0.3em] text-[var(--accent-purple)]">
                      {item.label}
                    </span>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          BIRTHDAY WISH ENVELOPE
          
          Appears only on December 25.
      ====================================================== */}

      <BirthdayWishEnvelope
        isBirthday={countdown.isToday}
      />


      {/* ======================================================
          LATEST MEMORIES
      ====================================================== */}

      <MemoryPreview />


      {/* ======================================================
          QUOTE PREVIEW
          
          QuotePreview handles the quote preview section.
          
          QuotePreview internally works with:
          - QuoteSection.jsx
          - QuoteImages.jsx
          
          So those files do not need to be imported here.
      ====================================================== */}

      <QuotePreview />


      {/* ======================================================
          LATEST VIDEOS
      ====================================================== */}

      <VideoPreview />


      {/* ======================================================
          PHOTO STRIP
      ====================================================== */}

      <PhotoStrip />


      {/* ======================================================
          MEDIA SHOWCASE
      ====================================================== */}

      <MediaShowcase />


      {/* ======================================================
          OUR STORY
      ====================================================== */}

      <OurStoryPreview />


      {/* ======================================================
          FRIENDSHIP NOTES
      ====================================================== */}

      <FriendshipNotes />


      {/* ======================================================
          FUTURE CONTENT
      ====================================================== */}

      <FutureContentPreview />


      {/* ======================================================
          SECRET CORNER
          
          IMPORTANT:
          This remains separate from normal access approval.
          
          Existing NID + binary-code logic stays untouched.
      ====================================================== */}

      <SecretCornerTeaser />


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />

    </main>
  )
}


export default VaultHome

