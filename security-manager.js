const fs = require('fs');

/**
 * Security Manager
 * Handles approval workflows, access attempts, and security logging
 */
class SecurityManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.SECURITY_LOG_FILE = './security-audit.log';
    this.pendingApprovals = new Map();
    this.accessAttempts = new Map();
  }

  /**
   * Log security event to audit log
   */
  logSecurityEvent(eventType, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      eventType,
      ...details
    };

    const logText = `[${timestamp}] [${eventType}] ${JSON.stringify(details)}\n`;
    
    if (this.config.logging.enableSecurityLog) {
      try {
        fs.appendFileSync(this.SECURITY_LOG_FILE, logText);
      } catch (err) {
        this.logger.error('Failed to write security log', { error: err.message });
      }
    }

    this.logger.info('Security event', logEntry);
  }

  /**
   * Record unauthorized access attempt
   */
  recordUnauthorizedAttempt(userId, operation, details) {
    const key = `${userId}-${operation}`;
    const attempt = this.accessAttempts.get(key) || { count: 0, lastAttempt: null };
    
    attempt.count += 1;
    attempt.lastAttempt = new Date().toISOString();
    attempt.details = details;

    this.accessAttempts.set(key, attempt);

    this.logSecurityEvent('UNAUTHORIZED_ATTEMPT', {
      userId,
      operation,
      attemptCount: attempt.count,
      details
    });

    return attempt.count;
  }

  /**
   * Create approval request
   */
  createApprovalRequest(requestId, requesterPhone, operation, targetData) {
    const request = {
      requestId,
      requesterPhone,
      operation,
      targetData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.config.security.approvalTimeout).toISOString(),
      status: 'PENDING',
      approvedBy: null,
      approvedAt: null
    };

    this.pendingApprovals.set(requestId, request);

    this.logSecurityEvent('APPROVAL_REQUEST_CREATED', {
      requestId,
      requesterPhone,
      operation
    });

    return request;
  }

  /**
   * Approve request
   */
  approveRequest(requestId, approverId, approvalReason = '') {
    const request = this.pendingApprovals.get(requestId);

    if (!request) {
      throw new Error('❌ Request tidak ditemukan.');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`❌ Request sudah ${request.status.toLowerCase()}.`);
    }

    if (new Date(request.expiresAt) < new Date()) {
      request.status = 'EXPIRED';
      throw new Error('❌ Request sudah kadaluarsa.');
    }

    request.status = 'APPROVED';
    request.approvedBy = approverId;
    request.approvedAt = new Date().toISOString();
    request.approvalReason = approvalReason;

    this.logSecurityEvent('REQUEST_APPROVED', {
      requestId,
      approverId,
      reason: approvalReason
    });

    return request;
  }

  /**
   * Reject request
   */
  rejectRequest(requestId, rejectorId, rejectionReason = '') {
    const request = this.pendingApprovals.get(requestId);

    if (!request) {
      throw new Error('❌ Request tidak ditemukan.');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`❌ Request sudah ${request.status.toLowerCase()}.`);
    }

    request.status = 'REJECTED';
    request.rejectedBy = rejectorId;
    request.rejectedAt = new Date().toISOString();
    request.rejectionReason = rejectionReason;

    this.logSecurityEvent('REQUEST_REJECTED', {
      requestId,
      rejectorId,
      reason: rejectionReason
    });

    return request;
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals() {
    return Array.from(this.pendingApprovals.values()).filter(r => r.status === 'PENDING');
  }

  /**
   * Get approval request details
   */
  getApprovalRequest(requestId) {
    return this.pendingApprovals.get(requestId);
  }

  /**
   * Check if should require approval
   */
  shouldRequireApproval(userId, operation, rbac) {
    // Super admin doesn't need approval
    if (userId === this.config.security.superAdminPhone) {
      return false;
    }

    // Check if operation is protected
    if (!this.config.dataProtection.protectedOperations.includes(operation)) {
      return false;
    }

    // If user doesn't have explicit permission, require approval
    return !rbac.hasPermission(userId, operation);
  }

  /**
   * Generate approval request message
   */
  generateApprovalMessage(request) {
    return `🔐 *PERMOHONAN AKSES SISTEM*\n\n` +
      `ID: ${request.requestId}\n` +
      `Dari: ${request.requesterPhone}\n` +
      `Operasi: ${request.operation}\n` +
      `Data: ${JSON.stringify(request.targetData)}\n\n` +
      `Balas dengan:\n` +
      `✅ SETUJU ${request.requestId}\n` +
      `❌ TOLAK ${request.requestId}`;
  }

  /**
   * Log successful access
   */
  logSuccessfulAccess(userId, operation, details = {}) {
    this.logSecurityEvent('SUCCESSFUL_ACCESS', {
      userId,
      operation,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Get security audit log
   */
  getSecurityAuditLog(lines = 100) {
    try {
      if (!fs.existsSync(this.SECURITY_LOG_FILE)) {
        return [];
      }

      const content = fs.readFileSync(this.SECURITY_LOG_FILE, 'utf-8');
      const logLines = content.split('\n').filter(line => line.trim());
      
      return logLines.slice(-lines);
    } catch (err) {
      this.logger.error('Failed to read security audit log', { error: err.message });
      return [];
    }
  }

  /**
   * Clear old approval requests
   */
  clearExpiredApprovals() {
    const now = new Date();
    let cleared = 0;

    for (const [requestId, request] of this.pendingApprovals.entries()) {
      if (new Date(request.expiresAt) < now && request.status === 'PENDING') {
        request.status = 'EXPIRED';
        cleared += 1;
      }
    }

    if (cleared > 0) {
      this.logger.info('Expired approvals cleared', { count: cleared });
    }

    return cleared;
  }

  /**
   * Get access attempt stats
   */
  getAccessAttemptStats(userId) {
    const userAttempts = Array.from(this.accessAttempts.entries())
      .filter(([key]) => key.startsWith(userId))
      .map(([key, attempt]) => ({
        operation: key.split('-')[1],
        ...attempt
      }));

    return userAttempts;
  }

  /**
   * Check if user is suspicious (too many failed attempts)
   */
  isSuspiciousActivity(userId) {
    const attempts = this.getAccessAttemptStats(userId);
    return attempts.some(attempt => attempt.count > 5);
  }
}

module.exports = SecurityManager;
