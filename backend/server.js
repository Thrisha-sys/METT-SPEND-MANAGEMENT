const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes 
const spendsRoutes = require('./routes/spends');
const uploadRoutes = require('./routes/upload');
const reportsRoutes = require('./routes/reports');

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Mett Backend API is running!', 
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'API endpoint working correctly',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes 
app.use('/api/spends', spendsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});