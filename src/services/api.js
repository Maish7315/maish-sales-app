// Supabase client
import { supabase } from '@/lib/supabase';

// Legacy local storage utilities (for migration)
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Delete existing avatar first (if any)
    try {
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(file => `${user.id}/${file.name}`);
        await supabase.storage
          .from('avatars')
          .remove(filesToDelete);
      }
    } catch (deleteError) {
      console.warn('Failed to delete old avatar:', deleteError);
      // Continue with upload even if delete fails
    }

    // Upload new avatar to Supabase Storage
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, {
        cacheControl: '3600',
        upsert: true // Allow overwriting existing avatar
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Profile update failed: ${updateError.message}`);
    }

    return publicUrl;
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
};

export const getUserAvatar = async (username) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;
    return data.avatar_url;
  } catch (error) {
    console.error('Error loading avatar:', error);
    return null;
  }
};

export const removeUserAvatar = async (username) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Delete avatar from storage
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(file => `${user.id}/${file.name}`);
      await supabase.storage
        .from('avatars')
        .remove(filesToDelete);
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to remove avatar: ${updateError.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error removing avatar:', error);
    throw error;
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

// Phone-based OTP password reset functions
export const sendPasswordResetOTP = async (phoneNumber) => {
  try {
    // First, check if phone number exists in profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('phone_number, id')
      .eq('phone_number', phoneNumber)
      .single();

    if (profileError || !profiles) {
      throw new Error('Phone number not found. Please check and try again.');
    }

    // Send OTP to phone number using Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });

    if (error) {
      throw new Error('Failed to send verification code. Please try again.');
    }

    return {
      success: true,
      message: 'Verification code sent to your phone',
      userId: profiles.id
    };
  } catch (error) {
    throw error;
  }
};

export const verifyPasswordResetOTP = async (phoneNumber, otp, newPassword) => {
  try {
    // Verify the OTP
    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: otp,
      type: 'sms'
    });

    if (verifyError) {
      throw new Error('Invalid verification code. Please try again.');
    }

    // Get user profile to find the associated email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('phone_number', phoneNumber)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found.');
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw new Error('Failed to update password. Please try again.');
    }

    // Sign out the temporary session
    await supabase.auth.signOut();

    return {
      success: true,
      message: 'Password reset successfully! Please sign in with your new password.',
      username: profile.username
    };
  } catch (error) {
    throw error;
  }
};

// Authentication functions using Supabase
export const signup = async (data) => {
  try {
    // Validate password format
    if (!/^\d+$/.test(data.password)) {
      throw new Error('Password must contain only numbers');
    }

    // Check for weak passwords
    if (isWeakPassword(data.password)) {
      throw new Error('Password is too weak. Please choose a different combination');
    }

    // Validate phone number
    if (!data.phoneNumber || data.phoneNumber.trim().length < 10) {
      throw new Error('Phone number must be at least 10 digits');
    }

    // Sign up with Supabase Auth using a valid email format
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${data.username}@maish.app`, // Use valid email domain
      password: data.password,
      options: {
        data: {
          username: data.username,
          full_name: data.full_name,
          phone_number: data.phoneNumber,
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('Username already exists');
      }
      throw new Error(authError.message);
    }

    return { success: true, message: 'Account created successfully' };
  } catch (error) {
    throw error;
  }
};

export const login = async (data) => {
  try {
    // Validate password format
    if (!/^\d+$/.test(data.password)) {
      throw new Error('Password must contain only numbers');
    }

    // Sign in with Supabase Auth using email (username@maish.app)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${data.username}@maish.app`,
      password: data.password,
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        throw new Error('Invalid username or password');
      }
      throw new Error(authError.message);
    }

    return { success: true, message: 'Login successful' };
  } catch (error) {
    throw error;
  }
};

export const createSale = async (saleData, receiptFile) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Create sale record first (without image for faster response)
    const { data, error } = await supabase
      .from('sales')
      .insert({
        user_id: user.id,
        item_description: saleData.itemName,
        amount_cents: Math.round(parseFloat(saleData.amount) * 100),
        commission_cents: Math.round(parseFloat(saleData.amount) * 100 * 0.02), // 2% commission
        photo_url: null, // Will update after upload
        status: 'completed'
      })
      .select()
      .single();

    if (error) throw error;

    // Upload image asynchronously if present
    let photoUrl = null;
    if (receiptFile) {
      try {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${user.id}/${data.id}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.warn('Image upload failed, sale recorded without image:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);

          photoUrl = publicUrl;

          // Update the sale record with the image URL
          await supabase
            .from('sales')
            .update({ photo_url: photoUrl })
            .eq('id', data.id);
        }
      } catch (uploadError) {
        console.warn('Image upload failed, sale recorded without image:', uploadError);
        // Don't throw error - sale is still recorded
      }
    }

    return {
      id: data.id,
      username: saleData.username,
      item_description: data.item_description,
      amount_cents: data.amount_cents,
      commission_cents: data.commission_cents,
      timestamp: data.timestamp,
      photo_path: photoUrl,
      status: data.status,
      created_at: data.created_at,
    };
  } catch (error) {
    throw new Error('Failed to save sale');
  }
};

export const getSales = async (username) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(sale => ({
      id: sale.id,
      username: username,
      item_description: sale.item_description,
      amount_cents: sale.amount_cents,
      commission_cents: sale.commission_cents,
      timestamp: sale.timestamp,
      photo_path: sale.photo_url,
      status: sale.status,
      created_at: sale.created_at,
    }));
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
};

export const replaceUserSales = async (username, sales) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Delete existing sales
    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Insert new sales
    if (sales.length > 0) {
      const salesToInsert = sales.map(sale => ({
        user_id: user.id,
        item_description: sale.item_description,
        amount_cents: sale.amount_cents,
        commission_cents: sale.commission_cents,
        timestamp: sale.timestamp,
        photo_url: sale.photo_path,
        status: sale.status,
      }));

      const { error: insertError } = await supabase
        .from('sales')
        .insert(salesToInsert);

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    console.error('Error replacing sales:', error);
    throw error;
  }
};

export const checkHealth = async () => {
  // Mock health check - always healthy for front-end only
  return { status: 'healthy', message: 'Front-end only mode' };
};

// Logout function
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
  }
  // Clear any local legacy data
  localStorage.removeItem('token');
};

// Migration utility for existing local data
export const migrateLocalDataToSupabase = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get existing local credentials
    const localCredentials = getUserCredentials();
    if (!localCredentials) {
      return { migrated: false, message: 'No local data found to migrate' };
    }

    // Get existing local sales
    const localSales = getSalesFromStorage(localCredentials.username) || [];

    // Get existing local avatar
    const localAvatar = getUserAvatar(localCredentials.username);

    // Migrate sales to Supabase
    if (localSales.length > 0) {
      const salesToInsert = localSales.map(sale => ({
        user_id: user.id,
        item_description: sale.item_description,
        amount_cents: sale.amount_cents,
        commission_cents: sale.commission_cents,
        timestamp: sale.timestamp,
        photo_url: sale.photo_path,
        status: sale.status,
      }));

      const { error: salesError } = await supabase
        .from('sales')
        .insert(salesToInsert);

      if (salesError) throw salesError;
    }

    // Migrate avatar if exists
    if (localAvatar) {
      // Convert base64 to blob and upload
      try {
        const response = await fetch(localAvatar);
        const blob = await response.blob();
        const file = new File([blob], 'migrated-avatar.jpg', { type: 'image/jpeg' });
        await saveUserAvatar(file, localCredentials.username);
      } catch (avatarError) {
        console.warn('Failed to migrate avatar:', avatarError);
      }
    }

    // Clear local data after successful migration
    localStorage.removeItem(USER_CREDENTIALS_KEY);
    localStorage.removeItem(getUserSalesKey(localCredentials.username));
    localStorage.removeItem(getUserAvatarKey(localCredentials.username));

    return {
      migrated: true,
      message: `Successfully migrated ${localSales.length} sales and avatar data to Supabase`
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw new Error('Failed to migrate local data to Supabase');
  }
};

// Check if user has local data that needs migration
export const hasLocalDataToMigrate = () => {
  const localCredentials = getUserCredentials();
  if (!localCredentials) return false;

  const localSales = getSalesFromStorage(localCredentials.username) || [];
  const localAvatar = getUserAvatar(localCredentials.username);

  return localSales.length > 0 || !!localAvatar;
};