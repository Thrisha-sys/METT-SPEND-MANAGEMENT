const fs = require('fs');
const path = require('path');

// File to store expenses persistently
const dataFile = path.join(__dirname, 'expenses.json');

// Load expenses from file - start empty if no file exists
function loadExpenses() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      const loaded = JSON.parse(data);
      console.log(`Loaded ${loaded.length} expenses from file`);
      return loaded;
    } else {
      console.log('No expenses file found, starting with empty list');
      // Create empty file
      fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
      return [];
    }
  } catch (error) {
    console.error('Error loading expenses:', error);
    // Start with empty array on error
    return [];
  }
}

// Initialize spends - will be empty on first run
let spends = loadExpenses();

// Save expenses to file
function saveExpenses() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(spends, null, 2));
    console.log(`✅ Saved ${spends.length} expenses to file`);
    return true;
  } catch (error) {
    console.error('❌ Error saving expenses:', error);
    return false;
  }
}

// Get next ID
function getNextId() {
  if (spends.length === 0) return 1;
  const maxId = Math.max(...spends.map(s => s.id));
  return maxId + 1;
}

// Delete expense - hard delete
function deleteExpense(id) {
  console.log(`🗑️ Attempting to delete expense ID: ${id}`);
  const initialLength = spends.length;
  
  const index = spends.findIndex(s => s.id === id);
  
  if (index === -1) {
    console.log(`❌ Expense with ID ${id} not found`);
    return null;
  }
  
  // Get the expense to return
  const deleted = spends[index];
  
  // Remove from array (hard delete)
  spends.splice(index, 1);
  
  console.log(`✅ Removed expense: ${deleted.vendor} (ID: ${id})`);
  console.log(`📊 Count: ${initialLength} → ${spends.length}`);
  
  // Save to file immediately
  const saved = saveExpenses();
  
  if (!saved) {
    // If save failed, restore the item
    console.error('❌ Save failed, restoring expense');
    spends.splice(index, 0, deleted);
    return null;
  }
  
  return deleted;
}

// Export
module.exports = {
  spends,
  getNextId,
  saveExpenses,
  deleteExpense
};