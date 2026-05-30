/**
 * Advanced Observability & Distributed Tracing System
 * Provides enterprise-grade observability with full tracing, profiling, and context propagation
 * Version: 1.0 (Enterprise Ultra)
 * Lines: 550+
 */

const { v4: uuid } = require('uuid');

class AdvancedObservability {
  constructor(config = {}) {
    this.config = {
      enableTracing: config.enableTracing !== false,
      enableMetricsCollection: config.enableMetricsCollection !== false,
      enableProfiling: config.enableProfiling !== false,
      samplingRate: config.samplingRate || 1.0,
      maxSpanDuration: config.maxSpanDuration || 300000, // 5 minutes
      maxTraceSize: config.maxTraceSize || 10000,
      contextPropagation: config.contextPropagation !== false,
      ...config
    };

    this.traces = new Map();
    this.spans = new Map();
    this.metrics = new Map();
    this.profiles = new Map();
    this.baggage = new Map(); // Cross-service context
    this.contextStack = [];
    this.activeContexts = new Map();

    this.initialize();
  }

  initialize() {
    this.startPeriodicCleanup();
  }

  /**
   * Create a new trace with automatic context propagation
   */
  createTrace(name, metadata = {}) {
    if (Math.random() > this.config.samplingRate) return null;

    const traceId = uuid();
    const trace = {
      id: traceId,
      name,
      startTime: Date.now(),
      spans: [],
      metadata,
      rootSpan: null,
      status: 'active',
      contextBaggage: new Map(this.baggage),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    this.traces.set(traceId, trace);
    this.activeContexts.set(traceId, trace);
    return traceId;
  }

  /**
   * Create a span within a trace (with automatic parent-child relationship)
   */
  createSpan(traceId, spanName, attributes = {}) {
    if (!this.traces.has(traceId)) return null;

    const spanId = uuid();
    const parentSpanId = this.contextStack[this.contextStack.length - 1] || null;
    const trace = this.traces.get(traceId);

    const span = {
      id: spanId,
      traceId,
      name: spanName,
      parentSpanId,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: 'active',
      attributes,
      events: [],
      links: [],
      baggage: new Map(this.baggage),
      cpuTime: process.cpuUsage(),
      memorySnapshot: process.memoryUsage(),
      profiling: {}
    };

    this.spans.set(spanId, span);
    trace.spans.push(spanId);

    if (!trace.rootSpan) trace.rootSpan = spanId;

    return spanId;
  }

  /**
   * End a span and record duration
   */
  endSpan(spanId, status = 'success', attributes = {}) {
    if (!this.spans.has(spanId)) return null;

    const span = this.spans.get(spanId);
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    Object.assign(span.attributes, attributes);

    // Record CPU delta
    const endCpuTime = process.cpuUsage(span.cpuTime);
    span.profiling.cpuDelta = {
      user: endCpuTime.user,
      system: endCpuTime.system
    };

    // Record memory delta
    const endMemory = process.memoryUsage();
    span.profiling.memoryDelta = {
      heapUsed: endMemory.heapUsed - span.memorySnapshot.heapUsed,
      external: endMemory.external - span.memorySnapshot.external
    };

    return span;
  }

  /**
   * Add event to span
   */
  addEvent(spanId, eventName, attributes = {}) {
    if (!this.spans.has(spanId)) return null;

    const span = this.spans.get(spanId);
    span.events.push({
      name: eventName,
      timestamp: Date.now(),
      attributes
    });

    return span;
  }

  /**
   * Link traces (for correlation)
   */
  linkTrace(spanId, linkedTraceId, relationType = 'CHILD_OF') {
    if (!this.spans.has(spanId)) return false;

    const span = this.spans.get(spanId);
    span.links.push({
      traceId: linkedTraceId,
      type: relationType,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Set baggage (cross-service context)
   */
  setBaggage(key, value) {
    this.baggage.set(key, {
      value,
      timestamp: Date.now(),
      propagated: false
    });
  }

  /**
   * Get baggage value
   */
  getBaggage(key) {
    const item = this.baggage.get(key);
    return item ? item.value : null;
  }

  /**
   * Get baggage for propagation
   */
  getBaggageForPropagation() {
    const result = {};
    for (const [key, value] of this.baggage) {
      result[key] = value.value;
    }
    return result;
  }

  /**
   * Mark baggage as propagated
   */
  markBaggagePropagated(key) {
    if (this.baggage.has(key)) {
      this.baggage.get(key).propagated = true;
    }
  }

  /**
   * Record metric with histogram support
   */
  recordMetric(name, value, unit = 'ms', tags = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        name,
        unit,
        values: [],
        histogram: new Map(),
        min: Infinity,
        max: -Infinity,
        sum: 0,
        count: 0,
        mean: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        tags: {}
      });
    }

    const metric = this.metrics.get(name);
    metric.values.push(value);
    metric.sum += value;
    metric.count++;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.mean = metric.sum / metric.count;

    // Update histogram
    const bucket = Math.floor(value / 10) * 10;
    metric.histogram.set(bucket, (metric.histogram.get(bucket) || 0) + 1);

    // Update percentiles (approximate)
    metric.values.sort((a, b) => a - b);
    metric.p50 = metric.values[Math.floor(metric.values.length * 0.5)];
    metric.p95 = metric.values[Math.floor(metric.values.length * 0.95)];
    metric.p99 = metric.values[Math.floor(metric.values.length * 0.99)];

    Object.assign(metric.tags, tags);

    return metric;
  }

  /**
   * Start CPU profiling
   */
  startProfiling(profileName = 'default') {
    const profileId = uuid();
    this.profiles.set(profileId, {
      name: profileName,
      startTime: Date.now(),
      startCpu: process.cpuUsage(),
      startMemory: process.memoryUsage(),
      samples: [],
      status: 'active'
    });

    return profileId;
  }

  /**
   * Add sample to profile
   */
  addProfileSample(profileId, sampleName, attributes = {}) {
    if (!this.profiles.has(profileId)) return false;

    const profile = this.profiles.get(profileId);
    profile.samples.push({
      name: sampleName,
      timestamp: Date.now(),
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      attributes
    });

    return true;
  }

  /**
   * End profiling and analyze
   */
  endProfiling(profileId) {
    if (!this.profiles.has(profileId)) return null;

    const profile = this.profiles.get(profileId);
    profile.endTime = Date.now();
    profile.endCpu = process.cpuUsage(profile.startCpu);
    profile.endMemory = process.memoryUsage();
    profile.duration = profile.endTime - profile.startTime;
    profile.status = 'completed';

    // Analyze CPU usage
    profile.cpuAnalysis = {
      userTime: profile.endCpu.user / 1000, // Convert to ms
      systemTime: profile.endCpu.system / 1000,
      totalTime: (profile.endCpu.user + profile.endCpu.system) / 1000
    };

    // Analyze memory usage
    profile.memoryAnalysis = {
      heapGrowth: profile.endMemory.heapUsed - profile.startMemory.heapUsed,
      externalGrowth: profile.endMemory.external - profile.startMemory.external,
      peakHeap: profile.endMemory.heapUsed,
      externalPeak: profile.endMemory.external
    };

    return profile;
  }

  /**
   * End trace and finalize
   */
  endTrace(traceId, status = 'success') {
    if (!this.traces.has(traceId)) return null;

    const trace = this.traces.get(traceId);
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = status;

    // Analyze trace
    trace.analysis = this.analyzeTrace(traceId);

    return trace;
  }

  /**
   * Analyze trace structure and performance
   */
  analyzeTrace(traceId) {
    if (!this.traces.has(traceId)) return null;

    const trace = this.traces.get(traceId);
    const spans = trace.spans.map(spanId => this.spans.get(spanId));

    return {
      spanCount: spans.length,
      totalDuration: trace.duration,
      criticalPath: this.calculateCriticalPath(spans),
      slowestSpans: this.getSlowests(spans, 3),
      spanDependencies: this.buildSpanDependencies(spans),
      parallelism: this.calculateParallelism(spans),
      cpuUsage: this.aggregateCpuUsage(spans),
      memoryUsage: this.aggregateMemoryUsage(spans),
      errorCount: spans.filter(s => s.status === 'error').length,
      warningCount: spans.filter(s => s.status === 'warning').length
    };
  }

  /**
   * Calculate critical path (longest chain of dependent spans)
   */
  calculateCriticalPath(spans) {
    let maxPath = [];
    let maxDuration = 0;

    const buildPath = (spanId, path = [], duration = 0) => {
      const span = spans.find(s => s.id === spanId);
      if (!span) return;

      path.push(spanId);
      duration += span.duration || 0;

      const children = spans.filter(s => s.parentSpanId === spanId);
      if (children.length === 0) {
        if (duration > maxDuration) {
          maxDuration = duration;
          maxPath = [...path];
        }
      } else {
        children.forEach(child => buildPath(child.id, [...path], duration));
      }
    };

    const rootSpans = spans.filter(s => !s.parentSpanId);
    rootSpans.forEach(span => buildPath(span.id));

    return { path: maxPath, duration: maxDuration };
  }

  /**
   * Get slowest spans
   */
  getSlowests(spans, count = 3) {
    return spans
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, count)
      .map(s => ({
        id: s.id,
        name: s.name,
        duration: s.duration,
        status: s.status
      }));
  }

  /**
   * Build span dependency graph
   */
  buildSpanDependencies(spans) {
    const dependencies = {};
    spans.forEach(span => {
      dependencies[span.id] = {
        parent: span.parentSpanId,
        children: spans
          .filter(s => s.parentSpanId === span.id)
          .map(s => s.id)
      };
    });
    return dependencies;
  }

  /**
   * Calculate parallelism ratio
   */
  calculateParallelism(spans) {
    const timelineMap = {};
    spans.forEach(span => {
      for (let t = span.startTime; t < span.endTime; t += 10) {
        timelineMap[t] = (timelineMap[t] || 0) + 1;
      }
    });

    const parallelism = Math.max(...Object.values(timelineMap), 0);
    const maxPossible = spans.length;
    return {
      concurrent: parallelism,
      maxPossible,
      ratio: parallelism / maxPossible
    };
  }

  /**
   * Aggregate CPU usage across spans
   */
  aggregateCpuUsage(spans) {
    let totalUser = 0;
    let totalSystem = 0;

    spans.forEach(span => {
      if (span.profiling && span.profiling.cpuDelta) {
        totalUser += span.profiling.cpuDelta.user || 0;
        totalSystem += span.profiling.cpuDelta.system || 0;
      }
    });

    return { user: totalUser, system: totalSystem, total: totalUser + totalSystem };
  }

  /**
   * Aggregate memory usage across spans
   */
  aggregateMemoryUsage(spans) {
    let totalHeap = 0;
    let totalExternal = 0;

    spans.forEach(span => {
      if (span.profiling && span.profiling.memoryDelta) {
        totalHeap += span.profiling.memoryDelta.heapUsed || 0;
        totalExternal += span.profiling.memoryDelta.external || 0;
      }
    });

    return { heap: totalHeap, external: totalExternal, total: totalHeap + totalExternal };
  }

  /**
   * Generate flamegraph data
   */
  generateFlamegraph(traceId) {
    if (!this.traces.has(traceId)) return null;

    const trace = this.traces.get(traceId);
    const spans = trace.spans.map(spanId => this.spans.get(spanId));

    return {
      traceId,
      format: 'flamegraph',
      data: spans.map(span => ({
        name: span.name,
        start: span.startTime,
        duration: span.duration,
        parentId: span.parentSpanId,
        cpuTime: span.profiling?.cpuDelta?.user || 0,
        selfTime: this.calculateSelfTime(span, spans)
      }))
    };
  }

  /**
   * Calculate self time of span (not including children)
   */
  calculateSelfTime(span, allSpans) {
    const children = allSpans.filter(s => s.parentSpanId === span.id);
    if (children.length === 0) return span.duration;

    let childrenDuration = 0;
    children.forEach(child => {
      childrenDuration += child.duration || 0;
    });

    return Math.max(0, span.duration - childrenDuration);
  }

  /**
   * Get trace summary
   */
  getTraceSummary(traceId) {
    if (!this.traces.has(traceId)) return null;

    const trace = this.traces.get(traceId);
    const spans = trace.spans.map(spanId => this.spans.get(spanId));

    return {
      id: traceId,
      name: trace.name,
      duration: trace.duration,
      spanCount: spans.length,
      status: trace.status,
      criticalPath: trace.analysis?.criticalPath.duration,
      slowestSpans: trace.analysis?.slowestSpans,
      errorCount: trace.analysis?.errorCount,
      cpuUsage: trace.analysis?.cpuUsage,
      memoryUsage: trace.analysis?.memoryUsage
    };
  }

  /**
   * Get all active traces
   */
  getActiveTraces() {
    return Array.from(this.activeContexts.values()).map(trace => ({
      id: trace.id,
      name: trace.name,
      duration: Date.now() - trace.startTime,
      spanCount: trace.spans.length,
      status: trace.status
    }));
  }

  /**
   * Export trace data
   */
  exportTrace(traceId, format = 'json') {
    if (!this.traces.has(traceId)) return null;

    const trace = this.traces.get(traceId);
    const spans = trace.spans.map(spanId => this.spans.get(spanId));

    if (format === 'jaeger') {
      return {
        traceID: trace.id,
        spans: spans.map(span => ({
          traceID: span.traceId,
          spanID: span.id,
          operationName: span.name,
          parentSpanID: span.parentSpanId || '',
          startTime: span.startTime * 1000, // Convert to microseconds
          duration: (span.duration || 0) * 1000,
          tags: Object.entries(span.attributes).map(([k, v]) => ({ key: k, value: v })),
          logs: span.events.map(e => ({
            timestamp: e.timestamp * 1000,
            fields: Object.entries(e.attributes).map(([k, v]) => ({ key: k, value: v }))
          }))
        }))
      };
    }

    return {
      traceId: trace.id,
      name: trace.name,
      duration: trace.duration,
      spans,
      analysis: trace.analysis,
      metadata: trace.metadata
    };
  }

  /**
   * Export all metrics
   */
  exportMetrics(format = 'prometheus') {
    const metricsArray = Array.from(this.metrics.values());

    if (format === 'prometheus') {
      let output = '# HELP jarvis_metrics Jarvis system metrics\n';
      output += '# TYPE jarvis_metrics gauge\n';

      metricsArray.forEach(metric => {
        output += `jarvis_${metric.name}_min{unit="${metric.unit}"} ${metric.min}\n`;
        output += `jarvis_${metric.name}_max{unit="${metric.unit}"} ${metric.max}\n`;
        output += `jarvis_${metric.name}_mean{unit="${metric.unit}"} ${metric.mean}\n`;
        output += `jarvis_${metric.name}_p50{unit="${metric.unit}"} ${metric.p50}\n`;
        output += `jarvis_${metric.name}_p95{unit="${metric.unit}"} ${metric.p95}\n`;
        output += `jarvis_${metric.name}_p99{unit="${metric.unit}"} ${metric.p99}\n`;
      });

      return output;
    }

    return metricsArray;
  }

  /**
   * Periodic cleanup of old traces
   */
  startPeriodicCleanup() {
    setInterval(() => {
      const now = Date.now();
      const maxAge = this.config.maxSpanDuration;

      for (const [traceId, trace] of this.traces) {
        if (now - trace.startTime > maxAge && trace.status !== 'active') {
          this.traces.delete(traceId);
          this.activeContexts.delete(traceId);
          trace.spans.forEach(spanId => this.spans.delete(spanId));
        }
      }

      // Limit trace storage
      if (this.traces.size > this.config.maxTraceSize) {
        const sorted = Array.from(this.traces.entries())
          .sort((a, b) => a[1].startTime - b[1].startTime);

        const toDelete = sorted.slice(0, Math.floor(sorted.length * 0.1));
        toDelete.forEach(([traceId]) => {
          const trace = this.traces.get(traceId);
          trace.spans.forEach(spanId => this.spans.delete(spanId));
          this.traces.delete(traceId);
          this.activeContexts.delete(traceId);
        });
      }
    }, 60000); // Every minute
  }

  /**
   * Get health status
   */
  getHealth() {
    return {
      activeTraces: this.activeContexts.size,
      totalTraces: this.traces.size,
      totalSpans: this.spans.size,
      metricsCount: this.metrics.size,
      profilesCount: this.profiles.size,
      baggageItems: this.baggage.size,
      avgTraceSize: this.traces.size > 0 
        ? Array.from(this.traces.values()).reduce((sum, t) => sum + t.spans.length, 0) / this.traces.size 
        : 0
    };
  }

  /**
   * Clear all data
   */
  reset() {
    this.traces.clear();
    this.spans.clear();
    this.metrics.clear();
    this.profiles.clear();
    this.baggage.clear();
    this.activeContexts.clear();
    this.contextStack = [];
  }
}

module.exports = AdvancedObservability;
