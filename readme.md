# Mett Expense Tracker

A full-stack expense tracking application with multi-currency support, receipt management, and advanced search capabilities. Built with React, Node.js, and Express.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.2.0-blue)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Implementation Journey](#implementation-journey)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Future Enhancements](#future-enhancements)

---

## ✨ Features

### Core Functionality
- **Expense Management**: Add, edit, delete, and view expenses with full CRUD operations
- **Receipt Attachments**: Upload, view, and download receipt images and PDFs
- **Advanced Search**: Multi-parameter filtering with fuzzy search across all expense fields
- **Unique Record IDs**: Auto-generated tracking IDs (format: `EXP-XXXXX-XXXX`)
- **48-Hour Edit Lock**: Automatic record locking after 48 hours for data integrity

### Multi-Currency Support
- **12 Currencies Supported**: USD, EUR, GBP, JPY, CNY, INR, AUD, CAD, SGD, HKD, MYR, CHF
- **Regional Formatting**: Automatic number formatting based on selected currency
- **Real-time Currency Switching**: Updates all displays instantly without page refresh

### Date & Time
- **6 Date Formats**: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, MMM DD YYYY, DD MMM YYYY
- **Timezone Support**: 13 countries with auto-selection of regional defaults
- **Global Format Application**: Consistent date display across all components

### Receipt Processing
- **Single Receipt Scan**: Upload individual receipts with OCR placeholders
- **Bulk Upload**: Process up to 10 receipts simultaneously
- **Multi-receipt Workflow**: Navigate between receipts with Previous/Next buttons
- **Progress Tracking**: Visual indicators for completion status

### Reports & Analytics
- **Dashboard Statistics**: Total spent, average amount, expense count
- **Rolling 12-Month Chart**: Visual spending trends with currency-aware Y-axis
- **Date Range Filtering**: Custom date range selection for reports
- **CSV Export**: Export filtered expenses with all metadata

### User Settings
- **Profile Management**: Name, email, phone number
- **Account Settings**: Country, timezone, currency, date format preferences
- **Persistent Storage**: Settings saved to localStorage
- **Auto-defaults**: Regional settings auto-populate based on country selection

---

## 🛠 Tech Stack

### Frontend
- **React 18.2.0**: UI framework
- **React Router 6**: Navigation and routing
- **Ant Design 5.x**: UI component library
- **Chart.js 4.x**: Data visualization
- **Moment.js**: Date manipulation
- **Axios**: HTTP client

### Backend
- **Node.js 14+**: Runtime environment
- **Express 4.x**: Web framework
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing
- **JSON File Storage**: Persistent data storage

### Development Tools
- **Git**: Version control
- **npm**: Package management
- **VS Code**: Recommended IDE

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/expense-tracker.git
cd expense-tracker
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Create Required Directories**
```bash
# From project root
mkdir -p backend/uploads
mkdir -p backend/data
```

5. **Initialize Data File**
```bash
# Create empty expenses.json
echo '[]' > backend/data/expenses.json
```

### Running the Application

1. **Start Backend Server**
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

2. **Start Frontend Development Server** (in new terminal)
```bash
cd frontend
npm start
# Application opens at http://localhost:3000
```

### First Time Setup

1. Navigate to **Profile → Account Settings**
2. Select your **Country** (e.g., Malaysia)
3. Settings auto-populate with regional defaults:
   - Timezone: Asia/Kuala_Lumpur
   - Currency: MYR (Malaysian Ringgit)
   - Date Format: DD/MM/YYYY
4. Click **Save Settings**
5. Start adding expenses!

---

## 📁 Project Structure

```
expense-tracker/
├── backend/
│   ├── data/
│   │   ├── expenses.json          # Persistent expense storage
│   │   └── spends.js               # Data access layer
│   ├── routes/
│   │   └── spends.js               # API routes
│   ├── uploads/                    # Receipt file storage
│   ├── server.js                   # Express server entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── mett-logo.png          # Application logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js        # Main dashboard with chart
│   │   │   ├── AddExpenseForm.js   # Single expense form
│   │   │   ├── ExpenseList.js      # Manage expenses (edit/delete)
│   │   │   ├── Reports.js          # Reports with filtering
│   │   │   ├── ScanReceipt.js      # Single receipt upload
│   │   │   ├── BulkUpload.js       # Multiple receipt workflow
│   │   │   ├── ProfileSettings.js  # User profile management
│   │   │   ├── AccountSettings.js  # Regional settings
│   │   │   ├── AdvancedSearch.js   # Search modal
│   │   │   └── Upload.js           # Legacy upload component
│   │   ├── context/
│   │   │   └── SettingsContext.js  # Global settings provider
│   │   ├── services/
│   │   │   └── api.js              # API service layer
│   │   ├── App.js                  # Main app component
│   │   ├── App.css                 # Global styles
│   │   └── index.js                # React entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 📖 Implementation Journey

### Phase A: UI/Layout Fixes ✅
- Centered and enlarged Mett logo
- Fixed chart Y-axis to show proper currency scale (RM1K, RM2K)
- Implemented rolling 12-month display
- Limited dashboard to 10 recent expenses
- Removed gray backgrounds for clean white theme
- Improved table column alignment
- Spread out Add Expense form with grid layout

### Phase B: Profile & Settings ✅
- Created Profile Settings page (Name, Email, Phone)
- Built Account Settings with 13 countries including Malaysia
- Implemented 12 currencies with proper regional formatting
- Added 6 date format options
- Applied settings globally across all components
- Auto-selection of timezone/currency based on country
- Persistent storage with localStorage

### Phase C: Navigation & Organization ✅
- Renamed "All Expenses" → "Manage Expenses"
- Renamed "Upload Receipt" → "Bulk Upload"
- Added new "Scan Receipt" tab for single uploads
- Added helper text explaining bulk upload workflow
- Improved sidebar navigation with collapse/expand animation

### Phase D: Enhanced Receipt Upload ✅
- Multi-receipt selection (up to 10 files)
- Receipt processing dialog with Previous/Next navigation
- Progress dots showing completion status
- OCR simulation placeholders for future integration
- Image preview functionality
- Batch save all expenses

### Phase E: Record Management ✅
- Unique Record ID generation (EXP-XXXXX-XXXX format)
- 48-hour edit lock implementation
- Visual lock indicators in tables
- Record IDs displayed in all relevant views
- Edit restrictions with tooltip explanations

### Additional Features Implemented ✅
- Advanced Search with multi-parameter filtering
- Fuzzy search in top navigation
- File attachment system (images and PDFs)
- View/Download functionality
- CSV export with all metadata
- Delete functionality with confirmation
- Real-time currency/date format updates

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Get All Expenses
```http
GET /spends
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "recordId": "EXP-LQ3M8K-A4B2",
      "date": "2025-09-25",
      "vendor": "Electric Company",
      "category": "Bills",
      "amount": 100,
      "notes": "Monthly bill",
      "files": ["receipt_1727251234567.jpg"],
      "createdAt": "2025-09-25T10:30:00.000Z"
    }
  ]
}
```

#### Create Expense
```http
POST /spends
Content-Type: multipart/form-data
```
**Body:**
- `date`: YYYY-MM-DD
- `vendor`: String
- `category`: String
- `amount`: Number
- `notes`: String (optional)
- `files[]`: File uploads (optional, multiple)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "recordId": "EXP-MN4P9L-C5D3",
    "message": "Expense created successfully"
  }
}
```

#### Update Expense
```http
PUT /spends/:id
Content-Type: multipart/form-data
```
**Note:** Returns 403 if record is locked (>48 hours old)

#### Delete Expense
```http
DELETE /spends/:id
```
**Response:**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

#### Upload Files
```http
POST /upload
Content-Type: multipart/form-data
```
**Body:**
- `files[]`: Multiple file uploads (max 10)

**Response:**
```json
{
  "success": true,
  "files": ["receipt_1727251234567.jpg", "invoice_1727251234568.pdf"]
}
```

---

## ⚙️ Configuration

### Settings Context (SettingsContext.js)

**Supported Currencies:**
```javascript
USD, EUR, GBP, JPY, CNY, INR, AUD, CAD, SGD, HKD, MYR, CHF
```

**Supported Date Formats:**
```javascript
'MM/DD/YYYY'    // 12/31/2025
'DD/MM/YYYY'    // 31/12/2025
'YYYY-MM-DD'    // 2025-12-31
'DD-MM-YYYY'    // 31-12-2025
'MMM DD, YYYY'  // Dec 31, 2025
'DD MMM YYYY'   // 31 Dec 2025
```

**Supported Countries:**
```javascript
United States, United Kingdom, Canada, Australia, Singapore,
Hong Kong, Japan, China, India, Switzerland, Eurozone, Malaysia
```

### Environment Variables (Optional)

Create `.env` file in backend directory:
```env
PORT=5000
UPLOAD_DIR=./uploads
DATA_DIR=./data
```

---

## 🔮 Future Enhancements

### Planned Features

1. **PaddleOCR Integration**
   - Research in progress
   - Automatic receipt data extraction
   - Vendor name, amount, and date detection
   - Multilingual support (English, Malay, Chinese)
   - Estimated accuracy: 85-90%

2. **Authentication System**
   - User registration and login
   - JWT token-based authentication
   - Multi-user support

3. **Database Migration**
   - Move from JSON to PostgreSQL/MongoDB
   - Better performance for large datasets
   - Advanced querying capabilities

4. **Budget Management**
   - Set monthly budgets by category
   - Budget alerts and notifications
   - Spending insights and trends

5. **Mobile Application**
   - React Native mobile app
   - Camera integration for receipt capture
   - Push notifications

6. **Export Enhancements**
   - Excel export with formatting
   - PDF report generation
   - Email export functionality

7. **Advanced Analytics**
   - Category breakdown pie charts
   - Year-over-year comparisons
   - Spending predictions

---

## 🐛 Known Issues

- Date picker in Add Expense may show YYYY-MM-DD format temporarily until selection is made
- Very large files (>5MB) may take time to upload
- CSV export maintains raw values (good for data portability)

---

## 📝 Testing Checklist

### Basic Functionality
- [ ] Add new expense with all fields
- [ ] Upload receipt attachment (image/PDF)
- [ ] Edit existing expense (within 48 hours)
- [ ] Delete expense with confirmation
- [ ] View expense in Dashboard, Manage Expenses, Reports

### Settings
- [ ] Change currency and verify updates across all pages
- [ ] Change date format and verify consistency
- [ ] Select different country and check auto-population
- [ ] Refresh browser and verify settings persist

### Receipt Management
- [ ] Scan single receipt with preview
- [ ] Bulk upload multiple receipts (2-10 files)
- [ ] Navigate between receipts in bulk workflow
- [ ] Save all expenses from bulk upload

### Search & Filter
- [ ] Use fuzzy search in top navigation
- [ ] Apply advanced filters (date range, category, amount)
- [ ] Clear filters and reset view
- [ ] Export filtered results to CSV

### Record Management
- [ ] Verify new expenses have Record IDs
- [ ] Check 48-hour lock on old expenses
- [ ] Confirm locked records show lock icon
- [ ] Verify CSV export includes Record IDs

---

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Ant Design for the beautiful UI components
- Chart.js for data visualization
- Baidu PaddleOCR for future OCR capabilities
- React and Node.js communities

---

## 📧 Contact

- Thrisha D

