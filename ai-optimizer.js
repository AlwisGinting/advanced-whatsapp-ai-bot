/**
 * AI Performance Optimizer
 * Maximizes response quality, speed, and token efficiency
 */
class AIPerformanceOptimizer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.responseCache = new Map();
    this.contextWindow = new Map();
    this.tokenCounts = new Map();
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      responseQualityScore: 0
    };
  }

  /**
   * Estimate token count using rough algorithm
   * Actual tokens = text length / 4 (approximately)
   */
  estimateTokens(text) {
    if (!text) return 0;
    // More accurate: ~1.3 chars per token on average
    return Math.ceil(text.length / 4.5);
  }

  /**
   * Calculate API cost based on tokens
   * GPT-3.5-turbo: $0.0005 per 1K input tokens, $0.0015 per 1K output tokens
   */
  calculateCost(inputTokens, outputTokens) {
    const inputCost = (inputTokens / 1000) * 0.0005;
    const outputCost = (outputTokens / 1000) * 0.0015;
    return inputCost + outputCost;
  }

  /**
   * Smart caching with relevance scoring
   */
  getCachedResponse(message, chatId) {
    const cacheKey = this.generateCacheKey(message);
    
    if (this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey);
      
      // Check if cache is still fresh (15 minutes)
      if (Date.now() - cached.timestamp < 15 * 60 * 1000) {
        this.performanceMetrics.cacheHits++;
        this.logger.debug('Cache hit', { cacheKey, age: Date.now() - cached.timestamp });
        return cached.response;
      } else {
        this.responseCache.delete(cacheKey);
      }
    }
    
    this.performanceMetrics.cacheMisses++;
    return null;
  }

  /**
   * Cache response for future use
   */
  cacheResponse(message, response, confidence = 0.9) {
    const cacheKey = this.generateCacheKey(message);
    
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      confidence,
      hits: 1,
      messageLength: message.length
    });
  }

  /**
   * Generate cache key from message
   */
  generateCacheKey(message) {
    // Simple hash for cache key
    const normalized = message.toLowerCase().trim();
    let hash = 0;
    
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `cache_${Math.abs(hash)}`;
  }

  /**
   * Optimize context window for token efficiency
   */
  optimizeContextWindow(history, maxTokens = 2000) {
    if (!Array.isArray(history)) return [];

    let totalTokens = 0;
    let optimizedHistory = [];

    // Start from most recent messages
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const msgTokens = this.estimateTokens(msg.content);
      
      if (totalTokens + msgTokens <= maxTokens) {
        optimizedHistory.unshift(msg);
        totalTokens += msgTokens;
      } else {
        break;
      }
    }

    return optimizedHistory;
  }

  /**
   * Score response quality based on multiple factors
   */
  scoreResponseQuality(response, originalMessage, metadata = {}) {
    let score = 0;
    const maxScore = 100;

    // Length quality (25 points)
    const idealLength = originalMessage.length * 3;
    const lengthScore = Math.min(
      25,
      (response.length / idealLength) * 25
    );
    score += lengthScore;

    // Relevance quality (25 points)
    const relevanceScore = this.calculateRelevance(response, originalMessage);
    score += relevanceScore * 25;

    // Coherence quality (25 points)
    const coherenceScore = this.calculateCoherence(response);
    score += coherenceScore * 25;

    // Completeness quality (25 points)
    const completenessScore = response.includes('?') ? 22 : 
                              response.includes('.') ? 20 : 15;
    score += completenessScore;

    return Math.round(score);
  }

  /**
   * Calculate relevance between response and message
   */
  calculateRelevance(response, originalMessage) {
    const messageWords = new Set(originalMessage.toLowerCase().split(/\s+/));
    const responseWords = response.toLowerCase().split(/\s+/);
    
    let matches = 0;
    responseWords.forEach(word => {
      if (messageWords.has(word)) matches++;
    });

    // Return score 0-1
    return Math.min(1, matches / Math.max(messageWords.size, 1));
  }

  /**
   * Calculate coherence score
   */
  calculateCoherence(text) {
    let score = 0;

    // Has proper sentence structure
    if (text.match(/[.!?]/g)) score += 0.2;

    // Reasonable length
    if (text.length > 20 && text.length < 500) score += 0.2;

    // Has punctuation variety
    if (text.match(/[,;:]/g)) score += 0.2;

    // Doesn't repeat excessively
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words);
    if (uniqueWords.size / words.length > 0.6) score += 0.2;

    // Starts with capital letter
    if (text[0] === text[0].toUpperCase()) score += 0.2;

    return Math.min(1, score);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const cacheHitRate = (this.performanceMetrics.cacheHits / 
      (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses)) * 100 || 0;

    const successRate = (this.performanceMetrics.successfulRequests / 
      this.performanceMetrics.totalRequests) * 100 || 0;

    return {
      ...this.performanceMetrics,
      cacheHitRate: Math.round(cacheHitRate),
      successRate: Math.round(successRate),
      estimatedCost: `$${this.performanceMetrics.totalCost.toFixed(4)}`,
      cacheSize: this.responseCache.size,
      averageQualityScore: Math.round(this.performanceMetrics.responseQualityScore)
    };
  }

  /**
   * Track request metrics
   */
  trackRequest(inputTokens, outputTokens, responseTime, qualityScore) {
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.successfulRequests++;
    
    const cost = this.calculateCost(inputTokens, outputTokens);
    this.performanceMetrics.totalTokensUsed += (inputTokens + outputTokens);
    this.performanceMetrics.totalCost += cost;

    const prevAvgTime = this.performanceMetrics.averageResponseTime;
    this.performanceMetrics.averageResponseTime = 
      (prevAvgTime * (this.performanceMetrics.totalRequests - 1) + responseTime) / 
      this.performanceMetrics.totalRequests;

    const prevAvgScore = this.performanceMetrics.responseQualityScore;
    this.performanceMetrics.responseQualityScore =
      (prevAvgScore * (this.performanceMetrics.totalRequests - 1) + qualityScore) /
      this.performanceMetrics.totalRequests;

    return {
      tokensUsed: inputTokens + outputTokens,
      cost: `$${cost.toFixed(6)}`,
      qualityScore,
      responseTime: `${responseTime}ms`
    };
  }

  /**
   * Clear old cache entries
   */
  clearOldCache(maxAge = 30 * 60 * 1000) {
    let cleared = 0;
    const now = Date.now();

    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.responseCache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Optimize request for best performance
   */
  optimizeRequest(message, history, config) {
    return {
      message: message.trim(),
      history: this.optimizeContextWindow(history, config.maxContextTokens || 2000),
      estimatedInputTokens: this.estimateTokens(message),
      timestamp: Date.now()
    };
  }
}

module.exports = AIPerformanceOptimizer;
