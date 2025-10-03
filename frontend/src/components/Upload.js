import React, { useState, useRef } from 'react';
import { Button, Upload as AntUpload, message } from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import apiService from '../services/api';

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Handle file selection from input or drag & drop
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file (JPG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      message.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleInputChange = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Upload file to server
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setResult(null);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await apiService.uploadFile(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setResult({
        success: true,
        message: 'File uploaded successfully!',
        file: response.data.file,
        uploadedAt: new Date().toLocaleString()
      });

      message.success('File uploaded successfully!');

    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      
      message.error(error.response?.data?.message || 'Upload failed. Please try again.');
      
      setResult({
        success: false,
        message: error.response?.data?.message || 'Upload failed. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Clear selected file and start over
  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Navigate to add expense
  const handleCreateExpense = () => {
    window.location.href = '/add-expense';
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, color: '#000', fontSize: '28px' }}>Upload Receipt</h1>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            Upload a photo of your receipt to extract expense information
          </div>
        </div>

        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          {/* Drag & Drop Area */}
          <div
            style={{
              border: `2px dashed ${dragActive ? '#333' : '#d9d9d9'}`,
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: dragActive ? '#fafafa' : '#fff',
              transform: dragActive ? 'scale(1.02)' : 'scale(1)'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            {!selectedFile ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                <h3 style={{ color: '#000', marginBottom: '8px' }}>
                  Drag & drop your receipt here
                </h3>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  or click to browse files
                </p>
                <div style={{ color: '#999', fontSize: '12px' }}>
                  Supports: JPG, PNG, GIF • Max size: 5MB
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                <h4 style={{ color: '#000', margin: '8px 0' }}>{selectedFile.name}</h4>
                <p style={{ color: '#666', margin: '4px 0' }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  size="small"
                  style={{ marginTop: '8px' }}
                >
                  Choose Different File
                </Button>
              </div>
            )}
          </div>

          {/* Image Preview */}
          {preview && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ color: '#000', marginBottom: '12px' }}>Preview</h3>
              <div style={{ 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '16px',
                textAlign: 'center',
                backgroundColor: '#fafafa'
              }}>
                <img 
                  src={preview} 
                  alt="Receipt preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '400px',
                    borderRadius: '4px'
                  }} 
                />
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ 
                height: '8px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%',
                  backgroundColor: '#333',
                  width: `${uploadProgress}%`,
                  transition: 'width 0.3s'
                }}></div>
              </div>
              <p style={{ 
                textAlign: 'center', 
                color: '#666', 
                marginTop: '8px' 
              }}>
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {selectedFile && !uploading && !result && (
            <div style={{ 
              marginTop: '24px', 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center' 
            }}>
              <Button 
                type="primary" 
                size="large"
                onClick={handleUpload}
                icon={<UploadOutlined />}
                style={{ backgroundColor: '#333', borderColor: '#333' }}
              >
                Upload Receipt
              </Button>
              <Button 
                size="large"
                onClick={handleClear}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Upload Result */}
          {result && result.success && (
            <div style={{ 
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '8px'
            }}>
              <h3 style={{ color: '#52c41a', marginBottom: '12px' }}>
                ✓ Upload Successful!
              </h3>
              <div style={{ color: '#666' }}>
                <div>File: {result.file.filename}</div>
                <div>Size: {(result.file.size / 1024).toFixed(1)} KB</div>
                <div>Uploaded: {result.uploadedAt}</div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <Button 
                  type="primary"
                  onClick={handleCreateExpense}
                  style={{ backgroundColor: '#333', borderColor: '#333' }}
                >
                  Create Expense Entry
                </Button>
                <Button onClick={handleClear}>
                  Upload Another Receipt
                </Button>
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div style={{ 
            marginTop: '32px',
            padding: '16px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #f0f0f0'
          }}>
            <h4 style={{ color: '#000', marginBottom: '12px' }}>
              📝 Tips for better results:
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px',
              color: '#666',
              lineHeight: '1.8'
            }}>
              <li>Ensure the receipt is well-lit and clearly visible</li>
              <li>Avoid shadows or glare on the receipt</li>
              <li>Keep the receipt flat and straight</li>
              <li>Include the entire receipt in the photo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;