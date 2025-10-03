const express = require('express');
const router = express.Router();
const { spends, getNextId, saveExpenses, deleteExpense } = require('../data/spends');

// Generate unique Record ID
const generateRecordId = () => {
  const prefix = 'EXP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// GET /api/spends - Fetch all spends
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: spends,
      count: spends.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching spends',
      error: error.message
    });
  }
});

// POST /api/spends - Add new spend
router.post('/', (req, res) => {
  try {
    const { amount, category, date, vendor, notes, attachments } = req.body;
    
    // Basic validation
    if (!amount || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'Amount, category, and date are required'
      });
    }
    
    // Create new spend with attachments and record ID
    const newSpend = {
      id: getNextId(),
      recordId: generateRecordId(), // Add unique record ID
      userId: 1, // Hardcoded for now, will use JWT later
      amount: parseFloat(amount),
      category,
      date,
      vendor: vendor || '',
      notes: notes || '',
      attachments: attachments || [], // Store file attachment info
      createdAt: new Date().toISOString() // Add timestamp for 48-hour lock
    };
    
    // Add to memory storage
    spends.push(newSpend);
    
    // Save to file
    saveExpenses();
    
    console.log(`✅ New expense created with Record ID: ${newSpend.recordId}`);
    
    res.status(201).json({
      success: true,
      message: 'Spend added successfully',
      data: newSpend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding spend',
      error: error.message
    });
  }
});

// PUT /api/spends/:id - Update spend
router.put('/:id', (req, res) => {
  try {
    const spendId = parseInt(req.params.id);
    const spendIndex = spends.findIndex(s => s.id === spendId);
    
    if (spendIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Spend not found'
      });
    }
    
    // Check if expense is locked (older than 48 hours)
    const expense = spends[spendIndex];
    if (expense.createdAt) {
      const hoursSinceCreation = (Date.now() - new Date(expense.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > 48) {
        return res.status(403).json({
          success: false,
          message: 'Cannot edit expense - locked after 48 hours'
        });
      }
    }
    
    // Update spend (preserve record ID and creation time)
    spends[spendIndex] = {
      ...spends[spendIndex],
      ...req.body,
      id: spendId, // Ensure ID doesn't change
      recordId: expense.recordId, // Preserve record ID
      createdAt: expense.createdAt // Preserve creation time
    };
    
    // Save to file
    saveExpenses();
    
    console.log(`✅ Updated expense ${expense.recordId}`);
    
    res.json({
      success: true,
      message: 'Spend updated successfully',
      data: spends[spendIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating spend',
      error: error.message
    });
  }
});

// DELETE /api/spends/:id - Hard delete expense
router.delete('/:id', (req, res) => {
  try {
    const spendId = parseInt(req.params.id);
    
    console.log(`\n🔥 DELETE request for ID: ${spendId}`);
    console.log(`📊 Current count: ${spends.length}`);
    
    // Find the expense to get its record ID for logging
    const expense = spends.find(s => s.id === spendId);
    const recordId = expense ? expense.recordId : 'N/A';
    
    // Use the deleteExpense function for hard delete
    const deleted = deleteExpense(spendId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    console.log(`✅ Delete successful - Record ID: ${recordId}`);
    console.log(`📊 New count: ${spends.length}\n`);
    
    res.json({
      success: true,
      message: 'Expense permanently deleted',
      deleted: deleted,
      remaining: spends.length
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense',
      error: error.message
    });
  }
});

// GET /api/spends/:id - Get single spend
router.get('/:id', (req, res) => {
  try {
    const spendId = parseInt(req.params.id);
    const spend = spends.find(s => s.id === spendId);
    
    if (!spend) {
      return res.status(404).json({
        success: false,
        message: 'Spend not found'
      });
    }
    
    res.json({
      success: true,
      data: spend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching spend',
      error: error.message
    });
  }
});

module.exports = router;