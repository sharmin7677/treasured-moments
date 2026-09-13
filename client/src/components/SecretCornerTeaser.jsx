function SecretCornerTeaser() {
  return (
    <section id="secret-corner" className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#D8C6DC] bg-[#F6F0FC] p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#9B8BC7]">A Little Secret 🔐</p>
            <h3 className="mt-2 text-3xl font-semibold text-[#3F3A42]">Not everyone gets to enter.</h3>
            <p className="mt-3 max-w-xl text-sm text-[#77717A]">A soft, dreamy preview of a private corner where our stories stay close.</p>
          </div>
          <button className="self-start rounded-full bg-[#B8A9E0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#A58ED5] lg:self-auto">Unlock</button>
        </div>
      </div>
    </section>
  )
}

export default SecretCornerTeaser
