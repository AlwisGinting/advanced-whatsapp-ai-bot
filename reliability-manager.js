/**
 * Reliability & Error Recovery Manager
 * Implements circuit breaker, retry strategies, and graceful degradation
 */
class ReliabilityManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.circuitBreakers = new Map();
    this.errorMetrics = new Map();
    this.fallbackResponses = this.initializeFallbackResponses();
    this.retryStrategies = this.initializeRetryStrategies();
  }

  /**
   * Initialize circuit breaker for a service
   */
  initializeCircuitBreaker(serviceName, threshold = 5, timeout = 60000) {
    const breaker = {
      name: serviceName,
      state: 'closed', // closed, open, half-open
      failureCount: 0,
      successCount: 0,
      threshold,
      timeout,
      lastFailureTime: null,
      openedAt: null,
      totalCalls: 0,
      totalFailures: 0
    };

    this.circuitBreakers.set(serviceName, breaker);
    return breaker;
  }

  /**
   * Check if circuit breaker allows request
   */
  canExecute(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName) || 
                   this.initializeCircuitBreaker(serviceName);

    if (breaker.state === 'closed') {
      return true;
    }

    if (breaker.state === 'open') {
      // Check if timeout expired
      if (Date.now() - breaker.openedAt > breaker.timeout) {
        breaker.state = 'half-open';
        breaker.failureCount = 0;
        breaker.successCount = 0;
        this.logger.info('Circuit breaker half-open', { service: serviceName });
        return true;
      }
      return false;
    }

    if (breaker.state === 'half-open') {
      return true;
    }

    return false;
  }

  /**
   * Record success
   */
  recordSuccess(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return;

    breaker.totalCalls++;
    
    if (breaker.state === 'half-open') {
      breaker.successCount++;
      
      if (breaker.successCount >= 2) {
        breaker.state = 'closed';
        breaker.failureCount = 0;
        this.logger.info('Circuit breaker closed', { service: serviceName });
      }
    } else if (breaker.state === 'closed') {
      breaker.failureCount = Math.max(0, breaker.failureCount - 1);
    }
  }

  /**
   * Record failure
   */
  recordFailure(serviceName, error) {
    const breaker = this.circuitBreakers.get(serviceName) || 
                   this.initializeCircuitBreaker(serviceName);

    breaker.totalCalls++;
    breaker.totalFailures++;
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.state === 'half-open') {
      breaker.state = 'open';
      breaker.openedAt = Date.now();
      this.logger.warn('Circuit breaker opened (half-open failure)', { 
        service: serviceName,
        error: error.message 
      });
    } else if (breaker.failureCount >= breaker.threshold) {
      breaker.state = 'open';
      breaker.openedAt = Date.now();
      this.logger.warn('Circuit breaker opened', { 
        service: serviceName,
        failures: breaker.failureCount 
      });
    }
  }

  /**
   * Initialize fallback responses
   */
  initializeFallbackResponses() {
    return {
      'openai_error': [
        'Maaf, saya sedang mengalami gangguan. Coba lagi dalam beberapa saat.',
        'Oops, ada error di backend. Hubungi admin jika berlanjut.',
        'Sistem saya sedang maintenance. Please try again later.'
      ],
      'timeout_error': [
        'Response saya lambat nih. Coba pertanyaan yang lebih singkat?',
        'Timeout, request terlalu lama diproses. Silakan coba lagi.',
        'Sedang overload, coba later ya.'
      ],
      'rate_limit_error': [
        'Quota habis. Reset besok pukul 00:00 WIB.',
        'Rate limit reached. Tunggu beberapa saat lagi.',
        'Terlalu banyak request. Coba lagi nanti.'
      ],
      'network_error': [
        'Koneksi internet bermasalah. Check your connection.',
        'Network error terjadi. Coba reconnect.',
        'Koneksi terputus. Please check your internet.'
      ],
      'unknown_error': [
        'Maaf, terjadi kesalahan yang tidak terduga.',
        'Something went wrong. Please try again.',
        'Error tidak diketahui. Hubungi support.'
      ]
    };
  }

  /**
   * Initialize retry strategies
   */
  initializeRetryStrategies() {
    return {
      'exponential': {
        baseDelay: 1000,
        maxDelay: 30000,
        factor: 2,
        maxAttempts: 5
      },
      'linear': {
        baseDelay: 2000,
        increment: 1000,
        maxDelay: 10000,
        maxAttempts: 3
      },
      'immediate': {
        maxAttempts: 2
      }
    };
  }

  /**
   * Execute with retry
   */
  async executeWithRetry(operation, operationName, strategyType = 'exponential') {
    const strategy = this.retryStrategies[strategyType] || this.retryStrategies['exponential'];
    let lastError;

    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      try {
        const result = await operation();
        this.recordSuccess(operationName);
        return result;
      } catch (error) {
        lastError = error;
        this.recordFailure(operationName, error);

        if (attempt < strategy.maxAttempts) {
          let delay;

          if (strategyType === 'exponential') {
            delay = Math.min(
              strategy.baseDelay * Math.pow(strategy.factor, attempt - 1),
              strategy.maxDelay
            );
          } else if (strategyType === 'linear') {
            delay = Math.min(
              strategy.baseDelay + (strategy.increment * (attempt - 1)),
              strategy.maxDelay
            );
          }

          this.logger.warn('Retry attempt', {
            operation: operationName,
            attempt,
            delay,
            error: error.message
          });

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get fallback response
   */
  getFallbackResponse(errorType) {
    const responses = this.fallbackResponses[errorType] || 
                     this.fallbackResponses['unknown_error'];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Graceful degradation
   */
  getServiceHealth() {
    const health = {};

    for (const [name, breaker] of this.circuitBreakers.entries()) {
      const failureRate = breaker.totalCalls > 0 ? 
        (breaker.totalFailures / breaker.totalCalls) * 100 : 0;

      health[name] = {
        state: breaker.state,
        healthScore: Math.round(100 - failureRate),
        failureRate: Math.round(failureRate),
        totalCalls: breaker.totalCalls,
        totalFailures: breaker.totalFailures,
        status: breaker.state === 'closed' ? '✅ Healthy' : 
               breaker.state === 'half-open' ? '⚠️ Recovering' : 
               '❌ Failed'
      };
    }

    return health;
  }

  /**
   * Determine graceful degradation strategy
   */
  getDegradationStrategy(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return 'normal';

    const healthScore = 100 - ((breaker.totalFailures / breaker.totalCalls) * 100);

    if (healthScore > 95) return 'full_service';
    if (healthScore > 80) return 'normal_with_warnings';
    if (healthScore > 60) return 'limited_service';
    if (healthScore > 30) return 'critical_mode';
    return 'fallback_only';
  }

  /**
   * Get detailed metrics
   */
  getMetrics() {
    const metrics = {
      totalServices: this.circuitBreakers.size,
      healthyServices: 0,
      degradedServices: 0,
      failedServices: 0,
      overallHealthScore: 0,
      breakers: {}
    };

    let totalScore = 0;

    for (const [name, breaker] of this.circuitBreakers.entries()) {
      const failureRate = breaker.totalCalls > 0 ? 
        (breaker.totalFailures / breaker.totalCalls) * 100 : 0;

      const score = Math.round(100 - failureRate);

      if (breaker.state === 'closed') metrics.healthyServices++;
      if (breaker.state === 'half-open') metrics.degradedServices++;
      if (breaker.state === 'open') metrics.failedServices++;

      totalScore += score;

      metrics.breakers[name] = {
        state: breaker.state,
        score,
        totalCalls: breaker.totalCalls,
        failures: breaker.totalFailures
      };
    }

    if (this.circuitBreakers.size > 0) {
      metrics.overallHealthScore = Math.round(totalScore / this.circuitBreakers.size);
    }

    return metrics;
  }

  /**
   * Reset circuit breaker
   */
  resetBreaker(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.state = 'closed';
      breaker.failureCount = 0;
      breaker.successCount = 0;
      this.logger.info('Circuit breaker reset', { service: serviceName });
    }
  }

  /**
   * Clear error metrics
   */
  clearMetrics() {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.totalCalls = 0;
      breaker.totalFailures = 0;
      breaker.failureCount = 0;
      breaker.successCount = 0;
    }
    this.logger.info('Error metrics cleared');
  }
}

module.exports = ReliabilityManager;
