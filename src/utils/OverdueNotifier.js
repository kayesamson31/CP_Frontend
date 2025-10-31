// src/utils/OverdueNotifier.js
import { supabase } from '../supabaseClient';
let isChecking = false;
export const checkAndNotifyOverdue = async () => {
  // ✅ ADD THIS BLOCK - Check if already running
  if (isChecking) {
    console.log('⏭️ Overdue check already in progress, skipping...');
    return;
  }

  isChecking = true;
  console.log('🔒 Overdue check LOCKED - started at', new Date().toISOString());

  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 1️⃣ Check overdue WORK ORDERS
  console.log('🔍 Checking work orders...');
    const { data: overdueWorkOrders, error: woError } = await supabase
      .from('work_orders')
      .select(`
        work_order_id,
        title,
        due_date,
        requested_by,
        assigned_to,
        organization_id,
        status_id,
        statuses(status_name)
      `)
      .in('status_id', [1, 2])
      .lt('due_date', now.toISOString());
      // ✅ REMOVED .eq('is_active', true)

    if (woError) console.error('❌ Work order query error:', woError);
    console.log(`📋 Found ${overdueWorkOrders?.length || 0} overdue work orders`);

    // 2️⃣ Check overdue MAINTENANCE TASKS
  console.log('🔍 Checking maintenance tasks...');
    const { data: overdueTasks, error: mtError } = await supabase
      .from('maintenance_tasks')
      .select(`
        task_id,
        task_name,
        due_date,
        assigned_to,
        organization_id,
        status_id,
        statuses(status_name)
      `)
      .in('status_id', [1, 2])
      .lt('due_date', now.toISOString());
      // ✅ REMOVED .eq('is_active', true)

    if (mtError) console.error('❌ Maintenance task query error:', mtError);
    console.log(`📋 Found ${overdueTasks?.length || 0} overdue maintenance tasks`);
    
    // 3️⃣ Create notifications for overdue work orders
    for (const wo of overdueWorkOrders || []) {
      await createOverdueNotification({
        type: 'work_order',
        id: wo.work_order_id,
        title: wo.title,
        dueDate: wo.due_date,
        assignedTo: wo.assigned_to,
        requestedBy: wo.requested_by,
        orgId: wo.organization_id
      });
    }

    // 4️⃣ Create notifications for overdue maintenance tasks
    for (const task of overdueTasks || []) {
      await createOverdueNotification({
        type: 'maintenance_task',
        id: task.task_id,
        title: task.task_name,
        dueDate: task.due_date,
        assignedTo: task.assigned_to,
        orgId: task.organization_id
      });
    }

  console.log('✅ Overdue check completed');
  } catch (error) {
    console.error('❌ Error checking overdue tasks:', error);
  } finally {
    // ✅ ADD THIS BLOCK - Always release lock
    isChecking = false;
    console.log('🔓 Overdue check UNLOCKED at', new Date().toISOString());
  }
};

const createOverdueNotification = async (data) => {
  try {
    const { type, id, title, dueDate, assignedTo, requestedBy, orgId } = data;

    // ✅ IMPROVED: Check if notification already exists today for THIS specific target
    const today = new Date();
    today.setHours(0, 0, 0, 0);

  // ✅ IMPROVED: Check if admin notification sent in LAST 6 HOURS (not just today)
   const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
    
    const { data: existingAdmin } = await supabase
      .from('notifications')
      .select('notification_id, created_at')
      .eq('related_table', type === 'work_order' ? 'work_orders' : 'maintenance_tasks')
      .eq('related_id', id)
      .eq('target_roles', '2')
      .eq('organization_id', orgId)  // ✅ ADD THIS LINE
      .eq('notification_type_id', 24)
      .eq('is_active', true)  // ✅ ADD THIS LINE
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .maybeSingle();

  // ✅ IMPROVED: Check if personnel notification sent in LAST 6 HOURS
let existingPersonnel = null;
    if (assignedTo) {
      const { data } = await supabase
        .from('notifications')
        .select('notification_id, created_at')
        .eq('related_table', type === 'work_order' ? 'work_orders' : 'maintenance_tasks')
        .eq('related_id', id)
        .eq('target_user_id', assignedTo)
        .eq('organization_id', orgId)  // ✅ ADD THIS LINE
        .eq('notification_type_id', 24)
        .eq('is_active', true)  // ✅ ADD THIS LINE
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .maybeSingle();
      existingPersonnel = data;
    }

  // ✅ IMPROVED: Check if requester notification sent in LAST 6 HOURS
  let existingRequester = null;
    if (type === 'work_order' && requestedBy) {
      const { data } = await supabase
        .from('notifications')
        .select('notification_id, created_at')
        .eq('related_table', 'work_orders')
        .eq('related_id', id)
        .eq('target_user_id', requestedBy)
        .eq('organization_id', orgId)  // ✅ ADD THIS LINE
        .eq('notification_type_id', 24)
        .eq('is_active', true)  // ✅ ADD THIS LINE
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .maybeSingle();
      existingRequester = data;
    }

    // Calculate days overdue
    const daysOverdue = Math.floor((Date.now() - new Date(dueDate)) / (1000 * 60 * 60 * 24));

    const message = type === 'work_order'
      ? `Work Order "${title}" is ${daysOverdue} day(s) overdue. Due date was ${new Date(dueDate).toLocaleDateString()}.`
      : `Maintenance Task "${title}" is ${daysOverdue} day(s) overdue. Due date was ${new Date(dueDate).toLocaleDateString()}.`;

    // Get admin user for created_by
    const { data: adminUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role_id', 2)
      .limit(1)
      .maybeSingle(); // ✅ CHANGED from .single()

console.log(`📤 Creating notifications for ${type} ${id}...`);

// ✅ Check if admin notification exists
if (existingAdmin) {
  console.log(`⏭️ Admin already notified in last 24h for ${type} ${id}`);
  // ✅ ADD THIS RETURN - STOP HERE!
} else {
  // Insert admin notification
  const { error: adminError } = await supabase
    .from('notifications')
    .insert({
      notification_type_id: 24,
      created_by: adminUser?.user_id || 1,
      title: `${type === 'work_order' ? 'Work Order' : 'Maintenance Task'} Overdue`,
      message,
      target_roles: '2',
      priority_id: 3,
      related_table: type === 'work_order' ? 'work_orders' : 'maintenance_tasks',
      related_id: id,
      organization_id: orgId,
      is_active: true
    });

  if (adminError) {
    console.error(`❌ Error notifying admin for ${type} ${id}:`, adminError);
  } else {
    console.log(`✅ Admin notified - ${type} ${id}`);
  }
}

// ✅ Check personnel notification
if (assignedTo) {
  if (existingPersonnel) {
    console.log(`⏭️ Personnel already notified in last 24h for ${type} ${id}`);
    // ✅ ADD THIS - SKIP PERSONNEL
  } else {
    // Insert personnel notification (existing code)
    const { error: personnelError } = await supabase
      .from('notifications')
      .insert({
        notification_type_id: 24,
        created_by: adminUser?.user_id || 1,
        title: `Your ${type === 'work_order' ? 'Work Order' : 'Maintenance Task'} is Overdue`,
        message: `${message} Please complete this as soon as possible.`,
        target_user_id: assignedTo,
        priority_id: 3,
        related_table: type === 'work_order' ? 'work_orders' : 'maintenance_tasks',
        related_id: id,
        organization_id: orgId,
        is_active: true
      });

    if (personnelError) {
      console.error(`❌ Error notifying personnel for ${type} ${id}:`, personnelError);
    } else {
      console.log(`✅ Personnel notified - ${type} ${id}`);
    }
  }
}

// ✅ Check requester notification
if (type === 'work_order' && requestedBy) {
  if (existingRequester) {
    console.log(`⏭️ Requester already notified in last 24h for ${type} ${id}`);
    // ✅ SKIP REQUESTER
  } else {
    // Insert requester notification (existing code)
    const { error: requesterError } = await supabase
      .from('notifications')
      .insert({
        notification_type_id: 24,
        created_by: adminUser?.user_id || 1,
        title: 'Your Work Order is Overdue',
        message: `Your work order "${title}" is ${daysOverdue} day(s) overdue. Please follow up with the admin.`,
        target_user_id: requestedBy,
        priority_id: 3,
        related_table: 'work_orders',
        related_id: id,
        organization_id: orgId,
        is_active: true
      });

    if (requesterError) {
      console.error(`❌ Error notifying requester for ${type} ${id}:`, requesterError);
    } else {
      console.log(`✅ Requester notified - ${type} ${id}`);
    }
  }
}
    

  } catch (error) {
    console.error(`❌ Fatal error in createOverdueNotification:`, error);
  }
};