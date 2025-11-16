# Quick Setup Guide

## Step 1: Install Dependencies

Run this command to install all dependencies for both frontend and backend:

```bash
npm run install-all
```

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

**To get a Gemini API key:**
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

**Important:** 
- The Gemini API key is free to get
- You get 60 requests per minute free tier
- For production use, you may want to set up billing in Google Cloud Console

## Step 3: Start the Application

Run this command to start both frontend and backend servers:

```bash
npm run dev
```

This will start:
- **Frontend** (React) on http://localhost:3000
- **Backend** (Express) on http://localhost:3001

## Step 4: Use the Application

1. Open your browser and go to http://localhost:3000
2. Click on "📸 Upload Waste" tab
3. Take a photo or upload an image of food waste
4. The AI will analyze and identify the wasted food items
5. View analytics, history, and AI suggestions in other tabs

## Troubleshooting

### Port Already in Use
If port 3000 or 3001 is already in use, you can:
- Kill the process using those ports
- Or modify the ports in:
  - `server/index.js` (for backend)
  - `client/vite.config.js` (for frontend)

### Gemini API Errors
- Make sure your API key is correct
- Ensure you haven't exceeded the free tier quota (60 requests/min)
- If you need more quota, set up billing in Google Cloud Console
- Make sure the Generative AI API is enabled in your Google Cloud project

### Database Issues
The database is automatically created in the `data/` directory. Make sure the application has write permissions.

### Image Upload Issues
- Make sure images are under 10MB
- Supported formats: JPG, PNG, JPEG
- Check that the `uploads/` directory is created (auto-created on first run)






