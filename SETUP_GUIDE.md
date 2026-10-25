# PANDUAN SETUP DAN KONFIGURASI LENGKAP
## CatatCerdas AI — Aplikasi Keuangan Berbasis AI, Suara, dan Foto

Panduan ini berisi instruksi terperinci langkah demi langkah untuk mengonfigurasi layanan eksternal yang dibutuhkan oleh **CatatCerdas AI**:
1. Supabase (Database PostgreSQL, Otentikasi Google OAuth, dan Storage Struk)
2. Google Cloud Console (OAuth Client Credentials)
3. Google Gemini API (Artificial Intelligence Engine)

---

## 1. Konfigurasi Proyek Supabase

### A. Membuat Proyek Baru
1. Kunjungi [Supabase](https://supabase.com) dan login ke akun Anda.
2. Klik tombol **New Project**.
3. Masukkan nama proyek (contoh: `catatcerdas-ai`), tentukan database password yang aman, dan pilih Region terdekat (contoh: `Singapore (ap-southeast-1)`).
4. Tunggu beberapa saat hingga database selesai di-provisioning.

### B. Menjalankan Skrip Migrasi SQL
1. Di bilah navigasi kiri Supabase, klik menu **SQL Editor**.
2. Klik **New Query**.
3. Buka file `supabase/migrations/01_init_schema.sql` dari repository ini, salin seluruh kodenya, dan tempelkan ke SQL Editor Supabase.
4. Klik tombol **Run** (atau tekan `Ctrl+Enter`).
5. Pastikan semua perintah berhasil dijalankan (`Success. No rows returned`). Skrip ini akan membuat:
   - 12 tabel relasional (`profiles`, `financial_accounts`, `categories`, `transactions`, `budgets`, `savings_goals`, `recurring_transactions`, `attachments`, `receipt_items`, `notifications`, `ai_conversations`, `ai_messages`).
   - Trigger otomatis `handle_new_user` untuk menginisialisasi profil dan dompet Tunai default saat user baru login via Google OAuth.
   - Kebijakan keamanan **Row Level Security (RLS)** ketat di setiap tabel.
   - Fungsi PostgreSQL `delete_user_entire_data` untuk penghapusan akun mandiri secara aman.

### C. Menyiapkan Supabase Storage untuk Struk
1. Di navigasi kiri Supabase, pilih menu **Storage**.
2. Klik **New Bucket**.
3. Beri nama bucket: `receipts`.
4. **PENTING**: Biarkan opsi **Public Bucket** dalam keadaan **OFF** (Nonaktif/Privat). Foto struk bersifat rahasia dan hanya boleh diakses melalui Signed URL terverifikasi.
5. Klik **Create Bucket**.
6. Kebijakan RLS untuk bucket `receipts` telah disertakan dalam file migrasi SQL:
   - Pengguna hanya dapat mengunggah file ke dalam folder ID mereka sendiri: `${auth.uid()}/...`
   - Pengguna hanya dapat membaca dan menghapus file dalam folder mereka sendiri.

### D. Mengambil Kunci API Supabase
1. Buka menu **Project Settings** (ikon gerigi) -> **API**.
2. Salin nilai-nilai berikut ke file `.env.local` Anda:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Keys (anon / public)** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API Keys (service_role / secret)** -> `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Konfigurasi Google Cloud Console untuk Login Google (OAuth 2.0)

Supabase Auth menggunakan Google OAuth 2.0 untuk autentikasi satu klik (One-Click Google Sign-In).

### A. Membuat Proyek di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau pilih proyek yang sudah ada.

### B. Mengonfigurasi OAuth Consent Screen
1. Buka menu **APIs & Services** -> **OAuth consent screen**.
2. Pilih User Type: **External**, lalu klik **Create**.
3. Isi informasi aplikasi:
   - **App name**: CatatCerdas AI
   - **User support email**: Email Anda
   - **Developer contact information**: Email Anda
4. Pada bagian Scopes, tambahkan scope dasar:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
   *(Aplikasi HANYA meminta identitas dasar untuk profil, tidak pernah meminta akses ke Gmail atau Google Drive).*
5. Simpan dan lanjutkan hingga selesai.

### C. Membuat OAuth Client ID
1. Buka menu **APIs & Services** -> **Credentials**.
2. Klik **+ CREATE CREDENTIALS** -> pilih **OAuth client ID**.
3. Pilih Application type: **Web application**.
4. Beri nama (contoh: `CatatCerdas Web Client`).
5. Pada bagian **Authorized JavaScript origins**, tambahkan:
   - `http://localhost:3000` (untuk pengembangan lokal)
   - `https://your-domain.vercel.app` (domain produksi Vercel Anda)
6. Pada bagian **Authorized redirect URIs**, tambahkan Callback URL dari Supabase Auth:
   - Format: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
   *(Anda dapat menemukan URL ini di Supabase Dashboard -> Authentication -> Providers -> Google -> Callback URL).*
7. Klik **Create**. Anda akan mendapatkan **Client ID** dan **Client Secret**.

### D. Menghubungkan Google OAuth ke Supabase Auth
1. Kembali ke dashboard Supabase Anda.
2. Buka menu **Authentication** -> **Providers**.
3. Cari penyedia **Google** dan klik untuk mengaktifkannya (Toggle ON).
4. Tempelkan **Client ID** dan **Client Secret** yang Anda peroleh dari Google Cloud Console.
5. Klik **Save**.

---

## 3. Konfigurasi Google Gemini API (AI Service)

Aplikasi CatatCerdas AI menggunakan SDK resmi `@google/genai` dengan model unggulan `gemini-3.8-flash` untuk:
- Parsing rekaman suara menjadi draf transaksi terstruktur.
- Multimodal Vision OCR untuk membaca struk/nota belanja.
- Generator insight keuangan berbasis data aktual.
- Asisten chatbot interaktif keuangan.

### A. Mendapatkan Gemini API Key
1. Kunjungi [Google AI Studio](https://aistudio.google.com/).
2. Login menggunakan akun Google Anda.
3. Klik tombol **Get API key** di pojok kiri atas.
4. Klik **Create API key** -> pilih proyek Google Cloud Anda (atau buat baru secara instan).
5. Salin API Key yang dihasilkan.

### B. Menyimpan API Key
Tempelkan API Key ke file `.env.local`:
```env
GEMINI_API_KEY=AIzaSyD...your_real_key_here
```
> **Catatan Keamanan**: Variabel `GEMINI_API_KEY` tidak menggunakan awalan `NEXT_PUBLIC_`. Kunci ini strictly hanya dapat diakses oleh Next.js Server Route Handlers di folder `/app/api/ai/*` dan tidak akan pernah tereskpos ke browser pengguna.

---

## 4. Menjalankan Aplikasi Secara Lokal

Setelah seluruh variabel di `.env.local` terisi:

1. Jalankan unit test untuk memastikan fungsi perhitungan keuangan berfungsi 100%:
   ```bash
   npm test
   ```
2. Jalankan server lokal:
   ```bash
   npm run dev
   ```
3. Buka browser di [http://localhost:3000](http://localhost:3000).
4. Klik tombol **Masuk dengan Google** untuk mencoba login pertama kali.
5. Akun Anda akan otomatis terdaftar dan dompet tunai awal sebesar Rp0 akan dibuat otomatis di database Supabase!
