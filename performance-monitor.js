/**
 * Performance Monitoring & Analytics Manager
 * Real-time monitoring, metrics aggregation, and performance analytics
 */
class PerformanceMonitor {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.metrics = {
      requests: [],
      responses: [],
      errors: [],
      operations: new Map(),
      systemHealth: {
        cpu: [],
        memory: [],
        uptime: process.uptime()
      }
    };
    this.thresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 5, // 5%
      queueSize: 100,
      memoryUsage: 512 // MB
    };
    this.alerts = [];
    this.startTime = Date.now();
  }

  /**
   * Record API request
   */
  recordRequest(requestId, endpoint, params = {}) {
    const record = {
      id: requestId,
      endpoint,
      params,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.metrics.requests.push(record);

    // Keep last 1000 requests
    if (this.metrics.requests.length > 1000) {
      this.metrics.requests.shift();
    }

    return record;
  }

  /**
   * Record API response
   */
  recordResponse(requestId, statusCode, responseTime, dataSize = 0) {
    const record = {
      id: requestId,
      statusCode,
      responseTime,
      dataSize,
      timestamp: Date.now()
    };

    this.metrics.responses.push(record);

    // Keep last 1000 responses
    if (this.metrics.responses.length > 1000) {
      this.metrics.responses.shift();
    }

    // Check threshold
    if (responseTime > this.thresholds.responseTime) {
      this.createAlert('SLOW_RESPONSE', {
        requestId,
        responseTime,
        threshold: this.thresholds.responseTime
      });
    }

    return record;
  }

  /**
   * Record error
   */
  recordError(errorId, errorType, errorMessage, context = {}) {
    const record = {
      id: errorId,
      type: errorType,
      message: errorMessage,
      context,
      timestamp: Date.now()
    };

    this.metrics.errors.push(record);

    // Keep last 500 errors
    if (this.metrics.errors.length > 500) {
      this.metrics.errors.shift();
    }

    return record;
  }

  /**
   * Record operation
   */
  recordOperation(operationName, duration, status = 'success', metadata = {}) {
    if (!this.metrics.operations.has(operationName)) {
      this.metrics.operations.set(operationName, {
        name: operationName,
        calls: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        successCount: 0,
        failureCount: 0,
        lastCall: null
      });
    }

    const op = this.metrics.operations.get(operationName);
    op.calls++;
    op.totalDuration += duration;
    op.minDuration = Math.min(op.minDuration, duration);
    op.maxDuration = Math.max(op.maxDuration, duration);
    op.lastCall = Date.now();

    if (status === 'success') {
      op.successCount++;
    } else {
      op.failureCount++;
    }
  }

  /**
   * Get request metrics
   */
  getRequestMetrics() {
    if (this.metrics.requests.length === 0) {
      return { totalRequests: 0, averageTime: 0 };
    }

    const avgTime = this.metrics.requests.reduce((sum, r) => sum + (r.responseTime || 0), 0) / 
                   this.metrics.requests.length;

    return {
      totalRequests: this.metrics.requests.length,
      averageTime: Math.round(avgTime),
      requestsPerMinute: Math.round((this.metrics.requests.length / ((Date.now() - this.startTime) / 60000))),
      recentRequests: this.metrics.requests.slice(-10)
    };
  }

  /**
   * Get response metrics
   */
  getResponseMetrics() {
    if (this.metrics.responses.length === 0) {
      return { totalResponses: 0, averageTime: 0, errorRate: 0 };
    }

    const avgTime = this.metrics.responses.reduce((sum, r) => sum + r.responseTime, 0) / 
                   this.metrics.responses.length;

    const errors = this.metrics.responses.filter(r => r.statusCode >= 400).length;
    const errorRate = (errors / this.metrics.responses.length) * 100;

    return {
      totalResponses: this.metrics.responses.length,
      averageTime: Math.round(avgTime),
      p50: this.getPercentile(this.metrics.responses.map(r => r.responseTime), 50),
      p95: this.getPercentile(this.metrics.responses.map(r => r.responseTime), 95),
      p99: this.getPercentile(this.metrics.responses.map(r => r.responseTime), 99),
      errorRate: Math.round(errorRate * 100) / 100,
      totalDataTransferred: Math.round(
        this.metrics.responses.reduce((sum, r) => sum + r.dataSize, 0) / 1024 / 1024
      ), // MB
      statusCodeDistribution: this.getStatusCodeDistribution()
    };
  }

  /**
   * Get error metrics
   */
  getErrorMetrics() {
    if (this.metrics.errors.length === 0) {
      return { totalErrors: 0, errorRate: 0, topErrors: [] };
    }

    const errorTypeMap = {};

    this.metrics.errors.forEach(error => {
      errorTypeMap[error.type] = (errorTypeMap[error.type] || 0) + 1;
    });

    const totalResponses = this.metrics.responses.length;
    const errorRate = totalResponses > 0 ? 
      (this.metrics.errors.length / totalResponses) * 100 : 0;

    const topErrors = Object.entries(errorTypeMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.metrics.errors.length,
      errorRate: Math.round(errorRate * 100) / 100,
      topErrors,
      recentErrors: this.metrics.errors.slice(-5)
    };
  }

  /**
   * Get operation metrics
   */
  getOperationMetrics() {
    const operations = [];

    for (const [name, data] of this.metrics.operations.entries()) {
      const avgTime = data.calls > 0 ? data.totalDuration / data.calls : 0;
      const successRate = data.calls > 0 ? (data.successCount / data.calls) * 100 : 0;

      operations.push({
        name,
        calls: data.calls,
        averageTime: Math.round(avgTime),
        minTime: data.minDuration === Infinity ? 0 : Math.round(data.minDuration),
        maxTime: Math.round(data.maxDuration),
        successRate: Math.round(successRate),
        lastCall: new Date(data.lastCall).toISOString()
      });
    }

    return operations.sort((a, b) => b.calls - a.calls);
  }

  /**
   * Get system health
   */
  getSystemHealth() {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    const health = {
      uptime: Math.round(uptime),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      cpuUsage: process.cpuUsage(),
      activeAlerts: this.alerts.length
    };

    // Check memory threshold
    if (health.memory.heapUsagePercent > 90) {
      this.createAlert('HIGH_MEMORY_USAGE', { usage: health.memory.heapUsagePercent });
    }

    return health;
  }

  /**
   * Get dashboard summary
   */
  getDashboard() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests: this.metrics.requests.length,
        totalResponses: this.metrics.responses.length,
        totalErrors: this.metrics.errors.length,
        totalOperations: this.metrics.operations.size
      },
      requests: this.getRequestMetrics(),
      responses: this.getResponseMetrics(),
      errors: this.getErrorMetrics(),
      operations: this.getOperationMetrics(),
      system: this.getSystemHealth(),
      alerts: this.getActiveAlerts()
    };
  }

  /**
   * Create alert
   */
  createAlert(alertType, details = {}) {
    const alert = {
      type: alertType,
      details,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.push(alert);

    this.logger.warn('Performance alert', { alert });

    // Keep last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    return alert;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertType) {
    const alert = this.alerts.find(a => a.type === alertType && !a.resolved);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  /**
   * Get percentile
   */
  getPercentile(values, percentile) {
    if (values.length === 0) return 0;

    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return Math.round(sorted[Math.max(0, index)]);
  }

  /**
   * Get status code distribution
   */
  getStatusCodeDistribution() {
    const distribution = {};

    this.metrics.responses.forEach(r => {
      const code = r.statusCode;
      distribution[code] = (distribution[code] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Export metrics
   */
  exportMetrics(format = 'json') {
    const data = {
      exportedAt: new Date().toISOString(),
      period: {
        start: new Date(this.startTime).toISOString(),
        end: new Date().toISOString()
      },
      dashboard: this.getDashboard()
    };

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return data;
  }

  /**
   * Convert metrics to CSV
   */
  convertToCSV(data) {
    let csv = 'Metric,Value\n';

    const metrics = data.dashboard;
    csv += `Total Requests,${metrics.requests.totalRequests}\n`;
    csv += `Total Responses,${metrics.responses.totalResponses}\n`;
    csv += `Total Errors,${metrics.errors.totalErrors}\n`;
    csv += `Average Response Time,${metrics.responses.averageTime}ms\n`;
    csv += `Error Rate,${metrics.errors.errorRate}%\n`;
    csv += `Memory Usage,${metrics.system.memory.heapUsagePercent}%\n`;
    csv += `Uptime,${metrics.system.uptime}s\n`;

    return csv;
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(maxAge = 3600000) { // 1 hour
    const now = Date.now();

    this.metrics.requests = this.metrics.requests.filter(r => now - r.timestamp < maxAge);
    this.metrics.responses = this.metrics.responses.filter(r => now - r.timestamp < maxAge);
    this.metrics.errors = this.metrics.errors.filter(r => now - r.timestamp < maxAge);

    this.logger.info('Old metrics cleared', { maxAge });
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      requests: [],
      responses: [],
      errors: [],
      operations: new Map(),
      systemHealth: { cpu: [], memory: [], uptime: process.uptime() }
    };
    this.alerts = [];
    this.startTime = Date.now();

    this.logger.info('All metrics reset');
  }
}

module.exports = PerformanceMonitor;
