# 📖 Panduan Singkat Perintah Jarvis Bot v3.0

## 🎯 Perintah Umum (Semua User)

| Perintah | Fungsi | Contoh |
|----------|--------|--------|
| `/help` atau `/bantuan` | Tampilkan bantuan | `/help` |
| `/status` | Status sistem real-time | `/status` |
| `/role` atau `/info_user` | Info role user saat ini | `/role` |

---

## 🔍 Perintah Pencarian & Riwayat (ADMIN+)

| Perintah | Fungsi | Contoh |
|----------|--------|--------|
| `/cari <keyword>` | Cari chat by keyword | `/cari laporan` |
| `/tanggal YYYY-MM-DD` | Cari chat by tanggal | `/tanggal 2025-03-15` |
| `/statistik` | Lihat statistik percakapan | `/statistik` |

---

## 📁 Perintah File & Folder (ADMIN+)

| Perintah | Fungsi | Batasan | Contoh |
|----------|--------|---------|--------|
| `/buat_file <path> <content>` | Buat file baru | Perlu permission | `/buat_file data.txt "Hello"` |
| `/lihat_file <path>` | Baca file | Max 1000 chars | `/lihat_file config.json` |
| `/buat_folder <path>` | Buat folder | Recursive ok | `/buat_folder logs/2025` |
| `/list_files <path>` | List file di folder | - | `/list_files ./` |
| `/hapus_file <path>` | Hapus file | ⚠️ Perlu approval | `/hapus_file penting.txt` |

---

## ⚙️ Perintah Konfigurasi (SUPER_ADMIN)

| Perintah | Fungsi | Contoh |
|----------|--------|--------|
| `/ubah_setting <path> <value>` | Ubah config | `/ubah_setting openai.temperature 0.8` |

---

## 👥 Perintah Manajemen User (SUPER_ADMIN)

| Perintah | Fungsi | Contoh |
|----------|--------|--------|
| `/set_role <phone> <role>` | Assign role ke user | `/set_role 082123456789 ADMIN` |
| `/list_users` | Lihat daftar semua user | `/list_users` |
| `/remove_role <phone>` | Hapus role (kembali GUEST) | `/remove_role 082123456789` |

---

## ⏳ Perintah Approval (SUPER_ADMIN)

| Perintah | Fungsi | Contoh |
|----------|--------|--------|
| `/pending_approvals` | Lihat permohonan pending | `/pending_approvals` |
| `/setuju <requestId>` | Setujui permohonan | `/setuju abc123def456` |
| `/tolak <requestId>` | Tolak permohonan | `/tolak abc123def456` |

---

## 🎖️ Role Permissions Matrix

### SUPER_ADMIN (088807239376) - Priority 1000
✅ Semua permissions tanpa perlu approval

### ADMIN - Priority 500
✅ Read/Write/Delete data
✅ Execute system commands
✅ Create/Delete files
✅ View all history
✅ View confidential
❌ Manage users (perlu approval)
❌ Change settings (perlu approval)

### TRUSTED_USER - Priority 100
✅ Read/Write data
✅ View history pribadi
❌ Delete data
❌ File operations
❌ View all history

### USER - Priority 10
✅ Read data
✅ View own history
❌ Write data
❌ Delete data
❌ File operations

### GUEST - Priority 1
✅ Limited read only
❌ Hampir semua operasi

---

## 🚨 Operasi Sensitif yang Memerlukan Approval

1. ❌ Delete file/data
2. ❌ Manage users
3. ❌ Change settings
4. ❌ Execute system commands (untuk non-admin)
5. ❌ View confidential data (untuk non-admin)

*Hanya SUPER_ADMIN yang tidak perlu approval*

---

## 💡 Tips & Tricks

### Untuk Mencari Chat Lama
```
/cari "keyword spesifik"
/tanggal 2024-12-25
/statistik
```

### Untuk Membuat Struktur Folder
```
/buat_folder backups/2025-03
/list_files backups/
```

### Untuk Monitoring Sistem
```
/status                 # Status real-time
/pending_approvals     # Cek permohonan
/list_users            # Cek semua user
```

### Untuk Manage Config
```
/ubah_setting bot.name "Jarvis Pro"
/ubah_setting rateLimit.dailyLimit 1000
```

---

## ⚠️ Yang Harus Diingat

1. **Path Validation**: Jangan gunakan `..` atau `/` di path
2. **File Security**: Sensitive files akan di-mask jika tidak punya permission
3. **Approval Timeout**: Request expired dalam 5 menit
4. **Rate Limit**: Max 30 pesan/menit, 500 pesan/hari
5. **Auto-Backup**: Backup dibuat setiap jam otomatis
6. **Super Admin Only**: Hanya 088807239376 yang punya akses penuh

---

## 🔐 Keamanan Data

**Secure Fields** (hanya SUPER_ADMIN lihat):
- password
- token
- secret
- apiKey
- privateKey
- credentials

Jika user tanpa permission mencoba akses: `***CONFIDENTIAL***`

---

## 📞 Emergency

**Ada masalah?** Hubungi SUPER_ADMIN: 088807239376

**Butuh bantuan?** Ketik `/help` atau `/bantuan`

---

## 📈 System Limits

| Limit | Value |
|-------|-------|
| Messages per minute | 30 |
| Messages per day | 500 |
| Max history per chat | 20 |
| Approval timeout | 5 menit |
| Auto-backup interval | 1 jam |
| Auto-save interval | 5 menit |
| Max file preview | 1000 chars |

---

## 🔄 Workflow Approval Lengkap

```
1. User sends protected command
2. System checks permission
3. If no permission → Create approval request
4. Send notification to SUPER_ADMIN
5. SUPER_ADMIN reviews & decide
6. /setuju atau /tolak
7. System logs decision
8. Execute atau reject operation
9. Notify user about result
```

---

## 📊 Contoh Command

### Search Examples
```
/cari "laporan kuartal"
/tanggal 2025-03-15
/cari "order" 
/tanggal 2024-12-01
```

### File Management Examples
```
/buat_folder reports/2025/Q1
/buat_file reports/summary.txt "Q1 Summary Report"
/lihat_file reports/summary.txt
/list_files reports/
```

### User Management Examples
```
/set_role 089512345678 ADMIN
/list_users
/remove_role 089512345678
```

### Status Check Examples
```
/status
/statistik
/pending_approvals
/role
```

---

*Last Updated: 27 April 2026*
*Jarvis Bot v3.0.0 Enhanced Edition*
