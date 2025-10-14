// src/utils/AuthUtils.js
export const AuthUtils = {
  // Get current user's organization_id
  getCurrentOrganizationId: () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      return user.organizationId;
    }
    return null;
  },

  // Get current user info
  getCurrentUser: () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  },

  // Check if user is system admin (may access to all orgs)
  isSystemAdmin: () => {
    const user = AuthUtils.getCurrentUser();
    return user && user.role === 1;
  },

  // Get organization filter for queries
  getOrgFilter: () => {
    if (AuthUtils.isSystemAdmin()) {
      // System admin can see all - return empty filter
      return {};
    }
    const orgId = AuthUtils.getCurrentOrganizationId();
    return orgId ? { organization_id: orgId } : {};
  }
};