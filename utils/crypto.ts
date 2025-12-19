
import CryptoJS from 'crypto-js';

/**
 * Generates an MD5 hash of a string.
 * Note: MD5 is a one-way hash and cannot be reversed.
 */
export const generateMD5 = (text: string): string => {
  return CryptoJS.MD5(text).toString();
};

/**
 * Generates a SHA-256 hash of a string.
 * This is significantly more secure than MD5.
 */
export const generateSHA256 = (text: string): string => {
  return CryptoJS.SHA256(text).toString();
};

/**
 * Encrypts text using AES with a secret key.
 * This is reversible if the recipient has the key.
 */
export const encryptAES = (text: string, secretKey: string): string => {
  if (!text || !secretKey) return '';
  return CryptoJS.AES.encrypt(text, secretKey).toString();
};

/**
 * Decrypts AES ciphertext using a secret key.
 */
export const decryptAES = (ciphertext: string, secretKey: string): string => {
  if (!ciphertext || !secretKey) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || 'Invalid key or corrupted data';
  } catch (e) {
    return 'Decryption failed: Invalid key or format';
  }
};

/**
 * Calculates a simple password strength score (0-100).
 */
export const calculateStrength = (password: string): number => {
  let strength = 0;
  if (password.length > 5) strength += 20;
  if (password.length > 10) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;
  return strength;
};
