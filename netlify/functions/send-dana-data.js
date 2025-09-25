const { Telegraf } = require('telegraf');

exports.handler = async (event, context) => {
    // Cek jika method bukan POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse data dari body request
        const data = JSON.parse(event.body);
        
        // Validasi data yang diperlukan
        if (!data.type) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Type is required' })
            };
        }

        // Inisialisasi bot Telegram
        const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        const chatId = process.env.TELEGRAM_CHAT_ID;

        let message = '';

        // Format pesan berdasarkan jenis transaksi
        if (data.type === 'payment') {
            // Validasi data pembayaran
            if (!data.name || !data.amount || !data.method) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Missing required payment data' })
                };
            }

            message = `💳 *TRANSAKSI PEMBAYARAN BARU* 💳

👤 *Nama Pembeli:* ${data.name}
💰 *Jumlah Pembayaran:* Rp ${data.amount.toLocaleString('id-ID')}
📱 *Metode Pembayaran:* ${getPaymentMethodName(data.method)}
⏰ *Waktu:* ${formatDate(data.timestamp)}

${getPaymentMethodDetails(data.method)}

🔔 *Status:* Menunggu konfirmasi pembayaran`;

        } else if (data.type === 'refund') {
            // Validasi data pengembalian
            if (!data.name || !data.amount || !data.method || !data.currentBalance) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Missing required refund data' })
                };
            }

            // Hitung saldo setelah pengembalian
            const saldoSetelah = data.currentBalance - data.amount;

            message = `💸 *PENGAJUAN PENGEMBALIAN SALDO* 💸

💰 *Saldo Saat Ini:* Rp ${data.currentBalance.toLocaleString('id-ID')}
💳 *Nominal Pengembalian:* Rp ${data.amount.toLocaleString('id-ID')}
📊 *Saldo Setelah Pengembalian:* Rp ${saldoSetelah.toLocaleString('id-ID')}
👤 *Nama Penerima:* ${data.name}
📱 *Metode Pengembalian:* ${getRefundMethodName(data.method)}
⏰ *Waktu:* ${formatDate(data.timestamp)}

${getRefundMethodDetails(data)}

🔔 *Status:* Menunggu verifikasi pengembalian`;

        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid transaction type' })
            };
        }

        // Kirim pesan ke Telegram
        await bot.telegram.sendMessage(chatId, message, { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true 
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'Data berhasil dikirim ke Telegram' 
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

// Fungsi untuk mendapatkan nama metode pembayaran
function getPaymentMethodName(method) {
    const methods = {
        'bank': 'Transfer Bank',
        'ewallet': 'E-Wallet',
        'qris': 'QRIS (QR Code)'
    };
    return methods[method] || method;
}

// Fungsi untuk mendapatkan nama metode pengembalian
function getRefundMethodName(method) {
    const methods = {
        'bank': 'Transfer Bank',
        'ewallet': 'E-Wallet'
    };
    return methods[method] || method;
}

// Fungsi untuk mendapatkan detail metode pembayaran
function getPaymentMethodDetails(method) {
    if (method === 'bank') {
        return `🏦 *Detail Bank:*
• Bank: Bank Jago
• No. Rekening: 108513819842
• Nama: DITA INDRIASTI`;
    } else if (method === 'ewallet') {
        return `📱 *Detail E-Wallet:*
• Provider: GO-PAY
• Nama: DITA INDRIASTI
• No. Telepon: 085732455329`;
    } else if (method === 'qris') {
        return `🔳 *Detail QRIS:*
• NMID: ID2024349715472
• Kode: A01
• Counter: SINTA
• Status: Aktif dan Siap Digunakan`;
    }
    return '';
}

// Fungsi untuk mendapatkan detail metode pengembalian
function getRefundMethodDetails(data) {
    if (data.method === 'bank') {
        return `🏦 *Detail Penerima Bank:*
• Bank: ${data.bank || 'Tidak diisi'}
• No. Rekening: ${data.account || 'Tidak diisi'}
• Nama Pemilik: ${data.accountName || 'Tidak diisi'}`;
    } else if (data.method === 'ewallet') {
        return `📱 *Detail Penerima E-Wallet:*
• Provider: ${data.bank || 'Tidak diisi'}
• No. E-Wallet: ${data.account || 'Tidak diisi'}
• Nama Pemilik: ${data.accountName || 'Tidak diisi'}`;
    }
    return '';
}

// Fungsi untuk format tanggal
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
    });
        }
