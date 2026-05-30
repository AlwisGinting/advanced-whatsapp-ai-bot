/**
 * Advanced Analytics Engine
 * Deep usage analysis, trend detection, anomaly detection, and behavior profiling
 */
class AdvancedAnalytics {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.events = [];
    this.userProfiles = new Map();
    this.trends = {
      hourly: {},
      daily: {},
      weekly: {},
      intent: {},
      sentiment: {}
    };
    this.anomalies = [];
    this.alerts = [];
  }

  /**
   * Record analytics event
   */
  recordEvent(type, data, metadata = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random()}`,
      type,
      timestamp: Date.now(),
      data,
      metadata
    };

    this.events.push(event);

    // Keep only last 10000 events in memory
    if (this.events.length > 10000) {
      this.events.shift();
    }

    this.detectAnomalies(event);
    return event;
  }

  /**
   * Build user profile from events
   */
  buildUserProfile(userId) {
    const userEvents = this.events.filter(e => e.metadata.userId === userId);

    if (userEvents.length === 0) return null;

    const profile = {
      userId,
      totalEvents: userEvents.length,
      firstSeen: userEvents[0].timestamp,
      lastSeen: userEvents[userEvents.length - 1].timestamp,
      activeHours: this.analyzeActiveHours(userEvents),
      preferredIntents: this.analyzeIntents(userEvents),
      sentimentDistribution: this.analyzeSentiments(userEvents),
      messageFrequency: this.analyzeFrequency(userEvents),
      riskScore: 0,
      engagement: this.calculateEngagement(userEvents),
      value: this.estimateUserValue(userEvents)
    };

    // Calculate risk score
    profile.riskScore = this.calculateRiskScore(profile);

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Analyze active hours
   */
  analyzeActiveHours(userEvents) {
    const hourCounts = {};

    userEvents.forEach(e => {
      const hour = new Date(e.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const sorted = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1]);

    return {
      peak: parseInt(sorted[0]?.[0] || 12),
      distribution: hourCounts,
      mostActive: sorted.slice(0, 3).map(([h]) => parseInt(h))
    };
  }

  /**
   * Analyze user intents
   */
  analyzeIntents(userEvents) {
    const intentCounts = {};

    userEvents.filter(e => e.data?.intent).forEach(e => {
      const intent = e.data.intent;
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });

    return Object.entries(intentCounts)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [intent, count]) => {
        acc[intent] = {
          count,
          percentage: 0
        };
        return acc;
      }, {});
  }

  /**
   * Analyze sentiment distribution
   */
  analyzeSentiments(userEvents) {
    const sentimentCounts = {};

    userEvents.filter(e => e.data?.sentiment).forEach(e => {
      const sentiment = e.data.sentiment.label || 'neutral';
      sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
    });

    return sentimentCounts;
  }

  /**
   * Analyze message frequency
   */
  analyzeFrequency(userEvents) {
    if (userEvents.length < 2) return { frequency: 'low', perDay: 0 };

    const timespan = (userEvents[userEvents.length - 1].timestamp - userEvents[0].timestamp) / (1000 * 60 * 60 * 24);
    const perDay = userEvents.length / Math.max(timespan, 1);

    let frequency;
    if (perDay > 10) frequency = 'very_high';
    else if (perDay > 5) frequency = 'high';
    else if (perDay > 1) frequency = 'medium';
    else frequency = 'low';

    return { frequency, perDay: Math.round(perDay * 10) / 10 };
  }

  /**
   * Calculate user engagement score
   */
  calculateEngagement(userEvents) {
    const messageEvents = userEvents.filter(e => e.type === 'message');
    const interactionEvents = userEvents.filter(e => e.type === 'interaction');

    const recency = Math.max(0, 10 - ((Date.now() - userEvents[userEvents.length - 1].timestamp) / (24 * 60 * 60 * 1000)));
    const frequency = Math.min(userEvents.length / 10, 10);
    const interaction = Math.min(interactionEvents.length / 5, 10);

    const engagement = (recency * 0.3 + frequency * 0.4 + interaction * 0.3);
    return Math.round(engagement * 100) / 100;
  }

  /**
   * Estimate user value (based on usage patterns)
   */
  estimateUserValue(userEvents) {
    const totalEvents = userEvents.length;
    const daysSinceFirst = (Date.now() - userEvents[0].timestamp) / (24 * 60 * 60 * 1000);
    const daysSinceLast = (Date.now() - userEvents[userEvents.length - 1].timestamp) / (24 * 60 * 60 * 1000);

    let value = 0;

    // Longevity score (0-30)
    value += Math.min(daysSinceFirst / 10, 30);

    // Activity score (0-40)
    value += Math.min((totalEvents / daysSinceFirst) * 4, 40);

    // Retention score (0-30)
    value += Math.max(30 - (daysSinceLast * 3), 0);

    return Math.round(value);
  }

  /**
   * Calculate risk score
   */
  calculateRiskScore(profile) {
    let risk = 0;

    // High frequency might indicate bot-like behavior
    if (profile.messageFrequency.frequency === 'very_high') risk += 25;
    else if (profile.messageFrequency.frequency === 'high') risk += 10;

    // Unusual patterns
    if (profile.activeHours.mostActive.length > 0) {
      const nightHours = profile.activeHours.mostActive.filter(h => h < 6 || h > 22).length;
      if (nightHours === profile.activeHours.mostActive.length) risk += 15;
    }

    // Negative sentiment concentration
    if (profile.sentimentDistribution.angry > profile.totalEvents * 0.3) risk += 20;

    return Math.min(risk, 100);
  }

  /**
   * Detect anomalies
   */
  detectAnomalies(event) {
    const anomalies = [];

    // Spike detection - many events in short time
    const recentEvents = this.events.filter(e => Date.now() - e.timestamp < 60000);
    if (recentEvents.length > 50) {
      anomalies.push({
        type: 'request_spike',
        severity: 'high',
        description: `${recentEvents.length} events in last minute`,
        timestamp: Date.now()
      });
    }

    // Unusual pattern detection
    if (event.type === 'message' && event.data?.length > 5000) {
      anomalies.push({
        type: 'oversized_message',
        severity: 'medium',
        description: `Message size: ${event.data.length} bytes`,
        timestamp: Date.now()
      });
    }

    // Error rate spike
    const recentErrors = this.events.filter(e => 
      e.type === 'error' && Date.now() - e.timestamp < 300000
    );
    if (recentErrors.length > 10) {
      anomalies.push({
        type: 'error_spike',
        severity: 'critical',
        description: `${recentErrors.length} errors in last 5 minutes`,
        timestamp: Date.now()
      });
    }

    this.anomalies.push(...anomalies);

    // Keep only recent anomalies
    this.anomalies = this.anomalies.filter(a => 
      Date.now() - a.timestamp < 24 * 60 * 60 * 1000
    );

    return anomalies;
  }

  /**
   * Generate trend report
   */
  generateTrendReport() {
    const report = {
      timeframe: 'last_7_days',
      trends: {},
      topIntents: this.getTopIntents(7),
      topUsers: this.getTopUsers(10),
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      prediction: this.predictTrends()
    };

    return report;
  }

  /**
   * Get top intents
   */
  getTopIntents(days) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const intentCounts = {};

    this.events.filter(e => e.timestamp > cutoff && e.data?.intent)
      .forEach(e => {
        const intent = e.data.intent;
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      });

    return Object.entries(intentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  /**
   * Get top users
   */
  getTopUsers(limit) {
    const userCounts = {};

    this.events.forEach(e => {
      const userId = e.metadata.userId;
      if (userId) {
        userCounts[userId] = (userCounts[userId] || 0) + 1;
      }
    });

    return Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  /**
   * Get average response time
   */
  getAverageResponseTime() {
    const responseTimes = this.events
      .filter(e => e.type === 'response' && e.data?.time)
      .map(e => e.data.time);

    if (responseTimes.length === 0) return 0;
    return Math.round(responseTimes.reduce((a, b) => a + b) / responseTimes.length);
  }

  /**
   * Get error rate
   */
  getErrorRate() {
    const errors = this.events.filter(e => e.type === 'error').length;
    return errors > 0 ? Math.round((errors / this.events.length) * 10000) / 100 : 0;
  }

  /**
   * Predict trends
   */
  predictTrends() {
    const topIntents = this.getTopIntents(7);
    const topUsers = this.getTopUsers(10);

    return {
      mostUsedIntents: topIntents.map(([intent]) => intent),
      topActiveUsers: topUsers.map(([user]) => user),
      predictedGrowth: 'stable'
    };
  }

  /**
   * Export analytics
   */
  export() {
    return {
      summary: {
        totalEvents: this.events.length,
        totalUsers: this.userProfiles.size,
        totalAnomalies: this.anomalies.length,
        totalAlerts: this.alerts.length
      },
      trends: this.trends,
      topProfiles: Array.from(this.userProfiles.values())
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10),
      recentAnomalies: this.anomalies.slice(-20),
      report: this.generateTrendReport()
    };
  }

  /**
   * Clear old data
   */
  clearOldData(daysOld = 30) {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(e => e.timestamp > cutoff);
    this.anomalies = this.anomalies.filter(a => a.timestamp > cutoff);
    this.logger.debug('Old analytics data cleared', { daysOld });
  }

  /**
   * Reset analytics
   */
  reset() {
    this.events = [];
    this.userProfiles.clear();
    this.trends = {
      hourly: {},
      daily: {},
      weekly: {},
      intent: {},
      sentiment: {}
    };
    this.anomalies = [];
    this.alerts = [];
    this.logger.info('Advanced analytics reset');
  }
}

module.exports = AdvancedAnalytics;
