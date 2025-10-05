// backend/routes/ocr.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `ocr-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Function to process image with PaddleOCR
const processWithPaddleOCR = (imagePath) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../scripts');
    
    // Ensure scripts directory exists
    if (!fs.existsSync(scriptPath)) {
      fs.mkdirSync(scriptPath, { recursive: true });
    }

    const options = {
      mode: 'json',
      pythonPath: 'python', // or 'python3' depending on your system
      scriptPath: scriptPath,
      args: [imagePath]
    };

    PythonShell.run('paddle_ocr.py', options, (err, results) => {
      if (err) {
        console.error('PaddleOCR Error:', err);
        reject(err);
      } else if (results && results.length > 0) {
        try {
          const result = results[0];
          resolve(result);
        } catch (parseError) {
          console.error('Error parsing PaddleOCR result:', parseError);
          reject(parseError);
        }
      } else {
        reject(new Error('No results from PaddleOCR'));
      }
    });
  });
};

// Fallback function for basic text parsing (if PaddleOCR fails)
function parseReceiptTextBasic(text) {
  let vendor = 'Unknown Vendor';
  let amount = 0;
  let date = new Date().toISOString().split('T')[0];
  let category = 'Other';

  // Try to extract vendor
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    vendor = lines[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
  }

  // Try to extract amount
  const amountMatch = text.match(/\d+\.\d{2}/g);
  if (amountMatch) {
    const amounts = amountMatch.map(a => parseFloat(a));
    amount = Math.max(...amounts);
  }

  // Determine category
  const lowerText = text.toLowerCase();
  if (lowerText.includes('restaurant') || lowerText.includes('food')) {
    category = 'Food';
  }

  return { vendor, amount, date, category };
}

// OCR processing endpoint
router.post('/process', upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image file provided'
    });
  }

  try {
    console.log('Processing OCR for file:', req.file.filename);
    console.log('File path:', req.file.path);
    
    let result;
    
    try {
      // Try PaddleOCR first
      console.log('Attempting PaddleOCR processing...');
      result = await processWithPaddleOCR(req.file.path);
      console.log('PaddleOCR successful:', result);
    } catch (paddleError) {
      console.error('PaddleOCR failed, falling back to Tesseract:', paddleError.message);
      
      // Fallback to Tesseract if PaddleOCR fails
      try {
        const Tesseract = require('tesseract.js');
        const tesseractResult = await Tesseract.recognize(
          req.file.path,
          'eng',
          {
            logger: m => console.log(`Tesseract Progress: ${JSON.stringify(m)}`)
          }
        );
        
        const extractedText = tesseractResult.data.text;
        result = parseReceiptTextBasic(extractedText);
        result.rawText = extractedText;
        result.confidence = tesseractResult.data.confidence;
      } catch (tesseractError) {
        console.error('Both OCR methods failed:', tesseractError);
        throw new Error('OCR processing failed');
      }
    }
    
    // Clean up temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process image with OCR'
    });
  }
});

module.exports = router;