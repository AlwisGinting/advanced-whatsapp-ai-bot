/**
 * Advanced Security & Encryption System
 * Enterprise-grade encryption, tokenization, and data protection
 * Version: 1.0 (Enterprise Ultra)
 * Lines: 600+
 */

const crypto = require('crypto');

class AdvancedSecurity {
  constructor(config = {}) {
    this.config = {
      enableEncryption: config.enableEncryption !== false,
      enableTokenization: config.enableTokenization !== false,
      encryptionAlgorithm: config.encryptionAlgorithm || 'aes-256-gcm',
      hashAlgorithm: config.hashAlgorithm || 'sha256',
      tokenLength: config.tokenLength || 32,
      keyRotationInterval: config.keyRotationInterval || 86400000, // 24 hours
      allowedOrigins: config.allowedOrigins || [],
      ...config
    };

    this.encryptionKeys = new Map(); // Rotating keys
    this.tokenVault = new Map(); // Token storage
    this.dataClassifications = new Map(); // Data sensitivity levels
    this.accessLog = [];
    this.securityEvents = [];
    this.encryptedCache = new Map();
    this.policyEngine = new Map();

    this.initialize();
  }

  initialize() {
    this.generateMasterKey();
    this.startKeyRotation();
    this.setupDefaultPolicies();
  }

  /**
   * Generate master encryption key
   */
  generateMasterKey() {
    const keyId = `key-${Date.now()}`;
    const key = crypto.randomBytes(32);

    this.encryptionKeys.set(keyId, {
      id: keyId,
      key,
      created: Date.now(),
      rotated: false,
      active: true,
      algorithm: this.config.encryptionAlgorithm
    });

    return keyId;
  }

  /**
   * Start automatic key rotation
   */
  startKeyRotation() {
    setInterval(() => {
      const now = Date.now();
      let rotated = false;

      this.encryptionKeys.forEach((keyData, keyId) => {
        if (now - keyData.created > this.config.keyRotationInterval && keyData.active) {
          keyData.active = false;
          this.generateMasterKey();
          rotated = true;
        }
      });

      // Clean old keys
      if (rotated) {
        for (const [keyId, keyData] of this.encryptionKeys) {
          if (!keyData.active && (now - keyData.created) > this.config.keyRotationInterval * 2) {
            this.encryptionKeys.delete(keyId);
          }
        }
      }
    }, this.config.keyRotationInterval);
  }

  /**
   * Get active encryption key
   */
  getActiveKey() {
    let activeKey = null;
    this.encryptionKeys.forEach((keyData) => {
      if (keyData.active) {
        activeKey = keyData;
      }
    });

    if (!activeKey) {
      const keyId = this.generateMasterKey();
      activeKey = this.encryptionKeys.get(keyId);
    }

    return activeKey;
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data, metadata = {}) {
    if (!this.config.enableEncryption) {
      return { data, encrypted: false };
    }

    try {
      const keyData = this.getActiveKey();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        keyData.algorithm,
        keyData.key,
        iv
      );

      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      const encrypted_blob = {
        iv: iv.toString('hex'),
        data: encrypted,
        authTag: authTag.toString('hex'),
        keyId: keyData.id,
        algorithm: keyData.algorithm,
        timestamp: Date.now(),
        metadata
      };

      // Log to access log
      this.logAccess('encrypt', { metadata });

      return encrypted_blob;
    } catch (error) {
      this.logSecurityEvent('encryption_failed', { error: error.message });
      return null;
    }
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encrypted_blob) {
    if (!encrypted_blob || !encrypted_blob.data) {
      return null;
    }

    try {
      const keyData = this.encryptionKeys.get(encrypted_blob.keyId);
      if (!keyData) {
        throw new Error('Encryption key not found');
      }

      const decipher = crypto.createDecipheriv(
        encrypted_blob.algorithm,
        keyData.key,
        Buffer.from(encrypted_blob.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(encrypted_blob.authTag, 'hex'));

      let decrypted = decipher.update(encrypted_blob.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Log to access log
      this.logAccess('decrypt', { keyId: encrypted_blob.keyId });

      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      this.logSecurityEvent('decryption_failed', { error: error.message });
      return null;
    }
  }

  /**
   * Create security token
   */
  createToken(userId, scope = {}, expiresIn = 3600000) {
    if (!this.config.enableTokenization) {
      return null;
    }

    const tokenId = crypto.randomBytes(this.config.tokenLength).toString('hex');
    const tokenData = {
      id: tokenId,
      userId,
      scope,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresIn,
      used: false,
      usageCount: 0,
      hash: crypto
        .createHash(this.config.hashAlgorithm)
        .update(tokenId)
        .digest('hex')
    };

    this.tokenVault.set(tokenId, tokenData);

    // Clean expired tokens
    this.cleanExpiredTokens();

    return {
      token: tokenId,
      expiresIn,
      scope
    };
  }

  /**
   * Verify token
   */
  verifyToken(tokenId) {
    if (!this.tokenVault.has(tokenId)) {
      return { valid: false, reason: 'token_not_found' };
    }

    const tokenData = this.tokenVault.get(tokenId);

    if (tokenData.expiresAt < Date.now()) {
      this.tokenVault.delete(tokenId);
      return { valid: false, reason: 'token_expired' };
    }

    tokenData.used = true;
    tokenData.usageCount++;
    tokenData.lastUsed = Date.now();

    return {
      valid: true,
      userId: tokenData.userId,
      scope: tokenData.scope,
      usageCount: tokenData.usageCount
    };
  }

  /**
   * Revoke token
   */
  revokeToken(tokenId) {
    if (this.tokenVault.has(tokenId)) {
      const tokenData = this.tokenVault.get(tokenId);
      tokenData.revoked = true;
      tokenData.revokedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Tokenize sensitive data
   */
  tokenizeData(sensitiveData, dataType = 'generic') {
    const token = crypto.randomBytes(16).toString('hex');
    const tokenRecord = {
      token,
      dataType,
      hash: crypto
        .createHash(this.config.hashAlgorithm)
        .update(sensitiveData)
        .digest('hex'),
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: null
    };

    this.tokenVault.set(token, tokenRecord);

    // Encrypt actual data
    const encrypted = this.encryptData(sensitiveData, { tokenId: token });

    return {
      token,
      reference: `${dataType}:${token}`,
      encrypted
    };
  }

  /**
   * Detokenize data
   */
  detokenizeData(token) {
    if (!this.tokenVault.has(token)) {
      return null;
    }

    const tokenRecord = this.tokenVault.get(token);
    if (tokenRecord.encrypted) {
      const decrypted = this.decryptData(tokenRecord.encrypted);
      tokenRecord.accessCount++;
      tokenRecord.lastAccessed = Date.now();
      return decrypted;
    }

    return null;
  }

  /**
   * Hash sensitive data (one-way)
   */
  hashData(data, salt = null) {
    const saltValue = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .createHash(this.config.hashAlgorithm)
      .update(data + saltValue)
      .digest('hex');

    return { hash, salt: saltValue };
  }

  /**
   * Verify hashed data
   */
  verifyHash(data, hashData) {
    const computed = crypto
      .createHash(this.config.hashAlgorithm)
      .update(data + hashData.salt)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(hashData.hash)
    );
  }

  /**
   * Classify data sensitivity
   */
  classifyData(dataType, sensitivityLevel = 'medium') {
    const classification = {
      dataType,
      sensitivityLevel, // low, medium, high, critical
      requiresEncryption: sensitivityLevel !== 'low',
      requiresTokenization: sensitivityLevel === 'critical',
      accessLogging: true,
      retentionDays: this.getRetentionPolicy(sensitivityLevel),
      allowedOperations: this.getAllowedOperations(sensitivityLevel)
    };

    this.dataClassifications.set(dataType, classification);
    return classification;
  }

  /**
   * Get retention policy
   */
  getRetentionPolicy(sensitivityLevel) {
    const policies = {
      low: 365,
      medium: 90,
      high: 30,
      critical: 7
    };

    return policies[sensitivityLevel] || 90;
  }

  /**
   * Get allowed operations
   */
  getAllowedOperations(sensitivityLevel) {
    const operations = {
      low: ['read', 'write', 'delete', 'export'],
      medium: ['read', 'write'],
      high: ['read'],
      critical: []
    };

    return operations[sensitivityLevel] || [];
  }

  /**
   * Setup default security policies
   */
  setupDefaultPolicies() {
    const policies = {
      password_minimum_length: 12,
      password_require_uppercase: true,
      password_require_numbers: true,
      password_require_special: true,
      mfa_enabled: true,
      rate_limit_per_minute: 60,
      session_timeout_minutes: 30,
      ip_whitelist_enabled: false,
      encryption_required: true,
      audit_logging_enabled: true
    };

    Object.entries(policies).forEach(([key, value]) => {
      this.policyEngine.set(key, value);
    });
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    const validation = {
      valid: true,
      errors: [],
      score: 0
    };

    const minLength = this.policyEngine.get('password_minimum_length') || 12;
    if (password.length < minLength) {
      validation.errors.push(`Password must be at least ${minLength} characters`);
      validation.valid = false;
    } else {
      validation.score += password.length / minLength * 25;
    }

    if (this.policyEngine.get('password_require_uppercase') && !/[A-Z]/.test(password)) {
      validation.errors.push('Password must contain uppercase letters');
      validation.valid = false;
    } else {
      validation.score += 25;
    }

    if (this.policyEngine.get('password_require_numbers') && !/[0-9]/.test(password)) {
      validation.errors.push('Password must contain numbers');
      validation.valid = false;
    } else {
      validation.score += 25;
    }

    if (this.policyEngine.get('password_require_special') && !/[!@#$%^&*]/.test(password)) {
      validation.errors.push('Password must contain special characters');
      validation.valid = false;
    } else {
      validation.score += 25;
    }

    return validation;
  }

  /**
   * Log access event
   */
  logAccess(operation, details = {}) {
    const event = {
      operation,
      timestamp: Date.now(),
      details,
      userId: details.userId || 'system'
    };

    this.accessLog.push(event);

    // Keep only recent logs
    if (this.accessLog.length > 10000) {
      this.accessLog = this.accessLog.slice(-10000);
    }

    return event;
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, details = {}) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      details,
      severity: details.severity || 'medium',
      userId: details.userId || 'unknown'
    };

    this.securityEvents.push(event);

    // Keep only recent events
    if (this.securityEvents.length > 5000) {
      this.securityEvents = this.securityEvents.slice(-5000);
    }

    return event;
  }

  /**
   * Get access audit trail
   */
  getAuditTrail(filters = {}) {
    let events = this.accessLog;

    if (filters.userId) {
      events = events.filter(e => e.userId === filters.userId);
    }

    if (filters.operation) {
      events = events.filter(e => e.operation === filters.operation);
    }

    if (filters.startTime) {
      events = events.filter(e => e.timestamp >= filters.startTime);
    }

    if (filters.endTime) {
      events = events.filter(e => e.timestamp <= filters.endTime);
    }

    return events;
  }

  /**
   * Get security incidents
   */
  getSecurityIncidents(severity = null) {
    let events = this.securityEvents;

    if (severity) {
      events = events.filter(e => e.severity === severity);
    }

    return events;
  }

  /**
   * Clean expired tokens
   */
  cleanExpiredTokens() {
    const now = Date.now();
    for (const [tokenId, tokenData] of this.tokenVault) {
      if (tokenData.expiresAt && tokenData.expiresAt < now) {
        this.tokenVault.delete(tokenId);
      }
    }
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    return {
      timestamp: Date.now(),
      encryptionStatus: {
        activeKeys: Array.from(this.encryptionKeys.values()).filter(k => k.active).length,
        totalKeys: this.encryptionKeys.size,
        lastKeyRotation: Math.max(
          ...Array.from(this.encryptionKeys.values()).map(k => k.created)
        )
      },
      tokenStatus: {
        activeTokens: Array.from(this.tokenVault.values()).filter(t => !t.revoked && t.expiresAt > Date.now()).length,
        totalTokens: this.tokenVault.size,
        revokedTokens: Array.from(this.tokenVault.values()).filter(t => t.revoked).length
      },
      auditLog: {
        totalEvents: this.accessLog.length,
        recentEvents: this.accessLog.slice(-100)
      },
      securityEvents: {
        critical: this.securityEvents.filter(e => e.severity === 'critical').length,
        high: this.securityEvents.filter(e => e.severity === 'high').length,
        medium: this.securityEvents.filter(e => e.severity === 'medium').length,
        low: this.securityEvents.filter(e => e.severity === 'low').length,
        totalEvents: this.securityEvents.length
      },
      dataClassifications: Array.from(this.dataClassifications.values()),
      policies: Object.fromEntries(this.policyEngine)
    };
  }

  /**
   * Get health status
   */
  getHealth() {
    return {
      encryptionEnabled: this.config.enableEncryption,
      tokenizationEnabled: this.config.enableTokenization,
      activeEncryptionKeys: Array.from(this.encryptionKeys.values()).filter(k => k.active).length,
      activeTokens: Array.from(this.tokenVault.values()).filter(t => !t.revoked).length,
      accessLogSize: this.accessLog.length,
      securityEventCount: this.securityEvents.length,
      criticalIncidents: this.securityEvents.filter(e => e.severity === 'critical').length
    };
  }

  /**
   * Reset all data
   */
  reset() {
    this.encryptionKeys.clear();
    this.tokenVault.clear();
    this.dataClassifications.clear();
    this.accessLog = [];
    this.securityEvents = [];
    this.encryptedCache.clear();
    this.policyEngine.clear();
    this.initialize();
  }
}

module.exports = AdvancedSecurity;
