import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Input, Button, Space, Dropdown, Badge } from 'antd';
import { 
  DashboardOutlined, 
  PlusOutlined, 
  UploadOutlined, 
  BarChartOutlined,
  DownOutlined,
  SearchOutlined,
  FilterOutlined,
  SettingOutlined,
  UserOutlined,
  FileTextOutlined,
  LogoutOutlined,
  ProfileOutlined,
  LeftOutlined,
  RightOutlined,
  ScanOutlined
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import AddExpenseForm from './components/AddExpenseForm';
import ScanReceipt from './components/ScanReceipt';
import BulkUpload from './components/BulkUpload';
import Reports from './components/Reports';
import ExpenseList from './components/ExpenseList';
import ProfileSettings from './components/ProfileSettings';
import AccountSettings from './components/AccountSettings';
import AdvancedSearch from './components/AdvancedSearch';
import { SettingsProvider } from './context/SettingsContext';
import 'antd/dist/reset.css';

const { Header, Sider, Content } = Layout;
const { Search } = Input;

function AppContent() {
  const [collapsed, setCollapsed] = useState(false);
  const [arrowHovered, setArrowHovered] = useState(false);
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [filterCount, setFilterCount] = useState(0);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const logoUrl = "/mettlogo.jpg";
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/" style={{ color: 'inherit' }}>Dashboard</Link>,
    },
    {
      key: '/add-expense',
      icon: <PlusOutlined />,
      label: <Link to="/add-expense" style={{ color: 'inherit' }}>Add Expense</Link>,
    },
    {
      key: '/scan-receipt',
      icon: <ScanOutlined />,
      label: <Link to="/scan-receipt" style={{ color: 'inherit' }}>Scan Receipt</Link>,
    },
    {
      key: '/bulk-upload',
      icon: <UploadOutlined />,
      label: <Link to="/bulk-upload" style={{ color: 'inherit' }}>Bulk Upload</Link>,
    },
    {
      key: '/manage-expenses',
      icon: <FileTextOutlined />,
      label: <Link to="/manage-expenses" style={{ color: 'inherit' }}>Manage Expenses</Link>,
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: <Link to="/reports" style={{ color: 'inherit' }}>Reports</Link>,
    },
  ];

  // Custom CSS for menu hover effects
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Menu item hover effects */
      .ant-menu-item {
        transition: all 0.3s ease !important;
        margin: 4px 8px !important;
        border-radius: 6px !important;
      }
      
      .ant-menu-item:hover {
        background-color: #f5f5f5 !important;
        transform: translateX(4px);
      }
      
      .ant-menu-item-selected {
        background-color: #e8e8e8 !important;
        font-weight: 600;
      }
      
      .ant-menu-item-selected::after {
        display: none !important;
      }
      
      .ant-menu-item a {
        transition: color 0.3s ease !important;
      }
      
      .ant-menu-item:hover a {
        color: #000 !important;
      }
      
      .ant-menu-item .anticon {
        transition: transform 0.3s ease !important;
      }
      
      .ant-menu-item:hover .anticon {
        transform: scale(1.15);
      }

      /* Logo hover effect */
      .logo-container {
        transition: all 0.3s ease !important;
        cursor: pointer;
      }
      
      .logo-container:hover {
        transform: scale(1.05);
        opacity: 0.9;
      }

      /* When sidebar is collapsed */
      .ant-layout-sider-collapsed .ant-menu-item {
        margin: 4px !important;
      }
      
      .ant-layout-sider-collapsed .ant-menu-item:hover {
        transform: scale(1.1);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const profileMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile Settings',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Account Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleProfileClick = ({ key }) => {
    switch(key) {
      case 'profile':
        navigate('/profile-settings');
        break;
      case 'settings':
        navigate('/account-settings');
        break;
      case 'logout':
        // Clear local storage and handle logout
        localStorage.clear();
        console.log('Logout clicked - cleared localStorage');
        // In a real app, redirect to login page
        navigate('/');
        break;
      default:
        break;
    }
  };

  // Handle advanced search
  const handleAdvancedSearch = (filters) => {
    setActiveFilters(filters);
    const count = Object.keys(filters).length;
    setFilterCount(count);
  };

  // Handle fuzzy search
  const handleFuzzySearch = (value) => {
    setGlobalSearchTerm(value);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          position: 'relative'
        }}
      >
        {/* Logo area - centered */}
        <div 
          className="logo-container"
          style={{
            height: '110px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0',
            position: 'relative'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontSize: collapsed ? '16px' : '20px',
            fontWeight: 'bold',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                style={{ 
                  height: collapsed ? '70px' : '100px',
                  width: 'auto',
                  maxWidth: collapsed ? '70px' : '265px',
                  objectFit: 'contain',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }} 
              />
            ) : (
              collapsed ? 'M' : 'Mett'
            )}
          </div>

          {/* Arrow collapse button - positioned at bottom center of logo area */}
          <div
            onMouseEnter={() => setArrowHovered(true)}
            onMouseLeave={() => setArrowHovered(false)}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position: 'absolute',
              bottom: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,  // Very high z-index to ensure it's always on top
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: arrowHovered ? '#333' : '#fff',
              border: `2px solid ${arrowHovered ? '#333' : '#e8e8e8'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease, border-color 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RightOutlined style={{ 
                fontSize: '12px', 
                color: arrowHovered ? '#fff' : '#666',
                transition: 'color 0.3s ease'
              }} />
            </div>
          </div>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={sidebarItems}
          style={{ 
            borderRight: 0,
            background: '#fff',
            marginTop: '20px'  // Add top margin to create space for the arrow
          }}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {/* Centered search controls with proper alignment */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '16px'
          }}>
            <Search
              placeholder="Fuzzy search expenses..."
              allowClear
              style={{ width: 400 }}
              size="middle"
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              onSearch={handleFuzzySearch}
            />
            
            <Badge count={filterCount} offset={[-5, 5]}>
              <Button 
                icon={<FilterOutlined />}
                type="default"
                style={{ 
                  color: '#666',
                  backgroundColor: filterCount > 0 ? '#f0f0f0' : 'transparent'
                }}
                size="middle"
                onClick={() => setAdvancedSearchVisible(true)}
              >
                Advanced Search
              </Button>
            </Badge>
          </div>

          {/* Profile dropdown at far right */}
          <div style={{ position: 'absolute', right: '24px' }}>
            <Dropdown
              menu={{
                items: profileMenuItems,
                onClick: handleProfileClick,
              }}
              trigger={['click']}
            >
              <Button type="text" style={{ color: '#666' }} size="middle">
                <UserOutlined /> Profile <DownOutlined />
              </Button>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ 
          backgroundColor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}>
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  advancedFilters={activeFilters} 
                  searchTerm={globalSearchTerm} 
                />
              } 
            />
            <Route path="/add-expense" element={<AddExpenseForm />} />
            <Route path="/scan-receipt" element={<ScanReceipt />} />
            <Route path="/bulk-upload" element={<BulkUpload />} />
            <Route 
              path="/manage-expenses" 
              element={
                <ExpenseList 
                  advancedFilters={activeFilters} 
                  searchTerm={globalSearchTerm} 
                />
              } 
            />
            <Route 
              path="/reports" 
              element={
                <Reports 
                  advancedFilters={activeFilters} 
                  searchTerm={globalSearchTerm} 
                />
              } 
            />
            <Route path="/profile-settings" element={<ProfileSettings />} />
            <Route path="/account-settings" element={<AccountSettings />} />
          </Routes>
        </Content>
      </Layout>

      {/* Advanced Search Modal */}
      <AdvancedSearch
        visible={advancedSearchVisible}
        onClose={() => setAdvancedSearchVisible(false)}
        onSearch={handleAdvancedSearch}
      />
    </Layout>
  );
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#000',
        },
      }}
    >
      <SettingsProvider>
        <Router>
          <AppContent />
        </Router>
      </SettingsProvider>
    </ConfigProvider>
  );
}

export default App;