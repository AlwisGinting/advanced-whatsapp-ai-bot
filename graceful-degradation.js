/**
 * Graceful Degradation & Fallback System
 * Handles service degradation, fallback strategies, and intelligent degradation
 */
class GracefulDegradation {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.serviceLevels = this.initializeServiceLevels();
    this.degradationStrategies = this.initializeDegradationStrategies();
    this.currentLevel = 'full_service';
    this.degradationHistory = [];
    this.fallbackCache = new Map();
  }

  /**
   * Initialize service levels
   */
  initializeServiceLevels() {
    return {
      'full_service': {
        level: 100,
        description: 'All features available, no limitations',
        features: {
          aiResponses: true,
          fileOperations: true,
          advancedSearch: true,
          roleManagement: true,
          sentimentAnalysis: true,
          caching: true,
          queueProcessing: true,
          performanceMonitoring: true
        }
      },
      'normal_with_warnings': {
        level: 80,
        description: 'All features available with warnings',
        features: {
          aiResponses: true,
          fileOperations: true,
          advancedSearch: true,
          roleManagement: true,
          sentimentAnalysis: true,
          caching: true,
          queueProcessing: true,
          performanceMonitoring: true
        },
        warnings: ['Slow response times detected', 'Some features may be delayed']
      },
      'limited_service': {
        level: 60,
        description: 'Non-critical features disabled',
        features: {
          aiResponses: true,
          fileOperations: true,
          advancedSearch: false,
          roleManagement: false,
          sentimentAnalysis: false,
          caching: true,
          queueProcessing: true,
          performanceMonitoring: false
        },
        disabled: ['Advanced search', 'Role management', 'Sentiment analysis', 'Performance monitoring']
      },
      'critical_mode': {
        level: 40,
        description: 'Only essential features active',
        features: {
          aiResponses: true,
          fileOperations: false,
          advancedSearch: false,
          roleManagement: false,
          sentimentAnalysis: false,
          caching: false,
          queueProcessing: true,
          performanceMonitoring: false
        },
        disabled: ['File operations', 'Advanced search', 'Role management', 'Sentiment analysis', 'Caching', 'Performance monitoring']
      },
      'fallback_only': {
        level: 20,
        description: 'Only cached responses and basic replies',
        features: {
          aiResponses: false,
          fileOperations: false,
          advancedSearch: false,
          roleManagement: false,
          sentimentAnalysis: false,
          caching: true,
          queueProcessing: false,
          performanceMonitoring: false
        },
        disabled: ['AI responses', 'File operations', 'Advanced search', 'Role management', 'Sentiment analysis', 'Queue processing', 'Performance monitoring']
      }
    };
  }

  /**
   * Initialize degradation strategies
   */
  initializeDegradationStrategies() {
    return {
      'high_latency': {
        trigger: { metric: 'responseTime', threshold: 5000 },
        action: 'degrade_to_limited',
        recovery: 'monitor_for_5_minutes'
      },
      'high_error_rate': {
        trigger: { metric: 'errorRate', threshold: 10 },
        action: 'degrade_to_critical',
        recovery: 'monitor_for_10_minutes'
      },
      'high_memory': {
        trigger: { metric: 'memoryUsage', threshold: 90 },
        action: 'clear_cache_and_degrade',
        recovery: 'monitor_memory'
      },
      'api_quota_exceeded': {
        trigger: { metric: 'quotaUsed', threshold: 95 },
        action: 'fallback_cache_only',
        recovery: 'reset_at_quota_renewal'
      },
      'queue_overflow': {
        trigger: { metric: 'queueSize', threshold: 1000 },
        action: 'drop_low_priority_items',
        recovery: 'process_queue_and_monitor'
      },
      'network_issues': {
        trigger: { metric: 'networkError', threshold: 5 },
        action: 'enable_circuit_breaker',
        recovery: 'test_connectivity'
      }
    };
  }

  /**
   * Get current service level
   */
  getCurrentLevel() {
    return this.serviceLevels[this.currentLevel];
  }

  /**
   * Check if feature is available
   */
  isFeatureAvailable(featureName) {
    const level = this.getCurrentLevel();
    return level.features[featureName] === true;
  }

  /**
   * Degrade to lower service level
   */
  degradeTo(levelName, reason = 'unknown') {
    const targetLevel = this.serviceLevels[levelName];
    
    if (!targetLevel) {
      this.logger.warn('Invalid degradation level', { level: levelName });
      return false;
    }

    if (targetLevel.level >= this.getCurrentLevel().level) {
      this.logger.debug('Already at same or higher level', { level: levelName });
      return false;
    }

    const previousLevel = this.currentLevel;
    this.currentLevel = levelName;

    const degradationEvent = {
      timestamp: Date.now(),
      fromLevel: previousLevel,
      toLevel: levelName,
      reason,
      features: {
        enabled: targetLevel.features,
        disabled: targetLevel.disabled || []
      }
    };

    this.degradationHistory.push(degradationEvent);

    // Keep last 100 degradation events
    if (this.degradationHistory.length > 100) {
      this.degradationHistory.shift();
    }

    this.logger.warn('Service degraded', {
      from: previousLevel,
      to: levelName,
      reason
    });

    return true;
  }

  /**
   * Upgrade to higher service level
   */
  upgradeTo(levelName) {
    const targetLevel = this.serviceLevels[levelName];
    
    if (!targetLevel) {
      this.logger.warn('Invalid upgrade level', { level: levelName });
      return false;
    }

    if (targetLevel.level <= this.getCurrentLevel().level) {
      this.logger.debug('Already at same or lower level', { level: levelName });
      return false;
    }

    const previousLevel = this.currentLevel;
    this.currentLevel = levelName;

    this.logger.info('Service upgraded', {
      from: previousLevel,
      to: levelName
    });

    return true;
  }

  /**
   * Get appropriate fallback response
   */
  getFallbackResponse(context = {}) {
    const responses = {
      'full_service': '✅ Sistem beroperasi normal. Silakan lanjutkan.',
      'normal_with_warnings': '⚠️ Ada beberapa gangguan minor. Respon mungkin lebih lambat.',
      'limited_service': '⚠️ Sistem dalam mode terbatas. Beberapa fitur dinonaktifkan.',
      'critical_mode': '🚨 Sistem dalam mode kritis. Hanya fitur esensial yang tersedia.',
      'fallback_only': '❌ Sistem offline. Hanya cache yang tersedia. Error: ' + (context.error || 'Unknown')
    };

    return responses[this.currentLevel] || responses['full_service'];
  }

  /**
   * Get alternative response when AI fails
   */
  getAlternativeResponse(originalRequest, reason = 'system_error') {
    // Check cache first
    if (this.fallbackCache.has(originalRequest)) {
      return this.fallbackCache.get(originalRequest);
    }

    // Generate response based on request type
    let response = '';

    if (originalRequest.includes('?')) {
      response = 'Maaf, saya tidak bisa memproses pertanyaan sekarang. ' +
                'Coba lagi dalam beberapa saat atau hubungi admin.';
    } else if (originalRequest.includes('buat') || originalRequest.includes('delete')) {
      response = 'Operasi file sedang dinonaktifkan. Coba lagi nanti.';
    } else if (originalRequest.includes('cari') || originalRequest.includes('search')) {
      response = 'Pencarian advanced sedang tidak tersedia. Gunakan perintah standar.';
    } else {
      response = 'Sistem sedang dalam maintenance. Terima kasih atas kesabarannya.';
    }

    return response;
  }

  /**
   * Cache successful response for fallback
   */
  cacheForFallback(request, response, ttl = 3600000) { // 1 hour
    this.fallbackCache.set(request, {
      response,
      timestamp: Date.now(),
      ttl,
      expiresAt: Date.now() + ttl
    });
  }

  /**
   * Get cached fallback response
   */
  getCachedFallback(request) {
    const cached = this.fallbackCache.get(request);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.fallbackCache.delete(request);
      return null;
    }

    return cached.response;
  }

  /**
   * Handle service degradation based on metrics
   */
  handleDegradation(metrics = {}) {
    const checks = [
      {
        name: 'High Latency',
        condition: metrics.averageResponseTime > 5000,
        strategy: 'high_latency'
      },
      {
        name: 'High Error Rate',
        condition: metrics.errorRate > 10,
        strategy: 'high_error_rate'
      },
      {
        name: 'Memory Critical',
        condition: metrics.memoryUsagePercent > 90,
        strategy: 'high_memory'
      },
      {
        name: 'API Quota Exceeded',
        condition: metrics.quotaUsed > 95,
        strategy: 'api_quota_exceeded'
      },
      {
        name: 'Queue Overflow',
        condition: metrics.queueSize > 1000,
        strategy: 'queue_overflow'
      },
      {
        name: 'Network Issues',
        condition: metrics.networkErrorCount > 5,
        strategy: 'network_issues'
      }
    ];

    for (const check of checks) {
      if (check.condition) {
        const strategy = this.degradationStrategies[check.strategy];
        
        if (strategy.action === 'degrade_to_limited') {
          this.degradeTo('limited_service', check.name);
        } else if (strategy.action === 'degrade_to_critical') {
          this.degradeTo('critical_mode', check.name);
        } else if (strategy.action === 'fallback_cache_only') {
          this.degradeTo('fallback_only', check.name);
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Attempt recovery
   */
  attemptRecovery() {
    const currentLevel = this.getCurrentLevel();
    
    // Try upgrading one level if not at full service
    if (this.currentLevel !== 'full_service') {
      const upgradeMap = {
        'fallback_only': 'critical_mode',
        'critical_mode': 'limited_service',
        'limited_service': 'normal_with_warnings',
        'normal_with_warnings': 'full_service'
      };

      const nextLevel = upgradeMap[this.currentLevel];
      if (nextLevel) {
        this.upgradeTo(nextLevel);
        this.logger.info('Recovery attempt: upgrading to ' + nextLevel);
        return true;
      }
    }

    return false;
  }

  /**
   * Get degradation status
   */
  getStatus() {
    const currentLevel = this.serviceLevels[this.currentLevel];
    
    return {
      currentLevel: this.currentLevel,
      levelScore: currentLevel.level,
      description: currentLevel.description,
      features: currentLevel.features,
      warnings: currentLevel.warnings || [],
      disabled: currentLevel.disabled || [],
      recentDegradations: this.degradationHistory.slice(-5),
      totalDegradationEvents: this.degradationHistory.length,
      cachedResponses: this.fallbackCache.size
    };
  }

  /**
   * Get degradation history
   */
  getHistory(limit = 20) {
    return this.degradationHistory.slice(-limit);
  }

  /**
   * Clear cache
   */
  clearCache() {
    const size = this.fallbackCache.size;
    this.fallbackCache.clear();
    this.logger.info('Fallback cache cleared', { itemsCleared: size });
  }

  /**
   * Get health score
   */
  getHealthScore() {
    // Based on current service level
    const levelScore = this.serviceLevels[this.currentLevel].level;
    
    // Based on degradation frequency
    const recentDegradations = this.degradationHistory.filter(
      event => Date.now() - event.timestamp < 3600000 // Last hour
    ).length;

    const degradationPenalty = Math.min(recentDegradations * 5, 30);
    
    return Math.max(0, levelScore - degradationPenalty);
  }

  /**
   * Generate diagnostic report
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      currentStatus: this.getStatus(),
      healthScore: this.getHealthScore(),
      recentHistory: this.getHistory(10),
      cachedResponses: Array.from(this.fallbackCache.keys()).slice(0, 10),
      recommendations: this.getRecommendations()
    };
  }

  /**
   * Get recovery recommendations
   */
  getRecommendations() {
    const recommendations = [];

    if (this.currentLevel !== 'full_service') {
      recommendations.push('System is degraded. Monitor for recovery opportunities.');
    }

    const recentErrors = this.degradationHistory.slice(-5);
    const errorTypes = {};

    recentErrors.forEach(event => {
      errorTypes[event.reason] = (errorTypes[event.reason] || 0) + 1;
    });

    for (const [reason, count] of Object.entries(errorTypes)) {
      if (count > 2) {
        recommendations.push(`Recurring issue detected: ${reason}. Consider investigation.`);
      }
    }

    if (this.fallbackCache.size > 5000) {
      recommendations.push('Cache is growing large. Consider clearing old entries.');
    }

    return recommendations;
  }

  /**
   * Reset to full service
   */
  reset(force = false) {
    if (!force && this.currentLevel === 'full_service') {
      return false;
    }

    const previousLevel = this.currentLevel;
    this.currentLevel = 'full_service';

    this.logger.info('Service level reset to full_service', { previousLevel });

    return true;
  }
}

module.exports = GracefulDegradation;
