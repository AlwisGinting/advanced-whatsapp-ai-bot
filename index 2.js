const { Client, LocalAuth } = require('whatsapp-web.js');
const OpenAI = require('openai');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Inisialisasi OpenAI dengan API key
const openai = new OpenAI({
  apiKey: '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'
});

// Inisialisasi WhatsApp client dengan autentikasi lokal
const client = new Client({
  authStrategy: new LocalAuth()
});

// Fungsi logging
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(path.join(__dirname, 'bot.log'), logMessage);
}

// Fungsi untuk mendapatkan respons dari ChatGPT
async function getChatGPTResponse(message, chatId, mediaUrl = null) {
  try {
    // Ambil history percakapan untuk chat ini
    let history = conversationHistory.get(chatId) || [];

    // Tambahkan pesan user ke history
    if (mediaUrl) {
      history.push({
        role: 'user',
        content: [
          { type: 'text', text: message || 'Analyze this image' },
          { type: 'image_url', image_url: { url: mediaUrl } }
        ]
      });
    } else {
      history.push({ role: 'user', content: message });
    }

    // Batasi history ke 20 pesan terakhir untuk menghindari token limit
    if (history.length > 20) {
      history = history.slice(-20);
    }

    // Kirim ke OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview', // Gunakan GPT-4 Vision untuk gambar
      messages: [
        { role: 'system', content: 'You are Jarvis, a helpful AI assistant communicating via WhatsApp. Respond concisely and helpfully. If an image is provided, analyze it briefly.' },
        ...history
      ],
      max_tokens: 200, // Jawaban singkat
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;

    // Tambahkan respons ke history
    history.push({ role: 'assistant', content: response });

    // Simpan history kembali
    conversationHistory.set(chatId, history);

    return response;
  } catch (error) {
    log('Error getting ChatGPT response:', error);
    return 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.';
  }
}

// Event ketika client siap
client.on('ready', () => {
  log('WhatsApp Bot is ready!');
});

// Event ketika menerima QR code
client.on('qr', (qr) => {
  log('QR Code received. Scan dengan WhatsApp Web:');
  qrcode.generate(qr, { small: true });
});

// Event ketika menerima pesan
client.on('message', async (msg) => {
  // Abaikan pesan dari diri sendiri untuk menghindari loop
  if (msg.fromMe) return;

  log(`Pesan dari ${msg.from}: ${msg.body}`);

  // Jika pesan dari group
  if (msg.from.includes('@g.us')) {
    // Cek apakah bot di-mention
    if (msg.mentionedIds && msg.mentionedIds.includes(client.info.wid._serialized)) {
      msg.reply('baik terimakasih informasinya mohon ditunggu Alwis akan membalas pesan kembali');
    }
    return; // Jangan proses lebih lanjut untuk group
  }

  // Untuk chat pribadi
  // Jika tidak ada history, cek apakah mention nama Jarvis atau Alwis untuk mulai percakapan
  const hasHistory = conversationHistory.has(msg.from);
  const mentionsName = msg.body.toLowerCase().includes('jarvis') || msg.body.toLowerCase().includes('alwis');

  if (!hasHistory && !mentionsName) {
    log(`Tidak ada history dan tidak mention nama untuk ${msg.from}, skip balas`);
    return;
  }

  // Jika mention nama tapi belum ada history, mulai percakapan dengan salam
  if (!hasHistory && mentionsName) {
    conversationHistory.set(msg.from, []);
    msg.reply('Halo! Saya Jarvis, AI assistant Anda. Ada yang bisa saya bantu?');
    return;
  }

  let mediaUrl = null;
  if (msg.hasMedia) {
    const media = await msg.downloadMedia();
    // Untuk vision, kita perlu URL data, tapi OpenAI butuh URL publik. Untuk sekarang, skip atau gunakan base64
    // Untuk maksimal, convert ke base64
    if (media) {
      mediaUrl = `data:${media.mimetype};base64,${media.data}`;
    }
  }

  // Dapatkan respons dari ChatGPT
  const response = await getChatGPTResponse(msg.body, msg.from, mediaUrl);

  // Kirim respons kembali
  msg.reply(response);
});

// Event untuk error
client.on('auth_failure', (msg) => {
  log('Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
  log('Client was disconnected:', reason);
  log('Attempting to restart...');
  setTimeout(() => {
    client.initialize();
  }, 5000); // Restart setelah 5 detik
});

// Inisialisasi client
client.initialize();