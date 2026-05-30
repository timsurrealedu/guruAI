# 👩‍🏫 GuruAI — Co-Pilot Pedagogis Cerdas Guru Indonesia

**GuruAI** adalah platform asisten pedagogis cerdas (co-pilot) berbasis kecerdasan buatan (AI) yang dirancang khusus untuk membantu guru dan tenaga pendidik di Indonesia. Platform ini mengintegrasikan pemahaman mendalam tentang **Kurikulum Merdeka**, penyusunan dokumen ajar (RPP/Modul Ajar), pembuatan evaluasi berbasis taksonomi kognitif Bloom, serta otomatisasi administrasi sekolah.

GuruAI membantu menghemat waktu administratif guru secara signifikan, sehingga guru dapat lebih berfokus pada apa yang paling penting: **mengajar dan mendidik siswa secara personal**.

---

## ✨ Fitur Utama

### 🧬 1. DNA Profil Guru (Onboarding)
- Penyusunan identitas mengajar yang komprehensif (Metode pendekatan favorit, media pembelajaran utama, preferensi kearifan lokal seperti pertanian/pesisir/perkotaan, dan nilai Karakter Pancasila).
- DNA Profil ini secara otomatis disematkan secara implisit pada seluruh teks/konten yang digenerasikan oleh AI, menghasilkan modul dan tugas yang terasa "sangat menyatu" dengan ciri khas kepribadian guru.

### 📝 2. Content Forge (Pembuat Bahan Ajar)
- **Modul Ajar & RPP**: Membuat rencana pelaksanaan pembelajaran lengkap terstruktur sesuai standar Kemendikbudristek.
- **Kuis & Soal**: Merancang pertanyaan yang terdistribusi secara objektif berdasarkan level Taksonomi Bloom (C2, C3, C4, hingga C5/C6).
- **Lembar Kerja Peserta Didik (LKPD)**: Lembar aktivitas mandiri yang ramah siswa dilengkapi dengan studi kasus kearifan lokal Indonesia.
- **PPT Outline**: Skrip presentasi visual pendukung bab ajar.

### 📊 3. Alat Diagnostik Kelas & OCR Lembar Jawaban (DiagnosticTool)
- **Kelola Kelas**: Memantau perkembangan kognitif siswa secara individu dan kelompok.
- **Analisis Capaian**: Mengelompokkan siswa secara otomatis untuk program remedial kelompok intensif maupun belajar kooperatif (peer tutoring).
- **Visi AI (OCR)**: Mendukung analisis hasil koreksi lembar jawaban berbasis foto lembar jawaban siswa yang dicocokkan dengan kunci jawaban guru.

### 📝 4. Copilot Deskripsi Rapor (RaporCopilot)
- Mengubah nilai kuantitatif siswa (akademis maupun non-akademis) serta jurnal perilaku harian menjadi rumusan narasi deskripsi rapor yang suportif, konstruktif, dan sesuai regulasi Kurikulum Merdeka.

### ✉️ 5. Autopilot Administrasi Birokrasi (AdminAutopilot)
- Menyusun surat resmi, SK kepanitiaan, undangan wali murid formal, rincian SPPD, hingga draf proposal ekstrakurikuler yang rapi dilengkapi format kop resmi, tata bahasa formal Indonesia, nomor hal, lampiran, dan blanko tanda tangan yang presisi.

### 🛒 6. Marketplace & Kolaborasi Guru (Remix Center)
- Galeri tempat para guru mempublikasikan materi yang telah mereka susun.
- Fitur **AI Remix** memungkinkan guru lain untuk meremix karya rekannya secara instan—AI akan menyerap bahan ajar tersebut dan menulis ulang seluruh isinya agar relevan dengan DNA Profil guru yang meremix, kearifan lokal di wilayah barunya, serta kurikulum sekolah tujuannya.

---

## 🛠️ Stack Teknologi

Platform ini dibangun menggunakan arsitektur modern **Full-Stack (Client-Server)** untuk memastikan keamanan rahasia API Key dan kestabilan aplikasi:

### **Backend (`server.ts`)**
- **Runtime**: Node.js dengan TypeScript (`tsx` untuk proses development).
- **Framework**: Express.js untuk API Route Proxy.
- **AI SDK**: `@google/genai` (Gemini API Integration dengan model `gemini-3.5-flash`).
- **Database (Cloud)**: Firebase Admin SDK & Cloud Firestore untuk persistent data storage.
- **Compiler**: Bundled menggunakan `esbuild` menjadi CommonJS (`dist/server.cjs`) untuk kemudahan build produksi.

### **Frontend (`src/`)**
- **Library Utama**: React 19 dengan TypeScript.
- **Build Tool**: Vite 6.
- **Styling**: Tailwind CSS v4 (Desain estetis bernuansa akademis profesional, bersih, dan kontras tinggi untuk kenyamanan mata saat lembur).
- **Animasi**: `motion` (Framer Motion) untuk transisi antar halaman yang halus dan responsif.
- **Render Markdown & Matematika**: `react-markdown` yang ditingkatkan dengan plugin `remark-gfm` (tabel/formatting), `remark-math` & `rehype-katex` lengkap dengan pustaka CSS `katex` untuk rendering render simbol matematika/eksponen/persamaan aljabar yang sempurna tanpa merusak pemformatan visual.
- **Icons**: `lucide-react`.

---

## 💾 Mekanisme Fail-Safe & Sinkronisasi Database

Aplikasi didesain khusus agar memiliki toleransi kegagalan (resiliency) yang tinggi dengan sistem **Hybrid Database & Offline Mode**:

1. **Firestore & In-Memory Fallback**:
   - Jika Cloud Firestore terhubung (SDK berhasil terinstal & terkonfigurasi dengan Firebase Project ID), data akan disimpan secara persisten di Google Cloud Firestore.
   - Jika koneksi Cloud Firestore mengalami gangguan, pembatasan kuota, atau aturan izin ditolak (*Permission Denied*), backend secara otomatis mengalihkan penyimpanan ke **In-Memory Memory Database (fallback)**. Aplikasi akan tetap berjalan normal tanpa memunculkan eror atau crash.
2. **Local Session Cache**:
   - Di sisi klien (browser), kondisi login guest mode maupun draf profil guru di-cache menggunakan `localStorage`. Kondisi kerja Anda tidak akan hilang meskipun tab browser tidak sengaja di-refresh.
3. **AI Offline Simulation Mode**:
   - Jika API Key Gemini (`GEMINI_API_KEY`) belum terdeteksi di server, sistem Generator AI akan otomatis beralih ke **Simulation Mode**. AI akan menyajikan struktur contoh draf rujukan yang disosialisasikan secara lokal untuk membantu memberikan gambaran utuh bentuk draf kepada pengguna.

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

### Prasyarat
- Pastikan Anda sudah menginstal **Node.js** (rekomendasi versi 18 atau 20+).
- Dapatkan kunci API Gemini Anda melalui [Google AI Studio](https://aistudio.google.com/).

### Langkah-Langkah

1. **Klon Proyek & Masuk Direktori**:
   ```bash
   cd GuruAI
   ```

2. **Instalasi Dependensi**:
   Instal semua dependensi yang tertera di `package.json`:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   - Buat berkas baru bernama `.env` di direktori utama (sejajar dengan `package.json`).
   - Masukkan kunci API Gemini Anda:
     ```env
     GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
     ```
   *(Jangan khawatir, backend GuruAI menyembunyikan kunci ini secara rapat di sisi server sehingga aman dan tidak bocor ke browser pengguna)*.

4. **Jalankan Aplikasi dalam Mode Pengembangan (Dev Mode)**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan secara otomatis di port **3000** (URL: `http://localhost:3000`).

5. **Kompilasi Versi Produksi (Production Build)**:
   Untuk mem-build aplikasi agar siap dideploy ke server produksi (seperti Cloud Run, Vercel, VPS):
   ```bash
   npm run build
   ```
   Perintah ini akan melakukan transpilasi frontend ke aset statis di folder `dist/` serta membundel berkas server menjadi satu dokumen `dist/server.cjs` yang ringkas dan cepat saat dijalankan menggunakan perintah:
   ```bash
   npm start
   ```

---

## 📂 Struktur Folder Proyek
```text
├── assets/                       # Aset gambar & ilustrasi default
├── src/                          # Kode sumber frontend React 19
│   ├── components/               # Komponen Modular Halaman Utama GuruAI
│   │   ├── Onboarding.tsx        # Pengaturan Profil DNA Pedagogis Guru
│   │   ├── ContentForge.tsx      # Pembuat RPP,LKPD,Kuis Bloom & PPT Outline
│   │   ├── DiagnosticTool.tsx    # Evaluasi Kelas, Statistik Remedial & OCR Visi AI
│   │   ├── RaporCopilot.tsx      # Penyusun Narasi Deskripsi Rapor Instan
│   │   ├── AdminAutopilot.tsx    # Generator Formulir & Surat Birokrasi Sekolah
│   │   └── Marketplace.tsx       # Kolaborasi Berbagi Modul & AI Remix antar Guru
│   ├── App.tsx                   # Rute navigasi utama & pusat state aplikasi
│   ├── main.tsx                  # Titik masuk React Mounting
│   ├── index.css                 # Konfigurasi Tailwind CSS v4 & Google Web Fonts
│   └── types.ts                  # Deklarasi tipe data TypeScript GuruAI
├── server.ts                     # Kode backend Express & Logika API Proxy Gemini
├── metadata.json                 # Metadata platform AI Studio
├── firestore.rules               # Aturan keamanan database Firestore Blueprints
├── package.json                  # Kelola dependensi & skrip eksekusi
└── tsconfig.json                 # Standarisasi konfigurasi TypeScript compiler
```

---

## 🎯 Target Audiens & Kurikulum
GuruAI dioptimalkan untuk sistem pendidikan di Indonesia dengan cakupan:
- **Jenjang**: SD, SMP, SMA, SMK, & Madrasah (MI/MTS/MA).
- **Kurikulum**: Kurikulum Merdeka (dilengkapi opsi Kurikulum 2013).
- **Semangat**: Merdeka Belajar & Penguatan Profil Pelajar Pancasila (P3).

---
*Dibuat dengan penuh rasa hormat serta dedikasi tinggi bagi seluruh pahlawan tanpa tanda jasa di Indonesia.* 🇮🇩✏️
