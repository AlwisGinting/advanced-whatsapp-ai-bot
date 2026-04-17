# ⚡ QUICKSTART - Jarvis Bot v2.0

Panduan cepat untuk mulai menggunakan Jarvis Bot.

## 🚀 Setup (5 menit)

### 1. Clone atau Install
```bash
# Clone dari GitHub
git clone https://github.com/YOUR_USERNAME/jarvis-whatsapp-bot.git
cd jarvis-whatsapp-bot

# Atau setup dari scratch
npm install
cp .env.example .env
```

### 2. Configure API Key
```bash
# Edit .env dan masukkan OpenAI API key Anda
nano .env

# Atau gunakan config.json untuk custom settings
nano config.json
```

### 3. Start Bot dengan PM2
```bash
npm run pm2:start
```

### 4. Verify Running
```bash
npm run pm2:status
```

Output:
```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ jarvis-bot         │ fork     │ 0    │ online    │ 0%       │ 105mb    │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

## 💬 Test Bot

1. **Buka WhatsApp** di nomor 082166508268
2. **Chat dari nomor lain** dengan: "Halo Jarvis"
3. **Bot balas**: "👋 Halo! Saya Jarvis, AI assistant Anda. Ada yang bisa saya bantu?"
4. **Chat normal** - bot akan respons 🤖

## 🔧 PM2 Commands

```bash
# Start
npm run pm2:start

# Stop
npm run pm2:stop

# Restart (after code update)
npm run pm2:restart

# View logs
npm run pm2:logs

# Monitor (live)
pm2 monit

# Status
npm run pm2:status
```

## 🔄 Update Code

```bash
# 1. Edit code (index.js, config.json, etc)

# 2. Restart bot
npm run pm2:restart

# 3. Check logs
npm run pm2:logs
```

## 📤 Push ke GitHub

```bash
# 1. Add changes
git add .

# 2. Commit
git commit -m "feat: add new feature"

# 3. Push
git push origin main
```

## ⚠️ Common Issues

### Bot tidak respons
```bash
# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart
npm run pm2:restart
```

### Need to rescan QR
```bash
# Stop bot
npm run pm2:stop

# Delete session
rm -rf auth_info_baileys/

# Start bot
npm run pm2:start

# Scan QR from terminal
npm run pm2:logs
```

### High memory usage
```bash
# Restart bot
npm run pm2:restart

# Monitor live
pm2 monit
```

## 📚 Full Documentation

- **[README.md](README.md)** - Overview & features
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment
- **[GITHUB_SETUP.md](GITHUB_SETUP.md)** - GitHub instructions

## 🎯 Next Steps

1. ✅ Bot running dengan PM2
2. ✅ Tested via WhatsApp  
3. [ ] Push ke GitHub (baca [GITHUB_SETUP.md](GITHUB_SETUP.md))
4. [ ] Setup auto-start on boot (baca [DEPLOYMENT.md](DEPLOYMENT.md))
5. [ ] Customize bot personality (edit config.json)
6. [ ] Monitor & maintain (npm run pm2:logs)

---

**Status**: ✅ Bot Running  
**Version**: 2.0.0  
**Last Updated**: April 17, 2026

Need help? Check the detailed guides above 👆
