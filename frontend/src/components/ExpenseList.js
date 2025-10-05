import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, DatePicker, Space, message, Popconfirm, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, ReloadOutlined, LockOutlined } from '@ant-design/icons';
import apiService from '../services/api';
import moment from 'moment';
import { useSettings } from '../context/SettingsContext';

const { Option } = Select;

const ExpenseList = ({ advancedFilters = {}, searchTerm = '' }) => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState('');
  const [editForm, setEditForm] = useState({});
  
  // Use settings context for formatting
  const { formatCurrency, formatDateShort, getCurrencySymbol, parseCurrencyInput } = useSettings();

  // Debug: Log filters when they change
  useEffect(() => {
    console.log('ExpenseList received filters:', advancedFilters);
    console.log('ExpenseList received searchTerm:', searchTerm);
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

    return filtered;
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    const filtered = applyFilters(expenses);
    setFilteredExpenses(filtered);
  }, [expenses, advancedFilters, searchTerm]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSpends();
      const expenseData = response.data.data.map(expense => ({
        ...expense,
        key: expense.id,
        // Check if expense is older than 48 hours
        isLocked: expense.createdAt ? 
          moment().diff(moment(expense.createdAt), 'hours') > 48 : false
      }));
      setExpenses(expenseData || []);
    } catch (err) {
      message.error('Failed to fetch expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    setEditForm({
      ...record,
      date: moment(record.date)
    });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
    setEditForm({});
  };

  const save = async (key) => {
    try {
      const updatedExpense = {
        ...editForm,
        date: editForm.date.format('YYYY-MM-DD')
      };
      
      // Call backend API to update
      const response = await apiService.updateSpend(key, updatedExpense);
      
      if (response.data.success) {
        // Update local state after successful backend update
        setExpenses(prev => prev.map(expense => 
          expense.key === key ? updatedExpense : expense
        ));
        setEditingKey('');
        message.success('Expense updated successfully');
      } else {
        message.error('Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      message.error('Failed to update expense');
    }
  };

  const handleDelete = async (key) => {
    try {
      console.log(`Attempting to delete expense with ID: ${key}`);
      
      // Call the backend API to delete
      const response = await apiService.deleteSpend(key);
      
      if (response.data.success) {
        // Only remove from local state after successful backend deletion
        setExpenses(prev => prev.filter(expense => expense.key !== key));
        message.success('Expense deleted successfully');
      } else {
        message.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      message.error('Failed to delete expense: ' + (error.response?.data?.message || error.message));
    }
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

  const columns = [
    {
      title: 'Record ID',
      dataIndex: 'recordId',
      key: 'recordId',
      width: '12%',
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text || `EXP-${Date.now().toString(36).substring(0, 6).toUpperCase()}`}
        </span>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: '10%',
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <DatePicker
              value={editForm.date}
              onChange={(date) => setEditForm({ ...editForm, date })}
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
            />
          );
        }
        return formatDateShort(text);
      }
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      width: '15%',
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Input
              value={editForm.vendor}
              onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
              placeholder="Enter vendor"
            />
          );
        }
        return text || '-';
      }
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '12%',
      filters: [
        { text: 'Food', value: 'Food' },
        { text: 'Transport', value: 'Transport' },
        { text: 'Entertainment', value: 'Entertainment' },
        { text: 'Office', value: 'Office' },
        { text: 'Shopping', value: 'Shopping' },
        { text: 'Health', value: 'Health' },
        { text: 'Bills', value: 'Bills' },
        { text: 'Other', value: 'Other' },
      ],
      onFilter: (value, record) => record.category === value,
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Select
              value={editForm.category}
              onChange={(value) => setEditForm({ ...editForm, category: value })}
              style={{ width: '100%' }}
            >
              <Option value="Food">Food</Option>
              <Option value="Transport">Transport</Option>
              <Option value="Entertainment">Entertainment</Option>
              <Option value="Office">Office</Option>
              <Option value="Shopping">Shopping</Option>
              <Option value="Health">Health</Option>
              <Option value="Bills">Bills</Option>
              <Option value="Other">Other</Option>
            </Select>
          );
        }
        return (
          <Tag style={{ 
            backgroundColor: '#f0f0f0', 
            color: '#333',
            border: '1px solid #d9d9d9'
          }}>
            {text}
          </Tag>
        );
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: '10%',
      sorter: (a, b) => a.amount - b.amount,
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Input
              type="number"
              step="0.01"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
              prefix={getCurrencySymbol()}
            />
          );
        }
        return <span style={{ fontWeight: 'bold' }}>{formatCurrency(text)}</span>;
      }
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: '23%',
      ellipsis: true,
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Input
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Enter notes"
            />
          );
        }
        return text || '-';
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: '8%',
      align: 'center',
      render: (_, record) => {
        if (record.isLocked) {
          return (
            <Tooltip title="Locked after 48 hours">
              <LockOutlined style={{ color: '#999', fontSize: '16px' }} />
            </Tooltip>
          );
        }
        return (
          <Tooltip title="Editable">
            <EditOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
          </Tooltip>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '12%',
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        const editable = isEditing(record);
        
        // If record is locked, only show delete button
        if (record.isLocked && !editable) {
          return (
            <Space>
              <Tooltip title="Edit disabled - Record locked after 48 hours">
                <Button
                  icon={<LockOutlined />}
                  size="small"
                  disabled
                  style={{ color: '#999' }}
                />
              </Tooltip>
              <Popconfirm
                title="Are you sure you want to delete this expense?"
                onConfirm={() => handleDelete(record.key)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ style: { backgroundColor: '#333', borderColor: '#333' } }}
              >
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                />
              </Popconfirm>
            </Space>
          );
        }
        
        return editable ? (
          <Space>
            <Button
              icon={<SaveOutlined />}
              size="small"
              onClick={() => save(record.key)}
              style={{ color: '#52c41a' }}
            />
            <Button
              icon={<CloseOutlined />}
              size="small"
              onClick={cancel}
              style={{ color: '#666' }}
            />
          </Space>
        ) : (
          <Space>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => edit(record)}
              disabled={editingKey !== ''}
              style={{ color: '#666' }}
            />
            <Popconfirm
              title="Are you sure you want to delete this expense?"
              onConfirm={() => handleDelete(record.key)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ style: { backgroundColor: '#333', borderColor: '#333' } }}
            >
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                disabled={editingKey !== ''}
              />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#000', fontSize: '28px' }}>Manage Expenses</h1>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            View and manage all your expense records
            {(Object.keys(advancedFilters).length > 0 || searchTerm) && 
              <span style={{ color: '#000', fontWeight: '500' }}>
                {' '}• Filtered Results ({filteredExpenses.length} of {expenses.length})
              </span>
            }
          </div>
        </div>
        <Button 
          icon={<ReloadOutlined />}
          onClick={fetchExpenses}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Display active filters */}
      {getActiveFiltersDisplay()}

      {/* Table */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden'
      }}>
        <Table
          columns={columns}
          dataSource={filteredExpenses}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} expenses`,
          }}
          scroll={{ x: 800 }}
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

export default ExpenseList;