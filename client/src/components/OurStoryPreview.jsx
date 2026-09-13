function OurStoryPreview() {
  return (
    <section id="our-story" className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#EAD7D2] bg-[#FFF1F5] p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#9B8BC7]">Our Story 📖</p>
            <h3 className="mt-2 text-3xl font-semibold text-[#3F3A42]">A story of us, one moment at a time.</h3>
            <p className="mt-3 text-sm text-[#77717A]">A gentle preview of the chapters we’ve shared and the memories ahead.</p>
          </div>
          <button className="rounded-full bg-[#FFF1E8] px-5 py-3 text-sm font-semibold text-[#3F3A42] transition hover:bg-[#FFE5CF]">Read Our Story →</button>
        </div>
      </div>
    </section>
  )
}

export default OurStoryPreview
