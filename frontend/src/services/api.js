import axios from 'axios';
 
// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
 
// API service functions
export const apiService = {
  // Test connection
  testConnection: () => API.get('/test'),
  
  // Spends - Complete CRUD operations
  getSpends: () => API.get('/spends'),
  addSpend: (spendData) => API.post('/spends', spendData),
  getSpend: (id) => API.get(`/spends/${id}`),
  updateSpend: (id, spendData) => API.put(`/spends/${id}`, spendData),
  deleteSpend: (id) => API.delete(`/spends/${id}`),
  
  // Upload
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return API.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Reports
  getSummary: (params = {}) => API.get('/reports/summary', { params }),
  getCategories: () => API.get('/reports/categories'),
};
 
export default apiService;