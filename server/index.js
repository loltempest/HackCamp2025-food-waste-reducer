import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { analyzeFoodWaste } from './ai/vision.js';
import { initDatabase, logWaste, getWasteHistory, getWasteStats, getSuggestions } from './database/db.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Ensure uploads directory exists
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
if (!existsSync('uploads')) {
  mkdir('uploads', { recursive: true }).catch(err => {
    console.error('Error creating uploads directory:', err);
  });
}

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.post('/api/analyze-waste', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = req.file.path;
    const analysis = await analyzeFoodWaste(imagePath);

    // Log the waste entry
    const wasteEntry = await logWaste({
      imagePath: `/uploads/${req.file.filename}`,
      items: analysis.items || [],
      estimatedWaste: analysis.estimatedWaste || {},
      timestamp: new Date().toISOString(),
      notes: analysis.notes || ''
    });

    res.json({
      success: true,
      analysis,
      wasteEntry
    });
  } catch (error) {
    console.error('Error analyzing waste:', error);
    
    // Determine appropriate status code
    let statusCode = 500;
    if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('rate limit')) {
      statusCode = 429;
    } else if (error.message.includes('API key') || error.message.includes('API_KEY') || error.message.includes('401') || error.message.includes('403') || error.message.includes('PERMISSION_DENIED')) {
      statusCode = 401;
    } else if (error.message.includes('file not found') || error.message.includes('ENOENT')) {
      statusCode = 404;
    } else if (error.message.includes('400') || error.message.includes('INVALID_ARGUMENT')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      error: 'Failed to analyze waste',
      message: error.message || 'An unknown error occurred while analyzing the image'
    });
  }
});

app.get('/api/waste-history', async (req, res) => {
  try {
    const history = await getWasteHistory(req.query);
    res.json(history);
  } catch (error) {
    console.error('Error fetching waste history:', error);
    res.status(500).json({ error: 'Failed to fetch waste history' });
  }
});

app.get('/api/waste-stats', async (req, res) => {
  try {
    const stats = await getWasteStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching waste stats:', error);
    res.status(500).json({ error: 'Failed to fetch waste stats' });
  }
});

app.get('/api/suggestions', async (req, res) => {
  try {
    const suggestions = await getSuggestions();
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other process or change the PORT in .env`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
