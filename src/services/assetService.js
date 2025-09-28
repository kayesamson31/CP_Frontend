// services/assetService.js
import { supabase } from '../supabaseClient'; // Adjust path as needed

export const assetService = {
  // Fetch all assets with related data (mapped to match component expectations)
async fetchAssets() {
  try {
    const organizationId = await this.getCurrentUserOrganization();
    console.log('Fetching assets for organization:', organizationId);
    
    // Start with a simple query first
    const { data: assets, error } = await supabase
      .from('assets')
      .select(`
        asset_id,
        asset_code,
        asset_name,
        location,
        asset_status,
        acquisition_date,
        last_maintenance,
        next_maintenance,
        next_maintenance_time,
        next_maintenance_repeat,
        next_maintenance_assigned,
        task,
        organization_id,
        asset_category_id,
        asset_categories(category_name)
      `)
      .eq('organization_id', organizationId)
      .order('asset_id', { ascending: false });

    console.log('Assets query result:', assets);
    console.log('Assets query error:', error);

    if (error) throw error;

    // Simple mapping without complex relations for now
    return assets.map(asset => ({
      id: asset.asset_code,
      name: asset.asset_name || asset.asset_code,
      category: asset.asset_categories?.category_name || 'Unknown',
      location: asset.location || '',
      status: this.mapAssetStatus(asset.asset_status),
      acquisitionDate: asset.acquisition_date,
      lastMaintenance: asset.last_maintenance,
      nextMaintenance: asset.next_maintenance,
      nextMaintenanceTime: asset.next_maintenance_time,
      nextMaintenanceRepeat: asset.next_maintenance_repeat || 'none',
      nextMaintenanceAssigned: asset.next_maintenance_assigned,
      task: asset.task || '',
      // Simplified - no complex relations for now
      maintenanceHistory: [],
      incidentReports: [],
      maintenanceSchedule: null
    }));
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
},

  // Helper to map database asset_status to component status
  mapAssetStatus(dbStatus) {
    const statusMap = {
      'active': 'Operational',
      'maintenance': 'Under Maintenance', 
      'retired': 'Retired',
      'inactive': 'Retired'
    };
    return statusMap[dbStatus] || 'Operational';
  },

  // Helper to map component status back to database
  mapComponentStatus(componentStatus) {
    const statusMap = {
      'Operational': 'active',
      'Under Maintenance': 'maintenance',
      'Retired': 'retired'
    };
    return statusMap[componentStatus] || 'active';
  },

  // Helper to capitalize first letter
  capitalizeFirst(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Get current user's organization ID
async getCurrentUserOrganization() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Raw authenticated user:', user);
    
    if (!user) throw new Error('No authenticated user');

    const { data: userData, error } = await supabase
      .from('users')
      .select('user_id, username, full_name, organization_id, auth_uid')
      .eq('auth_uid', user.id)
      .single();

    console.log('Database query result:', userData);
    console.log('Database query error:', error);
    console.log('Looking for auth_uid:', user.id);

    if (error) {
      console.error('Database error details:', error);
      throw error;
    }
    
    if (!userData) {
      throw new Error('User organization not found');
    }

    console.log('Found organization_id:', userData.organization_id);
    return userData.organization_id;
  } catch (error) {
    console.error('Error getting user organization:', error);
    throw error;
  }
},

  // Fetch asset categories
  async fetchAssetCategories() {
    try {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .order('category_name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching asset categories:', error);
      throw error;
    }
  },

  // Fetch users for personnel assignments
  async fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, full_name, email')
        .eq('user_status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      
      // Map to match component expected format
      return data.map(user => ({
        id: user.user_id.toString(),
        name: user.full_name,
        department: 'General', // You might want to add department to users table
        email: user.email
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Add new asset
  async addAsset(assetData) {
    try {
     const organizationId = await this.getCurrentUserOrganization(); // ADD this line at the start
      const { data: category, error: categoryError } = await supabase
        .from('asset_categories')
        .select('category_id')
        .eq('category_name', assetData.category)
        .single();

      if (categoryError) {
        throw new Error(`Category '${assetData.category}' not found`);
      }

      const { data, error } = await supabase
        .from('assets')
        .insert([{
          asset_code: assetData.name, // Using name as asset_code for now
          asset_name: assetData.name,
          asset_category_id: category.category_id,
          location: assetData.location,
          asset_status: this.mapComponentStatus(assetData.status),
          acquisition_date: assetData.acquisitionDate || null,
          next_maintenance: assetData.nextMaintenance || null,
          task: assetData.task || null,
           organization_id: organizationId  // You'll need to get this from current user's organization
        }])
        .select(`
          *,
          asset_categories(category_name)
        `)
        .single();

      if (error) throw error;

      // Return in component-expected format
      return {
        id: data.asset_code,
        name: data.asset_name || data.asset_code,
        category: data.asset_categories.category_name,
        location: data.location || '',
        status: this.mapAssetStatus(data.asset_status),
        acquisitionDate: data.acquisition_date,
        lastMaintenance: null,
        nextMaintenance: data.next_maintenance,
        task: data.task || '',
        maintenanceHistory: [],
        incidentReports: []
      };
    } catch (error) {
      console.error('Error adding asset:', error);
      throw error;
    }
  },

  // Update asset
  async updateAsset(assetCode, assetData) {
    try {
      // Get category_id if category changed
      let categoryId = null;
      if (assetData.category) {
        const { data: category } = await supabase
          .from('asset_categories')
          .select('category_id')
          .eq('category_name', assetData.category)
          .single();
        categoryId = category?.category_id;
      }

      const updateData = {
        asset_name: assetData.name,
        location: assetData.location,
        asset_status: this.mapComponentStatus(assetData.status),
        acquisition_date: assetData.acquisitionDate,
        next_maintenance: assetData.nextMaintenance,
        next_maintenance_time: assetData.nextMaintenanceTime,
        next_maintenance_repeat: assetData.nextMaintenanceRepeat,
        task: assetData.task
      };

      if (categoryId) {
        updateData.asset_category_id = categoryId;
      }

      const { data, error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('asset_code', assetCode)
        .select(`
          *,
          asset_categories(category_name)
        `)
        .single();

      if (error) throw error;

      return {
        id: data.asset_code,
        name: data.asset_name || data.asset_code,
        category: data.asset_categories.category_name,
        location: data.location || '',
        status: this.mapAssetStatus(data.asset_status),
        acquisitionDate: data.acquisition_date,
        lastMaintenance: data.last_maintenance,
        nextMaintenance: data.next_maintenance,
        nextMaintenanceTime: data.next_maintenance_time,
        nextMaintenanceRepeat: data.next_maintenance_repeat,
        task: data.task || '',
        maintenanceHistory: [],
        incidentReports: []
      };
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  },

  // Create maintenance task
  async createMaintenanceTask(taskData) {
    try {
      // Generate task code
      const taskCode = `TSK-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .insert([{
          task_code: taskCode,
          asset_id: await this.getAssetId(taskData.assetId), // Convert asset_code to asset_id
          assigned_user_id: parseInt(taskData.assigneeId),
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          due_date: taskData.dueDate,
          due_time: taskData.dueTime,
          task_type: taskData.taskType || 'maintenance',
          created_by: 'Admin'
        }])
        .select()
        .single();

      if (error) throw error;

      // Update asset status to "Under Maintenance"
      await supabase
        .from('assets')
        .update({ 
          asset_status: 'maintenance'
        })
        .eq('asset_code', taskData.assetId);

      return data;
    } catch (error) {
      console.error('Error creating maintenance task:', error);
      throw error;
    }
  },

  // Helper to get asset_id from asset_code
  async getAssetId(assetCode) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('asset_id')
        .eq('asset_code', assetCode)
        .single();
      
      if (error) throw error;
      return data.asset_id;
    } catch (error) {
      console.error('Error getting asset ID:', error);
      throw error;
    }
  },

  // Schedule maintenance
  async scheduleMaintenanceTask(scheduleData) {
    try {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .insert([{
          asset_id: await this.getAssetId(scheduleData.assetId),
          assigned_user_id: parseInt(scheduleData.assigneeId),
          task_description: `Scheduled maintenance for ${scheduleData.assetId}`,
          scheduled_date: scheduleData.scheduledDate,
          scheduled_time: scheduleData.scheduledTime || '09:00',
          repeat_interval: scheduleData.repeat,
          created_by: 'Admin'
        }])
        .select()
        .single();

      if (error) throw error;

      // Update asset's next maintenance date
      await supabase
        .from('assets')
        .update({
          next_maintenance: scheduleData.scheduledDate,
          next_maintenance_time: scheduleData.scheduledTime,
          next_maintenance_repeat: scheduleData.repeat
        })
        .eq('asset_code', scheduleData.assetId);

      return data;
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      throw error;
    }
  },

  // Bulk upload assets
  async bulkUploadAssets(assetsArray) {
    try {
    const organizationId = await this.getCurrentUserOrganization(); 
      const assetsToInsert = [];

      
      for (const asset of assetsArray) {
        // Get category_id
        const { data: category } = await supabase
          .from('asset_categories')
          .select('category_id')
          .eq('category_name', asset.category)
          .single();

        assetsToInsert.push({
          asset_code: asset.name,
          asset_name: asset.name,
          asset_category_id: category?.category_id || 1, // fallback to first category
          location: asset.location,
          asset_status: this.mapComponentStatus(asset.status),
          acquisition_date: asset.acquisitionDate,
          next_maintenance: asset.nextMaintenance,
          task: asset.task,
          organization_id: organizationId 
        });
      }

      const { data, error } = await supabase
        .from('assets')
        .insert(assetsToInsert)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error bulk uploading assets:', error);
      throw error;
    }
  }
};