const axios = require('axios');

exports.handler = async function(event, context) {
    // Cek jika method bukan POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Parse data dari body request
        const data = JSON.parse(event.body);
        
        // Validasi data yang diperlukan
        if (!data.name || !data.amount) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Nama dan jumlah harus diisi' })
            };
        }

        // Ambil token dan chat ID dari environment variables
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
        
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Konfigurasi Telegram bot tidak lengkap' })
            };
        }

        // Format pesan dengan box style
        let message = '';
        
        if (data.type === 'payment') {
            message = `┌─────────────────────────────────┐\n` +
                     `│        💳 TRANSAKSI BARU 💳       │\n` +
                     `├─────────────────────────────────┤\n` +
                     `│ 👤 NAMA: ${data.name.padEnd(20)} │\n` +
                     `│ 💰 JUMLAH: Rp ${data.amount.toLocaleString('id-ID').padEnd(12)} │\n` +
                     `│ 📱 METODE: ${data.method.padEnd(18)} │\n` +
                     `│ ⏰ WAKTU: ${new Date(data.timestamp).toLocaleString('id-ID').padEnd(15)} │\n` +
                     `│ 🆔 ID: ${generateTransactionId().padEnd(22)} │\n` +
                     `└─────────────────────────────────┘\n\n` +
                     `📋 *Detail Transaksi:*\n` +
                     `├• Tipe: Pembayaran\n` +
                     `├• Status: Menunggu Konfirmasi\n` +
                     `╰• Aksi: Segera Proses`;
        } else if (data.type === 'refund') {
            message = `┌─────────────────────────────────┐\n` +
                     `│       🔄 PENGEMBALIAN BARU 🔄      │\n` +
                     `├─────────────────────────────────┤\n` +
                     `│ 👤 NAMA: ${data.name.padEnd(20)} │\n` +
                     `│ 💰 JUMLAH: Rp ${data.amount.toLocaleString('id-ID').padEnd(12)} │\n` +
                     `│ 🏦 SALDO: Rp ${data.currentBalance.toLocaleString('id-ID').padEnd(12)} │\n` +
                     `│ 📱 METODE: ${data.method.padEnd(18)} │\n` +
                     `│ ⏰ WAKTU: ${new Date(data.timestamp).toLocaleString('id-ID').padEnd(15)} │\n` +
                     `│ 🆔 ID: ${generateTransactionId().padEnd(22)} │\n` +
                     `└─────────────────────────────────┘\n\n` +
                     `📋 *Detail Pengembalian:*\n` +
                     `├• Bank: ${data.bank}\n` +
                     `├• No. Rek: ${data.account}\n` +
                     `├• Pemilik: ${data.accountName}\n` +
                     `├• Status: Menunggu Verifikasi\n` +
                     `╰• Aksi: Cek Saldo & Proses`;
        }

        // Kirim pesan ke Telegram
        const telegramResponse = await axios.post(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            }
        );

        // Jika berhasil, kirim response sukses
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'Data berhasil dikirim ke Telegram',
                telegramResponse: telegramResponse.data 
            })
        };

    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Terjadi kesalahan saat mengirim data ke Telegram',
                details: error.message 
            })
        };
    }
};

// Fungsi untuk generate ID transaksi unik
function generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TX${timestamp}${random}`.toUpperCase();
            }
