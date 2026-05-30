const fs = require('fs');

/**
 * Enhanced History Manager
 * Provides advanced search, indexing, and history management
 */
class EnhancedHistoryManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.HISTORY_FILE = './conversation_history.json';
    this.INDEXED_HISTORY_FILE = './indexed_history.json';
    this.conversationHistory = new Map();
    this.contentIndex = new Map(); // For full-text search
    this.dateIndex = new Map(); // For date-based search
    this.loadHistory();
  }

  loadHistory() {
    try {
      if (fs.existsSync(this.HISTORY_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.HISTORY_FILE, 'utf-8'));
        Object.entries(data).forEach(([key, value]) => {
          this.conversationHistory.set(key, value);
          this.indexContent(key, value);
          this.indexByDate(key, value);
        });
        this.logger.info('Enhanced history loaded', { chats: Object.keys(data).length });
      }
    } catch (err) {
      this.logger.error('Failed to load enhanced history', { error: err.message });
    }
  }

  saveHistory() {
    try {
      const data = Object.fromEntries(this.conversationHistory);
      fs.writeFileSync(this.HISTORY_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      this.logger.error('Failed to save enhanced history', { error: err.message });
    }
  }

  /**
   * Index content for full-text search
   */
  indexContent(chatId, messages) {
    if (!Array.isArray(messages)) return;

    messages.forEach((msg, index) => {
      const content = (msg.content || '').toLowerCase();
      const words = content.split(/\s+/);

      words.forEach(word => {
        if (word.length > 2) {
          if (!this.contentIndex.has(word)) {
            this.contentIndex.set(word, []);
          }
          this.contentIndex.get(word).push({
            chatId,
            messageIndex: index,
            role: msg.role
          });
        }
      });
    });
  }

  /**
   * Index by date
   */
  indexByDate(chatId, messages) {
    if (!Array.isArray(messages)) return;

    messages.forEach((msg, index) => {
      // Try to extract date from message or use current date
      const dateMatch = msg.content?.match(/\d{4}-\d{2}-\d{2}/);
      const msgDate = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];

      if (!this.dateIndex.has(msgDate)) {
        this.dateIndex.set(msgDate, []);
      }

      this.dateIndex.get(msgDate).push({
        chatId,
        messageIndex: index,
        content: msg.content?.substring(0, 100)
      });
    });
  }

  /**
   * Add message to history
   */
  addMessage(chatId, role, content) {
    if (!this.conversationHistory.has(chatId)) {
      this.conversationHistory.set(chatId, []);
    }

    const messages = this.conversationHistory.get(chatId);
    const message = {
      role,
      content,
      timestamp: new Date().toISOString()
    };

    messages.push(message);
    this.indexContent(chatId, [message]);
    this.indexByDate(chatId, [message]);

    this.saveHistory();
    return message;
  }

  /**
   * Search by keyword (full-text search)
   */
  searchByKeyword(keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    // Direct word search
    if (this.contentIndex.has(lowerKeyword)) {
      results.push(...this.contentIndex.get(lowerKeyword));
    }

    // Partial search
    for (const [word, locations] of this.contentIndex.entries()) {
      if (word.includes(lowerKeyword)) {
        results.push(...locations);
      }
    }

    // Remove duplicates and add message content
    const uniqueResults = [];
    const seen = new Set();

    for (const result of results) {
      const key = `${result.chatId}-${result.messageIndex}`;
      if (!seen.has(key)) {
        seen.add(key);
        const messages = this.conversationHistory.get(result.chatId) || [];
        const message = messages[result.messageIndex];
        uniqueResults.push({
          ...result,
          content: message?.content,
          timestamp: message?.timestamp
        });
      }
    }

    return uniqueResults;
  }

  /**
   * Search by date range
   */
  searchByDateRange(startDate, endDate) {
    const results = [];
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    for (const [date, messages] of this.dateIndex.entries()) {
      const dateTime = new Date(date).getTime();
      if (dateTime >= start && dateTime <= end) {
        results.push(...messages);
      }
    }

    return results;
  }

  /**
   * Search by specific date
   */
  searchByDate(date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    return this.dateIndex.get(dateStr) || [];
  }

  /**
   * Search by chat ID
   */
  getChatHistory(chatId, limit = null) {
    let messages = this.conversationHistory.get(chatId) || [];

    if (limit) {
      messages = messages.slice(-limit);
    }

    return messages;
  }

  /**
   * Advanced search with multiple filters
   */
  advancedSearch(filters) {
    let results = [];

    if (filters.keyword) {
      results = this.searchByKeyword(filters.keyword);
    } else if (filters.startDate && filters.endDate) {
      results = this.searchByDateRange(filters.startDate, filters.endDate);
    } else if (filters.date) {
      results = this.searchByDate(filters.date);
    } else if (filters.chatId) {
      const messages = this.getChatHistory(filters.chatId);
      results = messages.map((msg, idx) => ({
        chatId: filters.chatId,
        messageIndex: idx,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp
      }));
    } else {
      return [];
    }

    // Apply additional filters
    if (filters.role) {
      results = results.filter(r => {
        const msg = this.conversationHistory.get(r.chatId)?.[r.messageIndex];
        return msg?.role === filters.role;
      });
    }

    if (filters.minLength) {
      results = results.filter(r => (r.content || '').length >= filters.minLength);
    }

    if (filters.maxLength) {
      results = results.filter(r => (r.content || '').length <= filters.maxLength);
    }

    return results;
  }

  /**
   * Get chat statistics
   */
  getChatStats(chatId) {
    const messages = this.conversationHistory.get(chatId) || [];
    const userMessages = messages.filter(m => m.role === 'user');
    const botMessages = messages.filter(m => m.role === 'assistant');

    const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    const avgMessageLength = messages.length > 0 ? Math.round(totalChars / messages.length) : 0;

    return {
      chatId,
      totalMessages: messages.length,
      userMessages: userMessages.length,
      botMessages: botMessages.length,
      totalCharacters: totalChars,
      averageMessageLength: avgMessageLength,
      firstMessage: messages[0]?.timestamp,
      lastMessage: messages[messages.length - 1]?.timestamp,
      durationDays: messages.length > 0 
        ? Math.ceil((new Date(messages[messages.length - 1]?.timestamp) - new Date(messages[0]?.timestamp)) / (1000 * 60 * 60 * 24))
        : 0
    };
  }

  /**
   * Get all chats statistics
   */
  getAllChatsStats() {
    const stats = [];

    for (const chatId of this.conversationHistory.keys()) {
      stats.push(this.getChatStats(chatId));
    }

    return stats.sort((a, b) => b.totalMessages - a.totalMessages);
  }

  /**
   * Export conversation as text
   */
  exportConversation(chatId, format = 'text') {
    const messages = this.conversationHistory.get(chatId) || [];

    if (format === 'json') {
      return JSON.stringify(messages, null, 2);
    }

    // Default text format
    let text = `Conversation Export - ${chatId}\n`;
    text += `Exported: ${new Date().toISOString()}\n`;
    text += `Total Messages: ${messages.length}\n`;
    text += '='.repeat(50) + '\n\n';

    messages.forEach((msg, idx) => {
      text += `[${msg.timestamp}] ${msg.role.toUpperCase()}:\n`;
      text += `${msg.content}\n\n`;
    });

    return text;
  }

  /**
   * Get recent conversations summary
   */
  getRecentConversationsSummary(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recent = [];

    for (const [chatId, messages] of this.conversationHistory.entries()) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && new Date(lastMessage.timestamp) > cutoffDate) {
        recent.push({
          chatId,
          lastMessage: lastMessage.content?.substring(0, 50),
          timestamp: lastMessage.timestamp,
          totalMessages: messages.length
        });
      }
    }

    return recent.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Search across all chats by year
   */
  searchByYear(year) {
    const results = [];

    for (const [chatId, messages] of this.conversationHistory.entries()) {
      const yearMessages = messages.filter(msg => {
        const msgYear = new Date(msg.timestamp).getFullYear();
        return msgYear === year;
      });

      if (yearMessages.length > 0) {
        results.push({
          chatId,
          messageCount: yearMessages.length,
          messages: yearMessages
        });
      }
    }

    return results;
  }

  /**
   * Get conversation trends over time
   */
  getConversationTrends(days = 30) {
    const trends = {};
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const messages of this.conversationHistory.values()) {
      messages.forEach(msg => {
        const msgDate = new Date(msg.timestamp).toISOString().split('T')[0];
        
        if (new Date(msgDate) >= cutoffDate) {
          trends[msgDate] = (trends[msgDate] || 0) + 1;
        }
      });
    }

    return trends;
  }

  /**
   * Clear history older than specified days
   */
  clearOldHistory(olderThanDays = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let removed = 0;

    for (const [chatId, messages] of this.conversationHistory.entries()) {
      const recentMessages = messages.filter(msg => 
        new Date(msg.timestamp) >= cutoffDate
      );

      if (recentMessages.length === 0) {
        this.conversationHistory.delete(chatId);
        removed += 1;
      } else if (recentMessages.length < messages.length) {
        this.conversationHistory.set(chatId, recentMessages);
        removed += messages.length - recentMessages.length;
      }
    }

    if (removed > 0) {
      this.saveHistory();
      this.logger.info('Old history cleared', { removedMessages: removed });
    }

    return removed;
  }
}

module.exports = EnhancedHistoryManager;
