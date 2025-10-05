const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import routes
const spendRoutes = require('./routes/spends');
const uploadRoutes = require('./routes/upload');
const ocrRoutes = require('./routes/ocr'); // Add OCR routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files (for uploaded images)
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/spends', spendRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ocr', ocrRoutes); // Add OCR endpoint

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OCR service available at http://localhost:${PORT}/api/ocr/process`);
});