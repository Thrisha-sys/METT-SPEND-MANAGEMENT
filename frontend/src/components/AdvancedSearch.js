// Create new file: frontend/src/components/AdvancedSearch.js

import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Button, 
  Space,
  Row,
  Col,
  Tag,
  Divider
} from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AdvancedSearch = ({ visible, onClose, onSearch }) => {
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState([]);

  // Condition options for text fields
  const textConditions = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'notContains', label: 'Does not contain' }
  ];

  // Condition options for number fields
  const numberConditions = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'between', label: 'Between' }
  ];

  const handleSearch = () => {
    form.validateFields().then(values => {
      // Build filter object
      const filters = {};
      
      // Vendor filter
      if (values.vendorValue) {
        filters.vendor = {
          condition: values.vendorCondition || 'contains',
          value: values.vendorValue
        };
      }

      // Category filter
      if (values.categories && values.categories.length > 0) {
        filters.category = {
          condition: 'oneOf',
          value: values.categories
        };
      }

      // Amount filter
      if (values.amountValue !== undefined) {
        filters.amount = {
          condition: values.amountCondition || 'equals',
          value: values.amountValue,
          valueTo: values.amountValueTo // For between condition
        };
      }

      // Date range filter
      if (values.dateRange && values.dateRange.length === 2) {
        filters.dateRange = {
          from: values.dateRange[0].format('YYYY-MM-DD'),
          to: values.dateRange[1].format('YYYY-MM-DD')
        };
      }

      // Notes filter
      if (values.notesValue) {
        filters.notes = {
          condition: values.notesCondition || 'contains',
          value: values.notesValue
        };
      }

      // Created by filter (for future multi-user support)
      if (values.createdBy) {
        filters.createdBy = {
          value: values.createdBy
        };
      }

      // Update active filters display
      const filterTags = [];
      Object.keys(filters).forEach(key => {
        if (key === 'dateRange') {
          filterTags.push(`Date: ${filters[key].from} to ${filters[key].to}`);
        } else if (key === 'category') {
          filterTags.push(`Category: ${filters[key].value.join(', ')}`);
        } else {
          filterTags.push(`${key}: ${filters[key].value}`);
        }
      });
      setActiveFilters(filterTags);

      // Call parent search function
      onSearch(filters);
      onClose();
    });
  };

  const handleClear = () => {
    form.resetFields();
    setActiveFilters([]);
    onSearch({});
  };

  return (
    <Modal
      title={
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#000' }}>
          Advanced Search
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="clear" onClick={handleClear} icon={<ClearOutlined />}>
          Clear All
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="search" 
          type="primary" 
          onClick={handleSearch}
          icon={<SearchOutlined />}
          style={{ backgroundColor: '#333', borderColor: '#333' }}
        >
          Search
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: '16px' }}
      >
        {/* Vendor Search */}
        <Divider orientation="left" style={{ color: '#666', fontSize: '14px' }}>
          Vendor Information
        </Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="vendorCondition" initialValue="contains">
              <Select placeholder="Select condition">
                {textConditions.map(cond => (
                  <Option key={cond.value} value={cond.value}>{cond.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item name="vendorValue">
              <Input placeholder="Enter vendor name" />
            </Form.Item>
          </Col>
        </Row>

        {/* Category Filter */}
        <Divider orientation="left" style={{ color: '#666', fontSize: '14px' }}>
          Category
        </Divider>
        <Form.Item name="categories">
          <Select
            mode="multiple"
            placeholder="Select categories"
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
        </Form.Item>

        {/* Amount Filter */}
        <Divider orientation="left" style={{ color: '#666', fontSize: '14px' }}>
          Amount
        </Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="amountCondition" initialValue="equals">
              <Select 
                placeholder="Select condition"
                onChange={(value) => {
                  // Clear second value if not between
                  if (value !== 'between') {
                    form.setFieldsValue({ amountValueTo: undefined });
                  }
                }}
              >
                {numberConditions.map(cond => (
                  <Option key={cond.value} value={cond.value}>{cond.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="amountValue">
              <InputNumber
                placeholder="Amount"
                prefix="$"
                style={{ width: '100%' }}
                min={0}
                precision={2}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.amountCondition !== currentValues.amountCondition
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('amountCondition') === 'between' ? (
                  <Form.Item name="amountValueTo">
                    <InputNumber
                      placeholder="To amount"
                      prefix="$"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Col>
        </Row>

        {/* Date Range Filter */}
        <Divider orientation="left" style={{ color: '#666', fontSize: '14px' }}>
          Date Range
        </Divider>
        <Form.Item name="dateRange">
          <RangePicker 
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            presets={[
              { label: 'Last 7 Days', value: [moment().subtract(7, 'days'), moment()] },
              { label: 'Last 30 Days', value: [moment().subtract(30, 'days'), moment()] },
              { label: 'This Month', value: [moment().startOf('month'), moment().endOf('month')] },
              { label: 'Last Month', value: [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')] },
              { label: 'This Year', value: [moment().startOf('year'), moment()] }
            ]}
          />
        </Form.Item>

        {/* Notes Search */}
        <Divider orientation="left" style={{ color: '#666', fontSize: '14px' }}>
          Notes
        </Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="notesCondition" initialValue="contains">
              <Select placeholder="Select condition">
                {textConditions.map(cond => (
                  <Option key={cond.value} value={cond.value}>{cond.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item name="notesValue">
              <Input placeholder="Enter notes text" />
            </Form.Item>
          </Col>
        </Row>

        {/* Created By (for future use) */}
        <Divider orientation="left" style={{ color: '#666', fontSize: '14px' }}>
          Created By
        </Divider>
        <Form.Item name="createdBy">
          <Input placeholder="Enter user name (for future multi-user support)" disabled />
        </Form.Item>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <>
            <Divider orientation="left" style={{ color: '#666', fontSize: '14px' }}>
              Active Filters
            </Divider>
            <div style={{ marginBottom: '16px' }}>
              <Space wrap>
                {activeFilters.map((filter, index) => (
                  <Tag 
                    key={index} 
                    style={{ 
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #d9d9d9',
                      color: '#333'
                    }}
                  >
                    {filter}
                  </Tag>
                ))}
              </Space>
            </div>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default AdvancedSearch;