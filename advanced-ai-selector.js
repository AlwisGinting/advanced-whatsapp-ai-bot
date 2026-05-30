/**
 * Advanced AI Model Selector
 * Intelligently routes requests to GPT-4 or GPT-3.5 based on complexity, cost, and priority
 */
class AdvancedAISelector {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.costThreshold = config.costThreshold || 0.05;
    this.complexityThreshold = config.complexityThreshold || 0.6;
    this.modelStats = {
      gpt4: { used: 0, cost: 0, avgTime: 0, avgScore: 0 },
      gpt35: { used: 0, cost: 0, avgTime: 0, avgScore: 0 }
    };
    this.complexityCache = new Map();
  }

  /**
   * Analyze query complexity
   */
  analyzeComplexity(message, sentiment, intent) {
    // Check cache first
    const cacheKey = `${message.substring(0, 50)}_${intent}`;
    if (this.complexityCache.has(cacheKey)) {
      return this.complexityCache.get(cacheKey);
    }

    let complexity = 0;

    // Length factor (0-0.2)
    const lengthScore = Math.min(message.length / 500, 0.2);
    complexity += lengthScore;

    // Intent complexity (0-0.3)
    const intentScores = {
      'technical_support': 0.3,
      'code_request': 0.3,
      'data_analysis': 0.25,
      'problem_solving': 0.25,
      'creative_writing': 0.2,
      'translation': 0.15,
      'general_question': 0.1,
      'greeting': 0.05
    };
    complexity += intentScores[intent] || 0.1;

    // Sentiment complexity (0-0.25)
    if (sentiment && sentiment.isAngry) complexity += 0.15;
    if (sentiment && sentiment.isSad) complexity += 0.1;
    if (sentiment && sentiment.isConfused) complexity += 0.2;
    complexity = Math.min(complexity, 1);

    // Special tokens that require deep understanding
    const advancedTokens = ['algorithm', 'architecture', 'optimization', 'security', 'database', 'api', 'framework', 'system', 'complex', 'advanced'];
    const advancedCount = advancedTokens.filter(t => message.toLowerCase().includes(t)).length;
    if (advancedCount > 0) complexity += Math.min(advancedCount * 0.05, 0.15);

    complexity = Math.min(complexity, 1);
    
    // Cache for 1 hour
    this.complexityCache.set(cacheKey, complexity);
    setTimeout(() => this.complexityCache.delete(cacheKey), 60 * 60 * 1000);

    return complexity;
  }

  /**
   * Select best model
   */
  selectModel(message, sentiment, intent, previousCost) {
    const complexity = this.analyzeComplexity(message, sentiment, intent);
    const costOptimization = previousCost > this.costThreshold;

    // Use GPT-4 for complex queries unless cost is too high
    if (complexity > this.complexityThreshold && !costOptimization) {
      return {
        model: 'gpt-4',
        reason: 'high_complexity',
        complexity,
        recommendation: 'use_gpt4_for_accuracy'
      };
    }

    // Use GPT-3.5 for simple queries or when cost-conscious
    return {
      model: 'gpt-3.5-turbo',
      reason: costOptimization ? 'cost_optimization' : 'low_complexity',
      complexity,
      recommendation: 'use_gpt35_for_speed_and_cost'
    };
  }

  /**
   * Get recommended max tokens
   */
  getMaxTokens(model, intent) {
    const tokenMap = {
      'gpt-4': {
        'code_request': 2000,
        'creative_writing': 1500,
        'data_analysis': 1200,
        'problem_solving': 1000,
        'default': 800
      },
      'gpt-3.5-turbo': {
        'code_request': 1200,
        'creative_writing': 1000,
        'data_analysis': 800,
        'problem_solving': 600,
        'default': 500
      }
    };

    const tokens = tokenMap[model] || tokenMap['gpt-3.5-turbo'];
    return tokens[intent] || tokens.default;
  }

  /**
   * Get recommended temperature
   */
  getTemperature(model, intent, sentiment) {
    if (intent === 'creative_writing') return 0.9;
    if (intent === 'code_request') return 0.3;
    if (intent === 'data_analysis') return 0.4;
    if (sentiment && sentiment.isFormal) return 0.5;
    if (sentiment && sentiment.isCreative) return 0.8;
    return 0.6;
  }

  /**
   * Track model usage and performance
   */
  trackUsage(model, cost, responseTime, qualityScore) {
    if (!this.modelStats[model]) return;

    const stats = this.modelStats[model];
    const usage = stats.used;

    // Update averages
    stats.used++;
    stats.cost = (stats.cost * usage + cost) / (usage + 1);
    stats.avgTime = (stats.avgTime * usage + responseTime) / (usage + 1);
    stats.avgScore = (stats.avgScore * usage + qualityScore) / (usage + 1);
  }

  /**
   * Get model recommendations based on patterns
   */
  getRecommendations() {
    const stats = this.modelStats;
    const recommendations = [];

    // If GPT-4 is more cost-effective, recommend it
    if (stats.gpt4.avgScore > stats.gpt35.avgScore + 10 && stats.gpt4.cost < stats.gpt35.cost * 1.5) {
      recommendations.push('Consider increasing GPT-4 usage for better quality');
    }

    // If GPT-3.5 is significantly faster, recommend it for time-sensitive tasks
    if (stats.gpt35.avgTime < stats.gpt4.avgTime * 0.7) {
      recommendations.push('Use GPT-3.5 for latency-sensitive applications');
    }

    // Quality analysis
    if (stats.gpt4.avgScore > 85 && stats.gpt35.avgScore < 75) {
      recommendations.push('Quality gap detected: GPT-4 recommended for critical tasks');
    }

    return recommendations;
  }

  /**
   * Get detailed statistics
   */
  getStats() {
    return {
      models: this.modelStats,
      recommendations: this.getRecommendations(),
      costAnalysis: {
        gpt4Cost: this.modelStats.gpt4.cost.toFixed(4),
        gpt35Cost: this.modelStats.gpt35.cost.toFixed(4),
        totalCost: (this.modelStats.gpt4.cost + this.modelStats.gpt35.cost).toFixed(4),
        costRatio: (this.modelStats.gpt4.cost / Math.max(1, this.modelStats.gpt35.cost)).toFixed(2)
      },
      usageAnalysis: {
        gpt4Usage: this.modelStats.gpt4.used,
        gpt35Usage: this.modelStats.gpt35.used,
        totalUsage: this.modelStats.gpt4.used + this.modelStats.gpt35.used
      }
    };
  }

  /**
   * Reset statistics
   */
  reset() {
    this.modelStats = {
      gpt4: { used: 0, cost: 0, avgTime: 0, avgScore: 0 },
      gpt35: { used: 0, cost: 0, avgTime: 0, avgScore: 0 }
    };
    this.complexityCache.clear();
    this.logger.info('AI Selector statistics reset');
  }
}

module.exports = AdvancedAISelector;
