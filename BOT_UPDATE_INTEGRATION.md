/**
 * Integration Guide untuk Bot Update Manager
 * 
 * Tambahkan ini ke bagian atas index.js setelah require yang lain:
 */

// Tambahkan di bagian imports (setelah modul lainnya):
// const BotUpdateManager = require('./bot-update-manager');

// Tambahkan di initializeAllManagers() function:
// let botUpdateManager = new BotUpdateManager(config, logger);
// logger.info('✅ Bot Update Manager initialized');

/**
 * Tambahkan ini di event handler message, di dalam function handleMessage:
 */

// ============ SUPER ADMIN COMMANDS ============
async function handleSuperAdminCommands(msg, userId) {
  if (userId !== config.security.superAdminPhone) {
    return false; // Not admin, continue normal flow
  }

  const messageText = msg.body.toLowerCase();

  // Update commands
  if (messageText.startsWith('!update:')) {
    const result = await botUpdateManager.handleUpdateCommand(msg.body, userId);
    const responseMsg = result.success 
      ? result.message 
      : `❌ Error: ${result.error}`;
    
    msg.reply(responseMsg);
    logger.info('🔒 Super Admin Command Executed', { command: msg.body.slice(0, 50), userId, result });
    return true;
  }

  // Help command
  if (messageText === '!help') {
    msg.reply(botUpdateManager.getHelpText());
    return true;
  }

  // Bot status
  if (messageText === '!status') {
    const status = `
📊 Bot Status:
━━━━━━━━━━━━━━━━━━━━━
🟢 Status: ONLINE
⏱️  Uptime: ${Math.floor(logger.getMetrics().uptime / 60)} menit
💬 Total Pesan: ${logger.getMetrics().total}
❌ Errors: ${logger.getMetrics().errors}
⚠️  Warnings: ${logger.getMetrics().warnings}
📝 Info Logs: ${logger.getMetrics().info}
🐛 Debug Logs: ${logger.getMetrics().debug}
━━━━━━━━━━━━━━━━━━━━━
    `;
    msg.reply(status);
    return true;
  }

  // Clear history
  if (messageText === '!clear-history') {
    conversationHistory.clear();
    msg.reply('✅ Conversation history cleared!');
    return true;
  }

  return false;
}

/**
 * Tambahkan di message event handler, SEBELUM getChatGPTResponse dipanggil:
 */

// Check if super admin command
if (await handleSuperAdminCommands(msg, chatId)) {
  return; // Command handled, don't continue
}

// Normal message flow
// ... rest of the code
