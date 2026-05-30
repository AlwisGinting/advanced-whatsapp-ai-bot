/**
 * WhatsApp Authentication Helper
 * Supports both QR Code scanning and manual WhatsApp Web linking (phone + code)
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

class WhatsAppAuthHelper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.authMethod = config.security.authMethod || 'qr-code';
    this.sessionDir = './auth_info_baileys';
    this.authFile = './whatsapp-auth-status.json';
    this.loadAuthStatus();
  }

  loadAuthStatus() {
    try {
      if (fs.existsSync(this.authFile)) {
        this.authStatus = JSON.parse(fs.readFileSync(this.authFile, 'utf-8'));
      } else {
        this.authStatus = {
          method: this.authMethod,
          phone: this.config.security.superAdminPhone,
          status: 'pending',
          linkedAt: null,
          expiresAt: null,
          sessionPath: this.sessionDir
        };
        this.saveAuthStatus();
      }
    } catch (error) {
      this.logger.error('Failed to load auth status', { error: error.message });
      this.authStatus = {
        method: this.authMethod,
        phone: this.config.security.superAdminPhone,
        status: 'pending'
      };
    }
  }

  saveAuthStatus() {
    try {
      fs.writeFileSync(this.authFile, JSON.stringify(this.authStatus, null, 2));
    } catch (error) {
      this.logger.error('Failed to save auth status', { error: error.message });
    }
  }

  /**
   * Handle QR Code authentication (Traditional method)
   */
  handleQRCodeAuth(qr) {
    this.logger.info('📱 QR Code Authentication Ready');
    this.logger.info('Steps:', {
      step1: 'Open WhatsApp on your phone',
      step2: 'Go to Settings → Linked Devices → Link a Device',
      step3: 'Point your phone camera at the QR code below',
      step4: 'Wait for connection (30-60 seconds)'
    });

    this.authStatus.method = 'qr-code';
    this.authStatus.status = 'awaiting-scan';
    this.authStatus.qrGeneratedAt = new Date().toISOString();
    this.saveAuthStatus();

    return qr;
  }

  /**
   * Handle Manual WhatsApp Web Linking (Phone + Code method)
   * This is for devices that can't scan QR codes
   */
  handleManualAuth(client) {
    this.logger.info('🔗 Manual WhatsApp Web Linking Ready');
    this.logger.info('💡 This method is for phones that cannot scan QR codes');
    this.logger.info('');
    this.logger.info('Steps to link your phone number:');
    this.logger.info('1️⃣  Open https://web.whatsapp.com/ on your browser');
    this.logger.info('2️⃣  Go to Settings → Linked Devices');
    this.logger.info('3️⃣  Click "Link a Device"');
    this.logger.info('4️⃣  A popup will appear asking for your phone number');
    this.logger.info('5️⃣  Enter: ' + this.formatPhoneNumber(this.config.security.superAdminPhone));
    this.logger.info('6️⃣  You will receive a SMS/WhatsApp message with a code');
    this.logger.info('7️⃣  Enter that 6-digit code in the popup');
    this.logger.info('8️⃣  Wait 30-60 seconds for connection');
    this.logger.info('');

    this.authStatus.method = 'manual-whatsapp-web';
    this.authStatus.status = 'awaiting-linking';
    this.authStatus.phone = this.config.security.superAdminPhone;
    this.authStatus.linkingStartedAt = new Date().toISOString();
    this.authStatus.instructions = {
      website: 'https://web.whatsapp.com/',
      phoneNumber: this.formatPhoneNumber(this.config.security.superAdminPhone),
      expectedCodeLength: 6
    };
    this.saveAuthStatus();

    return {
      method: 'manual-whatsapp-web',
      phone: this.formatPhoneNumber(this.config.security.superAdminPhone),
      instructions: this.getDetailedInstructions()
    };
  }

  /**
   * Format phone number to readable format
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If starts with 62, format as +62
    if (cleaned.startsWith('62')) {
      const withPlus = '+' + cleaned;
      // Format: +62 888-0723-9376
      return withPlus.replace(/(\d{3})(\d{3})(\d{4})(\d{4})/, '$1 $2-$3-$4');
    }
    
    // If starts with 0, format as 0
    if (cleaned.startsWith('0')) {
      // Format: 0888-0723-9376
      return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    
    return cleaned;
  }

  /**
   * Get detailed step-by-step instructions
   */
  getDetailedInstructions() {
    return {
      title: 'Manual WhatsApp Web Linking (Phone + Code Method)',
      method: 'For phones that cannot scan QR codes',
      steps: [
        {
          number: 1,
          title: 'Open WhatsApp Web',
          description: 'Go to https://web.whatsapp.com/ in your browser'
        },
        {
          number: 2,
          title: 'Access Settings',
          description: 'In WhatsApp Web, click the menu (3 dots) → Settings'
        },
        {
          number: 3,
          title: 'Linked Devices',
          description: 'Click on "Linked Devices"'
        },
        {
          number: 4,
          title: 'Link Device',
          description: 'Click "Link a Device" button'
        },
        {
          number: 5,
          title: 'Enter Phone Number',
          description: `Enter your phone number: ${this.formatPhoneNumber(this.config.security.superAdminPhone)}`
        },
        {
          number: 6,
          title: 'Receive Code',
          description: 'You will receive a 6-digit code via SMS or WhatsApp message'
        },
        {
          number: 7,
          title: 'Enter Code',
          description: 'Enter the 6-digit code in the popup on WhatsApp Web'
        },
        {
          number: 8,
          title: 'Wait for Connection',
          description: 'Wait 30-60 seconds for the connection to establish. The terminal will show a confirmation message.'
        }
      ],
      phone: this.formatPhoneNumber(this.config.security.superAdminPhone),
      expectedCodeLength: 6,
      timeout: '5 minutes',
      maxRetries: 3
    };
  }

  /**
   * Handle authentication success
   */
  handleAuthSuccess(phoneNumber) {
    this.logger.info('✅ WhatsApp Authentication Successful!');
    this.logger.info(`📱 Linked phone: ${this.formatPhoneNumber(phoneNumber)}`);

    this.authStatus.status = 'authenticated';
    this.authStatus.authenticatedAt = new Date().toISOString();
    this.authStatus.phone = phoneNumber;
    this.authStatus.sessionPath = this.sessionDir;
    this.saveAuthStatus();

    return {
      success: true,
      phone: this.formatPhoneNumber(phoneNumber),
      status: 'authenticated',
      message: 'Bot is now ready to receive messages!'
    };
  }

  /**
   * Handle authentication failure
   */
  handleAuthFailure(error) {
    this.logger.error('❌ WhatsApp Authentication Failed', { error: error.message });

    this.authStatus.status = 'failed';
    this.authStatus.failedAt = new Date().toISOString();
    this.authStatus.lastError = error.message;
    this.saveAuthStatus();

    this.logger.info('💡 Troubleshooting tips:');
    this.logger.info('1. Make sure your phone number is correct: ' + this.formatPhoneNumber(this.config.security.superAdminPhone));
    this.logger.info('2. Check that you have internet connection on the target device');
    this.logger.info('3. Try again - sometimes it takes 2-3 attempts');
    this.logger.info('4. If problem persists, check WhatsApp Web session in auth_info_baileys/');

    return {
      success: false,
      error: error.message,
      retryInstructions: this.getDetailedInstructions()
    };
  }

  /**
   * Get current authentication status
   */
  getStatus() {
    return {
      authenticated: this.authStatus.status === 'authenticated',
      method: this.authStatus.method,
      phone: this.formatPhoneNumber(this.authStatus.phone),
      status: this.authStatus.status,
      linkedAt: this.authStatus.authenticatedAt || null,
      sessionPath: this.authStatus.sessionPath,
      instructions: this.getDetailedInstructions()
    };
  }

  /**
   * Clear authentication and start fresh
   */
  clearAuth() {
    try {
      // Remove session files
      if (fs.existsSync(this.sessionDir)) {
        const files = fs.readdirSync(this.sessionDir);
        files.forEach(file => {
          const filePath = path.join(this.sessionDir, file);
          if (fs.statSync(filePath).isDirectory()) {
            this.removeDirectory(filePath);
          } else {
            fs.unlinkSync(filePath);
          }
        });
      }

      // Reset auth status
      this.authStatus.status = 'pending';
      this.authStatus.authenticatedAt = null;
      this.authStatus.method = this.authMethod;
      this.saveAuthStatus();

      this.logger.info('✅ Authentication cleared. Ready to authenticate again.');
      return true;
    } catch (error) {
      this.logger.error('Failed to clear authentication', { error: error.message });
      return false;
    }
  }

  /**
   * Helper to remove directory recursively
   */
  removeDirectory(dir) {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        const curPath = path.join(dir, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          this.removeDirectory(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dir);
    }
  }

  /**
   * Export auth status to file
   */
  exportStatus(filename = 'whatsapp-auth-status-export.json') {
    try {
      fs.writeFileSync(filename, JSON.stringify(this.authStatus, null, 2));
      this.logger.info(`Auth status exported to ${filename}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to export auth status', { error: error.message });
      return false;
    }
  }
}

module.exports = WhatsAppAuthHelper;
