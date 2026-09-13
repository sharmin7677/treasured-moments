import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../contexts/AuthContext.jsx'

const API_URL = 'http://localhost:5000'

const videos = [
  {
    title: 'Road Trip Reel',
    description: 'The moments that move.',
  },
  {
    title: 'Campfire Stories',
    description: 'Late night laughter around the fire.',
  },
  {
    title: 'Rainy Day Mix',
    description: 'Soft rain and shared playlists.',
  },
  {
    title: 'City Lights',
    description: 'A glowing evening that felt magical.',
  },
  {
    title: 'Little Adventures',
    description: 'Small trips that became big memories.',
  },
  {
    title: 'Random Laughs',
    description: 'The moments we never planned.',
  },
  {
    title: 'Quiet Evenings',
    description: 'Simple evenings worth remembering.',
  },
  {
    title: 'One More Memory',
    description: 'Another little piece of our story.',
  },
]

function Videos() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [accessStatus, setAccessStatus] = useState('checking')
  const [loading, setLoading] = useState(true)

  // Check user's access status
  useEffect(() => {
    if (!user?.uid) {
      setAccessStatus('none')
      setLoading(false)
      return
    }

    const checkAccess = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/access/status/${encodeURIComponent(user.uid)}`
        )

        if (!response.ok) {
          throw new Error('Failed to check access')
        }

        const data = await response.json()

        setAccessStatus(data.accessStatus || 'none')
      } catch (error) {
        console.error('Videos access check failed:', error)
        setAccessStatus('error')
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [user])

  // Handle access result
  useEffect(() => {
    if (loading || accessStatus === 'checking') {
      return
    }

    if (!user?.uid) {
      navigate('/')
      return
    }

    // Approved → stay on Videos page
    if (accessStatus === 'approved') {
      return
    }

    // Pending
    if (accessStatus === 'pending') {
      Swal.fire({
        icon: 'info',
        title: 'Request Still Pending ⏳',
        text: 'Your access request is still waiting for approval.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#d9466f',
      }).then(() => {
        navigate('/home')
      })

      return
    }

    // Error
    if (accessStatus === 'error') {
      Swal.fire({
        icon: 'error',
        title: 'Something Went Wrong',
        text: 'We could not verify your access right now.',
        confirmButtonText: 'Back Home',
        confirmButtonColor: '#d9466f',
      }).then(() => {
        navigate('/home')
      })

      return
    }

    // No access
    navigate('/home')
  }, [accessStatus, loading, navigate, user])

  // Loading screen
  if (loading || accessStatus === 'checking') {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-2xl shadow-sm">
              🎥
            </div>

            <p className="mt-5 text-sm font-medium text-[var(--secondary-text)]">
              Opening our videos...
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Don't render anything if access isn't approved
  if (accessStatus !== 'approved') {
    return null
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">
            Our Videos 🎥
          </p>

          <h1 className="mt-3 text-4xl font-semibold text-[var(--text-h)] sm:text-5xl">
            Little moments in motion.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--secondary-text)] sm:text-base">
            A collection of videos from our favorite little moments,
            laughs, adventures, and memories.
          </p>
        </header>

        {/* Video Grid */}
        <section>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <article
                key={video.title}
                className="group overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Video Placeholder */}
                <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-[var(--surface-soft)]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)] text-xl text-[var(--accent-purple)] shadow-sm transition duration-300 group-hover:scale-110">
                      ▶
                    </div>
                  </div>
                </div>

                {/* Video Information */}
                <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-[var(--text-h)]">
                      {video.title}
                    </h2>

                    <span className="shrink-0 rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-purple)]">
                      Video
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">
                    {video.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Bottom Message */}
        <div className="mt-12 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-soft)] px-6 py-8 text-center">
          <p className="text-lg font-semibold text-[var(--text-h)]">
            Some moments deserve to move forever. ❤️
          </p>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--secondary-text)]">
            More little videos will find their way into our vault as
            new memories are created.
          </p>
        </div>

      </div>
    </main>
  )
}

export default Videos