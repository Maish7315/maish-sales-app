const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('token');

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Token expired or invalid, clear it and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
};

// Helper function to make authenticated requests
const authRequest = (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  }).then(handleResponse);
};

// API functions
export const signup = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);

    if (result.token) {
      localStorage.setItem('token', result.token);
    }

    return result;
  } catch (error) {
    throw error;
  }
};

export const login = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);

    if (result.token) {
      localStorage.setItem('token', result.token);
    }

    return result;
  } catch (error) {
    throw error;
  }
};

export const createSale = async (saleData, receiptFile) => {
  try {
    const formData = new FormData();
    formData.append('item_description', saleData.item_description || saleData.itemName);
    formData.append('amount', saleData.amount);

    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/sales/createSale`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
};

export const getSales = async () => {
  try {
    return await authRequest('/api/sales/getSales');
  } catch (error) {
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// Logout function
export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};