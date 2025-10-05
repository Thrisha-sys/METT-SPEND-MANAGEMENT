import React, { useState, useRef } from 'react';
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
  Spin,
  Modal,
  Progress
} from 'antd';
import { 
  InboxOutlined, 
  ScanOutlined, 
  SaveOutlined,
  CameraOutlined,
  FileImageOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  RetweetOutlined
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
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState(null);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [uploadMethod, setUploadMethod] = useState(null); // 'camera' or 'upload'
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
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

  // Handle file upload
  const handleUpload = ({ fileList: newFileList }) => {
    if (newFileList.length > 0) {
      const latestFile = newFileList[newFileList.length - 1];
      setFileList([latestFile]);
      setUploadMethod('upload');
      
      // Set preview
      if (latestFile.originFileObj) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target.result);
          // Process with OCR
          processWithOCR(latestFile.originFileObj, 'upload');
        };
        reader.readAsDataURL(latestFile.originFileObj);
      }
    }
  };

  // Process image with server-side OCR
  const processWithOCR = async (imageFile, source) => {
    setProcessing(true);
    setOcrProgress(0);
    setOcrResult(null);

    try {
      const formData = new FormData();
      
      // If imageFile is a data URL (from camera), convert to blob
      if (typeof imageFile === 'string') {
        const response = await fetch(imageFile);
        const blob = await response.blob();
        formData.append('receipt', blob, 'camera-capture.jpg');
      } else {
        // It's already a file object (from upload)
        formData.append('receipt', imageFile);
      }

      // Update progress
      setOcrProgress(30);

      // Call backend OCR API
      const ocrResponse = await fetch('/api/ocr/process', {
        method: 'POST',
        body: formData
      });

      setOcrProgress(70);
      const result = await ocrResponse.json();

      if (result.success) {
        console.log('OCR Result:', result.data);
        
        // Auto-fill form fields
        form.setFieldsValue({
          vendor: result.data.vendor || '',
          amount: result.data.amount || null,
          date: result.data.date ? moment(result.data.date) : moment(),
          category: result.data.category || 'Other',
          notes: `Receipt scanned from ${source}. ${result.data.vendor ? 'Vendor: ' + result.data.vendor : ''}`
        });

        setOcrResult({
          text: result.data.rawText,
          confidence: result.data.confidence,
          parsedData: result.data
        });

        setOcrProgress(100);
        
        // Show success message
        if (result.data.confidence && result.data.confidence > 0) {
          message.success(`OCR completed with ${Math.round(result.data.confidence)}% confidence`);
        } else {
          message.success('OCR processing complete. Please verify the extracted data.');
        }
      } else {
        throw new Error(result.error || 'OCR processing failed');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      message.warning('Could not extract all data from receipt. Please complete the form manually.');
      
      // Pre-fill with defaults
      form.setFieldsValue({
        date: moment(),
        notes: `Receipt uploaded from ${source}`
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setOcrProgress(0), 500);
    }
  };

  // Camera functions
  const openCamera = async () => {
    setCameraModalVisible(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      
      // Try fallback without facingMode constraint
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (fallbackError) {
        message.error('Unable to access camera. Please check permissions or use file upload instead.');
        setCameraModalVisible(false);
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      
      // Stop camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    openCamera();
  };

  const usePhoto = () => {
    setPreviewImage(capturedImage);
    setUploadMethod('camera');
    setCameraModalVisible(false);
    
    // Process with OCR
    processWithOCR(capturedImage, 'camera');
    
    // Clear captured image
    setCapturedImage(null);
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraModalVisible(false);
    setCapturedImage(null);
  };

  const handleRemove = () => {
    setFileList([]);
    setPreviewImage(null);
    setOcrResult(null);
    setUploadMethod(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    if (!previewImage) {
      message.error('Please upload or capture a receipt');
      return;
    }

    try {
      setLoading(true);
      
      // Create form data for multipart upload
      const formData = new FormData();
      
      // Add form fields
      formData.append('date', values.date.format('YYYY-MM-DD'));
      formData.append('vendor', values.vendor);
      formData.append('category', values.category);
      formData.append('amount', values.amount);
      formData.append('notes', values.notes || '');
      
      // Add file
      if (uploadMethod === 'upload' && fileList[0]?.originFileObj) {
        formData.append('files', fileList[0].originFileObj);
      } else if (uploadMethod === 'camera' && capturedImage) {
        // Convert data URL to blob
        const response = await fetch(previewImage);
        const blob = await response.blob();
        formData.append('files', blob, 'camera-receipt.jpg');
      } else if (uploadMethod === 'camera' && previewImage) {
        // Convert preview image to blob if capturedImage was cleared
        const response = await fetch(previewImage);
        const blob = await response.blob();
        formData.append('files', blob, 'camera-receipt.jpg');
      }
      
      // Save expense with attachment
      const response = await apiService.addSpend(formData);
      
      if (response.data.success) {
        message.success('Receipt scanned and expense saved successfully!');
        
        // Reset and redirect
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
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
    beforeUpload: () => false // Prevent auto upload
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
          Capture with camera or upload a receipt to automatically extract expense information
        </Paragraph>
      </div>

      <Row gutter={32}>
        {/* Left Column - Upload/Camera Area */}
        <Col xs={24} lg={10}>
          <Card 
            title="Step 1: Capture Receipt"
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
          >
            {!previewImage ? (
              <>
                {/* Camera Capture Button */}
                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  size="large"
                  block
                  onClick={openCamera}
                  style={{ 
                    height: '60px', 
                    fontSize: '16px',
                    marginBottom: '20px',
                    backgroundColor: '#333',
                    borderColor: '#333'
                  }}
                >
                  Scan with Camera
                </Button>

                <Divider>OR</Divider>

                {/* File Upload */}
                <Dragger {...uploadProps} style={{ padding: '30px' }}>
                  <p className="ant-upload-drag-icon">
                    <FileImageOutlined style={{ fontSize: '48px', color: '#999' }} />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag receipt to upload
                  </p>
                  <p className="ant-upload-hint">
                    Supports JPG, PNG, PDF formats. Max size: 10MB
                  </p>
                </Dragger>
              </>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  marginBottom: '10px', 
                  padding: '8px', 
                  backgroundColor: '#f0f0f0',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <Text strong>
                    {uploadMethod === 'camera' ? '📸 Camera Capture' : '📎 Uploaded File'}
                  </Text>
                </div>
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
                    top: '40px', 
                    right: '10px',
                    zIndex: 1
                  }}
                >
                  Remove
                </Button>
              </div>
            )}

            {/* OCR Processing Indicator */}
            {processing && (
              <Card style={{ marginTop: '20px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>Processing receipt with OCR...</Text>
                  <Progress percent={ocrProgress} status="active" />
                </Space>
              </Card>
            )}

            {/* OCR Results */}
            {ocrResult && !processing && (
              <Alert
                message="OCR Complete"
                description={`Data extracted successfully. Please verify and correct if needed.`}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ marginTop: '20px' }}
              />
            )}
          </Card>
        </Col>

        {/* Right Column - Extracted Data Form */}
        <Col xs={24} lg={14}>
          <Card 
            title="Step 2: Verify Information"
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Alert
              message="OCR Technology"
              description="Using AI to automatically extract receipt data. Please verify all fields before saving."
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Spin spinning={processing} tip="Extracting receipt data...">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                size="large"
                initialValues={{
                  date: moment(),
                  category: 'Other'
                }}
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
                      label="Vendor/Store"
                      rules={[{ required: true, message: 'Please enter vendor' }]}
                    >
                      <Input placeholder="e.g., Starbucks, Walmart" />
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
                  label="Notes (Optional)"
                >
                  <TextArea 
                    rows={3}
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
                      disabled={!previewImage}
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
            </Spin>

            {/* OCR Tips */}
            <Alert
              message="Tips for Better OCR Results"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                  <li>Ensure receipt is well-lit and clearly visible</li>
                  <li>Keep receipt flat without wrinkles</li>
                  <li>Capture entire receipt in frame</li>
                  <li>Avoid shadows and glare</li>
                </ul>
              }
              type="info"
              style={{ marginTop: '20px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Camera Modal */}
      <Modal
        title="Capture Receipt"
        open={cameraModalVisible}
        onCancel={closeCamera}
        footer={null}
        width={700}
        centered
        destroyOnClose
      >
        {!capturedImage ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              backgroundColor: '#f0f0f0', 
              borderRadius: '8px', 
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  maxHeight: '450px', 
                  display: 'block'
                }}
              />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<CameraOutlined />}
                onClick={capturePhoto}
                style={{ 
                  backgroundColor: '#333', 
                  borderColor: '#333',
                  minWidth: '150px'
                }}
              >
                Capture Photo
              </Button>
              <Button size="large" onClick={closeCamera}>
                Cancel
              </Button>
            </Space>
            
            <div style={{ marginTop: '15px' }}>
              <Text type="secondary">
                Position the receipt clearly in view and tap capture
              </Text>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              backgroundColor: '#f0f0f0', 
              borderRadius: '8px', 
              padding: '10px',
              marginBottom: '20px'
            }}>
              <Image
                src={capturedImage}
                alt="Captured receipt"
                style={{ 
                  width: '100%', 
                  maxHeight: '450px', 
                  objectFit: 'contain' 
                }}
              />
            </div>
            
            <Space>
              <Button
                onClick={retakePhoto}
                icon={<RetweetOutlined />}
                size="large"
              >
                Retake
              </Button>
              <Button
                type="primary"
                onClick={usePhoto}
                icon={<CheckCircleOutlined />}
                size="large"
                style={{ 
                  backgroundColor: '#52c41a', 
                  borderColor: '#52c41a',
                  minWidth: '150px'
                }}
              >
                Use This Photo
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ScanReceipt;