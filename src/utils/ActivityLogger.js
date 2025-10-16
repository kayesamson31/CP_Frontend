import { supabase } from '../supabaseClient';
import { AuthUtils } from './AuthUtils';

export const logActivity = async (activityType, description, workOrderId = null) => {
  try {
    const user = AuthUtils.getCurrentUser();
    const orgId = AuthUtils.getCurrentOrganizationId();
    
    if (!user || !orgId) {
      console.warn('Cannot log activity: user or organization not found');
      return;
    }

    const { error } = await supabase
      .from('activity_tracking')
      .insert([
        {
          user_id: user.id,
          activity_type: activityType,
          description: description,
          work_order_id: workOrderId,
          organization_id: orgId,
          timestamp: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (err) {
    console.error('Activity logging exception:', err);
  }
};