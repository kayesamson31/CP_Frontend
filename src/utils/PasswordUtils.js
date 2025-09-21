// utils/PasswordUtils.js - Simple password generation and utilities
import CryptoJS from 'crypto-js';

export class PasswordUtils {
  // Generate a secure random password
  static generateSecurePassword(length = 10) {
    // Using simpler character set to avoid email issues
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; 
    const numbers = "0123456789";
    const special = "@#$%"; // Limited special chars to avoid email problems
    
    let password = "";
    
    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest with mixed characters
    const allChars = lowercase + uppercase + numbers + special;
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to randomize position
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Hash password for database storage
  static hashPassword(password) {
    return CryptoJS.SHA256(password).toString();
  }

  // Generate unique username from email
  static generateUsername(email) {
    const emailPart = email.split('@')[0].toLowerCase();
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits
    const random = Math.random().toString(36).substr(2, 3); // 3 random chars
    return `${emailPart}_${timestamp}${random}`;
  }

  // Simple password strength checker
  static isPasswordStrong(password) {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@#$%]/.test(password);
    const isLongEnough = password.length >= 8;
    
    return hasLower && hasUpper && hasNumber && hasSpecial && isLongEnough;
  }

  // Generate multiple passwords for testing
  static generateTestPasswords(count = 5) {
    const passwords = [];
    for (let i = 0; i < count; i++) {
      passwords.push(this.generateSecurePassword());
    }
    return passwords;
  }
}