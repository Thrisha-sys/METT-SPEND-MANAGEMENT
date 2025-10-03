import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Image, Tooltip, Dropdown, Modal } from 'antd';
import { 
  DownloadOutlined,
  PaperClipOutlined, 
  FileImageOutlined, 
  FilePdfOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import apiService from '../services/api';
import moment from 'moment';
import { useSettings } from '../context/SettingsContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const Dashboard = ({ advancedFilters = {}, searchTerm = '' }) => {
  const [expenses, setExpenses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  
  // Use settings context for formatting
  const { formatCurrency, formatDateShort, getCurrencySymbol, settings } = useSettings();

  // Apply filters function
  const applyFilters = (data) => {
    let filtered = [...data];

    // Apply fuzzy search
    if (searchTerm) {
      filtered = filtered.filter(expense => {
        const searchLower = searchTerm.toLowerCase();
        return (
          expense.vendor?.toLowerCase().includes(searchLower) ||
          expense.category?.toLowerCase().includes(searchLower) ||
          expense.notes?.toLowerCase().includes(searchLower) ||
          expense.amount?.toString().includes(searchLower)
        );
      });
    }

    // Apply advanced filters
    // Vendor filter
    if (advancedFilters.vendor) {
      const { condition, value } = advancedFilters.vendor;
      filtered = filtered.filter(expense => {
        const vendorLower = (expense.vendor || '').toLowerCase();
        const valueLower = value.toLowerCase();
        
        switch(condition) {
          case 'contains': return vendorLower.includes(valueLower);
          case 'equals': return vendorLower === valueLower;
          case 'startsWith': return vendorLower.startsWith(valueLower);
          case 'endsWith': return vendorLower.endsWith(valueLower);
          case 'notEquals': return vendorLower !== valueLower;
          case 'notContains': return !vendorLower.includes(valueLower);
          default: return true;
        }
      });
    }

    // Category filter
    if (advancedFilters.category) {
      filtered = filtered.filter(expense => 
        advancedFilters.category.value.includes(expense.category)
      );
    }

    // Amount filter
    if (advancedFilters.amount) {
      const { condition, value, valueTo } = advancedFilters.amount;
      filtered = filtered.filter(expense => {
        switch(condition) {
          case 'equals': return expense.amount === value;
          case 'notEquals': return expense.amount !== value;
          case 'greaterThan': return expense.amount > value;
          case 'lessThan': return expense.amount < value;
          case 'between': return expense.amount >= value && expense.amount <= valueTo;
          default: return true;
        }
      });
    }

    // Date range filter
    if (advancedFilters.dateRange) {
      const { from, to } = advancedFilters.dateRange;
      filtered = filtered.filter(expense => {
        const expenseDate = moment(expense.date);
        return expenseDate.isBetween(from, to, 'day', '[]');
      });
    }

    // Notes filter
    if (advancedFilters.notes) {
      const { condition, value } = advancedFilters.notes;
      filtered = filtered.filter(expense => {
        const notesLower = (expense.notes || '').toLowerCase();
        const valueLower = value.toLowerCase();
        
        switch(condition) {
          case 'contains': return notesLower.includes(valueLower);
          case 'equals': return notesLower === valueLower;
          case 'startsWith': return notesLower.startsWith(valueLower);
          case 'endsWith': return notesLower.endsWith(valueLower);
          case 'notEquals': return notesLower !== valueLower;
          case 'notContains': return !notesLower.includes(valueLower);
          default: return true;
        }
      });
    }

    // Limit to 10 most recent expenses for dashboard view
    return filtered.slice(0, 10);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    const filtered = applyFilters(expenses);
    setFilteredData(filtered);
    // Reset selected rows when filters change
    setSelectedRows([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, advancedFilters, searchTerm]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSpends();
      // Sort by date descending (most recent first)
      const sortedData = response.data.data.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      const expenseData = sortedData.map(expense => ({
        ...expense,
        key: expense.id,
        formattedDate: formatDateShort(expense.date),
        formattedAmount: formatCurrency(expense.amount),
        // Always ensure attachments field exists as empty array if not present
        attachments: expense.attachments || null,
        // Add explicit files field for the column
        files: expense.attachments || expense.files || null
      }));
      setExpenses(expenseData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Re-fetch expenses when settings change
  useEffect(() => {
    fetchExpenses();
  }, [formatDateShort, formatCurrency]);

  const getMonthlyChartData = () => {
    // Generate last 12 months labels
    const last12Months = [];
    const monthlyTotals = {};
    
    for (let i = 11; i >= 0; i--) {
      const date = moment().subtract(i, 'months');
      const monthKey = date.format('MMM YYYY');
      last12Months.push(monthKey);
      monthlyTotals[monthKey] = 0; // Initialize with 0
    }
    
    // Sum ALL expenses by month (not just filtered)
    expenses.forEach(expense => {
      const expenseMonth = moment(expense.date).format('MMM YYYY');
      if (monthlyTotals.hasOwnProperty(expenseMonth)) {
        monthlyTotals[expenseMonth] += expense.amount;
      }
    });

    return {
      labels: last12Months,
      datasets: [{
        label: 'Monthly Spending',
        data: last12Months.map(month => monthlyTotals[month]),
        backgroundColor: '#666',
        borderColor: '#333',
        borderWidth: 1,
        barThickness: 'flex',
        maxBarThickness: 50
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatCurrency(context.raw);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (value >= 1000) {
              return getCurrencySymbol() + (value/1000).toFixed(1) + 'K';
            }
            return getCurrencySymbol() + value.toFixed(0);
          }
        },
        grid: {
          drawBorder: false,
          color: '#f0f0f0'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Column definitions
  const columns = [
    {
      title: 'Date',
      dataIndex: 'formattedDate',
      key: 'date',
      width: '15%',
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      width: '20%',
      sorter: (a, b) => (a.vendor || '').localeCompare(b.vendor || ''),
      render: (text) => text || '-'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '15%',
      sorter: (a, b) => a.category.localeCompare(b.category),
      render: (category) => (
        <Tag color="#f0f0f0" style={{ color: '#333', border: '1px solid #d9d9d9' }}>
          {category}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'formattedAmount',
      key: 'amount',
      width: '12%',
      sorter: (a, b) => a.amount - b.amount,
      render: (text) => (
        <span style={{ color: '#333', fontWeight: 'bold' }}>{text}</span>
      ),
    },
    {
      title: 'Files',
      key: 'files',
      width: '10%',
      align: 'center',
      render: (_, record) => {
        const attachments = record.attachments || [];
        if (attachments.length === 0) {
          return <span style={{ color: '#ccc' }}>-</span>;
        }
        return (
          <span style={{ 
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            color: '#333'
          }}>
            <PaperClipOutlined /> {attachments.length}
          </span>
        );
      }
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: '28%',
      ellipsis: true,
      render: (text) => text || '-'
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys) => {
      setSelectedRows(selectedRowKeys);
    },
  };

  const handleExport = () => {
    console.log('Exporting selected rows:', selectedRows);
    // Phase 5: Implement actual export functionality
  };

  // Display active filters summary
  const getActiveFiltersDisplay = () => {
    const filterCount = Object.keys(advancedFilters).length;
    const hasSearch = searchTerm !== '';
    
    if (filterCount === 0 && !hasSearch) return null;

    return (
      <div style={{ 
        marginBottom: '16px', 
        padding: '12px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '6px',
        border: '1px solid #e0e0e0'
      }}>
        <Space wrap>
          {hasSearch && (
            <Tag style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
              Search: "{searchTerm}"
            </Tag>
          )}
          {advancedFilters.vendor && (
            <Tag style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
              Vendor {advancedFilters.vendor.condition}: {advancedFilters.vendor.value}
            </Tag>
          )}
          {advancedFilters.category && (
            <Tag style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
              Categories: {advancedFilters.category.value.join(', ')}
            </Tag>
          )}
          {advancedFilters.amount && (
            <Tag style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
              Amount {advancedFilters.amount.condition}: {formatCurrency(advancedFilters.amount.value)}
              {advancedFilters.amount.valueTo && ` - ${formatCurrency(advancedFilters.amount.valueTo)}`}
            </Tag>
          )}
          {advancedFilters.dateRange && (
            <Tag style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
              Date: {advancedFilters.dateRange.from} to {advancedFilters.dateRange.to}
            </Tag>
          )}
          {advancedFilters.notes && (
            <Tag style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
              Notes {advancedFilters.notes.condition}: {advancedFilters.notes.value}
            </Tag>
          )}
        </Space>
      </div>
    );
  };

  // Calculate totals
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const averageAmount = expenses.length > 0 ? totalSpent / expenses.length : 0;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      {/* Currency Notice */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '6px',
        padding: '12px 16px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#856404'
      }}>
        <strong>💡 Tip:</strong> This expense tracker displays all amounts in your selected currency (currently {settings.currency}). 
        No automatic currency conversion is applied. If you paid in a foreign currency, please enter the converted amount 
        as shown on your bank statement.
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#000', fontSize: '28px' }}>Dashboard</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              Manage and track all your expenses
              {(Object.keys(advancedFilters).length > 0 || searchTerm) && 
                <span style={{ color: '#000', fontWeight: '500' }}>
                  {' '}• Filtered Results ({filteredData.length} of {Math.min(expenses.length, 10)})
                </span>
              }
            </div>
          </div>
          <Button 
            icon={<DownloadOutlined />} 
            disabled={selectedRows.length === 0}
            onClick={handleExport}
            style={{
              backgroundColor: selectedRows.length > 0 ? '#333' : undefined,
              borderColor: selectedRows.length > 0 ? '#333' : undefined,
              color: selectedRows.length > 0 ? '#fff' : undefined,
            }}
          >
            Export Selected ({selectedRows.length})
          </Button>
        </div>

        {/* Display active filters */}
        {getActiveFiltersDisplay()}
      </div>

      {/* Summary Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e8e8e8', 
          borderRadius: '8px', 
          padding: '20px', 
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            {formatCurrency(totalSpent)}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Total Spent</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e8e8e8', 
          borderRadius: '8px', 
          padding: '20px', 
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            {expenses.length}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Total Expenses</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e8e8e8', 
          borderRadius: '8px', 
          padding: '20px', 
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            {formatCurrency(averageAmount)}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Average Amount</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e8e8e8', 
          borderRadius: '8px', 
          padding: '20px', 
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            {selectedRows.length}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Selected</div>
        </div>
      </div>

      {/* Monthly Spending Trend Chart */}
      {expenses.length > 0 && (
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '8px', 
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #e8e8e8'
        }}>
          <h3 style={{ marginBottom: '24px', color: '#333', fontSize: '18px' }}>
            Monthly Spending Trend (Last 12 Months)
          </h3>
          <div style={{ height: '320px', width: '100%' }}>
            <Bar data={getMonthlyChartData()} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Recent Expenses Table */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: '1px solid #e8e8e8'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>
            Recent Expenses (Last 10)
          </h3>
        </div>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={false}
          scroll={{ x: 1000 }}
          size="middle"
          locale={{
            emptyText: (
              <div style={{ padding: '40px', color: '#999' }}>
                {(Object.keys(advancedFilters).length > 0 || searchTerm) ? (
                  <>
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                      No expenses match your filters
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      Try adjusting your search criteria
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                      No expenses found
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      Add your first expense to get started!
                    </div>
                  </>
                )}
              </div>
            )
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;