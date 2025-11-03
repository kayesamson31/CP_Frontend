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
static async log({ userId, actionTaken, tableAffected, recordId, ipAddress = null, organizationId = null }) {
  try {

    if (!userId) {
      console.warn('⚠️ No userId provided for audit log:', actionTaken);
      return null; // Don't log if no user
    }
    
    // Get organization_id from current user if not provided
    if (!organizationId) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      organizationId = currentUser?.organizationId || null;
    }

    // ✅ NEW: Fetch user details to store in audit log
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, email, roles(role_name)')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('⚠️ Failed to fetch user details for audit log:', userError);
    }

    // ✅ NEW: Insert audit log with user info stored directly
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: userId,
        action_taken: actionTaken,
        table_affected: tableAffected,
        record_id: recordId,
        ip_address: ipAddress,
        organization_id: organizationId,
        timestamp: new Date().toISOString(),
        // ✅ NEW: Store user info directly
        user_full_name: userData?.full_name || 'Unknown User',
        user_email: userData?.email || 'unknown@system',
        user_role: userData?.roles?.role_name || 'Unknown'
      }]);

    if (error) {
      console.error('❌ Audit log failed:', error);
      console.error('❌ Attempted to log:', { userId, actionTaken, tableAffected, recordId, ipAddress, organizationId });
    }

    console.log('✅ Audit log successful:', data);

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
static async logWithIP({ userId, actionTaken, tableAffected, recordId, organizationId = null }) {
  const ipAddress = await this.getClientIP();
  return this.log({ userId, actionTaken, tableAffected, recordId, ipAddress, organizationId });
}
}