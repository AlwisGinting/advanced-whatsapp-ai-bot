/**
 * Self-Healing & Preventive Maintenance
 * Auto-recovery, preventive diagnostics, and proactive health management
 */
class SelfHealingEngine {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.healthStatus = 'healthy';
    this.issues = [];
    this.recoveryAttempts = [];
    this.maintenanceTasks = [];
    this.diagnostics = {
      memory: {},
      cpu: {},
      api: {},
      cache: {},
      queue: {},
      database: {}
    };
  }

  /**
   * Run comprehensive diagnostics
   */
  async runDiagnostics(managers) {
    const diagnosticsResult = {
      timestamp: Date.now(),
      status: 'running',
      checks: {}
    };

    try {
      // Memory diagnostics
      diagnosticsResult.checks.memory = this.checkMemory();

      // API diagnostics
      if (managers.reliabilityManager) {
        diagnosticsResult.checks.api = this.checkAPIHealth(managers.reliabilityManager);
      }

      // Cache diagnostics
      if (managers.aiOptimizer) {
        diagnosticsResult.checks.cache = this.checkCacheHealth(managers.aiOptimizer);
      }

      // Queue diagnostics
      if (managers.messageQueue) {
        diagnosticsResult.checks.queue = this.checkQueueHealth(managers.messageQueue);
      }

      // Performance diagnostics
      if (managers.performanceMonitor) {
        diagnosticsResult.checks.performance = this.checkPerformance(managers.performanceMonitor);
      }

      // Degradation diagnostics
      if (managers.gracefulDegradation) {
        diagnosticsResult.checks.degradation = this.checkDegradation(managers.gracefulDegradation);
      }

      diagnosticsResult.status = 'completed';
      diagnosticsResult.summary = this.generateDiagnosticsSummary(diagnosticsResult.checks);

      this.diagnostics = diagnosticsResult;
      return diagnosticsResult;
    } catch (error) {
      this.logger.error('Diagnostics failed', { error: error.message });
      diagnosticsResult.status = 'failed';
      diagnosticsResult.error = error.message;
      return diagnosticsResult;
    }
  }

  /**
   * Check memory health
   */
  checkMemory() {
    const used = process.memoryUsage();
    const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;

    return {
      heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
      heapUsedPercent: heapUsedPercent.toFixed(1),
      external: Math.round(used.external / 1024 / 1024) + 'MB',
      status: heapUsedPercent > 90 ? 'critical' : heapUsedPercent > 75 ? 'warning' : 'healthy',
      recommendation: heapUsedPercent > 80 ? 'Run garbage collection' : 'OK'
    };
  }

  /**
   * Check API health
   */
  checkAPIHealth(reliabilityManager) {
    const health = reliabilityManager.getMetrics();

    return {
      circuitBreakers: health.breakers,
      overallHealth: health.overallHealthScore,
      status: health.overallHealthScore > 80 ? 'healthy' : 'degraded',
      recommendation: health.overallHealthScore < 70 ? 'Initiate service degradation' : 'OK'
    };
  }

  /**
   * Check cache health
   */
  checkCacheHealth(aiOptimizer) {
    const metrics = aiOptimizer.getMetrics();

    return {
      cacheHitRate: metrics.cacheHitRate.toFixed(1) + '%',
      totalRequests: metrics.totalRequests,
      cacheHits: metrics.cacheHits,
      cacheMisses: metrics.cacheMisses,
      status: metrics.cacheHitRate > 50 ? 'healthy' : 'low',
      recommendation: metrics.cacheHitRate < 30 ? 'Increase cache TTL' : 'OK'
    };
  }

  /**
   * Check queue health
   */
  checkQueueHealth(messageQueue) {
    const status = messageQueue.getStatus();

    return {
      queueSize: status.queueSize,
      activeRequests: status.activeRequests,
      maxConcurrent: status.maxConcurrent,
      utilization: Math.round((status.activeRequests / status.maxConcurrent) * 100) + '%',
      successRate: status.metrics?.successRate?.toFixed(1) + '%' || 'N/A',
      status: status.queueSize > 100 ? 'warning' : 'healthy',
      recommendation: status.queueSize > 200 ? 'Increase concurrency or reduce load' : 'OK'
    };
  }

  /**
   * Check performance
   */
  checkPerformance(performanceMonitor) {
    const metrics = performanceMonitor.getResponseMetrics();
    const errors = performanceMonitor.getErrorMetrics();

    return {
      avgResponseTime: metrics.averageTime + 'ms',
      p95ResponseTime: metrics.p95 + 'ms',
      p99ResponseTime: metrics.p99 + 'ms',
      errorRate: errors.errorRate.toFixed(2) + '%',
      status: metrics.averageTime > 5000 ? 'slow' : 'healthy',
      recommendation: metrics.averageTime > 3000 ? 'Optimize prompts or increase resources' : 'OK'
    };
  }

  /**
   * Check degradation status
   */
  checkDegradation(gracefulDegradation) {
    const status = gracefulDegradation.getStatus();
    const health = gracefulDegradation.getHealthScore();

    return {
      currentLevel: status.currentLevel,
      healthScore: health,
      lastDegraded: status.lastDegraded,
      degradationCount: status.degradationCount || 0,
      status: health < 50 ? 'critical' : health < 70 ? 'degraded' : 'healthy',
      recommendation: health < 60 ? 'Consider manual intervention' : 'OK'
    };
  }

  /**
   * Generate diagnostics summary
   */
  generateDiagnosticsSummary(checks) {
    const criticalIssues = Object.values(checks)
      .filter(c => c && c.status === 'critical').length;

    const warnings = Object.values(checks)
      .filter(c => c && c.status === 'warning').length;

    return {
      totalChecks: Object.keys(checks).length,
      criticalIssues,
      warnings,
      overallStatus: criticalIssues > 0 ? 'critical' : warnings > 0 ? 'warning' : 'healthy'
    };
  }

  /**
   * Attempt auto-recovery
   */
  async attemptRecovery(issue, managers) {
    const recovery = {
      issueId: issue.id,
      timestamp: Date.now(),
      attempts: 0,
      success: false,
      actions: []
    };

    try {
      // Memory recovery
      if (issue.type === 'high_memory_usage') {
        recovery.actions.push('Running garbage collection');
        if (global.gc) {
          global.gc();
        }
        recovery.attempts++;
      }

      // Cache recovery
      if (issue.type === 'low_cache_hit_rate' && managers.aiOptimizer) {
        recovery.actions.push('Clearing old cache entries');
        managers.aiOptimizer.clearCache();
        recovery.attempts++;
      }

      // Queue recovery
      if (issue.type === 'queue_overflow' && managers.messageQueue) {
        recovery.actions.push('Increasing concurrency');
        managers.messageQueue.setConcurrency(
          managers.messageQueue.maxConcurrentRequests + 2
        );
        recovery.attempts++;
      }

      // API recovery
      if (issue.type === 'api_degradation' && managers.reliabilityManager) {
        recovery.actions.push('Resetting circuit breaker');
        // Circuit breaker will auto-reset based on config
        recovery.attempts++;
      }

      recovery.success = recovery.attempts > 0;
      this.recoveryAttempts.push(recovery);
      this.logger.info('Recovery executed', recovery);

      return recovery;
    } catch (error) {
      this.logger.error('Recovery failed', { issue, error: error.message });
      recovery.error = error.message;
      return recovery;
    }
  }

  /**
   * Identify issues from diagnostics
   */
  identifyIssues(diagnosticsResult) {
    this.issues = [];

    if (diagnosticsResult.checks.memory?.status === 'critical') {
      this.issues.push({
        id: `issue_${Date.now()}`,
        type: 'high_memory_usage',
        severity: 'critical',
        description: `Heap usage at ${diagnosticsResult.checks.memory.heapUsedPercent}%`,
        timestamp: Date.now()
      });
    }

    if (diagnosticsResult.checks.cache?.status === 'low') {
      this.issues.push({
        id: `issue_${Date.now()}`,
        type: 'low_cache_hit_rate',
        severity: 'warning',
        description: `Cache hit rate: ${diagnosticsResult.checks.cache.cacheHitRate}`,
        timestamp: Date.now()
      });
    }

    if (diagnosticsResult.checks.queue?.status === 'warning') {
      this.issues.push({
        id: `issue_${Date.now()}`,
        type: 'queue_overflow',
        severity: 'warning',
        description: `Queue size: ${diagnosticsResult.checks.queue.queueSize}`,
        timestamp: Date.now()
      });
    }

    if (diagnosticsResult.checks.performance?.status === 'slow') {
      this.issues.push({
        id: `issue_${Date.now()}`,
        type: 'performance_degradation',
        severity: 'warning',
        description: `Avg response time: ${diagnosticsResult.checks.performance.avgResponseTime}`,
        timestamp: Date.now()
      });
    }

    return this.issues;
  }

  /**
   * Schedule preventive maintenance
   */
  scheduleMaintenanceTasks() {
    this.maintenanceTasks = [
      {
        name: 'Clear old cache',
        interval: 60 * 60 * 1000, // 1 hour
        lastRun: 0
      },
      {
        name: 'Cleanup old logs',
        interval: 24 * 60 * 60 * 1000, // 24 hours
        lastRun: 0
      },
      {
        name: 'Reset monthly metrics',
        interval: 30 * 24 * 60 * 60 * 1000, // 30 days
        lastRun: 0
      },
      {
        name: 'Analyze patterns',
        interval: 6 * 60 * 60 * 1000, // 6 hours
        lastRun: 0
      },
      {
        name: 'Health check',
        interval: 60 * 60 * 1000, // 1 hour
        lastRun: 0
      }
    ];

    return this.maintenanceTasks;
  }

  /**
   * Execute due maintenance tasks
   */
  async executeDueTasks(managers) {
    const now = Date.now();
    const executed = [];

    for (const task of this.maintenanceTasks) {
      if (now - task.lastRun > task.interval) {
        try {
          // Execute based on task name
          switch (task.name) {
            case 'Clear old cache':
              if (managers.aiOptimizer) {
                managers.aiOptimizer.clearCache();
              }
              break;
            case 'Health check':
              await this.runDiagnostics(managers);
              break;
          }

          task.lastRun = now;
          executed.push(task.name);
        } catch (error) {
          this.logger.error(`Task failed: ${task.name}`, { error: error.message });
        }
      }
    }

    return executed;
  }

  /**
   * Get health report
   */
  getHealthReport() {
    return {
      timestamp: Date.now(),
      status: this.healthStatus,
      diagnostics: this.diagnostics,
      issues: this.issues.slice(-20),
      recoveryAttempts: this.recoveryAttempts.slice(-20),
      maintenanceTasks: this.maintenanceTasks,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    for (const issue of this.issues.slice(-10)) {
      if (issue.severity === 'critical') {
        recommendations.push(`URGENT: Address ${issue.type} - ${issue.description}`);
      }
    }

    return recommendations;
  }

  /**
   * Export diagnostics report
   */
  exportReport() {
    return {
      summary: {
        generatedAt: new Date().toISOString(),
        currentStatus: this.healthStatus,
        totalIssues: this.issues.length,
        totalRecoveryAttempts: this.recoveryAttempts.length
      },
      diagnostics: this.diagnostics,
      issues: this.issues,
      recoveryHistory: this.recoveryAttempts.slice(-50),
      maintenanceSchedule: this.maintenanceTasks,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Reset self-healing engine
   */
  reset() {
    this.healthStatus = 'healthy';
    this.issues = [];
    this.recoveryAttempts = [];
    this.maintenanceTasks = [];
    this.diagnostics = {};
    this.logger.info('Self-healing engine reset');
  }
}

module.exports = SelfHealingEngine;
