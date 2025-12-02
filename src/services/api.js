// Local storage utilities for front-end only
const USER_AVATAR_KEY = 'maish_user_avatar';
const USER_CREDENTIALS_KEY = 'maish_user_credentials';

// User-specific keys
const getUserSalesKey = (username) => `maish_sales_data_${username}`;
const getUserAvatarKey = (username) => `maish_user_avatar_${username}`;

export const saveSaleLocally = async (saleData, receiptFile, username) => {
  try {
    const sales = getSalesFromStorage(username);

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
    localStorage.setItem(getUserSalesKey(username), JSON.stringify(sales));

    return newSale;
  } catch (error) {
    throw new Error('Failed to save sale locally');
  }
};

export const getSalesFromStorage = (username) => {
  try {
    const stored = localStorage.getItem(getUserSalesKey(username));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading sales from storage:', error);
    return [];
  }
};

export const cleanupOldSales = (username) => {
  try {
    const sales = getSalesFromStorage(username);
    const cutoffTime = Date.now() - (48 * 60 * 60 * 1000); // 48 hours ago

    const filteredSales = sales.filter(sale => {
      const saleTime = new Date(sale.created_at).getTime();
      return saleTime > cutoffTime;
    });

    if (filteredSales.length !== sales.length) {
      localStorage.setItem(getUserSalesKey(username), JSON.stringify(filteredSales));
      console.log(`Cleaned up ${sales.length - filteredSales.length} old sales for ${username}`);
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

// Avatar management functions
export const saveUserAvatar = async (avatarFile, username) => {
  try {
    const avatarData = await fileToBase64(avatarFile);
    localStorage.setItem(getUserAvatarKey(username), avatarData);
    return avatarData;
  } catch (error) {
    throw new Error('Failed to save avatar');
  }
};

export const getUserAvatar = (username) => {
  try {
    return localStorage.getItem(getUserAvatarKey(username));
  } catch (error) {
    console.error('Error loading avatar:', error);
    return null;
  }
};

export const removeUserAvatar = (username) => {
  try {
    localStorage.removeItem(getUserAvatarKey(username));
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

// Mock authentication functions for front-end only
export const signup = async (data) => {
  // Mock signup - don't save credentials persistently
  return { success: true, message: 'Account created successfully' };
};

export const login = async (data) => {
  // Mock login - just validate format, don't check stored credentials
  if (!/^\d+$/.test(data.password)) {
    throw new Error('Password must contain only numbers');
  }
  // For front-end only, accept any valid format
  return { success: true, message: 'Login successful' };
};

export const createSale = async (saleData, receiptFile) => {
  return await saveSaleLocally(saleData, receiptFile);
};

export const getSales = async (username) => {
  // Return sales from local storage for the user
  return getSalesFromStorage(username);
};

export const checkHealth = async () => {
  // Mock health check - always healthy for front-end only
  return { status: 'healthy', message: 'Front-end only mode' };
};

// Logout function
export const logout = () => {
  // Only clear session data, keep user data for persistence
  localStorage.removeItem('token');
  // Don't clear sales data, avatars, or credentials - they should persist
  // Don't redirect here, let AuthContext handle it
};

// Check if user is authenticated (not used anymore, AuthContext handles this)
export const isAuthenticated = () => {
  return false; // Always false since we don't persist auth
};