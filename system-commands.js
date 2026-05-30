const fs = require('fs');
const path = require('path');

/**
 * System Commands Handler
 * Manages file/folder operations, settings changes, and system operations
 */
class SystemCommandsHandler {
  constructor(config, logger, rbac) {
    this.config = config;
    this.logger = logger;
    this.rbac = rbac;
    this.COMMANDS_LOG_FILE = './commands-history.json';
    this.commandsHistory = [];
    this.loadCommandsHistory();
  }

  loadCommandsHistory() {
    try {
      if (fs.existsSync(this.COMMANDS_LOG_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.COMMANDS_LOG_FILE, 'utf-8'));
        this.commandsHistory = data;
        this.logger.info('Commands history loaded', { count: data.length });
      }
    } catch (err) {
      this.logger.error('Failed to load commands history', { error: err.message });
    }
  }

  saveCommandsHistory() {
    try {
      fs.writeFileSync(this.COMMANDS_LOG_FILE, JSON.stringify(this.commandsHistory, null, 2));
    } catch (err) {
      this.logger.error('Failed to save commands history', { error: err.message });
    }
  }

  /**
   * Log command execution
   */
  logCommand(userId, command, args, result, status = 'SUCCESS') {
    const entry = {
      timestamp: new Date().toISOString(),
      userId,
      command,
      args,
      result,
      status
    };

    this.commandsHistory.push(entry);
    this.saveCommandsHistory();

    this.logger.info('Command executed', entry);
    return entry;
  }

  /**
   * Parse system command
   */
  parseCommand(message) {
    if (!message.startsWith('/')) return null;

    const parts = message.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    return { command, args };
  }

  /**
   * Create file
   */
  createFile(filePath, content, userId) {
    if (!this.rbac.hasPermission(userId, 'create_files')) {
      throw new Error('❌ Anda tidak memiliki izin untuk membuat file.');
    }

    try {
      // Security: prevent directory traversal
      if (filePath.includes('..') || filePath.startsWith('/')) {
        throw new Error('❌ Path tidak valid untuk alasan keamanan.');
      }

      const fullPath = path.join(process.cwd(), filePath);
      const dir = path.dirname(fullPath);

      // Create directory if not exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, 'utf-8');

      this.logCommand(userId, 'CREATE_FILE', { filePath, size: content.length }, 'File created successfully', 'SUCCESS');
      
      return `✅ File berhasil dibuat: ${filePath}`;
    } catch (err) {
      this.logCommand(userId, 'CREATE_FILE', { filePath }, err.message, 'ERROR');
      throw err;
    }
  }

  /**
   * Delete file
   */
  deleteFile(filePath, userId) {
    if (!this.rbac.hasPermission(userId, 'delete_files')) {
      throw new Error('❌ Anda tidak memiliki izin untuk menghapus file.');
    }

    try {
      if (filePath.includes('..') || filePath.startsWith('/')) {
        throw new Error('❌ Path tidak valid untuk alasan keamanan.');
      }

      const fullPath = path.join(process.cwd(), filePath);

      if (!fs.existsSync(fullPath)) {
        throw new Error('❌ File tidak ditemukan.');
      }

      fs.unlinkSync(fullPath);

      this.logCommand(userId, 'DELETE_FILE', { filePath }, 'File deleted successfully', 'SUCCESS');
      
      return `✅ File berhasil dihapus: ${filePath}`;
    } catch (err) {
      this.logCommand(userId, 'DELETE_FILE', { filePath }, err.message, 'ERROR');
      throw err;
    }
  }

  /**
   * Create directory
   */
  createDirectory(dirPath, userId) {
    if (!this.rbac.hasPermission(userId, 'create_files')) {
      throw new Error('❌ Anda tidak memiliki izin untuk membuat folder.');
    }

    try {
      if (dirPath.includes('..') || dirPath.startsWith('/')) {
        throw new Error('❌ Path tidak valid untuk alasan keamanan.');
      }

      const fullPath = path.join(process.cwd(), dirPath);

      if (fs.existsSync(fullPath)) {
        throw new Error('❌ Folder sudah ada.');
      }

      fs.mkdirSync(fullPath, { recursive: true });

      this.logCommand(userId, 'CREATE_DIR', { dirPath }, 'Directory created successfully', 'SUCCESS');
      
      return `✅ Folder berhasil dibuat: ${dirPath}`;
    } catch (err) {
      this.logCommand(userId, 'CREATE_DIR', { dirPath }, err.message, 'ERROR');
      throw err;
    }
  }

  /**
   * List files in directory
   */
  listFiles(dirPath, userId) {
    if (!this.rbac.hasPermission(userId, 'read_data')) {
      throw new Error('❌ Anda tidak memiliki izin untuk melihat file.');
    }

    try {
      if (dirPath.includes('..') || dirPath.startsWith('/')) {
        throw new Error('❌ Path tidak valid untuk alasan keamanan.');
      }

      const fullPath = path.join(process.cwd(), dirPath);

      if (!fs.existsSync(fullPath)) {
        throw new Error('❌ Folder tidak ditemukan.');
      }

      const files = fs.readdirSync(fullPath);
      
      return {
        path: dirPath,
        files: files,
        count: files.length
      };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Read file
   */
  readFile(filePath, userId, preview = true, lines = 10) {
    if (!this.rbac.hasPermission(userId, 'read_data')) {
      throw new Error('❌ Anda tidak memiliki izin untuk membaca file.');
    }

    try {
      if (filePath.includes('..') || filePath.startsWith('/')) {
        throw new Error('❌ Path tidak valid untuk alasan keamanan.');
      }

      const fullPath = path.join(process.cwd(), filePath);

      if (!fs.existsSync(fullPath)) {
        throw new Error('❌ File tidak ditemukan.');
      }

      let content = fs.readFileSync(fullPath, 'utf-8');

      if (preview && content.length > 1000) {
        const contentLines = content.split('\n');
        content = contentLines.slice(0, lines).join('\n') + '\n... (truncated)';
      }

      return {
        path: filePath,
        content: content,
        size: Buffer.byteLength(content, 'utf-8'),
        truncated: content.includes('(truncated)')
      };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Update config setting
   */
  updateConfigSetting(settingPath, value, userId) {
    if (!this.rbac.hasPermission(userId, 'manage_settings')) {
      throw new Error('❌ Anda tidak memiliki izin untuk mengubah setting.');
    }

    try {
      const configPath = './config.json';
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Navigate to the nested path
      const keys = settingPath.split('.');
      let current = config;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      const oldValue = current[lastKey];
      current[lastKey] = value;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      this.logCommand(userId, 'UPDATE_CONFIG', { settingPath, oldValue, newValue: value }, 'Config updated', 'SUCCESS');

      return `✅ Setting diubah: ${settingPath}\nSebelum: ${oldValue}\nSesudah: ${value}`;
    } catch (err) {
      this.logCommand(userId, 'UPDATE_CONFIG', { settingPath }, err.message, 'ERROR');
      throw err;
    }
  }

  /**
   * Get system status
   */
  getSystemStatus(userId) {
    if (!this.rbac.hasPermission(userId, 'read_data')) {
      throw new Error('❌ Anda tidak memiliki izin untuk melihat status sistem.');
    }

    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  /**
   * Get commands history
   */
  getCommandsHistory(userId, filter = {}) {
    if (!this.rbac.hasPermission(userId, 'view_all_history')) {
      // Only allow users to see their own commands
      filter.userId = userId;
    }

    let results = this.commandsHistory;

    if (filter.userId) {
      results = results.filter(cmd => cmd.userId === filter.userId);
    }

    if (filter.command) {
      results = results.filter(cmd => cmd.command === filter.command);
    }

    if (filter.status) {
      results = results.filter(cmd => cmd.status === filter.status);
    }

    if (filter.startDate || filter.endDate) {
      results = results.filter(cmd => {
        const cmdDate = new Date(cmd.timestamp);
        if (filter.startDate && cmdDate < new Date(filter.startDate)) return false;
        if (filter.endDate && cmdDate > new Date(filter.endDate)) return false;
        return true;
      });
    }

    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Execute system command based on permission
   */
  async executeCommand(userId, message, security) {
    const parsed = this.parseCommand(message);
    if (!parsed) return null;

    const { command, args } = parsed;

    try {
      switch (command.toLowerCase()) {
        case 'buat_file':
          if (args.length < 2) throw new Error('Format: /buat_file <path> <content>');
          return this.createFile(args[0], args.slice(1).join(' '), userId);

        case 'hapus_file':
          if (args.length < 1) throw new Error('Format: /hapus_file <path>');
          // Require approval for sensitive operation
          if (security.shouldRequireApproval(userId, 'delete_files', this.rbac)) {
            throw new Error('⚠️ Operasi ini membutuhkan persetujuan dari admin.');
          }
          return this.deleteFile(args[0], userId);

        case 'buat_folder':
          if (args.length < 1) throw new Error('Format: /buat_folder <path>');
          return this.createDirectory(args[0], userId);

        case 'lihat_file':
          if (args.length < 1) throw new Error('Format: /lihat_file <path>');
          const fileData = this.readFile(args[0], userId);
          return `📄 *File: ${fileData.path}*\n\`\`\`\n${fileData.content}\n\`\`\`\n\nUkuran: ${fileData.size} bytes`;

        case 'list_files':
          const dirData = this.listFiles(args[0] || '.', userId);
          return `📁 *Folder: ${dirData.path}*\n\nFile (${dirData.count}):\n${dirData.files.map(f => '• ' + f).join('\n')}`;

        case 'ubah_setting':
          if (args.length < 2) throw new Error('Format: /ubah_setting <setting_path> <value>');
          return this.updateConfigSetting(args[0], args[1], userId);

        case 'status_sistem':
          const status = this.getSystemStatus(userId);
          return `🤖 *Status Sistem*\n\nUptime: ${Math.floor(status.uptime)}s\nMemory: ${Math.round(status.memoryUsage.heapUsed / 1024 / 1024)}MB\nNode: ${status.nodeVersion}\nPlatform: ${status.platform}`;

        default:
          return null;
      }
    } catch (err) {
      this.logCommand(userId, command, args, err.message, 'ERROR');
      throw err;
    }
  }
}

module.exports = SystemCommandsHandler;
