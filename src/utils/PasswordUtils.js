// utils/PasswordUtils.js
// Purpose: Centralized utility class for handling all password-related operations 
// such as generation, hashing, verification, and strength checking.
// I created this so I won’t have to repeat code in different modules, making my 
// system more secure, reusable, and easy to maintain.
import CryptoJS from 'crypto-js';

export class PasswordUtils {
  // Function to generate a secure random password for users
  // Ginamit ko lang ang limited special characters para maiwasan 
  // ang email/encoding issues (like kapag nagpapadala ng credentials).

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

  // Function to hash the password before storing in the database
  // Ginamit ko ang SHA256 hashing para hindi ma-store ang plain text password
  // (security best practice).
  static hashPassword(password) {
    return CryptoJS.SHA256(password).toString();
  }

 // Function to verify if the entered password matches the stored hashed password
  // Ginamit ko ito during login process para siguraduhin ang identity ng user.
  static verifyPassword(plainPassword, hashedPassword) {
    const inputHash = CryptoJS.SHA256(plainPassword).toString();
    return inputHash === hashedPassword;
  }

  // Function to generate unique usernames based on user email
  // Nagdagdag ako ng timestamp at random chars para hindi magka-duplicate usernames.
  static generateUsername(email) {
    const emailPart = email.split('@')[0].toLowerCase();
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits
    const random = Math.random().toString(36).substr(2, 3); // 3 random chars
    return `${emailPart}_${timestamp}${random}`;
  }

// Function to check if a password is strong enough
  // Rule ko: may lowercase, uppercase, number, special char, at length >= 8
  // Ginamit ko ito para bigyan ng feedback ang users kapag mahina ang password nila.
  static isPasswordStrong(password) {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@#$%]/.test(password);
    const isLongEnough = password.length >= 8;
    
    return hasLower && hasUpper && hasNumber && hasSpecial && isLongEnough;
  }

  // Function to generate multiple test passwords
  // Ginagamit ko ito para sa system testing at debugging ng password functions.
  static generateTestPasswords(count = 5) {
    const passwords = [];
    for (let i = 0; i < count; i++) {
      passwords.push(this.generateSecurePassword());
    }
    return passwords;
  }
}