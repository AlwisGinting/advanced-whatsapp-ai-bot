/**
 * Bot Update Manager
 * Memungkinkan Super Admin mengupdate bot melalui pesan WhatsApp
 * Format: !update:script_name:code_content
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class BotUpdateManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.superAdminPhone = config.security.superAdminPhone;
    this.updateDir = path.join(__dirname, 'updates');
    this.createUpdateDir();
  }

  createUpdateDir() {
    if (!fs.existsSync(this.updateDir)) {
      fs.mkdirSync(this.updateDir, { recursive: true });
    }
  }

  /**
   * Parse command dari pesan
   * Format: !update:filename:code_content
   */
  parseUpdateCommand(message) {
    if (!message.startsWith('!update:')) return null;

    const parts = message.slice(8).split(':');
    if (parts.length < 2) return null;

    const filename = parts[0];
    const code = parts.slice(1).join(':'); // Kode bisa mengandung :

    return { filename, code };
  }

  /**
   * Validate code untuk keamanan
   */
  validateCode(code) {
    // Cek dangerous patterns
    const dangerous = [
      /require\s*\(\s*['"`]child_process['"`]\s*\)/,
      /exec\s*\(/,
      /spawn\s*\(/,
      /fork\s*\(/,
      /eval\s*\(/,
      /Function\s*\(/,
      /\.system\s*\(/,
      /os\.system/,
      /process\.exit/,
      /process\.abort/,
      /require\s*\(\s*['"`]fs['"`]\s*\)\.writeFileSync\s*\(\s*['"`]\/[^'"`]/
    ];

    for (const pattern of dangerous) {
      if (pattern.test(code)) {
        return { valid: false, reason: 'Kode mengandung operasi berbahaya' };
      }
    }

    return { valid: true };
  }

  /**
   * Buat file script baru
   */
  async createScript(filename, code, userId) {
    try {
      // Validasi filename
      if (!/^[a-zA-Z0-9_-]+\.js$/.test(filename)) {
        return { success: false, error: 'Nama file harus alphanumeric dengan ekstensi .js' };
      }

      // Validasi code
      const validation = this.validateCode(code);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      const filePath = path.join(__dirname, filename);
      
      // Cegah path traversal
      if (!filePath.startsWith(__dirname)) {
        return { success: false, error: 'Path traversal terdeteksi' };
      }

      // Tulis file
      fs.writeFileSync(filePath, code);
      
      this.logger.info('✅ Script baru dibuat', { filename, userId, bytes: code.length });
      
      return { 
        success: true, 
        message: `✅ File ${filename} berhasil dibuat (${code.length} bytes)`,
        filename 
      };
    } catch (error) {
      this.logger.error('❌ Error membuat script', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update file script yang sudah ada
   */
  async updateScript(filename, code, userId) {
    try {
      const filePath = path.join(__dirname, filename);
      
      // Cegah path traversal
      if (!filePath.startsWith(__dirname)) {
        return { success: false, error: 'Path traversal terdeteksi' };
      }

      // Cek file exists
      if (!fs.existsSync(filePath)) {
        return { success: false, error: `File ${filename} tidak ditemukan` };
      }

      // Backup file lama
      const backupPath = path.join(this.updateDir, `${filename}.backup.${Date.now()}`);
      fs.copyFileSync(filePath, backupPath);

      // Validasi code
      const validation = this.validateCode(code);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      // Tulis file baru
      fs.writeFileSync(filePath, code);
      
      this.logger.info('✅ Script diupdate', { 
        filename, 
        userId, 
        bytes: code.length,
        backup: backupPath 
      });
      
      return { 
        success: true, 
        message: `✅ File ${filename} berhasil diupdate (${code.length} bytes). Backup: ${path.basename(backupPath)}`,
        filename,
        backup: path.basename(backupPath)
      };
    } catch (error) {
      this.logger.error('❌ Error update script', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Restart bot dengan npm start
   */
  async restartBot() {
    try {
      this.logger.info('🔄 Menginisialisasi restart bot...');
      
      // Gunakan npm start yang sudah di-config
      exec('npm restart', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
          this.logger.error('❌ Error restart bot', { error: error.message });
        } else {
          this.logger.info('✅ Bot berhasil di-restart');
        }
      });

      return { 
        success: true, 
        message: '🔄 Bot sedang di-restart...' 
      };
    } catch (error) {
      this.logger.error('❌ Error restart', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Install package npm
   */
  async installPackage(packageName) {
    try {
      this.logger.info('📦 Installing package...', { package: packageName });
      
      const { stdout, stderr } = await execPromise(`npm install ${packageName}`, { 
        cwd: __dirname,
        timeout: 60000 // 60 detik timeout
      });

      this.logger.info('✅ Package installed', { package: packageName });
      
      return { 
        success: true, 
        message: `✅ Package ${packageName} berhasil diinstall`,
        output: stdout.slice(-500) // Return last 500 chars
      };
    } catch (error) {
      this.logger.error('❌ Error install package', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get daftar backup files
   */
  getBackupList() {
    try {
      const files = fs.readdirSync(this.updateDir);
      const backups = files.filter(f => f.endsWith('.backup'));
      return { success: true, backups, count: backups.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore file dari backup
   */
  async restoreFromBackup(backupFile) {
    try {
      const backupPath = path.join(this.updateDir, backupFile);
      
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup file tidak ditemukan' };
      }

      // Extract original filename
      const originalName = backupFile.split('.backup')[0];
      const targetPath = path.join(__dirname, originalName);

      // Restore
      fs.copyFileSync(backupPath, targetPath);

      this.logger.info('✅ File restored dari backup', { backup: backupFile });
      
      return { 
        success: true, 
        message: `✅ File ${originalName} berhasil di-restore dari backup` 
      };
    } catch (error) {
      this.logger.error('❌ Error restore backup', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle update command dari WhatsApp
   */
  async handleUpdateCommand(message, userId) {
    if (userId !== this.superAdminPhone) {
      return { success: false, error: '❌ Hanya Super Admin yang bisa menggunakan update commands' };
    }

    const command = this.parseUpdateCommand(message);
    if (!command) {
      return { success: false, error: '❌ Format invalid. Gunakan: !update:filename:code' };
    }

    // Handle berbagai jenis update
    if (command.filename === 'create-script') {
      return await this.createScript(command.code.split(':')[0], command.code.split(':').slice(1).join(':'), userId);
    }

    if (command.filename === 'update-script') {
      return await this.updateScript(command.code.split(':')[0], command.code.split(':').slice(1).join(':'), userId);
    }

    if (command.filename === 'restart') {
      return await this.restartBot();
    }

    if (command.filename === 'install-package') {
      return await this.installPackage(command.code);
    }

    if (command.filename === 'restore-backup') {
      return await this.restoreFromBackup(command.code);
    }

    if (command.filename === 'list-backups') {
      return this.getBackupList();
    }

    return { success: false, error: '❌ Command tidak dikenali' };
  }

  /**
   * Get help text
   */
  getHelpText() {
    return `
📚 Bot Update Commands (Super Admin Only):

1️⃣  Create Script:
   !update:create-script:filename.js:code_here

2️⃣  Update Script:
   !update:update-script:filename.js:code_here

3️⃣  Restart Bot:
   !update:restart

4️⃣  Install Package:
   !update:install-package:package-name

5️⃣  List Backups:
   !update:list-backups

6️⃣  Restore Backup:
   !update:restore-backup:backup-filename

📝 Note: Semua operasi di-log untuk audit trail.
`;
  }
}

module.exports = BotUpdateManager;
