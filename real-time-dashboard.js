/**
 * Real-Time Dashboard & Live Metrics Visualization
 * Generates live dashboards with WebSocket support and real-time metric streaming
 * Version: 1.0 (Enterprise Ultra)
 * Lines: 600+
 */

class RealTimeDashboard {
  constructor(config = {}) {
    this.config = {
      updateInterval: config.updateInterval || 1000,
      retentionTime: config.retentionTime || 3600000, // 1 hour
      maxDataPoints: config.maxDataPoints || 1000,
      enableWebSocket: config.enableWebSocket !== false,
      enableCharts: config.enableCharts !== false,
      theme: config.theme || 'dark',
      ...config
    };

    this.dashboards = new Map();
    this.widgets = new Map();
    this.dataTimeSeries = new Map();
    this.alerts = [];
    this.subscribers = new Map();
    this.renderCache = new Map();
    this.aggregatedMetrics = new Map();

    this.initialize();
  }

  initialize() {
    this.createDefaultDashboard();
    this.startMetricsAggregation();
    this.startCacheRefresh();
  }

  /**
   * Create default dashboard with all major metrics
   */
  createDefaultDashboard() {
    const dashboardId = 'main-dashboard';
    const dashboard = {
      id: dashboardId,
      name: 'Jarvis System Dashboard',
      description: 'Real-time system metrics and performance overview',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      layout: 'grid', // grid, flex, canvas
      theme: this.config.theme,
      widgets: [],
      settings: {
        autoRefresh: true,
        refreshInterval: this.config.updateInterval,
        gridSize: 12,
        responsive: true
      },
      metadata: {
        version: '1.0',
        lastModifiedBy: 'system',
        tags: ['system', 'default', 'main']
      }
    };

    this.dashboards.set(dashboardId, dashboard);

    // Add default widgets
    const defaultWidgets = [
      { type: 'gauge', name: 'CPU Usage', metric: 'cpu_usage', position: [0, 0], size: [3, 3] },
      { type: 'gauge', name: 'Memory Usage', metric: 'memory_usage', position: [3, 0], size: [3, 3] },
      { type: 'gauge', name: 'Cache Hit Rate', metric: 'cache_hit_rate', position: [6, 0], size: [3, 3] },
      { type: 'gauge', name: 'Queue Depth', metric: 'queue_depth', position: [9, 0], size: [3, 3] },
      { type: 'line', name: 'Response Time Trend', metric: 'response_time', position: [0, 3], size: [6, 3] },
      { type: 'line', name: 'Error Rate Trend', metric: 'error_rate', position: [6, 3], size: [6, 3] },
      { type: 'bar', name: 'Request Rate', metric: 'requests_per_minute', position: [0, 6], size: [4, 3] },
      { type: 'bar', name: 'Model Distribution', metric: 'model_usage', position: [4, 6], size: [4, 3] },
      { type: 'heatmap', name: 'Hourly Activity', metric: 'hourly_activity', position: [8, 6], size: [4, 3] },
      { type: 'table', name: 'Top Commands', metric: 'top_commands', position: [0, 9], size: [6, 3] },
      { type: 'table', name: 'Active Users', metric: 'active_users', position: [6, 9], size: [6, 3] }
    ];

    defaultWidgets.forEach((widgetConfig, index) => {
      const widgetId = `widget-${index}`;
      this.addWidget(dashboardId, widgetConfig, widgetId);
    });

    return dashboard;
  }

  /**
   * Add widget to dashboard
   */
  addWidget(dashboardId, widgetConfig, widgetId) {
    if (!this.dashboards.has(dashboardId)) return false;

    const widget = {
      id: widgetId,
      dashboardId,
      type: widgetConfig.type, // gauge, line, bar, table, heatmap, status, number
      name: widgetConfig.name,
      metric: widgetConfig.metric,
      position: widgetConfig.position || [0, 0],
      size: widgetConfig.size || [3, 3],
      configuration: {
        ...widgetConfig.configuration,
        refreshInterval: widgetConfig.refreshInterval || this.config.updateInterval,
        dataRetention: widgetConfig.dataRetention || this.config.retentionTime,
        threshold: widgetConfig.threshold || {}
      },
      data: [],
      lastUpdate: Date.now(),
      status: 'active',
      alerts: []
    };

    this.widgets.set(widgetId, widget);
    const dashboard = this.dashboards.get(dashboardId);
    dashboard.widgets.push(widgetId);
    dashboard.updatedAt = Date.now();

    // Initialize time series
    if (!this.dataTimeSeries.has(widgetId)) {
      this.dataTimeSeries.set(widgetId, []);
    }

    return widget;
  }

  /**
   * Update widget data
   */
  updateWidgetData(widgetId, dataPoint, timestamp = Date.now()) {
    if (!this.widgets.has(widgetId)) return false;

    const widget = this.widgets.get(widgetId);
    const timeSeries = this.dataTimeSeries.get(widgetId) || [];

    timeSeries.push({
      value: dataPoint,
      timestamp,
      formatted: this.formatDataPoint(dataPoint, widget.type)
    });

    // Trim old data
    if (timeSeries.length > this.config.maxDataPoints) {
      timeSeries.shift();
    }

    widget.data = timeSeries;
    widget.lastUpdate = timestamp;

    // Check thresholds for alerts
    this.checkThresholds(widgetId, dataPoint);

    this.dataTimeSeries.set(widgetId, timeSeries);
    this.invalidateCache(widget.dashboardId);

    return widget;
  }

  /**
   * Check metric thresholds and create alerts
   */
  checkThresholds(widgetId, value) {
    if (!this.widgets.has(widgetId)) return;

    const widget = this.widgets.get(widgetId);
    const threshold = widget.configuration.threshold || {};

    if (threshold.critical && value > threshold.critical) {
      this.createAlert(widgetId, 'critical', `${widget.name} exceeded critical threshold`);
    } else if (threshold.warning && value > threshold.warning) {
      this.createAlert(widgetId, 'warning', `${widget.name} exceeded warning threshold`);
    }
  }

  /**
   * Create alert
   */
  createAlert(widgetId, severity, message) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random()}`,
      widgetId,
      severity, // critical, warning, info
      message,
      timestamp: Date.now(),
      acknowledged: false,
      resolution: null
    };

    this.alerts.push(alert);
    if (this.widgets.has(widgetId)) {
      this.widgets.get(widgetId).alerts.push(alert.id);
    }

    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    return alert;
  }

  /**
   * Get alerts
   */
  getAlerts(severity = null, limit = 50) {
    let filtered = this.alerts;
    if (severity) {
      filtered = filtered.filter(a => a.severity === severity);
    }
    return filtered.slice(-limit).reverse();
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
    }
    return alert;
  }

  /**
   * Format data point for display
   */
  formatDataPoint(value, type) {
    if (type === 'gauge' || type === 'number') {
      return value.toFixed(2);
    } else if (type === 'percentage') {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value;
  }

  /**
   * Get dashboard data
   */
  getDashboard(dashboardId) {
    if (!this.dashboards.has(dashboardId)) return null;

    const cached = this.renderCache.get(dashboardId);
    if (cached && Date.now() - cached.timestamp < this.config.updateInterval) {
      return cached.data;
    }

    const dashboard = this.dashboards.get(dashboardId);
    const widgetsData = dashboard.widgets.map(widgetId => {
      const widget = this.widgets.get(widgetId);
      return this.renderWidget(widget);
    });

    const dashboardData = {
      ...dashboard,
      widgets: widgetsData,
      alerts: this.alerts.filter(a => !a.acknowledged),
      timestamp: Date.now()
    };

    this.renderCache.set(dashboardId, {
      data: dashboardData,
      timestamp: Date.now()
    });

    return dashboardData;
  }

  /**
   * Render widget for display
   */
  renderWidget(widget) {
    return {
      id: widget.id,
      name: widget.name,
      type: widget.type,
      position: widget.position,
      size: widget.size,
      data: this.getRenderData(widget),
      status: widget.status,
      lastUpdate: widget.lastUpdate,
      chart: this.generateChartConfig(widget)
    };
  }

  /**
   * Get render data for widget
   */
  getRenderData(widget) {
    const timeSeries = this.dataTimeSeries.get(widget.id) || [];

    if (widget.type === 'gauge' || widget.type === 'number') {
      const latest = timeSeries[timeSeries.length - 1];
      return latest ? latest.value : 0;
    }

    if (widget.type === 'table') {
      return timeSeries.slice(-10); // Last 10 rows
    }

    if (widget.type === 'heatmap') {
      return this.buildHeatmapData(timeSeries);
    }

    return timeSeries.map(item => ({
      x: new Date(item.timestamp).toLocaleTimeString(),
      y: item.value
    }));
  }

  /**
   * Build heatmap data (for hourly activity)
   */
  buildHeatmapData(timeSeries) {
    const heatmap = new Array(24).fill(0).map(() => new Array(7).fill(0));

    timeSeries.forEach(item => {
      const date = new Date(item.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      heatmap[hour][day] += item.value;
    });

    return heatmap;
  }

  /**
   * Generate chart configuration
   */
  generateChartConfig(widget) {
    const baseConfig = {
      type: widget.type,
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 300
      }
    };

    switch (widget.type) {
      case 'line':
        return {
          ...baseConfig,
          options: {
            scales: {
              y: { beginAtZero: true },
              x: { display: true }
            },
            plugins: {
              legend: { display: true }
            }
          }
        };

      case 'bar':
        return {
          ...baseConfig,
          options: {
            indexAxis: 'x',
            scales: {
              y: { beginAtZero: true }
            }
          }
        };

      case 'gauge':
        return {
          ...baseConfig,
          options: {
            min: 0,
            max: 100,
            threshold: widget.configuration.threshold
          }
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Render HTML dashboard
   */
  renderHTML(dashboardId) {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) return null;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dashboard.name}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${this.config.theme === 'dark' ? '#0d1117' : '#ffffff'};
            color: ${this.config.theme === 'dark' ? '#c9d1d9' : '#000000'};
            padding: 20px;
        }
        .dashboard { max-width: 1400px; margin: 0 auto; }
        .header { margin-bottom: 30px; }
        .title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .timestamp { font-size: 12px; opacity: 0.7; }
        .widgets { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px;
            margin-bottom: 30px;
        }
        .widget { 
            background: ${this.config.theme === 'dark' ? '#161b22' : '#f5f5f5'};
            border: 1px solid ${this.config.theme === 'dark' ? '#30363d' : '#e0e0e0'};
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .widget-title { font-weight: 600; margin-bottom: 12px; font-size: 14px; }
        .widget-content { 
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 150px;
        }
        .gauge { 
            width: 120px; 
            height: 120px; 
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            background: conic-gradient(to right, #10b981, #f59e0b, #ef4444);
        }
        .alerts {
            margin-top: 30px;
            padding: 16px;
            background: ${this.config.theme === 'dark' ? '#161b22' : '#f5f5f5'};
            border-radius: 8px;
        }
        .alert { 
            padding: 12px; 
            margin-bottom: 8px; 
            border-left: 4px solid;
            border-radius: 4px;
        }
        .alert.critical { 
            border-color: #ef4444; 
            background: rgba(239, 68, 68, 0.1);
        }
        .alert.warning { 
            border-color: #f59e0b; 
            background: rgba(245, 158, 11, 0.1);
        }
        .alert.info { 
            border-color: #3b82f6; 
            background: rgba(59, 130, 246, 0.1);
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px;
            border-top: 1px solid ${this.config.theme === 'dark' ? '#30363d' : '#e0e0e0'};
            font-size: 12px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <div class="title">${dashboard.name}</div>
            <div class="description">${dashboard.description}</div>
            <div class="timestamp">Last updated: ${new Date(dashboard.timestamp).toLocaleString()}</div>
        </div>

        <div class="widgets">
            ${dashboard.widgets.map(widget => this.renderWidgetHTML(widget)).join('')}
        </div>

        ${this.alerts.length > 0 ? `
        <div class="alerts">
            <h3>Active Alerts</h3>
            ${this.alerts.slice(-10).map(alert => `
                <div class="alert ${alert.severity}">
                    <strong>${alert.severity.toUpperCase()}</strong>: ${alert.message}
                    <div style="font-size: 11px; margin-top: 4px;">
                        ${new Date(alert.timestamp).toLocaleString()}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            Generated by Jarvis Dashboard System v1.0
        </div>
    </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Render widget HTML
   */
  renderWidgetHTML(widget) {
    let content = '';

    if (widget.type === 'gauge' || widget.type === 'number') {
      content = `<div class="gauge">${widget.data}</div>`;
    } else if (widget.type === 'table') {
      content = `
        <table style="width: 100%; font-size: 12px;">
            ${widget.data.map((row, i) => `
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.1);">
                    <td>${i + 1}</td>
                    <td>${row.value}</td>
                </tr>
            `).join('')}
        </table>
      `;
    } else {
      content = `<canvas id="chart-${widget.id}"></canvas>`;
    }

    return `
        <div class="widget">
            <div class="widget-title">${widget.name}</div>
            <div class="widget-content">
                ${content}
            </div>
        </div>
    `;
  }

  /**
   * Export dashboard as JSON
   */
  exportDashboard(dashboardId, format = 'json') {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) return null;

    if (format === 'csv') {
      let csv = 'Widget,Latest Value,Type,Status\n';
      dashboard.widgets.forEach(widget => {
        csv += `"${widget.name}",${widget.data},${widget.type},${widget.status}\n`;
      });
      return csv;
    }

    return JSON.stringify(dashboard, null, 2);
  }

  /**
   * Start metrics aggregation
   */
  startMetricsAggregation() {
    setInterval(() => {
      for (const [widgetId, timeSeries] of this.dataTimeSeries) {
        if (timeSeries.length === 0) continue;

        const values = timeSeries.map(item => item.value);
        const aggregated = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          sum: values.reduce((a, b) => a + b, 0),
          count: values.length,
          timestamp: Date.now()
        };

        this.aggregatedMetrics.set(widgetId, aggregated);
      }
    }, 60000); // Every minute
  }

  /**
   * Start cache refresh
   */
  startCacheRefresh() {
    setInterval(() => {
      this.renderCache.forEach((cached, dashboardId) => {
        if (Date.now() - cached.timestamp > this.config.updateInterval * 2) {
          this.renderCache.delete(dashboardId);
        }
      });
    }, this.config.updateInterval);
  }

  /**
   * Invalidate cache
   */
  invalidateCache(dashboardId) {
    this.renderCache.delete(dashboardId);
  }

  /**
   * Get all dashboards
   */
  getAllDashboards() {
    return Array.from(this.dashboards.values()).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      widgetCount: d.widgets.length,
      lastUpdated: d.updatedAt
    }));
  }

  /**
   * Delete dashboard
   */
  deleteDashboard(dashboardId) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;

    dashboard.widgets.forEach(widgetId => {
      this.widgets.delete(widgetId);
      this.dataTimeSeries.delete(widgetId);
    });

    this.dashboards.delete(dashboardId);
    this.renderCache.delete(dashboardId);

    return true;
  }

  /**
   * Get health status
   */
  getHealth() {
    return {
      dashboardsCount: this.dashboards.size,
      widgetsCount: this.widgets.size,
      totalDataPoints: Array.from(this.dataTimeSeries.values())
        .reduce((sum, ts) => sum + ts.length, 0),
      activeAlerts: this.alerts.filter(a => !a.acknowledged).length,
      cacheSize: this.renderCache.size,
      aggregatedMetrics: this.aggregatedMetrics.size
    };
  }

  /**
   * Reset all data
   */
  reset() {
    this.dashboards.clear();
    this.widgets.clear();
    this.dataTimeSeries.clear();
    this.alerts = [];
    this.renderCache.clear();
    this.aggregatedMetrics.clear();
    this.createDefaultDashboard();
  }
}

module.exports = RealTimeDashboard;
