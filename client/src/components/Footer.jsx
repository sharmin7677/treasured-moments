function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">Our Story</p>
            <ul className="space-y-2 text-sm text-[var(--secondary-text)]">
              {['Our Story', 'Our Timeline', 'Little Moments', 'Friendship Journey'].map((item) => (
                <li key={item}>
                  <button type="button" className="text-left transition hover:text-[var(--text-h)]">{item}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">Memories</p>
            <ul className="space-y-2 text-sm text-[var(--secondary-text)]">
              {['Photos', 'Videos', 'Favorite Moments', 'Memory Wall'].map((item) => (
                <li key={item}>
                  <button type="button" className="text-left transition hover:text-[var(--text-h)]">{item}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">Celebrations</p>
            <ul className="space-y-2 text-sm text-[var(--secondary-text)]">
              {['Birthday', 'Friendship Day', 'Wish Cards', 'Sorry Cards'].map((item) => (
                <li key={item}>
                  <button type="button" className="text-left transition hover:text-[var(--text-h)]">{item}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--secondary-text)]">
          <p>Made with ❤️ for a special friendship</p>
          <p className="mt-2">© {new Date().getFullYear()} The Friendship Vault</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
