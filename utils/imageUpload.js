import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'categories')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for category banner images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `category-banner-${uniqueSuffix}${ext}`)
  }
})

// File filter - only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'), false)
  }
}

// Configure multer upload for single file
export const uploadCategoryBanner = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Configure multer upload for multiple files
export const uploadCategoryBanners = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 banner images
  }
})

// Validate image file
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum size is 5MB.' }
  }

  return { valid: true }
}

// Delete old banner image
export const deleteOldBanner = (bannerPath) => {
  if (!bannerPath) return false
  
  try {
    // Extract filename from path
    const filename = path.basename(bannerPath)
    const fullPath = path.join(uploadsDir, filename)
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      return true
    }
  } catch (error) {
    console.error('Error deleting old banner:', error)
  }
  
  return false
}

// Get banner URL from filename
export const getBannerUrl = (filename) => {
  if (!filename) return null
  return `/uploads/categories/${filename}`
}