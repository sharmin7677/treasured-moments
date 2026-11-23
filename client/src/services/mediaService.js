import { getIdToken } from 'firebase/auth'

// ============================================================
// API CONFIG
// ============================================================

const API_URL = 'https://treasured-moments.vercel.app'

// ============================================================
// GET AUTH TOKEN
//
// Centralized Firebase token handling.
// Every protected media request uses this helper.
// ============================================================

const getAuthHeaders = async (user) => {
  if (!user) {
    throw new Error('User is not authenticated')
  }

  const token = await getIdToken(user)

  return {
    Authorization: `Bearer ${token}`,
  }
}

// ============================================================
// HANDLE API RESPONSE
// ============================================================

const handleResponse = async (response) => {
  let data = {}

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Something went wrong while communicating with the media server.'
    )
  }

  return data
}

// ============================================================
// GET ALL MEDIA
//
// GET /api/media
//
// Returns:
// - memory
// - quote
// - video
//
// Backend already sorts newest first.
// ============================================================

const getAllMedia = async (user) => {
  const headers = await getAuthHeaders(user)

  const response = await fetch(
    `${API_URL}/api/media`,
    {
      method: 'GET',
      headers,
    }
  )

  return handleResponse(response)
}

// ============================================================
// GET MEDIA BY RESOURCE TYPE
//
// GET /api/media/type/image
// GET /api/media/type/video
//
// resourceType:
// - image
// - video
//
// NOTE:
// image includes both memory and quote images.
// ============================================================

const getMediaByType = async (
  user,
  resourceType
) => {
  if (
    resourceType !== 'image' &&
    resourceType !== 'video'
  ) {
    throw new Error(
      'Resource type must be image or video.'
    )
  }

  const headers = await getAuthHeaders(user)

  const response = await fetch(
    `${API_URL}/api/media/type/${encodeURIComponent(
      resourceType
    )}`,
    {
      method: 'GET',
      headers,
    }
  )

  return handleResponse(response)
}

// ============================================================
// GET MEDIA BY MEDIA TYPE / CATEGORY
//
// GET /api/media/category/memory
// GET /api/media/category/quote
// GET /api/media/category/video
//
// This is the MAIN function we will use for:
//
// MemoryPreview
// Memory Page
// Quote Photo section
// Quote Photo Page
// Video section
// Video Page
// ============================================================

const getMediaByMediaType = async (
  user,
  mediaType
) => {
  const allowedMediaTypes = [
    'memory',
    'quote',
    'video',
  ]

  const normalizedMediaType =
    typeof mediaType === 'string'
      ? mediaType.trim().toLowerCase()
      : ''

  if (
    !allowedMediaTypes.includes(
      normalizedMediaType
    )
  ) {
    throw new Error(
      'Media type must be memory, quote, or video.'
    )
  }

  const headers = await getAuthHeaders(user)

  const response = await fetch(
    `${API_URL}/api/media/category/${encodeURIComponent(
      normalizedMediaType
    )}`,
    {
      method: 'GET',
      headers,
    }
  )

  return handleResponse(response)
}

// ============================================================
// GET ALL MEMORIES
//
// Convenience helper.
//
// Internally uses:
// getMediaByMediaType(user, 'memory')
//
// Returns the backend response:
// {
//   success: true,
//   count: ...,
//   mediaType: 'memory',
//   data: [...]
// }
// ============================================================

const getMemories = async (user) => {
  return getMediaByMediaType(
    user,
    'memory'
  )
}

// ============================================================
// GET ALL QUOTE PHOTOS
//
// Convenience helper.
// ============================================================

const getQuotePhotos = async (user) => {
  return getMediaByMediaType(
    user,
    'quote'
  )
}

// ============================================================
// GET ALL VIDEOS
//
// Convenience helper.
// ============================================================

const getVideos = async (user) => {
  return getMediaByMediaType(
    user,
    'video'
  )
}

// ============================================================
// UPLOAD MEDIA
//
// POST /api/media/upload
//
// FormData should contain:
//
// media
// mediaType
// title
// description
//
// Admin authentication required.
// ============================================================

const uploadMedia = async (
  user,
  formData
) => {
  if (!formData) {
    throw new Error(
      'Media upload data is required.'
    )
  }

  const headers = await getAuthHeaders(user)

  // IMPORTANT:
  // Do NOT manually set Content-Type here.
  //
  // Browser automatically creates the correct
  // multipart/form-data boundary for FormData.
  const response = await fetch(
    `${API_URL}/api/media/upload`,
    {
      method: 'POST',
      headers,
      body: formData,
    }
  )

  return handleResponse(response)
}

// ============================================================
// UPDATE MEDIA
//
// PUT /api/media/:id
//
// Body:
// {
//   title,
//   description
// }
// ============================================================

const updateMedia = async (
  user,
  id,
  data
) => {
  if (!id) {
    throw new Error(
      'Media ID is required.'
    )
  }

  const headers = {
    ...(await getAuthHeaders(user)),
    'Content-Type': 'application/json',
  }

  const response = await fetch(
    `${API_URL}/api/media/${encodeURIComponent(
      id
    )}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title:
          typeof data?.title === 'string'
            ? data.title
            : undefined,

        description:
          typeof data?.description === 'string'
            ? data.description
            : undefined,
      }),
    }
  )

  return handleResponse(response)
}

// ============================================================
// DELETE MEDIA
//
// DELETE /api/media/:id
//
// Admin authentication required.
// ============================================================

const deleteMedia = async (
  user,
  id
) => {
  if (!id) {
    throw new Error(
      'Media ID is required.'
    )
  }

  const headers = await getAuthHeaders(user)

  const response = await fetch(
    `${API_URL}/api/media/${encodeURIComponent(
      id
    )}`,
    {
      method: 'DELETE',
      headers,
    }
  )

  return handleResponse(response)
}

// ============================================================
// EXPORT
// ============================================================

export {
  getAllMedia,
  getMediaByType,
  getMediaByMediaType,

  getMemories,
  getQuotePhotos,
  getVideos,

  uploadMedia,
  updateMedia,
  deleteMedia,
}

export default {
  getAllMedia,
  getMediaByType,
  getMediaByMediaType,

  getMemories,
  getQuotePhotos,
  getVideos,

  uploadMedia,
  updateMedia,
  deleteMedia,
}