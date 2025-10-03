import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Select, 
  Button, 
  Card, 
  Row, 
  Col,
  message,
  Typography,
  Divider,
  Space
} from 'antd';
import { 
  GlobalOutlined, 
  ClockCircleOutlined, 
  CalendarOutlined,
  DollarOutlined,
  SaveOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const AccountSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    country: 'US',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD'
  });

  // Country list
  const countries = [
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'CA', name: 'Canada', currency: 'CAD' },
    { code: 'AU', name: 'Australia', currency: 'AUD' },
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'DE', name: 'Germany', currency: 'EUR' },
    { code: 'FR', name: 'France', currency: 'EUR' },
    { code: 'JP', name: 'Japan', currency: 'JPY' },
    { code: 'CN', name: 'China', currency: 'CNY' },
    { code: 'BR', name: 'Brazil', currency: 'BRL' },
    { code: 'MX', name: 'Mexico', currency: 'MXN' },
    { code: 'SG', name: 'Singapore', currency: 'SGD' },
    { code: 'MY', name: 'Malaysia', currency: 'MYR' },
  ];

  // Timezone list
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Kuala_Lumpur',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];

  // Date formats
  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2025)' },
    { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Dec 31, 2025)' },
    { value: 'DD MMM YYYY', label: 'DD MMM YYYY (31 Dec 2025)' }
  ];

  // Currency list
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' }
  ];

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accountSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      form.setFieldsValue(parsed);
    } else {
      form.setFieldsValue(settings);
    }
  }, [form]);

  const handleCountryChange = (value) => {
    // Auto-update currency and timezone based on country selection
    const country = countries.find(c => c.code === value);
    if (country) {
      form.setFieldValue('currency', country.currency);
      
      // Set default timezone based on country
      switch(value) {
        case 'US':
          form.setFieldValue('timezone', 'America/New_York');
          form.setFieldValue('dateFormat', 'MM/DD/YYYY');
          break;
        case 'GB':
          form.setFieldValue('timezone', 'Europe/London');
          form.setFieldValue('dateFormat', 'DD/MM/YYYY');
          break;
        case 'MY':
          form.setFieldValue('timezone', 'Asia/Kuala_Lumpur');
          form.setFieldValue('dateFormat', 'DD/MM/YYYY');
          break;
        case 'SG':
          form.setFieldValue('timezone', 'Asia/Singapore');
          form.setFieldValue('dateFormat', 'DD/MM/YYYY');
          break;
        case 'JP':
          form.setFieldValue('timezone', 'Asia/Tokyo');
          form.setFieldValue('dateFormat', 'YYYY-MM-DD');
          break;
        case 'CN':
          form.setFieldValue('timezone', 'Asia/Shanghai');
          form.setFieldValue('dateFormat', 'YYYY-MM-DD');
          break;
        case 'IN':
          form.setFieldValue('timezone', 'Asia/Kolkata');
          form.setFieldValue('dateFormat', 'DD/MM/YYYY');
          break;
        case 'AU':
          form.setFieldValue('timezone', 'Australia/Sydney');
          form.setFieldValue('dateFormat', 'DD/MM/YYYY');
          break;
        case 'CA':
          form.setFieldValue('timezone', 'America/Toronto');
          form.setFieldValue('dateFormat', 'MM/DD/YYYY');
          break;
        case 'BR':
          form.setFieldValue('timezone', 'America/Sao_Paulo');
          form.setFieldValue('dateFormat', 'DD/MM/YYYY');
          break;
        case 'MX':
          form.setFieldValue('timezone', 'America/Mexico_City');
          form.setFieldValue('dateFormat', 'DD/MM/YYYY');
          break;
        case 'DE':
        case 'FR':
          form.setFieldValue('timezone', value === 'DE' ? 'Europe/Berlin' : 'Europe/Paris');
          form.setFieldValue('dateFormat', 'DD/MM/YYYY');
          break;
        default:
          break;
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Save to localStorage
      localStorage.setItem('accountSettings', JSON.stringify(values));
      setSettings(values);
      
      // Update global settings
      window.dispatchEvent(new Event('settingsUpdated'));
      
      message.success('Account settings updated successfully!');
      
    } catch (error) {
      console.error('Error updating settings:', error);
      message.error('Failed to update settings. Please try again.');
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
          Account Settings
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Configure your regional and display preferences
        </Text>
      </div>

      <Row gutter={32}>
        <Col xs={24} lg={16}>
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
              {/* Regional Settings */}
              <div style={{ marginBottom: '32px' }}>
                <Title level={4} style={{ marginBottom: '24px', color: '#333' }}>
                  <GlobalOutlined style={{ marginRight: '8px' }} />
                  Regional Settings
                </Title>
                
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="country"
                      label={
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                          Country
                        </span>
                      }
                      rules={[{ required: true, message: 'Please select your country' }]}
                    >
                      <Select 
                        placeholder="Select your country"
                        onChange={handleCountryChange}
                        style={{ height: '48px' }}
                        showSearch
                        optionFilterProp="children"
                      >
                        {countries.map(country => (
                          <Option key={country.code} value={country.code}>
                            {country.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="timezone"
                      label={
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                          <ClockCircleOutlined style={{ marginRight: '6px' }} />
                          Timezone
                        </span>
                      }
                      rules={[{ required: true, message: 'Please select your timezone' }]}
                    >
                      <Select 
                        placeholder="Select your timezone"
                        style={{ height: '48px' }}
                        showSearch
                        optionFilterProp="children"
                      >
                        {timezones.map(tz => (
                          <Option key={tz} value={tz}>
                            {tz.replace('_', ' ').replace('/', ' / ')}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <Divider style={{ margin: '32px 0' }} />

              {/* Display Preferences */}
              <div style={{ marginBottom: '32px' }}>
                <Title level={4} style={{ marginBottom: '24px', color: '#333' }}>
                  <CalendarOutlined style={{ marginRight: '8px' }} />
                  Display Preferences
                </Title>
                
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="dateFormat"
                      label={
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                          Date Format
                        </span>
                      }
                      rules={[{ required: true, message: 'Please select date format' }]}
                    >
                      <Select 
                        placeholder="Select date format"
                        style={{ height: '48px' }}
                      >
                        {dateFormats.map(format => (
                          <Option key={format.value} value={format.value}>
                            {format.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="currency"
                      label={
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                          <DollarOutlined style={{ marginRight: '6px' }} />
                          Currency
                        </span>
                      }
                      rules={[{ required: true, message: 'Please select currency' }]}
                    >
                      <Select 
                        placeholder="Select currency"
                        style={{ height: '48px' }}
                        showSearch
                        optionFilterProp="children"
                      >
                        {currencies.map(curr => (
                          <Option key={curr.code} value={curr.code}>
                            {curr.code} ({curr.symbol}) - {curr.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </div>

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
                  Save Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Current Settings Summary */}
          <Card 
            style={{ 
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            title={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                Current Settings
              </span>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Country</Text>
                <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
                  {countries.find(c => c.code === settings.country)?.name || 'Not set'}
                </div>
              </div>
              
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Timezone</Text>
                <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
                  {settings.timezone?.replace('_', ' ').replace('/', ' / ')}
                </div>
              </div>
              
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Date Format</Text>
                <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
                  {settings.dateFormat}
                </div>
              </div>
              
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Currency</Text>
                <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
                  {currencies.find(c => c.code === settings.currency)?.name} ({settings.currency})
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AccountSettings;