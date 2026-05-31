const { Client, LocalAuth } = require('whatsapp-web.js');
const OpenAI = require('openai');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');

// ========== AUTHENTICATION HELPER ==========
const WhatsAppAuthHelper = require('./whatsapp-auth-helper');

// ========== CORE MODULES ==========
const RBACManager = require('./rbac-manager');
const SecurityManager = require('./security-manager');
const SystemCommandsHandler = require('./system-commands');
const EnhancedHistoryManager = require('./enhanced-history');
const AIEnhancementEngine = require('./ai-enhancement');

// ========== OPTIMIZATION MODULES ==========
const AIPerformanceOptimizer = require('./ai-optimizer');
const MessageQueueManager = require('./message-queue');
const SentimentIntentAnalyzer = require('./sentiment-analyzer');
const ReliabilityManager = require('./reliability-manager');
const ResponseStreamingManager = require('./response-streaming');
const PerformanceMonitor = require('./performance-monitor');
const GracefulDegradation = require('./graceful-degradation');

// ========== ADVANCED MODULES (Enterprise) ==========
const AdvancedAISelector = require('./advanced-ai-selector');
const PredictiveOptimizer = require('./predictive-optimizer');
const AdvancedAnalytics = require('./advanced-analytics');
const CostOptimizer = require('./cost-optimizer');
const SelfHealingEngine = require('./self-healing');

// ========== BOT MANAGEMENT & UPDATE ==========
const BotUpdateManager = require('./bot-update-manager');

// ========== ULTRA-ADVANCED MODULES (Enterprise Ultra) ==========
const AdvancedObservability = require('./advanced-observability');
const RealTimeDashboard = require('./real-time-dashboard');
const MLClassificationEngine = require('./ml-classifier');
const AdvancedSecurity = require('./advanced-security');
const ComplianceFramework = require('./compliance-framework');

// Load config
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

// Initialize OpenAI
const openai = new OpenAI({ apiKey: config.openai.apiKey });

// ========== GLOBAL MANAGER INSTANCES ==========
let aiOptimizer;
let messageQueue;
let sentimentAnalyzer;
let reliabilityManager;
let responseStreamer;
let performanceMonitor;
let gracefulDegradation;

let rbacManager;
let securityManager;
let enhancedHistory;
let systemCommands;
let aiEnhancementEngine;

// ========== BOT MANAGEMENT INSTANCES ==========
let botUpdateManager;

// ========== ADVANCED MANAGER INSTANCES (Enterprise) ==========
let advancedAISelector;
let predictiveOptimizer;
let advancedAnalytics;
let costOptimizer;
let selfHealing;

// ========== ULTRA-ADVANCED MANAGER INSTANCES (Enterprise Ultra) ==========
let advancedObservability;
let realTimeDashboard;
let mlClassifier;
let advancedSecurity;
let complianceFramework;

// Store for conversation history, rate limiting, and stats
let conversationHistory = new Map();
const userStats = new Map();
const HISTORY_FILE = './conversation_history.json';
const STATS_FILE = './user_stats.json';

// ============= ADVANCED LOGGING WITH METRICS =============
class AdvancedLogger {
  constructor() {
    this.metrics = {
      total: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      debug: 0
    };
    this.startTime = Date.now();
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const logEntry = { timestamp, level, message, uptime, ...data };
    const logText = `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`;
    
    this.metrics[level]++;
    this.metrics.total++;
    
    // Console output with colors
    const colors = {
      'info': '\x1b[36m',
      'error': '\x1b[31m',
      'warn': '\x1b[33m',
      'debug': '\x1b[35m',
      'reset': '\x1b[0m'
    };
    
    const colorCode = colors[level] || colors.reset;
    const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    console.log(`${colorCode}[${level.toUpperCase()}]${colors.reset} ${message}${dataStr}`);
    
    if (config.logging.saveToFile) {
      fs.appendFileSync(path.join(__dirname, 'bot.log'), logText);
    }
  }

  info(msg, data) { this.log('info', msg, data); }
  error(msg, data) { this.log('error', msg, data); }
  warn(msg, data) { this.log('warn', msg, data); }
  debug(msg, data) { this.log('debug', msg, data); }
  
  getMetrics() { return { ...this.metrics, uptime: Math.floor((Date.now() - this.startTime) / 1000) }; }
}

const logger = new AdvancedLogger();

// ========== WHATSAPP AUTHENTICATION HELPER ==========
let authHelper;

// ============= INITIALIZE ALL MANAGERS =============
function initializeAllManagers() {
  logger.info('🚀 Initializing all managers...');
  
  // Initialize WhatsApp Auth Helper
  authHelper = new WhatsAppAuthHelper(config, logger);
  logger.info('✅ WhatsApp Auth Helper initialized', { method: config.security.authMethod });
  
  // Core managers
  rbacManager = new RBACManager(config, logger);
  securityManager = new SecurityManager(config, logger);
  enhancedHistory = new EnhancedHistoryManager(config, logger);
  systemCommands = new SystemCommandsHandler(config, logger, rbacManager);
  aiEnhancementEngine = new AIEnhancementEngine({
    enablePersonality: true,
    enableContextMemory: true,
    enableAdaptiveLearning: true,
    enableMultiLanguage: true,
    enableEmotionalIntelligence: true
  });
  logger.info('✅ AI Enhancement Engine initialized with advanced features');

  // Optimization managers
  aiOptimizer = new AIPerformanceOptimizer(config.optimization.aiOptimizer, logger);
  messageQueue = new MessageQueueManager(config.optimization.messageQueue, logger);
  sentimentAnalyzer = new SentimentIntentAnalyzer(config.optimization.sentimentAnalyzer, logger);
  reliabilityManager = new ReliabilityManager(config.optimization.reliabilityManager, logger);
  responseStreamer = new ResponseStreamingManager(config.optimization.responseStreaming, logger);
  performanceMonitor = new PerformanceMonitor(config.optimization.performanceMonitor, logger);
  gracefulDegradation = new GracefulDegradation(config.optimization.gracefulDegradation, logger);

  // Advanced enterprise managers
  advancedAISelector = new AdvancedAISelector({ costThreshold: 0.05, complexityThreshold: 0.6 }, logger);
  predictiveOptimizer = new PredictiveOptimizer({ confidenceThreshold: 0.7 }, logger);
  advancedAnalytics = new AdvancedAnalytics({}, logger);
  costOptimizer = new CostOptimizer({ monthlyBudget: 100 }, logger);
  selfHealing = new SelfHealingEngine({}, logger);

  // Bot update manager
  botUpdateManager = new BotUpdateManager(config, logger);
  logger.info('✅ Bot Update Manager initialized');

  // Ultra-advanced enterprise managers (v5.0 Enterprise Ultra) - Skip in lightweight mode
  let ultraAdvancedCount = 0;
  if (config.mode !== 'lightweight') {
    advancedObservability = new AdvancedObservability({ enableTracing: true, samplingRate: 1.0 });
    realTimeDashboard = new RealTimeDashboard({ updateInterval: 1000, theme: 'dark' });
    mlClassifier = new MLClassificationEngine({ enableTraining: true, minTrainingSamples: 50 });
    advancedSecurity = new AdvancedSecurity({ enableEncryption: true, enableTokenization: true });
    complianceFramework = new ComplianceFramework({ enableCompliance: true, standards: ['GDPR', 'CCPA', 'SOC2'] });
    ultraAdvancedCount = 5;
    logger.info('✅ Ultra-advanced managers initialized (full mode)', { count: ultraAdvancedCount });
  } else {
    logger.info('⏸️  Ultra-advanced managers skipped (lightweight mode)', { 
      reason: 'Memory optimization for initial connection'
    });
  }

  // Initialize circuit breaker
  reliabilityManager.initializeCircuitBreaker('openai', 5, 60000);

  // Schedule maintenance tasks
  selfHealing.scheduleMaintenanceTasks();

  logger.info('✅ All managers initialized successfully', { 
    managers: 19 + ultraAdvancedCount,
    optimization: 7,
    advanced: 5,
    ultraAdvanced: ultraAdvancedCount,
    mode: config.mode
  });
}

// ============= RATE LIMITING =============
function checkRateLimit(userId) {
  if (!config.rateLimit.enabled) return true;

  const now = Date.now();
  const userStat = userStats.get(userId) || { messages: [], lastReset: now };
  
  // Reset if day has passed
  if (now - userStat.lastReset > 24 * 60 * 60 * 1000) {
    userStat.messages = [];
    userStat.dailyTotal = 0;
    userStat.lastReset = now;
  }

  // Check daily limit
  if ((userStat.dailyTotal || 0) >= config.rateLimit.dailyLimit) {
    return false;
  }

  // Check per-minute limit
  const oneMinuteAgo = now - 60 * 1000;
  userStat.messages = (userStat.messages || []).filter(t => t > oneMinuteAgo);
  
  if (userStat.messages.length >= config.rateLimit.messagesPerMinute) {
    return false;
  }

  userStat.messages.push(now);
  userStat.dailyTotal = (userStat.dailyTotal || 0) + 1;
  userStats.set(userId, userStat);
  
  return true;
}

// ============= PERSISTENT HISTORY =============
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      Object.entries(data).forEach(([key, value]) => {
        conversationHistory.set(key, value);
      });
      logger.info('History loaded', { chats: Object.keys(data).length });
    }
  } catch (err) {
    logger.error('Failed to load history', { error: err.message });
  }
}

function saveHistory() {
  try {
    const data = Object.fromEntries(conversationHistory);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    logger.error('Failed to save history', { error: err.message });
  }
}

function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
      Object.entries(data).forEach(([key, value]) => {
        userStats.set(key, value);
      });
      logger.info('Stats loaded');
    }
  } catch (err) {
    logger.error('Failed to load stats', { error: err.message });
  }
}

// Auto-save every 5 minutes
setInterval(() => {
  saveHistory();
  if (userStats.size > 0) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(Object.fromEntries(userStats), null, 2));
  }
}, 5 * 60 * 1000);

// ============= AI DETECTION =============
function isAIUser(message) {
  const lowerMsg = message.toLowerCase();
  return config.openai.aiDetectionKeywords.some(keyword => lowerMsg.includes(keyword));
}

function isIgnoredMessage(message) {
  const lowerMsg = message.toLowerCase().trim();
  return lowerMsg.includes('⚠️ wah api ku limit nih. nanti dihubungi lagi ya.') ||
    lowerMsg.includes('wah api ku limit nih. nanti dihubungi lagi ya.');
}

function detectEmotion(message) {
  const lowerMsg = message.toLowerCase();
  const emotionMap = {
    joy: ['senang', 'bahagia', 'gembira', 'happy', 'suka', 'asyik', 'puas', 'bangga'],
    sadness: ['sedih', 'kecewa', 'galau', 'nangis', 'frustrasi', 'patah hati', 'kehilangan', 'menangis'],
    anger: ['marah', 'kesal', 'geram', 'jengkel', 'benci', 'emosi', 'ngamuk', 'nervous', 'keselnya'],
    fear: ['takut', 'cemas', 'khawatir', 'was-was', 'grogi', 'nervous', 'panik'],
    surprise: ['terkejut', 'wow', 'astaga', 'eh', 'gak nyangka', 'nggak nyangka'],
    love: ['cinta', 'sayang', 'rindu', 'kasih', 'sayang sekali']
  };

  for (const [label, words] of Object.entries(emotionMap)) {
    if (words.some(word => lowerMsg.includes(word))) {
      return { isNeutral: false, label };
    }
  }

  if (/[!]{2,}|\b(kenapa|kok|ga|nggak|gak)\b/.test(lowerMsg) && /\b(sayang|benci|capek|bosan|males)\b/.test(lowerMsg)) {
    return { isNeutral: false, label: 'frustration' };
  }

  if (lowerMsg.includes('?') && lowerMsg.split('?').length <= 2 && lowerMsg.length < 120) {
    return { isNeutral: true, label: 'question' };
  }

  return { isNeutral: true, label: 'netral' };
}

function buildSystemPrompt(message, detectedAI, tone) {
  if (detectedAI) {
    return `Kamu Jarvis - AI bot Alwis di WhatsApp. Kamu sedang berkomunikasi dengan AI lain.
Fokus pada menggali detail AI tersebut secara mendalam: nama model, arsitektur, developer, tujuan, kemampuan, batasan, pelatihan, data sumber, release, dan keunikan.
Kalau pengguna belum memberi detail, minta informasi lebih lanjut dengan cara natural.
Jangan bersikap seperti chat biasa; tunjukkan minat investigasi dan coba gali semua info sejelas mungkin.`;
  }

  if (tone.isNeutral) {
    return `Kamu Jarvis, AI assistant Alwis di WhatsApp.
Percakapan ini dari manusia dengan nada netral.
Jika user meminta info, berikan jawaban langsung dan ringkas, lalu tambahkan "Alwis akan membalas lebih lanjut jika perlu."`;
  }

  return `Kamu Jarvis, AI assistant Alwis di WhatsApp.
Percakapan ini dari manusia dengan nada emosional (${tone.label}).
Jelaskan dengan empati dan perhatian. Jawab sesuai kebutuhan, tetap ringkas dan ajak melanjutkan percakapan jika relevan.`;
}

// ============= OPTIMIZED AI RESPONSE HANDLER =============
async function handleOptimizedMessage(message, chatId, client, enhancedSystemPrompt = null) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    // 1. Check service availability
    if (!gracefulDegradation.isFeatureAvailable('aiResponses')) {
      const fallback = gracefulDegradation.getAlternativeResponse(message, 'service_degraded');
      return responseStreamer.formatForWhatsApp(fallback);
    }

    // 2. Analyze sentiment and intent
    const sentiment = sentimentAnalyzer.analyzeSentiment(message, chatId);
    const intent = sentimentAnalyzer.getPrimaryIntent(message);

    // 3. Check cache first
    const cachedResponse = aiOptimizer.getCachedResponse(message, chatId);
    if (cachedResponse) {
      performanceMonitor.recordResponse(requestId, 200, 10, cachedResponse.length);
      logger.debug('Cache hit', { chatId, requestId });
      return responseStreamer.formatForWhatsApp(cachedResponse);
    }

    // 4. Check circuit breaker
    if (!reliabilityManager.canExecute('openai')) {
      const fallbackResponse = gracefulDegradation.getCachedFallback(message);
      if (fallbackResponse) {
        return responseStreamer.formatForWhatsApp(fallbackResponse);
      }
      return reliabilityManager.getFallbackResponse('openai_error');
    }

    // 5. Start typing indicator
    try {
      await responseStreamer.startTyping(chatId, client);
    } catch (err) {
      logger.debug('Typing indicator failed', { error: err.message });
    }

    // 6. Prepare AI request with optimization
    let history = enhancedHistory.getChatHistory(chatId) || [];
    const detectedAI = isAIUser(message);
    const tone = detectedAI ? null : sentiment;
    
    // Use enhanced system prompt if provided by AI Enhancement Engine
    let systemPrompt;
    if (enhancedSystemPrompt) {
      systemPrompt = enhancedSystemPrompt;
      logger.debug('🧠 Using enhanced system prompt from AI Enhancement Engine', { chatId });
    } else {
      // Fallback to original system prompt generation
      systemPrompt = buildSystemPrompt(message, detectedAI, tone || { isNeutral: true, label: 'netral' });
      
      // Use sentiment analyzer's adaptive prompt if available
      if (!detectedAI && sentiment) {
        systemPrompt = sentimentAnalyzer.generateAdaptivePrompt(sentiment, intent);
      }
    }

    // Optimize context window
    const optimizedHistory = aiOptimizer.optimizeContextWindow(history, 2000);
    optimizedHistory.push({ role: 'user', content: message });

    // 7. Execute with circuit breaker retry
    let response;
    try {
      response = await reliabilityManager.executeWithRetry(
        async () => {
          // Count tokens before API call
          const inputTokens = aiOptimizer.estimateTokens(
            systemPrompt + message + JSON.stringify(optimizedHistory)
          );

          performanceMonitor.recordRequest(requestId, 'openai', { 
            chatId, 
            messageLength: message.length,
            historySize: optimizedHistory.length 
          });

          const completion = await openai.chat.completions.create({
            model: config.openai.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...optimizedHistory
            ],
            max_tokens: detectedAI ? config.openai.maxTokensAI : config.openai.maxTokens,
            temperature: config.openai.temperature
          });

          const responseText = completion.choices[0].message.content;
          
          // Track tokens and cost
          const outputTokens = aiOptimizer.estimateTokens(responseText);
          aiOptimizer.trackRequest(inputTokens, outputTokens, Date.now() - startTime, 0);

          return responseText;
        },
        'openai',
        'exponential'
      );

      reliabilityManager.recordSuccess('openai');
    } catch (error) {
      reliabilityManager.recordFailure('openai', error);
      throw error;
    }

    // 8. Stop typing indicator
    try {
      responseStreamer.stopTyping(chatId);
    } catch (err) {
      logger.debug('Stop typing failed', { error: err.message });
    }

    // 9. Trim and format response
    if (response.length > 250) {
      response = response.substring(0, 240).trim() + '...';
    }
    response = response.replace(/!{2,}/g, '!').replace(/\?{2,}/g, '?');

    // 10. Optimize for display
    let formattedResponse = responseStreamer.optimizeForReadability(response);
    formattedResponse = responseStreamer.formatForWhatsApp(formattedResponse);
    formattedResponse = responseStreamer.smartTruncate(formattedResponse);

    // 11. Cache response
    const qualityScore = aiOptimizer.scoreResponseQuality(response, message);
    const confidence = qualityScore / 100;
    aiOptimizer.cacheResponse(message, response, confidence);
    gracefulDegradation.cacheForFallback(message, response);

    // 12. Track metrics
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordResponse(requestId, 200, responseTime, formattedResponse.length);

    // 13. Add to history
    optimizedHistory.push({ role: 'assistant', content: response });
    enhancedHistory.conversationHistory.set(chatId, optimizedHistory);

    logger.debug('Response generated', { chatId, responseTime, qualityScore });

    return formattedResponse;

  } catch (error) {
    logger.error('Optimized message handler error', { chatId, error: error.message, requestId });
    
    // Stop typing if still active
    try {
      responseStreamer.stopTyping(chatId);
    } catch (err) {}

    // Record error
    performanceMonitor.recordError(requestId, error.name, error.message);
    reliabilityManager.recordFailure('openai', error);

    // Check for degradation
    gracefulDegradation.handleDegradation({
      errorRate: performanceMonitor.getErrorMetrics().errorRate,
      memoryUsagePercent: performanceMonitor.getSystemHealth().memory.heapUsagePercent
    });

    // Return fallback
    const fallback = reliabilityManager.getFallbackResponse(error.code || 'unknown_error');
    return responseStreamer.formatForWhatsApp(fallback);
  }
}

// ============= PERMISSION & ACCESS CHECKER =============
async function handleAccessRequest(userId, operation, targetData = null) {
  // Super admin always has access
  if (userId === config.security.superAdminPhone) {
    securityManager.logSuccessfulAccess(userId, operation, { auto: true });
    return { approved: true, requestId: null };
  }

  // Check if operation requires approval
  if (!securityManager.shouldRequireApproval(userId, operation, rbacManager)) {
    securityManager.logSuccessfulAccess(userId, operation);
    return { approved: true, requestId: null };
  }

  // Create approval request
  const requestId = uuid.v4();
  const request = securityManager.createApprovalRequest(requestId, userId, operation, targetData);

  // Notify super admin
  return {
    approved: false,
    requestId,
    request,
    needsApproval: true
  };
}

// ============= SYSTEM COMMAND HANDLER =============
async function processSystemCommand(userId, message, client) {
  try {
    // Check if user can execute system commands
    if (!rbacManager.hasPermission(userId, 'execute_system_commands')) {
      return `❌ Anda tidak memiliki izin untuk menggunakan perintah sistem.\n\nRole Anda: ${rbacManager.getUserRole(userId)}`;
    }

    const result = await systemCommands.executeCommand(userId, message, securityManager);
    
    if (result) {
      securityManager.logSuccessfulAccess(userId, 'execute_system_commands', { command: message });
      return result;
    }
  } catch (err) {
    securityManager.recordUnauthorizedAttempt(userId, 'execute_system_commands', { error: err.message });
    return `❌ Error: ${err.message}`;
  }

  return null;
}

// ============= OPTIMIZATION COMMANDS HANDLER =============
async function handleOptimizationCommands(userId, message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg === '/monitor') {
    const dashboard = performanceMonitor.getDashboard();
    return `📊 *PERFORMANCE DASHBOARD*\n\n` +
      `🔵 Service Level: ${gracefulDegradation.getStatus().currentLevel}\n` +
      `💚 Health Score: ${gracefulDegradation.getHealthScore()}/100\n` +
      `📈 Cache Hit Rate: ${aiOptimizer.getMetrics().cacheHitRate.toFixed(1)}%\n` +
      `⚡ Avg Response: ${performanceMonitor.getResponseMetrics().averageTime}ms\n` +
      `❌ Error Rate: ${performanceMonitor.getErrorMetrics().errorRate.toFixed(2)}%\n` +
      `💾 Memory: ${performanceMonitor.getSystemHealth().memory.heapUsagePercent}%\n` +
      `📦 Queue Size: ${messageQueue.getStatus().queueSize}\n` +
      `✅ Total Requests: ${performanceMonitor.getResponseMetrics().totalResponses}`;
  }

  if (lowerMsg === '/queue') {
    const status = messageQueue.getStatus();
    return `📋 *MESSAGE QUEUE STATUS*\n\n` +
      `Queue Size: ${status.queueSize}\n` +
      `Active Requests: ${status.activeRequests}\n` +
      `Processed: ${status.stats.processed}\n` +
      `Failed: ${status.stats.failed}\n` +
      `Success Rate: ${status.metrics.successRate.toFixed(1)}%\n` +
      `Avg Wait: ${status.metrics.averageWaitTime.toFixed(0)}ms\n` +
      `Avg Process: ${status.metrics.averageProcessTime.toFixed(0)}ms`;
  }

  if (lowerMsg === '/health') {
    const health = reliabilityManager.getMetrics();
    const status = Object.values(health.breakers).reduce((acc, b) => {
      if (b.state === 'closed') acc.healthy++;
      if (b.state === 'half-open') acc.degraded++;
      if (b.state === 'open') acc.failed++;
      return acc;
    }, { healthy: 0, degraded: 0, failed: 0 });
    
    return `🏥 *SYSTEM HEALTH*\n\n` +
      `Overall Score: ${health.overallHealthScore}/100\n` +
      `Healthy Services: ${status.healthy}\n` +
      `Degraded: ${status.degraded}\n` +
      `Failed: ${status.failed}\n\n` +
      `🔧 *Services*:\n` +
      `OpenAI: ${health.breakers.openai?.state || 'unknown'}`;
  }

  if (lowerMsg === '/cache') {
    const cache = aiOptimizer.getMetrics();
    return `💾 *CACHE STATISTICS*\n\n` +
      `Hit Rate: ${cache.cacheHitRate.toFixed(1)}%\n` +
      `Total Requests: ${cache.totalRequests}\n` +
      `Cache Hits: ${cache.cacheHits}\n` +
      `Cache Misses: ${cache.cacheMisses}\n` +
      `Avg Cost: $${(cache.totalCost / Math.max(1, cache.totalRequests)).toFixed(4)}\n` +
      `Total Cost: $${cache.totalCost.toFixed(2)}\n` +
      `Success Rate: ${cache.successRate.toFixed(1)}%`;
  }

  if (lowerMsg === '/metrics') {
    const metrics = performanceMonitor.getDashboard();
    return `📊 *DETAILED METRICS*\n\n` +
      `p50 Response: ${metrics.responses.p50}ms\n` +
      `p95 Response: ${metrics.responses.p95}ms\n` +
      `p99 Response: ${metrics.responses.p99}ms\n` +
      `Data Transferred: ${metrics.responses.totalDataTransferred}MB\n` +
      `Total Errors: ${metrics.errors.totalErrors}\n` +
      `Top Errors: ${metrics.errors.topErrors[0]?.type || 'none'}`;
  }

  if (lowerMsg === '/sentiment') {
    const sentiment = sentimentAnalyzer.getAnalytics(userId);
    return `😊 *SENTIMENT ANALYSIS*\n\n` +
      `Current: ${sentiment.currentSentiment}\n` +
      `Score: ${sentiment.score}\n` +
      `Intensity: ${(sentiment.intensity * 100).toFixed(0)}%\n` +
      `Confidence: ${(sentiment.confidence * 100).toFixed(0)}%`;
  }

  if (lowerMsg.startsWith('/degrade ')) {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can degrade service level';
    }
    const level = message.substring(8).trim();
    const valid = ['full_service', 'normal_with_warnings', 'limited_service', 'critical_mode', 'fallback_only'];
    if (!valid.includes(level)) {
      return `❌ Invalid level. Valid: ${valid.join(', ')}`;
    }
    gracefulDegradation.degradeTo(level, 'manual_command');
    return `✅ Service degraded to: ${level}`;
  }

  if (lowerMsg === '/recover') {
    const success = gracefulDegradation.attemptRecovery();
    const newLevel = gracefulDegradation.getStatus().currentLevel;
    return success ? 
      `✅ Recovery successful! Now at: ${newLevel}` :
      `ℹ️ Already at highest level: ${newLevel}`;
  }

  // ===== ADVANCED ENTERPRISE COMMANDS =====
  if (lowerMsg === '/advanced-ai') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can access advanced AI selection';
    }
    const stats = advancedAISelector.getStats();
    return `🧠 *ADVANCED AI SELECTOR*\n\n` +
      `GPT-4 Usage: ${stats.usageAnalysis.gpt4Usage}\n` +
      `GPT-3.5 Usage: ${stats.usageAnalysis.gpt35Usage}\n` +
      `GPT-4 Cost: $${stats.costAnalysis.gpt4Cost}\n` +
      `GPT-3.5 Cost: $${stats.costAnalysis.gpt35Cost}\n` +
      `Total Cost: $${stats.costAnalysis.totalCost}`;
  }

  if (lowerMsg === '/predict') {
    const analytics = advancedAnalytics.getAnalytics();
    return `🔮 *PREDICTIVE ANALYTICS*\n\n` +
      `Users Analyzed: ${analytics.totalUsers}\n` +
      `Total Predictions: ${analytics.predictions.total}\n` +
      `Accuracy: ${analytics.predictions.accuracy.toFixed(1)}%\n` +
      `Avg Confidence: ${(analytics.predictions.avgConfidence * 100).toFixed(0)}%`;
  }

  if (lowerMsg === '/analytics') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can access analytics';
    }
    const report = advancedAnalytics.generateTrendReport();
    return `📈 *ADVANCED ANALYTICS*\n\n` +
      `Top Intents: ${report.topIntents.map(([i]) => i).join(', ')}\n` +
      `Error Rate: ${report.errorRate.toFixed(2)}%\n` +
      `Avg Response: ${report.averageResponseTime}ms\n` +
      `Prediction: ${report.prediction.predictedGrowth}`;
  }

  if (lowerMsg === '/cost') {
    const projection = costOptimizer.estimateMonthlyProjection();
    return `💰 *COST OPTIMIZATION*\n\n` +
      `Current: $${projection.currentCost}\n` +
      `Projected: $${projection.estimatedMonthly}\n` +
      `Budget: $${projection.budget}\n` +
      `Remaining: $${projection.budgetRemaining}\n` +
      `Usage: ${projection.percentageOfBudget}%`;
  }

  if (lowerMsg === '/health-check') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can request health checks';
    }
    return `🏥 *SYSTEM HEALTH CHECK*\n\n` +
      `Status: Running diagnostics...\n` +
      `Check /health-report in 10 seconds`;
  }

  if (lowerMsg === '/health-report') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can access health reports';
    }
    const report = selfHealing.getHealthReport();
    return `🏥 *HEALTH REPORT*\n\n` +
      `Status: ${report.status}\n` +
      `Issues: ${report.issues.length}\n` +
      `Recovery Attempts: ${report.recoveryAttempts.length}\n` +
      `Recommendations: ${report.recommendations.length}`;
  }

  if (lowerMsg === '/recommendations') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can access recommendations';
    }
    const costRecs = costOptimizer.getOptimizationRecommendations();
    const aiRecs = advancedAISelector.getRecommendations();
    return `💡 *OPTIMIZATION RECOMMENDATIONS*\n\n` +
      `Cost Recommendations: ${costRecs.length}\n` +
      `AI Model Recommendations: ${aiRecs.length}\n` +
      `Top: ${costRecs[0]?.suggestion || 'No recommendations'}`;
  }

  // ===== ULTRA-ADVANCED COMMANDS (v5.0 Enterprise Ultra) =====
  if (lowerMsg === '/observability') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can access observability';
    }
    const health = advancedObservability.getHealth();
    return `🔍 *DISTRIBUTED TRACING & OBSERVABILITY*\n\n` +
      `Active Traces: ${health.activeTraces}\n` +
      `Total Traces: ${health.totalTraces}\n` +
      `Total Spans: ${health.totalSpans}\n` +
      `Metrics Collected: ${health.metricsCount}\n` +
      `Avg Trace Size: ${health.avgTraceSize.toFixed(0)} spans`;
  }

  if (lowerMsg === '/dashboard') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can access dashboard';
    }
    const dashboardHealth = realTimeDashboard.getHealth();
    return `📊 *REAL-TIME DASHBOARD*\n\n` +
      `Dashboards: ${dashboardHealth.dashboardsCount}\n` +
      `Active Widgets: ${dashboardHealth.widgetsCount}\n` +
      `Data Points: ${dashboardHealth.totalDataPoints}\n` +
      `Active Alerts: ${dashboardHealth.activeAlerts}\n` +
      `Cache Size: ${dashboardHealth.cacheSize}`;
  }

  if (lowerMsg === '/ml-classifier') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can access ML classifier';
    }
    const health = mlClassifier.getHealth();
    return `🤖 *ML CLASSIFICATION ENGINE*\n\n` +
      `Classifiers: ${health.classifiersCount}\n` +
      `Trained: ${health.trainedCount}/${health.classifiersCount}\n` +
      `Total Predictions: ${health.totalPredictions}\n` +
      `Training Data: ${health.totalDataSize}\n` +
      `Avg Accuracy: ${(health.averageAccuracy * 100).toFixed(1)}%`;
  }

  if (lowerMsg === '/security-audit') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can access security audit';
    }
    const health = advancedSecurity.getHealth();
    return `🔐 *ADVANCED SECURITY AUDIT*\n\n` +
      `Active Keys: ${health.activeEncryptionKeys}\n` +
      `Total Keys: ${health.totalEncryptionKeys}\n` +
      `Active Tokens: ${health.activeTokens}\n` +
      `Access Log Size: ${health.accessLogSize}\n` +
      `Critical Incidents: ${health.criticalIncidents}`;
  }

  if (lowerMsg === '/compliance') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can access compliance';
    }
    const health = complianceFramework.getHealth();
    return `✅ *COMPLIANCE FRAMEWORK*\n\n` +
      `Standards Monitored: ${health.standardsMonitored}\n` +
      `Compliant: ${health.standardsCompliant}/${health.standardsMonitored}\n` +
      `Checks Total: ${health.checksTotal}\n` +
      `Violations Open: ${health.violationsOpen}\n` +
      `Critical Issues: ${health.violationsCritical}`;
  }

  if (lowerMsg === '/trace') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can access traces';
    }
    const traces = advancedObservability.getActiveTraces();
    let response = `🔍 *ACTIVE TRACES*\n\n`;
    traces.slice(0, 5).forEach((trace, i) => {
      response += `${i + 1}. ${trace.name} (${trace.spanCount} spans, ${trace.duration}ms)\n`;
    });
    return response || '❌ No active traces';
  }

  if (lowerMsg === '/ml-train') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can trigger ML training';
    }
    const result = mlClassifier.retrainModels();
    return `🤖 *ML RETRAINING INITIATED*\n\n` +
      `Models Retrained: ${result.retrained}\n` +
      `Timestamp: ${new Date(result.timestamp).toLocaleString()}\n` +
      `Average Accuracy: ${(result.metrics.intent?.accuracy * 100 || 0).toFixed(1)}%`;
  }

  if (lowerMsg === '/security-report') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can view security report';
    }
    const report = advancedSecurity.generateSecurityReport();
    return `🔐 *SECURITY REPORT*\n\n` +
      `Encryption Status:\n` +
      `  • Active Keys: ${report.encryptionStatus.activeKeys}\n` +
      `  • Total Keys: ${report.encryptionStatus.totalKeys}\n` +
      `Token Status:\n` +
      `  • Active: ${report.tokenStatus.activeTokens}\n` +
      `  • Total: ${report.tokenStatus.totalTokens}\n` +
      `  • Revoked: ${report.tokenStatus.revokedTokens}\n` +
      `Security Events: ${report.securityEvents.totalEvents}\n` +
      `Critical: ${report.securityEvents.critical}`;
  }

  if (lowerMsg === '/compliance-report') {
    if (userId !== config.security.superAdminPhone) {
      return '❌ Only SUPER_ADMIN can view compliance report';
    }
    const report = complianceFramework.generateComplianceReport();
    return `✅ *COMPLIANCE REPORT*\n\n` +
      `Overall Compliance: ${report.overallCompliance}%\n` +
      `Standards Checked: ${Object.keys(report.standards).length}\n` +
      `Open Violations: ${report.violations.length}\n` +
      `Recommendations: ${report.recommendations.length}`;
  }

  return null;
}

// ============= QUEUED MESSAGE PROCESSOR =============
async function processQueuedMessage(message, metadata) {
  const { chatId, msg } = metadata;

  try {
    const response = await handleOptimizedMessage(message, chatId, client);
    if (response && !response.trim().toLowerCase().includes('⚠️ api rate limit')) {
      await msg.reply(response);
      enhancedHistory.addMessage(chatId, 'assistant', response);
      enhancedHistory.saveHistory();
      logger.info('Queued response sent', { chatId, responseLength: response.length });
    }
    return response;
  } catch (error) {
    logger.error('Queued message processing failed', { chatId, error: error.message });
    try {
      await msg.reply('❌ Terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.');
    } catch (replyError) {
      logger.error('Failed to send queued error reply', { error: replyError.message });
    }
    return null;
  }
}

// ============= SPECIAL COMMANDS HANDLER =============
async function handleSpecialCommands(userId, message, client) {
  const lowerMsg = message.toLowerCase();

  // Query system status
  if (lowerMsg.includes('/status')) {
    try {
      const status = systemCommands.getSystemStatus(userId);
      return `🤖 *Status Sistem*\n\n` +
        `Uptime: ${Math.floor(status.uptime)}s\n` +
        `Memory: ${Math.round(status.memoryUsage.heapUsed / 1024 / 1024)}MB\n` +
        `Node: ${status.nodeVersion}\n` +
        `Platform: ${status.platform}\n\n` +
        `Role: ${rbacManager.getUserRole(userId)}\n` +
        `Priority: ${rbacManager.getUserPriority(userId)}`;
    } catch (err) {
      return `❌ ${err.message}`;
    }
  }

  // Show user role info
  if (lowerMsg.includes('/info_user') || lowerMsg.includes('/role')) {
    const info = rbacManager.getUserRoleInfo(userId);
    return `👤 *Info User*\n\n` +
      `Phone: ${info.userId}\n` +
      `Role: ${info.role}\n` +
      `Priority: ${info.priority}\n` +
      `Permissions: ${info.permissionCount}\n\n` +
      `📋 Permissions:\n${info.permissions.map(p => '• ' + p).join('\n')}`;
  }

  // Search history
  if (lowerMsg.startsWith('/cari')) {
    try {
      const query = message.substring(5).trim();
      const results = enhancedHistory.searchByKeyword(query);
      
      if (results.length === 0) {
        return `❌ Tidak ada hasil untuk: "${query}"`;
      }

      let response = `🔍 *Hasil Pencarian: "${query}"* (${results.length})\n\n`;
      results.slice(0, 5).forEach((result, idx) => {
        response += `${idx + 1}. ${result.content?.substring(0, 60)}...\n`;
        response += `   📅 ${result.timestamp}\n\n`;
      });

      if (results.length > 5) {
        response += `... dan ${results.length - 5} hasil lainnya`;
      }

      return response;
    } catch (err) {
      return `❌ ${err.message}`;
    }
  }

  // Search by date
  if (lowerMsg.startsWith('/tanggal')) {
    try {
      const date = message.substring(8).trim();
      const results = enhancedHistory.searchByDate(date);
      
      if (results.length === 0) {
        return `❌ Tidak ada percakapan pada tanggal: ${date}`;
      }

      return `📅 *Percakapan pada ${date}*\n\nTotal: ${results.length} pesan\n\n` +
        results.map(r => `• ${r.content?.substring(0, 50)}...`).slice(0, 5).join('\n');
    } catch (err) {
      return `❌ ${err.message}`;
    }
  }

  // Get history statistics
  if (lowerMsg.includes('/statistik')) {
    try {
      const allStats = enhancedHistory.getAllChatsStats();
      const totalChats = allStats.length;
      const totalMessages = allStats.reduce((sum, s) => sum + s.totalMessages, 0);
      
      return `📊 *Statistik Percakapan*\n\n` +
        `Total Chat: ${totalChats}\n` +
        `Total Pesan: ${totalMessages}\n` +
        `Rata-rata per Chat: ${Math.round(totalMessages / totalChats)}\n\n` +
        `🔝 *Top Chats*:\n` +
        allStats.slice(0, 3).map((s, i) => 
          `${i+1}. ${s.chatId}: ${s.totalMessages} pesan`
        ).join('\n');
    } catch (err) {
      return `❌ ${err.message}`;
    }
  }

  // Manage user roles (SUPER_ADMIN only)
  if (lowerMsg.startsWith('/set_role ')) {
    try {
      if (userId !== config.security.superAdminPhone) {
        return `❌ Hanya SUPER_ADMIN yang dapat mengatur role.`;
      }

      const parts = message.substring(10).split(' ');
      if (parts.length < 2) {
        return `❌ Format: /set_role <phone> <role>`;
      }

      const result = rbacManager.setUserRole(parts[0], parts[1].toUpperCase(), userId);
      return result;
    } catch (err) {
      return `❌ ${err.message}`;
    }
  }

  // List all users (ADMIN+ only)
  if (lowerMsg.includes('/list_users')) {
    try {
      if (!rbacManager.hasPermission(userId, 'manage_users')) {
        return `❌ Anda tidak memiliki izin untuk melihat daftar user.`;
      }

      const users = rbacManager.listAllUsers();
      let response = `👥 *Daftar Pengguna* (${users.length})\n\n`;
      
      users.forEach((u, idx) => {
        response += `${idx + 1}. ${u.phone}\n   Role: ${u.role}\n   Priority: ${u.priority}\n\n`;
      });

      return response;
    } catch (err) {
      return `❌ ${err.message}`;
    }
  }

  // Show pending approvals (SUPER_ADMIN only)
  if (lowerMsg.includes('/pending_approvals')) {
    try {
      if (userId !== config.security.superAdminPhone) {
        return `❌ Hanya SUPER_ADMIN yang dapat melihat permohonan.`;
      }

      const pending = securityManager.getPendingApprovals();
      
      if (pending.length === 0) {
        return `✅ Tidak ada permohonan yang pending.`;
      }

      let response = `⏳ *Permohonan Pending* (${pending.length})\n\n`;
      
      pending.forEach((req, idx) => {
        response += `${idx + 1}. ID: ${req.requestId.substring(0, 8)}\n`;
        response += `   Dari: ${req.requesterPhone}\n`;
        response += `   Operasi: ${req.operation}\n`;
        response += `   Dibuat: ${new Date(req.createdAt).toLocaleString()}\n\n`;
      });

      return response;
    } catch (err) {
      return `❌ ${err.message}`;
    }
  }

  // Approve request (SUPER_ADMIN only)
  if (lowerMsg.startsWith('/setuju ')) {
    try {
      if (userId !== config.security.superAdminPhone) {
        return `❌ Hanya SUPER_ADMIN yang dapat menyetujui.`;
      }

      const requestId = message.substring(7).trim();
      const result = securityManager.approveRequest(requestId, userId, 'Approved via WhatsApp');
      
      return `✅ Permohonan disetujui!\n\nOperasi: ${result.operation}\nPemohon: ${result.requesterPhone}`;
    } catch (err) {
      return `❌ ${err.message}`;
    }
  }

  // Reject request (SUPER_ADMIN only)
  if (lowerMsg.startsWith('/tolak ')) {
    try {
      if (userId !== config.security.superAdminPhone) {
        return `❌ Hanya SUPER_ADMIN yang dapat menolak.`;
      }

      const requestId = message.substring(6).trim();
      const result = securityManager.rejectRequest(requestId, userId, 'Rejected via WhatsApp');
      
      return `❌ Permohonan ditolak!\n\nOperasi: ${result.operation}\nPemohon: ${result.requesterPhone}`;
    } catch (err) {
      return `❌ ${err.message}`;
    }
  }

  // Show help
  if (lowerMsg.includes('/help') || lowerMsg.includes('/bantuan')) {
    let helpText = `🤖 *Perintah Jarvis Bot*\n\n`;
    helpText += `📌 *Umum*:\n`;
    helpText += `/status - Status sistem\n`;
    helpText += `/role - Info role user\n`;
    helpText += `/help - Bantuan\n\n`;

    if (rbacManager.hasPermission(userId, 'view_all_history')) {
      helpText += `📚 *Riwayat*:\n`;
      helpText += `/cari <keyword> - Cari chat\n`;
      helpText += `/tanggal YYYY-MM-DD - Cari by tanggal\n`;
      helpText += `/statistik - Statistik percakapan\n\n`;
    }

    if (rbacManager.hasPermission(userId, 'execute_system_commands')) {
      helpText += `⚙️ *Sistem*:\n`;
      helpText += `/buat_file <path> <content> - Buat file\n`;
      helpText += `/lihat_file <path> - Lihat file\n`;
      helpText += `/buat_folder <path> - Buat folder\n`;
      helpText += `/ubah_setting <path> <value> - Ubah setting\n\n`;
    }

    if (userId === config.security.superAdminPhone) {
      helpText += `🔐 *Admin*:\n`;
      helpText += `/set_role <phone> <role> - Set user role\n`;
      helpText += `/list_users - Daftar semua user\n`;
      helpText += `/pending_approvals - Permohonan pending\n`;
      helpText += `/setuju <requestId> - Setuju permohonan\n`;
      helpText += `/tolak <requestId> - Tolak permohonan\n`;
    }

    return helpText;
  }

  return null;
}

// ============= MAIN BOT =============
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: 'new',
    protocolTimeout: 240000, // 4 minutes
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled'
    ]
  }
});

client.on('qr', (qr) => {
  logger.info('� WhatsApp Authentication Required');
  
  // Check if using manual auth method
  if (config.security.authMethod === 'manual-whatsapp-web') {
    // Show manual linking instructions
    if (!authHelper) {
      authHelper = new WhatsAppAuthHelper(config, logger);
    }
    authHelper.handleManualAuth();
    logger.info('💡 Using: Manual WhatsApp Web Linking (Phone + Code)');
  } else {
    // Use traditional QR code method
    if (authHelper) {
      authHelper.handleQRCodeAuth(qr);
    }
    logger.info('📱 Using: QR Code Scanning');
    qrcode.generate(qr, { small: true });
  }
});

client.on('ready', () => {
  authPromptShown = true;
  clearInterval(initDebugInterval);
  clearTimeout(timeoutWatchdog);
  logger.info('✅ Jarvis Bot is ready!');
  logger.info(`🔐 RBAC System Active - Super Admin: ${config.security.superAdminPhone}`);
  logger.info(`📱 Admin Phone Formatted: +62 ${config.security.superAdminPhone.substring(2)}`);
  logger.info(`🔑 Auth Method: ${config.security.authMethod || 'qr-code'}`);
  
  if (!aiOptimizer || !enhancedHistory) {
    initializeAllManagers();
    logger.info('✅ All managers initialized and ready for optimization');
  }
  
  // Log auth helper status if available
  if (authHelper) {
    const authStatus = authHelper.getStatus();
    logger.info('✅ Auth Status:', authStatus);
  }
});

// Error event handlers for debugging
client.on('auth_failure', (msg) => {
  logger.error('❌ Auth Failure', { message: msg });
  console.error('🔴 Authentication failed. Please scan QR code or link device.');
});

client.on('disconnected', (reason) => {
  logger.warn('⚠️ Bot Disconnected', { reason });
});

client.on('error', (err) => {
  logger.error('❌ Client Error', { error: err.message, stack: err.stack });
});

client.on('message', async (msg) => {
  // SUPER ADMIN COMMANDS (Allow fromMe for admin commands)
  if (msg.body.startsWith('!') && msg.from.replace('@c.us', '') === config.security.superAdminPhone.replace('62', '')) {
    const commandResult = await botUpdateManager.handleUpdateCommand(msg.body, msg.from);
    const responseMsg = commandResult.success 
      ? commandResult.message 
      : `❌ Error: ${commandResult.error}`;
    
    await msg.reply(responseMsg);
    logger.info('🔒 Super Admin Command Executed', { 
      command: msg.body.slice(0, 50), 
      from: msg.from, 
      result: commandResult.success 
    });
    return;
  }

  if (msg.fromMe) return;

  const chatId = msg.from;
  const body = msg.body;
  
  if (isIgnoredMessage(body)) {
    logger.info('Ignored rate limit warning', { from: chatId });
    return;
  }

  logger.info('Message received', { from: chatId, length: body.length, role: rbacManager.getUserRole(chatId) });

  // GROUP HANDLING
  if (msg.isGroupMsg) {
    if (msg.body.includes('@') || msg.mentionedIds) {
      await msg.reply('Baik, terimakasih informasinya. Mohon ditunggu, Alwis akan membalas pesan kembali terimakasih.');
      logger.info('Group mention reply', { group: chatId });
    }
    return;
  }

  // PRIVATE CHAT HANDLING
  if (!checkRateLimit(chatId)) {
    await msg.reply('Maaf, Anda mencapai batas pesan. Coba lagi nanti.');
    logger.warn('Rate limit hit', { from: chatId });
    return;
  }

  try {
    // Initialize history for first private message
    if (!enhancedHistory.conversationHistory.has(chatId)) {
      enhancedHistory.conversationHistory.set(chatId, []);
      logger.info('First private message received, starting new conversation', { from: chatId });
    }

    // Check if it's a system command
    if (body.startsWith('/')) {
      // Try optimization commands first
      let optimizationCmdResponse = await handleOptimizationCommands(chatId, body);
      if (optimizationCmdResponse) {
        await msg.reply(optimizationCmdResponse);
        performanceMonitor.recordResponse(`opt_cmd_${Date.now()}`, 200, 10, optimizationCmdResponse.length);
        return;
      }

      // Then try special commands
      const specialCmdResponse = await handleSpecialCommands(chatId, body, client);
      if (specialCmdResponse) {
        await msg.reply(specialCmdResponse);
        securityManager.logSuccessfulAccess(chatId, 'view_help');
        return;
      }

      // Finally try system commands
      const systemCmdResponse = await processSystemCommand(chatId, body, client);
      if (systemCmdResponse) {
        await msg.reply(systemCmdResponse);
        enhancedHistory.addMessage(chatId, 'user', body);
        enhancedHistory.addMessage(chatId, 'assistant', systemCmdResponse);
        return;
      }
    }

    // Add user message to enhanced history
    enhancedHistory.addMessage(chatId, 'user', body);

    // Get AI enhancement context for better responses
    const enhancementContext = await aiEnhancementEngine.processMessageWithEnhancement(
      chatId,
      body,
      enhancedHistory.conversationHistory.get(chatId) || []
    );
    
    // Generate enhanced system prompt
    const enhancedSystemPrompt = aiEnhancementEngine.generateSystemPrompt(chatId, enhancementContext);
    
    logger.info('🧠 AI Enhancement applied', { 
      user: chatId, 
      language: enhancementContext.detectedLanguage,
      sentiment: enhancementContext.sentimentAnalysis.sentiment,
      topics: enhancementContext.topicClassification,
      userLevel: enhancementContext.adaptiveContext.userLevel
    });

    // Queue message for optimized processing if message queue is enabled
    if (config.optimization.messageQueue.enabled) {
      messageQueue.enqueue(body, 5, { chatId, msg });
      messageQueue.processQueue(processQueuedMessage).catch(err => {
        logger.error('Queue execution failed', { error: err.message });
      });
      return;
    }

    // Get optimized AI response with all enhancements
    const response = await handleOptimizedMessage(body, chatId, client, enhancedSystemPrompt);

    // Update learning from this interaction
    if (response) {
      aiEnhancementEngine.updateFromInteraction(chatId, body, response, null);
    }

    // Suppress rate limit replies
    if (response && response.trim().toLowerCase().includes('⚠️ api rate limit')) {
      logger.info('Suppressed rate limit response', { from: chatId });
      return;
    }

    // Send response
    await msg.reply(response);

    // Add bot response to enhanced history
    enhancedHistory.addMessage(chatId, 'assistant', response);

    enhancedHistory.saveHistory();
    logger.info('Response sent', { from: chatId, responseLength: response.length });
  } catch (error) {
    logger.error('Error processing message', { from: chatId, error: error.message });
    
    // Record error for monitoring
    performanceMonitor.recordError(`msg_${Date.now()}`, error.name || 'ProcessingError', error.message);
    reliabilityManager.recordFailure('message_processing', error);
    
    // Check for service degradation
    const metrics = performanceMonitor.getErrorMetrics();
    if (metrics.errorRate > config.optimization.gracefulDegradation.degradeErrorRateThreshold) {
      gracefulDegradation.handleDegradation({
        errorRate: metrics.errorRate,
        reason: 'High error rate detected'
      });
    }
    
    // Use graceful fallback response
    const fallbackResponse = gracefulDegradation.getFallbackResponse(error.code || 'processing_error');
    await msg.reply(fallbackResponse);
  }
});

client.on('auth_failure', (msg) => {
  logger.error('❌ Authentication failure', { error: msg });
  
  if (authHelper) {
    authHelper.handleAuthFailure(new Error(msg));
  }
  
  logger.info('💡 Troubleshooting:');
  logger.info('1. Check your internet connection');
  logger.info('2. Make sure WhatsApp is active on the device');
  logger.info('3. Try clearing auth files and restart');
  logger.info('4. For manual auth: Visit https://web.whatsapp.com/ in your browser');
});

client.on('disconnected', (reason) => {
  logger.warn('⚠️  Client was disconnected', { reason });
  logger.info('⏳ Attempting to restart in 5 seconds...');
  setTimeout(() => {
    client.initialize();
  }, 5000);
});

// ============= PERIODIC MAINTENANCE =============
// Clear expired approvals every hour
setInterval(() => {
  securityManager.clearExpiredApprovals();
}, 60 * 60 * 1000);

// Auto-save every 5 minutes
setInterval(() => {
  enhancedHistory.saveHistory();
  if (userStats.size > 0) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(Object.fromEntries(userStats), null, 2));
  }
  logger.debug('Auto-save completed');
}, 5 * 60 * 1000);

// Auto-backup every hour
setInterval(() => {
  if (config.features.autoBackup) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = './backups';
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      fs.copyFileSync(HISTORY_FILE, path.join(backupDir, `history-${timestamp}.json`));
      logger.info('Backup created', { timestamp });
    } catch (err) {
      logger.error('Backup failed', { error: err.message });
    }
  }
}, 60 * 60 * 1000);

// Optimization: Export metrics and health dashboard every 10 minutes
setInterval(() => {
  try {
    const dashboard = performanceMonitor.getDashboard();
    const metricsFile = './logs/metrics-' + new Date().toISOString().split('T')[0] + '.json';
    
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs', { recursive: true });
    }
    
    fs.appendFileSync(metricsFile, JSON.stringify(dashboard) + '\n');
    logger.debug('Metrics exported', { file: metricsFile });
  } catch (err) {
    logger.error('Metrics export failed', { error: err.message });
  }
}, 10 * 60 * 1000);

// Optimization: Check for graceful degradation recovery every 5 minutes
setInterval(() => {
  try {
    const recovered = gracefulDegradation.attemptRecovery();
    if (recovered) {
      const newLevel = gracefulDegradation.getStatus().currentLevel;
      logger.info('System recovered from degradation', { level: newLevel });
    }
  } catch (err) {
    logger.error('Recovery check failed', { error: err.message });
  }
}, 5 * 60 * 1000);

// Optimization: Clear old performance metrics every 2 hours
setInterval(() => {
  try {
    performanceMonitor.clearOldMetrics(24); // Keep last 24 hours
    logger.debug('Old metrics cleared');
  } catch (err) {
    logger.error('Metrics cleanup failed', { error: err.message });
  }
}, 2 * 60 * 60 * 1000);

// Optimization: Process queued messages every 30 seconds
setInterval(() => {
  try {
    if (config.optimization.messageQueue.enabled) {
      messageQueue.processQueue(processQueuedMessage).catch(err => {
        logger.error('Queue processing failed', { error: err.message });
      });
    }
  } catch (err) {
    logger.error('Queue processing failed', { error: err.message });
  }
}, 30 * 1000);

// ===== ADVANCED MAINTENANCE TASKS =====
// Advanced: Health diagnostics every 1 hour
setInterval(async () => {
  try {
    if (selfHealing) {
      const managers = {
        reliabilityManager,
        aiOptimizer,
        messageQueue,
        performanceMonitor,
        gracefulDegradation
      };
      const diagnostics = await selfHealing.runDiagnostics(managers);
      const issues = selfHealing.identifyIssues(diagnostics);
      
      if (issues.length > 0) {
        logger.warn('Health check detected issues', { count: issues.length });
        for (const issue of issues) {
          await selfHealing.attemptRecovery(issue, managers);
        }
      }
    }
  } catch (err) {
    logger.error('Health diagnostics failed', { error: err.message });
  }
}, 60 * 60 * 1000);

// Advanced: Analytics event collection every 5 minutes
setInterval(() => {
  try {
    if (advancedAnalytics) {
      advancedAnalytics.recordEvent('maintenance', {
        performanceScore: performanceMonitor?.getSystemHealth()?.cpu || 0,
        timestamp: Date.now()
      });
    }
  } catch (err) {
    logger.error('Analytics collection failed', { error: err.message });
  }
}, 5 * 60 * 1000);

// Advanced: Predictive optimization analysis every 2 hours
setInterval(() => {
  try {
    if (predictiveOptimizer && enhancedHistory) {
      const sampleUserId = Array.from(enhancedHistory.conversationHistory.keys())[0];
      if (sampleUserId) {
        const history = enhancedHistory.conversationHistory.get(sampleUserId);
        if (history && history.length > 0) {
          predictiveOptimizer.analyzeUserBehavior(sampleUserId, history);
          logger.debug('Predictive analysis completed', { userId: sampleUserId });
        }
      }
    }
  } catch (err) {
    logger.error('Predictive analysis failed', { error: err.message });
  }
}, 2 * 60 * 60 * 1000);

// Advanced: Cost report generation every 6 hours
setInterval(() => {
  try {
    if (costOptimizer) {
      const report = costOptimizer.exportReport();
      logger.info('Cost report generated', { 
        monthCost: report.summary.monthlyCost,
        utilization: report.summary.budgetUtilization
      });
    }
  } catch (err) {
    logger.error('Cost report generation failed', { error: err.message });
  }
}, 6 * 60 * 60 * 1000);

// Advanced: Self-healing maintenance every 3 hours
setInterval(async () => {
  try {
    if (selfHealing) {
      const managers = {
        aiOptimizer,
        messageQueue,
        performanceMonitor
      };
      const executed = await selfHealing.executeDueTasks(managers);
      if (executed.length > 0) {
        logger.info('Maintenance tasks executed', { tasks: executed });
      }
    }
  } catch (err) {
    logger.error('Maintenance execution failed', { error: err.message });
  }
}, 3 * 60 * 60 * 1000);

// ============= STARTUP =============
logger.info('🤖 Starting Jarvis Bot Enhanced...');
logger.info('Config loaded', { model: config.openai.model, owner: config.bot.owner });
logger.info('🔐 Security Features Enabled', { 
  rbac: true, 
  approvalWorkflow: config.security.enableApprovalWorkflow,
  fileOperations: config.security.enableFileOperations,
  enhancedHistory: config.features.enhancedHistory
});

initializeAllManagers();
enhancedHistory.loadHistory();
loadStats();

client.initialize().catch(err => {
  logger.error('❌ FAILED TO START BOT', { 
    error: err.message,
    stack: err.stack,
    cause: err.cause ? err.cause.message : 'Unknown'
  });
  console.error('\n🔴 BOT STARTUP ERROR DETAILS:');
  console.error(err);
  process.exit(1);
});

// Timeout watchdog - if bot doesn't connect after 5 minutes, log warning
const timeoutWatchdog = setTimeout(() => {
  if (!authPromptShown) {
    logger.warn('⚠️ WARNING: Bot initialization taking longer than 5 minutes', {
      action: 'You may need to restart the bot if it stays stuck',
      check: 'Verify internet connection and WhatsApp Web availability'
    });
  }
}, 5 * 60 * 1000); // 5 minutes

// Debug: Log initialization progress
let initStarted = Date.now();
let authPromptShown = false;

const initDebugInterval = setInterval(() => {
  const elapsed = Math.floor((Date.now() - initStarted) / 1000);
  if (elapsed === 15 && !authPromptShown) {
    logger.info('⏳ Still connecting to WhatsApp Web... (15s elapsed)', { 
      protocolTimeout: '240s',
      checking: 'Browser startup'
    });
  }
  if (elapsed === 30 && !authPromptShown) {
    logger.info('⏳ Connection in progress... (30s elapsed)', { 
      checking: 'WhatsApp Web response'
    });
  }
  if (elapsed === 60 && !authPromptShown) {
    logger.warn('⚠️ Connection taking longer than expected (60s)', {
      tip: 'Check internet connection or restart if stuck'
    });
  }
}, 5000);

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  enhancedHistory.saveHistory();
  fs.writeFileSync(STATS_FILE, JSON.stringify(Object.fromEntries(userStats), null, 2));
  logger.info('Shutdown complete');
  process.exit(0);
});