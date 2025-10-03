import React, { useState } from 'react';
import { 
  Upload, 
  Button, 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  message, 
  Space,
  Alert,
  Row,
  Col,
  Divider,
  Typography,
  Image,
  Spin
} from 'antd';
import { 
  InboxOutlined, 
  ScanOutlined, 
  SaveOutlined,
  CameraOutlined,
  FileImageOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import moment from 'moment';
import { useSettings } from '../context/SettingsContext';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;
const { TextArea } = Input;

const ScanReceipt = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  
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

  const handleUpload = ({ fileList: newFileList }) => {
    // Only allow one file for scan receipt
    if (newFileList.length > 0) {
      const latestFile = newFileList[newFileList.length - 1];
      setFileList([latestFile]);
      
      // Set preview
      if (latestFile.originFileObj) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewImage(e.target.result);
        reader.readAsDataURL(latestFile.originFileObj);
      }
      
      // Simulate OCR processing
      simulateOCR();
    }
  };

  const simulateOCR = () => {
    setProcessing(true);
    // Simulate OCR delay
    setTimeout(() => {
      // Pre-populate with sample extracted data
      // In real implementation, this would come from OCR API
      form.setFieldsValue({
        date: moment(),
        vendor: '', // Would be extracted from receipt
        amount: undefined, // Would be extracted from receipt
        category: undefined,
        notes: 'Receipt scanned and processed'
      });
      setProcessing(false);
      message.info('Receipt scanned. Please verify and complete the extracted information.');
    }, 2000);
  };

  const handleRemove = () => {
    setFileList([]);
    setPreviewImage(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    if (fileList.length === 0) {
      message.error('Please upload a receipt to scan');
      return;
    }

    try {
      setLoading(true);
      
      // Upload the receipt file
      let uploadedFilePath = null;
      if (fileList[0]?.originFileObj) {
        const uploadResponse = await apiService.uploadFile(fileList[0].originFileObj);
        const filename = uploadResponse.data.filename || uploadResponse.data.file?.filename;
        if (filename) {
          uploadedFilePath = {
            filename: filename,
            originalName: fileList[0].name,
            path: `/uploads/${filename}`
          };
        }
      }
      
      // Prepare expense data
      const expenseData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        attachments: uploadedFilePath ? [uploadedFilePath] : []
      };
      
      // Save expense
      await apiService.addSpend(expenseData);
      
      message.success('Receipt scanned and expense saved successfully!');
      
      // Reset and redirect
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving scanned expense:', error);
      message.error('Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    accept: 'image/*,.pdf',
    multiple: false,
    maxCount: 1,
    fileList,
    onChange: handleUpload,
    onRemove: handleRemove,
    beforeUpload: (file) => {
      const isValid = file.type === 'application/pdf' || file.type.startsWith('image/');
      if (!isValid) {
        message.error('Please upload an image or PDF receipt');
      }
      return false; // Prevent auto upload
    }
  };

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#f5f5f5', 
      minHeight: 'calc(100vh - 64px)' 
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ margin: 0, color: '#000' }}>
          <ScanOutlined style={{ marginRight: '12px' }} />
          Scan Receipt
        </Title>
        <Paragraph type="secondary" style={{ marginTop: '8px', marginBottom: 0 }}>
          Upload a single receipt to scan and extract expense information automatically
        </Paragraph>
      </div>

      <Row gutter={32}>
        {/* Left Column - Upload Area */}
        <Col xs={24} lg={10}>
          <Card 
            title="Receipt Upload"
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
          >
            {!previewImage ? (
              <Dragger {...uploadProps} style={{ padding: '40px' }}>
                <p className="ant-upload-drag-icon">
                  <CameraOutlined style={{ fontSize: '48px', color: '#999' }} />
                </p>
                <p className="ant-upload-text">
                  Click or drag receipt to scan
                </p>
                <p className="ant-upload-hint">
                  Support for JPG, PNG, PDF formats. Max size: 5MB
                </p>
              </Dragger>
            ) : (
              <div style={{ position: 'relative' }}>
                <Image
                  src={previewImage}
                  alt="Receipt preview"
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                />
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemove}
                  style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    right: '10px',
                    zIndex: 1
                  }}
                >
                  Remove
                </Button>
              </div>
            )}

            {processing && (
              <div style={{ 
                marginTop: '20px', 
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f0f0f0',
                borderRadius: '6px'
              }}>
                <Spin size="large" />
                <div style={{ marginTop: '12px', color: '#666' }}>
                  Processing receipt...
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* Right Column - Extracted Data Form */}
        <Col xs={24} lg={14}>
          <Card 
            title="Extracted Information"
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Alert
              message="OCR Feature"
              description="In the future, receipt data will be automatically extracted. For now, please enter the information manually."
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="large"
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="date"
                    label="Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker 
                      format={formatDateFull}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} md={12}>
                  <Form.Item
                    name="vendor"
                    label="Vendor"
                    rules={[{ required: true, message: 'Please enter vendor' }]}
                  >
                    <Input placeholder="Store or vendor name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="amount"
                    label={`Amount (${getCurrencySymbol()})`}
                    rules={[
                      { required: true, message: 'Please enter amount' },
                      { type: 'number', min: 0.01, message: 'Amount must be positive' }
                    ]}
                  >
                    <InputNumber
                      placeholder="0.00"
                      style={{ width: '100%' }}
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
                
                <Col xs={24} md={12}>
                  <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: 'Please select category' }]}
                  >
                    <Select placeholder="Select category">
                      {categories.map(cat => (
                        <Option key={cat} value={cat}>{cat}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notes"
                label="Notes"
              >
                <TextArea 
                  rows={4}
                  placeholder="Additional notes about this expense..."
                />
              </Form.Item>

              <Divider />

              <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
                <Space size="middle">
                  <Button 
                    onClick={() => navigate('/')}
                    size="large"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                    disabled={fileList.length === 0}
                    size="large"
                    style={{
                      backgroundColor: '#333',
                      borderColor: '#333'
                    }}
                  >
                    Save Scanned Expense
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ScanReceipt;