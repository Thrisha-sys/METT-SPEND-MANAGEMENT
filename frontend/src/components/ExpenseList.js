import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, DatePicker, Space, message, Popconfirm, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, ReloadOutlined, LockOutlined } from '@ant-design/icons';
import apiService from '../services/api';
import moment from 'moment';
import { useSettings } from '../context/SettingsContext';

const { Option } = Select;

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState('');
  const [editForm, setEditForm] = useState({});
  
  // Use settings context for formatting
  const { formatCurrency, formatDateShort, getCurrencySymbol, parseCurrencyInput } = useSettings();

  useEffect(() => {
    fetchExpenses();
  }, []);

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
          <h1 style={{ margin: 0, color: '#000', fontSize: '28px' }}>Recent Expenses</h1>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            View and manage all your expense records
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

      {/* Table */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden'
      }}>
        <Table
          columns={columns}
          dataSource={expenses}
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
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  No expenses found
                </div>
                <div style={{ fontSize: '14px' }}>
                  Add your first expense to get started!
                </div>
              </div>
            )
          }}
        />
      </div>
    </div>
  );
};

export default ExpenseList;