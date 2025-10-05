// frontend/src/components/AdvancedSearchWrapper.js

import React, { useState } from 'react';
import { Switch, Space, Typography, Tooltip } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import AdvancedSearch from './AdvancedSearch';
import AdvancedSearchSyncfusion from './AdvancedSearchSyncfusion';

const { Text } = Typography;

const AdvancedSearchWrapper = ({ visible, onClose, onSearch }) => {
  // Get preference from localStorage, default to false (use old implementation)
  const [useSyncfusion, setUseSyncfusion] = useState(
    localStorage.getItem('useQueryBuilder') === 'true'
  );

  const handleToggle = (checked) => {
    setUseSyncfusion(checked);
    localStorage.setItem('useQueryBuilder', checked ? 'true' : 'false');
  };

  // Toggle UI - only show when modal is open
  const toggleUI = visible ? (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1001,
      backgroundColor: 'white',
      padding: '10px',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #d9d9d9'
    }}>
      <Space align="center">
        <ExperimentOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
        <Text>Query Builder Mode:</Text>
        <Tooltip title={useSyncfusion ? 'Using Syncfusion Query Builder' : 'Using Original Search'}>
          <Switch 
            checked={useSyncfusion}
            onChange={handleToggle}
            checkedChildren="New"
            unCheckedChildren="Old"
          />
        </Tooltip>
      </Space>
    </div>
  ) : null;

  return (
    <>
      {toggleUI}
      {useSyncfusion ? (
        <AdvancedSearchSyncfusion 
          visible={visible}
          onClose={onClose}
          onSearch={onSearch}
        />
      ) : (
        <AdvancedSearch 
          visible={visible}
          onClose={onClose}
          onSearch={onSearch}
        />
      )}
    </>
  );
};

export default AdvancedSearchWrapper;