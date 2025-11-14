#!/bin/bash

echo "=========================================="
echo "🚀 SUMBER BERKAH BATU ALAM - POS System"
echo "=========================================="
echo ""

echo "📁 Directory: $(pwd)"
echo ""

if [ ! -f "index.html" ]; then
    echo "❌ ERROR: File index.html tidak ditemukan!"
    echo "   Pastikan Anda berada di folder yang benar"
    exit 1
fi

echo "✅ Aplikasi ditemukan:"
ls -la index.html css/ js/
echo ""

echo "🌐 Server berjalan di: http://localhost:8000"
echo ""
echo "📱 Buka browser dan kunjungi: http://localhost:8000"
echo ""
echo "⏹️  Untuk menghentikan server: Press Ctrl+C"
echo "=========================================="
echo ""

if command -v python3 &> /dev/null; then
    echo "✅ Python3 ditemukan, menjalankan server..."
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Python ditemukan, menjalankan server..."
    python -m http.server 8000
else
    echo "❌ ERROR: Tidak ada web server yang ditemukan!"
    echo ""
    echo "💡 SOLUSI: Install Python3:"
    echo "   sudo apt install python3"
    exit 1
fi
