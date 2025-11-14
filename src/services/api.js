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
  // Mock signup for frontend-only testing
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockToken = btoa(JSON.stringify({ id: 1, username: data.username, role: 'staff' }));
      localStorage.setItem('token', mockToken);
      resolve({ token: mockToken, user: { id: 1, username: data.username, role: 'staff' } });
    }, 1000);
  });
};

export const login = async (data) => {
  // Mock login for frontend-only testing
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockToken = btoa(JSON.stringify({ id: 1, username: data.username, role: 'staff' }));
      localStorage.setItem('token', mockToken);
      resolve({ token: mockToken, user: { id: 1, username: data.username, role: 'staff' } });
    }, 1000);
  });
};

export const createSale = async (saleData, receiptFile) => {
  // Mock createSale for frontend-only testing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Date.now(),
        item_description: saleData.item_description || saleData.itemName,
        amount: saleData.amount,
        commission: saleData.amount * 0.02,
        created_at: new Date().toISOString()
      });
    }, 1000);
  });
};

export const getSales = async () => {
  // Mock getSales for frontend-only testing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          item_description: 'Sample Dress',
          amount: 2500,
          commission: 50,
          created_at: new Date().toISOString()
        }
      ]);
    }, 500);
  });
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