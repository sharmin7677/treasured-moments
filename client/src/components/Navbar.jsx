import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useAuth } from '../contexts/AuthContext.jsx'

// ============================================================
// ADMIN EMAIL
// ============================================================

const ADMIN_EMAIL = 'orthi7677@gmail.com'

// ============================================================
// BACKEND API
// ============================================================

const API_BASE_URL = 'https://treasured-moments.vercel.app/api'

// ============================================================
// NAVBAR
// ============================================================

function Navbar() {
  const {
    user,
    logout,
    updateProfilePhoto,
  } = useAuth()

  const location = useLocation()
  const navigate = useNavigate()

  // ============================================================
  // THEME
  // ============================================================

  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const stored =
      localStorage.getItem('vault-theme')

    if (
      stored === 'light' ||
      stored === 'dark'
    ) {
      return stored
    }

    return window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
      ? 'dark'
      : 'light'
  })

  // ============================================================
  // STATES
  // ============================================================

  const [menuOpen, setMenuOpen] =
    useState(false)

  const [notificationOpen, setNotificationOpen] =
    useState(false)

  const [profileOpen, setProfileOpen] =
    useState(false)

  const [scrolled, setScrolled] =
    useState(false)

  const [photoUploading, setPhotoUploading] =
    useState(false)

  // ============================================================
  // NOTIFICATION STATES
  // ============================================================

  const [notifications, setNotifications] =
    useState([])

  const [notificationLoading, setNotificationLoading] =
    useState(false)

  const [markingAllRead, setMarkingAllRead] =
    useState(false)

  // ============================================================
  // REFS
  // ============================================================

  const notificationRef = useRef(null)
  const profileRef = useRef(null)
  const fileInputRef = useRef(null)

  // ============================================================
  // ADMIN CHECK
  // ============================================================

  const isAdmin =
    user?.email?.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase()

  // ============================================================
  // THEME EFFECT
  // ============================================================

  useEffect(() => {
    const root = document.documentElement

    root.classList.toggle(
      'theme-dark',
      theme === 'dark'
    )

    root.classList.toggle(
      'theme-light',
      theme === 'light'
    )

    localStorage.setItem(
      'vault-theme',
      theme
    )
  }, [theme])

  // ============================================================
  // NAVBAR SCROLL
  // ============================================================

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(
        window.scrollY > 24
      )
    }

    handleScroll()

    window.addEventListener(
      'scroll',
      handleScroll
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      )
    }
  }, [])

  // ============================================================
  // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (
      event
    ) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setNotificationOpen(false)
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  // ============================================================
  // GET FIREBASE ID TOKEN
  // ============================================================

  const getFirebaseIdToken = async () => {
    if (!user) {
      return null
    }

    try {
      const token =
        await user.getIdToken()

      return token
    } catch (error) {
      console.error(
        '❌ Failed to get Firebase ID token:',
        error
      )

      return null
    }
  }

  // ============================================================
  // AUTHENTICATED API REQUEST HELPER
  // ============================================================

  const authenticatedFetch = async (
    url,
    options = {}
  ) => {
    const token =
      await getFirebaseIdToken()

    if (!token) {
      throw new Error(
        'Firebase authentication token is unavailable'
      )
    }

    const existingHeaders =
      options.headers || {}

    return fetch(url, {
      ...options,

      headers: {
        ...existingHeaders,

        Authorization:
          `Bearer ${token}`,

        'Content-Type':
          options.body
            ? (
                existingHeaders[
                  'Content-Type'
                ] || 'application/json'
              )
            : undefined,
      },
    })
  }

  // ============================================================
  // FETCH NOTIFICATIONS
  // ============================================================

  const fetchNotifications = async (
    showLoading = false
  ) => {
    if (!user) {
      setNotifications([])
      return
    }

    try {
      if (showLoading) {
        setNotificationLoading(true)
      }

      const response =
        await authenticatedFetch(
          `${API_BASE_URL}/notifications`,
          {
            method: 'GET',
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to load notifications'
        )
      }

      setNotifications(
        Array.isArray(
          data?.notifications
        )
          ? data.notifications
          : []
      )
    } catch (error) {
      console.error(
        '❌ Failed to fetch notifications:',
        error
      )

      // Background notification
      // failures don't show toast.
    } finally {
      if (showLoading) {
        setNotificationLoading(false)
      }
    }
  }

  // ============================================================
  // LOAD NOTIFICATIONS WHEN USER LOGS IN
  // ============================================================

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    fetchNotifications(true)
  }, [user])

  // ============================================================
  // AUTO REFRESH NOTIFICATIONS
  // EVERY 10 SECONDS
  // ============================================================

  useEffect(() => {
    if (!user) {
      return
    }

    const interval =
      setInterval(() => {
        fetchNotifications(false)
      }, 10000)

    return () => {
      clearInterval(interval)
    }
  }, [user])

  // ============================================================
  // UNREAD COUNT
  // ============================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        notification.read !== true
    ).length

  // ============================================================
  // MARK ONE NOTIFICATION AS READ
  // ============================================================

  const handleNotificationClick =
    async (notification) => {
      if (!notification?._id) {
        return
      }

      // ========================================================
      // MARK AS READ
      //
      // Important:
      // We only call the API if notification
      // is currently unread.
      // ========================================================

      if (
        notification.read !== true
      ) {
        try {
          const response =
            await authenticatedFetch(
              `${API_BASE_URL}/notifications/${notification._id}/read`,
              {
                method: 'PUT',
              }
            )

          const data =
            await response.json()

          if (!response.ok) {
            throw new Error(
              data?.message ||
                'Failed to mark notification as read'
            )
          }

          // ----------------------------------------------------
          // UPDATE UI IMMEDIATELY
          // ----------------------------------------------------

          setNotifications(
            (current) =>
              current.map(
                (item) =>
                  item._id ===
                  notification._id
                    ? {
                        ...item,
                        read: true,
                      }
                    : item
              )
          )
        } catch (error) {
          console.error(
            '❌ Failed to mark notification as read:',
            error
          )

          // Don't stop navigation because
          // notification read failed.
        }
      }

      // ========================================================
      // CLOSE NOTIFICATION DROPDOWN
      // ========================================================

      setNotificationOpen(false)

      // ========================================================
      // ACCESS REQUEST
      //
      // Admin notification:
      // "New Access Request 💌"
      //
      // Clicking it takes admin directly
      // to the Admin Dashboard.
      // ========================================================

      if (
        notification.type ===
        'access_request'
      ) {
        navigate('/admin')
        return
      }

      // ========================================================
      // ACCESS APPROVED
      // ========================================================

      if (
        notification.type ===
        'access_approved'
      ) {
        return
      }

      // ========================================================
      // ACCESS REJECTED
      // ========================================================

      if (
        notification.type ===
        'access_rejected'
      ) {
        return
      }
    }

  // ============================================================
  // MARK ALL NOTIFICATIONS AS READ
  // ============================================================

  const handleMarkAllAsRead =
    async () => {
      if (
        markingAllRead ||
        unreadCount === 0
      ) {
        return
      }

      try {
        setMarkingAllRead(true)

        const response =
          await authenticatedFetch(
            `${API_BASE_URL}/notifications/read-all`,
            {
              method: 'PUT',
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Failed to mark notifications as read'
          )
        }

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                read: true,
              })
            )
        )

        toast.success(
          'All notifications marked as read.'
        )
      } catch (error) {
        console.error(
          '❌ Failed to mark all notifications as read:',
          error
        )

        toast.error(
          'Could not mark notifications as read.'
        )
      } finally {
        setMarkingAllRead(false)
      }
    }

  // ============================================================
  // THEME ICON
  // ============================================================

  const themeIcon =
    theme === 'dark'
      ? '☾'
      : '☀'

  // ============================================================
  // PROFILE
  // ============================================================

  const profileImage =
    user?.photoURL || null

  const profileName =
    user?.displayName || 'Friend'

  const profileEmail =
    user?.email || ''

  // ============================================================
  // FORMAT NOTIFICATION DATE
  // ============================================================

  const formatNotificationDate = (
    createdAt
  ) => {
    if (!createdAt) {
      return ''
    }

    try {
      const date =
        new Date(createdAt)

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return ''
      }

      return date.toLocaleString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }
      )
    } catch {
      return ''
    }
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleNavigation = (
    href
  ) => {
    setMenuOpen(false)
    setNotificationOpen(false)
    setProfileOpen(false)

    if (href.startsWith('#')) {
      if (
        location.pathname !==
        '/home'
      ) {
        navigate(`/home${href}`)
      } else {
        window.location.hash =
          href
      }

      return
    }

    navigate(href)
  }

  // ============================================================
  // NAV ITEMS
  // ============================================================

  const navItems = [
    {
      label: 'Home',
      href: '/home',
    },

    {
      label: 'Memories',
      href: '/memories',
    },

    {
      label: 'Videos',
      href: '/videos',
    },

    // ----------------------------------------------------------
    // ADMIN NAVIGATION
    // ----------------------------------------------------------

    ...(isAdmin
      ? [
          {
            label: 'Admin',
            href: '/admin',
          },
        ]
      : []),
  ]

  // ============================================================
  // NAV BUTTON STYLE
  // ============================================================

  const getNavClass = (
    href
  ) => {
    const isActive =
      location.pathname ===
      href ||
      (
        href === '/home' &&
        location.pathname ===
          '/home'
      )

    return `
      group
      cursor-pointer
      rounded-[10px]
      border
      px-4
      py-2
      text-sm
      font-medium
      transition-all
      duration-200
      ease-out

      ${
        isActive
          ? `
            border-[var(--accent-purple)]
            bg-[var(--surface)]
            text-[var(--accent-purple)]
            shadow-sm
          `
          : `
            border-[var(--border)]
            bg-[var(--surface-soft)]
            text-[var(--secondary-text)]

            hover:-translate-y-[1px]
            hover:border-[var(--accent-purple)]
            hover:bg-[var(--surface)]
            hover:text-[var(--accent-purple)]
            hover:shadow-md
          `
      }
    `
  }

  // ============================================================
  // CHANGE PROFILE PHOTO
  // ============================================================

  const handleChangeProfilePhoto =
    () => {
      if (photoUploading) {
        return
      }

      fileInputRef.current?.click()
    }

  // ============================================================
  // PROFILE PHOTO UPLOAD
  // ============================================================

  const handleProfilePhotoChange =
    async (event) => {
      const file =
        event.target.files?.[0]

      event.target.value = ''

      if (!file) {
        return
      }

      // --------------------------------------------------------
      // IMAGE VALIDATION
      // --------------------------------------------------------

      if (
        !file.type.startsWith(
          'image/'
        )
      ) {
        toast.error(
          'Please select an image file.'
        )

        return
      }

      // --------------------------------------------------------
      // FILE SIZE VALIDATION
      // --------------------------------------------------------

      const maxFileSize =
        5 * 1024 * 1024

      if (
        file.size > maxFileSize
      ) {
        toast.error(
          'Profile photo must be 5 MB or smaller.'
        )

        return
      }

      // --------------------------------------------------------
      // UPLOAD
      // --------------------------------------------------------

      try {
        setPhotoUploading(true)

        await updateProfilePhoto(
          file
        )

        setProfileOpen(false)

        toast.success(
          'Profile photo updated successfully.'
        )
      } catch (error) {
        console.error(
          '❌ Profile photo update failed:',
          error
        )

        toast.error(
          error?.message ||
            'Failed to update profile photo. Please try again.'
        )
      } finally {
        setPhotoUploading(false)
      }
    }

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout =
    async () => {
      setProfileOpen(false)
      setMenuOpen(false)
      setNotificationOpen(false)

      setNotifications([])

      await logout()
    }

  // ============================================================
  // MAIN NAVBAR
  // ============================================================

  return (
    <>
      {/* ======================================================
          HIDDEN PROFILE PHOTO INPUT
      ====================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={
          handleProfilePhotoChange
        }
        className="hidden"
      />

      {/* ======================================================
          FULL WIDTH HEADER
      ====================================================== */}

      <header
        className={`
          sticky
          top-0
          z-50
          w-full
          app-navbar
          transition-all
          duration-300

          ${
            scrolled
              ? 'app-navbar-scrolled'
              : ''
          }
        `}
      >
        {/* ==================================================
            FULL WIDTH NAVBAR
        ================================================== */}

        <div className="w-full px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex w-full items-center justify-between gap-4">

            {/* ==================================================
                LOGO
            ================================================== */}

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  '/home'
                )
              }
              className="
                shrink-0
                cursor-pointer
                rounded-lg
                px-2
                py-1
                text-sm
                font-semibold
                uppercase
                tracking-[0.35em]
                text-[var(--accent-purple)]
                transition-all
                duration-200

                hover:bg-[var(--surface-soft)]
                hover:tracking-[0.38em]

                focus:outline-none
                focus:ring-2
                focus:ring-[var(--accent-purple)]/30

                sm:text-base
              "
            >
              TREASURED MOMENTS
            </button>

            {/* ==================================================
                DESKTOP NAVIGATION
            ================================================== */}

            <nav className="hidden items-center gap-3 lg:flex">
              {navItems.map(
                (item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() =>
                      handleNavigation(
                        item.href
                      )
                    }
                    className={getNavClass(
                      item.href
                    )}
                  >
                    {item.label}
                  </button>
                )
              )}
            </nav>

            {/* ==================================================
                RIGHT CONTROLS
            ================================================== */}

            <div className="flex shrink-0 items-center gap-2">

              {/* ==================================================
                  NOTIFICATION
              ================================================== */}

              <div
                ref={
                  notificationRef
                }
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => {
                    const willOpen =
                      !notificationOpen

                    setNotificationOpen(
                      willOpen
                    )

                    setProfileOpen(
                      false
                    )

                    if (willOpen) {
                      fetchNotifications(
                        false
                      )
                    }
                  }}
                  aria-label="Notifications"
                  title="Notifications"
                  className={`
                    relative
                    inline-flex
                    h-10
                    w-10
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-full
                    border
                    transition-all
                    duration-200
                    ease-out

                    focus:outline-none
                    focus:ring-2
                    focus:ring-[var(--accent-purple)]/30

                    ${
                      notificationOpen
                        ? `
                          border-[var(--accent-purple)]
                          bg-[var(--surface)]
                          shadow-md
                          scale-105
                        `
                        : `
                          border-[var(--border)]
                          bg-[var(--surface-soft)]

                          hover:-translate-y-[1px]
                          hover:border-[var(--accent-purple)]
                          hover:bg-[var(--surface)]
                          hover:shadow-md
                        `
                    }

                    ${
                      theme ===
                      'dark'
                        ? 'text-white'
                        : 'text-black'
                    }
                  `}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    className="h-[19px] w-[19px]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.31 6.022c1.733.64 3.55 1.082 5.453 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    />
                  </svg>

                  {/* UNREAD BADGE */}

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-pink)] px-1 text-[10px] font-bold text-white shadow-sm">
                      {unreadCount >
                      99
                        ? '99+'
                        : unreadCount}
                    </span>
                  )}
                </button>

                {/* ==================================================
                    NOTIFICATION DROPDOWN
                ================================================== */}

                {notificationOpen && (
                  <div className="absolute right-0 top-12 z-[100] w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">

                    {/* HEADER */}

                    <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                      <div>
                        <h3 className="font-semibold text-[var(--text-h)]">
                          Notifications
                        </h3>

                        {unreadCount >
                          0 && (
                          <p className="mt-0.5 text-[10px] text-[var(--secondary-text)]">
                            {
                              unreadCount
                            }{' '}
                            unread
                            {unreadCount !==
                            1
                              ? ' notifications'
                              : ' notification'}
                          </p>
                        )}
                      </div>

                      {unreadCount >
                        0 && (
                        <button
                          type="button"
                          onClick={
                            handleMarkAllAsRead
                          }
                          disabled={
                            markingAllRead
                          }
                          className="
                            cursor-pointer
                            text-[11px]
                            font-semibold
                            text-[var(--accent-purple)]
                            transition-colors

                            hover:underline

                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {markingAllRead
                            ? 'Marking...'
                            : 'Mark all read'}
                        </button>
                      )}
                    </div>

                    {/* LOADING */}

                    {notificationLoading ? (
                      <div className="px-5 py-8 text-center">
                        <div className="mb-3 text-xl text-[var(--accent-purple)]">
                          ✦
                        </div>

                        <p className="text-sm text-[var(--secondary-text)]">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length ===
                      0 ? (
                      /* EMPTY STATE */

                      <div className="px-5 py-8 text-center">
                        <div className="mb-2 text-2xl">
                          🔔
                        </div>

                        <p className="text-sm font-medium text-[var(--text-h)]">
                          No notifications yet
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[var(--secondary-text)]">
                          Your access approval or
                          rejection updates will
                          appear here.
                        </p>
                      </div>
                    ) : (
                      /* NOTIFICATIONS */

                      <div className="max-h-[360px] overflow-y-auto">
                        {notifications.map(
                          (
                            notification
                          ) => (
                            <button
                              key={
                                notification._id
                              }
                              type="button"
                              onClick={() =>
                                handleNotificationClick(
                                  notification
                                )
                              }
                              className={`
                                flex
                                w-full
                                cursor-pointer
                                flex-col
                                border-b
                                border-[var(--border)]
                                px-4
                                py-4
                                text-left
                                transition-all
                                duration-200
                                last:border-b-0

                                hover:bg-[var(--surface-soft)]
                                hover:shadow-sm

                                ${
                                  !notification.read
                                    ? 'bg-[var(--accent-purple)]/5'
                                    : ''
                                }
                              `}
                            >
                              <div className="flex items-start gap-3">

                                {/* STATUS DOT */}

                                <span
                                  className={`
                                    mt-1.5
                                    h-2
                                    w-2
                                    shrink-0
                                    rounded-full

                                    ${
                                      !notification.read
                                        ? 'bg-[var(--accent-pink)]'
                                        : 'bg-transparent'
                                    }
                                  `}
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p
                                      className={`
                                        text-sm
                                        ${
                                          !notification.read
                                            ? 'font-bold'
                                            : 'font-semibold'
                                        }
                                        text-[var(--text-h)]
                                      `}
                                    >
                                      {
                                        notification.title
                                      }
                                    </p>
                                  </div>

                                  <p className="mt-1 text-xs leading-5 text-[var(--secondary-text)]">
                                    {
                                      notification.message
                                    }
                                  </p>

                                  {notification.createdAt && (
                                    <p className="mt-2 text-[10px] text-[var(--secondary-text)]/70">
                                      {formatNotificationDate(
                                        notification.createdAt
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ==================================================
                  THEME
              ================================================== */}

              <button
                type="button"
                onClick={() =>
                  setTheme(
                    (current) =>
                      current ===
                      'dark'
                        ? 'light'
                        : 'dark'
                  )
                }
                aria-label={
                  theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                title={
                  theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                className="
                  inline-flex
                  h-10
                  w-10
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-[var(--border)]
                  bg-[var(--surface-soft)]
                  text-[var(--text)]
                  transition-all
                  duration-200
                  ease-out

                  hover:-translate-y-[1px]
                  hover:border-[var(--accent-purple)]
                  hover:bg-[var(--surface)]
                  hover:shadow-md

                  focus:outline-none
                  focus:ring-2
                  focus:ring-[var(--accent-purple)]/30
                "
              >
                <span className="text-[21px] leading-none">
                  {themeIcon}
                </span>
              </button>

              {/* ==================================================
                  PROFILE
              ================================================== */}

              <div
                ref={profileRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(
                      (open) => !open
                    )

                    setNotificationOpen(
                      false
                    )
                  }}
                  aria-label="Open profile menu"
                  title="Profile"
                  className={`
                    flex
                    h-10
                    w-10
                    cursor-pointer
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    border-2
                    bg-[var(--surface-soft)]
                    text-sm
                    font-semibold
                    text-[var(--accent-purple)]
                    shadow-sm
                    transition-all
                    duration-200
                    ease-out

                    focus:outline-none
                    focus:ring-2
                    focus:ring-[var(--accent-purple)]/30

                    ${
                      profileOpen
                        ? `
                          scale-105
                          border-[var(--accent-purple)]
                          shadow-md
                        `
                        : `
                          border-[var(--border)]

                          hover:-translate-y-[1px]
                          hover:border-[var(--accent-purple)]
                          hover:shadow-md
                        `
                    }
                  `}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {profileName
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </button>

                {/* ==================================================
                    PROFILE DROPDOWN
                ================================================== */}

                {profileOpen && (
                  <div className="absolute right-0 top-12 z-[100] w-[290px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">

                    {/* PROFILE INFORMATION */}

                    <div className="border-b border-[var(--border)] px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-lg font-semibold text-[var(--accent-purple)]">
                          {profileImage ? (
                            <img
                              src={
                                profileImage
                              }
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>
                              {profileName
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-h)]">
                            {profileName}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-[var(--secondary-text)]">
                            {profileEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="space-y-1 p-2">

                      {/* ADMIN DASHBOARD */}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            handleNavigation(
                              '/admin'
                            )
                          }
                          className="
                            group
                            flex
                            w-full
                            cursor-pointer
                            items-center
                            justify-between
                            rounded-xl
                            border
                            border-transparent
                            px-3
                            py-3
                            text-left
                            transition-all
                            duration-200
                            ease-out

                            hover:-translate-y-[1px]
                            hover:border-[var(--accent-purple)]/20
                            hover:bg-[var(--surface-soft)]
                            hover:shadow-sm

                            focus:outline-none
                            focus:ring-2
                            focus:ring-[var(--accent-purple)]/30
                          "
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-lg
                                bg-[var(--surface-soft)]
                                text-base
                                transition-all
                                duration-200

                                group-hover:bg-[var(--accent-purple)]/10
                                group-hover:scale-105
                              "
                            >
                              ⚙️
                            </span>

                            <span>
                              <span className="block text-sm font-semibold text-[var(--text-h)]">
                                Admin Dashboard
                              </span>

                              <span className="mt-0.5 block text-[11px] text-[var(--secondary-text)]">
                                Manage your vault
                              </span>
                            </span>
                          </span>

                          <span
                            className="
                              text-lg
                              text-[var(--secondary-text)]
                              transition-transform
                              duration-200

                              group-hover:translate-x-1
                              group-hover:text-[var(--accent-purple)]
                            "
                          >
                            →
                          </span>
                        </button>
                      )}

                      {/* CHANGE PROFILE PHOTO */}

                      <button
                        type="button"
                        onClick={
                          handleChangeProfilePhoto
                        }
                        disabled={
                          photoUploading
                        }
                        className="
                          group
                          flex
                          w-full
                          cursor-pointer
                          items-center
                          justify-between
                          rounded-xl
                          border
                          border-transparent
                          px-3
                          py-3
                          text-left
                          transition-all
                          duration-200
                          ease-out

                          hover:-translate-y-[1px]
                          hover:border-[var(--accent-purple)]/20
                          hover:bg-[var(--surface-soft)]
                          hover:shadow-sm

                          focus:outline-none
                          focus:ring-2
                          focus:ring-[var(--accent-purple)]/30

                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className="
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-lg
                              bg-[var(--surface-soft)]
                              text-base
                              transition-all
                              duration-200

                              group-hover:bg-[var(--accent-purple)]/10
                              group-hover:scale-105
                            "
                          >
                            {photoUploading
                              ? '⏳'
                              : '📷'}
                          </span>

                          <span>
                            <span className="block text-sm font-semibold text-[var(--text-h)]">
                              {photoUploading
                                ? 'Uploading...'
                                : 'Change profile photo'}
                            </span>

                            {!photoUploading && (
                              <span className="mt-0.5 block text-[11px] text-[var(--secondary-text)]">
                                Choose a new profile picture
                              </span>
                            )}
                          </span>
                        </span>

                        {!photoUploading && (
                          <span
                            className="
                              text-lg
                              text-[var(--secondary-text)]
                              transition-transform
                              duration-200

                              group-hover:translate-x-1
                              group-hover:text-[var(--accent-purple)]
                            "
                          >
                            →
                          </span>
                        )}
                      </button>

                      {/* LOG OUT */}

                      <button
                        type="button"
                        onClick={
                          handleLogout
                        }
                        disabled={
                          photoUploading
                        }
                        className="
                          group
                          flex
                          w-full
                          cursor-pointer
                          items-center
                          justify-between
                          rounded-xl
                          border
                          border-transparent
                          px-3
                          py-3
                          text-left
                          transition-all
                          duration-200
                          ease-out

                          hover:-translate-y-[1px]
                          hover:border-red-200
                          hover:bg-red-50
                          hover:shadow-sm

                          focus:outline-none
                          focus:ring-2
                          focus:ring-red-300/40

                          dark:hover:border-red-900/40
                          dark:hover:bg-red-950/20

                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className="
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-lg
                              bg-red-50
                              text-red-500
                              transition-all
                              duration-200

                              group-hover:bg-red-100
                              group-hover:scale-105

                              dark:bg-red-950/30
                              dark:group-hover:bg-red-950/50
                            "
                          >
                            ↪
                          </span>

                          <span>
                            <span className="block text-sm font-semibold text-red-500">
                              Log out
                            </span>

                            <span className="mt-0.5 block text-[11px] text-[var(--secondary-text)]">
                              Sign out of your account
                            </span>
                          </span>
                        </span>

                        <span
                          className="
                            text-lg
                            text-red-300
                            transition-transform
                            duration-200

                            group-hover:translate-x-1
                            group-hover:text-red-500
                          "
                        >
                          →
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ==================================================
                  MOBILE MENU BUTTON
              ================================================== */}

              <button
                type="button"
                onClick={() =>
                  setMenuOpen(
                    (open) => !open
                  )
                }
                className={`
                  inline-flex
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-full
                  border
                  p-2
                  text-[var(--text)]
                  transition-all
                  duration-200
                  lg:hidden

                  ${
                    menuOpen
                      ? `
                        border-[var(--accent-purple)]
                        bg-[var(--surface)]
                        shadow-md
                      `
                      : `
                        border-[var(--border)]
                        bg-[var(--surface-soft)]

                        hover:-translate-y-[1px]
                        hover:border-[var(--accent-purple)]
                        hover:bg-[var(--surface)]
                        hover:shadow-md
                      `
                  }
                `}
                aria-label="Open menu"
              >
                <span className="text-lg">
                  {menuOpen
                    ? '×'
                    : '☰'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================
            MOBILE NAVIGATION
        ====================================================== */}

        {menuOpen && (
          <div className="w-full border-t border-[var(--border)] px-4 pb-4 pt-3 sm:px-6 lg:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map(
                (item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() =>
                      handleNavigation(
                        item.href
                      )
                    }
                    className={`
                      ${getNavClass(
                        item.href
                      )}
                      w-full
                      text-left
                    `}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}

export default Navbar