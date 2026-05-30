# 🚀 Setup Guide - Jarvis Bot v3.0 Enhanced

## ✅ Checklist Instalasi

- [ ] Node.js v14+ sudah terinstall
- [ ] npm sudah tersedia
- [ ] OpenAI API key siap
- [ ] Nomor WhatsApp untuk Jarvis

---

## 📥 Langkah 1: Install Dependencies

```bash
# Masuk ke folder project
cd "ai bot"

# Install semua dependencies
npm install

# Dependencies yang akan diinstall:
# - openai@^4.0.0           (ChatGPT integration)
# - whatsapp-web.js@^1.34.6 (WhatsApp automation)
# - qrcode-terminal@^0.12.0 (QR code display)
# - uuid@^9.0.0             (Approval request IDs)
# - pm2@^6.0.14             (Process manager)
```

---

## 🔧 Langkah 2: Konfigurasi System

### Edit config.json

```json
{
  "openai": {
    "apiKey": "sk-proj-YOUR_API_KEY_HERE",  // ← Ganti dengan API key Anda
    "model": "gpt-3.5-turbo",
    "maxTokens": 100,
    "maxTokensAI": 140,
    "temperature": 0.7
  },
  "bot": {
    "name": "Jarvis",
    "owner": "Alwis",
    "ownerPhone": "088807239376",  // ← SUPER_ADMIN (jangan ubah)
    "maxHistoryPerChat": 20,
    "typingDelay": 1000,
    "responseTimeout": 30000
  },
  "security": {
    "superAdminPhone": "088807239376",  // ← SUPER_ADMIN
    "enableApprovalWorkflow": true,
    "approvalTimeout": 300000,
    "logAllAccess": true,
    "enableSystemCommands": true,
    "enableFileOperations": true
  },
  "rateLimit": {
    "enabled": true,
    "messagesPerMinute": 30,
    "dailyLimit": 500
  },
  "features": {
    "enhancedHistory": true,
    "dateBasedSearch": true,
    "fullTextSearch": true,
    "contentIndexing": true,
    "autoBackup": true,
    "backupInterval": 3600000
  }
}
```

### Hal Penting:
- **API Key**: Dapatkan dari https://platform.openai.com/api-keys
- **superAdminPhone**: HARUS "088807239376" (Anda)
- **enableApprovalWorkflow**: true untuk keamanan maksimal

---

## 📱 Langkah 3: Setup WhatsApp Connection

### First Time Setup:

```bash
# Start bot untuk pertama kali
npm start

# Akan muncul:
# "📱 QR Code received - Scan dengan WhatsApp Web"
# [QR Code akan ditampilkan di terminal]
```

### Scan QR Code:

1. Buka **WhatsApp di HP Anda**
2. Buka **Settings → Linked Devices → Link a Device**
3. **Scan QR Code** yang muncul di terminal
4. Tunggu "✅ Jarvis Bot is ready!"

```
Terminal Output:
[2025-03-27T10:30:45.123Z] [info] 📱 QR Code received - Scan dengan WhatsApp Web
[QR CODE DISPLAYED]
[2025-03-27T10:31:12.456Z] [info] ✅ Jarvis Bot is ready!
[2025-03-27T10:31:12.789Z] [info] 🔐 RBAC System Active - Super Admin: 088807239376
```

**Session akan disimpan di folder `auth_info_baileys/` (auto-reconnect)**

---

## 🎯 Langkah 4: Test Bot

### Test 1: Basic Response
```
Chat ke nomor Jarvis:
"Halo, siapa nama kamu?"

Expected Response:
"Jarvis, AI bot Alwis di WhatsApp..."
```

### Test 2: Check Your Role
```
/role

Expected Response:
👤 *Info User*

Phone: <nomor_anda>
Role: SUPER_ADMIN
Priority: 1000
Permissions: 12

📋 Permissions:
• read_data
• write_data
...
```

### Test 3: Check System Status
```
/status

Expected Response:
🤖 *Status Sistem*

Uptime: 123s
Memory: 45MB
Node: v16.13.0
Platform: darwin

Role: SUPER_ADMIN
Priority: 1000
```

---

## 👥 Langkah 5: Setup User Roles

### Assign Role ke User Lain:

```bash
# Misal: Kasih role ADMIN ke 089512345678

Di WhatsApp (dari SUPER_ADMIN):
/set_role 089512345678 ADMIN

Expected Response:
✅ Role pengguna 089512345678 diubah menjadi ADMIN
```

### List Semua User:

```bash
/list_users

Expected Response:
👥 *Daftar Pengguna* (2)

1. 088807239376
   Role: SUPER_ADMIN
   Priority: 1000

2. 089512345678
   Role: ADMIN
   Priority: 500
```

---

## 🔒 Langkah 6: Test Security Features

### Test Approval Workflow:

```bash
# User non-admin coba hapus file:
# (dari user yang role-nya bukan SUPER_ADMIN)
/hapus_file penting.txt

Expected Response:
⚠️ Operasi ini membutuhkan persetujuan dari admin.
Request ID: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6

# SUPER_ADMIN akan lihat:
🔐 *PERMOHONAN AKSES SISTEM*

ID: a1b2c3d4...
Dari: 089512345678
Operasi: delete_files
Data: {"filePath":"penting.txt"}

Balas dengan:
✅ SETUJU a1b2c3d4
❌ TOLAK a1b2c3d4

# Jawab dengan:
/setuju a1b2c3d4

# User akan dapat notifikasi:
✅ Operasi disetujui! File dihapus.
```

---

## 📁 Langkah 7: Test File Operations

### Create File:

```bash
/buat_file test.txt "Hello World"

Expected Response:
✅ File berhasil dibuat: test.txt
```

### List Files:

```bash
/list_files ./

Expected Response:
📁 *Folder: .*

File (15):
• index.js
• package.json
• config.json
• rbac-manager.js
• security-manager.js
• system-commands.js
• enhanced-history.js
...
```

### Read File:

```bash
/lihat_file config.json

Expected Response:
📄 *File: config.json*

```
{
  "openai": {
    "apiKey": "sk-proj-...",
    ...
  }
}
```

Ukuran: 2456 bytes
```

---

## 🔍 Langkah 8: Test Search Features

### Search by Keyword:

```bash
/cari "laporan"

Expected Response:
🔍 *Hasil Pencarian: "laporan"* (3)

1. Laporan bulanan sudah selesai, silakan di...
   📅 2025-03-15T10:30:00Z

2. Tolong buatkan laporan penjualan Q1...
   📅 2025-03-10T14:20:00Z

3. Laporan tahunan sudah disiapkan...
   📅 2025-02-28T09:45:00Z
```

### Search by Date:

```bash
/tanggal 2025-03-15

Expected Response:
📅 *Percakapan pada 2025-03-15*

Total: 12 pesan

• Pagi, bagaimana progres proyek?
• Sudah 80% selesai...
• Laporan sudah siap...
```

### View Statistics:

```bash
/statistik

Expected Response:
📊 *Statistik Percakapan*

Total Chat: 5
Total Pesan: 247
Rata-rata per Chat: 49

🔝 *Top Chats*:
1. 089512345678: 85 pesan
2. 085612345678: 62 pesan
3. 081912345678: 45 pesan
```

---

## 🚀 Langkah 9: Production Deployment (Optional)

### Gunakan PM2 untuk Production:

```bash
# Install PM2 globally (jika belum)
npm install -g pm2

# Start dengan PM2
npm run pm2:start

# Output:
# ✓ App [jarvis-bot] started (pid=1234)

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart
npm run pm2:restart

# Stop
npm run pm2:stop
```

### Setup Auto-start (Optional):

```bash
# Make bot start on system reboot
npm run pm2:startup

# Save configuration
pm2 save
```

---

## 📊 Langkah 10: Monitoring

### Check Logs:

```bash
# Last 50 lines
tail -50 bot.log

# Realtime logs
tail -f bot.log

# Security logs
tail -f security-audit.log

# Commands history
cat commands-history.json | jq
```

### Monitor Backups:

```bash
# Check backups folder
ls -lah backups/

# File size
du -sh backups/
```

### Monitor Storage:

```bash
# Bot folder size
du -sh ./

# User roles
cat user_roles.json

# Security audit
wc -l security-audit.log
```

---

## ✨ Features to Try First

### 1. Basic Chat
- Chat dengan Jarvis seperti biasa
- Bot akan respond dengan AI

### 2. Role-Based Access
- `/role` - check role Anda
- `/list_users` - list semua user

### 3. Enhanced History
- `/cari keyword` - search chat
- `/statistik` - lihat stats
- `/tanggal YYYY-MM-DD` - search by date

### 4. File Operations (ADMIN+)
- `/buat_file` - create file
- `/lihat_file` - read file
- `/list_files` - list directory

### 5. Security Features (SUPER_ADMIN)
- `/pending_approvals` - lihat pending
- `/setuju` - approve request
- `/tolak` - reject request
- `/set_role` - assign role

---

## 🐛 Troubleshooting

### Bot tidak koneksi WhatsApp
```bash
# 1. Check logs
npm run pm2:logs

# 2. Delete session dan scan ulang
rm -rf auth_info_baileys/

# 3. Restart
npm run pm2:restart
```

### OpenAI API error
```bash
# 1. Verify API key di config.json
# 2. Check quota: https://platform.openai.com
# 3. Restart bot
npm run pm2:restart
```

### Rate limit error
```
Decrease requests atau upgrade OpenAI plan
Atau ubah config.json:
"messagesPerMinute": 15  // dari 30
"dailyLimit": 250        // dari 500
```

### Permission denied error
```
User needs higher role:
/set_role <phone> ADMIN

Atau grant specific permission di config.json
```

---

## 🎓 Selanjutnya

1. **Customize Responses** - Edit system prompts di index.js
2. **Add New Commands** - Extend handleSpecialCommands function
3. **Integrate Database** - Replace JSON dengan MongoDB/PostgreSQL
4. **Setup Dashboard** - Build web interface untuk monitoring
5. **Scale to Multiple Bots** - Clone setup dengan nomor berbeda

---

## 📞 Support

- **Issue Teknis**: Lihat logs dengan `npm run pm2:logs`
- **Permission Error**: Check role di `/list_users`
- **Search Problem**: Verify chat history dengan `/statistik`
- **Contact SUPER_ADMIN**: 088807239376

---

## ✅ Selesai!

Bot sudah siap untuk production. 

**Next Steps:**
1. ✅ Invite user ke chat
2. ✅ Assign role dengan `/set_role`
3. ✅ Monitor dengan `/pending_approvals`
4. ✅ Enjoy enhanced features!

---

*Documentation v1.0 - 27 April 2026*
*Jarvis Bot Enhanced v3.0.0*
