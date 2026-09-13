const leftImages = [
  { title: 'Memory Lane', color: 'bg-[#FDEBF7]' },
  { title: 'Dawn Promise', color: 'bg-[#FFF4E6]' },
  { title: 'Quiet Shore', color: 'bg-[#E8F6FF]' },
]

const rightImages = [
  { title: 'Moonlit Path', color: 'bg-[#F2E9FF]' },
  { title: 'Sweet Notes', color: 'bg-[#FFF2F2]' },
  { title: 'Bright Smile', color: 'bg-[#FEE7F1]' },
]

const leftRepeat = [...leftImages, ...leftImages]
const rightRepeat = [...rightImages, ...rightImages]

function MediaShowcase() {
  return (
    <section id="video-photos" className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">VIDEO & PHOTOS 🎥📸</p>
            <h3 className="mt-2 text-3xl font-semibold text-[var(--text-h)]">A gentle motion of images around a fixed story video.</h3>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.1fr_1fr]">
          <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <div className="flex flex-col gap-4 animate-upward pause-on-hover">
              {leftRepeat.map((image, index) => (
                <div key={`${image.title}-${index}`} className={`rounded-[2rem] border border-[var(--border)] ${image.color} p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md`}>
                  <p className="text-sm font-semibold text-[var(--text-h)]">{image.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-[var(--surface-soft)]">
              <div className="aspect-[16/10] bg-[radial-gradient(circle_at_center,_rgba(155,139,199,0.16),_transparent_40%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-[2rem] text-[var(--accent-purple)] shadow-xl">
                  ▶
                </div>
              </div>
            </div>
            <div className="mt-5 text-left">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-purple)]">Featured video</p>
              <p className="mt-3 text-xl font-semibold text-[var(--text-h)]">The day the music played</p>
              <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">A centered story moment with calm, premium framing.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <div className="flex flex-col gap-4 animate-downward pause-on-hover">
              {rightRepeat.map((image, index) => (
                <div key={`${image.title}-${index}`} className={`rounded-[2rem] border border-[var(--border)] ${image.color} p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md`}>
                  <p className="text-sm font-semibold text-[var(--text-h)]">{image.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MediaShowcase
