// Ito yung main service file ko para sa Asset Management ng system.
// Dito ko nilagay lahat ng functions na may kinalaman sa assets, 
// mula sa pag-fetch ng data, pag-add/update, hanggang sa maintenance tasks at bulk uploads.

import { supabase } from '../supabaseClient'; // Adjust path as needed

export const assetService = {
  // Fetch all assets kasama na yung related data tulad ng category.
  // Ginawa ko ito para hindi na mahirapan yung components sa frontend 
  // kasi naka-map na agad sa expected format yung data.

async fetchAssets() {
  try {
    const organizationId = await this.getCurrentUserOrganization();
    console.log('Fetching assets for organization:', organizationId);
    
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

    if (error) throw error;

    // Get failed maintenance tasks count
    const { data: failedTasks } = await supabase
      .from('maintenance_tasks')
      .select('asset_id, status_id')
      .eq('status_id', 11);

    const failedCountMap = {};
    failedTasks?.forEach(task => {
      failedCountMap[task.asset_id] = (failedCountMap[task.asset_id] || 0) + 1;
    });

    // Fetch maintenance history for all assets
    const { data: maintenanceTasks } = await supabase
      .from('maintenance_tasks')
      .select(`
        task_id,
        task_name,
        description,
        due_date,
        date_completed,
        asset_id,
        assigned_to,
        status_id,
        statuses(status_name),
        users!assigned_to(full_name)
      `)
      .in('asset_id', assets.map(a => a.asset_id))
      .order('due_date', { ascending: false });

    // Group tasks by asset_id
    const tasksByAsset = {};
    maintenanceTasks?.forEach(task => {
      if (!tasksByAsset[task.asset_id]) {
        tasksByAsset[task.asset_id] = [];
      }
      tasksByAsset[task.asset_id].push({
        date: task.date_completed || task.due_date,
        task: task.task_name,
        assigned: task.users?.full_name || 'Unassigned',
        status: task.statuses?.status_name?.toLowerCase() || 'pending'
      });
    });
    // Fetch incident reports for all assets
// Fetch incident reports for all assets (fetch ALL statuses for history)
    const { data: allIncidents } = await supabase
      .from('incident_reports')
      .select(`
        incident_id,
        description,
        date_reported,
        date_resolved,
        asset_id,
        status_id,
        incident_types(type_name),
        severity_levels(severity_name),
        statuses(status_name),
        users!reported_by(full_name)
      `)
      .in('asset_id', assets.map(a => a.asset_id))
      .order('date_reported', { ascending: false });

   // Separate active incidents (for badge) vs history (for modal)
const activeIncidentsByAsset = {};
const incidentHistoryByAsset = {};

// Replace yung checking logic (around line 200+)
allIncidents?.forEach(incident => {
  const incidentObj = {
    id: `INC-${incident.incident_id}`,
    type: incident.incident_types?.type_name || 'Unknown',
    description: incident.description,
    severity: incident.severity_levels?.severity_name || 'Minor',
    reportedBy: incident.users?.full_name || 'Unknown',
    reportedAt: incident.date_reported,
    resolvedAt: incident.date_resolved,
    status: incident.statuses?.status_name || 'Reported'
  };
  
  // For history: include ALL incidents
  if (!incidentHistoryByAsset[incident.asset_id]) {
    incidentHistoryByAsset[incident.asset_id] = [];
  }
  incidentHistoryByAsset[incident.asset_id].push(incidentObj);
  
  // ✅ IMPROVED: Use incident_id to check for related completed tasks
  if (incident.status_id === 4) { // Reported status
    const hasCompletedTask = maintenanceTasks?.some(task => 
      task.incident_id === incident.incident_id &&
      (task.status_id === 3 || task.status_id === 11) // Completed or Failed
    );
    
    // Only show badge if NO completed/failed task exists
    if (!hasCompletedTask) {
      if (!activeIncidentsByAsset[incident.asset_id]) {
        activeIncidentsByAsset[incident.asset_id] = [];
      }
      activeIncidentsByAsset[incident.asset_id].push(incidentObj);
    }
  }
});

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
      hasFailedMaintenance: (failedCountMap[asset.asset_id] || 0) > 0,
      failedMaintenanceCount: failedCountMap[asset.asset_id] || 0,
      maintenanceHistory: tasksByAsset[asset.asset_id] || [], // ✅ Now populated!
     incidentReports: activeIncidentsByAsset[asset.asset_id] || [],
      incidentHistory: incidentHistoryByAsset[asset.asset_id] || [],
      maintenanceSchedule: null
    }));
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
},

   // Ito yung helper function na nagko-convert ng database asset status 
  // (halimbawa: active, maintenance, retired) papunta sa readable text 
  // (Operational, Under Maintenance, Retired).  
  // Para mas friendly siya kapag pinapakita sa UI.
  mapAssetStatus(dbStatus) {
    const statusMap = {
      'active': 'Operational',
      'maintenance': 'Under Maintenance', 
      'retired': 'Retired',
      'inactive': 'Retired'
    };
    return statusMap[dbStatus] || 'Operational';
  },

  // Baliktad naman ito: from UI component status, kino-convert ko pabalik sa DB format.  
  // Para consistent yung storage sa database.
  mapComponentStatus(componentStatus) {
    const statusMap = {
      'Operational': 'active',
      'Under Maintenance': 'maintenance',
      'Retired': 'retired'
    };
    return statusMap[componentStatus] || 'active';
  },

   // Maliit lang na helper function para gawing uppercase yung first letter ng string.
  capitalizeFirst(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  
  

 // Kinukuha ko yung organization ID ng currently logged-in user.  
  // Kailangan ito kasi halos lahat ng assets naka-tali sa isang organization.
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

  // Kinukuha ko lahat ng asset categories.  
  // Ginagamit ito sa dropdowns or pag nag-add ng bagong asset.
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

   // Kinukuha ko lahat ng active personnel users (role_id = 3).  
  // Kailangan ko ito para ma-assign yung mga maintenance tasks.
async fetchUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, username, full_name, email, role_id, job_position')
      .eq('user_status', 'active')
      .eq('role_id', 3) // Personnel role only
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching personnel:', error);
      throw error;
    }
    
    console.log('Fetched personnel:', data);
    
    return data.map(user => ({
      id: user.user_id.toString(),
      name: user.full_name,
      department: user.job_position || 'General Maintenance', // Use job_position!
      email: user.email
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
},
 // Ito naman para sa personnel: kinukuha ko yung mga tasks na naka-assign sa kanila.  
  // May join na rin ito sa work_orders, priority, at statuses para complete info na agad.

async fetchMyTasks() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_uid', user.id)
      .single();
    
    if (!currentUser) throw new Error('User not found');
    
// ✅ Get current user's organization first
const currentUserData = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUserData || !currentUserData.organizationId) {
  throw new Error('Session expired. Please log in again.');
}

const { data: tasks, error } = await supabase
  .from('maintenance_tasks')
  .select(`
    task_id,
    task_name,
    description,
    due_date,
    original_due_date,
    extension_count,
    last_extension_date,
    last_extension_reason,
    date_created,
    date_completed,
    remarks,
    status_id,
    priority_id,
    work_order_id,
    asset_id,
    incident_id,
    statuses(status_name, color_code),
    priority_levels(priority_name, color_code),
    assets!maintenance_tasks_asset_id_fkey(
      asset_name, 
      asset_code, 
      location,
      organization_id,  
      asset_categories(category_name)
    ),
    work_orders(
      work_order_id,
      title,
      description,
      location,
      category,
      asset_id,
      organization_id,  
      assets(asset_name, asset_code, location)
    ),
    maintenance_task_extensions(
      extension_id,
      old_due_date,
      new_due_date,
      extension_reason,
      extension_date
    )
  `)
  .eq('assigned_to', currentUser.user_id)
  .order('due_date', { ascending: true });

// ✅ Filter out tasks from other organizations
const filteredTasks = tasks?.filter(task => {
  if (task.assets && task.assets.organization_id !== currentUserData.organizationId) {
    return false;
  }
  if (task.work_orders && task.work_orders.organization_id !== currentUserData.organizationId) {
    return false;
  }
  return true;
}) || [];
    
    if (error) throw error;
    
  return filteredTasks.map(task => ({
  id: task.task_id,
  taskId: task.task_id,
  title: task.task_name,
  description: task.description || 'No description',
  dueDate: task.due_date,
  originalDueDate: task.original_due_date,
  extensionCount: task.extension_count || 0,
  lastExtensionDate: task.last_extension_date,
  lastExtensionReason: task.last_extension_reason,
  dateCreated: task.date_created,
  dateCompleted: task.date_completed,
  remarks: task.remarks,
  status: task.statuses?.status_name || 'Pending',
  statusColor: task.statuses?.color_code,
  priority: task.priority_levels?.priority_name || 'Medium',
  priorityColor: task.priority_levels?.color_code,
  workOrderId: task.work_order_id,
  incidentId: task.incident_id,
  extensionHistory: task.maintenance_task_extensions || [],
  asset: task.assets ? {
    id: task.assets.asset_code,
    name: task.assets.asset_name,
    location: task.assets.location,
    category: task.assets.asset_categories?.category_name
  } : null,
    }));
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    throw error;
  }
},
   // Function para mag-add ng bagong asset.  
  // Una kong kinukuha yung category_id based sa category name, 
  // tapos ini-insert ko yung asset kasama yung organization_id ng user.
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

  // Function para i-update yung existing asset details.  
  // Kung nagbago yung category, kinukuha ko ulit yung category_id bago ko i-update.
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

// Para gumawa ng bagong maintenance task.  
  // Step-by-step ito: (1) kuha asset_id, (2) kuha current user, (3) gumawa ng work order, 
  // (4) gumawa ng maintenance task, tapos (5) i-update yung asset status to "maintenance".
async createMaintenanceTask(taskData) {
  try {
    console.log('Creating task with data:', taskData);
    
    // Get asset_id from asset_code
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .select('asset_id, asset_name, location')
      .eq('asset_code', taskData.assetId)
      .single();
    
    if (assetError) throw new Error('Asset not found');
    
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    const { data: currentUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_uid', user.id)
      .single();
    
    if (!currentUser) throw new Error('Current user not found');
    
    // Map priority
    const priorityMap = { 'low': 1, 'medium': 2, 'high': 3 };
    
    // Create ONLY maintenance task (no work order)
   const taskInsert = {
  task_name: taskData.title,
  description: taskData.description || '',
  priority_id: priorityMap[taskData.priority] || 2,
  status_id: 1, // Pending
  work_order_id: null,
  asset_id: assetData.asset_id, 
  due_date: taskData.dueDate,
  assigned_to: parseInt(taskData.assigneeId),
  incident_id: taskData.incidentId || null  
};
    
const { data: taskResult, error: taskError } = await supabase
  .from('maintenance_tasks')
  .insert([taskInsert])
  .select()
  .single();

if (taskError) throw taskError;

// Update asset status to "maintenance"
await supabase
  .from('assets')
  .update({ asset_status: 'maintenance' })
  .eq('asset_code', taskData.assetId);

// ✅ CREATE NOTIFICATION FOR PERSONNEL
try {
  const notificationInsert = {
    notification_type_id: 13, // asset_maintenance_assigned
    created_by: currentUser.user_id,
    title: 'New Maintenance Task Assigned',
    message: `You have been assigned: ${taskData.title} for ${assetData.asset_name}. Due: ${taskData.dueDate}`,
    target_roles: '3', // Personnel role
    target_user_id: parseInt(taskData.assigneeId),
    priority_id: priorityMap[taskData.priority] || 2,
    related_table: 'maintenance_tasks',
    related_id: taskResult.task_id,
    is_active: true,
    created_at: new Date().toISOString()
  };

  console.log('🔔 Creating notification:', notificationInsert);

  const { data: notifResult, error: notifError } = await supabase
    .from('notifications')
    .insert([notificationInsert]);

  if (notifError) {
    console.error('❌ Notification error:', notifError);
  } else {
    console.log('✅ Notification created successfully');
  }
} catch (notifErr) {
  console.error('❌ Notification creation failed:', notifErr);
  // Don't throw - task was created successfully
}

return taskResult;


  } catch (error) {
    console.error('Error creating maintenance task:', error);
    throw error;
  }
},

  // Helper function para makuha yung asset_id base sa asset_code.
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
// Scheduling ng maintenance task.  
  // Nag-iinsert ako sa maintenance_schedules table tapos ina-update ko rin yung 
  // `next_maintenance` field sa mismong asset para alam kung kailan ulit siya.
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

   // Bulk upload ng assets.  
  // Para sa mga cases na maraming assets ang ia-upload sabay-sabay (e.g. sa CSV).  
  // Niloop ko sila, hinahanap ko yung category_id, at sinisigurado kong 
  // lahat may organization_id bago i-insert sa database.
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
  },

async createIncidentReport(incidentData) {
  try {
    console.log('=== CREATE INCIDENT START ===');
    console.log('Input data:', incidentData);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }
    console.log('Auth user ID:', user.id);

    // Get user profile
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_uid', user.id)
      .single();
    
    if (userError) {
      console.error('User lookup error:', userError);
      throw userError;
    }
    console.log('Current user_id:', currentUser.user_id);

    // Get asset
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .select('asset_id')
      .eq('asset_code', incidentData.assetId)
      .single();
    
    if (assetError) {
      console.error('Asset lookup error:', assetError);
      throw new Error('Asset not found: ' + incidentData.assetId);
    }
    console.log('Asset ID:', assetData.asset_id);

    const incidentTypeMap = {
      'Equipment Malfunction': 1,
      'Safety Hazard': 3,
      'Damage': 1,
      'Performance Issue': 1,
      'Other': 1
    };

    const severityMap = {
      'Low': 1,
      'Medium': 2,
      'High': 3
    };

    const insertData = {
      asset_id: assetData.asset_id,
      incident_type_id: incidentTypeMap[incidentData.type] || 1,
      description: incidentData.description,
      severity_id: severityMap[incidentData.severity] || 2,
      reported_by: currentUser.user_id,
      status_id: 4,
      date_reported: new Date().toISOString()
    };

    console.log('Insert data:', insertData);

    const { data, error } = await supabase
      .from('incident_reports')
      .insert([insertData])
      .select(`
        incident_id,
        description,
        date_reported,
        incident_types(type_name),
        severity_levels(severity_name),
        statuses(status_name),
        users!reported_by(full_name)
      `)
      .single();

    if (error) {
      console.error('=== INSERT ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      throw error;
    }

    console.log('Insert successful:', data);
    console.log('=== CREATE INCIDENT END ===');

    return {
      id: `INC-${data.incident_id}`,
      type: data.incident_types?.type_name || incidentData.type,
      description: data.description,
      severity: data.severity_levels?.severity_name || incidentData.severity,
      reportedBy: data.users?.full_name || 'Unknown',
      reportedAt: data.date_reported,
      status: data.statuses?.status_name || 'Reported'
    };
  } catch (error) {
    console.error('=== INCIDENT CREATION FAILED ===');
    console.error('Error:', error);
    throw error;
  }
},
  // Add this to assetService.js, before the closing };
async updateIncidentStatus(incidentId, newStatus) {
  try {
    const numericId = parseInt(incidentId.replace('INC-', ''));
    
    const statusMap = {
      'Reported': 4,
      'Resolved': 5,
      'Dismissed': 5,
      'Assigned': 4  // ADD THIS - keep as Reported but will be filtered differently
    };
    
    const { data, error } = await supabase
      .from('incident_reports')
      .update({ 
        status_id: statusMap[newStatus] || 4,
        date_resolved: (newStatus === 'Dismissed' || newStatus === 'Resolved') ? new Date().toISOString() : null
      })
      .eq('incident_id', numericId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating incident status:', error);
    throw error;
  }
},
  

async autoResolveIncident(incidentId) {
  try {
    const numericId = typeof incidentId === 'string' 
      ? parseInt(incidentId.replace('INC-', '')) 
      : incidentId;
    
    const { data, error } = await supabase
      .from('incident_reports')
      .update({ 
        status_id: 5, // Resolved
        date_resolved: new Date().toISOString()
      })
      .eq('incident_id', numericId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error auto-resolving incident:', error);
    throw error;
  }
}
  
};