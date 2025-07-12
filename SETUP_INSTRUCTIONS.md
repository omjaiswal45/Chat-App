# Setup Instructions for Profile Update Functionality

## Backend Environment Configuration

To make the profile update functionality work properly, you need to set up environment variables in the backend.

### 1. Create a `.env` file in the backend directory

Create a file named `.env` in the `backend/` directory with the following content:

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chat-app

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=5001
```

### 2. Get Cloudinary Credentials

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/)
2. Go to your Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Replace the placeholder values in the `.env` file

### 3. Set up MongoDB

Make sure MongoDB is running on your system. If you don't have it installed:

- **Windows**: Download and install from [MongoDB website](https://www.mongodb.com/try/download/community)
- **macOS**: `brew install mongodb-community`
- **Linux**: Follow the [official installation guide](https://docs.mongodb.com/manual/installation/)

### 4. Start the Backend

```bash
cd backend
npm install
npm run dev
```

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

## Features Added/Fixed

### Profile Page Improvements:
- ✅ Better error handling for image uploads
- ✅ File size validation (max 5MB)
- ✅ File type validation (images only)
- ✅ Loading states with spinner
- ✅ Error messages with icons
- ✅ Proper null checks for user data
- ✅ Better date formatting for member since

### Backend Improvements:
- ✅ Enhanced error handling for Cloudinary uploads
- ✅ Image optimization (400x400, auto quality)
- ✅ Proper validation of base64 image data
- ✅ Better error messages for different scenarios
- ✅ Secure user data selection (excludes password)

### Auth Store Improvements:
- ✅ Detailed error handling for different HTTP status codes
- ✅ Network error detection
- ✅ Better user feedback through toast notifications

## Troubleshooting

### If profile updates don't work:

1. **Check environment variables**: Make sure all Cloudinary credentials are set correctly
2. **Check MongoDB**: Ensure MongoDB is running and accessible
3. **Check network**: Verify the frontend can connect to the backend (port 5001)
4. **Check console**: Look for error messages in both frontend and backend console

### Common Issues:

- **"Unauthorized" errors**: Make sure you're logged in
- **"Network error"**: Check if backend is running on port 5001
- **"Image file is too large"**: Choose a smaller image (under 5MB)
- **"Invalid image format"**: Make sure you're selecting an image file

## Security Notes

- Change the JWT_SECRET to a strong, unique value in production
- Never commit the `.env` file to version control
- Use environment-specific configurations for different deployment environments 