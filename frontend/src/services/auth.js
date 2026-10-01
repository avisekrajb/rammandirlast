// frontend/src/services/auth.js

// Token management
export const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem('token', token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const removeToken = () => {
  try {
    localStorage.removeItem('token');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// User management
export const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

export const removeUser = () => {
  try {
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error removing user:', error);
  }
};

// Language management

// Marks a language the visitor picked themselves, which must never be
// overridden by geo-detection on a later visit.
const LANGUAGE_CHOSEN_KEY = 'lang_user_set';

export const getLanguage = () => {
  try {
    return localStorage.getItem('lang') || 'en';
  } catch {
    return 'en';
  }
};

/**
 * Read the stored language, distinguishing "never set" from "set by me".
 * Returns null when nothing has been stored, which is the signal that
 * geo-detection should choose.
 */
export const getStoredLanguage = () => {
  try {
    return localStorage.getItem('lang');
  } catch {
    return null;
  }
};

export const hasUserChosenLanguage = () => {
  try {
    return localStorage.getItem(LANGUAGE_CHOSEN_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Persist the language.
 * `userChosen` records intent so an explicit choice sticks. Auto-detected
 * values are stored without setting that flag.
 */
export const setLanguage = (lang, { userChosen = false } = {}) => {
  try {
    localStorage.setItem('lang', lang);
    if (userChosen) {
      localStorage.setItem(LANGUAGE_CHOSEN_KEY, '1');
    }
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Check if user is logged in
export const isLoggedIn = () => {
  try {
    return !!localStorage.getItem('token') && !!localStorage.getItem('user');
  } catch {
    return false;
  }
};

// Clear all auth data
export const clearAuthData = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};