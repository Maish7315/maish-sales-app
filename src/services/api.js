// Local storage utilities for front-end only
const USER_AVATAR_KEY = 'maish_user_avatar';
const USER_CREDENTIALS_KEY = 'maish_user_credentials';

// User-specific keys
const getUserSalesKey = (username) => `maish_sales_data_${username}`;
const getUserAvatarKey = (username) => `maish_user_avatar_${username}`;

// IndexedDB utilities for sales data
const DB_NAME = 'MaishSalesDB';
const DB_VERSION = 1;
const SALES_STORE = 'sales';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SALES_STORE)) {
        db.createObjectStore(SALES_STORE, { keyPath: 'id' });
      }
    };
  });
};

const saveSaleToDB = async (sale) => {
  const db = await openDB();
  const transaction = db.transaction([SALES_STORE], 'readwrite');
  const store = transaction.objectStore(SALES_STORE);
  store.put(sale);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const getSalesFromDB = async (username) => {
  const db = await openDB();
  const transaction = db.transaction([SALES_STORE], 'readonly');
  const store = transaction.objectStore(SALES_STORE);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const allSales = request.result;
      const userSales = allSales.filter(sale => sale.username === username);
      resolve(userSales);
    };
    request.onerror = () => reject(request.error);
  });
};

const replaceUserSalesInDB = async (username, sales) => {
  const db = await openDB();
  const transaction = db.transaction([SALES_STORE], 'readwrite');
  const store = transaction.objectStore(SALES_STORE);

  // Delete all sales for the user
  const allRequest = store.getAll();
  allRequest.onsuccess = () => {
    const allSales = allRequest.result;
    const userSales = allSales.filter(sale => sale.username === username);
    userSales.forEach(sale => store.delete(sale.id));
  };

  // Add the new sales
  sales.forEach(sale => store.put(sale));

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const saveSaleLocally = async (saleData, receiptFile, username) => {
  try {
    // Convert image to base64 if present
    let imageData = null;
    if (receiptFile) {
      imageData = await fileToBase64(receiptFile);
    }

    const newSale = {
      id: Date.now(),
      username: username,
      item_description: saleData.itemName,
      amount_cents: Math.round(parseFloat(saleData.amount) * 100),
      commission_cents: Math.round(parseFloat(saleData.amount) * 100 * 0.02), // 2% commission
      timestamp: new Date().toISOString(),
      photo_path: imageData,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    await saveSaleToDB(newSale);

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

// Password hashing utility
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// User credentials management
export const saveUserCredentials = async (username, password, idNumber) => {
  try {
    const hashedPassword = await hashPassword(password);
    const credentials = { username, password: hashedPassword, idNumber };
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

export const validateUserCredentials = async (username, password) => {
  const credentials = getUserCredentials();
  if (!credentials) return false;

  if (credentials.username !== username) return false;

  const hashedPassword = await hashPassword(password);
  return credentials.password === hashedPassword;
};

export const isWeakPassword = (password) => {
  const weakPasswords = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'];
  return weakPasswords.includes(password);
};

export const resetPassword = async (idNumber, newPassword) => {
  const credentials = getUserCredentials();
  if (!credentials || credentials.idNumber !== idNumber) {
    throw new Error('Invalid ID number');
  }

  // Update password
  const success = await saveUserCredentials(credentials.username, newPassword, idNumber);
  if (!success) {
    throw new Error('Failed to reset password');
  }

  return { success: true, message: 'Password reset successfully' };
};

// Authentication functions
export const signup = async (data) => {
  // Check if user already exists
  const existingCredentials = getUserCredentials();
  if (existingCredentials && existingCredentials.username === data.username) {
    throw new Error('Username already exists');
  }

  // Save credentials with ID number
  const success = await saveUserCredentials(data.username, data.password, data.idNumber);
  if (!success) {
    throw new Error('Failed to create account');
  }

  return { success: true, message: 'Account created successfully' };
};

export const login = async (data) => {
  // Validate password format
  if (!/^\d+$/.test(data.password)) {
    throw new Error('Password must contain only numbers');
  }

  // Check if any user exists
  const existingCredentials = getUserCredentials();
  if (!existingCredentials) {
    throw new Error('No account found. Please create an account first.');
  }

  // Validate credentials against stored data
  const isValid = await validateUserCredentials(data.username, data.password);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  return { success: true, message: 'Login successful' };
};

export const createSale = async (saleData, receiptFile) => {
  return await saveSaleLocally(saleData, receiptFile);
};

export const getSales = async (username) => {
  // Return sales from IndexedDB for the user
  return await getSalesFromDB(username);
};

export const replaceUserSales = async (username, sales) => {
  return await replaceUserSalesInDB(username, sales);
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