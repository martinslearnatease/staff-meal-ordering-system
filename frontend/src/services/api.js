import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getTodayOrder: () => api.get('/orders/today'),
  updateOrder: (id, data) => api.put(`/orders/${id}`, data),
  getOrderHistory: (params) => api.get('/orders/history', { params }),
};

export const chefAPI = {
  getAllOrders: (params) => api.get('/chef/orders', { params }),
  getKitchenSummary: () => api.get('/chef/orders/summary'),
  searchOrders: (q) => api.get('/chef/orders/search', { params: { q } }),
  updateOrderStatus: (id, status) => api.put(`/chef/orders/${id}/status`, { status }),
  deleteOrder: (id) => api.delete(`/chef/orders/${id}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (key, value) => api.put('/admin/settings', { key, value }),
  generateReport: (params) => api.get('/admin/reports', { params }),
};

export default api;
