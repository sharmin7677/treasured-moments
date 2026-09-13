import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { NavLink } from 'react-router-dom'
import { getIdToken } from 'firebase/auth'
import Swal from 'sweetalert2'

import { useAuth } from '../contexts/AuthContext.jsx'

// ============================================================
// API
// ============================================================

const API_URL = 'http://localhost:5000'

// ============================================================
// FILE SIZE LIMITS
// ============================================================

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100 MB

// ============================================================
// HELPERS
// ============================================================

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes'

  const units = [
    'Bytes',
    'KB',
    'MB',
    'GB',
  ]

  const index = Math.min(
    Math.floor(
      Math.log(bytes) / Math.log(1024)
    ),
    units.length - 1
  )

  return `${(
    bytes /
    Math.pow(1024, index)
  ).toFixed(index === 0 ? 0 : 2)} ${
    units[index]
  }`
}

// ============================================================
// DATE FORMATTER
// ============================================================

function formatDate(date) {
  if (!date) return ''

  try {
    return new Date(date).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    )
  } catch {
    return ''
  }
}

// ============================================================
// MEDIA TYPE LABEL
// ============================================================

function getMediaTypeLabel(mediaType) {
  if (mediaType === 'quote') {
    return 'Quote Image'
  }

  if (mediaType === 'photo') {
    return 'Photo'
  }

  if (mediaType === 'video') {
    return 'Video'
  }

  return 'Memory'
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

function AdminDashboard() {
  const { user } = useAuth()

  // ==========================================================
  // ACTIVE SECTION
  // ==========================================================

  const [activeSection, setActiveSection] =
    useState('Overview')

  // ==========================================================
  // MEDIA DATA
  // ==========================================================

  const [media, setMedia] = useState([])

  const [mediaLoading, setMediaLoading] =
    useState(false)

  const [mediaError, setMediaError] =
    useState('')

  // ==========================================================
  // UPLOAD MEMORY STATE
  // ==========================================================

  const [memoryFile, setMemoryFile] =
    useState(null)

  const [memoryTitle, setMemoryTitle] =
    useState('')

  const [memoryDescription, setMemoryDescription] =
    useState('')

  const [memoryUploading, setMemoryUploading] =
    useState(false)

  const memoryInputRef = useRef(null)

  // ==========================================================
  // UPLOAD PHOTO STATE
  // ==========================================================

  const [photoFile, setPhotoFile] =
    useState(null)

  const [photoTitle, setPhotoTitle] =
    useState('')

  const [photoDescription, setPhotoDescription] =
    useState('')

  const [photoUploading, setPhotoUploading] =
    useState(false)

  const photoInputRef = useRef(null)

  // ==========================================================
  // UPLOAD QUOTE IMAGE STATE
  // ==========================================================

  const [quoteFile, setQuoteFile] =
    useState(null)

  const [quoteTitle, setQuoteTitle] =
    useState('')

  const [quoteDescription, setQuoteDescription] =
    useState('')

  const [quoteUploading, setQuoteUploading] =
    useState(false)

  const quoteInputRef = useRef(null)

  // ==========================================================
  // UPLOAD VIDEO STATE
  // ==========================================================

  const [videoFile, setVideoFile] =
    useState(null)

  const [videoTitle, setVideoTitle] =
    useState('')

  const [videoDescription, setVideoDescription] =
    useState('')

  const [videoUploading, setVideoUploading] =
    useState(false)

  const videoInputRef = useRef(null)

  // ==========================================================
  // EDIT STATE
  // ==========================================================

  const [editingMedia, setEditingMedia] =
    useState(null)

  const [editTitle, setEditTitle] =
    useState('')

  const [editDescription, setEditDescription] =
    useState('')

  const [editSaving, setEditSaving] =
    useState(false)

  // ==========================================================
  // DELETE STATE
  // ==========================================================

  const [deleteLoading, setDeleteLoading] =
    useState(null)

  // ==========================================================
  // MENU ITEMS
  // ==========================================================

  const menuItems = [
    {
      label: 'Overview',
      icon: '⌂',
      section: 'Overview',
    },

    {
      label: 'Upload Memory',
      icon: '♡',
      section: 'Upload Memory',
    },

    {
      label: 'Upload Photo',
      icon: '▧',
      section: 'Upload Photo',
    },

    {
      label: 'Upload Quote Image',
      icon: '✦',
      section: 'Upload Quote Image',
    },

    {
      label: 'Upload Video',
      icon: '▶',
      section: 'Upload Video',
    },

    {
      label: 'Manage Memories',
      icon: '♡',
      section: 'Manage Memories',
    },

    {
      label: 'Manage Photos',
      icon: '▧',
      section: 'Manage Photos',
    },

    {
      label: 'Manage Quote Images',
      icon: '✦',
      section: 'Manage Quote Images',
    },

    {
      label: 'Manage Videos',
      icon: '▹',
      section: 'Manage Videos',
    },

    {
      label: 'Guest Messages',
      icon: '✉',
      section: 'Guest Messages',
    },
  ]

  // ==========================================================
  // MENU CLICK
  // ==========================================================

  const handleMenuClick = (section) => {
    setActiveSection(section)
  }

  // ==========================================================
  // GET FIREBASE TOKEN
  // ==========================================================

  const getAuthToken = async () => {
    if (!user) {
      throw new Error(
        'You must be logged in as admin.'
      )
    }

    return getIdToken(user, true)
  }

  // ==========================================================
  // LOAD MEDIA
  // ==========================================================

  const loadMedia = async (signal = null) => {
    try {
      setMediaLoading(true)
      setMediaError('')

      const idToken =
        await getAuthToken()

      if (signal?.aborted) {
        return
      }

      const response = await fetch(
        `${API_URL}/api/media`,
        {
          method: 'GET',

          headers: {
            Authorization:
              `Bearer ${idToken}`,

            'Content-Type':
              'application/json',
          },

          signal,
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to load media.'
        )
      }

      if (signal?.aborted) {
        return
      }

      setMedia(
        Array.isArray(data?.data)
          ? data.data
          : []
      )
    } catch (error) {
      if (error?.name === 'AbortError') {
        return
      }

      console.error(
        '❌ Media loading error:',
        error
      )

      setMediaError(
        error.message ||
          'Failed to load media.'
      )
    } finally {
      if (!signal?.aborted) {
        setMediaLoading(false)
      }
    }
  }

  // ==========================================================
  // LOAD MEDIA AFTER ADMIN USER EXISTS
  // ==========================================================

  useEffect(() => {
    if (!user) return

    const controller =
      new AbortController()

    loadMedia(controller.signal)

    return () => {
      controller.abort()
    }
  }, [user])

  // ==========================================================
  // MEMORY FILE SELECT
  // ==========================================================

  const handleMemoryChange = (event) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      setMemoryFile(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid file',
        text:
          'Please select an image file.',
      })

      event.target.value = ''
      setMemoryFile(null)

      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      Swal.fire({
        icon: 'warning',
        title: 'Image too large',
        text:
          'Image size cannot exceed 10 MB.',
      })

      event.target.value = ''
      setMemoryFile(null)

      return
    }

    setMemoryFile(file)
  }

  // ==========================================================
  // PHOTO FILE SELECT
  // ==========================================================

  const handlePhotoChange = (event) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      setPhotoFile(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid file',
        text:
          'Please select an image file.',
      })

      event.target.value = ''
      setPhotoFile(null)

      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      Swal.fire({
        icon: 'warning',
        title: 'Image too large',
        text:
          'Image size cannot exceed 10 MB.',
      })

      event.target.value = ''
      setPhotoFile(null)

      return
    }

    setPhotoFile(file)
  }

  // ==========================================================
  // QUOTE IMAGE FILE SELECT
  // ==========================================================

  const handleQuoteChange = (event) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      setQuoteFile(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid file',
        text:
          'Please select an image file.',
      })

      event.target.value = ''
      setQuoteFile(null)

      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      Swal.fire({
        icon: 'warning',
        title: 'Image too large',
        text:
          'Image size cannot exceed 10 MB.',
      })

      event.target.value = ''
      setQuoteFile(null)

      return
    }

    setQuoteFile(file)
  }

  // ==========================================================
  // VIDEO FILE SELECT
  // ==========================================================

  const handleVideoChange = (event) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      setVideoFile(null)
      return
    }

    if (!file.type.startsWith('video/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid file',
        text:
          'Please select a video file.',
      })

      event.target.value = ''
      setVideoFile(null)

      return
    }

    if (file.size > MAX_VIDEO_SIZE) {
      Swal.fire({
        icon: 'warning',
        title: 'Video too large',
        text:
          'Video size cannot exceed 100 MB.',
      })

      event.target.value = ''
      setVideoFile(null)

      return
    }

    setVideoFile(file)
  }

  // ==========================================================
  // UPLOAD MEDIA
  // ==========================================================

  const uploadMedia = async ({
    file,
    title,
    description,
    resourceType,
    mediaType,
  }) => {
    if (!user) {
      throw new Error(
        'You must be logged in as admin.'
      )
    }

    if (!file) {
      throw new Error(
        mediaType === 'video'
          ? 'Please select a video.'
          : 'Please select an image.'
      )
    }

    if (!title.trim()) {
      throw new Error(
        'Media title is required.'
      )
    }

    if (
      resourceType === 'image' &&
      file.size > MAX_IMAGE_SIZE
    ) {
      throw new Error(
        'Image size cannot exceed 10 MB.'
      )
    }

    if (
      resourceType === 'video' &&
      file.size > MAX_VIDEO_SIZE
    ) {
      throw new Error(
        'Video size cannot exceed 100 MB.'
      )
    }

    const idToken =
      await getAuthToken()

    const formData =
      new FormData()

    formData.append(
      'media',
      file
    )

    formData.append(
      'title',
      title.trim()
    )

    formData.append(
      'description',
      description.trim()
    )

    formData.append(
      'mediaType',
      mediaType
    )

    formData.append(
      'resourceType',
      resourceType
    )

    const response =
      await fetch(
        `${API_URL}/api/media/upload`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${idToken}`,
          },

          body: formData,
        }
      )

    let data = null

    try {
      data =
        await response.json()
    } catch {
      data = null
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          'Media upload failed.'
      )
    }

    return data
  }

  // ==========================================================
  // UPLOAD MEMORY
  // ==========================================================

  const handleMemoryUpload =
    async () => {
      if (!memoryFile) {
        Swal.fire({
          icon: 'warning',
          title: 'Select an image',
          text:
            'Please choose a memory image before uploading.',
        })

        return
      }

      if (!memoryTitle.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Title required',
          text:
            'Please enter a title for this memory.',
        })

        return
      }

      try {
        setMemoryUploading(true)

        await uploadMedia({
          file: memoryFile,
          title: memoryTitle,
          description:
            memoryDescription,
          resourceType: 'image',
          mediaType: 'memory',
        })

        await loadMedia()

        await Swal.fire({
          icon: 'success',
          title: 'Memory uploaded',
          text:
            'Your memory has been uploaded successfully.',
          timer: 1800,
          showConfirmButton: false,
        })

        setMemoryFile(null)
        setMemoryTitle('')
        setMemoryDescription('')

        if (memoryInputRef.current) {
          memoryInputRef.current.value =
            ''
        }
      } catch (error) {
        console.error(
          'Memory upload error:',
          error
        )

        Swal.fire({
          icon: 'error',
          title: 'Upload failed',
          text:
            error.message ||
            'Failed to upload memory.',
        })
      } finally {
        setMemoryUploading(false)
      }
    }

  // ==========================================================
  // UPLOAD PHOTO
  // ==========================================================

  const handlePhotoUpload =
    async () => {
      if (!photoFile) {
        Swal.fire({
          icon: 'warning',
          title: 'Select an image',
          text:
            'Please choose a photo before uploading.',
        })

        return
      }

      if (!photoTitle.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Title required',
          text:
            'Please enter a title for this photo.',
        })

        return
      }

      try {
        setPhotoUploading(true)

        await uploadMedia({
          file: photoFile,
          title: photoTitle,
          description:
            photoDescription,
          resourceType: 'image',
          mediaType: 'photo',
        })

        await loadMedia()

        await Swal.fire({
          icon: 'success',
          title: 'Photo uploaded',
          text:
            'Your photo has been uploaded successfully.',
          timer: 1800,
          showConfirmButton: false,
        })

        setPhotoFile(null)
        setPhotoTitle('')
        setPhotoDescription('')

        if (photoInputRef.current) {
          photoInputRef.current.value =
            ''
        }
      } catch (error) {
        console.error(
          'Photo upload error:',
          error
        )

        Swal.fire({
          icon: 'error',
          title: 'Upload failed',
          text:
            error.message ||
            'Failed to upload photo.',
        })
      } finally {
        setPhotoUploading(false)
      }
    }

  // ==========================================================
  // UPLOAD QUOTE IMAGE
  // ==========================================================

  const handleQuoteUpload =
    async () => {
      if (!quoteFile) {
        Swal.fire({
          icon: 'warning',
          title: 'Select an image',
          text:
            'Please choose a quote image before uploading.',
        })

        return
      }

      if (!quoteTitle.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Title required',
          text:
            'Please enter a title for this quote image.',
        })

        return
      }

      try {
        setQuoteUploading(true)

        await uploadMedia({
          file: quoteFile,
          title: quoteTitle,
          description:
            quoteDescription,
          resourceType: 'image',
          mediaType: 'quote',
        })

        await loadMedia()

        await Swal.fire({
          icon: 'success',
          title: 'Quote image uploaded',
          text:
            'Your quote image has been uploaded successfully.',
          timer: 1800,
          showConfirmButton: false,
        })

        setQuoteFile(null)
        setQuoteTitle('')
        setQuoteDescription('')

        if (quoteInputRef.current) {
          quoteInputRef.current.value =
            ''
        }
      } catch (error) {
        console.error(
          'Quote image upload error:',
          error
        )

        Swal.fire({
          icon: 'error',
          title: 'Upload failed',
          text:
            error.message ||
            'Failed to upload quote image.',
        })
      } finally {
        setQuoteUploading(false)
      }
    }

  // ==========================================================
  // UPLOAD VIDEO
  // ==========================================================

  const handleVideoUpload =
    async () => {
      if (!videoFile) {
        Swal.fire({
          icon: 'warning',
          title: 'Select a video',
          text:
            'Please choose a video before uploading.',
        })

        return
      }

      if (!videoTitle.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Title required',
          text:
            'Please enter a title for this video.',
        })

        return
      }

      try {
        setVideoUploading(true)

        await uploadMedia({
          file: videoFile,
          title: videoTitle,
          description:
            videoDescription,
          resourceType: 'video',
          mediaType: 'video',
        })

        await loadMedia()

        await Swal.fire({
          icon: 'success',
          title: 'Video uploaded',
          text:
            'Your video has been uploaded successfully.',
          timer: 1800,
          showConfirmButton: false,
        })

        setVideoFile(null)
        setVideoTitle('')
        setVideoDescription('')

        if (videoInputRef.current) {
          videoInputRef.current.value =
            ''
        }
      } catch (error) {
        console.error(
          'Video upload error:',
          error
        )

        Swal.fire({
          icon: 'error',
          title: 'Upload failed',
          text:
            error.message ||
            'Failed to upload video.',
        })
      } finally {
        setVideoUploading(false)
      }
    }

  // ==========================================================
  // START EDIT
  // ==========================================================

  const handleEditStart = (item) => {
    setEditingMedia(item)

    setEditTitle(
      item.title || ''
    )

    setEditDescription(
      item.description || ''
    )
  }

  // ==========================================================
  // CANCEL EDIT
  // ==========================================================

  const handleEditCancel = () => {
    setEditingMedia(null)
    setEditTitle('')
    setEditDescription('')
  }

  // ==========================================================
  // UPDATE MEDIA
  // ==========================================================

  const handleUpdateMedia =
    async () => {
      if (!editingMedia) {
        return
      }

      if (!editTitle.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Title required',
          text:
            'Media title cannot be empty.',
        })

        return
      }

      try {
        setEditSaving(true)

        const idToken =
          await getAuthToken()

        const response =
          await fetch(
            `${API_URL}/api/media/${editingMedia._id}`,
            {
              method: 'PUT',

              headers: {
                Authorization:
                  `Bearer ${idToken}`,

                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                title:
                  editTitle.trim(),

                description:
                  editDescription.trim(),
              }),
            }
          )

        let data = null

        try {
          data =
            await response.json()
        } catch {
          data = null
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Failed to update media.'
          )
        }

        setMedia(
          (currentMedia) =>
            currentMedia.map(
              (item) =>
                String(item._id) ===
                String(
                  editingMedia._id
                )
                  ? {
                      ...item,

                      title:
                        editTitle.trim(),

                      description:
                        editDescription.trim(),

                      updatedAt:
                        new Date().toISOString(),
                    }
                  : item
            )
        )

        handleEditCancel()

        await Swal.fire({
          icon: 'success',
          title: 'Updated successfully',
          text:
            'Media information has been updated.',
          timer: 1600,
          showConfirmButton: false,
        })
      } catch (error) {
        console.error(
          'Media update error:',
          error
        )

        Swal.fire({
          icon: 'error',
          title: 'Update failed',
          text:
            error.message ||
            'Failed to update media.',
        })
      } finally {
        setEditSaving(false)
      }
    }

  // ==========================================================
  // DELETE MEDIA
  // ==========================================================

  const handleDeleteMedia =
    async (item) => {
      const result =
        await Swal.fire({
          icon: 'warning',

          title: 'Delete this media?',

          text:
            'This action will permanently remove the media from the vault.',

          showCancelButton: true,

          confirmButtonText:
            'Yes, Delete',

          cancelButtonText:
            'Cancel',

          confirmButtonColor:
            '#dc3545',

          cancelButtonColor:
            '#777',
        })

      if (!result.isConfirmed) {
        return
      }

      try {
        setDeleteLoading(
          String(item._id)
        )

        const idToken =
          await getAuthToken()

        const response =
          await fetch(
            `${API_URL}/api/media/${item._id}`,
            {
              method: 'DELETE',

              headers: {
                Authorization:
                  `Bearer ${idToken}`,

                'Content-Type':
                  'application/json',
              },
            }
          )

        let data = null

        try {
          data =
            await response.json()
        } catch {
          data = null
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Failed to delete media.'
          )
        }

        setMedia(
          (currentMedia) =>
            currentMedia.filter(
              (mediaItem) =>
                String(
                  mediaItem._id
                ) !==
                String(item._id)
            )
        )

        await Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text:
            'Media has been deleted successfully.',
          timer: 1600,
          showConfirmButton: false,
        })
      } catch (error) {
        console.error(
          'Media delete error:',
          error
        )

        Swal.fire({
          icon: 'error',
          title: 'Delete failed',
          text:
            error.message ||
            'Failed to delete media.',
        })
      } finally {
        setDeleteLoading(null)
      }
    }

  // ==========================================================
  // FILTERED MEDIA
  // ==========================================================

  const memoryItems =
    media.filter(
      (item) =>
        item.mediaType === 'memory'
    )

  const photoItems =
    media.filter(
      (item) =>
        item.mediaType === 'photo'
    )

  const quoteItems =
    media.filter(
      (item) =>
        item.mediaType === 'quote'
    )

  const videoItems =
    media.filter(
      (item) =>
        item.mediaType === 'video' ||
        item.resourceType === 'video'
    )

  // ==========================================================
  // LEGACY IMAGE FALLBACK
  //
  // Old images without mediaType remain memories.
  // They will NOT become Photos automatically.
  // ==========================================================

  const legacyImageItems =
    media.filter(
      (item) =>
        item.resourceType === 'image' &&
        !item.mediaType
    )

  const allMemoryItems = [
    ...memoryItems,
    ...legacyImageItems,
  ]

  // ==========================================================
  // MEDIA CARD
  // ==========================================================

  const renderMediaCard = (
    item
  ) => {
    const isVideo =
      item.resourceType ===
      'video'

    const isDeleting =
      deleteLoading ===
      String(item._id)

    return (
      <article
        key={String(item._id)}
        className="
          overflow-hidden
          rounded-[1.4rem]
          border
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-sm
          transition-all
          duration-200
          hover:-translate-y-[2px]
          hover:shadow-md
        "
      >
        {/* MEDIA PREVIEW */}

        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-soft)]">
          {isVideo ? (
            <video
              src={item.url}
              className="h-full w-full object-cover"
              controls
              preload="metadata"
            />
          ) : (
            <img
              src={item.url}
              alt={item.title || 'Media'}
              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-300
                hover:scale-[1.03]
              "
            />
          )}

          {/* TYPE BADGE */}

          <span
            className="
              absolute
              left-3
              top-3
              rounded-full
              border
              border-white/20
              bg-black/55
              px-3
              py-1
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.12em]
              text-white
              backdrop-blur-sm
            "
          >
            {getMediaTypeLabel(
              item.mediaType ||
                (isVideo
                  ? 'video'
                  : 'memory')
            )}
          </span>
        </div>

        {/* CONTENT */}

        <div className="p-4">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <h3 className="truncate text-sm font-semibold text-[var(--text-h)]">
                {item.title ||
                  'Untitled media'}
              </h3>

              <p className="mt-1 text-[11px] text-[var(--secondary-text)]">
                {formatDate(
                  item.createdAt
                )}
              </p>

            </div>

          </div>

          {item.description && (
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--secondary-text)]">
              {item.description}
            </p>
          )}

          {/* ACTIONS */}

          <div className="mt-4 grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={() =>
                handleEditStart(item)
              }
              className="
                rounded-lg
                border
                border-[var(--border)]
                bg-[var(--surface-soft)]
                px-3
                py-2
                text-xs
                font-semibold
                text-[var(--text-h)]
                transition
                hover:border-[var(--accent-purple)]/30
                hover:text-[var(--accent-purple)]
              "
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                handleDeleteMedia(item)
              }
              disabled={isDeleting}
              className="
                rounded-lg
                border
                border-red-200
                bg-red-50
                px-3
                py-2
                text-xs
                font-semibold
                text-red-500
                transition
                hover:bg-red-100
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:border-red-900/40
                dark:bg-red-950/20
              "
            >
              {isDeleting
                ? 'Deleting...'
                : 'Delete'}
            </button>

          </div>
        </div>
      </article>
    )
  }

  // ==========================================================
  // MANAGE MEDIA SECTION
  // ==========================================================

  const renderManageMedia = ({
    title,
    subtitle,
    items,
    emptyText,
  }) => (
    <div className="space-y-6">

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
          Content management
        </p>

        <h2 className="mt-3 font-serif text-3xl font-semibold text-[var(--text-h)]">
          {title}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--secondary-text)]">
          {subtitle}
        </p>
      </div>

      {/* LOADING */}

      {mediaLoading && (
        <div
          className="
            rounded-[1.5rem]
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-10
            text-center
            shadow-sm
          "
        >
          <p className="text-sm text-[var(--secondary-text)]">
            Loading media...
          </p>
        </div>
      )}

      {/* ERROR */}

      {!mediaLoading &&
        mediaError && (
          <div
            className="
              rounded-[1.5rem]
              border
              border-red-200
              bg-red-50
              p-6
              text-center
              dark:border-red-900/40
              dark:bg-red-950/20
            "
          >
            <p className="text-sm font-medium text-red-500">
              {mediaError}
            </p>

            <button
              type="button"
              onClick={loadMedia}
              className="
                mt-4
                rounded-lg
                bg-[var(--accent-purple)]
                px-4
                py-2
                text-xs
                font-semibold
                text-white
              "
            >
              Try Again
            </button>
          </div>
        )}

      {/* EMPTY */}

      {!mediaLoading &&
        !mediaError &&
        items.length === 0 && (
          <div
            className="
              flex
              min-h-[300px]
              items-center
              justify-center
              rounded-[1.75rem]
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-8
              text-center
              shadow-sm
            "
          >
            <div>
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-[var(--accent-purple)]/10
                  text-xl
                  text-[var(--accent-purple)]
                "
              >
                ✦
              </div>

              <h3 className="mt-4 text-lg font-semibold text-[var(--text-h)]">
                Nothing here yet
              </h3>

              <p className="mt-2 text-sm text-[var(--secondary-text)]">
                {emptyText}
              </p>
            </div>
          </div>
        )}

      {/* GRID */}

      {!mediaLoading &&
        !mediaError &&
        items.length > 0 && (
          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            {items.map(
              renderMediaCard
            )}
          </div>
        )}

    </div>
  )

  // ==========================================================
  // COMMON INPUT CLASS
  // ==========================================================

  const inputClass = `
    mt-2
    w-full
    rounded-xl
    border
    border-[var(--border)]
    bg-[var(--surface-soft)]
    px-4
    py-3
    text-sm
    text-[var(--text-h)]
    outline-none
    transition
    focus:border-[var(--accent-purple)]
    focus:ring-2
    focus:ring-[var(--accent-purple)]/10
  `

  // ==========================================================
  // COMMON FILE INPUT CLASS
  // ==========================================================

  const fileInputClass = `
    block
    w-full
    cursor-pointer
    rounded-xl
    border
    border-[var(--border)]
    bg-[var(--surface-soft)]
    px-4
    py-3
    text-sm
    text-[var(--text-h)]
    file:mr-4
    file:rounded-lg
    file:border-0
    file:bg-[var(--accent-purple)]
    file:px-4
    file:py-2
    file:text-sm
    file:font-semibold
    file:text-white
    hover:file:opacity-90
  `

  // ==========================================================
  // UPLOAD MEMORY SECTION
  // ==========================================================

  const renderMemoryUpload =
    () => (
      <div className="space-y-6">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
            Memory upload
          </p>

          <h2 className="mt-3 font-serif text-3xl font-semibold text-[var(--text-h)]">
            Upload Memory
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--secondary-text)]">
            Add a new memory photo to The
            Friendship Vault.
          </p>
        </div>

        <div
          className="
            rounded-[1.75rem]
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-6
            shadow-sm
            sm:p-8
          "
        >

          <label className="text-sm font-semibold text-[var(--text-h)]">
            Memory Image
          </label>

          <input
            ref={memoryInputRef}
            type="file"
            accept="image/*"
            onChange={handleMemoryChange}
            className={fileInputClass}
          />

          <p className="mt-2 text-xs text-[var(--secondary-text)]">
            Maximum image size:{' '}
            <strong>10 MB</strong>
          </p>

          {memoryFile && (
            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <p className="break-all text-sm font-medium text-[var(--text-h)]">
                {memoryFile.name}
              </p>

              <p className="mt-1 text-xs text-[var(--secondary-text)]">
                {formatFileSize(
                  memoryFile.size
                )}
              </p>
            </div>
          )}

          <div className="mt-5">

            <label
              htmlFor="memory-title"
              className="text-sm font-semibold text-[var(--text-h)]"
            >
              Title
            </label>

            <input
              id="memory-title"
              type="text"
              value={memoryTitle}
              onChange={(event) =>
                setMemoryTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Our First Friendship Day"
              maxLength={150}
              className={inputClass}
            />

          </div>

          <div className="mt-5">

            <label
              htmlFor="memory-description"
              className="text-sm font-semibold text-[var(--text-h)]"
            >
              Description
            </label>

            <textarea
              id="memory-description"
              value={memoryDescription}
              onChange={(event) =>
                setMemoryDescription(
                  event.target.value
                )
              }
              placeholder="Write something special about this memory..."
              rows={5}
              maxLength={1000}
              className={`${inputClass} resize-none leading-6`}
            />

          </div>

          <button
            type="button"
            onClick={
              handleMemoryUpload
            }
            disabled={
              memoryUploading ||
              !memoryFile
            }
            className="
              mt-6
              inline-flex
              w-full
              items-center
              justify-center
              rounded-xl
              bg-[var(--accent-purple)]
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:-translate-y-[1px]
              hover:opacity-95
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            {memoryUploading
              ? 'Uploading Memory...'
              : 'Upload Memory'}
          </button>

        </div>
      </div>
    )

  // ==========================================================
  // UPLOAD PHOTO SECTION
  // ==========================================================

  const renderPhotoUpload =
    () => (
      <div className="space-y-6">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
            Photo upload
          </p>

          <h2 className="mt-3 font-serif text-3xl font-semibold text-[var(--text-h)]">
            Upload Photo
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--secondary-text)]">
            Add a photo to the dedicated
            Photos section of The Friendship
            Vault.
          </p>
        </div>

        <div
          className="
            rounded-[1.75rem]
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-6
            shadow-sm
            sm:p-8
          "
        >

          <label className="text-sm font-semibold text-[var(--text-h)]">
            Photo
          </label>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className={fileInputClass}
          />

          <p className="mt-2 text-xs text-[var(--secondary-text)]">
            Maximum image size:{' '}
            <strong>10 MB</strong>
          </p>

          {photoFile && (
            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <p className="break-all text-sm font-medium text-[var(--text-h)]">
                {photoFile.name}
              </p>

              <p className="mt-1 text-xs text-[var(--secondary-text)]">
                {formatFileSize(
                  photoFile.size
                )}
              </p>
            </div>
          )}

          <div className="mt-5">

            <label
              htmlFor="photo-title"
              className="text-sm font-semibold text-[var(--text-h)]"
            >
              Title
            </label>

            <input
              id="photo-title"
              type="text"
              value={photoTitle}
              onChange={(event) =>
                setPhotoTitle(
                  event.target.value
                )
              }
              placeholder="e.g. A Beautiful Day Together"
              maxLength={150}
              className={inputClass}
            />

          </div>

          <div className="mt-5">

            <label
              htmlFor="photo-description"
              className="text-sm font-semibold text-[var(--text-h)]"
            >
              Description
            </label>

            <textarea
              id="photo-description"
              value={photoDescription}
              onChange={(event) =>
                setPhotoDescription(
                  event.target.value
                )
              }
              placeholder="Write something about this photo..."
              rows={5}
              maxLength={1000}
              className={`${inputClass} resize-none leading-6`}
            />

          </div>

          <button
            type="button"
            onClick={
              handlePhotoUpload
            }
            disabled={
              photoUploading ||
              !photoFile
            }
            className="
              mt-6
              inline-flex
              w-full
              items-center
              justify-center
              rounded-xl
              bg-[var(--accent-purple)]
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:-translate-y-[1px]
              hover:opacity-95
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            {photoUploading
              ? 'Uploading Photo...'
              : 'Upload Photo'}
          </button>

        </div>
      </div>
    )

  // ==========================================================
  // UPLOAD QUOTE IMAGE SECTION
  // ==========================================================

  const renderQuoteUpload =
    () => (
      <div className="space-y-6">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
            Quote image upload
          </p>

          <h2 className="mt-3 font-serif text-3xl font-semibold text-[var(--text-h)]">
            Upload Quote Image
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--secondary-text)]">
            Upload only quote images for the
            dedicated Little Words section.
          </p>
        </div>

        <div
          className="
            rounded-[1.75rem]
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-6
            shadow-sm
            sm:p-8
          "
        >

          <label className="text-sm font-semibold text-[var(--text-h)]">
            Quote Image
          </label>

          <input
            ref={quoteInputRef}
            type="file"
            accept="image/*"
            onChange={handleQuoteChange}
            className={fileInputClass}
          />

          <p className="mt-2 text-xs text-[var(--secondary-text)]">
            Maximum image size:{' '}
            <strong>10 MB</strong>
          </p>

          {quoteFile && (
            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <p className="break-all text-sm font-medium text-[var(--text-h)]">
                {quoteFile.name}
              </p>

              <p className="mt-1 text-xs text-[var(--secondary-text)]">
                {formatFileSize(
                  quoteFile.size
                )}
              </p>
            </div>
          )}

          <div className="mt-5">

            <label
              htmlFor="quote-title"
              className="text-sm font-semibold text-[var(--text-h)]"
            >
              Title
            </label>

            <input
              id="quote-title"
              type="text"
              value={quoteTitle}
              onChange={(event) =>
                setQuoteTitle(
                  event.target.value
                )
              }
              placeholder="e.g. A Quote About Friendship"
              maxLength={150}
              className={inputClass}
            />

          </div>

          <div className="mt-5">

            <label
              htmlFor="quote-description"
              className="text-sm font-semibold text-[var(--text-h)]"
            >
              Description
            </label>

            <textarea
              id="quote-description"
              value={quoteDescription}
              onChange={(event) =>
                setQuoteDescription(
                  event.target.value
                )
              }
              placeholder="Optional description for this quote image..."
              rows={5}
              maxLength={1000}
              className={`${inputClass} resize-none leading-6`}
            />

          </div>

          <button
            type="button"
            onClick={
              handleQuoteUpload
            }
            disabled={
              quoteUploading ||
              !quoteFile
            }
            className="
              mt-6
              inline-flex
              w-full
              items-center
              justify-center
              rounded-xl
              bg-[var(--accent-purple)]
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:-translate-y-[1px]
              hover:opacity-95
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            {quoteUploading
              ? 'Uploading Quote Image...'
              : 'Upload Quote Image'}
          </button>

        </div>
      </div>
    )

  // ==========================================================
  // UPLOAD VIDEO SECTION
  // ==========================================================

  const renderVideoUpload =
    () => (
      <div className="space-y-6">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
            Media upload
          </p>

          <h2 className="mt-3 font-serif text-3xl font-semibold text-[var(--text-h)]">
            Upload Video
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--secondary-text)]">
            Add a new video memory to The
            Friendship Vault.
          </p>
        </div>

        <div
          className="
            rounded-[1.75rem]
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-6
            shadow-sm
            sm:p-8
          "
        >

          <label className="text-sm font-semibold text-[var(--text-h)]">
            Video
          </label>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className={fileInputClass}
          />

          <p className="mt-2 text-xs text-[var(--secondary-text)]">
            Maximum video size:{' '}
            <strong>100 MB</strong>
          </p>

          {videoFile && (
            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <p className="break-all text-sm font-medium text-[var(--text-h)]">
                {videoFile.name}
              </p>

              <p className="mt-1 text-xs text-[var(--secondary-text)]">
                {formatFileSize(
                  videoFile.size
                )}
              </p>
            </div>
          )}

          <div className="mt-5">

            <label
              htmlFor="video-title"
              className="text-sm font-semibold text-[var(--text-h)]"
            >
              Title
            </label>

            <input
              id="video-title"
              type="text"
              value={videoTitle}
              onChange={(event) =>
                setVideoTitle(
                  event.target.value
                )
              }
              placeholder="e.g. A Beautiful Friendship Moment"
              maxLength={150}
              className={inputClass}
            />

          </div>

          <div className="mt-5">

            <label
              htmlFor="video-description"
              className="text-sm font-semibold text-[var(--text-h)]"
            >
              Description
            </label>

            <textarea
              id="video-description"
              value={videoDescription}
              onChange={(event) =>
                setVideoDescription(
                  event.target.value
                )
              }
              placeholder="Write something about this video..."
              rows={5}
              maxLength={1000}
              className={`${inputClass} resize-none leading-6`}
            />

          </div>

          <button
            type="button"
            onClick={
              handleVideoUpload
            }
            disabled={
              videoUploading ||
              !videoFile
            }
            className="
              mt-6
              inline-flex
              w-full
              items-center
              justify-center
              rounded-xl
              bg-[var(--accent-purple)]
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:-translate-y-[1px]
              hover:opacity-95
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            {videoUploading
              ? 'Uploading Video...'
              : 'Upload Video'}
          </button>

        </div>
      </div>
    )

  // ==========================================================
  // EDIT MODAL
  // ==========================================================

  const renderEditModal =
    () => {
      if (!editingMedia) {
        return null
      }

      return (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleEditCancel()
            }
          }}
        >

          <div
            className="
              w-full
              max-w-lg
              rounded-[1.75rem]
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-6
              shadow-2xl
              sm:p-8
            "
          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-purple)]">
                  Edit media
                </p>

                <h2 className="mt-2 font-serif text-2xl font-semibold text-[var(--text-h)]">
                  Update{' '}
                  {getMediaTypeLabel(
                    editingMedia.mediaType ||
                      editingMedia.resourceType
                  )}
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  handleEditCancel
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-[var(--border)]
                  bg-[var(--surface-soft)]
                  text-lg
                  text-[var(--secondary-text)]
                  transition
                  hover:text-[var(--text-h)]
                "
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* TITLE */}

            <div className="mt-6">

              <label
                htmlFor="edit-media-title"
                className="text-sm font-semibold text-[var(--text-h)]"
              >
                Title
              </label>

              <input
                id="edit-media-title"
                type="text"
                value={editTitle}
                onChange={(event) =>
                  setEditTitle(
                    event.target.value
                  )
                }
                maxLength={150}
                className={inputClass}
              />

            </div>

            {/* DESCRIPTION */}

            <div className="mt-5">

              <label
                htmlFor="edit-media-description"
                className="text-sm font-semibold text-[var(--text-h)]"
              >
                Description
              </label>

              <textarea
                id="edit-media-description"
                value={editDescription}
                onChange={(event) =>
                  setEditDescription(
                    event.target.value
                  )
                }
                rows={5}
                maxLength={1000}
                className={`${inputClass} resize-none leading-6`}
              />

            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={
                  handleEditCancel
                }
                disabled={editSaving}
                className="
                  rounded-xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface-soft)]
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-[var(--text-h)]
                  transition
                  hover:bg-[var(--surface)]
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleUpdateMedia
                }
                disabled={editSaving}
                className="
                  rounded-xl
                  bg-[var(--accent-purple)]
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:opacity-95
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {editSaving
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>

            </div>

          </div>

        </div>
      )
    }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main
      className="
        min-h-screen
        w-full
        bg-[var(--background)]
        px-4
        py-8
        sm:px-6
        lg:px-8
      "
    >

      <div className="mx-auto w-full max-w-7xl">

        {/* PAGE HEADER */}

        <div className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-purple)]">
            ADMIN PANEL 🔐
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-[var(--text-h)] sm:text-5xl">
            Admin Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--secondary-text)] sm:text-base">
            Manage memories, photos, quote images,
            videos, guest access and private
            content inside The Friendship Vault.
          </p>

        </div>

        {/* DASHBOARD LAYOUT */}

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">

          {/* SIDEBAR */}

          <aside
            className="
              h-fit
              rounded-[1.75rem]
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-3
              shadow-sm
              lg:sticky
              lg:top-24
            "
          >

            <div className="px-3 pb-3 pt-2">

              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--secondary-text)]">
                Dashboard
              </p>

            </div>

            <nav className="space-y-1">

              {menuItems.map(
                (item) => {
                  const isActive =
                    activeSection ===
                    item.section

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        handleMenuClick(
                          item.section
                        )
                      }
                      className={`
                        group
                        flex
                        w-full
                        cursor-pointer
                        items-center
                        gap-3
                        rounded-xl
                        border
                        px-3
                        py-3
                        text-left
                        transition-all
                        duration-200
                        ${
                          isActive
                            ? `
                              border-[var(--accent-purple)]/20
                              bg-[var(--accent-purple)]/10
                              text-[var(--accent-purple)]
                              shadow-sm
                            `
                            : `
                              border-transparent
                              text-[var(--secondary-text)]
                              hover:-translate-y-[1px]
                              hover:border-[var(--border)]
                              hover:bg-[var(--surface-soft)]
                              hover:text-[var(--accent-purple)]
                            `
                        }
                      `}
                    >

                      <span
                        className={`
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          text-base
                          transition-all
                          duration-200
                          ${
                            isActive
                              ? `
                                bg-[var(--surface)]
                                text-[var(--accent-purple)]
                                shadow-sm
                              `
                              : `
                                bg-[var(--surface-soft)]
                                text-[var(--secondary-text)]
                                group-hover:text-[var(--accent-purple)]
                              `
                          }
                        `}
                      >
                        {item.icon}
                      </span>

                      <span className="text-sm font-medium">
                        {item.label}
                      </span>

                    </button>
                  )
                }
              )}

            </nav>

            {/* ACCESS REQUESTS */}

            <div className="my-3 border-t border-[var(--border)]" />

            <NavLink
              to="/admin/access-requests"
              className={({ isActive }) => `
                group
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                border
                px-3
                py-3
                transition-all
                duration-200
                ${
                  isActive
                    ? `
                      border-[var(--accent-purple)]/20
                      bg-[var(--accent-purple)]/10
                      text-[var(--accent-purple)]
                    `
                    : `
                      border-transparent
                      text-[var(--secondary-text)]
                      hover:-translate-y-[1px]
                      hover:border-[var(--border)]
                      hover:bg-[var(--surface-soft)]
                      hover:text-[var(--accent-purple)]
                    `
                }
              `}
            >

              <span
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-[var(--surface-soft)]
                  text-base
                "
              >
                ♢
              </span>

              <span className="text-sm font-medium">
                Access Requests
              </span>

            </NavLink>

          </aside>

          {/* MAIN CONTENT */}

          <section className="min-w-0">

            {/* =================================================
                OVERVIEW
            ================================================== */}

            {activeSection ===
              'Overview' && (
              <div className="space-y-6">

                {/* Welcome */}

                <div
                  className="
                    rounded-[1.75rem]
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    p-6
                    shadow-sm
                    sm:p-8
                  "
                >

                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
                    Welcome back
                  </p>

                  <h2 className="mt-3 font-serif text-3xl font-semibold text-[var(--text-h)]">
                    Your vault at a glance
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--secondary-text)]">
                    This is your private control center
                    for managing everything inside The
                    Friendship Vault.
                  </p>

                </div>

                {/* Stats */}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

                  {/* MEMORIES */}

                  <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--secondary-text)]">
                        Memories
                      </span>

                      <span className="text-lg text-[var(--accent-purple)]">
                        ♡
                      </span>

                    </div>

                    <p className="mt-4 text-3xl font-semibold text-[var(--text-h)]">
                      {allMemoryItems.length}
                    </p>

                    <p className="mt-1 text-xs text-[var(--secondary-text)]">
                      Memory images
                    </p>

                  </div>

                  {/* PHOTOS */}

                  <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--secondary-text)]">
                        Photos
                      </span>

                      <span className="text-lg text-[var(--accent-purple)]">
                        ▧
                      </span>

                    </div>

                    <p className="mt-4 text-3xl font-semibold text-[var(--text-h)]">
                      {photoItems.length}
                    </p>

                    <p className="mt-1 text-xs text-[var(--secondary-text)]">
                      Photos collection
                    </p>

                  </div>

                  {/* QUOTES */}

                  <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--secondary-text)]">
                        Quotes
                      </span>

                      <span className="text-lg text-[var(--accent-purple)]">
                        ✦
                      </span>

                    </div>

                    <p className="mt-4 text-3xl font-semibold text-[var(--text-h)]">
                      {quoteItems.length}
                    </p>

                    <p className="mt-1 text-xs text-[var(--secondary-text)]">
                      Quote images
                    </p>

                  </div>

                  {/* VIDEOS */}

                  <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--secondary-text)]">
                        Videos
                      </span>

                      <span className="text-lg text-[var(--accent-purple)]">
                        ▶
                      </span>

                    </div>

                    <p className="mt-4 text-3xl font-semibold text-[var(--text-h)]">
                      {videoItems.length}
                    </p>

                    <p className="mt-1 text-xs text-[var(--secondary-text)]">
                      Vault videos
                    </p>

                  </div>

                  {/* TOTAL */}

                  <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--secondary-text)]">
                        Total Media
                      </span>

                      <span className="text-lg text-[var(--accent-purple)]">
                        ✦
                      </span>

                    </div>

                    <p className="mt-4 text-3xl font-semibold text-[var(--text-h)]">
                      {media.length}
                    </p>

                    <p className="mt-1 text-xs text-[var(--secondary-text)]">
                      All uploaded media
                    </p>

                  </div>

                </div>

                {/* QUICK ACTIONS */}

                <div
                  className="
                    rounded-[1.75rem]
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    p-6
                    shadow-sm
                    sm:p-8
                  "
                >

                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
                    Quick actions
                  </p>

                  <h3 className="mt-2 text-xl font-semibold text-[var(--text-h)]">
                    Manage your vault
                  </h3>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    {/* UPLOAD MEMORY */}

                    <button
                      type="button"
                      onClick={() =>
                        handleMenuClick(
                          'Upload Memory'
                        )
                      }
                      className="
                        group
                        flex
                        items-center
                        justify-between
                        rounded-xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface-soft)]
                        px-4
                        py-4
                        text-left
                        transition-all
                        hover:-translate-y-[1px]
                        hover:border-[var(--accent-purple)]/30
                        hover:bg-[var(--surface)]
                        hover:shadow-md
                      "
                    >

                      <span>
                        <span className="block text-sm font-semibold text-[var(--text-h)]">
                          Upload Memory
                        </span>

                        <span className="mt-1 block text-xs text-[var(--secondary-text)]">
                          Add a new memory photo
                        </span>
                      </span>

                      <span className="text-lg text-[var(--accent-purple)] transition-transform group-hover:translate-x-1">
                        →
                      </span>

                    </button>

                    {/* UPLOAD PHOTO */}

                    <button
                      type="button"
                      onClick={() =>
                        handleMenuClick(
                          'Upload Photo'
                        )
                      }
                      className="
                        group
                        flex
                        items-center
                        justify-between
                        rounded-xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface-soft)]
                        px-4
                        py-4
                        text-left
                        transition-all
                        hover:-translate-y-[1px]
                        hover:border-[var(--accent-purple)]/30
                        hover:bg-[var(--surface)]
                        hover:shadow-md
                      "
                    >

                      <span>
                        <span className="block text-sm font-semibold text-[var(--text-h)]">
                          Upload Photo
                        </span>

                        <span className="mt-1 block text-xs text-[var(--secondary-text)]">
                          Add a photo to Photos
                        </span>
                      </span>

                      <span className="text-lg text-[var(--accent-purple)] transition-transform group-hover:translate-x-1">
                        →
                      </span>

                    </button>

                    {/* UPLOAD QUOTE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleMenuClick(
                          'Upload Quote Image'
                        )
                      }
                      className="
                        group
                        flex
                        items-center
                        justify-between
                        rounded-xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface-soft)]
                        px-4
                        py-4
                        text-left
                        transition-all
                        hover:-translate-y-[1px]
                        hover:border-[var(--accent-purple)]/30
                        hover:bg-[var(--surface)]
                        hover:shadow-md
                      "
                    >

                      <span>
                        <span className="block text-sm font-semibold text-[var(--text-h)]">
                          Upload Quote Image
                        </span>

                        <span className="mt-1 block text-xs text-[var(--secondary-text)]">
                          Add a quote image
                        </span>
                      </span>

                      <span className="text-lg text-[var(--accent-purple)] transition-transform group-hover:translate-x-1">
                        →
                      </span>

                    </button>

                    {/* UPLOAD VIDEO */}

                    <button
                      type="button"
                      onClick={() =>
                        handleMenuClick(
                          'Upload Video'
                        )
                      }
                      className="
                        group
                        flex
                        items-center
                        justify-between
                        rounded-xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface-soft)]
                        px-4
                        py-4
                        text-left
                        transition-all
                        hover:-translate-y-[1px]
                        hover:border-[var(--accent-purple)]/30
                        hover:bg-[var(--surface)]
                        hover:shadow-md
                      "
                    >

                      <span>
                        <span className="block text-sm font-semibold text-[var(--text-h)]">
                          Upload Video
                        </span>

                        <span className="mt-1 block text-xs text-[var(--secondary-text)]">
                          Add a new vault video
                        </span>
                      </span>

                      <span className="text-lg text-[var(--accent-purple)] transition-transform group-hover:translate-x-1">
                        →
                      </span>

                    </button>

                  </div>

                </div>

              </div>
            )}

            {/* UPLOAD MEMORY */}

            {activeSection ===
              'Upload Memory' &&
              renderMemoryUpload()}

            {/* UPLOAD PHOTO */}

            {activeSection ===
              'Upload Photo' &&
              renderPhotoUpload()}

            {/* UPLOAD QUOTE */}

            {activeSection ===
              'Upload Quote Image' &&
              renderQuoteUpload()}

            {/* UPLOAD VIDEO */}

            {activeSection ===
              'Upload Video' &&
              renderVideoUpload()}

            {/* MANAGE MEMORIES */}

            {activeSection ===
              'Manage Memories' &&
              renderManageMedia({
                title:
                  'Manage Memories',

                subtitle:
                  'Edit or delete the memory photos uploaded to your vault.',

                items:
                  allMemoryItems,

                emptyText:
                  'No memory photos have been uploaded yet.',
              })}

            {/* MANAGE PHOTOS */}

            {activeSection ===
              'Manage Photos' &&
              renderManageMedia({
                title:
                  'Manage Photos',

                subtitle:
                  'Edit or delete the photos that belong to your dedicated Photos collection.',

                items:
                  photoItems,

                emptyText:
                  'No photos have been uploaded yet.',
              })}

            {/* MANAGE QUOTE IMAGES */}

            {activeSection ===
              'Manage Quote Images' &&
              renderManageMedia({
                title:
                  'Manage Quote Images',

                subtitle:
                  'Manage the quote images that will appear in the Little Words section.',

                items:
                  quoteItems,

                emptyText:
                  'No quote images have been uploaded yet.',
              })}

            {/* MANAGE VIDEOS */}

            {activeSection ===
              'Manage Videos' &&
              renderManageMedia({
                title:
                  'Manage Videos',

                subtitle:
                  'Edit or delete the videos uploaded to your vault.',

                items:
                  videoItems,

                emptyText:
                  'No videos have been uploaded yet.',
              })}

            {/* GUEST MESSAGES */}

            {activeSection ===
              'Guest Messages' && (
              <div
                className="
                  flex
                  min-h-[420px]
                  items-center
                  justify-center
                  rounded-[1.75rem]
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  p-8
                  text-center
                  shadow-sm
                "
              >

                <div className="max-w-md">

                  <div
                    className="
                      mx-auto
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[var(--accent-purple)]/20
                      bg-[var(--accent-purple)]/10
                      text-2xl
                      text-[var(--accent-purple)]
                    "
                  >
                    ✉
                  </div>

                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-purple)]">
                    Admin section
                  </p>

                  <h2 className="mt-3 font-serif text-3xl font-semibold text-[var(--text-h)]">
                    Guest Messages
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">
                    Guest message management will be
                    connected here.
                  </p>

                </div>

              </div>
            )}

          </section>
        </div>
      </div>

      {/* EDIT MODAL */}

      {renderEditModal()}

    </main>
  )
}

export default AdminDashboard