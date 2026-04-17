module.exports = {
  apps: [
    {
      name: 'jarvis-bot',
      script: './index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      
      // Auto restart
      watch: false,
      ignore_watch: ['node_modules', 'conversation_history.json', 'user_stats.json', 'auth_info_baileys'],
      max_memory_restart: '500M',
      
      // Error handling
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart policy
      min_uptime: '10s',
      max_restarts: 50,
      autorestart: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      shutdown_with_message: true,
      
      // Auto start on boot (macOS/Linux)
      // Uncomment untuk enable (requires: pm2 startup)
      // instances: 'max',
    }
  ]
};
