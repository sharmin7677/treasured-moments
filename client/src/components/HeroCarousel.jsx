import { useEffect, useState } from 'react'
import slide1 from '../assets/hero-slide-1.svg'
import slide2 from '../assets/hero-slide-2.svg'
import slide3 from '../assets/hero-slide-3.svg'
import slide4 from '../assets/hero-slide-4.svg'

const heroSlides = [
  {
    eyebrow: 'TREASURED MOMENTS',
    title: 'The Friendship Vault',
    description: 'A little place for all our beautiful chaos. ❤️',
    image: slide1,
    alt: 'Warm friendship memory collage',
  },
  {
    eyebrow: 'OUR LITTLE CHAOS',
    title: 'The moments that made us laugh',
    description: 'Some of the best memories were never planned.',
    image: slide2,
    alt: 'Fun candid friendship moment placeholder',
  },
  {
    eyebrow: 'MEMORIES WE KEEP',
    title: 'Little moments, forever memories',
    description: 'Because ordinary days become special when shared.',
    image: slide3,
    alt: 'Nostalgic friendship photo placeholder',
  },
  {
    eyebrow: 'STILL MAKING MEMORIES',
    title: 'And our story is still growing',
    description: 'There are so many beautiful moments waiting for us.',
    image: slide4,
    alt: 'Bright happy friendship moment placeholder',
  },
]

function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mediaQuery.matches)
    const handleChange = (event) => setReduceMotion(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (reduceMotion) return undefined
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroSlides.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [reduceMotion])

  return (
    <section id="hero" className="relative px-4 py-14 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(238,207,238,0.24),_transparent_32%),linear-gradient(180deg,#fff9f4_0%,#fff1f5_100%)] shadow-[0_28px_90px_-30px_rgba(62,49,55,0.18)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.72),transparent_40%)]" />
        <div className="pointer-events-none absolute -left-10 top-8 h-28 w-28 rounded-full bg-[rgba(217,143,163,0.18)] blur-3xl" />
        <div className="pointer-events-none absolute right-6 top-20 h-20 w-20 rounded-full bg-[rgba(155,139,199,0.16)] blur-3xl" />
        <div className="pointer-events-none absolute left-10 bottom-8 h-20 w-20 rounded-full bg-[rgba(255,209,218,0.18)] blur-3xl" />

        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {heroSlides.map((slide) => (
              <article key={slide.eyebrow} className="min-w-full px-6 py-10 sm:px-8 lg:px-10">
                <div className="grid gap-10 lg:grid-cols-[0.48fr_0.52fr] lg:items-center">
                  <div className="flex flex-col justify-center gap-5 text-left">
                    <p className="max-w-max rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)] shadow-sm">
                      {slide.eyebrow}
                    </p>
                    <h2 className="text-4xl font-semibold leading-tight text-[var(--text-h)] sm:text-5xl">
                      {slide.title}
                    </h2>
                    <p className="max-w-xl text-base leading-8 text-[var(--secondary-text)] sm:text-lg">
                      {slide.description}
                    </p>
                    <button
                      type="button"
                      className="mt-4 inline-flex w-max items-center justify-center rounded-full bg-[rgba(217,143,163,0.16)] px-6 py-3 text-sm font-semibold text-[var(--accent-purple)] shadow-sm transition hover:bg-[rgba(217,143,163,0.26)] hover:text-[var(--text-h)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-purple)] focus-visible:ring-offset-2"
                    >
                      Explore Our Memories →
                    </button>
                  </div>

                  <div className="relative flex justify-center lg:justify-end">
                    <div className="group relative w-full max-w-[420px]">
                      <div className="absolute -right-6 top-6 h-14 w-14 rounded-full bg-white/90 shadow-[0_12px_24px_-12px_rgba(62,49,55,0.24)]" />
                      <div className="absolute left-0 top-10 h-12 w-12 rounded-full bg-[rgba(217,143,163,0.16)]" />
                      <div className="absolute right-8 bottom-6 h-10 w-10 rounded-full bg-[rgba(155,139,199,0.18)]" />
                      <div className="hero-card-motion relative overflow-visible rounded-[30px] border border-white/90 bg-white shadow-[0_26px_70px_-24px_rgba(62,49,55,0.22)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-[1.02]">
                        <div className="relative overflow-hidden rounded-[30px]">
                          <img src={slide.image} alt={slide.alt} className="h-[420px] w-full object-cover sm:h-[440px]" />
                        </div>
                        <div className="absolute -left-3 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[1rem] shadow-sm">
                          ❤️
                        </div>
                        <div className="absolute right-3 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[0.85rem] shadow-sm">
                          ✨
                        </div>
                        <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-purple)] shadow-sm">
                          our little moments
                        </div>
                      </div>
                      <div className="pointer-events-none absolute -left-6 -bottom-6 h-12 w-12 rounded-full bg-[rgba(255,220,227,0.75)] blur-2xl" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2 pb-4">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              className={`h-3 w-3 rounded-full transition ${index === activeIndex ? 'bg-[var(--accent-purple)]' : 'bg-[var(--border)] hover:bg-[var(--accent-purple)]'}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroCarousel
