// Global variables
let financialData = [];

// ==================== AUTO FORMAT CURRENCY FUNCTIONS ====================

// Fungsi untuk format input dengan titik ribuan
function formatCurrencyInput(inputElement) {
    // Simpan posisi cursor
    const cursorPosition = inputElement.selectionStart;
    const originalValue = inputElement.value;
    
    // Hapus semua karakter non-digit kecuali koma (untuk decimal)
    let value = inputElement.value.replace(/[^\d]/g, '');
    
    // Format dengan titik ribuan
    if (value.length > 0) {
        value = parseInt(value, 10).toLocaleString('id-ID');
    }
    
    // Set nilai yang sudah diformat
    inputElement.value = value;
    
    // Adjust cursor position
    const newLength = inputElement.value.length;
    const lengthDiff = newLength - originalValue.length;
    const newCursorPosition = Math.max(0, cursorPosition + lengthDiff);
    inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
}

// Fungsi untuk parse nilai dari format currency ke number
function parseCurrencyFormatted(formattedValue) {
    if (!formattedValue || formattedValue === '') return 0;
    const cleanValue = formattedValue.toString().replace(/\./g, '');
    return parseInt(cleanValue) || 0;
}

// Fungsi untuk setup auto-format pada semua input number
function setupAutoFormat() {
    // Input utama
    const mainInputs = ['totalSales', 'cash', 'expenses'];
    mainInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            // Format saat input berubah
            input.addEventListener('input', function() {
                formatCurrencyInput(this);
                updateSummary();
            });
            
            // Format saat focus out (untuk pastikan formatting)
            input.addEventListener('blur', function() {
                formatCurrencyInput(this);
            });
        }
    });
    
    // Event delegation untuk input transfer yang dinamis
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('transfer-input')) {
            formatCurrencyInput(e.target);
            updateSummary();
        }
    });
    
    document.addEventListener('blur', function(e) {
        if (e.target.classList.contains('transfer-input')) {
            formatCurrencyInput(e.target);
        }
    });
}

// ==================== MULTIPLE TRANSFER FUNCTIONS ====================

// Fungsi untuk menambah input transfer
function addTransferItem(amount = '', bank = '') {
    const container = document.getElementById('transferContainer');
    
    const newItem = document.createElement('div');
    newItem.className = 'transfer-item';
    newItem.innerHTML = `
        <input type="text" class="transfer-input" placeholder="0" value="${amount}" inputmode="numeric">
        <input type="text" class="transfer-bank" placeholder="Bank (opsional)" value="${bank}">
        <button type="button" class="btn-remove-transfer" onclick="removeTransferItem(this)">✕</button>
    `;
    
    container.appendChild(newItem);
}

// Fungsi untuk menghapus input transfer
function removeTransferItem(button) {
    const container = document.getElementById('transferContainer');
    if (container.children.length > 1) {
        button.parentElement.remove();
        updateSummary();
    }
}

// Fungsi untuk menghitung total transfer
function calculateTotalTransfer() {
    const inputs = document.querySelectorAll('.transfer-input');
    let total = 0;
    
    inputs.forEach(input => {
        total += parseCurrencyFormatted(input.value) || 0;
    });
    
    return total;
}

// Fungsi untuk mendapatkan detail transfer
function getTransferDetails() {
    const items = document.querySelectorAll('.transfer-item');
    const details = [];
    
    items.forEach(item => {
        const amount = item.querySelector('.transfer-input').value;
        const bank = item.querySelector('.transfer-bank').value;
        
        if (amount && parseCurrencyFormatted(amount) > 0) {
            details.push({
                amount: parseCurrencyFormatted(amount),
                bank: bank || 'Transfer'
            });
        }
    });
    
    return details;
}

// Update transfer total display
function updateTransferTotalDisplay(total) {
    let totalDisplay = document.getElementById('transferTotalDisplay');
    if (!totalDisplay) {
        const container = document.getElementById('transferContainer');
        totalDisplay = document.createElement('div');
        totalDisplay.id = 'transferTotalDisplay';
        totalDisplay.className = 'transfer-total';
        container.parentNode.insertBefore(totalDisplay, container.nextSibling);
    }
    totalDisplay.textContent = `Total Transfer: ${formatCurrency(total)}`;
}

// Clear form
function clearForm() {
    document.getElementById('totalSales').value = '';
    document.getElementById('cash').value = '';
    document.getElementById('expenses').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    
    // Clear transfer inputs but keep one EMPTY item
    const container = document.getElementById('transferContainer');
    container.innerHTML = '';
    addTransferItem('', ''); // Tambah item transfer KOSONG
    
    updateSummary();
}

// ==================== MAIN APPLICATION FUNCTIONS ====================

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    updateSummary();
    showTab('input');
    
    // Set tanggal default ke hari ini
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    
    // Add first transfer item by default
    addTransferItem();
});

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showTab(this.dataset.tab);
        });
    });

    // Setup auto-format untuk input currency
    setupAutoFormat();

    // Enter key to save
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && document.getElementById('input').classList.contains('active')) {
            saveData();
        }
    });
}

// Show specific tab
function showTab(tabName) {
    try {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Activate corresponding button
        const correspondingButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (correspondingButton) {
            correspondingButton.classList.add('active');
        }
        
        // Refresh data if needed
        if (tabName === 'riwayat') {
            loadHistory();
        } else if (tabName === 'backup') {
            updateBackupStatus();
        }
    } catch (error) {
        console.error('Error in showTab:', error);
    }
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('financialData');
    if (savedData) {
        financialData = JSON.parse(savedData);
    }
}

// Save data to localStorage
function saveDataToStorage() {
    localStorage.setItem('financialData', JSON.stringify(financialData));
}

// Update summary calculations
function updateSummary() {
    const sales = parseCurrencyFormatted(document.getElementById('totalSales').value) || 0;
    const cash = parseCurrencyFormatted(document.getElementById('cash').value) || 0;
    const transfer = calculateTotalTransfer();
    const expenses = parseCurrencyFormatted(document.getElementById('expenses').value) || 0;
    
    const difference = (cash + transfer) - (sales + expenses);
    
    // Update summary display
    document.getElementById('summarySales').textContent = formatCurrency(sales);
    document.getElementById('summaryCash').textContent = formatCurrency(cash);
    document.getElementById('summaryTransfer').textContent = formatCurrency(transfer);
    document.getElementById('summaryExpenses').textContent = formatCurrency(expenses);
    document.getElementById('summaryDifference').textContent = formatCurrency(difference);
    
    // Update transfer total display
    updateTransferTotalDisplay(transfer);
    
    // Color code the difference
    const diffElement = document.getElementById('summaryDifference');
    if (difference > 0) {
        diffElement.style.color = '#27ae60';
    } else if (difference < 0) {
        diffElement.style.color = '#e74c3c';
    } else {
        diffElement.style.color = '#2c3e50';
    }
}

// Format currency untuk display
function formatCurrency(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

// Save data
function saveData() {
    const date = document.getElementById('transactionDate').value;
    const sales = parseCurrencyFormatted(document.getElementById('totalSales').value) || 0;
    const cash = parseCurrencyFormatted(document.getElementById('cash').value) || 0;
    const transfer = calculateTotalTransfer();
    const transferDetails = getTransferDetails();
    const expenses = parseCurrencyFormatted(document.getElementById('expenses').value) || 0;
    const notes = document.getElementById('notes').value;
    
    if (!date) {
        alert('❌ Harap isi tanggal transaksi!');
        return;
    }
    
    // Transfer boleh 0, jadi tidak ada validasi untuk transfer
    
    const difference = (cash + transfer) - (sales + expenses);
    
    const newEntry = {
        id: Date.now(),
        date: date,
        sales: sales,
        cash: cash,
        transfer: transfer,
        transferDetails: transferDetails,
        expenses: expenses,
        difference: difference,
        notes: notes,
        createdAt: new Date().toISOString()
    };
    
    // Check if entry for this date already exists
    const existingIndex = financialData.findIndex(entry => entry.date === date);
    if (existingIndex !== -1) {
        if (confirm('Data untuk tanggal ini sudah ada. Mau update data yang sudah ada?')) {
            financialData[existingIndex] = newEntry;
        } else {
            return;
        }
    } else {
        financialData.unshift(newEntry);
    }
    
    saveDataToStorage();
    clearForm();
    updateSummary();
    showTab('riwayat');
    
    alert('✅ Data berhasil disimpan!');
}

// Clear form
function clearForm() {
    document.getElementById('totalSales').value = '';
    document.getElementById('cash').value = '';
    document.getElementById('expenses').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    
    // Clear transfer inputs but keep one
    const container = document.getElementById('transferContainer');
    container.innerHTML = '';
    addTransferItem();
    
    updateSummary();
}

// Load history
function loadHistory() {
    const tbody = document.getElementById('historyBody');
    const emptyState = document.getElementById('emptyState');
    
    if (financialData.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = financialData.map(entry => {
        let transferDisplay = formatCurrency(entry.transfer);
        
        // Add tooltip for transfer details
        if (entry.transferDetails && entry.transferDetails.length > 0) {
            const details = entry.transferDetails.map(d => 
                `${d.bank}: ${formatCurrency(d.amount)}`
            ).join('\n');
            transferDisplay = `<span title="${details}" style="cursor: help; text-decoration: underline dotted;">${formatCurrency(entry.transfer)} 📋</span>`;
        }
        
        return `
            <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${formatCurrency(entry.sales)}</td>
                <td>${formatCurrency(entry.cash)}</td>
                <td>${transferDisplay}</td>
                <td>${formatCurrency(entry.expenses)}</td>
                <td style="color: ${entry.difference >= 0 ? '#27ae60' : '#e74c3c'}">
                    ${formatCurrency(entry.difference)}
                </td>
                <td>${entry.notes || '-'}</td>
                <td>
                    <button onclick="editEntry(${entry.id})" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">✏️ Edit</button>
                    <button onclick="deleteEntry(${entry.id})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🗑️ Hapus</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Edit entry
function editEntry(id) {
    const entry = financialData.find(item => item.id === id);
    if (entry) {
        document.getElementById('transactionDate').value = entry.date;
        
        // Format values dengan titik ribuan saat edit
        document.getElementById('totalSales').value = entry.sales.toLocaleString('id-ID');
        document.getElementById('cash').value = entry.cash.toLocaleString('id-ID');
        document.getElementById('expenses').value = entry.expenses.toLocaleString('id-ID');
        document.getElementById('notes').value = entry.notes || '';
        
        // Clear transfer container
        const container = document.getElementById('transferContainer');
        container.innerHTML = '';
        
        // Load transfer details
        if (entry.transferDetails && entry.transferDetails.length > 0) {
            entry.transferDetails.forEach(detail => {
                addTransferItem(detail.amount.toLocaleString('id-ID'), detail.bank);
            });
        } else {
            // Fallback for old data
            addTransferItem(entry.transfer.toLocaleString('id-ID'), 'Transfer');
        }
        
        updateSummary();
        showTab('input');
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        alert('✏️ Data dimuat untuk editing. Jangan lupa klik "Simpan Data" setelah selesai edit!');
    }
}

// Delete entry
function deleteEntry(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        financialData = financialData.filter(item => item.id !== id);
        saveDataToStorage();
        loadHistory();
        updateBackupStatus();
        alert('✅ Data berhasil dihapus!');
    }
}

// Backup functions
function exportToJSON() {
    try {
        const backupData = {
            version: '1.1',
            backupDate: new Date().toISOString(),
            shopName: 'SUMBER BERKAH BATU ALAM',
            financialData: financialData
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-keuangan-${getCurrentDate()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Backup JSON berhasil diunduh!');
    } catch (error) {
        alert('❌ Gagal membuat backup: ' + error.message);
    }
}

function exportToCSV() {
    try {
        if (financialData.length === 0) {
            alert('❌ Tidak ada data untuk di-export');
            return;
        }
        
        let csv = 'Tanggal,Total Penjualan (Rp),Cash (Rp),Transfer (Rp),Pengeluaran (Rp),Selisih (Rp),Catatan,Detail Transfer\n';
        
        financialData.forEach(item => {
            const transferDetails = item.transferDetails ? 
                item.transferDetails.map(d => `${d.bank}: ${d.amount}`).join('; ') : 
                'Transfer: ' + item.transfer;
            
            const row = [
                `"${item.date}"`,
                `"${item.sales}"`,
                `"${item.cash}"`,
                `"${item.transfer}"`,
                `"${item.expenses}"`,
                `"${item.difference}"`,
                `"${(item.notes || '').replace(/"/g, '""')}"`,
                `"${transferDetails.replace(/"/g, '""')}"`
            ].join(',');
            csv += row + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-keuangan-${getCurrentDate()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Backup CSV berhasil diunduh! Buka dengan Excel untuk melihat laporan.');
    } catch (error) {
        alert('❌ Gagal export CSV: ' + error.message);
    }
}

function importData() {
    document.getElementById('importFile').click();
}

// Handle file import
document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.financialData) {
                throw new Error('Format file tidak valid');
            }
            
            if (confirm(`Import ${importedData.financialData.length} data? Data lama akan diganti.`)) {
                financialData = importedData.financialData;
                saveDataToStorage();
                loadHistory();
                updateBackupStatus();
                
                // Reset file input
                e.target.value = '';
                
                alert('✅ Data berhasil diimport!');
                showTab('riwayat');
            }
        } catch (error) {
            alert('❌ Gagal import data: ' + error.message);
            e.target.value = '';
        }
    };
    
    reader.readAsText(file);
});

function clearAllData() {
    if (confirm('⚠️  APAKAH ANDA YAKIN?\n\nData yang dihapus tidak bisa dikembalikan!')) {
        if (confirm('❌ BENAR-BENAR YAKIN HAPUS SEMUA DATA?')) {
            financialData = [];
            saveDataToStorage();
            loadHistory();
            updateBackupStatus();
            alert('✅ Semua data berhasil dihapus!');
        }
    }
}

function updateBackupStatus() {
    const backupStatus = document.getElementById('backupStatus');
    if (financialData.length > 0) {
        const totalSales = financialData.reduce((sum, item) => sum + item.sales, 0);
        const totalTransfer = financialData.reduce((sum, item) => sum + item.transfer, 0);
        
        backupStatus.innerHTML = `
            📊 <strong>${financialData.length} records</strong> tersimpan<br>
            💰 Total Penjualan: ${formatCurrency(totalSales)}<br>
            🔄 Total Transfer: ${formatCurrency(totalTransfer)}<br>
            📅 Terakhir update: ${new Date().toLocaleString('id-ID')}
        `;
    } else {
        backupStatus.innerHTML = 'ℹ️ Belum ada data keuangan';
    }
}

function getCurrentDate() {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function showNotification(message, type = 'info') {
  // Simple notification system
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : '#3498db'};
    color: white;
    border-radius: 5px;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add to Home Screen prompt (optional)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install promotion (optional)
  console.log('📱 Aplikasi bisa diinstall ke home screen');
  
  // You can show your own install button here
  // showInstallPromotion();
});
