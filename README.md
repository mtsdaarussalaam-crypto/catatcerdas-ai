# CatatCerdas AI 💰🤖
> **“Catat Mudah, Pahami Keuangan, Raih Tujuan.”**

**CatatCerdas AI** adalah aplikasi web pencatatan dan manajemen keuangan pribadi modern berbasis AI yang dirancang untuk membantu pengguna mencatat transaksi secara instan, memahami pola pengeluaran dengan analitik mendalam, dan mencapai target tabungan serta anggaran finansial mereka secara cerdas dan aman.

Aplikasi ini mendukung tiga metode input utama:
1. **Input Manual** melalui formulir terstruktur dengan format Rupiah otomatis.
2. **Input Suara** menggunakan mikrofon browser dengan transkripsi & ekstraksi entitas transaksi via Google Gemini AI (`gemini-3.8-flash`).
3. **Input Foto & Nota / Struk** dengan Multimodal AI Vision OCR untuk membaca nama merchant, total belanja, tanggal, metode pembayaran, serta rincian item belanja secara otomatis dan akurat.

---

## ✨ Fitur Utama

### 1. Multi-Metode Pencatatan Transaksi
- **Formulir Transaksi Manual**: Validasi nominal otomatis, pilihan kategori, rekening/dompet, metode pembayaran (Tunai, QRIS, Transfer Bank, Debit, Kredit, E-Wallet), pihak terkait/toko, tagar, dan lampiran struk.
- **Pencatatan Suara Cerdas (Voice to Transaction)**: Rekam suara Anda (contoh: *"Beli bensin 50 ribu pakai ShopeePay tadi siang"*), AI langsung mengekstrak tipe, nominal, kategori, dompet, dan tanggal secara otomatis menjadi draf transaksi terverifikasi.
- **Pemindai Struk & Nota Belanja (Receipt OCR Vision)**: Ambil foto struk langsung dari kamera HP atau unggah gambar nota. AI membaca detail toko, total, tanggal, dan breakdown item. Dilengkapi sistem proteksi deteksi duplikasi transaksi.

### 2. Dashboard Keuangan Komprehensif
- **Kartu Ringkasan Real-Time**: Total Saldo Bersih, Pemasukan Bulan Berjalan, Pengeluaran Bulan Berjalan, Selisih Cashflow, Persentase Rasio Tabungan/Belanja, Penggunaan Anggaran, dan Akumulasi Tabungan.
- **Visualisasi Grafik Interaktif**: Grafik arus kas harian/bulanan, breakdown pengeluaran berdasarkan kategori (Donut Chart), serta tren saldo historis.
- **AI Financial Insights**: Ringkasan performa keuangan otomatis yang didasarkan pada data riil Anda tanpa halusinasi data fiktif.

### 3. Asisten Finansial AI Terintegrasi
- Chatbot asisten finansial pribadi yang mengetahui ringkasan dan konteks transaksi Anda secara aman.
- Tanyakan apa saja: strategi penghematan, evaluasi pos pengeluaran terbesar, rekomendasi alokasi dana darurat, hingga simulasi menabung.

### 4. Manajemen Anggaran (Budgeting) & Goal Tabungan (Savings Goals)
- Atur batas anggaran per kategori bulanan dengan visual progress bar.
- Peringatan dini jika anggaran mencapai 80% (Peringatan) dan 100% (Melebihi Batas).
- Tetapkan target impian (Dana Darurat, Liburan, Kendaraan, Rumah) dengan kalkulator otomatis kebutuhan tabungan bulanan dan mingguan.

### 5. Transaksi Berulang & Kalender Keuangan
- Penjadwalan transaksi rutin (Gaji, Langganan Netflix, WiFi, Listrik, Cicilan) secara harian, mingguan, bulanan, atau tahunan.
- Kalender keuangan interaktif untuk memetakan hari-hari pengeluaran dan pemasukan bulanan.

### 6. Multi-Akun & Rekonsiliasi Transfer
- Kelola berbagai rekening bank, dompet digital (GoPay, OVO, Dana, ShopeePay), dan uang tunai.
- Fitur **Transfer Antar-Akun**: Saldo berpindah antar-rekening secara atomik tanpa mendistorsi laporan arus kas bersih (net income/expense).

### 7. Ekspor, Impor, & Keamanan Data
- Ekspor seluruh riwayat transaksi ke format **CSV** dengan kompatibilitas Microsoft Excel (UTF-8 BOM).
- Impor data transaksi dari file CSV dengan validasi skema otomatis.
- **Row Level Security (RLS)** tingkat database pada Supabase: setiap pengguna hanya memiliki akses eksklusif ke datanya sendiri.
- Supabase Storage dengan folder terisolasi per User ID (`auth.uid()`) untuk foto struk pribadi.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (Strict Mode), Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Next.js Route Handlers, Server Actions, Edge Middleware auth guard.
- **Database & Auth**: Supabase PostgreSQL, Supabase Google OAuth PKCE, Supabase Storage dengan RLS.
- **Artificial Intelligence**: Google Gemini API (`@google/genai` dengan model `gemini-3.8-flash`).
- **PWA Ready**: Dukungan Web App Manifest, ikon mobile, dan tata letak responsif desktop + mobile.

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Prasyarat
- **Node.js**: Versi 20.x atau 22.x LTS
- **npm** atau **pnpm**
- Akun **Supabase** (Proyek gratis atau berbayar)
- Akun **Google AI Studio** untuk Gemini API Key
- Akun **Google Cloud Console** untuk Google OAuth Client ID

### 2. Kloning Repository & Instal Dependensi
```bash
git clone https://github.com/username/catatcerdas-ai.git
cd catatcerdas-ai
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lengkapi variabel berikut di dalam `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

GEMINI_API_KEY=your-gemini-api-key
```

### 4. Setup Database Supabase
Jalankan skrip migrasi SQL di Supabase SQL Editor:
- Buka dashboard Supabase -> **SQL Editor** -> **New Query**.
- Salin dan jalankan seluruh isi file `supabase/migrations/01_init_schema.sql`.
- Pastikan bucket `receipts` telah dibuat di Supabase Storage dengan status **Private**.

### 5. Jalankan Pengujian Otomatis
```bash
npm test
```

### 6. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 📖 Dokumentasi Lengkap
- [Panduan Setup & Integrasi Lengkap](SETUP_GUIDE.md) - Langkah-langkah detail Google OAuth, Supabase RLS, dan Gemini AI.
- [Panduan Deployment ke Vercel](DEPLOYMENT_GUIDE.md) - Langkah-langkah deploy produksi ke Vercel dan kustom domain.

---

## 🔒 Privasi dan Keamanan
CatatCerdas AI dibangun dengan prinsip **Privacy by Design**:
- Kunci API AI dieksekusi secara ketat di sisi server (Server-Side Route Handlers) dan tidak pernah bocor ke bundle JavaScript browser.
- Seluruh tabel database dilindungi oleh PostgreSQL Row Level Security (RLS).
- Bukti struk disimpan dalam bucket privat dan hanya dapat dilihat melalui Signed URL berdurasi terbatas.
- Pengguna memiliki hak penuh untuk mengekspor atau menghapus seluruh data dan akunnya secara permanen kapan saja.

---

## 📄 Lisensi
Hak Cipta © 2026 CatatCerdas AI. Dilisensikan di bawah [MIT License](LICENSE).
