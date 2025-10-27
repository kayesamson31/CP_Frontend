import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SysAdminDashboardContext = createContext();

export const useSysAdminDashboard = () => {
  const context = useContext(SysAdminDashboardContext);
  if (!context) {
    throw new Error('useSysAdminDashboard must be used within SysAdminDashboardProvider');
  }
  return context;
};

export const SysAdminDashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get organization ID
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id, full_name')
        .eq('email', user.email)
        .single();

      const organizationId = userData?.organization_id;
      if (!organizationId) return;

      // Fetch all data in parallel
      const [
        orgData,
        statsData,
        auditLogs,
        orgTypes,
        countries
      ] = await Promise.all([
        // Organization info
        supabase
          .from('organizations')
          .select('*, countries(country_name), organization_types(type_name)')
          .eq('contact_email', user.email)
          .single(),
        
        // User and asset stats
        Promise.all([
          supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 3).in('user_status', ['active','pending_activation']),
          supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 4).in('user_status', ['active','pending_activation']),
          supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 2).in('user_status', ['active','pending_activation']),
          supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 1).in('user_status', ['active','pending_activation']),
          supabase.from('assets').select('*', { count: 'exact' }).eq('organization_id', organizationId).neq('asset_status', 'inactive_test')
        ]),
        
        // Recent audit logs
        supabase
          .from('audit_logs')
          .select('audit_id, action_taken, timestamp, users!inner(full_name, email, organization_id)')
          .eq('users.organization_id', organizationId)
          .order('timestamp', { ascending: false })
          .limit(5),
        
        // Organization types
        supabase.from('organization_types').select('org_type_id, type_name').eq('is_active', true).order('type_name'),
        
        // Countries
        supabase.from('countries').select('country_id, country_name').eq('is_active', true).order('country_name')
      ]);

      // Process stats
      const [personnelResult, standardUsersResult, adminOfficialsResult, systemAdminsResult, assetsResult] = statsData;
      const personnel = personnelResult.count || 0;
      const standardUsers = standardUsersResult.count || 0;
      const adminOfficials = adminOfficialsResult.count || 0;
      const systemAdmins = systemAdminsResult.count || 0;
      const totalAssets = assetsResult.count || 0;

      // Calculate system health
      const totalUsers = personnel + standardUsers + adminOfficials;
      let systemHealthPercentage = 25;
      if (totalUsers === 0 && totalAssets === 0) systemHealthPercentage = 25;
      else if (totalUsers > 0 && totalAssets > 0) systemHealthPercentage = 95;
      else if (totalUsers > 0 || totalAssets > 0) systemHealthPercentage = 75;

      // Transform audit logs
      const recentActivities = auditLogs.data?.map(log => ({
        id: log.audit_id,
        type: 'audit_log',
        icon: 'bi-clock-history',
        title: log.action_taken,
        user: log.users.full_name || log.users.email,
        timestamp: new Date(log.timestamp + 'Z').toISOString(),
        color: 'info'
      })) || [];

      // Build final data
      const data = {
        sysAdminName: userData.full_name || 'System Administrator',
        organizationData: {
          name: orgData.data?.org_name || 'OpenFMS',
          type: orgData.data?.organization_types?.type_name || 'Government Agency',
          typeId: orgData.data?.org_type_id,
          address: orgData.data?.address || 'Not specified',
          phone: orgData.data?.phone || 'Not specified',
          country: orgData.data?.countries?.country_name || 'Not specified',
          countryId: orgData.data?.country_id,
          website: orgData.data?.website || 'https://openfms.io',
          contactPerson: orgData.data?.contact_person || 'System Administrator',
          contactEmail: orgData.data?.contact_email || user.email,
          personnel,
          standardUsers,
          adminOfficials,
          systemAdmins,
          totalAssets,
          systemHealthPercentage,
          setupCompleted: orgData.data?.setup_completed || false,  // â† ADD THIS
          setupCompletedAt: orgData.data?.setup_completed_at || null  // â† ADD THIS
        },
        recentActivities,
        organizationTypes: orgTypes.data || [],
        countries: countries.data || []
      };

      setDashboardData(data);
      setLastFetched(new Date());
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const refreshData = () => {
    return fetchAllData();
  };

  return (
    <SysAdminDashboardContext.Provider value={{ dashboardData, loading, refreshData, lastFetched }}>
      {children}
    </SysAdminDashboardContext.Provider>
  );
};