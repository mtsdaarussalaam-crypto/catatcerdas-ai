# PANDUAN DEPLOYMENT KE VERCEL
## CatatCerdas AI — Deployment Produksi

Panduan ini memandu Anda dalam melakukan deployment aplikasi **CatatCerdas AI** ke platform **Vercel** dengan arsitektur serverless modern, aman, dan berkinerja tinggi.

---

## 1. Persiapan Repositori GitHub

1. Pastikan seluruh kode Anda sudah di-commit ke Git:
   ```bash
   git init
   git add .
   git commit -m "feat: complete CatatCerdas AI production codebase"
   ```
2. Buat repositori baru di GitHub (misal: `catatcerdas-ai`).
3. Hubungkan remote dan push ke branch utama:
   ```bash
   git remote add origin https://github.com/<username>/catatcerdas-ai.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Impor Proyek ke Vercel

1. Buka dashboard [Vercel](https://vercel.com) dan login ke akun Anda.
2. Klik tombol **Add New...** -> **Project**.
3. Pilih repositori GitHub `catatcerdas-ai` dan klik **Import**.
4. Pada bagian **Configure Project**:
   - **Framework Preset**: Biarkan terpilih **Next.js**.
   - **Root Directory**: `./` (default).
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `.next` (default).

---

## 3. Konfigurasi Environment Variables di Vercel

Sebelum menekan tombol deploy, buka bagian **Environment Variables** di halaman konfigurasi Vercel, lalu tambahkan variabel-variabel berikut:

| Nama Variabel | Nilai / Deskripsi | Target Environment |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Domain produksi Vercel Anda (misal: `https://catatcerdas-ai.vercel.app` atau domain kustom Anda) | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Proyek Supabase Anda (`https://<project-ref>.supabase.co`) | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key (Public) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (Rahasia) | Production, Preview, Development |
| `GEMINI_API_KEY` | Kunci Google Gemini API dari Google AI Studio | Production, Preview, Development |

---

## 4. Deploy dan Validasi

1. Klik tombol **Deploy**.
2. Vercel akan menjalankan instalasi dependensi, build Next.js App Router, optimasi aset statis, dan deployment route handlers.
3. Setelah deployment selesai dengan tanda centang hijau, klik **Go to Dashboard** atau kunjungi link domain aplikasi yang diberikan Vercel.

---

## 5. Sinkronisasi Redirect URL di Google Cloud & Supabase

Setelah domain produksi Vercel Anda aktif (misalnya `https://catatcerdas-ai.vercel.app`):

### A. Perbarui Authorized Origins di Google Cloud Console
1. Buka [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Edit OAuth Client ID Web Application Anda.
3. Pada **Authorized JavaScript origins**, tambahkan:
   `https://catatcerdas-ai.vercel.app`
4. Simpan perubahan.

### B. Perbarui Redirect URLs di Supabase
1. Buka Supabase Dashboard -> **Authentication** -> **URL Configuration**.
2. Ubah **Site URL** menjadi:
   `https://catatcerdas-ai.vercel.app`
3. Pada bagian **Redirect URLs**, pastikan ditambahkan:
   - `https://catatcerdas-ai.vercel.app/**`
   - `https://catatcerdas-ai.vercel.app/auth/callback`
4. Klik **Save**.

---

## 6. Uji Coba Produksi PWA & Fitur AI

Setelah deployment aktif:
1. Buka aplikasi di browser seluler (Chrome Android atau Safari iOS).
2. Uji coba **Install PWA**: Klik menu browser -> *“Tambahkan ke Layar Utama”* atau *“Install CatatCerdas AI”*.
3. Lakukan login menggunakan akun Google.
4. Uji input suara menggunakan mikrofon perangkat.
5. Uji foto struk menggunakan kamera smartphone.
6. Lakukan ekspor laporan transaksi ke CSV dan periksa apakah terbuka dengan rapi di Microsoft Excel atau Google Sheets.

Aplikasi Anda kini resmi live dan siap digunakan! 🎉
