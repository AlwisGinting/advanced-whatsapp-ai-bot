# 🤖 Jarvis Bot Enhanced v3.0.0

## Fitur-Fitur Utama

### 1. 🔐 Role-Based Access Control (RBAC)
Sistem kontrol akses berbasis peran yang komprehensif dengan 5 level akses:

#### Peran (Roles):
- **SUPER_ADMIN** (Priority: 1000) - Akses penuh, hanya 088807239376
- **ADMIN** (Priority: 500) - Manajemen data dan file
- **TRUSTED_USER** (Priority: 100) - Baca-tulis data terbatas
- **USER** (Priority: 10) - Akses dasar dan riwayat pribadi
- **GUEST** (Priority: 1) - Akses terbatas read-only

#### Permissions:
- `read_data` - Membaca data
- `write_data` - Menulis data
- `delete_data` - Menghapus data
- `manage_users` - Kelola user roles
- `manage_settings` - Ubah konfigurasi sistem
- `execute_system_commands` - Jalankan perintah sistem
- `create_files` - Buat file/folder
- `delete_files` - Hapus file
- `view_all_history` - Lihat semua riwayat chat
- `view_confidential` - Lihat data sensitif
- `approve_requests` - Setujui permohonan akses
- `manage_roles` - Kelola role sistem

### 2. 🛡️ Security Manager (Approval Workflow)
Sistem approval otomatis untuk operasi sensitif yang memerlukan konfirmasi dari SUPER_ADMIN (088807239376).

**Fitur:**
- Approval request dengan timeout 5 menit
- Automatic logging semua akses
- Tracking unauthorized attempts
- Audit trail lengkap

### 3. 📁 System Commands Handler
Manajemen file dan folder langsung dari WhatsApp.

**Perintah:**
```
/buat_file <path> <content>     - Buat file baru
/hapus_file <path>              - Hapus file
/lihat_file <path>              - Lihat isi file (preview)
/buat_folder <path>             - Buat folder baru
/list_files <path>              - List file di folder
/ubah_setting <path> <value>    - Ubah konfigurasi
/status_sistem                  - Status sistem
```

**Keamanan:**
- Validasi path (prevent directory traversal)
- Permission-based access
- Automatic command logging
- Error handling yang aman

### 4. 📚 Enhanced History Manager
Sistem riwayat percakapan canggih dengan pencarian mendalam.

**Fitur Pencarian:**

#### Full-Text Search
```
/cari <keyword>
```
Cari pesan berdasarkan kata kunci di seluruh chat history.

#### Date-Based Search
```
/tanggal YYYY-MM-DD
```
Lihat semua percakapan pada tanggal spesifik.

#### Advanced Search
```
/statistik
```
Dapatkan statistik lengkap percakapan.

**Search Capabilities:**
- Pencarian di pesan lama (bertahun-tahun lalu)
- Index full-text otomatis
- Filter by date, keyword, role, length
- Search by year across all history
- Trends analysis

### 5. 👥 User Management
Manajemen pengguna dengan role assignment dan monitoring.

**Perintah Admin:**
```
/set_role <phone> <role>        - Assign role ke user
/list_users                     - Lihat daftar semua user
/info_user                      - Info role user saat ini
```

### 6. ⏳ Approval System
Workflow persetujuan otomatis untuk operasi sensitif.

**Perintah Super Admin:**
```
/pending_approvals              - Lihat permohonan pending
/setuju <requestId>             - Setujui permohonan
/tolak <requestId>              - Tolak permohonan
```

**Proses Approval:**
1. User mencoba operasi sensitif
2. System membuat approval request
3. SUPER_ADMIN menerima notifikasi
4. SUPER_ADMIN bisa setuju/tolak
5. Hasil dicatat di security audit log

### 7. 📊 Statistics & Analytics
Analisis mendalam tentang penggunaan sistem.

**Data Tersedia:**
- Total chat sessions
- Message counts per chat
- User activity trends
- Message timestamps
- Conversation duration
- Content analysis

---

## 🚀 Cara Menggunakan

### Instalasi
```bash
npm install
```

Ini akan install dependencies termasuk:
- openai
- whatsapp-web.js
- uuid (untuk approval request IDs)

### Konfigurasi
Edit `config.json` dengan:
- OpenAI API key
- Nomor super admin (088807239376)
- Role permissions
- Security settings

### Menjalankan
```bash
npm start
# atau untuk development dengan auto-reload:
npm run dev
```

### PM2 (Production)
```bash
npm run pm2:start        # Start bot
npm run pm2:logs         # Lihat logs
npm run pm2:restart      # Restart
npm run pm2:stop         # Stop
```

---

## 📋 Struktur File

```
├── index.js                    # Main bot file
├── config.json                 # Konfigurasi sistem
├── rbac-manager.js             # Role-Based Access Control
├── security-manager.js         # Security & Approval system
├── system-commands.js          # File/Folder operations
├── enhanced-history.js         # History & Search engine
├── conversation_history.json   # Chat history storage
├── user_roles.json             # User role assignments
├── security-audit.log          # Security audit trail
├── commands-history.json       # System commands log
└── backups/                    # Auto-backups
```

---

## 🔒 Security Features

### 1. Authorization Check
- Setiap operasi mengecek permission user
- Fallback ke GUEST role jika tidak terdaftar

### 2. Approval Workflow
- Operasi sensitif memerlukan approval SUPER_ADMIN
- Request expired otomatis setelah 5 menit
- Audit trail lengkap

### 3. Data Protection
- Sensitive fields: password, token, secret, apiKey, privateKey
- Automatic masking untuk user tanpa permission
- Only SUPER_ADMIN dapat view confidential data

### 4. Audit Logging
- Security event logging otomatis
- Unauthorized attempt tracking
- Activity monitoring per user
- Timestamp pada setiap event

### 5. File Security
- Path validation (prevent directory traversal)
- Recursive directory creation dengan permission check
- File operation logging
- Error handling yang aman

---

## 📊 File Structures

### config.json
```json
{
  "openai": { ... },
  "bot": { "superAdminPhone": "088807239376", ... },
  "security": { ... },
  "roles": { 
    "SUPER_ADMIN": { ... },
    "ADMIN": { ... },
    ...
  },
  "dataProtection": { ... },
  "features": { ... }
}
```

### user_roles.json
```json
{
  "0821234567": "ADMIN",
  "0829876543": "TRUSTED_USER",
  ...
}
```

### security-audit.log
```
[timestamp] [UNAUTHORIZED_ATTEMPT] {...}
[timestamp] [APPROVAL_REQUEST_CREATED] {...}
[timestamp] [REQUEST_APPROVED] {...}
...
```

---

## 🎯 Contoh Workflow

### Scenario 1: User Biasa Ingin Buat File
```
User: /buat_file data.txt "Hello World"
↓
System: ❌ Anda tidak memiliki izin untuk membuat file.
```

### Scenario 2: Admin Ubah Setting
```
Admin (ADMIN role): /ubah_setting openai.temperature 0.8
↓
System: ✅ Setting diubah: openai.temperature
        Sebelum: 0.7
        Sesudah: 0.8
```

### Scenario 3: Approval Workflow
```
User: /hapus_file penting.txt
↓
System: ⚠️ Operasi ini membutuhkan persetujuan dari admin.
        Request ID: xxxx-xxxx
↓
(SUPER_ADMIN diberitahu)
SUPER_ADMIN: /setuju xxxx-xxxx
↓
System (to User): ✅ Operasi disetujui! File dihapus.
                  (to SUPER_ADMIN): File xxxx-xxxx dihapus oleh User
```

### Scenario 4: Search History
```
User: /cari "laporan bulanan"
↓
System: 🔍 Hasil Pencarian: "laporan bulanan" (3)
        1. Laporan bulanan January sudah selesai...
           📅 2025-02-15T10:30:00Z
        2. Mari kita bahas laporan bulanan...
           📅 2025-03-01T14:20:00Z
        3. Terima kasih sudah mengirim laporan...
           📅 2025-03-15T09:45:00Z
```

---

## 🔍 Auto Features

### Auto-Save
- Setiap 5 menit history disimpan otomatis
- Prevent data loss jika bot crash

### Auto-Backup
- Setiap 1 jam dibuat backup history
- Stored di folder `backups/`
- Named: `history-YYYY-MM-DDTHH-mm-ss.json`

### Auto-Index
- Content otomatis di-index untuk full-text search
- Date index untuk quick date-based search
- Efficient memory usage

### Auto-Cleanup
- Expired approval requests auto-cleared
- Old entries di-archive

---

## 📞 Nomor Penting

- **SUPER_ADMIN**: 088807239376
- **Owner**: Alwis

---

## 🐛 Troubleshooting

### Bot tidak merespons
```
1. Cek logs: npm run pm2:logs
2. Scan ulang QR code
3. Check OpenAI API key di config.json
4. Restart: npm run pm2:restart
```

### Approval tidak diterima
```
1. Cek apakah request sudah expired (5 menit)
2. Verifikasi requestId
3. Lihat pending approvals: /pending_approvals
```

### File operation error
```
1. Cek path (tidak boleh ada ..)
2. Verifikasi permission user
3. Cek disk space
4. Lihat commands history: check commands-history.json
```

---

## 📈 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Web dashboard untuk monitoring
- [ ] Encryption untuk sensitive data
- [ ] Multi-language support
- [ ] Advanced analytics & reporting
- [ ] Integration dengan sistem lain
- [ ] Custom workflow automation
- [ ] Rate limiting per operation
- [ ] Time-based access control

---

## 📝 License

ISC

## 👤 Author

Nusanet

---

## 📮 Support

Untuk pertanyaan atau issue, hubungi SUPER_ADMIN: 088807239376
