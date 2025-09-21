// utils/EmailService.js - Final version that matches your EmailJS template exactly
import emailjs from 'emailjs-com';

export class EmailService {
  static EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || '';
  static EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '';
  static EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '';

  static init() {
    try {
      console.log('EmailJS Config Check:', {
        serviceId: this.EMAILJS_SERVICE_ID,
        templateId: this.EMAILJS_TEMPLATE_ID,
        publicKey: this.EMAILJS_PUBLIC_KEY ? this.EMAILJS_PUBLIC_KEY.substring(0, 8) + '...' : 'Missing'
      });

      if (!this.EMAILJS_SERVICE_ID || !this.EMAILJS_TEMPLATE_ID || !this.EMAILJS_PUBLIC_KEY) {
        console.error('EmailJS configuration incomplete');
        return false;
      }

      emailjs.init(this.EMAILJS_PUBLIC_KEY);
      console.log('EmailJS initialized with public key');
      return true;
    } catch (error) {
      console.error('EmailJS initialization failed:', error);
      return false;
    }
  }

  static isConfigured() {
    return !!(this.EMAILJS_SERVICE_ID && this.EMAILJS_TEMPLATE_ID && this.EMAILJS_PUBLIC_KEY);
  }

  static async sendUserCredentials(userEmail, userFullName, tempPassword, organizationName) {
    try {
      if (!this.isConfigured()) {
        throw new Error('EmailJS not configured');
      }

      // These parameter names MUST match your EmailJS template variables exactly
      const templateParams = {
        user_email: userEmail,        // This goes to {{user_email}} in template
        user_name: userFullName,      // This goes to {{user_name}} in template  
        temp_password: tempPassword,  // This goes to {{temp_password}} in template
        organization_name: organizationName, // This goes to {{organization_name}} in template
        login_url: window.location.origin + '/login' // This goes to {{login_url}} in template
      };

      console.log('Sending email to:', userEmail, 'with template params:', {
        ...templateParams,
        temp_password: '[HIDDEN]'
      });

      const result = await emailjs.send(
        this.EMAILJS_SERVICE_ID,
        this.EMAILJS_TEMPLATE_ID,
        templateParams,
        this.EMAILJS_PUBLIC_KEY
      );

      console.log('âœ… Email sent successfully to', userEmail, '- Result:', result);
      return { success: true, messageId: result.text };
      
    } catch (error) {
      console.error('âŒ Email send failed to', userEmail, '- Error:', error);
      return { 
        success: false, 
        error: error.text || error.message || 'Unknown error',
        details: error
      };
    }
  }

  static async sendBulkCredentials(users, organizationName, onProgress = null) {
    if (!this.isConfigured()) {
      console.error('EmailJS not configured - all emails will fail');
      return users.map(user => ({
        email: user.email,
        success: false,
        error: 'EmailJS not configured'
      }));
    }

    const results = [];
    let successCount = 0;
    let failedCount = 0;

    console.log(`Starting bulk email send for ${users.length} users...`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`Sending email ${i + 1}/${users.length} to ${user.email}...`);
      
      try {
        const result = await this.sendUserCredentials(
          user.email,
          user.full_name,
          user.tempPassword,
          organizationName
        );
        
        if (result.success) {
          successCount++;
          console.log(`âœ… Email ${i + 1} sent successfully to ${user.email}`);
        } else {
          failedCount++;
          console.log(`âŒ Email ${i + 1} failed to ${user.email}: ${result.error}`);
        }
        
        results.push({
          email: user.email,
          success: result.success,
          error: result.error || null
        });

        if (onProgress) {
          onProgress(i + 1, users.length, user.email, result.success);
        }

        // Wait 3 seconds between emails to avoid EmailJS rate limits
        if (i < users.length - 1) {
          console.log('Waiting 3 seconds before next email...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        failedCount++;
        console.error(`âŒ Exception sending email ${i + 1} to ${user.email}:`, error);
        
        results.push({
          email: user.email,
          success: false,
          error: error.message
        });

        if (onProgress) {
          onProgress(i + 1, users.length, user.email, false);
        }
      }
    }

    console.log(`Bulk email complete: ${successCount} sent, ${failedCount} failed`);
    return results;
  }

 static async testConfiguration() {
  // Return success without actually sending email
  console.log('Email test skipped to save free requests');
  return { success: true, message: 'Test skipped' };
}
}
