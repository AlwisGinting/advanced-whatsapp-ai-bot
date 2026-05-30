const fs = require('fs');
const path = require('path');

/**
 * Role-Based Access Control (RBAC) Manager
 * Manages user roles, permissions, and access control
 */
class RBACManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.USER_ROLES_FILE = './user_roles.json';
    this.userRoles = new Map();
    this.loadUserRoles();
  }

  loadUserRoles() {
    try {
      if (fs.existsSync(this.USER_ROLES_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.USER_ROLES_FILE, 'utf-8'));
        Object.entries(data).forEach(([phone, role]) => {
          this.userRoles.set(phone, role);
        });
        this.logger.info('User roles loaded', { count: Object.keys(data).length });
      }
    } catch (err) {
      this.logger.error('Failed to load user roles', { error: err.message });
    }
  }

  saveUserRoles() {
    try {
      const data = Object.fromEntries(this.userRoles);
      fs.writeFileSync(this.USER_ROLES_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      this.logger.error('Failed to save user roles', { error: err.message });
    }
  }

  /**
   * Get user role (defaults to USER if not set)
   */
  getUserRole(userId) {
    // Super admin has highest priority
    if (userId === this.config.security.superAdminPhone) {
      return 'SUPER_ADMIN';
    }
    return this.userRoles.get(userId) || 'GUEST';
  }

  /**
   * Set user role (only SUPER_ADMIN can do this)
   */
  setUserRole(userId, roleName, requesterId) {
    if (requesterId !== this.config.security.superAdminPhone) {
      throw new Error('❌ Hanya SUPER_ADMIN yang dapat mengubah role pengguna.');
    }

    if (!this.config.roles[roleName]) {
      throw new Error(`❌ Role '${roleName}' tidak ada.`);
    }

    this.userRoles.set(userId, roleName);
    this.saveUserRoles();
    
    this.logger.info('User role changed', { userId, roleName, by: requesterId });
    return `✅ Role pengguna ${userId} diubah menjadi ${roleName}`;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(userId, permission) {
    const role = this.getUserRole(userId);
    const roleConfig = this.config.roles[role];

    if (!roleConfig) {
      return false;
    }

    return roleConfig.permissions.includes(permission);
  }

  /**
   * Check multiple permissions (ANY match = true)
   */
  hasAnyPermission(userId, permissions) {
    return permissions.some(perm => this.hasPermission(userId, perm));
  }

  /**
   * Check multiple permissions (ALL must match)
   */
  hasAllPermissions(userId, permissions) {
    return permissions.every(perm => this.hasPermission(userId, perm));
  }

  /**
   * Get user role priority (higher = more privileged)
   */
  getUserPriority(userId) {
    const role = this.getUserRole(userId);
    return this.config.roles[role]?.priority || 0;
  }

  /**
   * Get all permissions for user
   */
  getUserPermissions(userId) {
    const role = this.getUserRole(userId);
    return this.config.roles[role]?.permissions || [];
  }

  /**
   * Get user role info
   */
  getUserRoleInfo(userId) {
    const role = this.getUserRole(userId);
    const roleConfig = this.config.roles[role];
    
    return {
      userId,
      role,
      priority: roleConfig.priority,
      permissions: roleConfig.permissions,
      permissionCount: roleConfig.permissions.length
    };
  }

  /**
   * List all users and their roles
   */
  listAllUsers() {
    const users = Array.from(this.userRoles.entries()).map(([phone, role]) => ({
      phone,
      role,
      priority: this.config.roles[role]?.priority || 0
    }));
    
    users.push({
      phone: this.config.security.superAdminPhone,
      role: 'SUPER_ADMIN',
      priority: 1000
    });

    // Remove duplicates
    const uniqueUsers = Array.from(
      new Map(users.map(u => [u.phone, u])).values()
    ).sort((a, b) => b.priority - a.priority);

    return uniqueUsers;
  }

  /**
   * Remove user role (set back to GUEST)
   */
  removeUserRole(userId, requesterId) {
    if (requesterId !== this.config.security.superAdminPhone) {
      throw new Error('❌ Hanya SUPER_ADMIN yang dapat menghapus role pengguna.');
    }

    this.userRoles.delete(userId);
    this.saveUserRoles();
    
    this.logger.info('User role removed', { userId, by: requesterId });
    return `✅ Role pengguna ${userId} telah dihapus (kembali ke GUEST)`;
  }

  /**
   * Check if operation is protected
   */
  isProtectedOperation(operation) {
    return this.config.dataProtection.protectedOperations.includes(operation);
  }

  /**
   * Mask sensitive data if user doesn't have permission
   */
  maskSensitiveData(data, userId) {
    if (this.hasPermission(userId, 'view_confidential')) {
      return data;
    }

    const masked = { ...data };
    this.config.dataProtection.confidentialFields.forEach(field => {
      if (masked[field]) {
        masked[field] = '***CONFIDENTIAL***';
      }
    });

    return masked;
  }

  /**
   * Get role hierarchy info
   */
  getRoleHierarchy() {
    const roles = Object.entries(this.config.roles)
      .map(([name, config]) => ({
        name,
        priority: config.priority,
        permissions: config.permissions
      }))
      .sort((a, b) => b.priority - a.priority);

    return roles;
  }
}

module.exports = RBACManager;
