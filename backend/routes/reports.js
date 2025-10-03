const express = require('express');
const router = express.Router();
const { spends } = require('../data/spends');

// GET /api/reports/summary - Get spending summary
router.get('/summary', (req, res) => {
  try {
    const { from, to, category } = req.query;
    
    let filteredSpends = [...spends];
    
    // Filter by date range if provided
    if (from) {
      filteredSpends = filteredSpends.filter(spend => spend.date >= from);
    }
    if (to) {
      filteredSpends = filteredSpends.filter(spend => spend.date <= to);
    }
    
    // Filter by category if provided
    if (category && category !== 'all') {
      filteredSpends = filteredSpends.filter(spend => 
        spend.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Calculate summary statistics
    const totalAmount = filteredSpends.reduce((sum, spend) => sum + spend.amount, 0);
    const averageAmount = filteredSpends.length > 0 ? totalAmount / filteredSpends.length : 0;
    
    // Group by category
    const categoryBreakdown = filteredSpends.reduce((acc, spend) => {
      const cat = spend.category;
      if (!acc[cat]) {
        acc[cat] = { count: 0, total: 0 };
      }
      acc[cat].count++;
      acc[cat].total += spend.amount;
      return acc;
    }, {});
    
    // Convert to array format for easier frontend consumption
    const categoryData = Object.keys(categoryBreakdown).map(category => ({
      category,
      count: categoryBreakdown[category].count,
      total: parseFloat(categoryBreakdown[category].total.toFixed(2)),
      average: parseFloat((categoryBreakdown[category].total / categoryBreakdown[category].count).toFixed(2))
    }));
    
    res.json({
      success: true,
      data: {
        summary: {
          totalSpends: filteredSpends.length,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          averageAmount: parseFloat(averageAmount.toFixed(2)),
          dateRange: {
            from: from || null,
            to: to || null
          },
          categoryFilter: category || 'all'
        },
        categoryBreakdown: categoryData,
        recentSpends: filteredSpends
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5) // Last 5 spends
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
});

// GET /api/reports/categories - Get category-wise data
router.get('/categories', (req, res) => {
  try {
    const categoryStats = spends.reduce((acc, spend) => {
      const cat = spend.category;
      if (!acc[cat]) {
        acc[cat] = {
          category: cat,
          count: 0,
          total: 0,
          spends: []
        };
      }
      acc[cat].count++;
      acc[cat].total += spend.amount;
      acc[cat].spends.push(spend);
      return acc;
    }, {});
    
    // Convert to array and add calculated fields
    const categoryData = Object.values(categoryStats).map(cat => ({
      ...cat,
      total: parseFloat(cat.total.toFixed(2)),
      average: parseFloat((cat.total / cat.count).toFixed(2)),
      percentage: parseFloat(((cat.total / spends.reduce((sum, s) => sum + s.amount, 0)) * 100).toFixed(1))
    }));
    
    res.json({
      success: true,
      data: categoryData.sort((a, b) => b.total - a.total) // Sort by total amount descending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category data',
      error: error.message
    });
  }
});

module.exports = router;