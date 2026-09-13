const previews = [
  { id: 'letters', title: 'Letters', emoji: '💌', description: 'Little words that keep us close.' },
  { id: 'wish-cards', title: 'Wish Cards', emoji: '🎁', description: 'Wishes made for the days ahead.' },
  { id: 'sorry-cards', title: 'Sorry Cards', emoji: '🥺', description: 'Soft apologies and gentle care.' },
  { id: 'fun-stuff', title: 'Fun Stuff', emoji: '😂', description: 'Playful surprises for better days.' },
]

function FutureContentPreview() {
  return (
    <section id="wish-sorry-fun" className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">💌 Letters & Cards</p>
          <h3 className="mt-2 text-3xl font-semibold text-[var(--text-h)]">Wish cards, sorry notes, and joyful keepsakes.</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {previews.map((item) => (
            <div key={item.id} id={item.id} className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <p className="text-3xl">{item.emoji}</p>
              <p className="mt-4 text-lg font-semibold text-[var(--text-h)]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FutureContentPreview
