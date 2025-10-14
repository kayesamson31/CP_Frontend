import { supabase } from '../supabaseClient';

export class AuditLogger {
  
  /**
   * Log an action to the audit_logs table
   * @param {Object} params - Audit log parameters
   * @param {number} params.userId - ID of user performing action
   * @param {string} params.actionTaken - Description of action (e.g., "Created new user")
   * @param {string} params.tableAffected - Table name (e.g., "users", "assets")
   * @param {number} params.recordId - ID of affected record
   * @param {string} params.ipAddress - User's IP address (optional)
   */
  static async log({ userId, actionTaken, tableAffected, recordId, ipAddress = null }) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: userId,
          action_taken: actionTaken,
          table_affected: tableAffected,
          record_id: recordId,
          ip_address: ipAddress,
          timestamp: new Date().toISOString()
        }]);

      if (error) {
        console.error('Audit log failed:', error);
        // Don't throw - audit logging should never break the main flow
      }

      return data;
    } catch (err) {
      console.error('Audit logging exception:', err);
    }
  }

  /**
   * Get user's IP address (client-side approximation)
   */
  static async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP:', error);
      return 'Unknown';
    }
  }

  /**
   * Convenience method to log with automatic IP detection
   */
  static async logWithIP({ userId, actionTaken, tableAffected, recordId }) {
    const ipAddress = await this.getClientIP();
    return this.log({ userId, actionTaken, tableAffected, recordId, ipAddress });
  }
}