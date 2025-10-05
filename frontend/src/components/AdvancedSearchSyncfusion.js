// frontend/src/components/AdvancedSearchSyncfusion.js

import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Tag, Alert } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { QueryBuilderComponent } from '@syncfusion/ej2-react-querybuilder';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { useSettings } from '../context/SettingsContext';
import moment from 'moment';

// Import Syncfusion CSS
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-splitbuttons/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-calendars/styles/material.css';
import '@syncfusion/ej2-querybuilder/styles/material.css';

const AdvancedSearchSyncfusion = ({ visible, onClose, onSearch }) => {
  const { getCurrencySymbol, settings } = useSettings();
  const [queryBuilder, setQueryBuilder] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [currentRule, setCurrentRule] = useState(null);

  // Define columns (fields) for the query builder
  const columns = [
    { 
      field: 'vendor', 
      label: 'Vendor', 
      type: 'string',
      operators: [
        { key: 'equal', value: 'equal' },
        { key: 'notequal', value: 'notequal' },
        { key: 'contains', value: 'contains' },
        { key: 'notcontains', value: 'notcontains' },
        { key: 'startswith', value: 'startswith' },
        { key: 'endswith', value: 'endswith' }
      ]
    },
    { 
      field: 'amount', 
      label: 'Amount', 
      type: 'number',
      format: 'N2',
      step: 0.01,
      operators: [
        { key: 'equal', value: 'equal' },
        { key: 'notequal', value: 'notequal' },
        { key: 'lessthan', value: 'lessthan' },
        { key: 'lessthanorequal', value: 'lessthanorequal' },
        { key: 'greaterthan', value: 'greaterthan' },
        { key: 'greaterthanorequal', value: 'greaterthanorequal' },
        { key: 'between', value: 'between' },
        { key: 'notbetween', value: 'notbetween' }
      ]
    },
    { 
      field: 'date', 
      label: 'Date', 
      type: 'date',
      format: 'dd/MM/yyyy',
      operators: [
        { key: 'equal', value: 'equal' },
        { key: 'notequal', value: 'notequal' },
        { key: 'lessthan', value: 'lessthan' },
        { key: 'lessthanorequal', value: 'lessthanorequal' },
        { key: 'greaterthan', value: 'greaterthan' },
        { key: 'greaterthanorequal', value: 'greaterthanorequal' },
        { key: 'between', value: 'between' },
        { key: 'notbetween', value: 'notbetween' }
      ]
    },
    { 
      field: 'category', 
      label: 'Category', 
      type: 'string',
      values: ['Food', 'Transport', 'Entertainment', 'Office', 'Shopping', 'Health', 'Bills', 'Other'],
      operators: [
        { key: 'equal', value: 'equal' },
        { key: 'notequal', value: 'notequal' },
        { key: 'in', value: 'in' },
        { key: 'notin', value: 'notin' }
      ]
    },
    { 
      field: 'notes', 
      label: 'Notes', 
      type: 'string',
      operators: [
        { key: 'equal', value: 'equal' },
        { key: 'notequal', value: 'notequal' },
        { key: 'contains', value: 'contains' },
        { key: 'notcontains', value: 'notcontains' },
        { key: 'startswith', value: 'startswith' },
        { key: 'endswith', value: 'endswith' }
      ]
    },
    {
      field: 'recordId',
      label: 'Record ID',
      type: 'string',
      operators: [
        { key: 'equal', value: 'equal' },
        { key: 'notequal', value: 'notequal' },
        { key: 'contains', value: 'contains' },
        { key: 'startswith', value: 'startswith' }
      ]
    }
  ];

  // Convert Query Builder rules to your filter format
  const convertRulesToFilters = (rules) => {
    if (!rules || !rules.rules || rules.rules.length === 0) {
      return {};
    }

    const filters = {};
    
    const processRule = (rule) => {
      if (rule.condition) {
        // It's a group, process recursively
        const groupFilters = [];
        rule.rules.forEach(subRule => {
          const result = processRule(subRule);
          if (result) {
            groupFilters.push(result);
          }
        });
        return {
          condition: rule.condition.toLowerCase(), // 'and' or 'or'
          filters: groupFilters
        };
      } else {
        // It's a rule
        const field = rule.field;
        const operator = rule.operator;
        const value = rule.value;

        // Handle different field types
        switch (field) {
          case 'vendor':
          case 'notes':
          case 'recordId':
            return {
              field,
              condition: operator,
              value: value
            };
          
          case 'amount':
            if (operator === 'between' || operator === 'notbetween') {
              return {
                field,
                condition: operator,
                value: value[0],
                valueTo: value[1]
              };
            }
            return {
              field,
              condition: operator,
              value: parseFloat(value)
            };
          
          case 'date':
            if (operator === 'between' || operator === 'notbetween') {
              return {
                field,
                condition: operator,
                value: moment(value[0]).format('YYYY-MM-DD'),
                valueTo: moment(value[1]).format('YYYY-MM-DD')
              };
            }
            return {
              field,
              condition: operator,
              value: moment(value).format('YYYY-MM-DD')
            };
          
          case 'category':
            if (operator === 'in' || operator === 'notin') {
              return {
                field,
                condition: operator,
                value: Array.isArray(value) ? value : [value]
              };
            }
            return {
              field,
              condition: operator,
              value: value
            };
          
          default:
            return null;
        }
      }
    };

    const result = processRule(rules);
    
    // Convert to the expected format
    if (result) {
      if (result.condition === 'and' || result.condition === 'or') {
        filters.logicalOperator = result.condition;
        filters.conditions = result.filters;
      } else {
        // Single rule
        filters[result.field] = {
          condition: result.condition,
          value: result.value,
          valueTo: result.valueTo
        };
      }
    }

    return filters;
  };

  const handleSearch = () => {
    if (!queryBuilder) return;
    
    const rules = queryBuilder.getRules();
    console.log('Query Builder Rules:', rules);
    
    const filters = convertRulesToFilters(rules);
    console.log('Converted Filters:', filters);
    
    // Build active filter tags
    const filterTags = [];
    if (filters.conditions) {
      // Complex query with multiple conditions
      filterTags.push(`Complex query with ${filters.conditions.length} conditions (${filters.logicalOperator.toUpperCase()})`);
    } else {
      // Simple filters
      Object.keys(filters).forEach(key => {
        if (key !== 'logicalOperator') {
          const filter = filters[key];
          if (filter.valueTo) {
            filterTags.push(`${key}: ${filter.value} to ${filter.valueTo}`);
          } else if (Array.isArray(filter.value)) {
            filterTags.push(`${key}: ${filter.value.join(', ')}`);
          } else {
            filterTags.push(`${key} ${filter.condition} ${filter.value}`);
          }
        }
      });
    }
    
    setActiveFilters(filterTags);
    onSearch(filters);
    onClose();
  };

  const handleClear = () => {
    if (queryBuilder) {
      queryBuilder.reset();
      setActiveFilters([]);
      onSearch({});
    }
  };

  const handleRuleChange = (args) => {
    console.log('Rule changed:', args);
    setCurrentRule(args.rule);
  };

  return (
    <Modal
      title={
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#000' }}>
          Advanced Search - Query Builder
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      bodyStyle={{ padding: '20px' }}
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
          Apply Search
        </Button>
      ]}
    >
      {/* Instructions */}
      <Alert
        message="Query Builder Instructions"
        description={
          <div>
            <p>• Use <strong>AND</strong> to require all conditions to match</p>
            <p>• Use <strong>OR</strong> to match any of the conditions</p>
            <p>• Click <strong>+ Add Rule</strong> to add a new condition</p>
            <p>• Click <strong>+ Add Group</strong> to create nested conditions</p>
            <p>• Amount values should be entered without currency symbols</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />

      {/* Query Builder Component */}
      <div style={{ 
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        padding: '15px',
        backgroundColor: '#fafafa'
      }}>
        <QueryBuilderComponent
          ref={(scope) => setQueryBuilder(scope)}
          columns={columns}
          rule={{
            condition: 'and',
            rules: []
          }}
          ruleChange={handleRuleChange}
          locale='en-US'
          enableNotCondition={true}
          showButtons={{
            ruleDelete: true,
            groupDelete: true,
            groupInsert: true
          }}
          displayMode='Vertical'
          summaryView={false}
          allowValidation={true}
          width='100%'
        />
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '10px' }}>Active Filters:</h4>
          <Space wrap>
            {activeFilters.map((filter, index) => (
              <Tag 
                key={index}
                style={{ 
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #d9d9d9',
                  color: '#333',
                  padding: '4px 8px'
                }}
              >
                {filter}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Query Preview */}
      {currentRule && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '10px' }}>Query Preview:</h4>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(currentRule, null, 2)}
          </pre>
        </div>
      )}
    </Modal>
  );
};

export default AdvancedSearchSyncfusion;