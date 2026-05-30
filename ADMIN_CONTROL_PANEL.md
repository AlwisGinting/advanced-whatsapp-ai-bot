# 🔐 Super Admin Control Panel

## Perubahan Terbaru

✅ **Nomor Admin Diperbarui:**
- ❌ Nomor lama: 088807239376 (dihapus)
- ✅ Nomor baru: 088807239376 (SUPER_ADMIN baru)

---

## 📱 Super Admin Commands

Chat ke bot dari nomor **088807239376** untuk menjalankan perintah admin:

### 1️⃣ **Update Script**
```
!update:update-script:filename.js:code_content
```
**Contoh:**
```
!update:update-script:custom-handler.js:async function handle() { console.log('test'); }
```

### 2️⃣ **Create Script Baru**
```
!update:create-script:filename.js:code_content
```

### 3️⃣ **Restart Bot**
```
!update:restart
```
Bot akan di-restart otomatis dalam beberapa detik.

### 4️⃣ **Install Package NPM**
```
!update:install-package:package-name
```
**Contoh:**
```
!update:install-package:axios
```

### 5️⃣ **Lihat Backup Files**
```
!update:list-backups
```
Menampilkan daftar backup files yang tersimpan.

### 6️⃣ **Restore dari Backup**
```
!update:restore-backup:backup-filename
```
Mengembalikan file dari backup otomatis.

### 7️⃣ **Bot Status**
```
!status
```
Melihat status bot real-time (uptime, jumlah pesan, errors, dll).

### 8️⃣ **Clear History**
```
!clear-history
```
Menghapus semua conversation history.

### 9️⃣ **Help**
```
!help
```
Menampilkan daftar lengkap commands.

---

## 🔒 Security Features

✅ **Only Super Admin Access** (088807239376)
- Hanya nomor admin yang bisa jalankan commands
- Semua aksi di-log untuk audit trail

✅ **Code Validation**
- Detect dangerous patterns (eval, exec, fs.writeFileSync di system path, dll)
- Path traversal prevention
- Automatic backup sebelum update

✅ **Backup System**
- Automatic backup setiap kali ada update
- Bisa restore kapan saja ke versi sebelumnya
- Backup disimpan di folder `./updates/`

---

## 📝 Contoh Workflow Update

### Scenario: Menambah fitur baru via chat

**User (088807239376):**
```
!update:create-script:welcome-handler.js:
const handleWelcome = async (userId) => {
  console.log(`Welcoming ${userId}`);
  return "Halo! Selamat datang.";
};
module.exports = handleWelcome;
```

**Bot Response:**
```
✅ File welcome-handler.js berhasil dibuat (156 bytes)
```

**User:**
```
!update:restart
```

**Bot Response:**
```
🔄 Bot sedang di-restart...
```

**Bot kembali online dalam 5 detik dengan fitur baru!**

---

## 🛡️ Proteksi Keamanan

### Dangerous Code Detection
Kode dengan operasi berbahaya akan di-reject:
- ❌ `require('child_process')`
- ❌ `exec()` / `spawn()` / `fork()`
- ❌ `eval()` / `Function()`
- ❌ `process.exit()`
- ❌ Akses langsung ke filesystem di path sistem

### Path Traversal Prevention
Tidak bisa:
```javascript
// ❌ TIDAK BISA
!update:../../../etc/passwd:code

// ✅ HANYA BISA
!update:my-script.js:code
```

---

## 📊 Monitoring

### View Bot Metrics
```
!status
```

Output:
```
📊 Bot Status:
━━━━━━━━━━━━━━━━━━━━━
🟢 Status: ONLINE
⏱️  Uptime: 120 menit
💬 Total Pesan: 256
❌ Errors: 2
⚠️  Warnings: 5
📝 Info Logs: 128
🐛 Debug Logs: 64
━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔄 Backup Management

### List All Backups
```
!update:list-backups
```

Output:
```
Found 3 backup files:
1. handler.js.backup.1714521600000
2. config.js.backup.1714521300000
3. index.js.backup.1714521000000
```

### Restore File
```
!update:restore-backup:handler.js.backup.1714521600000
```

Response:
```
✅ File handler.js berhasil di-restore dari backup
```

---

## 📝 Audit Log

Semua aktivitas super admin di-log di `bot.log`:

```
[2025-03-28T10:15:42.123Z] [info] 🔒 Super Admin Command Executed
Command: !update:restart
User: 6288807239376
Result: { success: true, message: '🔄 Bot sedang di-restart...' }
```

---

## ⚠️ Important Notes

1. **Backup Otomatis**: Setiap kali ada update, file lama otomatis di-backup
2. **Timeout**: Install package timeout 60 detik
3. **Restart Otomatis**: Pastikan bot berjalan dengan PM2 untuk auto-restart jika crash
4. **Logs**: Cek `bot.log` untuk troubleshooting
5. **Testing**: Test script di development dulu sebelum deploy ke production

---

## 🚀 Quick Start Setup

1. Bot sudah siap dengan update manager
2. Chat dari **088807239376** (nomor admin baru)
3. Mulai dengan `!help` untuk melihat semua commands
4. Gunakan `!status` untuk monitor bot

---

## 🆘 Troubleshooting

### Bot tidak merespons command
- ✅ Pastikan chat dari nomor **088807239376**
- ✅ Command harus dimulai dengan `!`
- ✅ Lihat `bot.log` untuk error details

### Update fail dengan "Path traversal terdeteksi"
- ✅ Jangan gunakan path dengan `/` atau `../`
- ✅ Hanya gunakan nama file langsung: `script.js`

### Restore backup tidak bekerja
- ✅ Lihat list backup dulu: `!update:list-backups`
- ✅ Gunakan nama file yang tepat dari list
- ✅ Pastikan file masih ada di folder `./updates/`

---

**Last Updated**: 2025-04-30
**Version**: 5.2 with Bot Update Manager
