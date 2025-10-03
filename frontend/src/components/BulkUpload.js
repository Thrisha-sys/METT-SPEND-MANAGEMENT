import React, { useState } from 'react';
import { 
  Upload, 
  Button, 
  Card, 
  List, 
  Image, 
  Space, 
  message, 
  Typography, 
  Alert,
  Badge,
  Row,
  Col,
  Empty,
  Progress,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Steps,
  Divider,
  Spin
} from 'antd';
import { 
  InboxOutlined, 
  CloudUploadOutlined, 
  FileImageOutlined, 
  FilePdfOutlined, 
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LeftOutlined,
  RightOutlined,
  SaveOutlined,
  ScanOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import moment from 'moment';
import { useSettings } from '../context/SettingsContext';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const BulkUpload = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [expenseData, setExpenseData] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [processingOCR, setProcessingOCR] = useState(false);
  const [ocrProcessed, setOcrProcessed] = useState([]);
  const [form] = Form.useForm();
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

  const handleChange = ({ fileList: newFileList }) => {
    // Limit to 10 files
    if (newFileList.length > 10) {
      message.warning('Maximum 10 receipts allowed at once');
      newFileList = newFileList.slice(0, 10);
    }
    setFileList(newFileList);
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      if (file.originFileObj) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target.result);
          setPreviewVisible(true);
        };
        reader.readAsDataURL(file.originFileObj);
      }
    } else {
      setPreviewImage(file.url || file.preview);
      setPreviewVisible(true);
    }
  };

  const handleRemove = (file) => {
    const newFileList = fileList.filter(f => f.uid !== file.uid);
    setFileList(newFileList);
  };

  const handleBulkUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select at least one receipt to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadedFilesList = [];
    const totalFiles = fileList.length;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      try {
        if (file.originFileObj) {
          // Upload the file
          const response = await apiService.uploadFile(file.originFileObj);
          const filename = response.data.filename || response.data.file?.filename;
          
          if (filename) {
            uploadedFilesList.push({
              filename: filename,
              originalName: file.name,
              path: `/uploads/${filename}`,
              file: file.originFileObj
            });
          }
          
          // Update progress
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    setUploadedFiles(uploadedFilesList);
    setUploading(false);

    if (uploadedFilesList.length > 0) {
      message.success(`${uploadedFilesList.length} receipts uploaded successfully!`);
      setCurrentStep(1);
      // Initialize expense data array for each file
      setExpenseData(new Array(uploadedFilesList.length).fill(null));
      // Start OCR simulation for first receipt
      setTimeout(() => simulateOCR(0), 500);
    } else {
      message.error('Failed to upload receipts');
    }
  };

  const handleSaveCurrentExpense = async () => {
    try {
      const values = await form.validateFields();
      
      // Save current form data to expense data array
      const updatedExpenseData = [...expenseData];
      updatedExpenseData[currentFileIndex] = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        attachments: [{
          filename: uploadedFiles[currentFileIndex].filename,
          originalName: uploadedFiles[currentFileIndex].originalName,
          path: uploadedFiles[currentFileIndex].path
        }]
      };
      setExpenseData(updatedExpenseData);
      
      message.success(`Expense details saved for receipt ${currentFileIndex + 1}`);
      return true;
    } catch (error) {
      message.error('Please fill all required fields');
      return false;
    }
  };

  const simulateOCR = (fileIndex) => {
    // Check if this receipt has already been processed
    if (ocrProcessed.includes(fileIndex)) {
      return;
    }

    setProcessingOCR(true);
    
    // Simulate OCR processing delay
    setTimeout(() => {
      // Mark this receipt as OCR processed
      setOcrProcessed([...ocrProcessed, fileIndex]);
      
      // In production, these values would come from actual OCR
      // For now, just set placeholder text
      message.info('OCR simulation complete. Please verify and complete the extracted information.');
      
      setProcessingOCR(false);
    }, 1500);
  };

  const handleNext = async () => {
    const saved = await handleSaveCurrentExpense();
    if (saved && currentFileIndex < uploadedFiles.length - 1) {
      const nextIndex = currentFileIndex + 1;
      setCurrentFileIndex(nextIndex);
      
      // Load next expense data if it exists
      if (expenseData[nextIndex]) {
        form.setFieldsValue({
          ...expenseData[nextIndex],
          date: moment(expenseData[nextIndex].date)
        });
      } else {
        form.resetFields();
        // Simulate OCR for new receipt
        simulateOCR(nextIndex);
      }
    }
  };

  const handlePrevious = () => {
    if (currentFileIndex > 0) {
      const prevIndex = currentFileIndex - 1;
      setCurrentFileIndex(prevIndex);
      
      // Load previous expense data
      if (expenseData[prevIndex]) {
        form.setFieldsValue({
          ...expenseData[prevIndex],
          date: moment(expenseData[prevIndex].date)
        });
      }
    }
  };

  const handleSubmitAll = async () => {
    // Save current form first
    const saved = await handleSaveCurrentExpense();
    if (!saved) return;

    // Check if all expenses have data
    const incompleteExpenses = expenseData.filter(data => !data);
    if (incompleteExpenses.length > 0) {
      message.warning('Please complete details for all receipts');
      return;
    }

    setUploading(true);
    let successCount = 0;

    // Submit all expenses
    for (let i = 0; i < expenseData.length; i++) {
      try {
        await apiService.addSpend(expenseData[i]);
        successCount++;
      } catch (error) {
        console.error(`Failed to save expense ${i + 1}:`, error);
      }
    }

    setUploading(false);

    if (successCount === expenseData.length) {
      message.success(`All ${successCount} expenses saved successfully!`);
      setTimeout(() => navigate('/manage-expenses'), 1500);
    } else {
      message.warning(`${successCount} of ${expenseData.length} expenses saved`);
    }
  };

  const uploadProps = {
    accept: 'image/*,.pdf',
    multiple: true,
    maxCount: 10,
    fileList,
    onChange: handleChange,
    onPreview: handlePreview,
    onRemove: handleRemove,
    beforeUpload: (file) => {
      const isValid = file.type === 'application/pdf' || file.type.startsWith('image/');
      if (!isValid) {
        message.error(`${file.name} is not a valid receipt file`);
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error(`${file.name} must be smaller than 5MB`);
        return false;
      }
      return false; // Prevent auto upload
    }
  };

  const getFileIcon = (file) => {
    if (file.type === 'application/pdf' || file.originalName?.endsWith('.pdf')) {
      return <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />;
    }
    return <FileImageOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
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
          <CloudUploadOutlined style={{ marginRight: '12px' }} />
          Bulk Upload
        </Title>
        <Paragraph type="secondary" style={{ marginTop: '8px', marginBottom: 0 }}>
          Add up to 10 receipts at a time for batch processing
        </Paragraph>
      </div>

      {/* Steps */}
      <Steps current={currentStep} style={{ marginBottom: '32px' }}>
        <Step title="Upload Receipts" description="Select up to 10 files" />
        <Step title="Add Details" description="Enter expense information" />
        <Step title="Complete" description="Save all expenses" />
      </Steps>

      {/* Step 1: Upload Files */}
      {currentStep === 0 && (
        <>
          <Alert
            message="Bulk Receipt Upload"
            description={
              <div>
                <p>Upload multiple receipts at once (up to 10 files). After uploading:</p>
                <ul style={{ marginBottom: 0 }}>
                  <li>You'll enter expense details for each receipt</li>
                  <li>Each receipt will be saved as a separate expense</li>
                  <li>Supports JPG, PNG, and PDF formats (max 5MB each)</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          <Row gutter={32}>
            <Col xs={24} lg={14}>
              <Card 
                title={
                  <Space>
                    <span>Select Receipts</span>
                    <Badge 
                      count={fileList.length} 
                      showZero 
                      style={{ backgroundColor: fileList.length > 0 ? '#52c41a' : '#d9d9d9' }}
                    />
                  </Space>
                }
                style={{ 
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  marginBottom: '24px'
                }}
              >
                <Dragger {...uploadProps} style={{ padding: '20px' }}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: '64px', color: '#999' }} />
                  </p>
                  <p className="ant-upload-text" style={{ fontSize: '18px' }}>
                    Click or drag receipts here
                  </p>
                  <p className="ant-upload-hint">
                    Support for multiple files. Select up to 10 receipts at once.
                    <br />
                    Accepted formats: JPG, PNG, PDF (Max 5MB each)
                  </p>
                </Dragger>

                {uploading && (
                  <div style={{ marginTop: '20px' }}>
                    <Progress 
                      percent={uploadProgress} 
                      status="active"
                      strokeColor="#333"
                    />
                    <Text type="secondary">Uploading receipts...</Text>
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card 
                title="Selected Files"
                extra={
                  fileList.length > 0 && (
                    <Button 
                      danger 
                      size="small"
                      onClick={() => setFileList([])}
                    >
                      Clear All
                    </Button>
                  )
                }
                style={{ 
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  marginBottom: '24px'
                }}
              >
                {fileList.length === 0 ? (
                  <Empty 
                    description="No receipts selected"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <List
                    itemLayout="horizontal"
                    dataSource={fileList}
                    renderItem={(file) => (
                      <List.Item
                        actions={[
                          <Button 
                            type="text" 
                            icon={<EyeOutlined />}
                            onClick={() => handlePreview(file)}
                          />,
                          <Button 
                            type="text" 
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemove(file)}
                            disabled={uploading}
                          />
                        ]}
                      >
                        <List.Item.Meta
                          avatar={getFileIcon(file)}
                          title={
                            <Text ellipsis style={{ maxWidth: '200px' }}>
                              {file.name}
                            </Text>
                          }
                          description={`Size: ${(file.size / 1024).toFixed(2)} KB`}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Col>
          </Row>

          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              <Button 
                size="large"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CloudUploadOutlined />}
                loading={uploading}
                disabled={fileList.length === 0}
                onClick={handleBulkUpload}
                style={{
                  backgroundColor: '#333',
                  borderColor: '#333',
                  minWidth: '200px'
                }}
              >
                Upload {fileList.length > 0 ? `${fileList.length} Receipt${fileList.length > 1 ? 's' : ''}` : 'Receipts'}
              </Button>
            </Space>
          </div>
        </>
      )}

      {/* Step 2: Add Details for Each Receipt */}
      {currentStep === 1 && uploadedFiles.length > 0 && (
        <Card
          title={
            <Space>
              <span>Receipt {currentFileIndex + 1} of {uploadedFiles.length}</span>
              <Text type="secondary">({uploadedFiles[currentFileIndex].originalName})</Text>
            </Space>
          }
          style={{ 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          {/* OCR Info Alert */}
          <Alert
            message="OCR Processing"
            description="In production, receipt data would be automatically extracted using OCR. For now, please enter the information manually after reviewing the receipt."
            type="info"
            showIcon
            icon={<ScanOutlined />}
            style={{ marginBottom: '24px' }}
          />

          {/* OCR Processing Indicator */}
          {processingOCR && (
            <div style={{ 
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f0f0f0',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <Spin size="large" />
              <div style={{ marginTop: '12px', color: '#666' }}>
                Simulating OCR processing for receipt {currentFileIndex + 1}...
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                In production, this would extract vendor, amount, and date automatically
              </div>
            </div>
          )}

          {/* Receipt Preview Section */}
          <Row gutter={24} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={8}>
              <div style={{ 
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                padding: '12px',
                textAlign: 'center',
                backgroundColor: '#fafafa'
              }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                  Receipt Preview
                </Text>
                <Button 
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    const file = uploadedFiles[currentFileIndex];
                    if (file && file.file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setPreviewImage(e.target.result);
                        setPreviewVisible(true);
                      };
                      reader.readAsDataURL(file.file);
                    }
                  }}
                >
                  View Receipt
                </Button>
                {ocrProcessed.includes(currentFileIndex) && (
                  <div style={{ marginTop: '8px' }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                    <Text type="success" style={{ fontSize: '12px' }}>OCR Simulated</Text>
                  </div>
                )}
              </div>
            </Col>
            <Col xs={24} lg={16}>
              <Alert
                message="Future Enhancement"
                description="When OCR is implemented, extracted data will appear here with confidence scores for each field."
                type="warning"
                style={{ height: '100%' }}
              />
            </Col>
          </Row>

          <Divider />

          <Form
            form={form}
            layout="vertical"
            size="large"
            initialValues={{
              date: moment(),
            }}
          >
            <Row gutter={24}>
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

            <Row gutter={24}>
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
          </Form>

          <Divider />

          {/* Progress Indicators */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Space>
              {uploadedFiles.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: expenseData[index] 
                      ? '#52c41a' 
                      : index === currentFileIndex 
                        ? '#1890ff' 
                        : '#d9d9d9',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (index !== currentFileIndex) {
                      handleSaveCurrentExpense().then(saved => {
                        if (saved) {
                          setCurrentFileIndex(index);
                          if (expenseData[index]) {
                            form.setFieldsValue({
                              ...expenseData[index],
                              date: moment(expenseData[index].date)
                            });
                          } else {
                            form.resetFields();
                          }
                        }
                      });
                    }
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </Space>
          </div>

          {/* Navigation Buttons */}
          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              <Button
                size="large"
                icon={<LeftOutlined />}
                onClick={handlePrevious}
                disabled={currentFileIndex === 0}
              >
                Previous
              </Button>
              
              {currentFileIndex < uploadedFiles.length - 1 ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<RightOutlined />}
                  onClick={handleNext}
                  style={{
                    backgroundColor: '#333',
                    borderColor: '#333'
                  }}
                >
                  Next Receipt
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={uploading}
                  onClick={handleSubmitAll}
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a'
                  }}
                >
                  Save All Expenses
                </Button>
              )}
            </Space>
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      <Modal
        open={previewVisible}
        title="Receipt Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <img alt="receipt" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default BulkUpload;