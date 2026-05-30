import express from "express";
import path from "path";
import fs from "fs";
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Load Firebase configuration
let firebaseProjectID = "";
let firebaseDBId = "";
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const rawConfig = fs.readFileSync(configPath, "utf-8");
    const firebaseConfig = JSON.parse(rawConfig);
    firebaseProjectID = firebaseConfig.projectId;
    firebaseDBId = firebaseConfig.firestoreDatabaseId;
  }
} catch (error) {
  console.warn("Could not read firebase-applet-config.json:", error);
}

// Lazy Initializer for FireStore with Local Fallback memory
let firestoreDb: any = null;
const memoryDb = {
  guru_profiles: {} as Record<string, any>,
  konten_guru: [] as any[],
  marketplace: [
    {
      id: "shared_mat_1",
      original_guru_id: "anon_id",
      original_guru_nama: "Sri Wahyuni, S.Pd.",
      original_sekolah: "SMPN 1 Wonosobo",
      original_kota: "Wonosobo, Jawa Tengah",
      judul: "Modul Ajar Matematika - SPLDV Kelas 8 (Remixable)",
      mapel: "Matematika",
      konten: `### MODUL AJAR: SISTEM PERSAMAAN LINEAR DUA VARIABEL (SPLDV)

**Jenjang:** SMP Kelas 8  
**Durasi:** 2 JP (2 x 40 menit)  
**Tujuan Pembelajaran:** Siswa dapat memahami konsep SPLDV dan menyelesaikan permasalahan sehari-hari dengan metode eliminasi/substitusi.

#### KEGIATAN INTI:
1. **Apersepsi:** Menemukan pola harga belanjaan di koperasi sekolah (misalnya harga 2 buku dan 1 pensil).
2. **Eksplorasi Mandiri:** Berdiskusi berpasangan untuk membuat model matematika.
3. **Penyimpulan:** Menemukan titik temu koordinat persilangan garis.`,
      tags: ["Matematika", "SMP", "SPLDV", "Kurikulum Merdeka"],
      rating: 4.8,
      remix_count: 14,
      downloads_count: 52,
      created_at: new Date().toISOString()
    },
    {
      id: "shared_mat_2",
      original_guru_id: "anon_id_2",
      original_guru_nama: "Budi Santoso, M.Pd.",
      original_sekolah: "SMAN 3 Malang",
      original_kota: "Malang, Jawa Timur",
      judul: "Bank Soal Fisika - Hukum Newton & Dinamika Gerak",
      mapel: "Fisika",
      konten: `### BANK SOAL: DINAMIKA GERAK (HUKUM NEWTON)

**Jenjang:** SMA Kelas 10  
**Kurikulum:** Kurikulum Merdeka  

#### Soal 1 (C2 - Pemahaman)
Sebutkan perbedaan mendasar antara Hukum I Newton dan Hukum II Newton mengenai pengaruh gaya terhadap percepatan benda.  
*Kunci Jawaban:* Hukum I menjelaskan keadaan diam atau GLB akibat jumlah gaya nol. Hukum II menjelaskan percepatan akibat adanya gaya bersih (F = ma).

#### Soal 2 (C3 - Aplikasi)
Sebuah truk bermassa 2000 kg bergerak dengan percepatan 2 m/s². Hitunglah gaya bersih yang bekerja pada truk tersebut!  
*Kunci Jawaban:* F = m * a = 2000 * 2 = 4000 Newton.`,
      tags: ["Fisika", "SMA", "Hukum Newton", "Gaya"],
      rating: 4.9,
      remix_count: 8,
      downloads_count: 31,
      created_at: new Date().toISOString()
    }
  ] as any[],
  kelas_data: [
    {
      id: "class_demo_1",
      guru_id: "demo_user",
      kelas_id: "class_demo_1",
      nama_kelas: "8-A Matematika",
      daftar_siswa: ["Andi", "Budi", "Cici", "Dedi", "Elsa", "Farhan", "Gita", "Hendra"],
      nilai_history: [
        {
          topik: "Ujian Aljabar Sederhana",
          tanggal: "2026-05-15",
          scores: {
            "Andi": 82,
            "Budi": 45,
            "Cici": 90,
            "Dedi": 58,
            "Elsa": 75,
            "Farhan": 40,
            "Gita": 88,
            "Hendra": 62
          }
        }
      ],
      laporan_diagnostik: []
    }
  ] as any[]
};

let isTestingConnection = false;
async function testAndInitializeFirestore() {
  if (isTestingConnection) return;
  isTestingConnection = true;
  
  if (!firebaseProjectID) {
    console.info("No Firebase project configurations found. Working in self-healing memory-backup mode.");
    firestoreDb = false;
    return;
  }

  let app;
  try {
    if (!admin.apps.length) {
      app = admin.initializeApp({
        projectId: firebaseProjectID
      });
    } else {
      app = admin.apps[0];
    }
  } catch (err: any) {
    console.error("Firebase Admin initialization failed:", err.message);
    firestoreDb = false;
    return;
  }

  // Check if we can write/read custom database
  if (firebaseDBId) {
    try {
      console.log(`Checking connection to custom database: ${firebaseDBId}...`);
      const customDb = getAdminFirestore(app, firebaseDBId);
      // Try a simple limit-get query to ensure API is open and IAM allows access
      await customDb.collection("guru_profiles").limit(1).get();
      console.log(`Successfully connected to custom database: ${firebaseDBId}`);
      firestoreDb = customDb;
      return;
    } catch (err: any) {
      console.warn(`Failed to connect to custom database ${firebaseDBId} (${err.message}). Trying default database...`);
    }
  }

  // Try the default database
  try {
    console.log("Checking connection to (default) database...");
    const defaultDb = getAdminFirestore(app);
    await defaultDb.collection("guru_profiles").limit(1).get();
    console.log("Successfully connected to (default) database");
    firestoreDb = defaultDb;
    return;
  } catch (err: any) {
    console.warn(`Failed to connect to (default) database (${err.message}). Falling back to memory database mode.`);
  }

  firestoreDb = false; // RAM fallback
}

function getFirestoreDb() {
  if (firestoreDb === null) {
    if (firebaseProjectID) {
      try {
        let app;
        if (!admin.apps.length) {
          app = admin.initializeApp({
            projectId: firebaseProjectID
          });
        } else {
          app = admin.apps[0];
        }
        if (firebaseDBId) {
          firestoreDb = getAdminFirestore(app, firebaseDBId);
        } else {
          firestoreDb = getAdminFirestore(app);
        }
      } catch (err) {
        firestoreDb = false;
      }
    } else {
      firestoreDb = false;
    }
  }
  return firestoreDb || null;
}

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. Generation requests will return warning placeholders.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return geminiClient;
}

// UTILITY TO EXTRACT GURU PROFILE DETAILS TO ENHANCE CONTEXTUAL PROMPT (DNA MENGAJAR)
function buildSystemPromptWithDNA(profil: any): string {
  const defaultPrompt = `Kamu adalah **GuruAI**, asisten pedagogis cerdas yang dirancang khusus untuk guru dan tenaga pendidik di Indonesia. Anda memahami Kurikulum Merdeka, Kurikulum 2013, Fase Perkembangan kognitif, Taksonomi Bloom, dan dinamika pembelajaran di Indonesia (termasuk sarana 3T).

Pilih nada yang hangat, suportif, profesional dalam Bahasa Indonesia, dan panggil guru dengan sebutan "Bapak/Ibu". Gunakan format visual yang indah dengan Markdown yang kaya.`;

  if (!profil) return defaultPrompt;

  return `${defaultPrompt}

### PROFIL GURU (DNA MENGAJAR GURU SAAT INI):
- **Nama Guru:** ${profil.nama || "Bapak/Ibu Guru"}
- **Mata Pelajaran:** ${profil.mapel || "Umum"}
- **Jenjang / Tingkat:** ${profil.jenjang || "SD/SMP/SMA"}
- **Fokus Kurikulum:** ${profil.kurikulum || "Kurikulum Merdeka"}
- **Asal Sekolah / Daerah:** ${profil.sekolah || "Sekolah Lokal"}, ${profil.kota_provinsi || "Indonesia"}
- **Tahun Mengajar:** ${profil.tahun_mengajar || "1"} tahun

### GAYA BAHASA & KONTEN PEDAGOGIS FAVORIT:
- **Pendekatan Favorit:** ${profil.gaya_mengajar?.pendekatan_favorit || "Konstruktivis"}
- **Media Pembelajaran Utama:** ${profil.gaya_mengajar?.media_utama || "Whiteboard / Lembar Kerja Mandiri"}
- **Gaya Bahasa:** ${profil.preferensi_konten?.gaya_bahasa || "semiformal"}
- **Konteks Lokal Utama:** ${profil.preferensi_konten?.konteks_lokal || "Nasional / Lokal pedesaan"}
- **Nilai Karakter Pancasila:** ${profil.preferensi_konten?.nilai_karakter?.join(", ") || "Bernalar Kritis, Gotong Royong"}
- **Gunakan contoh kontekstual nyata Indonesia:** ${profil.preferensi_konten?.contoh_nyata === false ? "Sederhana" : "Ya, sertakan lingkungan dan budaya Indonesia"}
- **Ada humor ringan dalam modul/tugas:** ${profil.preferensi_konten?.humor_ringan ? "Sertakan sedikit humor guru/anekdot hangat" : "Tetap fokus edukatif formal"}

Terapkan semua DNA Mengajar ini secara implisit dalam materi pembelajaran, modul, atau soal kuis yang Anda rancang agar sangat menyatu dengan kepribadian mengajar sang guru!`;
}

// --- API ROUTES ---

// 1. Authenticate / Retrieve or Save Profile
app.get("/api/profile/:uid", async (req, res) => {
  const uid = req.params.uid;
  try {
    const db = getFirestoreDb();
    if (db) {
      try {
        const doc = await db.collection("guru_profiles").doc(uid).get();
        if (doc.exists) {
          return res.json({ status: "success", profile: doc.data() });
        }
      } catch (err: any) {
        console.warn("Firestore profile fetch failed, using memory fallback:", err.message);
      }
    }
    
    if (memoryDb.guru_profiles[uid]) {
      return res.json({ status: "success", profile: memoryDb.guru_profiles[uid] });
    }
    // Return empty fallback
    return res.json({ status: "not_found", message: "Profil baru atau belum dibuat." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/profile", async (req, res) => {
  const { profile } = req.body;
  if (!profile || !profile.uid) {
    return res.status(400).json({ error: "Missing identity profile data UID." });
  }
  try {
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection("guru_profiles").doc(profile.uid).set(profile);
      } catch (err: any) {
        console.warn("Firestore profile save failed, using memory fallback:", err.message);
      }
    }
    // Always sync to memoryDb as backup
    memoryDb.guru_profiles[profile.uid] = profile;
    return res.json({ status: "success", profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Fetch all generated contents belonging to a teacher
app.get("/api/content/all/:guruId", async (req, res) => {
  const { guruId } = req.params;
  try {
    const db = getFirestoreDb();
    if (db) {
      try {
        let docs = [];
        try {
          const snapshot = await db.collection("konten_guru")
            .where("guru_id", "==", guruId)
            .orderBy("created_at", "desc")
            .get();
          docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        } catch (innerErr: any) {
          console.warn("Compound index for 'konten_guru' query may be missing. Falling back to in-memory sort.", innerErr.message);
          const snapshot = await db.collection("konten_guru")
            .where("guru_id", "==", guruId)
            .get();
          docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          docs.sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));
        }
        return res.json({ status: "success", contents: docs });
      } catch (dbErr: any) {
        console.warn("Firestore fetch all contents failed, falling back to memory database:", dbErr.message);
      }
    }
    
    const filtered = memoryDb.konten_guru
      .filter((c) => c.guru_id === guruId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return res.json({ status: "success", contents: filtered });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Generate content using Gemini & current teacher profile context
app.post("/api/content/generate", async (req, res) => {
  const { guruId, tipe, topik, params } = req.body;
  // params: { kelas, kurikulum, ... }
  try {
    // A. Fetch profile to build personalized system context
    let profile: any = null;
    const db = getFirestoreDb();
    if (db) {
      try {
        const doc = await db.collection("guru_profiles").doc(guruId).get();
        if (doc.exists) profile = doc.data();
      } catch (err: any) {
        console.warn("Firestore profile fetch during generate failed, using memory fallback:", err.message);
        profile = memoryDb.guru_profiles[guruId] || null;
      }
    } else {
      profile = memoryDb.guru_profiles[guruId] || null;
    }

    const systemInstruction = buildSystemPromptWithDNA(profile);

    // B. Build exact prompt based on content type
    let prompt = "";
    if (tipe === "modul_ajar") {
      prompt = `Buatlah draf MODUL AJAR lengkap berskala siap pakai dengan modul spesifikasi:
Mata Pelajaran: ${profile?.mapel || "Umum"}
Topik Pembelajaran: ${topik}
Kelas: ${params.kelas || "Umum"}
Kurikulum: ${profile?.kurikulum || "Kurikulum Merdeka"}
Alokasi Waktu: ${params.alokasi || "2 JP x 40 Menit"}

Struktur Modul HARUS mengikuti format Kurikulum Merdeka yang ditentukan:
A. INFORMASI UMUM (Mata pelajaran, Fase/Kelas, Alokasi, Profil Pelajar Pancasila)
B. CAPAIAN & TUJUAN PEMBELAJARAN (TP) - gunakan kata kerja operasional Bloom terukur.
C. PEMAHAMAN BERMAKNA
D. PERTANYAAN PEMANTIK
E. SARANA & PRASARANA (Berikan catatan alternatif 3T tanpa teknologi canggih)
F. KEGIATAN PEMBELAJARAN (LENGKAP: PENDAHULUAN, INTI, PENUTUP. Berikan diferensiasi siswa cerdas vs butuh scaffolding)
G. ASESMEN (Diagnostik awal, Formatif selama kelas, Sumatif di akhir)
H. Kunci penutup refleksi.

Sertakan tips instruksional yang hangat bagi guru di sela-sela modul!`;
    } else if (tipe === "bank_soal") {
      const jSoal = params.jumlahSoal || 5;
      const tKesulitan = params.kesulitan || "sedang";
      prompt = `Rancang draf BANK SOAL (Lembar Kerja Kuis) interaktif dan mendalam untuk siswa:
Mata Pelajaran: ${profile?.mapel || "Umum"}
Topik: ${topik}
Kelas: ${params.kelas || "Umum"}
Tingkat Kesulitan: ${tKesulitan}
Jumlah Soal: ${jSoal}
Format Soal yang Diminta: ${params.formatSoal || "Pilihan Ganda & Esai"}

REQUISITE BLUEPRINT:
Rancang struktur sebaran Bloom kognitif terlebih dahulu (misalnya C2, C3, C4).
- Untuk soal Pilihan Ganda: Buat opsi pengecoh yang masuk akal dan representatif.
- Untuk setiap soal: Sediakan Kunci Jawaban beserta Pembahasan terperinci, aspek konsep kunci, dan level taksonomi Bloom (C1-C6).
- Sertakan rubrik penilaian esai yang komprehensif.`;
    } else if (tipe === "rapor_naratif") {
      prompt = `Tulis narasi komentar rapor perkembangan siswa yang hangat, seimbang, dan membangun.
Nama Siswa: ${params.namaSiswa || "Siswa Teladan"}
Jenis Kelamin: ${params.gender === "L" ? "Laki-laki" : "Perempuan"}
Nilai / Capaian Akademis: ${params.capaian || "Baik"}
Sikap / Perilaku: ${params.karakter || "Aktif, suka mengobrol dengan teman"}
Kekuatan Utama Siswa: ${params.kekuatan || "Kreatif dalam menyelesaikan tugas kelompok"}
Aspek Perkembangan yang Perlu Ditingkatkan: ${params.kebutuhan || "Meningkatkan ketelitian saat mengerjakan hitungan matematis"}

PRINSIP GURAI UNTUK NARASI RAPOR:
- JANGAN menggunakan kalimat template generik yang kaku.
- Berikan kekuatan siswa terlebih dahulu secara tulus dan spesifik.
- Untuk area yang kurang, ganti istilah negatif: "kurang" -> "sedang dalam perjalanan menuju...", "tidak bisa" -> "masih membutuhkan latihan intensif...".
- Berikan kata-kata penyemangat berdaya dorong untuk orang tua dan siswa di akhir komentar.`;
    } else {
      // admin autopilot
      prompt = `Buatlah dokumen administrasi guru yang profesional dan terstruktur sesuai format administrasi sekolah di Indonesia:
Tipe Dokumen: ${params.jenisDokumen || "Undangan Orang Tua / Berita Acara Rapat"}
Topik/Nama Kegiatan: ${topik}
Detail Penyelenggara: Sekolah: ${profile?.sekolah || "Sekolah Lokal"}, Daerah: ${profile?.kota_provinsi || "Daerah"}
Detail Tanggal/Penyelenggaraan: ${params.detailPelaksanaan || "Minggu depan di aula sekolah"}

Pastikan menyertakan elemen resmi: Kop surat standar, nomor lampiran perihal, pembuka, isi, penutup, serta blanko tanda tangan formal yang rapi.`;
    }

    // C. Execute Gemini content generation
    let generatedMarkdown = "";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      generatedMarkdown = `### offline-mode-active
Bapak/Ibu **${profile?.nama || "Guru"}**, kunci API Gemini tidak terdeteksi di server saat ini.
Berikut adalah contoh struktur draf **${tipe.replace("_", " ").toUpperCase()}** tentang **${topik}** untuk simulasi kelas Anda:

*Disimulasikan menggunakan model pedagogis lokal GuruAI:*
1. **Lakukan pendahuluan** dengan kuis apersepsi singkat.
2. **Kembangkan Pembelajaran Bermakna:** Bagaimana materi ${topik} terkait langsung dengan kehidupan murid di daerah ${profile?.kota_provinsi || "lokal Anda"}.
3. **Kuis Latihan:** Minimal 3 pertanyaan terdistribusi Taksonomi Bloom (C2, C3, C4).

_Silakan pasang GEMINI_API_KEY di Secrets Panel AI Studio untuk mengaktifkan AI Copilot yang seutuhnya!_`;
    } else {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
      generatedMarkdown = response.text || "Tidak ada respons dari AI.";
    }

    // D. Save to Firestore / local DB
    const newContent: any = {
      guru_id: guruId,
      guru_nama: profile?.nama || "Bapak/Ibu Guru",
      tipe,
      topik,
      kelas: params.kelas || "Umum",
      kurikulum: profile?.kurikulum || "Kurikulum Merdeka",
      konten: generatedMarkdown,
      created_at: new Date().toISOString(),
      is_published: false
    };

    let savedToFirestore = false;
    if (db) {
      try {
        const savedDoc = await db.collection("konten_guru").add(newContent);
        newContent.id = savedDoc.id;
        savedToFirestore = true;
      } catch (err: any) {
        console.warn("Firestore contents save failed, using memory fallback:", err.message);
      }
    }
    
    if (!savedToFirestore) {
      newContent.id = "konten_" + Math.random().toString(36).substring(2, 11);
      memoryDb.konten_guru.push(newContent);
    }

    res.json({ status: "success", content: newContent });
  } catch (error: any) {
    console.error("Content generation failure:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Publish to Marketplace
app.post("/api/content/publish", async (req, res) => {
  const { contentId, profile } = req.body;
  try {
    let rawContent: any = null;
    const db = getFirestoreDb();
    let isPublishedInFirestore = false;

    if (db) {
      try {
        const doc = await db.collection("konten_guru").doc(contentId).get();
        if (doc.exists) {
          rawContent = doc.data();
          await db.collection("konten_guru").doc(contentId).update({ is_published: true });
          isPublishedInFirestore = true;
        }
      } catch (err: any) {
        console.warn("Firestore publish failed, falling back to memory database:", err.message);
      }
    }

    if (!isPublishedInFirestore) {
      const idx = memoryDb.konten_guru.findIndex((c) => c.id === contentId);
      if (idx !== -1) {
        memoryDb.konten_guru[idx].is_published = true;
        rawContent = memoryDb.konten_guru[idx];
      }
    }

    if (!rawContent) {
      return res.status(404).json({ error: "Content not found." });
    }

    const mItem = {
      original_guru_id: profile.uid,
      original_guru_nama: profile.nama,
      original_sekolah: profile.sekolah || "Sekolah Umum",
      original_kota: profile.kota_provinsi || "Indonesia",
      judul: `${rawContent.tipe === "modul_ajar" ? "Modul Ajar" : "Bank Soal"} - ${rawContent.topik} (${rawContent.kelas})`,
      mapel: profile.mapel || "Umum",
      konten: rawContent.konten,
      tags: [profile.mapel, rawContent.kelas, profile.kurikulum].filter(Boolean),
      rating: 5.0,
      remix_count: 0,
      downloads_count: 1,
      created_at: new Date().toISOString()
    };

    let addedToMarketplaceFirestore = false;
    if (db && isPublishedInFirestore) {
      try {
        await db.collection("marketplace").add(mItem);
        addedToMarketplaceFirestore = true;
      } catch (err: any) {
        console.warn("Firestore marketplace add failed, using memory fallback:", err.message);
      }
    }

    if (!addedToMarketplaceFirestore) {
      const generatedId = "market_" + Math.random().toString(36).substring(2, 11);
      memoryDb.marketplace.push({ id: generatedId, ...mItem });
    }

    res.json({ status: "success" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Fetch Marketplace
app.get("/api/marketplace", async (req, res) => {
  try {
    const db = getFirestoreDb();
    if (db) {
      try {
        let snapshot;
        try {
          snapshot = await db.collection("marketplace").orderBy("created_at", "desc").get();
        } catch (innerErr: any) {
          console.warn("Marketplace created_at index may be missing. Querying without orderBy.", innerErr.message);
          snapshot = await db.collection("marketplace").get();
        }

        if (snapshot.empty) {
          // Seed default marketplace items if empty
          for (const item of memoryDb.marketplace) {
            try {
              await db.collection("marketplace").doc(item.id).set(item);
            } catch (seedErr: any) {
              console.warn("Marketplace seeding single item failed:", seedErr.message);
            }
          }
          try {
            snapshot = await db.collection("marketplace").orderBy("created_at", "desc").get();
          } catch (innerErr: any) {
            console.warn("Marketplace created_at index may be missing during seed check. Querying without orderBy.", innerErr.message);
            snapshot = await db.collection("marketplace").get();
          }
        }
        const items = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        items.sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));
        return res.json({ status: "success", items });
      } catch (dbErr: any) {
        console.warn("Firestore marketplace retrieve failed, falling back to memory database:", dbErr.message);
      }
    }
    
    return res.json({ status: "success", items: memoryDb.marketplace });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Remix Marketplace Content to customized profile style
app.post("/api/marketplace/remix", async (req, res) => {
  const { originalId, guruId } = req.body;
  try {
    let originalItem: any = null;
    let profile: any = null;
    const db = getFirestoreDb();

    if (db) {
      try {
        const docM = await db.collection("marketplace").doc(originalId).get();
        if (docM.exists) originalItem = docM.data();

        const docP = await db.collection("guru_profiles").doc(guruId).get();
        if (docP.exists) profile = docP.data();
      } catch (err: any) {
        console.warn("Firestore fetch during marketplace remix failed, using memory fallback:", err.message);
        originalItem = memoryDb.marketplace.find((m) => m.id === originalId);
        profile = memoryDb.guru_profiles[guruId];
      }
    } else {
      originalItem = memoryDb.marketplace.find((m) => m.id === originalId);
      profile = memoryDb.guru_profiles[guruId];
    }

    if (!originalItem) {
      return res.status(404).json({ error: "Original marketplace material not found." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let remixedContent = "";

    if (!apiKey) {
      remixedContent = `${originalItem.konten}\n\n---\n*Remixed locally by ${profile?.nama || "Anda"} (Offline Mode)*\n- Diadaptasikan untuk kurikulum: ${profile?.kurikulum || "Kurikulum Merdeka"}\n- Nada & gaya bahasa disesuaikan kearifan lokal ${profile?.kota_provinsi || "lokal"}`;
    } else {
      const ai = getGeminiClient();
      const systemInstruction = buildSystemPromptWithDNA(profile);
      const prompt = `Anda menerima konten ajar milik guru lain:
---
${originalItem.konten}
---
Sesuaikan (REMIX) materi ajar di atas agar sesuai dengan DNA mengajar Bapak/Ibu **${profile?.nama || "Guru"}** berikut:
- Kurikulum: ${profile?.kurikulum || "Kurikulum Merdeka"}
- Pendekatan Favorit: ${profile?.gaya_mengajar?.pendekatan_favorit || "Konstruktivis"}
- Karakter & Lokasi: ${profile?.sekolah || "Sekolah Anda"}, di ${profile?.kota_provinsi || "Daerah Anda"}
- Gaya Bahasa: ${profile?.preferensi_konten?.gaya_bahasa || "semiformal"}

Ganti contoh-contoh di atas agar relevan secara kontekstual dengan murid di wilayah ${profile?.kota_provinsi || "lokal Anda"}! Pertahankan kerangka esensial materi pembelajarannya agar tetap bermutu tinggi.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
      remixedContent = response.text || originalItem.konten;
    }

    // Increments original counts
    let updatedInFirestore = false;
    if (db) {
      try {
        await db.collection("marketplace").doc(originalId).update({
          remix_count: admin.firestore.FieldValue.increment(1),
          downloads_count: admin.firestore.FieldValue.increment(1)
        });
        updatedInFirestore = true;
      } catch (err: any) {
        console.warn("Firestore count increment failed, using memory fallback:", err.message);
      }
    }
    
    if (!updatedInFirestore) {
      const idx = memoryDb.marketplace.findIndex((m) => m.id === originalId);
      if (idx !== -1) {
        memoryDb.marketplace[idx].remix_count = (memoryDb.marketplace[idx].remix_count || 0) + 1;
        memoryDb.marketplace[idx].downloads_count = (memoryDb.marketplace[idx].downloads_count || 0) + 1;
      }
    }

    // Saves custom content for remixed teacher
    const newRemixedContent: any = {
      guru_id: guruId,
      guru_nama: profile?.nama || "Bapak/Ibu Guru",
      tipe: "modul_ajar" as const,
      topik: originalItem.judul,
      kelas: "Remix",
      kurikulum: profile?.kurikulum || "Kurikulum Merdeka",
      konten: remixedContent,
      created_at: new Date().toISOString(),
      is_published: false
    };

    let savedRemixToFirestore = false;
    if (db) {
      try {
        const savedDoc = await db.collection("konten_guru").add(newRemixedContent);
        newRemixedContent.id = savedDoc.id;
        savedRemixToFirestore = true;
      } catch (err: any) {
        console.warn("Firestore remixed content save failed, using memory fallback:", err.message);
      }
    }
    
    if (!savedRemixToFirestore) {
      newRemixedContent.id = "konten_" + Math.random().toString(36).substring(2, 11);
      memoryDb.konten_guru.push(newRemixedContent);
    }

    res.json({ status: "success", content: newRemixedContent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get Diagnostic Classes
app.get("/api/diagnostic/all/:guruId", async (req, res) => {
  const { guruId } = req.params;
  try {
    const db = getFirestoreDb();
    if (db) {
      try {
        const snapshot = await db.collection("kelas_data")
          .where("guru_id", "==", guruId)
          .get();
        let docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        
        // Seed default demo class if empty so the user always has a classroom to interact with
        if (docs.length === 0) {
          const demoClass = {
            ...memoryDb.kelas_data[0],
            guru_id: guruId,
            id: "class_demo_" + guruId,
            kelas_id: "class_demo_" + guruId
          };
          try {
            await db.collection("kelas_data").doc(demoClass.id).set(demoClass);
          } catch (seedErr: any) {
            console.warn("Firestore seed class failed:", seedErr.message);
          }
          docs = [demoClass];
        }
        return res.json({ status: "success", classes: docs });
      } catch (dbErr: any) {
        console.warn("Firestore diagnostic classes fetch failed, falling back to memory:", dbErr.message);
      }
    }
    
    // In-memory fallback
    const filtered = memoryDb.kelas_data.filter((k) => k.guru_id === guruId || k.guru_id === "demo_user");
    return res.json({ status: "success", classes: filtered });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Save Classroom list / grades
app.post("/api/diagnostic/save-class", async (req, res) => {
  const { classData } = req.body; // { id, guru_id, nama_kelas, daftar_siswa, nilai_history, ... }
  try {
    const db = getFirestoreDb();
    let savedToFirestore = false;
    if (db) {
      try {
        await db.collection("kelas_data").doc(classData.id).set(classData);
        savedToFirestore = true;
      } catch (dbErr: any) {
        console.warn("Firestore save-class failed, falling back to in-memory:", dbErr.message);
      }
    }
    
    // Always sync in memory as fallback/backup
    const idx = memoryDb.kelas_data.findIndex((c) => c.id === classData.id);
    if (idx !== -1) {
      memoryDb.kelas_data[idx] = classData;
    } else {
      memoryDb.kelas_data.push(classData);
    }
    res.json({ status: "success", classData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Analytical Diagnostic Evaluator
app.post("/api/diagnostic/analyze", async (req, res) => {
  const { guruId, classId, examIndex } = req.body;
  try {
    let profile: any = null;
    let classroom: any = null;
    const db = getFirestoreDb();

    if (db) {
      try {
        const docP = await db.collection("guru_profiles").doc(guruId).get();
        if (docP.exists) profile = docP.data();

        const docC = await db.collection("kelas_data").doc(classId).get();
        if (docC.exists) classroom = docC.data();
      } catch (dbErr: any) {
        console.warn("Firestore diagnostic retrieval during analyze failed, falling back to in-memory:", dbErr.message);
        profile = memoryDb.guru_profiles[guruId];
        classroom = memoryDb.kelas_data.find((c) => c.id === classId);
      }
    } else {
      profile = memoryDb.guru_profiles[guruId];
      classroom = memoryDb.kelas_data.find((c) => c.id === classId);
    }

    if (!classroom) {
      return res.status(404).json({ error: "Class data not found." });
    }

    const exam = classroom.nilai_history[examIndex];
    if (!exam) {
      return res.status(404).json({ error: "Exam history entry not found." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let diagnosisMarkdown = "";

    if (!apiKey) {
      diagnosisMarkdown = `### LAPORAN DIAGNOSTIK KELAS (Simulated offline)
**Topik Ujian:** ${exam.topik}  
**Kelas:** ${classroom.nama_kelas}  

#### Statistik Kasar:
- Total Siswa: ${classroom.daftar_siswa.length}
- Siswa Berprestasi KKM (>75): Elsa, Cici, Gita
- Kelompok Intervensi Remedial Intensif (<60): Budi, Farhan

_Pasang GEMINI_API_KEY di panel Secrets AI Studio untuk analisis multivariabel dan pemetaan kelompok belajar kooperatif otomatis!_`;
    } else {
      const ai = getGeminiClient();
      const systemInstruction = buildSystemPromptWithDNA(profile);
      const prompt = `Lakukan evaluasi pedagogis diagnosa kelas mendalam berdasarkan log ujian berikut:
---
Kelas: ${classroom.nama_kelas}
Topik Assesmen: ${exam.topik}
Siswa terdaftar: ${JSON.stringify(classroom.daftar_siswa)}
Daftar Skor (skala 0 - 100): ${JSON.stringify(exam.scores)}
---

Lakukan analisis statistik dan pedagogis yang mengikuti instruksi template:
1. RINGKASAN STATISTIK (Rerata, nilai tertinggi, nilai terendah, persentase tuntas di atas KKM default 75).
2. PETA KESULITAN KONSEP (Identifikasi miskonsepsi hipotesis & konsep kritis belajar).
3. KELOMPOK INTERVENSI:
   - Kelompok 1: Remedial Intensif (Nilai < 60)
   - Kelompok 2: Pendampingan Terbatas (60 - 74)
   - Kelompok 3: Pengayaan Independen (> 75)
4. REKOMENDASI TINDAK LANJUT SPESIFIK & Actionable untuk Bapak/Ibu Guru, termasuk strategi tutor sebaya (peer-tutoring) bermitra dari Kelompok 3 ke Kelompok 1.

Gunakan data nama siswa dengan inisial atau nama panggilan pertama dari daftar skor saja. Tulis dalam bahasa Indonesia yang penuh kehangatan rekan sejawat!`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2 // low randomness for consistent analytical summaries
        }
      });
      diagnosisMarkdown = response.text || "Tidak dapat memproses analisis.";
    }

    // Append report to the classroom diagnostic list
    const reports = classroom.laporan_diagnostik || [];
    const newReport = {
      id: "rep_" + Math.random().toString(36).substring(2, 11),
      topik: exam.topik,
      tanggal: new Date().toISOString().split("T")[0],
      konten: diagnosisMarkdown
    };
    reports.push(newReport);
    classroom.laporan_diagnostik = reports;

    let savedReportToFirestore = false;
    if (db) {
      try {
        await db.collection("kelas_data").doc(classId).set(classroom);
        savedReportToFirestore = true;
      } catch (err: any) {
        console.warn("Firestore save report failed, using memory fallback:", err.message);
      }
    }
    
    if (!savedReportToFirestore) {
      const idx = memoryDb.kelas_data.findIndex((c) => c.id === classId);
      if (idx !== -1) memoryDb.kelas_data[idx] = classroom;
    }

    res.json({ status: "success", classroom, newReport });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Vision OCR & Homework Assessor
app.post("/api/diagnostic/vision", async (req, res) => {
  const { guruId, imageBase64, kunciJawaban, namaSiswa } = req.body;
  try {
    let profile: any = null;
    const db = getFirestoreDb();
    if (db) {
      try {
        const doc = await db.collection("guru_profiles").doc(guruId).get();
        if (doc.exists) profile = doc.data();
      } catch (err: any) {
        console.warn("Firestore profile fetch during vision failed, using memory fallback:", err.message);
        profile = memoryDb.guru_profiles[guruId];
      }
    } else {
      profile = memoryDb.guru_profiles[guruId];
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let visionAnalysisMarkdown = "";

    if (!apiKey) {
      visionAnalysisMarkdown = `### analisis-vision-offline
Analisis visual lembar jawaban dari **${namaSiswa || "Siswa"}** tidak dapat dieksekusi dikarenakan kunci API Gemini tidak terkonfigurasi.

*Deteksi Simulasi GuruAI:*
- Foto terunggah dengan kapasitas basis: ${(imageBase64.length / 1024).toFixed(1)} KB.
- Guru menginput kunci jawaban: "${kunciJawaban || "tidak dicantumkan"}".

_Silakan pasang GEMINI_API_KEY di Secrets Panel AI Studio untuk mengaktifkan OCR cerdas untuk memindai ujian cetak!_`;
    } else {
      const ai = getGeminiClient();
      const systemInstruction = buildSystemPromptWithDNA(profile);

      // Clean base64 data to get raw string
      let rawBase64 = imageBase64;
      if (imageBase64.includes(";base64,")) {
        rawBase64 = imageBase64.split(";base64,")[1];
      }

      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: rawBase64
        }
      };

      const prompt = `Anda menerima foto berupa lembar jawaban cetak siswa atas nama "${namaSiswa || "Siswa"}".

Lakukan analisis multimodal berikut secara visual:
1. Ekstrak tulisan tangan atau pilihan jawaban siswa pada kertas (OCR).
2. Lakukan evaluasi silang yang cermat dengan kunci jawaban yang diupload guru kunci: "${kunciJawaban || "Gunakan referensi pemecahan matematika/bahasa standar"}".
3. Identifikasi pola kesalahan spesifik dan duga letak miskonsepsi belajar siswa.
4. Buatlah rekomendasi soal remedial kustom 2 nomor untuk meluruskan pemahaman siswa tersebut.

Gunakan sapaan hangat "Bapak/Ibu" dalam menyampaikan draf koreksi visual ini!`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [prompt, imagePart],
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });
      visionAnalysisMarkdown = response.text || "Tidak ada respon visual.";
    }

    res.json({ status: "success", analysis: visionAnalysisMarkdown });
  } catch (error: any) {
    console.error("Vision API processing error:", error);
    res.status(500).json({ error: error.message });
  }
});


// FRONTEND STATIC FILES INTEGRATION WITH VITE MIDDLEWARE
async function startServer() {
  // Pre-test and cache the working Firestore instance
  await testAndInitializeFirestore();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GuruAI is running on http://localhost:${PORT}`);
  });
}

startServer();
