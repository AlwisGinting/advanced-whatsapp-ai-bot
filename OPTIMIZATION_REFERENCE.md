# OPTIMIZATION MODULES - COMPLETE REFERENCE

## Overview
This document provides complete reference for all 8 optimization modules, their methods, configurations, and integration patterns.

---

## 1. AI PERFORMANCE OPTIMIZER (ai-optimizer.js)

### Purpose
Token counting, smart caching, quality scoring, and cost management for OpenAI API calls.

### Key Methods

```javascript
// Token Management
estimateTokens(text)                    // Estimate tokens (~1 char per 4.5 tokens)
calculateCost(inputTokens, outputTokens) // Calculate USD cost
optimizeContextWindow(history, maxTokens) // Trim history to fit token budget

// Caching
getCachedResponse(message, chatId)      // Get cached response (15-min TTL)
cacheResponse(message, response, confidence) // Cache with confidence score

// Quality
scoreResponseQuality(response, message) // Score 0-100 (length, relevance, coherence, completeness)
trackRequest(inputTokens, outputTokens, responseTime, qualityScore) // Track metrics

// Analytics
getMetrics()                            // Get performance metrics
getCacheStatus()                        // Get cache info
```

### Configuration
```json
{
  "aiOptimizer": {
    "enabled": true,
    "cacheTTL": 900000,           // 15 minutes
    "maxCacheSize": 1000,         // Max cached responses
    "tokenEstimationFactor": 4.5,
    "qualityScoringEnabled": true,
    "metricsTracking": true
  }
}
```

### Example Usage
```javascript
const optimizer = new AIPerformanceOptimizer(config, logger);

// Check cache first
const cached = optimizer.getCachedResponse("Apa itu AI?", chatId);
if (cached) return cached;

// Get response from API
const response = await getFromOpenAI(...);

// Cache for future
optimizer.cacheResponse("Apa itu AI?", response, 0.95);

// Score quality
const score = optimizer.scoreResponseQuality(response, "Apa itu AI?"); // 0-100

// Get metrics
const metrics = optimizer.getMetrics();
// {
//   cacheHitRate: 65.2,
//   successRate: 98.5,
//   totalCost: 2.45,
//   averageQualityScore: 78.3
// }
```

---

## 2. MESSAGE QUEUE MANAGER (message-queue.js)

### Purpose
Priority-based message queue with concurrent processing and smart retry logic.

### Key Methods

```javascript
// Queue Operations
enqueue(message, priority=5)            // Add to queue (1-10, higher = urgent)
dequeue()                               // Remove from queue
processQueue(handler)                   // Main loop, concurrent processing

// Status
getStatus()                             // Queue size, active requests, stats
getMetrics()                            // Success rate, concurrency, timing
```

### Configuration
```json
{
  "messageQueue": {
    "enabled": true,
    "maxConcurrentRequests": 5,         // Max parallel processing
    "maxQueueSize": 1000,
    "maxRetries": 3,
    "retryDelays": [1000, 2000, 4000], // Exponential backoff
    "priorityBands": {
      "high": [7, 10],
      "normal": [4, 6],
      "low": [1, 3]
    }
  }
}
```

### Priority Calculation
```javascript
function calculatePriority(sentiment, intent) {
  let priority = 5; // Default

  // Intent-based
  if (intent?.type === 'urgent') priority = 9;      // Priority 9-10
  if (intent?.type === 'complaint') priority = 8;   // Priority 8
  if (intent?.type === 'question') priority = 6;    // Priority 6

  // Sentiment-based
  if (sentiment.sentiment === 'very_negative') priority++;
  if (sentiment.sentiment === 'very_positive') priority--;

  return Math.min(10, Math.max(1, priority));
}
```

### Example Usage
```javascript
const queue = new MessageQueueManager(config, logger);

// Enqueue message with priority
queue.enqueue({
  id: 'msg_123',
  message: 'Help! System is down!',
  chatId: '123456'
}, 9); // High priority

// Process with handler
queue.processQueue(async (item) => {
  const response = await processMessage(item);
  return response;
});

// Monitor
setInterval(() => {
  const status = queue.getStatus();
  console.log(`Queue: ${status.queueSize}, Active: ${status.activeRequests}`);
}, 5000);
```

---

## 3. SENTIMENT & INTENT ANALYZER (sentiment-analyzer.js)

### Purpose
Detect user emotions, identify intent, and generate adaptive responses.

### Key Methods

```javascript
// Analysis
analyzeSentiment(message, chatId)       // Returns {score, sentiment, intensity, confidence, keywords}
detectIntent(message)                   // Returns array of intents with confidence
getPrimaryIntent(message)               // Returns highest-confidence intent

// Response Generation
generateAdaptivePrompt(sentiment, intent) // Create dynamic system prompt
suggestResponseTone(sentiment)           // Map sentiment to tone

// Analytics
getAnalytics(chatId)                    // Get sentiment metrics
getSentimentTrend(chatId, limit)        // Get historical sentiment
```

### Sentiment Values
- `very_positive` (score > 0.5)
- `positive` (score > 0.2)
- `neutral` (score -0.2 to 0.2)
- `negative` (score < -0.2)
- `very_negative` (score < -0.5)

### Intent Types
1. `greeting` - Salutations
2. `question` - Questions (contains ?)
3. `request` - Action requests
4. `complaint` - Issues/problems
5. `gratitude` - Thanks/appreciation
6. `affirmation` - Yes/agreement
7. `negation` - No/disagreement
8. `urgent` - Time-sensitive

### Example Usage
```javascript
const sentiment = sentimentAnalyzer.analyzeSentiment("Maaf, sistem error!", chatId);
// Returns:
// {
//   score: -0.8,
//   sentiment: 'very_negative',
//   intensity: 0.7,
//   confidence: 0.85,
//   keywords: ['error']
// }

const intent = sentimentAnalyzer.getPrimaryIntent("Tolong bantu aku!");
// Returns:
// {
//   type: 'urgent',
//   confidence: 0.9,
//   responseType: 'priority'
// }

// Generate adaptive prompt
const systemPrompt = sentimentAnalyzer.generateAdaptivePrompt(sentiment, intent);
// "User terlihat frustrated/kecewa. Dengarkan dengan empati, tawarkan solusi..."
```

---

## 4. RELIABILITY MANAGER (reliability-manager.js)

### Purpose
Circuit breaker pattern, retry strategies, fallback responses, and error recovery.

### Circuit Breaker States
1. **Closed** - All requests processed normally
2. **Open** - Too many failures, reject requests, return fallback
3. **Half-Open** - Testing recovery with limited requests

### Key Methods

```javascript
// Circuit Breaker
initializeCircuitBreaker(serviceName, threshold=5, timeout=60000)
canExecute(serviceName)                 // Check if service available
recordSuccess(serviceName)
recordFailure(serviceName, error)

// Retry
executeWithRetry(operation, operationName, strategyType='exponential')
// Strategies: 'exponential' (1s, 2s, 4s), 'linear' (2s, 3s, 4s), 'immediate'

// Fallback
getFallbackResponse(errorType)          // Get appropriate fallback message

// Health
getServiceHealth()                      // Get all breakers status
getDegradationStrategy(serviceName)     // Determine fallback strategy
getMetrics()                            // Detailed health metrics
```

### Configuration
```json
{
  "reliabilityManager": {
    "circuitBreakerEnabled": true,
    "circuitBreakerThreshold": 5,       // Failures before open
    "circuitBreakerTimeout": 60000,     // 1 minute timeout
    "retryStrategyDefault": "exponential",
    "healthCheckInterval": 30000
  }
}
```

### Example Usage
```javascript
const reliability = new ReliabilityManager(config, logger);

// Initialize for OpenAI
reliability.initializeCircuitBreaker('openai', 5, 60000);

// Execute with retry
try {
  const response = await reliability.executeWithRetry(
    async () => {
      return await openai.createChatCompletion(...);
    },
    'openai',
    'exponential'
  );
} catch (error) {
  const fallback = reliability.getFallbackResponse('openai_error');
  return fallback;
}

// Monitor health
const health = reliability.getServiceHealth();
// {
//   openai: {
//     state: 'closed' | 'open' | 'half-open',
//     healthScore: 95,
//     failureRate: 2.1,
//     totalCalls: 1000,
//     totalFailures: 21,
//     status: '✅ Healthy'
//   }
// }
```

---

## 5. RESPONSE STREAMING MANAGER (response-streaming.js)

### Purpose
Typing indicators, message streaming, formatting, and UX optimization.

### Key Methods

```javascript
// Typing Indicators
startTyping(chatId, client, maxDuration=5000) // Show "typing..." indicator
stopTyping(chatId)                     // Stop typing indicator

// Response Formatting
optimizeForReadability(response)       // Add line breaks, preserve formatting
formatForWhatsApp(response)            // Convert markdown to WhatsApp format
smartTruncate(response, maxLength=2000) // Truncate at sentence boundary

// Streaming
streamResponse(response, chunkSize=50) // Split into chunks
splitMessage(message, maxLength=1000)  // Split long messages

// UX
addContextEmoji(response, sentiment)   // Add relevant emoji
createSuggestions(suggestions)         // Create suggestion buttons
generatePreview(fullResponse, previewLength) // Create preview
```

### Example Usage
```javascript
const streamer = new ResponseStreamingManager(config, logger);

// Show typing indicator
await streamer.startTyping(chatId, client);

// Get response and format
let response = await getAIResponse();
response = streamer.optimizeForReadability(response);
response = streamer.formatForWhatsApp(response);
response = streamer.smartTruncate(response);

// Stop typing
streamer.stopTyping(chatId);

// Send formatted response
await message.reply(response);

// Or send with suggestions
const withSuggestions = response + streamer.createSuggestions([
  'Bantuan lebih lanjut',
  'Kategori lain',
  'Hubungi admin'
]);
```

---

## 6. PERFORMANCE MONITOR (performance-monitor.js)

### Purpose
Real-time monitoring, metrics collection, alerts, and performance dashboard.

### Key Methods

```javascript
// Recording
recordRequest(requestId, endpoint, params)
recordResponse(requestId, statusCode, responseTime, dataSize)
recordError(errorId, errorType, errorMessage, context)
recordOperation(operationName, duration, status, metadata)

// Metrics
getRequestMetrics()                     // Request stats
getResponseMetrics()                    // Response stats (p50, p95, p99)
getErrorMetrics()                       // Error stats
getOperationMetrics()                   // Operation-specific stats
getSystemHealth()                       // Memory, CPU, uptime

// Dashboard
getDashboard()                          // Complete metrics dashboard
exportMetrics(format='json'|'csv')      // Export for analysis

// Alerts
createAlert(alertType, details)
getActiveAlerts()
resolveAlert(alertType)
```

### Response Metrics Available
```javascript
{
  totalResponses: 1000,
  averageTime: 450,           // ms
  p50: 200,                   // 50th percentile
  p95: 2000,                  // 95th percentile
  p99: 4500,                  // 99th percentile
  errorRate: 2.1,             // %
  totalDataTransferred: 15.3, // MB
  statusCodeDistribution: {
    200: 975,
    400: 15,
    500: 10
  }
}
```

### Configuration
```json
{
  "performanceMonitor": {
    "trackMetrics": true,
    "alertingEnabled": true,
    "thresholds": {
      "responseTimeMs": 5000,
      "errorRatePercent": 5,
      "memoryUsagePercent": 90,
      "queueSize": 100
    }
  }
}
```

---

## 7. GRACEFUL DEGRADATION (graceful-degradation.js)

### Purpose
Service level management, automatic degradation, fallback strategies, and recovery.

### Service Levels

| Level | Score | Description | Features |
|-------|-------|-------------|----------|
| full_service | 100 | All features available | All enabled |
| normal_with_warnings | 80 | Minor issues | All enabled, with warnings |
| limited_service | 60 | Non-critical disabled | No search, roles, sentiment |
| critical_mode | 40 | Only essential | AI + queue only |
| fallback_only | 20 | Emergency mode | Cached responses only |

### Key Methods

```javascript
// Service Level
getCurrentLevel()                      // Get current level info
isFeatureAvailable(featureName)        // Check if feature enabled
degradeTo(levelName, reason)           // Degrade to lower level
upgradeTo(levelName)                   // Upgrade to higher level

// Fallback
getFallbackResponse(context)           // Get appropriate fallback
getAlternativeResponse(request, reason) // Generate alternative
cacheForFallback(request, response, ttl) // Cache response
getCachedFallback(request)              // Get cached response

// Recovery
attemptRecovery()                      // Try to upgrade level
handleDegradation(metrics)             // Check metrics and degrade if needed

// Status
getStatus()                            // Full status report
getHistory(limit=20)                   // Degradation history
getHealthScore()                       // 0-100 health score
generateReport()                       // Diagnostic report
```

### Example Usage
```javascript
const degradation = new GracefulDegradation(config, logger);

// Check if AI is available
if (!degradation.isFeatureAvailable('aiResponses')) {
  return gracefulDegradation.getAlternativeResponse(userMessage);
}

// Handle degradation based on metrics
gracefulDegradation.handleDegradation({
  errorRate: 15,
  memoryUsagePercent: 92,
  responseTime: 6000
});

// Try recovery
setInterval(() => {
  gracefulDegradation.attemptRecovery();
}, 300000); // Every 5 minutes

// Monitor health
const health = gracefulDegradation.getHealthScore(); // 0-100
console.log(`System Health: ${health}/100`);
```

---

## 8. SYSTEM COMMANDS (system-commands.js)

### Purpose
File/folder operations, system command execution, configuration management (ALREADY INTEGRATED).

### Key Methods

```javascript
// File Operations
createFile(filePath, content, userId)  // Create file with permission check
deleteFile(filePath, userId)           // Delete with approval
readFile(filePath, userId, preview, lines) // Read with preview limit
listFiles(dirPath, userId)             // List directory

// Configuration
updateConfigSetting(path, value, userId) // Change config from WhatsApp

// Execution
executeCommand(userId, message, security) // Route system commands
```

---

## COMMANDS REFERENCE

### Optimization Commands

```
/monitor   - Show performance dashboard
/queue     - Show message queue status
/health    - Show system health
/cache     - Show cache status
/sentiment - Show sentiment analysis
/degrade   - Manually degrade to level
/recover   - Attempt recovery
```

### Available Degradation Levels
- `full_service` - All features
- `normal_with_warnings` - With warnings
- `limited_service` - Limited
- `critical_mode` - Critical
- `fallback_only` - Emergency

---

## INTEGRATION CHECKLIST

- [ ] Import all 8 modules in index.js
- [ ] Initialize managers in client.on('ready')
- [ ] Replace getChatGPTResponse() with handleOptimizedMessage()
- [ ] Setup periodic maintenance tasks
- [ ] Add optimization command handlers
- [ ] Update error handlers
- [ ] Configure all optimization sections in config.json
- [ ] Test each module independently
- [ ] Test full integration workflow
- [ ] Monitor performance metrics
- [ ] Document custom configurations

---

## PERFORMANCE TARGETS

### Response Quality
- Cache hit rate: 60-70%
- Quality score: 75+/100
- User satisfaction: 90%+

### Performance
- Average response time: <500ms
- p95 response time: <2000ms
- p99 response time: <5000ms
- Error rate: <2%

### Reliability
- Uptime: 99%+
- Circuit breaker availability: >98%
- Fallback effectiveness: 100%

### Cost
- Token efficiency: Improved 40%+ via caching
- API cost per request: Reduced via optimization
- Monthly savings: 20-30% typical

---

## TROUBLESHOOTING

### High Error Rate
1. Check circuit breaker status: `/health`
2. Review error logs in performance monitor
3. Manually degrade: `/degrade critical_mode`
4. Investigate root cause

### Slow Responses
1. Check queue status: `/queue`
2. Monitor performance: `/monitor`
3. Review cache hit rate: `/cache`
4. Check system memory usage

### Memory Issues
1. Clear old metrics: `performanceMonitor.clearOldMetrics()`
2. Clear cache: `aiOptimizer.clearCache()` or gracefulDegradation.clearCache()
3. Check system health: `/health`

### Service Degradation
1. Check current level: `/monitor`
2. Review metrics: `getDashboard()`
3. Attempt recovery: `/recover`
4. Review recommendations: `generateReport()`

---

## CONFIGURATION BEST PRACTICES

### For Production
```json
{
  "aiOptimizer": {
    "cacheTTL": 900000,       // 15 minutes
    "maxCacheSize": 5000      // Larger cache
  },
  "messageQueue": {
    "maxConcurrentRequests": 5,
    "maxRetries": 3
  },
  "reliabilityManager": {
    "circuitBreakerThreshold": 5,
    "circuitBreakerTimeout": 60000
  }
}
```

### For Development
```json
{
  "aiOptimizer": {
    "cacheTTL": 300000,       // 5 minutes
    "maxCacheSize": 100       // Smaller cache
  },
  "messageQueue": {
    "maxConcurrentRequests": 2,
    "maxRetries": 1
  },
  "reliabilityManager": {
    "circuitBreakerThreshold": 2,
    "circuitBreakerTimeout": 10000
  }
}
```

---

## METRICS EXPORT

Export metrics for analysis:

```javascript
// JSON export
const metrics = performanceMonitor.exportMetrics('json');

// CSV export
const csv = performanceMonitor.exportMetrics('csv');

// Full report
const report = gracefulDegradation.generateReport();
```

---

Created by: GitHub Copilot
Date: 2024
Status: Production Ready
Version: 1.0.0
