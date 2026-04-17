# 🚀 Deployment Guide - Jarvis Bot v2.0

Panduan lengkap untuk deploy Jarvis Bot ke GitHub dan menjalankan sebagai service yang persistent.

## 📦 GitHub Setup

### 1. Clone Repository (First Time)
```bash
cd /path/to/your/workspace
git clone https://github.com/YOUR_USERNAME/jarvis-whatsapp-bot.git
cd jarvis-whatsapp-bot
```

### 2. Setup Variables
```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dengan API key Anda
nano .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Create GitHub Repo
```bash
# Login ke GitHub dan create new repository
# Atau gunakan GitHub CLI:
gh repo create jarvis-whatsapp-bot --public

# Add remote dan push
git remote add origin https://github.com/YOUR_USERNAME/jarvis-whatsapp-bot.git
git branch -M main
git push -u origin main
```

## 🔄 Persistent Bot dengan PM2

### Apa itu PM2?
PM2 adalah process manager yang akan:
- ✅ Auto-restart bot jika crash
- ✅ Keep running di background
- ✅ Auto-start on system boot (optional)
- ✅ Monitor memory & CPU usage
- ✅ Log management otomatis

### Setup PM2

#### 1. Install PM2 (Global)
```bash
npm install -g pm2
```

#### 2. Start Bot dengan PM2
```bash
# Menggunakan ecosystem.config.js
npm run pm2:start

# Atau manual:
pm2 start ecosystem.config.js
```

#### 3. Verifikasi Status
```bash
npm run pm2:status

# Atau lihat logs:
npm run pm2:logs
```

#### 4. Setup Auto-Start on Boot (OPTIONAL)
```bash
# Hanya untuk production server (Ubuntu/Linux/macOS)
npm run pm2:startup

# Setelah itu, save:
pm2 save

# Untuk restart system:
# pm2 resurrect  (auto-run saat system boot)
```

### PM2 Commands

```bash
# Start bot
npm run pm2:start

# Stop bot
npm run pm2:stop

# Restart bot
npm run pm2:restart

# View logs
npm run pm2:logs

# Check status semua process
npm run pm2:status

# Delete dari PM2
npm run pm2:delete

# Monitor (live dashboard)
pm2 monit
```

## 📝 Git Workflow

### Push Update ke GitHub
```bash
# 1. Check status
git status

# 2. Add files
git add .
# Atau specific files:
git add index.js config.json

# 3. Commit
git commit -m "fix: improve error handling"

# 4. Push ke GitHub
git push origin main
```

### Pull Update dari GitHub
```bash
git pull origin main
npm install  # jika ada dependency baru
npm run pm2:restart  # restart bot
```

## 🔐 Security Best Practices

1. **Jangan commit sensitive data:**
   - ❌ API keys
   - ❌ Session files
   - ❌ Private credentials
   
   Gunakan `.env` dan `.gitignore`

2. **Environment Variables:**
   ```bash
   # .env (jangan di-commit)
   OPENAI_API_KEY=sk-proj-xxx
   
   # Akses di code:
   require('dotenv').config();
   const apiKey = process.env.OPENAI_API_KEY;
   ```

3. **.gitignore includes:**
   - `node_modules/`
   - `.env`
   - `auth_info_baileys/`
   - `*.log`
   - `conversation_history.json`

## 🐛 Troubleshooting

### Bot tidak restart otomatis
```bash
# Check PM2 status
pm2 status

# View error logs
npm run pm2:logs

# Manual restart
npm run pm2:restart
```

### Cannot connect setelah update
```bash
# Clear session dan rescan QR
rm -rf auth_info_baileys/

# Restart PM2
npm run pm2:restart

# Check logs hingga QR muncul
npm run pm2:logs
```

### Memory leak/Bot slow
```bash
# Check memory usage
pm2 monit

# Restart bot
npm run pm2:restart

# Jika terus leak, check conversation_history.json size
du -sh conversation_history.json
```

## 📊 Monitoring

### Real-time Monitoring
```bash
pm2 monit
```

### View Logs
```bash
npm run pm2:logs

# Last 100 lines:
pm2 logs jarvis-bot --lines 100

# Follow real-time:
pm2 logs jarvis-bot --follow
```

### Stats
```bash
npm run pm2:status
```

## 🔄 Update Bot dari GitHub

```bash
# 1. Pull latest code
git pull origin main

# 2. Install new dependencies
npm install

# 3. Restart bot
npm run pm2:restart

# 4. Check logs
npm run pm2:logs
```

## 📱 Test Bot

Setelah setup selesai:

1. **Buka WhatsApp** di nomor 082166508268
2. **Chat dari nomor lain** dengan: "Halo Jarvis"
3. **Bot harus reply** dengan greeting message
4. **Lanjut chat** - bot akan respons sesuai AI

## 🎯 Production Checklist

- [ ] API key sudah di `.env`
- [ ] `.env` tidak di-commit di GitHub
- [ ] PM2 sudah running (`npm run pm2:status`)
- [ ] Logs tidak ada error (`npm run pm2:logs`)
- [ ] Bot respons normal
- [ ] `config.json` sudah ter-optimize
- [ ] Rate limiting enabled
- [ ] GitHub repo sudah public (optional)

## 📞 Support

Jika ada masalah:
1. Check `bot.log` - detail error
2. View PM2 logs - `npm run pm2:logs`
3. Check config.json - settings benar?
4. Test manual - `npm start`
5. Check GitHub issues - solusi existing

---

**Version**: 2.0.0  
**Last Updated**: April 17, 2026  
**Status**: Production Ready
