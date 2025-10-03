import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Row, 
  Col,
  message,
  Avatar,
  Typography
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  SaveOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProfileSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Load profile data from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setProfileData(profile);
      form.setFieldsValue(profile);
    } else {
      // Set default values if no saved profile
      const defaultProfile = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 234 567 8900'
      };
      setProfileData(defaultProfile);
      form.setFieldsValue(defaultProfile);
    }
  }, [form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Save to localStorage (in real app, would save to backend)
      localStorage.setItem('userProfile', JSON.stringify(values));
      setProfileData(values);
      
      // Show success message
      message.success('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '32px 48px',
      backgroundColor: '#ffffff',
      minHeight: 'calc(100vh - 64px)'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '40px'
      }}>
        <Title level={2} style={{ margin: 0, color: '#000' }}>
          Profile Settings
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Manage your personal information
        </Text>
      </div>

      <Row gutter={32}>
        <Col xs={24} lg={8}>
          {/* Profile Avatar Card */}
          <Card 
            style={{ 
              textAlign: 'center',
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Avatar 
              size={120} 
              icon={<UserOutlined />}
              style={{
                backgroundColor: '#f0f0f0',
                color: '#666',
                marginBottom: '24px'
              }}
            />
            <Title level={4} style={{ marginBottom: '4px' }}>
              {profileData.name || 'User Name'}
            </Title>
            <Text type="secondary">
              {profileData.email || 'user@example.com'}
            </Text>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          {/* Profile Form */}
          <Card 
            style={{ 
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="large"
            >
              <Row gutter={24}>
                <Col xs={24}>
                  <Form.Item
                    name="name"
                    label={
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        Full Name
                      </span>
                    }
                    rules={[
                      { required: true, message: 'Please enter your name' },
                      { min: 2, message: 'Name must be at least 2 characters' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined style={{ color: '#999' }} />}
                      placeholder="Enter your full name"
                      style={{
                        height: '48px',
                        fontSize: '16px',
                        borderRadius: '6px'
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    name="email"
                    label={
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        Email Address
                      </span>
                    }
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined style={{ color: '#999' }} />}
                      placeholder="Enter your email address"
                      style={{
                        height: '48px',
                        fontSize: '16px',
                        borderRadius: '6px'
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    name="phone"
                    label={
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        Phone Number
                      </span>
                    }
                    rules={[
                      { required: true, message: 'Please enter your phone number' },
                      { 
                        pattern: /^[\d\s\-\+\(\)]+$/, 
                        message: 'Please enter a valid phone number' 
                      }
                    ]}
                  >
                    <Input 
                      prefix={<PhoneOutlined style={{ color: '#999' }} />}
                      placeholder="Enter your phone number"
                      style={{
                        height: '48px',
                        fontSize: '16px',
                        borderRadius: '6px'
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  icon={<SaveOutlined />}
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
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfileSettings;