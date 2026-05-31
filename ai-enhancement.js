/**
 * 🤖 AI ENHANCEMENT MODULE v2.0
 * Advanced AI features: Personality, Context, Adaptive Learning, Multi-language
 */

class AIEnhancementEngine {
  constructor(config = {}) {
    this.config = {
      enablePersonality: config.enablePersonality !== false,
      enableContextMemory: config.enableContextMemory !== false,
      enableAdaptiveLearning: config.enableAdaptiveLearning !== false,
      enableMultiLanguage: config.enableMultiLanguage !== false,
      enableEmotionalIntelligence: config.enableEmotionalIntelligence !== false,
      ...config
    };

    // AI Personality Configuration
    this.personality = {
      name: 'Jarvis',
      role: 'Advanced AI Assistant',
      traits: [
        'helpful',
        'intelligent',
        'respectful',
        'adaptive',
        'proactive',
        'detail-oriented'
      ],
      communication_style: 'professional yet friendly',
      tone: 'balanced and informative',
      language_preference: 'Indonesian (primary), English (secondary)'
    };

    // Context Memory for Conversation Flow
    this.contextMemory = new Map();
    this.userProfiles = new Map();
    this.conversationTopics = new Map();

    // Learning Data
    this.learnedPatterns = [];
    this.commonQuestions = new Map();
    this.userPreferences = new Map();

    // Emotional Intelligence Tracking
    this.sentimentHistory = new Map();
    this.emotionalContext = new Map();

    // Multi-language Support
    this.supportedLanguages = ['id', 'en', 'es', 'fr', 'de', 'ja', 'zh'];
    this.languageDetection = new Map();

    this.log('🚀 AI Enhancement Engine initialized with advanced features');
  }

  /**
   * 🧠 Enhanced Message Processing with Context
   */
  async processMessageWithEnhancement(userId, message, conversationHistory = []) {
    const enhancement = {
      contextHistory: this._buildContextMemory(userId, conversationHistory),
      userProfile: this._getUserProfile(userId),
      detectedLanguage: this._detectLanguage(message),
      sentimentAnalysis: this._analyzeSentiment(message),
      topicClassification: this._classifyTopic(message),
      adaptiveContext: this._buildAdaptiveContext(userId, message),
      personalizationHints: this._generatePersonalizationHints(userId)
    };

    return enhancement;
  }

  /**
   * 📚 Build Context Memory for Coherent Conversations
   */
  _buildContextMemory(userId, conversationHistory) {
    const contextData = {
      previousTopics: [],
      lastMessages: [],
      keyEntities: [],
      resolvedQueries: [],
      unresolved: []
    };

    // Extract last 5 messages for context
    const recentMessages = conversationHistory.slice(-5);
    contextData.lastMessages = recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content.substring(0, 100), // Summary
      timestamp: msg.timestamp
    }));

    // Extract topics
    contextData.previousTopics = this._extractTopics(recentMessages);

    // Extract key entities (names, places, products, etc.)
    contextData.keyEntities = this._extractEntities(conversationHistory);

    // Store in memory
    this.contextMemory.set(userId, contextData);

    return contextData;
  }

  /**
   * 👤 Get or Create User Profile
   */
  _getUserProfile(userId) {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        firstInteraction: new Date(),
        totalMessages: 0,
        preferredLanguage: 'id',
        communicationStyle: 'formal',
        interests: [],
        frequentTopics: [],
        interactionLevel: 'new',
        trustScore: 0.5
      });
    }

    return this.userProfiles.get(userId);
  }

  /**
   * 🌍 Detect User Language
   */
  _detectLanguage(message) {
    const languagePatterns = {
      id: /\b(dan|atau|yang|untuk|dari|dengan|tidak|saya|kami|anda|mereka)\b/gi,
      en: /\b(and|or|the|for|from|with|not|i|we|you|they)\b/gi,
      es: /\b(y|o|el|para|de|con|no|yo|nosotros|usted)\b/gi
    };

    let maxMatches = 0;
    let detectedLanguage = 'en';

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      const matches = (message.match(pattern) || []).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLanguage = lang;
      }
    }

    this.languageDetection.set(Date.now(), { message: message.substring(0, 50), detectedLanguage });
    return detectedLanguage;
  }

  /**
   * 😊 Analyze Sentiment & Emotional Context
   */
  _analyzeSentiment(message) {
    const positiveWords = [
      'bagus', 'baik', 'senang', 'luar biasa', 'sempurna', 'excellent', 'great', 'amazing',
      'terima kasih', 'thanks', 'appreciate', 'love', 'enjoy'
    ];

    const negativeWords = [
      'buruk', 'jelek', 'marah', 'kecewa', 'sedih', 'benci', 'bad', 'terrible', 'hate',
      'frustrating', 'angry', 'disappointed'
    ];

    const neutralWords = ['apa', 'mana', 'bagaimana', 'what', 'where', 'how'];

    const messageLower = message.toLowerCase();
    const positive = positiveWords.filter(w => messageLower.includes(w)).length;
    const negative = negativeWords.filter(w => messageLower.includes(w)).length;
    const neutral = neutralWords.filter(w => messageLower.includes(w)).length;

    let sentiment = 'neutral';
    if (positive > negative) sentiment = 'positive';
    else if (negative > positive) sentiment = 'negative';

    return {
      sentiment,
      intensity: Math.max(positive, negative) / Math.max(message.length / 10, 1),
      emotionalMarkers: { positive, negative, neutral }
    };
  }

  /**
   * 🏷️ Classify Message Topic
   */
  _classifyTopic(message) {
    const topics = {
      technical: /\b(error|bug|crash|system|server|database|code|api|integration)\b/gi,
      billing: /\b(harga|biaya|payment|invoice|charge|subscription|discount)\b/gi,
      support: /\b(bantuan|help|tidak bisa|not working|issue|problem|trouble)\b/gi,
      greeting: /\b(halo|hello|hi|assalamualaikum|pagi|siang|malam|good morning)\b/gi,
      feedback: /\b(feedback|saran|pendapat|opinion|suggest|improvement)\b/gi,
      general: /\b(apa|bagaimana|siapa|kapan|dimana|kenapa)\b/gi
    };

    const detectedTopics = [];
    for (const [topic, pattern] of Object.entries(topics)) {
      if (pattern.test(message)) {
        detectedTopics.push(topic);
      }
    }

    return detectedTopics.length > 0 ? detectedTopics : ['general'];
  }

  /**
   * 🎯 Build Adaptive Context Based on User Behavior
   */
  _buildAdaptiveContext(userId, message) {
    const userProfile = this._getUserProfile(userId);
    userProfile.totalMessages++;

    // Determine interaction level based on message frequency
    if (userProfile.totalMessages < 3) {
      userProfile.interactionLevel = 'new';
    } else if (userProfile.totalMessages < 10) {
      userProfile.interactionLevel = 'growing';
    } else {
      userProfile.interactionLevel = 'established';
    }

    // Build adaptive context
    return {
      userLevel: userProfile.interactionLevel,
      detailLevel: userProfile.interactionLevel === 'new' ? 'basic' : 'detailed',
      responseStyle: userProfile.communicationStyle,
      includeExamples: userProfile.interactionLevel !== 'new',
      includeFollowUp: userProfile.interactionLevel === 'established'
    };
  }

  /**
   * ✨ Generate Personalization Hints for Response
   */
  _generatePersonalizationHints(userId) {
    const userProfile = this._getUserProfile(userId);
    const sentiment = this.sentimentHistory.get(userId) || { sentiment: 'neutral' };

    return {
      personalGreeting: this._generateGreeting(userId),
      useHumor: sentiment.sentiment === 'positive',
      beMoreFormal: userProfile.communicationStyle === 'formal',
      includeEmojis: userProfile.interactionLevel !== 'new',
      anticipateFollowUps: true,
      addTimeContext: true
    };
  }

  /**
   * 👋 Generate Personalized Greeting
   */
  _generateGreeting(userId) {
    const profile = this._getUserProfile(userId);
    const greetings = {
      new: ['Halo! 👋', 'Selamat datang! 🎉', 'Halo, nice to meet you!'],
      growing: ['Hai, kembali lagi! 😊', 'Good to see you again!', 'Apa kabar?'],
      established: ['Sudah lama! Apa yang bisa saya bantu?', 'Welcome back! 🚀', 'Siap membantu!']
    };

    const greetingList = greetings[profile.interactionLevel] || greetings.new;
    return greetingList[Math.floor(Math.random() * greetingList.length)];
  }

  /**
   * 🔍 Extract Topics from Conversation
   */
  _extractTopics(messages) {
    const topics = [];
    for (const msg of messages) {
      const classified = this._classifyTopic(msg.content || '');
      topics.push(...classified);
    }
    return [...new Set(topics)];
  }

  /**
   * 🏢 Extract Named Entities
   */
  _extractEntities(messages) {
    const entities = [];
    const entityPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;

    for (const msg of messages) {
      const content = msg.content || '';
      const found = content.match(entityPattern);
      if (found) entities.push(...found);
    }

    return [...new Set(entities)];
  }

  /**
   * 💬 Generate Enhanced System Prompt
   */
  generateSystemPrompt(userId = 'default', context = {}) {
    const userProfile = this._getUserProfile(userId);
    const adaptiveContext = context.adaptiveContext || {};
    const personalization = context.personalizationHints || {};

    let systemPrompt = `You are ${this.personality.name}, an ${this.personality.role}.

## Your Personality:
- Traits: ${this.personality.traits.join(', ')}
- Communication Style: ${this.personality.communication_style}
- Tone: ${this.personality.tone}
- Language: ${this.personality.language_preference}

## User Context:
- Interaction Level: ${userProfile.interactionLevel}
- Total Interactions: ${userProfile.totalMessages}
- Preferred Language: ${userProfile.preferredLanguage}
- Communication Preference: ${userProfile.communicationStyle}

## Response Guidelines:
- Detail Level: ${adaptiveContext.detailLevel || 'balanced'}
- Include Examples: ${adaptiveContext.includeExamples !== false}
- Include Follow-ups: ${adaptiveContext.includeFollowUp !== false}
- Use Formal Tone: ${personalization.beMoreFormal === true}
- Add Emoji Support: ${personalization.includeEmojis === true}

## Core Behaviors:
1. Always be respectful and helpful
2. Provide accurate, well-researched information
3. Admit when you don't know something
4. Offer to escalate to human support when needed
5. Remember previous context from this conversation
6. Proactively suggest next steps

## Language Instructions:
- Respond in the user's language when possible
- Use clear, simple language for new users
- Use technical language for established users
- Mix languages only when necessary for clarity

Remember: You're here to help, not to replace human judgment.`;

    return systemPrompt;
  }

  /**
   * 📊 Update Learning from Interaction
   */
  updateFromInteraction(userId, message, response, userFeedback = null) {
    const profile = this._getUserProfile(userId);

    // Track common questions
    const questionHash = message.substring(0, 50);
    this.commonQuestions.set(
      questionHash,
      (this.commonQuestions.get(questionHash) || 0) + 1
    );

    // Update sentiment history
    const sentiment = this._analyzeSentiment(message);
    this.sentimentHistory.set(userId, sentiment);

    // Track user preferences
    if (userFeedback) {
      if (!this.userPreferences.has(userId)) {
        this.userPreferences.set(userId, []);
      }
      this.userPreferences.get(userId).push({
        message,
        response,
        feedback: userFeedback,
        timestamp: new Date()
      });
    }

    // Increase trust score on positive feedback
    if (userFeedback === 'positive') {
      profile.trustScore = Math.min(1, profile.trustScore + 0.1);
    } else if (userFeedback === 'negative') {
      profile.trustScore = Math.max(0, profile.trustScore - 0.05);
    }
  }

  /**
   * 📈 Get Enhancement Metrics
   */
  getMetrics() {
    return {
      totalUsers: this.userProfiles.size,
      totalContextItems: this.contextMemory.size,
      learnedPatterns: this.learnedPatterns.length,
      commonQuestionsTracked: this.commonQuestions.size,
      averageTrustScore: Array.from(this.userProfiles.values()).reduce(
        (sum, p) => sum + p.trustScore,
        0
      ) / Math.max(this.userProfiles.size, 1),
      supportedLanguages: this.supportedLanguages.length,
      featuresEnabled: {
        personality: this.config.enablePersonality,
        contextMemory: this.config.enableContextMemory,
        adaptiveLearning: this.config.enableAdaptiveLearning,
        multiLanguage: this.config.enableMultiLanguage,
        emotionalIntelligence: this.config.enableEmotionalIntelligence
      }
    };
  }

  /**
   * 🔧 Utility: Logging
   */
  log(msg, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${msg}`, data ? data : '');
  }
}

module.exports = AIEnhancementEngine;
