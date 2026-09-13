const notes = [
  {
    title: 'First Midnight Talk',
    preview: 'A quiet conversation that turned into a promise to be there, no matter what.',
  },
  {
    title: 'Secret Song Gift',
    preview: 'That playlist you shared when I needed a smile most.',
  },
  {
    title: 'Morning Coffee Plan',
    preview: 'A small ritual that became our favorite way to start the day.',
  },
]

function FriendshipNotes() {
  return (
    <section id="friendship-notes" className="px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">Friendship notes</p>
            <h3 className="mt-2 text-3xl font-semibold text-[var(--text-h)]">Warm reminders from our story</h3>
          </div>
          <p className="max-w-xl text-sm text-[var(--secondary-text)]">Thoughtful cards that keep the page intimate and easy to scan.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {notes.map((note) => (
            <article key={note.title} className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-soft)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">{note.title}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">{note.preview}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FriendshipNotes
