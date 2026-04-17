# 🚀 Petunjuk Upload ke GitHub

Berikut langkah-langkah lengkap untuk upload Jarvis Bot ke GitHub.

## 📋 Prerequisites

- GitHub account (buat di https://github.com)
- Git terinstall di komputer

## ✅ Step-by-Step

### 1. Create GitHub Repository

**Option A: Via Website**
1. Buka https://github.com/new
2. Repository name: `jarvis-whatsapp-bot`
3. Description: `AI WhatsApp Bot dengan ChatGPT & Baileys`
4. Pilih: **Public** (agar bisa dishare)
5. Click **Create repository**

**Option B: Via GitHub CLI**
```bash
# Install GitHub CLI: https://cli.github.com
gh auth login
gh repo create jarvis-whatsapp-bot --public --description "AI WhatsApp Bot dengan ChatGPT & Baileys"
```

### 2. Connect Local Repo ke GitHub

```bash
# Go to project directory
cd "/Users/nusanet/Library/Mobile Documents/com~apple~CloudDocs/ai bot"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/jarvis-whatsapp-bot.git

# Rename branch ke main (opsional, GitHub default)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 3. Verify Upload

1. Buka https://github.com/YOUR_USERNAME/jarvis-whatsapp-bot
2. Pastikan semua file sudah ter-upload
3. Jangan ada file `.env` atau `auth_info_baileys/` (auto-ignored)

## 📝 Update ke GitHub

Setiap kali ada perubahan:

```bash
# 1. Check status
git status

# 2. Add perubahan
git add .

# 3. Commit dengan message
git commit -m "feat: add new feature" 
# atau
git commit -m "fix: bug on rate limiting"

# 4. Push ke GitHub
git push origin main
```

## 🔗 Sharing Repository

Setelah upload, Anda bisa share link ke orang lain:
- URL: `https://github.com/YOUR_USERNAME/jarvis-whatsapp-bot`
- Orang lain bisa clone dengan: `git clone https://github.com/YOUR_USERNAME/jarvis-whatsapp-bot.git`

##💻 Clone di Komputer Lain

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/jarvis-whatsapp-bot.git
cd jarvis-whatsapp-bot

# Setup environment
cp .env.example .env
nano .env  # Edit dengan API key

# Install & run
npm install
npm run pm2:start
```

## 🔐 Important: Jangan Upload

- ❌ `.env` (sensitive data)
- ❌ `auth_info_baileys/` (session)  
- ❌ `node_modules/` (auto-ignore)
- ❌ Log files (auto-ignore)

Semuanya sudah di `.gitignore` ✅

## 📊 FAQ

**Q: Gimana cara update file yang sudah di-push?**
A: Edit file, lalu:
```bash
git add file.js
git commit -m "update: deskripsi perubahan"
git push origin main
```

**Q: Gimana jika ada conflict?**
A: 
```bash
git pull origin main  # Pull latest
# Fix conflict manually
git add .
git commit -m "merge: resolve conflicts"
git push origin main
```

**Q: Bisa di-keep private?**
A: Saat create repo, pilih **Private** instead of Public

## ✨ GitHub Pages (Bonus)

Jika mau dokumentasi web:
1. Settings > Pages
2. Source: Deploy from branch
3. Branch: main, folder: docs
4. Automatic deployment dari GitHub

---

**Selesai! 🎉 Bot Anda sekarang di GitHub!**

Untuk instruksi deployment & PM2, baca: [DEPLOYMENT.md](DEPLOYMENT.md)
