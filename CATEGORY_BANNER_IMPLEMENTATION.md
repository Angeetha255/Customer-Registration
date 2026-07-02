# Category Banner Image Implementation

## Overview
This implementation adds banner image support to the Category Management module, allowing admins to upload, preview, and manage category banner images.

## Features Implemented

### Backend
1. **Database Migration**: Added `banner_image` column to the `categories` table
2. **Model Update**: Category model now includes `bannerImage` field
3. **File Upload Utility**: Created `utils/imageUpload.js` with:
   - Multer configuration for secure file uploads
   - Image validation (JPG, JPEG, PNG, WEBP)
   - File size validation (max 5MB)
   - Automatic file naming with timestamps
   - Old banner cleanup functionality
4. **API Routes Updated**:
   - `POST /api/master-data/categories` - Create category with banner
   - `PUT /api/master-data/categories/:id` - Update category with banner
   - Banner removal support
   - All category API responses include `bannerImage` field

### Frontend
1. **MasterCategories.jsx Enhanced**:
   - Banner image upload input with file type validation
   - Image preview before saving
   - Display banner in category list (80x50px thumbnail)
   - Remove banner functionality
   - Show "No banner" placeholder for categories without banners
   - FormData-based multipart upload

## File Structure

```
Customer-Registration/
├── migrations/
│   └── migrate-add-category-banner.sql    # Database migration
├── models/
│   └── Category.js                         # Updated with bannerImage field
├── utils/
│   └── imageUpload.js                      # File upload utilities
├── routes/
│   └── masterData.js                       # Updated category routes
└── src/pages/
    └── MasterCategories.jsx                # Enhanced with banner features
```

## Installation & Setup

### 1. Run Database Migration

Execute the migration to add the banner_image column:

```bash
# Using the migration script
node scripts/run-migration.js migrations/migrate-add-category-banner.sql

# Or manually run the SQL:
mysql -u your_username -p your_database < migrations/migrate-add-category-banner.sql
```

The migration will:
- Add `banner_image` VARCHAR(500) NULL column to categories table
- Create an index for better query performance

### 2. Install Dependencies

Multer has already been installed:
```bash
npm install multer
```

### 3. Start the Server

```bash
npm run server
# or
npm run dev  # for development with hot reload
```

## Usage

### Creating a Category with Banner

1. Navigate to Categories page in admin panel
2. Click "Add Category"
3. Fill in category name
4. Click "Choose File" to select a banner image
5. Image preview will appear automatically
6. Click "Add" to save

**Validation:**
- Allowed formats: JPG, JPEG, PNG, WEBP
- Maximum file size: 5MB
- Invalid files will show error message

### Editing a Category Banner

1. Click "Edit" on any category
2. Current banner (if exists) will be displayed
3. Options:
   - Select new file to replace banner
   - Click "Remove Banner" to delete existing banner
   - Leave as-is to keep current banner
4. Click "Update" to save changes

### Viewing Banners

In the categories list:
- Categories with banners show a thumbnail (80x50px)
- Categories without banners show "No banner" text
- Banner URL is included in API responses for website consumption

## API Response Format

### Category Object
```json
{
  "id": 1,
  "categoryName": "Electronics",
  "status": "active",
  "bannerImage": "/uploads/categories/category-banner-1234567890-123456789.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### No Banner Case
```json
{
  "id": 2,
  "categoryName": "Clothing",
  "status": "active",
  "bannerImage": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Security Features

1. **File Type Validation**: Only allows image files (JPG, JPEG, PNG, WEBP)
2. **File Size Limit**: Maximum 5MB per image
3. **Secure Filenames**: Generated with timestamp and random number to prevent conflicts
4. **Path Traversal Protection**: Uses path.basename() to extract safe filenames
5. **Old File Cleanup**: Automatically deletes old banners when replaced
6. **Authentication**: All routes protected by authMiddleware

## Storage

- **Location**: `uploads/categories/` directory
- **Naming**: `category-banner-{timestamp}-{random}.{ext}`
- **Access**: Via `/uploads/categories/{filename}` URL
- **Cleanup**: Old banners deleted when replaced or category deleted

## Browser Compatibility

- Modern browsers with FormData support
- FileReader API for image preview
- Accept attribute for file input filtering

## Troubleshooting

### Migration Fails
- Ensure MySQL is running
- Check database credentials in .env
- Verify categories table exists

### Upload Fails
- Check uploads/categories/ directory exists and is writable
- Verify file size is under 5MB
- Ensure file type is JPG, JPEG, PNG, or WEBP

### Images Not Displaying
- Verify server is serving /uploads route (configured in server.js)
- Check file permissions on uploads directory
- Ensure banner_image column exists in database

## Production Considerations

1. **Storage**: Consider using cloud storage (S3, Cloudinary) for production
2. **CDN**: Use CDN for faster image delivery
3. **Image Optimization**: Implement image compression and resizing
4. **Backup**: Regular backups of uploads/categories directory
5. **Cleanup**: Implement periodic cleanup of unused images

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Can create category without banner
- [ ] Can create category with valid banner (JPG, PNG, WEBP)
- [ ] File type validation works (rejects invalid types)
- [ ] File size validation works (rejects >5MB)
- [ ] Image preview displays correctly
- [ ] Can edit category and replace banner
- [ ] Can remove banner from category
- [ ] Banner displays in category list
- [ ] Categories without banner show "No banner"
- [ ] API responses include bannerImage field
- [ ] bannerImage is null when no banner exists
- [ ] Old banner deleted when replaced
- [ ] Status toggle still works
- [ ] Delete category still works
- [ ] Search functionality still works
- [ ] Pagination still works

## Notes

- No separate Ads table or Ads API created (as per requirements)
- Reuses existing Category module and APIs
- Backward compatible - existing categories work without banners
- Clean, production-ready implementation
- No breaking changes to existing functionality