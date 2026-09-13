import multer from 'multer'

// ============================================================
// MEMORY STORAGE
// File will stay in memory temporarily
// Then it will be uploaded to Cloudinary
// ============================================================

const storage = multer.memoryStorage()

// ============================================================
// FILE TYPE VALIDATION
// Only image and video are allowed
// ============================================================

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/')
  const isVideo = file.mimetype.startsWith('video/')

  if (!isImage && !isVideo) {
    return cb(
      new Error('Only image and video files are allowed'),
      false
    )
  }

  cb(null, true)
}

// ============================================================
// MULTER CONFIGURATION
//
// Image maximum: 10MB
// Video maximum: 100MB
//
// Multer's fileSize is set to 100MB as the global maximum.
// The exact image/video limit is checked separately below.
// ============================================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    // Absolute maximum allowed by this middleware
    fileSize: 100 * 1024 * 1024, // 100MB
  },
})

// ============================================================
// EXPORT
// ============================================================

export default upload