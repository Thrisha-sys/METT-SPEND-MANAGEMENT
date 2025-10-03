import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  Button, 
  Space,
  message,
  Upload,
  Row,
  Col,
  Alert
} from 'antd';
import { 
  UploadOutlined,
  PaperClipOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import moment from 'moment';
import { useSettings } from '../context/SettingsContext';

const { TextArea } = Input;
const { Option } = Select;

const AddExpenseForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const navigate = useNavigate();
  
  // Use settings context for currency
  const { getCurrencySymbol, parseCurrencyInput, formatDateFull } = useSettings();

  const categories = [
    'Food',
    'Transport',
    'Entertainment',
    'Shopping',
    'Bills',
    'Healthcare',
    'Education',
    'Other'
  ];

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // First, upload all files and get their paths
      const uploadedFilePaths = [];
      
      for (const file of fileList) {
        if (file.originFileObj) {
          try {
            const response = await apiService.uploadFile(file.originFileObj);
            console.log('Upload response:', response.data); // Debug log
            
            // Handle different response structures
            const filename = response.data.filename || response.data.file?.filename || response.data.fileName;
            
            if (filename) {
              uploadedFilePaths.push({
                filename: filename,
                originalName: file.name,
                path: response.data.path || `/uploads/${filename}`
              });
            }
          } catch (uploadError) {
            console.error('Error uploading file:', uploadError);
          }
        }
      }
      
      // Prepare expense data with uploaded file references
      const expenseData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        attachments: uploadedFilePaths // Store the uploaded file references
      };
      
      await apiService.addSpend(expenseData);
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form and redirect after delay
      setTimeout(() => {
        form.resetFields();
        setFileList([]);
        setUploadedFiles([]);
        setShowSuccess(false);
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding expense:', error);
      message.error('Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    fileList,
    multiple: true,
    maxCount: 5,
    accept: '.jpg,.jpeg,.png,.gif,.pdf',
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
      if (!isValidType) {
        message.error('You can only upload image or PDF files!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('File must be smaller than 5MB!');
        return false;
      }
      return false; // Prevent auto upload - we'll upload manually on form submit
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    }
  };

  return (
    <div style={{ 
      padding: '32px 48px',
      backgroundColor: '#ffffff',
      minHeight: 'calc(100vh - 64px)'
    }}>
      {/* Success Alert Banner */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          animation: 'slideDown 0.3s ease-in-out'
        }}>
          <Alert
            message="Success!"
            description="Expense added successfully!"
            type="success"
            showIcon
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
              minWidth: '400px',
              fontSize: '16px'
            }}
          />
        </div>
      )}

      {/* Add CSS for animation */}
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>

      {/* Header */}
      <div style={{ 
        marginBottom: '40px',
        backgroundColor: '#ffffff'
      }}>
        <h1 style={{ 
          margin: 0, 
          color: '#000', 
          fontSize: '32px',
          fontWeight: '600'
        }}>
          Add Expense
        </h1>
        <div style={{ 
          fontSize: '14px', 
          color: '#666', 
          marginTop: '8px' 
        }}>
          Record a new expense with receipt attachments
        </div>
      </div>

      {/* Form without card - direct on white background */}
      <div style={{ 
        maxWidth: '100%',
        backgroundColor: '#ffffff'
      }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: moment(),
            amount: undefined,
            category: undefined,
            vendor: '',
            notes: ''
          }}
          size="large"
        >
          {/* First Row - Date and Category */}
          <Row gutter={32} style={{ marginBottom: '32px' }}>
            <Col xs={24} md={12}>
              <Form.Item
                name="date"
                label={<span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>Date</span>}
                rules={[{ required: true, message: 'Please select a date' }]}
                style={{ marginBottom: 0 }}
              >
                <DatePicker 
                  size="large"
                  format={formatDateFull}
                  style={{ 
                    width: '100%',
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '6px',
                    border: '1px solid #d9d9d9'
                  }}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="category"
                label={<span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>Category</span>}
                rules={[{ required: true, message: 'Please select a category' }]}
                style={{ marginBottom: 0 }}
              >
                <Select 
                  placeholder="Select a category"
                  size="large"
                  style={{
                    fontSize: '16px'
                  }}
                >
                  {categories.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Second Row - Vendor and Amount */}
          <Row gutter={32} style={{ marginBottom: '32px' }}>
            <Col xs={24} md={12}>
              <Form.Item
                name="vendor"
                label={<span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>Vendor</span>}
                rules={[{ required: true, message: 'Please enter vendor name' }]}
                style={{ marginBottom: 0 }}
              >
                <Input 
                  placeholder="e.g., Starbucks, Uber, Amazon"
                  size="large"
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '6px'
                  }}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="amount"
                label={<span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Amount ({getCurrencySymbol()})
                </span>}
                rules={[
                  { required: true, message: 'Please enter amount' },
                  { type: 'number', min: 0.01, message: 'Amount must be positive' }
                ]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  placeholder="0.00"
                  size="large"
                  style={{ 
                    width: '100%',
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '6px'
                  }}
                  min={0.01}
                  step={0.01}
                  precision={2}
                  formatter={value => {
                    if (!value) return '';
                    return `${getCurrencySymbol()} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  }}
                  parser={value => parseCurrencyInput(value)}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Third Row - Notes (full width) */}
          <Row style={{ marginBottom: '32px' }}>
            <Col span={24}>
              <Form.Item
                name="notes"
                label={<span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>Notes</span>}
                style={{ marginBottom: 0 }}
              >
                <TextArea 
                  rows={4}
                  placeholder="Add any additional details about this expense..."
                  size="large"
                  style={{
                    fontSize: '16px',
                    borderRadius: '6px',
                    resize: 'vertical'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* File Attachments Section */}
          <Row style={{ marginBottom: '40px' }}>
            <Col span={24}>
              <div style={{
                padding: '32px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{
                  marginBottom: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  <PaperClipOutlined style={{ marginRight: '8px' }} />
                  Attach Receipts
                </div>
                
                <Upload.Dragger 
                  {...uploadProps}
                  style={{
                    padding: '40px',
                    backgroundColor: '#fff',
                    borderRadius: '6px'
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined style={{ fontSize: '48px', color: '#999' }} />
                  </p>
                  <p className="ant-upload-text" style={{ 
                    color: '#333',
                    fontSize: '16px',
                    marginTop: '16px'
                  }}>
                    Click or drag receipts to upload
                  </p>
                  <p className="ant-upload-hint" style={{ 
                    color: '#999',
                    fontSize: '14px',
                    marginTop: '8px'
                  }}>
                    Support for images (JPG, PNG, GIF) and PDF files. Maximum 5 files, 5MB each.
                  </p>
                </Upload.Dragger>
              </div>
            </Col>
          </Row>

          {/* Form Actions - Centered */}
          <Row>
            <Col span={24} style={{ textAlign: 'center' }}>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  style={{
                    backgroundColor: '#333',
                    borderColor: '#333',
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '500',
                    minWidth: '160px',
                    borderRadius: '6px'
                  }}
                >
                  Save Expense
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default AddExpenseForm;