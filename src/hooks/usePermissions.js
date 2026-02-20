import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for checking user permissions
 * @returns {Object} Permission utilities
 */
export function usePermissions() {
  const { user, profile } = useAuth();

  /**
   * Check if current user is an admin
   */
  const isAdmin = profile?.role === 'admin';

  /**
   * Check if current user can edit a specific record
   * @param {string} ownerId - The owner_id of the record
   * @returns {boolean} Whether the user can edit the record
   */
  const canEdit = (ownerId) => {
    if (!user || !profile) return false;
    // Admins can edit anything
    if (isAdmin) return true;
    // Users can edit their own records
    return ownerId === user.id;
  };

  /**
   * Check if current user can delete a specific record
   * @param {string} ownerId - The owner_id of the record
   * @returns {boolean} Whether the user can delete the record
   */
  const canDelete = (ownerId) => {
    // Same logic as canEdit
    return canEdit(ownerId);
  };

  /**
   * Get the company_id for the current user
   */
  const companyId = profile?.company_id;

  /**
   * Get the current user's ID (for setting owner_id on new records)
   */
  const userId = user?.id;

  return {
    isAdmin,
    canEdit,
    canDelete,
    companyId,
    userId,
    profile
  };
}
