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

  // Debug: Log filters when they change
  useEffect(() => {
    console.log('Dashboard received filters:', advancedFilters);
    console.log('Dashboard received searchTerm:', searchTerm);
  }, [advancedFilters, searchTerm]);

  // Apply filters function - Updated to handle Query Builder format
  const applyFilters = (data) => {
    let filtered = [...data];

    // Apply fuzzy search
    if (searchTerm && searchTerm.trim() !== '') {
      filtered = filtered.filter(expense => {
        const searchLower = searchTerm.toLowerCase();
        return (
          expense.vendor?.toLowerCase().includes(searchLower) ||
          expense.category?.toLowerCase().includes(searchLower) ||
          expense.notes?.toLowerCase().includes(searchLower) ||
          expense.recordId?.toLowerCase().includes(searchLower) ||
          expense.amount?.toString().includes(searchLower)
        );
      });
    }

    // Apply advanced filters from Query Builder
    if (advancedFilters && Object.keys(advancedFilters).length > 0) {
      console.log('Applying advanced filters:', advancedFilters);
      
      // Handle complex queries with logical operators
      if (advancedFilters.conditions && advancedFilters.logicalOperator) {
        console.log('Processing complex query with operator:', advancedFilters.logicalOperator);
        
        const applyCondition = (expense, condition) => {
          const field = condition.field;
          const operator = condition.condition;
          const value = condition.value;
          const valueTo = condition.valueTo;
          
          switch(field) {
            case 'vendor':
            case 'notes':
            case 'recordId':
              const fieldValue = (expense[field] || '').toLowerCase();
              const searchValue = (value || '').toLowerCase();
              switch(operator) {
                case 'equal': return fieldValue === searchValue;
                case 'notequal': return fieldValue !== searchValue;
                case 'contains': return fieldValue.includes(searchValue);
                case 'notcontains': return !fieldValue.includes(searchValue);
                case 'startswith': return fieldValue.startsWith(searchValue);
                case 'endswith': return fieldValue.endsWith(searchValue);
                default: return true;
              }
              
            case 'amount':
              const amount = parseFloat(expense.amount) || 0;
              const compareValue = parseFloat(value) || 0;
              const compareValueTo = parseFloat(valueTo) || 0;
              switch(operator) {
                case 'equal': return amount === compareValue;
                case 'notequal': return amount !== compareValue;
                case 'lessthan': return amount < compareValue;
                case 'lessthanorequal': return amount <= compareValue;
                case 'greaterthan': return amount > compareValue;
                case 'greaterthanorequal': return amount >= compareValue;
                case 'between': return amount >= compareValue && amount <= compareValueTo;
                case 'notbetween': return amount < compareValue || amount > compareValueTo;
                default: return true;
              }
              
            case 'date':
              const expenseDate = moment(expense.date);
              const compareDate = moment(value);
              const compareDateTo = valueTo ? moment(valueTo) : null;
              switch(operator) {
                case 'equal': return expenseDate.isSame(compareDate, 'day');
                case 'notequal': return !expenseDate.isSame(compareDate, 'day');
                case 'lessthan': return expenseDate.isBefore(compareDate, 'day');
                case 'lessthanorequal': return expenseDate.isSameOrBefore(compareDate, 'day');
                case 'greaterthan': return expenseDate.isAfter(compareDate, 'day');
                case 'greaterthanorequal': return expenseDate.isSameOrAfter(compareDate, 'day');
                case 'between': return expenseDate.isBetween(compareDate, compareDateTo, 'day', '[]');
                case 'notbetween': return !expenseDate.isBetween(compareDate, compareDateTo, 'day', '[]');
                default: return true;
              }
              
            case 'category':
              const category = expense.category || '';
              switch(operator) {
                case 'equal': return category === value;
                case 'notequal': return category !== value;
                case 'in': return Array.isArray(value) ? value.includes(category) : category === value;
                case 'notin': return Array.isArray(value) ? !value.includes(category) : category !== value;
                default: return true;
              }
              
            default:
              return true;
          }
        };
        
        // Apply conditions based on logical operator
        if (advancedFilters.logicalOperator === 'and') {
          filtered = filtered.filter(expense => 
            advancedFilters.conditions.every(condition => applyCondition(expense, condition))
          );
        } else if (advancedFilters.logicalOperator === 'or') {
          filtered = filtered.filter(expense => 
            advancedFilters.conditions.some(condition => applyCondition(expense, condition))
          );
        }
      } else {
        // Handle simple filters (backward compatibility with old search)
        
        // Vendor filter
        if (advancedFilters.vendor) {
          const { condition, value } = advancedFilters.vendor;
          filtered = filtered.filter(expense => {
            const vendorLower = (expense.vendor || '').toLowerCase();
            const valueLower = value.toLowerCase();
            
            switch(condition) {
              case 'contains': return vendorLower.includes(valueLower);
              case 'equal':
              case 'equals': return vendorLower === valueLower;
              case 'startsWith': return vendorLower.startsWith(valueLower);
              case 'endsWith': return vendorLower.endsWith(valueLower);
              case 'notEqual':
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
              case 'equal':
              case 'equals': return expense.amount === value;
              case 'notEqual':
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
              case 'equal':
              case 'equals': return notesLower === valueLower;
              case 'startsWith': return notesLower.startsWith(valueLower);
              case 'endsWith': return notesLower.endsWith(valueLower);
              case 'notEqual':
              case 'notEquals': return notesLower !== valueLower;
              case 'notContains': return !notesLower.includes(valueLower);
              default: return true;
            }
          });
        }
      }
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

    const filterTags = [];
    
    if (hasSearch) {
      filterTags.push(
        <Tag key="search" style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
          Search: "{searchTerm}"
        </Tag>
      );
    }

    // Handle complex queries
    if (advancedFilters.conditions && advancedFilters.logicalOperator) {
      filterTags.push(
        <Tag key="complex" style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
          Complex query with {advancedFilters.conditions.length} conditions ({advancedFilters.logicalOperator.toUpperCase()})
        </Tag>
      );
    } else {
      // Handle simple filters
      if (advancedFilters.vendor) {
        filterTags.push(
          <Tag key="vendor" style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
            Vendor {advancedFilters.vendor.condition}: {advancedFilters.vendor.value}
          </Tag>
        );
      }
      if (advancedFilters.category) {
        filterTags.push(
          <Tag key="category" style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
            Categories: {advancedFilters.category.value.join(', ')}
          </Tag>
        );
      }
      if (advancedFilters.amount) {
        filterTags.push(
          <Tag key="amount" style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
            Amount {advancedFilters.amount.condition}: {formatCurrency(advancedFilters.amount.value)}
            {advancedFilters.amount.valueTo && ` - ${formatCurrency(advancedFilters.amount.valueTo)}`}
          </Tag>
        );
      }
      if (advancedFilters.dateRange) {
        filterTags.push(
          <Tag key="dateRange" style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
            Date: {advancedFilters.dateRange.from} to {advancedFilters.dateRange.to}
          </Tag>
        );
      }
      if (advancedFilters.notes) {
        filterTags.push(
          <Tag key="notes" style={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}>
            Notes {advancedFilters.notes.condition}: {advancedFilters.notes.value}
          </Tag>
        );
      }
    }

    return (
      <div style={{ 
        marginBottom: '16px', 
        padding: '12px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '6px',
        border: '1px solid #e0e0e0'
      }}>
        <Space wrap>{filterTags}</Space>
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