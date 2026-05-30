/**
 * Predictive Optimization Engine
 * ML-based prediction, preemptive caching, and intelligent prefetching
 */
class PredictiveOptimizer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.patterns = {
      userBehavior: new Map(),
      intentPatterns: new Map(),
      timePatterns: new Map(),
      contextPatterns: new Map()
    };
    this.predictions = [];
    this.prefetchCache = new Map();
    this.confidenceThreshold = config.confidenceThreshold || 0.7;
  }

  /**
   * Analyze user behavior patterns
   */
  analyzeUserBehavior(userId, messageHistory) {
    if (!messageHistory || messageHistory.length < 5) {
      return null; // Insufficient data
    }

    const pattern = {
      userId,
      frequency: messageHistory.length,
      averageLength: messageHistory.reduce((sum, m) => sum + (m.content?.length || 0), 0) / messageHistory.length,
      intents: {},
      timePattern: this.analyzeTimePattern(messageHistory),
      topics: this.extractTopics(messageHistory),
      responsePreference: this.analyzeResponsePreferences(messageHistory)
    };

    // Track in patterns
    this.patterns.userBehavior.set(userId, pattern);
    return pattern;
  }

  /**
   * Analyze time-based patterns
   */
  analyzeTimePattern(messageHistory) {
    if (messageHistory.length < 3) return null;

    const hours = messageHistory.map(m => {
      if (m.timestamp) {
        return new Date(m.timestamp).getHours();
      }
      return new Date().getHours();
    });

    const hourCounts = {};
    hours.forEach(h => {
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return {
      peakHours,
      avgHour: Math.round(hours.reduce((a, b) => a + b) / hours.length),
      distribution: hourCounts
    };
  }

  /**
   * Extract topics from messages
   */
  extractTopics(messageHistory) {
    const topics = {};
    const topicKeywords = {
      technical: ['code', 'error', 'bug', 'debug', 'api', 'function', 'algorithm'],
      creative: ['story', 'write', 'poem', 'creative', 'imagine', 'design'],
      business: ['business', 'market', 'sales', 'customer', 'strategy', 'profit'],
      personal: ['feel', 'think', 'personal', 'advice', 'help', 'problem'],
      general: ['what', 'how', 'why', 'explain', 'tell me']
    };

    messageHistory.forEach(msg => {
      const content = msg.content?.toLowerCase() || '';
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(kw => content.includes(kw))) {
          topics[topic] = (topics[topic] || 0) + 1;
        }
      });
    });

    return topics;
  }

  /**
   * Analyze response preferences
   */
  analyzeResponsePreferences(messageHistory) {
    return {
      preferLongResponses: messageHistory.length > 0 && 
        messageHistory.filter(m => m.role === 'assistant').some(m => m.content?.length > 500),
      preferExamples: messageHistory.some(m => m.content?.includes('example') || m.content?.includes('contoh')),
      preferStructured: messageHistory.some(m => m.content?.includes('1.') || m.content?.includes('•')),
      responseTime: this.calculateAverageResponseTime(messageHistory)
    };
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime(messageHistory) {
    let totalTime = 0;
    let count = 0;

    for (let i = 1; i < messageHistory.length; i += 2) {
      if (messageHistory[i].timestamp && messageHistory[i - 1].timestamp) {
        totalTime += messageHistory[i].timestamp - messageHistory[i - 1].timestamp;
        count++;
      }
    }

    return count > 0 ? Math.round(totalTime / count) : 0;
  }

  /**
   * Predict next user query
   */
  predictNextQuery(userId, recentMessages) {
    const userPattern = this.patterns.userBehavior.get(userId);
    if (!userPattern) return null;

    const predictions = [];

    // Based on topic patterns
    const topTopic = Object.entries(userPattern.topics)
      .sort((a, b) => b[1] - a[1])[0];

    if (topTopic) {
      predictions.push({
        type: 'topic_continuation',
        topic: topTopic[0],
        confidence: Math.min(topTopic[1] / 10, 0.9),
        suggestedResponse: `User likely asking about ${topTopic[0]}`
      });
    }

    // Based on time pattern
    if (userPattern.timePattern) {
      const now = new Date();
      const currentHour = now.getHours();
      if (userPattern.timePattern.peakHours.includes(currentHour)) {
        predictions.push({
          type: 'activity_peak',
          confidence: 0.8,
          suggestedAction: 'preemptively cache responses'
        });
      }
    }

    // Sort by confidence
    predictions.sort((a, b) => b.confidence - a.confidence);
    return predictions.filter(p => p.confidence >= this.confidenceThreshold);
  }

  /**
   * Prefetch likely responses
   */
  async prefetchResponses(userId, predictedQueries, aiOptimizer) {
    const prefetched = [];

    for (const prediction of predictedQueries) {
      if (prediction.type === 'topic_continuation') {
        const likelyQuestions = this.generateLikelyQuestions(prediction.topic);
        
        for (const question of likelyQuestions.slice(0, 3)) {
          const cached = aiOptimizer.getCachedResponse(question, userId);
          
          if (!cached) {
            prefetched.push({
              question,
              topic: prediction.topic,
              confidence: prediction.confidence,
              status: 'queued_for_cache'
            });
          }
        }
      }
    }

    this.logger.debug('Prefetch queued', { userId, count: prefetched.length });
    return prefetched;
  }

  /**
   * Generate likely follow-up questions
   */
  generateLikelyQuestions(topic) {
    const questionTemplates = {
      technical: [
        'How do I fix this error?',
        'Can you explain this code?',
        'What is the best approach?',
        'How can I optimize this?'
      ],
      creative: [
        'Can you help me write?',
        'Give me ideas for...',
        'How should I structure this?',
        'What would be a good ending?'
      ],
      business: [
        'How can I improve sales?',
        'What is the best strategy?',
        'How do I attract customers?',
        'What are the market trends?'
      ],
      personal: [
        'What should I do?',
        'How do I handle this?',
        'Can you give me advice?',
        'What are my options?'
      ]
    };

    return (questionTemplates[topic] || questionTemplates.general || []) || [];
  }

  /**
   * Adapt response based on preferences
   */
  adaptResponse(response, userPreferences) {
    if (!userPreferences) return response;

    let adapted = response;

    // Add structure if user prefers it
    if (userPreferences.preferStructured && !adapted.match(/^\d\./m)) {
      adapted = '1. ' + adapted.split('.').slice(0, -1).join('.\n2. ') + '.';
    }

    // Expand if user prefers long responses
    if (userPreferences.preferLongResponses && adapted.length < 200) {
      adapted += '\n\nFor more details, you can...';
    }

    // Add examples if user prefers them
    if (userPreferences.preferExamples && !adapted.toLowerCase().includes('example')) {
      adapted += '\n\nExample: ...';
    }

    return adapted;
  }

  /**
   * Get prediction accuracy metrics
   */
  getAccuracy() {
    if (this.predictions.length === 0) return 0;

    const correct = this.predictions.filter(p => p.wasCorrect).length;
    return (correct / this.predictions.length) * 100;
  }

  /**
   * Record prediction outcome
   */
  recordPredictionOutcome(predictionId, wasCorrect) {
    const prediction = this.predictions.find(p => p.id === predictionId);
    if (prediction) {
      prediction.wasCorrect = wasCorrect;
      if (wasCorrect) {
        prediction.confidence = Math.min(prediction.confidence + 0.05, 1.0);
      } else {
        prediction.confidence = Math.max(prediction.confidence - 0.05, 0.5);
      }
    }
  }

  /**
   * Get detailed analytics
   */
  getAnalytics() {
    return {
      totalUsers: this.patterns.userBehavior.size,
      patterns: {
        users: Array.from(this.patterns.userBehavior.entries()).slice(0, 5),
        intents: Array.from(this.patterns.intentPatterns.entries()).slice(0, 5)
      },
      predictions: {
        total: this.predictions.length,
        accuracy: this.getAccuracy(),
        avgConfidence: this.predictions.length > 0 ? 
          this.predictions.reduce((sum, p) => sum + p.confidence, 0) / this.predictions.length : 0
      },
      prefetchCache: {
        size: this.prefetchCache.size,
        items: Array.from(this.prefetchCache.entries()).slice(0, 10)
      }
    };
  }

  /**
   * Clear old patterns
   */
  clearOldPatterns(hoursOld = 24) {
    const cutoffTime = Date.now() - (hoursOld * 60 * 60 * 1000);
    
    for (const [userId, pattern] of this.patterns.userBehavior.entries()) {
      if (pattern.lastUpdated && pattern.lastUpdated < cutoffTime) {
        this.patterns.userBehavior.delete(userId);
      }
    }

    this.logger.debug('Old patterns cleared', { hoursOld });
  }

  /**
   * Reset all patterns
   */
  reset() {
    this.patterns = {
      userBehavior: new Map(),
      intentPatterns: new Map(),
      timePatterns: new Map(),
      contextPatterns: new Map()
    };
    this.predictions = [];
    this.prefetchCache.clear();
    this.logger.info('Predictive optimizer reset');
  }
}

module.exports = PredictiveOptimizer;
