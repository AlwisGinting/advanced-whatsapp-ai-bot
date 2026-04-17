# WhatsApp Jarvis Bot v2.0

Bot AI WhatsApp bernama Jarvis yang menggunakan OpenAI ChatGPT dengan Baileys Library untuk integrasi yang lebih stabil dan efisien.

## ✨ Fitur Utama

### Core Features
- 🤖 **AI Assistant**: Powered by GPT-3.5-Turbo (lebih cepat & efisien)
- 📱 **Baileys Integration**: Tidak perlu WhatsApp Web, lebih stabil
- 💾 **Persistent History**: Menyimpan conversation history ke disk
- ⏱️ **Rate Limiting**: Proteksi dari spam & API abuse
- 👁️ **Typing Indicator**: Bot menunjukkan status "ngetik"
- 🔄 **Auto Reconnect**: Reconnect otomatis jika connection putus
- 📊 **Usage Stats**: Tracking penggunaan per user
- 🛡️ **Error Handling**: Comprehensive error handling
- 📝 **Detailed Logging**: Semua activity tercatat detail

### Smart Behavior
- **Group Chat**: Balas dengan otomatis jika di-mention
- **Private Chat**: Bisa mulai percakapan dengan mention "Jarvis" atau "Alwis"
- **Context Aware**: Menyimpan riwayat chat untuk respons yang lebih personal
- **Jawaban Singkat**: Optimized untuk WhatsApp (max 200 tokens)
- **Indonesian Support**: Respond dalam bahasa Indonesia

## 📋 Perubahan dari v1

| Fitur | v1 | v2 |
|-------|----|----|
| Library | whatsapp-web.js | Baileys |
| QR Scan | Frequent | First Time Only |
| History | In Memory | Persistent (Disk) |
| Rate Limit | ❌ | ✅ |
| Typing Indicator | ❌ | ✅ |
| Auto Reconnect | Basic | Advanced |
| Config | Hard-coded | config.json |
| Logging | Simple | Detailed |
| Error Handling | Basic | Comprehensive |

## 🚀 Setup & Install

### 1. Install Dependencies
```bash
npm install
```

### 2. Konfigurasi (Pertama Kali)
File `config.json` sudah siap, update sesuai kebutuhan:
- OpenAI API Key
- Bot model (default: gpt-3.5-turbo)
- Rate limits

### 3. Jalankan Bot
```bash
npm start
```

### 4. Scan QR Code (First Time Only!)
- Buka WhatsApp di ponsel nomor 082166508268
- Pergi ke **Menu ⋮ > Linked Devices > Link a Device**
- Scan QR code yang muncul di terminal
- Selesai! Bot siap digunakan

**Tidak perlu scan ulang saat update!** Session disimpan di folder `auth_info_baileys/`

## 💬 Cara Pakai

### Mulai Percakapan
- Kirim pesan ke nomor 082166508268: "Halo Jarvis" atau "Hai Alwis"
- Bot akan balas dengan salam pembuka

### Chat Biasa
- Setelah history ada, bot akan respons semua pesan
- Jawaban singkat & relevan dengan konteks

### Di Group
- Bot akan respons jika di-mention (@)
- Respons dengan pesan standar

## 🔧 Fitur Advanced

### Persistent History
Conversation history otomatis disimpan setiap 5 menit ke `conversation_history.json`

### Rate Limiting
User dibatasi 30 pesan/menit dan 500 pesan/hari (bisa diubah di config.json)

### Logging
Semua activity tercatat di `bot.log`:
```
[2026-04-17T10:30:45.123Z] [INFO] Message received
[2026-04-17T10:30:46.456Z] [INFO] Response sent
```

### Stats Tracking
Penggunaan per user disimpan di `user_stats.json`

## 📁 File Structure
```
ai bot/
├── index.js                    # Main bot code
├── config.json                 # Configuration
├── package.json                # Dependencies
├── README.md                   # This file
├── bot.log                     # Logs (auto-generated)
├── conversation_history.json   # Chat history (auto-generated)
├── user_stats.json             # Usage stats (auto-generated)
└── auth_info_baileys/          # Session (auto-generated)
```

## ⚙️ Konfigurasi (config.json)

```json
{
  "openai": {
    "apiKey": "YOUR_API_KEY",
    "model": "gpt-3.5-turbo",
    "maxTokens": 200,
    "temperature": 0.7
  },
  "bot": {
    "name": "Jarvis",
    "owner": "Alwis",
    "maxHistoryPerChat": 20
  },
  "rateLimit": {
    "enabled": true,
    "messagesPerMinute": 30,
    "dailyLimit": 500
  }
}
```

## 🐛 Troubleshooting

### QR Code Error
- Hapus folder `auth_info_baileys/`
- Restart bot untuk generate QR baru

### Bot Tidak Respons
- Cek `bot.log` untuk error details
- Pastikan API key valid di config.json

### Rate Limit Exceeded
- User hit limit per-minute atau per-day
- Tunggu atau sesuaikan limit di config.json

### Connection Lost
- Bot otomatis reconnect
- Check `bot.log` untuk detail error

## 📞 Support
Jika ada masalah, check:
1. `bot.log` - Detail error lengkap
2. `config.json` - Settings sudah benar?
3. Network - Internet connection stabil?

## 🎯 Roadmap v2.1
- [ ] Image processing (vision)
- [ ] Database integration
- [ ] Admin panel
- [ ] Webhook integration
- [ ] Multi-language support

---

**Version**: 2.0.0  
**Last Updated**: April 17, 2026  
**Status**: ✅ Stable & Production Ready

