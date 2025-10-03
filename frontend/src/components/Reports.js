import React, { useState, useEffect } from 'react';
import { Table, Button, Space, DatePicker, Select, Tag, Modal, Image } from 'antd';
import { 
  DownloadOutlined, 
  FileTextOutlined, 
  FilePdfOutlined,
  FileImageOutlined,
  EyeOutlined,
  FilterOutlined,
  ExportOutlined
} from '@ant-design/icons';
import moment from 'moment';
import apiService from '../services/api';
import { useSettings } from '../context/SettingsContext';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = ({ advancedFilters = {}, searchTerm = '' }) => {
  const [expenses, setExpenses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  // Use settings context for formatting
  const { formatCurrency, formatDateShort, formatDateFull } = useSettings();

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, dateRange, selectedCategory, advancedFilters, searchTerm]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSpends();
      const expenseData = response.data.data.map(expense => ({
        ...expense,
        key: expense.id,
        formattedDate: formatDateShort(expense.date),
        formattedAmount: formatCurrency(expense.amount)
      }));
      setExpenses(expenseData);
      setFilteredData(expenseData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // Apply date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(expense => {
        const expenseDate = moment(expense.date);
        return expenseDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      });
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Apply fuzzy search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(expense => {
        return (
          expense.vendor?.toLowerCase().includes(searchLower) ||
          expense.category?.toLowerCase().includes(searchLower) ||
          expense.notes?.toLowerCase().includes(searchLower) ||
          expense.amount?.toString().includes(searchLower)
        );
      });
    }

    // Apply advanced filters if any
    // ... (similar to Dashboard filtering logic)

    setFilteredData(filtered);
  };

  const handlePreview = (file) => {
    if (file.filename && file.filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
      setPreviewImage(`http://localhost:5000/uploads/${file.filename}`);
      setPreviewTitle(file.originalName || file.filename);
      setPreviewVisible(true);
    } else if (file.filename && file.filename.match(/\.pdf$/i)) {
      // Open PDF in new tab
      window.open(`http://localhost:5000/uploads/${file.filename}`, '_blank');
    }
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/uploads/${file.filename}`;
    link.download = file.originalName || file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (filename) => {
    if (filename?.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return <FileImageOutlined style={{ fontSize: '16px', color: '#666' }} />;
    } else if (filename?.match(/\.pdf$/i)) {
      return <FilePdfOutlined style={{ fontSize: '16px', color: '#666' }} />;
    }
    return <FileTextOutlined style={{ fontSize: '16px', color: '#666' }} />;
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
      dataIndex: 'formattedDate',
      key: 'date',
      width: '10%',
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      width: '18%',
      render: (text) => text || '-'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '15%',
      filters: [
        { text: 'Food', value: 'Food' },
        { text: 'Transport', value: 'Transport' },
        { text: 'Entertainment', value: 'Entertainment' },
        { text: 'Shopping', value: 'Shopping' },
        { text: 'Bills', value: 'Bills' },
        { text: 'Healthcare', value: 'Healthcare' },
        { text: 'Education', value: 'Education' },
        { text: 'Other', value: 'Other' }
      ],
      onFilter: (value, record) => record.category === value,
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
        <span style={{ fontWeight: 'bold', color: '#333' }}>{text}</span>
      ),
    },
    {
      title: 'Files',
      key: 'files',
      width: '15%',
      align: 'center',
      render: (_, record) => {
        const attachments = record.attachments || [];
        if (attachments.length === 0) {
          return <span style={{ color: '#ccc' }}>-</span>;
        }

        // For single attachment, show direct link
        if (attachments.length === 1) {
          const file = attachments[0];
          return (
            <Space size="small">
              <Button
                type="link"
                size="small"
                icon={getFileIcon(file.filename)}
                onClick={() => handlePreview(file)}
                style={{ padding: '2px 8px', color: '#333' }}
              >
                View
              </Button>
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(file)}
                style={{ padding: '2px', color: '#666' }}
              />
            </Space>
          );
        }

        // For multiple attachments, show dropdown
        return (
          <Space size="small">
            {attachments.map((file, index) => (
              <Button
                key={index}
                type="link"
                size="small"
                icon={getFileIcon(file.filename)}
                onClick={() => handlePreview(file)}
                style={{ padding: '2px', color: '#333' }}
              />
            ))}
          </Space>
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

  const exportToCSV = () => {
    const csvContent = [
      ['Record ID', 'Date', 'Vendor', 'Category', 'Amount', 'Notes'],
      ...filteredData.map(row => [
        row.recordId || `EXP-${Date.now().toString(36).substring(0, 6).toUpperCase()}`,
        row.date,
        row.vendor,
        row.category,
        row.amount,
        row.notes
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const categories = ['all', 'Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other'];

  const totalAmount = filteredData.reduce((sum, expense) => sum + expense.amount, 0);
  const averageAmount = filteredData.length > 0 ? totalAmount / filteredData.length : 0;

  return (
    <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#000', fontSize: '28px' }}>Reports</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              Detailed expense analysis with Excel-like filtering
            </div>
          </div>
          <Button 
            icon={<ExportOutlined />}
            onClick={exportToCSV}
            style={{
              backgroundColor: '#333',
              borderColor: '#333',
              color: '#fff',
            }}
          >
            Export Selected ({filteredData.length})
          </Button>
        </div>

        {/* Filter Controls */}
        <div style={{ 
          backgroundColor: '#fafafa', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #f0f0f0'
        }}>
          <Space size="middle" wrap>
            <RangePicker
              onChange={(dates) => setDateRange(dates)}
              format={formatDateFull}
              placeholder={['Start Date', 'End Date']}
            />
            <Select
              style={{ width: 150 }}
              placeholder="All Categories"
              value={selectedCategory}
              onChange={setSelectedCategory}
            >
              {categories.map(cat => (
                <Option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </Option>
              ))}
            </Select>
            <Button 
              onClick={() => {
                setDateRange(null);
                setSelectedCategory('all');
              }}
              icon={<FilterOutlined />}
            >
              Clear Filters
            </Button>
          </Space>
        </div>

        {/* Summary Statistics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            padding: '16px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Amount</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {formatCurrency(totalAmount)}
            </div>
          </div>
          <div style={{ 
            padding: '16px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Records</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {filteredData.length}
            </div>
          </div>
          <div style={{ 
            padding: '16px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Average Amount</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {formatCurrency(averageAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        overflow: 'hidden'
      }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} expenses`,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </div>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <img 
          alt="Receipt" 
          style={{ width: '100%' }} 
          src={previewImage} 
        />
      </Modal>
    </div>
  );
};

export default Reports;