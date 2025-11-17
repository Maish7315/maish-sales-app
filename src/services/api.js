const API_BASE_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL;

// Local storage utilities for development
const SALES_STORAGE_KEY = 'maish_sales_data';
const USER_AVATAR_KEY = 'maish_user_avatar';
const USER_CREDENTIALS_KEY = 'maish_user_credentials';

export const saveSaleLocally = async (saleData, receiptFile) => {
  try {
    const sales = getSalesFromStorage();

    // Convert image to base64 if present
    let imageData = null;
    if (receiptFile) {
      imageData = await fileToBase64(receiptFile);
    }

    const newSale = {
      id: Date.now(),
      user_id: 1, // Mock user ID
      item_description: saleData.itemName,
      amount_cents: Math.round(parseFloat(saleData.amount) * 100),
      commission_cents: Math.round(parseFloat(saleData.amount) * 100 * 0.02), // 2% commission
      timestamp: new Date().toISOString(),
      photo_path: imageData,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    sales.push(newSale);
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));

    return newSale;
  } catch (error) {
    throw new Error('Failed to save sale locally');
  }
};

export const getSalesFromStorage = () => {
  try {
    const stored = localStorage.getItem(SALES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading sales from storage:', error);
    return [];
  }
};

export const cleanupOldSales = () => {
  try {
    const sales = getSalesFromStorage();
    const cutoffTime = Date.now() - (48 * 60 * 60 * 1000); // 48 hours ago

    const filteredSales = sales.filter(sale => {
      const saleTime = new Date(sale.created_at).getTime();
      return saleTime > cutoffTime;
    });

    if (filteredSales.length !== sales.length) {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(filteredSales));
      console.log(`Cleaned up ${sales.length - filteredSales.length} old sales`);
    }
  } catch (error) {
    console.error('Error cleaning up old sales:', error);
  }
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Sync local sales to backend when available
export const syncLocalSalesToBackend = async () => {
  try {
    const localSales = getSalesFromStorage();
    if (localSales.length === 0) return;

    console.log(`Attempting to sync ${localSales.length} local sales to backend...`);

    for (const sale of localSales) {
      try {
        // Convert base64 back to blob for upload
        let receiptFile = null;
        if (sale.photo_path && sale.photo_path.startsWith('data:image/')) {
          receiptFile = await base64ToFile(sale.photo_path, `receipt-${sale.id}.jpg`);
        }

        // Upload to backend
        await createSale({
          itemName: sale.item_description,
          amount: (sale.amount_cents / 100).toString(),
        }, receiptFile);

        console.log(`Synced sale: ${sale.item_description}`);
      } catch (error) {
        console.error(`Failed to sync sale ${sale.id}:`, error);
        // Continue with other sales even if one fails
      }
    }

    // Clear local storage after successful sync
    localStorage.removeItem(SALES_STORAGE_KEY);
    console.log('Local sales synced and cleared from storage');

  } catch (error) {
    console.error('Error syncing sales to backend:', error);
    throw error;
  }
};

const base64ToFile = (base64String, filename) => {
  return new Promise((resolve) => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    resolve(new File([u8arr], filename, { type: mime }));
  });
};

// Avatar management functions
export const saveUserAvatar = async (avatarFile) => {
  try {
    const avatarData = await fileToBase64(avatarFile);
    localStorage.setItem(USER_AVATAR_KEY, avatarData);
    return avatarData;
  } catch (error) {
    throw new Error('Failed to save avatar');
  }
};

export const getUserAvatar = () => {
  try {
    return localStorage.getItem(USER_AVATAR_KEY);
  } catch (error) {
    console.error('Error loading avatar:', error);
    return null;
  }
};

export const removeUserAvatar = () => {
  try {
    localStorage.removeItem(USER_AVATAR_KEY);
  } catch (error) {
    console.error('Error removing avatar:', error);
  }
};

// User credentials management
export const saveUserCredentials = (username, password) => {
  try {
    const credentials = { username, password };
    localStorage.setItem(USER_CREDENTIALS_KEY, JSON.stringify(credentials));
    return true;
  } catch (error) {
    console.error('Error saving user credentials:', error);
    return false;
  }
};

export const getUserCredentials = () => {
  try {
    const stored = localStorage.getItem(USER_CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading user credentials:', error);
    return null;
  }
};

export const validateUserCredentials = (username, password) => {
  const credentials = getUserCredentials();
  if (!credentials) return false;

  return credentials.username === username && credentials.password === password;
};

export const isWeakPassword = (password) => {
  const weakPasswords = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'];
  return weakPasswords.includes(password);
};

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('token');

// Helper function to handle API responses
const handleResponse = async (response) => {
  console.log('API Response:', response.status, response.statusText, response.url);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Token expired or invalid, clear it and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      console.log('Error response data:', errorData);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      console.log('Could not parse error response:', e);
      const text = await response.text().catch(() => '');
      if (text) {
        console.log('Error response text:', text);
        errorMessage = text;
      }
    }

    throw new Error(errorMessage);
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

  return fetch(`${API_BASE_URL}/api${url}`, {
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
    return await authRequest('/sales/getSales');
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