// src/services/WorkOrderService.js
import { supabase } from '../supabaseClient';

export class WorkOrderService {
  // Get current user from localStorage
  static getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }

 // Updated submitWorkOrder method - simplified version
// Updated submitWorkOrder method - simplified version
static async submitWorkOrder(workOrderData) {
  try {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get default status for "To Review"
    const { data: statusData, error: statusError } = await supabase
      .from('statuses')
      .select('status_id')
      .eq('status_name', 'To Review')
      .eq('status_category', 'work_order')
      .single();

    if (statusError || !statusData) {
      throw new Error('Could not find "To Review" status');
    }

    // Get priority_id from priority_levels table
    const { data: priorityData, error: priorityError } = await supabase
      .from('priority_levels')
      .select('priority_id')
      .eq('priority_name', workOrderData.priority || 'Low')
      .single();

    if (priorityError || !priorityData) {
      throw new Error('Could not find priority level');
    }

    // Prepare work order data - NO asset handling, just set to null
    const workOrder = {
      title: workOrderData.title.trim(),
      description: workOrderData.description ? workOrderData.description.trim() : '',
      priority_id: priorityData.priority_id,
      status_id: statusData.status_id,
      asset_id: null, // Always null since wala pang assets uploaded
      date_requested: new Date().toISOString(),
      due_date: workOrderData.dateNeeded ? new Date(workOrderData.dateNeeded).toISOString() : null,
      requested_by: currentUser.id,
      category: workOrderData.category,
      location: workOrderData.location.trim()
    };

    console.log('Submitting work order:', workOrder);

    // Insert work order
    const { data, error } = await supabase
      .from('work_orders')
      .insert(workOrder)
      .select(`
        *,
        priority_levels(priority_name, color_code),
        statuses(status_name, color_code),
        users!requested_by(full_name, email)
      `)
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    // Log the activity
    await this.logActivity({
      user_id: currentUser.id,
      activity_type: 'work_order_created',
      description: `Created work order: ${workOrderData.title}`,
      ip_address: await this.getClientIP()
    });

    return { success: true, data };

  } catch (error) {
    console.error('WorkOrderService.submitWorkOrder error:', error);
    return { success: false, error: error.message };
  }
}

  // Get work orders for current user
  static async getUserWorkOrders(filters = {}) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('work_orders')
        .select(`
          *,
          priority_levels(priority_name, color_code),
          statuses(status_name, color_code),
          assets(asset_code, location),
          users!requested_by(full_name, email)
        `)
        .eq('requested_by', currentUser.id)
        .order('date_requested', { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== 'All') {
        const { data: statusData } = await supabase
          .from('statuses')
          .select('status_id')
          .eq('status_name', filters.status)
          .single();

        if (statusData) {
          query = query.eq('status_id', statusData.status_id);
        }
      }

      if (filters.priority && filters.priority !== 'All') {
        const { data: priorityData } = await supabase
          .from('priority_levels')
          .select('priority_id')
          .eq('priority_name', filters.priority)
          .single();

        if (priorityData) {
          query = query.eq('priority_id', priorityData.priority_id);
        }
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('WorkOrderService.getUserWorkOrders error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Cancel a work order (only if status is "To Review")
  static async cancelWorkOrder(workOrderId) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get "Cancelled" status
      const { data: statusData, error: statusError } = await supabase
        .from('statuses')
        .select('status_id')
        .eq('status_name', 'Cancelled')
        .eq('status_category', 'work_order')
        .single();

      if (statusError || !statusData) {
        throw new Error('Could not find "Cancelled" status');
      }

      // Update work order status
      const { data, error } = await supabase
        .from('work_orders')
        .update({ 
          status_id: statusData.status_id,
          date_resolved: new Date().toISOString()
        })
        .eq('work_order_id', workOrderId)
        .eq('requested_by', currentUser.id)
        .select(`
          *,
          priority_levels(priority_name, color_code),
          statuses(status_name, color_code)
        `)
        .single();

      if (error) throw error;

      // Log the activity
      await this.logActivity({
        user_id: currentUser.id,
        activity_type: 'work_order_cancelled',
        description: `Cancelled work order: ${data.title}`,
        ip_address: await this.getClientIP()
      });

      return { success: true, data };

    } catch (error) {
      console.error('WorkOrderService.cancelWorkOrder error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get work order details
  static async getWorkOrderDetails(workOrderId) {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          priority_levels(priority_name, color_code),
          statuses(status_name, color_code),
          assets(asset_code, location),
          users!requested_by(full_name, email)
        `)
        .eq('work_order_id', workOrderId)
        .single();

      if (error) throw error;

      return { success: true, data };

    } catch (error) {
      console.error('WorkOrderService.getWorkOrderDetails error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get status counts for dashboard tabs
  static async getStatusCounts() {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get all work order statuses
      const { data: statuses, error: statusError } = await supabase
        .from('statuses')
        .select('status_id, status_name, color_code')
        .eq('status_category', 'work_order')
        .eq('is_active', true);

      if (statusError) throw statusError;

      // Count work orders by status for current user
      const statusCounts = [];
      
      for (const status of statuses) {
        const { data, error } = await supabase
          .from('work_orders')
          .select('work_order_id', { count: 'exact' })
          .eq('requested_by', currentUser.id)
          .eq('status_id', status.status_id);

        if (!error) {
          statusCounts.push({
            label: status.status_name,
            color: status.color_code,
            count: data ? data.length : 0,
            icon: this.getStatusIcon(status.status_name)
          });
        }
      }

      return { success: true, data: statusCounts };

    } catch (error) {
      console.error('WorkOrderService.getStatusCounts error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Helper function to get status icons
  static getStatusIcon(status) {
    switch (status) {
      case 'To Review': return 'bi bi-eye';
      case 'Pending': return 'bi bi-clock';
      case 'In Progress': return 'bi bi-gear';
      case 'Completed': return 'bi bi-check-circle';
      case 'Rejected': return 'bi bi-x-circle';
      case 'Failed': return 'bi bi-exclamation-triangle';
      case 'Cancelled': return 'bi bi-dash-circle';
      default: return 'bi bi-question-circle';
    }
  }

  // Get priority levels
  static async getPriorityLevels() {
    try {
      const { data, error } = await supabase
        .from('priority_levels')
        .select('*')
        .order('priority_id');

      if (error) throw error;

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('WorkOrderService.getPriorityLevels error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Log activity
  static async logActivity(activityData) {
    try {
      const { error } = await supabase
        .from('activity_tracking')
        .insert(activityData);

      if (error) {
        console.warn('Failed to log activity:', error);
      }
    } catch (error) {
      console.warn('Activity logging error:', error);
    }
  }

  // Get client IP (simplified for demo)
  static async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }
}