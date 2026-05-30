/**
 * Cost Optimizer
 * Dynamic cost management, budget tracking, and cost-aware routing
 */
class CostOptimizer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.monthlyBudget = config.monthlyBudget || 100;
    this.totalCost = 0;
    this.monthlyCost = 0;
    this.costBreakdown = {
      gpt4: 0,
      gpt35: 0,
      apiCalls: 0,
      storage: 0,
      other: 0
    };
    this.costHistory = [];
    this.costAlerts = [];
    this.optimizationRules = [];
    this.costPerToken = {
      'gpt-4': { input: 0.00003, output: 0.00006 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    };
  }

  /**
   * Calculate request cost
   */
  calculateRequestCost(model, inputTokens, outputTokens) {
    const costRates = this.costPerToken[model];
    if (!costRates) return 0;

    const inputCost = inputTokens * costRates.input;
    const outputCost = outputTokens * costRates.output;
    const totalCost = inputCost + outputCost;

    this.recordCost(model, totalCost, { inputTokens, outputTokens });
    return totalCost;
  }

  /**
   * Record cost
   */
  recordCost(model, amount, details = {}) {
    this.totalCost += amount;
    this.monthlyCost += amount;

    if (this.costBreakdown[model] !== undefined) {
      this.costBreakdown[model] += amount;
    }

    this.costHistory.push({
      timestamp: Date.now(),
      model,
      amount,
      details,
      cumulative: this.totalCost
    });

    this.checkCostThresholds();
  }

  /**
   * Check cost thresholds and generate alerts
   */
  checkCostThresholds() {
    const percentageUsed = (this.monthlyCost / this.monthlyBudget) * 100;

    if (percentageUsed > 90 && !this.costAlerts.some(a => a.type === 'critical')) {
      this.costAlerts.push({
        type: 'critical',
        message: `Critical: ${percentageUsed.toFixed(1)}% of monthly budget used`,
        timestamp: Date.now(),
        severity: 'critical'
      });
      this.logger.warn('Cost alert - CRITICAL', { percentageUsed });
    } else if (percentageUsed > 75 && !this.costAlerts.some(a => a.type === 'warning')) {
      this.costAlerts.push({
        type: 'warning',
        message: `Warning: ${percentageUsed.toFixed(1)}% of monthly budget used`,
        timestamp: Date.now(),
        severity: 'warning'
      });
      this.logger.warn('Cost alert - WARNING', { percentageUsed });
    }
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];

    // If GPT-4 usage is high, recommend switching to GPT-3.5
    if (this.costBreakdown.gpt4 > this.monthlyBudget * 0.3) {
      recommendations.push({
        action: 'reduce_gpt4_usage',
        reason: 'GPT-4 accounts for > 30% of costs',
        potential_savings: this.costBreakdown.gpt4 * 0.6,
        suggestion: 'Use GPT-3.5 for simple queries'
      });
    }

    // If cost is growing rapidly
    if (this.costHistory.length > 7) {
      const recentCost = this.costHistory.slice(-7).reduce((sum, c) => sum + c.amount, 0);
      const oldCost = this.costHistory.slice(-14, -7).reduce((sum, c) => sum + c.amount, 0);
      const growthRate = oldCost > 0 ? ((recentCost - oldCost) / oldCost) * 100 : 0;

      if (growthRate > 50) {
        recommendations.push({
          action: 'cost_growth_alert',
          reason: `Cost growing at ${growthRate.toFixed(0)}% rate`,
          potential_savings: this.monthlyBudget - this.monthlyCost,
          suggestion: 'Enable aggressive caching and optimize prompts'
        });
      }
    }

    // Cache hit optimization
    recommendations.push({
      action: 'maximize_cache_hits',
      reason: 'Cached responses eliminate API costs',
      potential_savings: this.monthlyBudget * 0.2,
      suggestion: 'Increase cache TTL and hit rate target'
    });

    return recommendations;
  }

  /**
   * Estimate monthly cost
   */
  estimateMonthlyProjection() {
    const daysSoFar = new Date().getDate();
    const estimatedMonthly = (this.monthlyCost / daysSoFar) * 30;
    const daysRemaining = 30 - daysSoFar;

    return {
      currentCost: this.monthlyCost.toFixed(4),
      estimatedMonthly: estimatedMonthly.toFixed(4),
      budget: this.monthlyBudget.toFixed(4),
      budgetRemaining: Math.max(0, (this.monthlyBudget - estimatedMonthly)).toFixed(4),
      percentageOfBudget: ((estimatedMonthly / this.monthlyBudget) * 100).toFixed(1),
      daysRemaining,
      dailyAverageCost: (this.monthlyCost / daysSoFar).toFixed(4),
      projectedDailyRemainingBudget: (Math.max(0, this.monthlyBudget - estimatedMonthly) / daysRemaining).toFixed(4)
    };
  }

  /**
   * Get cost by time period
   */
  getCostByTimePeriod(period = 'day') {
    const now = Date.now();
    let cutoff;

    switch (period) {
      case 'hour': cutoff = now - 60 * 60 * 1000; break;
      case 'day': cutoff = now - 24 * 60 * 60 * 1000; break;
      case 'week': cutoff = now - 7 * 24 * 60 * 60 * 1000; break;
      case 'month': cutoff = now - 30 * 24 * 60 * 60 * 1000; break;
      default: cutoff = now;
    }

    return this.costHistory
      .filter(c => c.timestamp > cutoff)
      .reduce((sum, c) => sum + c.amount, 0);
  }

  /**
   * Get cost breakdown
   */
  getCostBreakdown() {
    return {
      byModel: {
        'gpt-4': this.costBreakdown.gpt4.toFixed(4),
        'gpt-3.5-turbo': this.costBreakdown.gpt35.toFixed(4),
        'other': this.costBreakdown.other.toFixed(4)
      },
      byPeriod: {
        'hour': this.getCostByTimePeriod('hour').toFixed(4),
        'day': this.getCostByTimePeriod('day').toFixed(4),
        'week': this.getCostByTimePeriod('week').toFixed(4),
        'month': this.getCostByTimePeriod('month').toFixed(4)
      },
      total: this.totalCost.toFixed(4)
    };
  }

  /**
   * Predict when budget will be exhausted
   */
  predictBudgetExhaustion() {
    if (this.costHistory.length < 7) {
      return { prediction: 'insufficient_data', daysUntilBudgetDepleted: null };
    }

    const lastWeekCost = this.getCostByTimePeriod('week');
    const dailyAverageCost = lastWeekCost / 7;
    const budgetRemaining = this.monthlyBudget - this.monthlyCost;

    if (dailyAverageCost <= 0) {
      return { prediction: 'no_cost_detected', daysUntilBudgetDepleted: null };
    }

    const daysUntilExhaustion = Math.floor(budgetRemaining / dailyAverageCost);

    return {
      prediction: daysUntilExhaustion <= 0 ? 'budget_exceeded' : 'normal',
      daysUntilBudgetDepleted: Math.max(0, daysUntilExhaustion),
      dailyAverageCost: dailyAverageCost.toFixed(4),
      budgetRemaining: budgetRemaining.toFixed(4)
    };
  }

  /**
   * Export cost report
   */
  exportReport() {
    return {
      summary: {
        totalCost: this.totalCost.toFixed(4),
        monthlyCost: this.monthlyCost.toFixed(4),
        monthlyBudget: this.monthlyBudget.toFixed(4),
        budgetUtilization: ((this.monthlyCost / this.monthlyBudget) * 100).toFixed(1) + '%'
      },
      breakdown: this.getCostBreakdown(),
      projection: this.estimateMonthlyProjection(),
      predictions: this.predictBudgetExhaustion(),
      recommendations: this.getOptimizationRecommendations(),
      alerts: this.costAlerts.slice(-10),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Set monthly budget
   */
  setMonthlyBudget(amount) {
    this.monthlyBudget = amount;
    this.logger.info('Monthly budget updated', { budget: amount });
  }

  /**
   * Reset monthly cost (called at start of new month)
   */
  resetMonthlyCost() {
    this.monthlyCost = 0;
    this.costBreakdown = {
      gpt4: 0,
      gpt35: 0,
      apiCalls: 0,
      storage: 0,
      other: 0
    };
    this.costAlerts = [];
    this.logger.info('Monthly cost tracker reset');
  }

  /**
   * Get detailed cost metrics
   */
  getMetrics() {
    return {
      costPerToken: this.costPerToken,
      currentMonthCost: this.monthlyCost.toFixed(4),
      totalCost: this.totalCost.toFixed(4),
      costHistory: {
        total: this.costHistory.length,
        recent: this.costHistory.slice(-100)
      },
      alerts: {
        total: this.costAlerts.length,
        recent: this.costAlerts.slice(-10)
      }
    };
  }

  /**
   * Clear old cost history
   */
  clearOldHistory(daysOld = 90) {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    this.costHistory = this.costHistory.filter(c => c.timestamp > cutoff);
    this.logger.debug('Old cost history cleared', { daysOld });
  }

  /**
   * Reset cost optimizer
   */
  reset() {
    this.totalCost = 0;
    this.monthlyCost = 0;
    this.costBreakdown = {
      gpt4: 0,
      gpt35: 0,
      apiCalls: 0,
      storage: 0,
      other: 0
    };
    this.costHistory = [];
    this.costAlerts = [];
    this.logger.info('Cost optimizer reset');
  }
}

module.exports = CostOptimizer;
