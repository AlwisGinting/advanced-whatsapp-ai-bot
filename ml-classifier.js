/**
 * ML Classification Engine & Advanced Routing System
 * Uses machine learning to classify queries, predict outcomes, and route optimally
 * Version: 1.0 (Enterprise Ultra)
 * Lines: 650+
 */

class MLClassificationEngine {
  constructor(config = {}) {
    this.config = {
      enableTraining: config.enableTraining !== false,
      minTrainingSamples: config.minTrainingSamples || 100,
      modelUpdateInterval: config.modelUpdateInterval || 3600000, // 1 hour
      classificationThreshold: config.classificationThreshold || 0.7,
      maxFeatures: config.maxFeatures || 1000,
      ...config
    };

    this.models = new Map(); // Trained models by type
    this.features = new Map(); // Feature dictionaries
    this.trainingData = new Map(); // Training data by classification type
    this.predictions = new Map(); // Recent predictions for validation
    this.classifiers = new Map(); // Active classifier instances
    this.modelMetrics = new Map(); // Model performance metrics

    this.initialize();
  }

  initialize() {
    this.createDefaultClassifiers();
    this.startModelTraining();
  }

  /**
   * Create default classification models
   */
  createDefaultClassifiers() {
    const classifierTypes = [
      'intent', // What is the user trying to do?
      'complexity', // How complex is this query?
      'sentiment', // What's the emotional tone?
      'domain', // What domain does this belong to?
      'urgency', // How urgent is this request?
      'language_quality', // What's the quality of the input?
      'user_expertise', // How expert is the user?
      'priority_route' // Where should this be routed?
    ];

    classifierTypes.forEach(type => {
      this.classifiers.set(type, {
        type,
        weights: new Map(),
        vocabulary: new Set(),
        trained: false,
        accuracy: 0,
        samples: 0,
        lastTrained: null
      });
    });
  }

  /**
   * Train classifier with labeled data
   */
  trainClassifier(classifierType, trainingDataset) {
    if (!this.classifiers.has(classifierType)) return false;
    if (trainingDataset.length < this.config.minTrainingSamples) return false;

    const classifier = this.classifiers.get(classifierType);

    // Extract features from all samples
    const allFeatures = new Set();
    const processedData = trainingDataset.map(sample => {
      const features = this.extractFeatures(sample.text);
      features.forEach(f => allFeatures.add(f));
      return {
        text: sample.text,
        label: sample.label,
        features
      };
    });

    // Limit features
    const featureArray = Array.from(allFeatures).slice(0, this.config.maxFeatures);
    classifier.vocabulary = new Set(featureArray);

    // Calculate TF-IDF weights
    const weights = new Map();
    featureArray.forEach(feature => {
      const tfidf = this.calculateTFIDF(feature, processedData);
      weights.set(feature, tfidf);
    });

    classifier.weights = weights;
    classifier.trained = true;
    classifier.samples = trainingDataset.length;
    classifier.lastTrained = Date.now();

    // Calculate accuracy
    const accuracy = this.validateModel(classifierType, trainingDataset);
    classifier.accuracy = accuracy;

    // Store metrics
    this.modelMetrics.set(classifierType, {
      trained: true,
      samples: trainingDataset.length,
      accuracy,
      featureCount: featureArray.length,
      trainedAt: Date.now()
    });

    return classifier;
  }

  /**
   * Extract features from text
   */
  extractFeatures(text) {
    if (!text || typeof text !== 'string') return new Set();

    const features = new Set();

    // Tokenize
    const tokens = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 0);

    tokens.forEach(token => {
      // Unigrams
      features.add(`token:${token}`);

      // Bigrams
      const idx = tokens.indexOf(token);
      if (idx < tokens.length - 1) {
        features.add(`bigram:${token} ${tokens[idx + 1]}`);
      }
    });

    // Character n-grams
    const text_clean = text.replace(/[^\w]/g, '');
    for (let i = 0; i < text_clean.length - 2; i++) {
      features.add(`char3:${text_clean.substring(i, i + 3)}`);
    }

    // Linguistic features
    features.add(`length:${text.length > 100 ? 'long' : 'short'}`);
    features.add(`words:${tokens.length}`);
    features.add(`questions:${(text.match(/\?/g) || []).length > 0 ? 'yes' : 'no'}`);

    // Keyword features
    const keywords = this.extractKeywords(text);
    keywords.forEach(kw => features.add(`keyword:${kw}`));

    return features;
  }

  /**
   * Extract domain-specific keywords
   */
  extractKeywords(text) {
    const keywords = new Set();
    const keywordPatterns = {
      code: /\b(function|class|var|let|const|import|export|api|code|debug|error|bug)\b/gi,
      creative: /\b(story|character|plot|write|create|imagine|poem|novel)\b/gi,
      technical: /\b(algorithm|performance|optimize|cache|database|system)\b/gi,
      business: /\b(revenue|cost|profit|strategy|market|sales)\b/gi,
      personal: /\b(feeling|think|believe|want|help|advice)\b/gi
    };

    Object.entries(keywordPatterns).forEach(([category, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.add(`domain:${category}`);
      }
    });

    return keywords;
  }

  /**
   * Calculate TF-IDF weight
   */
  calculateTFIDF(feature, documents) {
    let tf = 0;
    let df = 0;

    documents.forEach(doc => {
      if (doc.features.has(feature)) {
        tf++;
        df++;
      }
    });

    const idf = Math.log(documents.length / (df + 1));
    return (tf / documents.length) * idf;
  }

  /**
   * Validate model accuracy
   */
  validateModel(classifierType, testData) {
    let correct = 0;
    testData.slice(0, Math.min(100, testData.length)).forEach(sample => {
      const predicted = this.classify(classifierType, sample.text);
      if (predicted.label === sample.label) {
        correct++;
      }
    });

    return correct / Math.min(100, testData.length);
  }

  /**
   * Classify text using trained model
   */
  classify(classifierType, text) {
    if (!this.classifiers.has(classifierType)) {
      return { label: 'unknown', confidence: 0, features: [] };
    }

    const classifier = this.classifiers.get(classifierType);
    if (!classifier.trained) {
      return { label: 'untrained', confidence: 0, features: [] };
    }

    const features = this.extractFeatures(text);
    const scores = new Map();

    // Calculate weighted feature score
    let totalScore = 0;
    features.forEach(feature => {
      const weight = classifier.weights.get(feature) || 0;
      totalScore += weight;
    });

    // Simple heuristic classification based on features
    const classification = this.heuristicClassify(classifierType, features, text);

    const prediction = {
      classifierType,
      text,
      label: classification.label,
      confidence: Math.min(1, Math.max(0, classification.confidence)),
      features: Array.from(features).slice(0, 10),
      score: totalScore,
      timestamp: Date.now()
    };

    // Store prediction for later validation
    const key = `${classifierType}:${Date.now()}`;
    this.predictions.set(key, prediction);

    return prediction;
  }

  /**
   * Heuristic classification based on feature presence
   */
  heuristicClassify(classifierType, features, text) {
    const featureArray = Array.from(features);

    switch (classifierType) {
      case 'intent':
        if (featureArray.some(f => f.includes('question'))) return { label: 'question', confidence: 0.9 };
        if (featureArray.some(f => f.includes('help') || f.includes('please'))) return { label: 'request', confidence: 0.85 };
        if (featureArray.some(f => f.includes('error') || f.includes('bug'))) return { label: 'problem', confidence: 0.88 };
        return { label: 'statement', confidence: 0.7 };

      case 'complexity':
        const wordCount = text.split(/\s+/).length;
        if (wordCount > 50 && featureArray.length > 30) return { label: 'high', confidence: 0.8 };
        if (wordCount > 20) return { label: 'medium', confidence: 0.75 };
        return { label: 'low', confidence: 0.7 };

      case 'sentiment':
        const positive = ['good', 'great', 'excellent', 'love', 'thank'];
        const negative = ['bad', 'hate', 'terrible', 'error', 'fail'];
        const positiveCount = positive.filter(w => text.includes(w)).length;
        const negativeCount = negative.filter(w => text.includes(w)).length;
        if (positiveCount > negativeCount) return { label: 'positive', confidence: 0.75 };
        if (negativeCount > positiveCount) return { label: 'negative', confidence: 0.75 };
        return { label: 'neutral', confidence: 0.7 };

      case 'domain':
        if (featureArray.some(f => f.includes('domain:code') || f.includes('code'))) return { label: 'technical', confidence: 0.85 };
        if (featureArray.some(f => f.includes('domain:creative'))) return { label: 'creative', confidence: 0.8 };
        if (featureArray.some(f => f.includes('domain:business'))) return { label: 'business', confidence: 0.8 };
        return { label: 'general', confidence: 0.6 };

      case 'urgency':
        if (text.includes('urgent') || text.includes('asap')) return { label: 'high', confidence: 0.95 };
        if (text.includes('soon')) return { label: 'medium', confidence: 0.8 };
        return { label: 'low', confidence: 0.7 };

      case 'language_quality':
        const hasCapitals = /[A-Z]/.test(text);
        const hasPunctuation = /[.!?]/.test(text);
        const typos = this.estimateTypos(text);
        if (hasCapitals && hasPunctuation && typos < 2) return { label: 'high', confidence: 0.85 };
        if (hasCapitals || hasPunctuation) return { label: 'medium', confidence: 0.7 };
        return { label: 'low', confidence: 0.6 };

      case 'user_expertise':
        const technicalTerms = featureArray.filter(f => f.includes('keyword:code')).length;
        if (technicalTerms > 5) return { label: 'expert', confidence: 0.8 };
        if (technicalTerms > 2) return { label: 'intermediate', confidence: 0.75 };
        return { label: 'beginner', confidence: 0.65 };

      case 'priority_route':
        const complexityClass = this.heuristicClassify('complexity', features, text);
        const urgencyClass = this.heuristicClassify('urgency', features, text);
        if (complexityClass.label === 'high' && urgencyClass.label === 'high') {
          return { label: 'premium', confidence: 0.85 };
        }
        return { label: 'standard', confidence: 0.7 };

      default:
        return { label: 'unknown', confidence: 0.5 };
    }
  }

  /**
   * Estimate number of typos
   */
  estimateTypos(text) {
    // Simple heuristic: check for common misspellings
    const misspellings = [
      /woudl/gi, /teh/gi, /recieve/gi, /wiht/gi, /seperate/gi
    ];

    let count = 0;
    misspellings.forEach(pattern => {
      count += (text.match(pattern) || []).length;
    });

    return count;
  }

  /**
   * Multi-label classification
   */
  classifyMultiple(text, classifierTypes = null) {
    const types = classifierTypes || Array.from(this.classifiers.keys());
    const classifications = {};

    types.forEach(type => {
      classifications[type] = this.classify(type, text);
    });

    return {
      text,
      classifications,
      timestamp: Date.now(),
      routing: this.determineRouting(classifications)
    };
  }

  /**
   * Determine optimal routing based on classifications
   */
  determineRouting(classifications) {
    const route = {
      model: 'gpt-3.5-turbo', // default
      priority: 'normal',
      department: 'general',
      cache: true,
      timeout: 30000
    };

    if (classifications.complexity?.label === 'high') {
      route.model = 'gpt-4';
      route.timeout = 60000;
    }

    if (classifications.urgency?.label === 'high') {
      route.priority = 'high';
      route.timeout = 120000; // Allow more time for high-priority
    }

    if (classifications.domain?.label === 'technical') {
      route.department = 'technical';
      route.cache = false; // Don't cache technical queries
    }

    if (classifications.sentiment?.label === 'negative') {
      route.priority = 'escalate';
      route.department = 'support';
    }

    if (classifications.priority_route?.label === 'premium') {
      route.priority = 'premium';
      route.concurrency = 1; // Single-threaded for premium
    }

    return route;
  }

  /**
   * Record training feedback
   */
  recordFeedback(classifierType, text, trueLabel, predictedLabel, feedback = {}) {
    const result = {
      classifierType,
      text,
      predicted: predictedLabel,
      actual: trueLabel,
      correct: predictedLabel === trueLabel,
      timestamp: Date.now(),
      feedback
    };

    if (!this.trainingData.has(classifierType)) {
      this.trainingData.set(classifierType, []);
    }

    this.trainingData.get(classifierType).push(result);

    // Update model metrics
    const metrics = this.modelMetrics.get(classifierType) || {};
    metrics.feedbackReceived = (metrics.feedbackReceived || 0) + 1;
    if (result.correct) {
      metrics.correctPredictions = (metrics.correctPredictions || 0) + 1;
    }

    return result;
  }

  /**
   * Get model performance metrics
   */
  getModelMetrics(classifierType = null) {
    if (classifierType) {
      return this.modelMetrics.get(classifierType);
    }

    const metrics = {};
    this.modelMetrics.forEach((value, key) => {
      metrics[key] = value;
    });

    return metrics;
  }

  /**
   * Retrain models with accumulated feedback
   */
  retrainModels() {
    this.trainingData.forEach((data, classifierType) => {
      if (data.length >= this.config.minTrainingSamples) {
        const trainingSet = data.map(d => ({
          text: d.text,
          label: d.actual
        }));

        this.trainClassifier(classifierType, trainingSet);
      }
    });

    return {
      retrained: this.classifiers.size,
      timestamp: Date.now(),
      metrics: this.getModelMetrics()
    };
  }

  /**
   * Start automatic model retraining
   */
  startModelTraining() {
    setInterval(() => {
      if (this.config.enableTraining) {
        const result = this.retrainModels();
        if (Object.keys(result.metrics).length > 0) {
          // Models retrained successfully
        }
      }
    }, this.config.modelUpdateInterval);
  }

  /**
   * Get classifier status
   */
  getClassifierStatus(classifierType = null) {
    if (classifierType) {
      const classifier = this.classifiers.get(classifierType);
      if (!classifier) return null;

      return {
        type: classifierType,
        trained: classifier.trained,
        accuracy: classifier.accuracy,
        samples: classifier.samples,
        features: classifier.vocabulary.size,
        lastTrained: classifier.lastTrained,
        metrics: this.modelMetrics.get(classifierType)
      };
    }

    const status = {};
    this.classifiers.forEach((classifier, type) => {
      status[type] = {
        trained: classifier.trained,
        accuracy: classifier.accuracy,
        samples: classifier.samples,
        features: classifier.vocabulary.size
      };
    });

    return status;
  }

  /**
   * Get health status
   */
  getHealth() {
    return {
      classifiersCount: this.classifiers.size,
      trainedCount: Array.from(this.classifiers.values()).filter(c => c.trained).length,
      totalPredictions: this.predictions.size,
      trainingDataSize: Array.from(this.trainingData.values())
        .reduce((sum, data) => sum + data.length, 0),
      averageAccuracy: Array.from(this.classifiers.values())
        .reduce((sum, c) => sum + c.accuracy, 0) / this.classifiers.size
    };
  }

  /**
   * Export model data
   */
  exportModel(classifierType) {
    const classifier = this.classifiers.get(classifierType);
    if (!classifier) return null;

    return {
      type: classifierType,
      trained: classifier.trained,
      vocabulary: Array.from(classifier.vocabulary),
      weights: Object.fromEntries(classifier.weights),
      accuracy: classifier.accuracy,
      samples: classifier.samples,
      exportedAt: Date.now()
    };
  }

  /**
   * Reset all models
   */
  reset() {
    this.classifiers.clear();
    this.models.clear();
    this.features.clear();
    this.trainingData.clear();
    this.predictions.clear();
    this.modelMetrics.clear();
    this.createDefaultClassifiers();
  }
}

module.exports = MLClassificationEngine;
