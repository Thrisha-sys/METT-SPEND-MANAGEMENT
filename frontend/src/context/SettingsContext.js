// frontend/src/context/SettingsContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import moment from 'moment';

const SettingsContext = createContext();

// Currency configuration
const currencyConfig = {
  USD: { symbol: '$', code: 'USD', position: 'before', decimal: '.', thousand: ',' },
  EUR: { symbol: '€', code: 'EUR', position: 'before', decimal: ',', thousand: '.' },
  GBP: { symbol: '£', code: 'GBP', position: 'before', decimal: '.', thousand: ',' },
  JPY: { symbol: '¥', code: 'JPY', position: 'before', decimal: '', thousand: ',' },
  CNY: { symbol: '¥', code: 'CNY', position: 'before', decimal: '.', thousand: ',' },
  INR: { symbol: '₹', code: 'INR', position: 'before', decimal: '.', thousand: ',' },
  CAD: { symbol: 'C$', code: 'CAD', position: 'before', decimal: '.', thousand: ',' },
  AUD: { symbol: 'A$', code: 'AUD', position: 'before', decimal: '.', thousand: ',' },
  BRL: { symbol: 'R$', code: 'BRL', position: 'before', decimal: ',', thousand: '.' },
  MXN: { symbol: '$', code: 'MXN', position: 'before', decimal: '.', thousand: ',' },
  SGD: { symbol: 'S$', code: 'SGD', position: 'before', decimal: '.', thousand: ',' },
  MYR: { symbol: 'RM', code: 'MYR', position: 'before', decimal: '.', thousand: ',' }
};

// Date format configurations
const dateFormats = {
  'MM/DD/YYYY': 'MM/DD/YYYY',
  'DD/MM/YYYY': 'DD/MM/YYYY',
  'YYYY-MM-DD': 'YYYY-MM-DD',
  'DD-MM-YYYY': 'DD-MM-YYYY',
  'MMM DD, YYYY': 'MMM DD, YYYY',
  'DD MMM YYYY': 'DD MMM YYYY'
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York',
    country: 'US'
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accountSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const savedSettings = localStorage.getItem('accountSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
        } catch (error) {
          console.error('Error updating settings:', error);
        }
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  // Format currency based on settings
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    
    const config = currencyConfig[settings.currency] || currencyConfig.USD;
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return '-';
    
    // Format the number
    let formatted = numAmount.toFixed(2);
    
    // Apply thousand separators
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousand);
    
    // Apply decimal separator
    formatted = config.decimal ? parts.join(config.decimal) : parts[0];
    
    // Add currency symbol
    if (config.position === 'before') {
      return `${config.symbol}${formatted}`;
    } else {
      return `${formatted}${config.symbol}`;
    }
  };

  // Format date based on settings
  const formatDate = (date, includeTime = false) => {
    if (!date) return '-';
    
    const format = dateFormats[settings.dateFormat] || dateFormats['MM/DD/YYYY'];
    const momentDate = moment(date);
    
    if (!momentDate.isValid()) return '-';
    
    if (includeTime) {
      return momentDate.format(`${format} HH:mm`);
    }
    
    return momentDate.format(format);
  };

  // Format date for display (uses the actual selected format)
  const formatDateShort = (date) => {
    if (!date) return '-';
    
    const momentDate = moment(date);
    if (!momentDate.isValid()) return '-';
    
    // Use the actual selected date format from settings
    const format = dateFormats[settings.dateFormat] || dateFormats['MM/DD/YYYY'];
    return momentDate.format(format);
  };

  // Get the date format string for DatePicker components
  const formatDateFull = dateFormats[settings.dateFormat] || 'MM/DD/YYYY';

  // Get currency symbol
  const getCurrencySymbol = () => {
    const config = currencyConfig[settings.currency] || currencyConfig.USD;
    return config.symbol;
  };

  // Parse currency input
  const parseCurrencyInput = (value) => {
    if (!value) return 0;
    const stringValue = value.toString();
    // Remove all non-numeric characters except decimal point
    const cleaned = stringValue.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const value = {
    settings,
    formatCurrency,
    formatDate,
    formatDateShort,
    formatDateFull,  // Added this for DatePicker components
    getCurrencySymbol,
    parseCurrencyInput,
    currencyConfig: currencyConfig[settings.currency] || currencyConfig.USD
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};