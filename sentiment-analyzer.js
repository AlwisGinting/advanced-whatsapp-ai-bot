/**
 * Sentiment & Intent Analyzer
 * Analyzes user emotions, intentions, and conversation context
 */
class SentimentIntentAnalyzer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.sentimentHistory = new Map();
    this.intentPatterns = this.initializeIntentPatterns();
    this.emotionalKeywords = this.initializeEmotionalKeywords();
  }

  /**
   * Initialize intent patterns
   */
  initializeIntentPatterns() {
    return {
      greeting: {
        patterns: /^(halo|hi|hello|pagi|sore|malam|assalamualaikum|hey|greetings)/i,
        confidence: 0.9,
        responseType: 'greeting'
      },
      question: {
        patterns: /(\?|apa|berapa|bagaimana|siapa|kapan|dimana|kenapa|gimana|kok)/i,
        confidence: 0.85,
        responseType: 'informative'
      },
      request: {
        patterns: /(tolong|minta|bisa|buat|buatkan|bikin|ubah|tambah|hapus|delete|remove)/i,
        confidence: 0.8,
        responseType: 'action'
      },
      complaint: {
        patterns: /(error|gagal|rusak|tidak bisa|gak bisa|masalah|problem|issue|bug|error|crash)/i,
        confidence: 0.9,
        responseType: 'support'
      },
      gratitude: {
        patterns: /(terima kasih|makasih|thanks|thank you|appreciation|syukur)/i,
        confidence: 0.95,
        responseType: 'acknowledgement'
      },
      affirmation: {
        patterns: /(ya|iya|yes|setuju|agreed|okay|ok|bagus|good|great|excellent)/i,
        confidence: 0.85,
        responseType: 'confirmation'
      },
      negation: {
        patterns: /(tidak|gak|nggak|no|nope|tidak setuju|disagree|jangan|stop)/i,
        confidence: 0.85,
        responseType: 'rejection'
      },
      urgent: {
        patterns: /(segera|urgent|cepat|asap|immediately|emergency|darurat|emergency|penting)/i,
        confidence: 0.9,
        responseType: 'priority'
      }
    };
  }

  /**
   * Initialize emotional keywords
   */
  initializeEmotionalKeywords() {
    return {
      positive: {
        keywords: ['bagus', 'baik', 'great', 'excellent', 'fantastic', 'amazing', 'senang', 'bahagia', 'puas', 'gembira', 'asyik'],
        weight: 1.0
      },
      negative: {
        keywords: ['buruk', 'jelek', 'terrible', 'bad', 'worst', 'marah', 'sedih', 'kecewa', 'frustrated', 'angry', 'upset'],
        weight: -1.0
      },
      neutral: {
        keywords: ['baik-baik saja', 'normal', 'okay', 'alright', 'standard'],
        weight: 0
      },
      anxious: {
        keywords: ['cemas', 'khawatir', 'nervous', 'worried', 'anxious', 'takut', 'grogi'],
        weight: -0.6
      },
      excited: {
        keywords: ['excited', 'thrilled', 'antusias', 'semangat', 'eager', 'enthusiastic'],
        weight: 0.8
      }
    };
  }

  /**
   * Analyze sentiment of message
   */
  analyzeSentiment(message, chatId) {
    let score = 0;
    let weights = 0;
    const lowerMsg = message.toLowerCase();

    // Check emotional keywords
    for (const [emotion, data] of Object.entries(this.emotionalKeywords)) {
      for (const keyword of data.keywords) {
        if (lowerMsg.includes(keyword)) {
          score += data.weight;
          weights++;
        }
      }
    }

    // Normalize score
    const normalizedScore = weights > 0 ? score / weights : 0;

    // Determine sentiment
    let sentiment;
    if (normalizedScore > 0.5) sentiment = 'very_positive';
    else if (normalizedScore > 0.2) sentiment = 'positive';
    else if (normalizedScore > -0.2) sentiment = 'neutral';
    else if (normalizedScore > -0.5) sentiment = 'negative';
    else sentiment = 'very_negative';

    // Check intensity markers
    const intensity = this.analyzeIntensity(message);

    const result = {
      score: Math.round(normalizedScore * 100) / 100,
      sentiment,
      intensity,
      confidence: Math.min(1, weights / 5),
      keywords: this.extractEmotionalKeywords(message),
      timestamp: new Date().toISOString()
    };

    // Store in history
    this.sentimentHistory.set(chatId, result);

    return result;
  }

  /**
   * Analyze message intensity (exclamation, caps, etc)
   */
  analyzeIntensity(message) {
    let intensity = 0;

    // Multiple exclamation marks
    const exclamations = (message.match(/!/g) || []).length;
    intensity += Math.min(exclamations / 3, 0.3);

    // CAPS LOCK
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.5) intensity += 0.3;

    // Question marks
    const questions = (message.match(/\?/g) || []).length;
    intensity += Math.min(questions / 3, 0.2);

    // Repeated characters
    if (/(.)\1{2,}/.test(message)) intensity += 0.2;

    return Math.min(1, intensity);
  }

  /**
   * Extract emotional keywords from message
   */
  extractEmotionalKeywords(message) {
    const keywords = [];
    const lowerMsg = message.toLowerCase();

    for (const emotion of Object.values(this.emotionalKeywords)) {
      for (const keyword of emotion.keywords) {
        if (lowerMsg.includes(keyword)) {
          keywords.push(keyword);
        }
      }
    }

    return [...new Set(keywords)];
  }

  /**
   * Detect user intent
   */
  detectIntent(message) {
    const intents = [];

    for (const [intentType, config] of Object.entries(this.intentPatterns)) {
      if (config.patterns.test(message)) {
        intents.push({
          type: intentType,
          confidence: config.confidence,
          responseType: config.responseType
        });
      }
    }

    // Sort by confidence
    intents.sort((a, b) => b.confidence - a.confidence);

    return intents;
  }

  /**
   * Get primary intent
   */
  getPrimaryIntent(message) {
    const intents = this.detectIntent(message);
    return intents.length > 0 ? intents[0] : null;
  }

  /**
   * Generate adaptive system prompt based on sentiment
   */
  generateAdaptivePrompt(sentiment, intent) {
    let prompt = 'Kamu Jarvis, AI bot Alwis di WhatsApp.\n';

    // Adapt based on sentiment
    if (sentiment.sentiment === 'very_positive') {
      prompt += 'User dalam mood sangat baik. Responnya juga positif dan enthusiastik.\n';
    } else if (sentiment.sentiment === 'positive') {
      prompt += 'User dalam mood baik. Berikan respons yang friendly dan helpful.\n';
    } else if (sentiment.sentiment === 'negative' || sentiment.sentiment === 'very_negative') {
      prompt += 'User terlihat frustrated/kecewa. Berikan respons yang empathetic dan helpful.\n';
    } else if (sentiment.sentiment === 'neutral') {
      prompt += 'User dalam mood netral. Berikan respons yang professional dan informatif.\n';
    }

    // Adapt based on intent
    if (intent) {
      switch (intent.type) {
        case 'complaint':
          prompt += 'User melakukan complaint. Dengarkan dengan empati, tawarkan solusi.\n';
          break;
        case 'request':
          prompt += 'User membuat request. Berikan instruksi yang jelas dan helpful.\n';
          break;
        case 'question':
          prompt += 'User bertanya. Berikan jawaban yang detail dan informatif.\n';
          break;
        case 'urgent':
          prompt += 'User terlihat urgent. Berikan respons cepat dan prioritas tinggi.\n';
          break;
        case 'greeting':
          prompt += 'User greeting. Balas dengan ramah dan tanyakan apa yang bisa dibantu.\n';
          break;
      }
    }

    prompt += 'Jawab dalam bahasa yang digunakan user (Indonesia/English). Keepjawaban singkat dan on-point.';
    return prompt;
  }

  /**
   * Get sentiment trend over time
   */
  getSentimentTrend(chatId, limit = 10) {
    // Get from history (simplified version - full version would store all)
    const history = this.sentimentHistory.get(chatId);
    return history ? [history] : [];
  }

  /**
   * Suggest response tone based on sentiment
   */
  suggestResponseTone(sentiment) {
    const toneMap = {
      'very_positive': 'enthusiastic_supportive',
      'positive': 'friendly_helpful',
      'neutral': 'professional_informative',
      'negative': 'empathetic_supportive',
      'very_negative': 'empathetic_urgent'
    };

    return toneMap[sentiment.sentiment] || 'neutral';
  }

  /**
   * Get sentiment analytics
   */
  getAnalytics(chatId) {
    const sentiment = this.sentimentHistory.get(chatId);
    
    return {
      currentSentiment: sentiment?.sentiment || 'unknown',
      score: sentiment?.score || 0,
      intensity: sentiment?.intensity || 0,
      confidence: sentiment?.confidence || 0,
      lastAnalyzed: sentiment?.timestamp || null
    };
  }
}

module.exports = SentimentIntentAnalyzer;
