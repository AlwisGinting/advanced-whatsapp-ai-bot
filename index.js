const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('baileys');
const OpenAI = require('openai');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Load config
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

// Initialize OpenAI
const openai = new OpenAI({ apiKey: config.openai.apiKey });

// Store for conversation history, rate limiting, and stats
const conversationHistory = new Map();
const userStats = new Map();
const HISTORY_FILE = './conversation_history.json';
const STATS_FILE = './user_stats.json';

// ============= LOGGING =============
class Logger {
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...data };
    const logText = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    console.log(logText);
    
    if (config.logging.saveToFile) {
      fs.appendFileSync(path.join(__dirname, 'bot.log'), logText);
    }
  }

  info(msg, data) { this.log('info', msg, data); }
  error(msg, data) { this.log('error', msg, data); }
  warn(msg, data) { this.log('warn', msg, data); }
  debug(msg, data) { this.log('debug', msg, data); }
}

const logger = new Logger();

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

// ============= AI RESPONSE =============
async function getChatGPTResponse(message, chatId) {
  try {
    let history = conversationHistory.get(chatId) || [];

    // Add user message
    history.push({ role: 'user', content: message });

    // Trim history if too long
    if (history.length > config.openai.maxHistoryPerChat) {
      history = history.slice(-config.openai.maxHistoryPerChat);
    }

    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: `You are ${config.bot.name}, a helpful AI assistant for WhatsApp owned by ${config.bot.owner}. 
You are intelligent, friendly, and concise. Respond in Indonesian when the user speaks Indonesian.
Keep responses short (max 2-3 sentences) suitable for WhatsApp chat.
Be professional but conversational.`
        },
        ...history
      ],
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature
    });

    const response = completion.choices[0].message.content;
    history.push({ role: 'assistant', content: response });
    conversationHistory.set(chatId, history);

    return response;
  } catch (error) {
    logger.error('ChatGPT error', { error: error.message, chatId });
    
    if (error.status === 429) {
      return 'Saya sedang sibuk. Coba lagi dalam beberapa saat.';
    }
    if (error.status === 401) {
      return 'Ada masalah dengan konfigurasi. Hubungi admin.';
    }
    
    return 'Maaf, ada kesalahan. Silakan coba lagi.';
  }
}

// ============= MAIN BOT =============
async function connectToWhatsApp() {
  try {
    loadHistory();
    loadStats();

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      browser: ['Ubuntu', 'Chrome', '121.0.6167.160']
    });

    // ============= CONNECTION EVENTS =============
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.info('QR Code received - Scan with WhatsApp');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.warn('Connection closed', { 
          reason: lastDisconnect?.error?.message, 
          reconnecting: shouldReconnect 
        });

        if (shouldReconnect) {
          setTimeout(() => connectToWhatsApp(), 3000);
        }
      } else if (connection === 'open') {
        logger.info('✅ Jarvis Bot is ready!');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // ============= MESSAGE HANDLER =============
    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const from = msg.key.remoteJid;
      const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const timestamp = new Date(msg.messageTimestamp * 1000).toISOString();

      logger.info('Message received', { from, length: body.length, timestamp });

      // GROUP HANDLING
      if (from.endsWith('@g.us')) {
        const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length > 0) {
          await sock.sendMessage(from, { 
            text: 'Baik, terimakasih informasinya. Mohon ditunggu, Alwis akan membalas pesan kembali.' 
          });
          logger.info('Group mention reply', { group: from });
        }
        return;
      }

      // PRIVATE CHAT HANDLING
      if (!checkRateLimit(from)) {
        await sock.sendMessage(from, { text: 'Maaf, Anda mencapai batas pesan. Coba lagi nanti.' });
        logger.warn('Rate limit hit', { from });
        return;
      }

      const hasHistory = conversationHistory.has(from);
      const mentionsName = body.toLowerCase().includes('jarvis') || body.toLowerCase().includes('alwis');

      // Start conversation if mentions name
      if (!hasHistory && mentionsName) {
        conversationHistory.set(from, []);
        await sock.sendMessage(from, { text: '👋 Halo! Saya Jarvis, AI assistant Anda. Ada yang bisa saya bantu?' });
        saveHistory();
        logger.info('New conversation started', { from });
        return;
      }

      // Skip if no history and no mention
      if (!hasHistory && !mentionsName) {
        logger.debug('No history and no mention', { from });
        return;
      }

      // Send typing indicator
      await sock.sendPresenceUpdate('composing', from);

      // Get response
      const response = await getChatGPTResponse(body, from);

      // Stop typing indicator
      await sock.sendPresenceUpdate('paused', from);

      // Send response
      await sock.sendMessage(from, { text: response });

      saveHistory();
      logger.info('Response sent', { from, responseLength: response.length });
    });

    return sock;
  } catch (error) {
    logger.error('Fatal error', { error: error.message });
    setTimeout(() => connectToWhatsApp(), 5000);
  }
}

// ============= STARTUP =============
logger.info('🤖 Starting Jarvis Bot...');
logger.info('Config loaded', { model: config.openai.model, owner: config.bot.owner });

connectToWhatsApp().catch(err => {
  logger.error('Failed to start bot', { error: err.message });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  saveHistory();
  fs.writeFileSync(STATS_FILE, JSON.stringify(Object.fromEntries(userStats), null, 2));
  process.exit(0);
});