/**
 * Response Streaming & UX Manager
 * Handles typing indicators, streaming responses, and user experience
 */
class ResponseStreamingManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.activeStreams = new Map();
    this.typingIndicators = new Map();
    this.streamMetrics = {
      totalStreams: 0,
      completedStreams: 0,
      failedStreams: 0,
      averageStreamTime: 0,
      averageChunkSize: 0
    };
  }

  /**
   * Start typing indicator
   */
  async startTyping(chatId, client, maxDuration = 5000) {
    try {
      const chat = await client.getChatById(chatId);
      
      const typingInterval = setInterval(async () => {
        try {
          await chat.sendStateTyping();
        } catch (err) {
          this.logger.debug('Typing indicator update failed', { error: err.message });
        }
      }, 3000); // Update every 3 seconds

      this.typingIndicators.set(chatId, {
        interval: typingInterval,
        startTime: Date.now(),
        maxDuration
      });

      // Auto-stop after max duration
      setTimeout(() => this.stopTyping(chatId), maxDuration);

      return true;
    } catch (error) {
      this.logger.warn('Failed to start typing indicator', { chatId, error: error.message });
      return false;
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(chatId) {
    const indicator = this.typingIndicators.get(chatId);
    if (indicator) {
      clearInterval(indicator.interval);
      this.typingIndicators.delete(chatId);
      return true;
    }
    return false;
  }

  /**
   * Stream response as chunks
   */
  async streamResponse(response, chunkSize = 50) {
    const chunks = [];
    
    for (let i = 0; i < response.length; i += chunkSize) {
      chunks.push(response.substring(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Optimize response for readability
   */
  optimizeForReadability(response) {
    let optimized = response;

    // Add line breaks for long paragraphs
    optimized = optimized.replace(/(.{100,}?\.)/g, '$1\n');

    // Preserve list formatting
    optimized = optimized.replace(/(\n-\s)/g, '\n• ');

    // Add spacing for better readability
    optimized = optimized.replace(/\n\n\n+/g, '\n\n');

    // Format code blocks
    optimized = optimized.replace(/```([\s\S]*?)```/g, '```\n$1\n```');

    return optimized;
  }

  /**
   * Truncate response smartly
   */
  smartTruncate(response, maxLength = 2000) {
    if (response.length <= maxLength) {
      return response;
    }

    // Try to truncate at sentence boundary
    let truncated = response.substring(0, maxLength);

    // Find last sentence end
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');

    const lastEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);

    if (lastEnd > maxLength * 0.8) {
      truncated = response.substring(0, lastEnd + 1);
    }

    // Add ellipsis if truncated
    if (truncated.length < response.length) {
      truncated += '\n\n_[Pesan dipotong karena panjang]_';
    }

    return truncated;
  }

  /**
   * Format response for WhatsApp
   */
  formatForWhatsApp(response) {
    let formatted = response;

    // Preserve code blocks
    formatted = formatted.replace(/```(.*?)```/gs, '```$1```');

    // Bold formatting: **text** → *text*
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '*$1*');

    // Italic formatting: __text__ → _text_
    formatted = formatted.replace(/__(.+?)__/g, '_$1_');

    // List formatting
    formatted = formatted.replace(/^\s*[-*]\s+/gm, '• ');

    // Link preservation
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');

    return formatted;
  }

  /**
   * Add emoji for context
   */
  addContextEmoji(response, sentiment = 'neutral') {
    const emojiMap = {
      'question': '❓ ',
      'answer': '✅ ',
      'warning': '⚠️ ',
      'error': '❌ ',
      'info': 'ℹ️ ',
      'success': '✨ ',
      'thinking': '🤔 ',
      'help': '🆘 ',
      'urgent': '🚨 '
    };

    let contextType = 'info';
    
    if (response.includes('?')) contextType = 'question';
    if (response.includes('!')) contextType = 'success';
    if (response.includes('error') || response.includes('gagal')) contextType = 'error';
    if (response.includes('warning') || response.includes('perhatian')) contextType = 'warning';

    return (emojiMap[contextType] || '') + response;
  }

  /**
   * Create formatted message with metadata
   */
  createFormattedMessage(response, metadata = {}) {
    let message = response;

    // Add context info if available
    if (metadata.intent) {
      const intentEmoji = {
        'greeting': '👋',
        'question': '❓',
        'action': '⚡',
        'support': '🆘'
      };
      
      message = (intentEmoji[metadata.intent] || '') + ' ' + message;
    }

    // Add sentiment indicator if negative
    if (metadata.sentiment && (metadata.sentiment === 'negative' || metadata.sentiment === 'very_negative')) {
      message += '\n\n💙 Ada yang bisa saya bantu lagi?';
    }

    return message;
  }

  /**
   * Split long message into parts
   */
  splitMessage(message, maxLength = 1000) {
    const messages = [];
    let current = message;

    while (current.length > maxLength) {
      // Find last newline or space
      let splitPoint = maxLength;
      const lastNewline = current.lastIndexOf('\n', maxLength);
      const lastSpace = current.lastIndexOf(' ', maxLength);

      splitPoint = Math.max(lastNewline, lastSpace, maxLength * 0.8);

      messages.push(current.substring(0, splitPoint).trim());
      current = current.substring(splitPoint).trim();
    }

    if (current.length > 0) {
      messages.push(current);
    }

    return messages;
  }

  /**
   * Get response metrics
   */
  getMetrics() {
    return {
      ...this.streamMetrics,
      activeStreams: this.activeStreams.size,
      activeTypingIndicators: this.typingIndicators.size,
      averageStreamTime: Math.round(this.streamMetrics.averageStreamTime),
      averageChunkSize: Math.round(this.streamMetrics.averageChunkSize)
    };
  }

  /**
   * Track streaming operation
   */
  trackStream(streamId, startTime, endTime, chunkSize) {
    const streamTime = endTime - startTime;

    const prev = this.streamMetrics.completedStreams;
    const avgTime = this.streamMetrics.averageStreamTime;

    this.streamMetrics.completedStreams++;
    this.streamMetrics.averageStreamTime = 
      (avgTime * prev + streamTime) / this.streamMetrics.completedStreams;

    const prevChunks = this.streamMetrics.averageChunkSize;
    this.streamMetrics.averageChunkSize = 
      (prevChunks * prev + chunkSize) / this.streamMetrics.completedStreams;

    this.activeStreams.delete(streamId);
  }

  /**
   * Add reaction capability
   */
  async addReaction(message, emoji) {
    try {
      // WhatsApp Web doesn't support reactions directly in whatsapp-web.js
      // This is a placeholder for future implementation
      this.logger.debug('Reaction added', { emoji, messageId: message?.id });
      return true;
    } catch (error) {
      this.logger.warn('Failed to add reaction', { error: error.message });
      return false;
    }
  }

  /**
   * Send read receipt
   */
  async markAsRead(message) {
    try {
      if (message && message.markRead) {
        await message.markRead(true);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.warn('Failed to mark as read', { error: error.message });
      return false;
    }
  }

  /**
   * Create suggestion buttons format
   */
  createSuggestions(suggestions = []) {
    if (suggestions.length === 0) return '';

    let suggestionText = '\n\n*Saran:*\n';
    suggestions.forEach((suggestion, index) => {
      suggestionText += `${index + 1}. ${suggestion}\n`;
    });

    return suggestionText;
  }

  /**
   * Generate response preview
   */
  generatePreview(fullResponse, previewLength = 100) {
    if (fullResponse.length <= previewLength) {
      return fullResponse;
    }

    let preview = fullResponse.substring(0, previewLength);
    const lastSpace = preview.lastIndexOf(' ');

    if (lastSpace > previewLength * 0.8) {
      preview = fullResponse.substring(0, lastSpace);
    }

    return preview + '...';
  }
}

module.exports = ResponseStreamingManager;
