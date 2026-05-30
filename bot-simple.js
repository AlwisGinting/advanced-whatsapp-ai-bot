const { Client, LocalAuth } = require('whatsapp-web.js');
const OpenAI = require('openai');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ============= SIMPLE LOGGER =============
class SimpleLogger {
  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    const logText = `[${timestamp}] ${message}\n`;
    
    console.log(`${message}`, data);
    fs.appendFileSync(path.join(__dirname, 'bot.log'), logText);
  }

  info(msg) { this.log(`[INFO] ${msg}`); }
  error(msg) { this.log(`[ERROR] ${msg}`); }
  warn(msg) { this.log(`[WARN] ${msg}`); }
}

const logger = new SimpleLogger();

// ============= CONFIG =============
const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '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',
    model: 'gpt-4-turbo'
  },
  bot: {
    superAdminPhone: '6288807239376'
  }
};

// ============= OPENAI CLIENT =============
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// ============= WHATSAPP CLIENT =============
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'jarvis-bot'
  }),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  }
});

// ============= CONVERSATION HISTORY =============
const conversationHistory = new Map();
const HISTORY_FILE = './conversation_history.json';

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      Object.entries(data).forEach(([key, value]) => {
        conversationHistory.set(key, value);
      });
      logger.info(`✅ History loaded (${Object.keys(data).length} chats)`);
    }
  } catch (err) {
    logger.error(`Failed to load history: ${err.message}`);
  }
}

function saveHistory() {
  try {
    const data = Object.fromEntries(conversationHistory);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    logger.error(`Failed to save history: ${err.message}`);
  }
}

// Auto-save every 5 minutes
setInterval(saveHistory, 5 * 60 * 1000);

// ============= AI RESPONSE =============
async function getChatGPTResponse(message, chatId) {
  try {
    let history = conversationHistory.get(chatId) || [];

    // Add user message
    history.push({ 
      role: 'user', 
      content: message 
    });

    // Keep last 20 messages
    if (history.length > 20) {
      history = history.slice(-20);
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { 
          role: 'system', 
          content: 'You are Jarvis, a helpful AI assistant. Respond concisely in Indonesian.' 
        },
        ...history
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;

    // Add assistant response
    history.push({ 
      role: 'assistant', 
      content: response 
    });

    // Save history
    conversationHistory.set(chatId, history);

    return response;
  } catch (error) {
    logger.error(`ChatGPT Error: ${error.message}`);
    return '⚠️ Maaf, terjadi kesalahan. Coba lagi nanti.';
  }
}

// ============= WHATSAPP EVENTS =============

client.on('qr', (qr) => {
  logger.info('📱 SCAN QR CODE DENGAN WHATSAPP ANDA!');
  console.log('\n\n');
  qrcode.generate(qr, { small: true });
  console.log('\n\n✅ Scan QR code di atas untuk link bot ke WhatsApp\n');
});

client.on('ready', () => {
  logger.info('✅ BOT SIAP! Jarvis Bot Connected!');
  console.log('\n🟢 Bot is ONLINE and ready to use!\n');
  console.log('📞 Chat ke bot untuk testing');
  console.log('💬 Atau ketik pesan apapun untuk memulai\n');
});

client.on('authenticated', () => {
  logger.info('✅ Authentication successful!');
});

client.on('auth_failure', (msg) => {
  logger.error(`Authentication failed: ${msg}`);
});

client.on('disconnected', (reason) => {
  logger.warn(`Disconnected: ${reason}`);
  logger.info('Attempting to reconnect...');
  setTimeout(() => {
    client.initialize();
  }, 5000);
});

client.on('message', async (msg) => {
  // Ignore messages from bot itself
  if (msg.fromMe) return;

  const chatId = msg.from;
  const text = msg.body.toLowerCase().trim();

  logger.info(`📨 Message from ${chatId}: ${msg.body}`);

  // Skip empty or special messages
  if (!text || text.length === 0) return;

  try {
    // Group handling
    if (msg.isGroupMsg) {
      if (msg.body.includes('@') || text.includes('jarvis') || text.includes('alwis')) {
        await msg.reply('Baik, terimakasih. Alwis akan membalas nanti. 😊');
      }
      return;
    }

    // Private chat - always respond
    logger.info(`✉️ Processing private message from ${chatId}`);
    
    // Show typing indicator
    await client.sendPresenceAvailable();
    
    // Get AI response
    const response = await getChatGPTResponse(msg.body, chatId);
    
    // Send response
    await msg.reply(response);
    
    logger.info(`✅ Response sent to ${chatId}`);

  } catch (error) {
    logger.error(`Error handling message: ${error.message}`);
    await msg.reply('❌ Error processing your message. Please try again.');
  }
});

// ============= ERROR HANDLING =============
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(`Stack: ${error.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

// ============= INITIALIZATION =============
logger.info('🚀 Starting Jarvis Bot...');
logger.info(`📱 Super Admin: ${config.bot.superAdminPhone}`);
logger.info(`🤖 Model: ${config.openai.model}`);

loadHistory();

client.initialize();

logger.info('✅ Initialization complete! Waiting for scan...');
