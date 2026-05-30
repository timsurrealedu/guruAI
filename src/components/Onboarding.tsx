import React, { useState } from "react";
import { ProfilGuru, Kurikulum, Jenjang } from "../types";
import { Save, Sparkles, BookOpen, User, Lightbulb, MapPin } from "lucide-react";

interface OnboardingProps {
  initialProfile: ProfilGuru | null;
  onSave: (profile: ProfilGuru) => Promise<boolean>;
  uid: string;
}

export default function Onboarding({ initialProfile, onSave, uid }: OnboardingProps) {
  const [profile, setProfile] = useState<ProfilGuru>({
    uid,
    nama: initialProfile?.nama || "",
    mapel: initialProfile?.mapel || "Matematika",
    jenjang: initialProfile?.jenjang || Jenjang.SMP,
    kelas: initialProfile?.kelas || ["Kelas 8"],
    kurikulum: initialProfile?.kurikulum || Kurikulum.MERDEKA,
    sekolah: initialProfile?.sekolah || "",
    kota_provinsi: initialProfile?.kota_provinsi || "",
    tahun_mengajar: initialProfile?.tahun_mengajar || 3,
    gaya_mengajar: {
      pendekatan_favorit: initialProfile?.gaya_mengajar?.pendekatan_favorit || "konstruktivis",
      media_utama: initialProfile?.gaya_mengajar?.media_utama || "whiteboard",
      tingkat_interaktivitas: initialProfile?.gaya_mengajar?.tingkat_interaktivitas || "tinggi",
    },
    preferensi_konten: {
      gaya_bahasa: initialProfile?.preferensi_konten?.gaya_bahasa || "semiformal",
      panjang_soal: initialProfile?.preferensi_konten?.panjang_soal || "sedang",
      jenis_soal_favorit: initialProfile?.preferensi_konten?.jenis_soal_favorit || ["PG", "esai"],
      konteks_lokal: initialProfile?.preferensi_konten?.konteks_lokal || "pesisir",
      nilai_karakter: initialProfile?.preferensi_konten?.nilai_karakter || ["Bernalar Kritis", "Gotong Royong"],
      contoh_nyata: initialProfile?.preferensi_konten?.contoh_nyata ?? true,
      humor_ringan: initialProfile?.preferensi_konten?.humor_ringan ?? true,
    },
    standar_kualitas: {
      distribusi_bloom: initialProfile?.standar_kualitas?.distribusi_bloom || {
        C1: 20, C2: 25, C3: 25, C4: 20, C5: 7, C6: 3
      },
      tingkat_kesulitan_default: initialProfile?.standar_kualitas?.tingkat_kesulitan_default || "sedang",
      jumlah_soal_default: initialProfile?.standar_kualitas?.jumlah_soal_default || 5,
      format_output_default: initialProfile?.standar_kualitas?.format_output_default || "lengkap_dengan_rubrik"
    }
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.nama || !profile.mapel || !profile.sekolah) {
      alert("Mohon isi nama, mata pelajaran, dan sekolah Anda.");
      return;
    }
    setSaving(true);
    setSuccess(false);

    try {
      const isSaved = await onSave(profile);
      if (isSaved) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err: any) {
      console.error(err);
      alert("Terjadi kesalahan teknis: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleCheckboxChange = (field: "preferensi_konten" | "gaya_mengajar", subField: string, value: string) => {
    if (field === "preferensi_konten" && subField === "jenis_soal_favorit") {
      const current = profile.preferensi_konten.jenis_soal_favorit;
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setProfile({
        ...profile,
        preferensi_konten: { ...profile.preferensi_konten, jenis_soal_favorit: updated }
      });
    }
  };

  return (
    <div className="bg-white rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden" id="onboarding-panel">
      <div className="bg-indigo-600 border-b-2 border-slate-900 px-6 py-8 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white text-indigo-600 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] rounded-none">
            <Sparkles className="w-6 h-6 animate-none" />
          </div>
          <div>
            <h2 className="text-2xl font-serif italic font-medium tracking-tight">DNA Mengajar Bapak/Ibu Guru</h2>
            <p className="text-indigo-100 text-xs font-mono mt-1 uppercase tracking-wider">Konfigurasikan preferensi pedagogis Anda agar semua materi disesuaikan secara otomatis.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        {/* IDENTITAS GRU */}
        <div className="space-y-4">
          <h3 className="text-base font-serif italic text-slate-950 flex items-center gap-2 border-b-2 border-slate-200 pb-2">
            <User className="w-5 h-5 text-indigo-600" /> Profil Pribadi Belajar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Nama Lengkap (Beserta Gelar)</label>
              <input
                id="guru-nama-input"
                type="text"
                placeholder="Dr. Hendra Wijaya, M.Pd."
                value={profile.nama}
                onChange={(e) => setProfile({ ...profile, nama: e.target.value })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Mata Pelajaran Utama</label>
              <input
                type="text"
                placeholder="Matematika, IPA, Bahasa Indonesia..."
                value={profile.mapel}
                onChange={(e) => setProfile({ ...profile, mapel: e.target.value })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Jenjang Mengajar</label>
              <select
                value={profile.jenjang}
                onChange={(e) => setProfile({ ...profile, jenjang: e.target.value as Jenjang })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm cursor-pointer"
              >
                {Object.values(Jenjang).map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1 font-mono">Kurikulum Aktif</label>
              <select
                value={profile.kurikulum}
                onChange={(e) => setProfile({ ...profile, kurikulum: e.target.value as Kurikulum })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm cursor-pointer"
              >
                {Object.values(Kurikulum).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Pengalaman Mengajar (Tahun)</label>
              <input
                type="number"
                min="0"
                value={profile.tahun_mengajar}
                onChange={(e) => setProfile({ ...profile, tahun_mengajar: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Nama Sekolah</label>
              <input
                type="text"
                placeholder="SMP Negeri 2 Jakarta..."
                value={profile.sekolah}
                onChange={(e) => setProfile({ ...profile, sekolah: e.target.value })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Kota &amp; Provinsi</label>
              <input
                type="text"
                placeholder="Wonosobo, Jawa Tengah..."
                value={profile.kota_provinsi}
                onChange={(e) => setProfile({ ...profile, kota_provinsi: e.target.value })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm"
              />
            </div>
          </div>
        </div>

        {/* GAYA MENGAJAR */}
        <div className="space-y-4">
          <h3 className="text-base font-serif italic text-slate-950 flex items-center gap-2 border-b-2 border-slate-200 pb-2">
            <Lightbulb className="w-5 h-5 text-indigo-600" /> Metode &amp; Karakter Kelas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Karakter Pendekatan</label>
              <select
                value={profile.gaya_mengajar.pendekatan_favorit}
                onChange={(e) => setProfile({
                  ...profile,
                  gaya_mengajar: { ...profile.gaya_mengajar, pendekatan_favorit: e.target.value }
                })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm cursor-pointer"
              >
                <option value="konstruktivis">Konstruktivis (Siswa Menemukan Konsep)</option>
                <option value="berbasis_proyek">PBL (Project Based Learning)</option>
                <option value="langsung">Direct Instruction (Eksplanasi Langsung)</option>
                <option value="inkuiri">Inkuiri Bebas (Investigasi Terpandu)</option>
                <option value="tematik">Tematik Terintegrasi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Media Pembelajaran Utama</label>
              <select
                value={profile.gaya_mengajar.media_utama}
                onChange={(e) => setProfile({
                  ...profile,
                  gaya_mengajar: { ...profile.gaya_mengajar, media_utama: e.target.value }
                })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm cursor-pointer"
              >
                <option value="whiteboard">Whiteboard &amp; Lembar Kerja Cetak</option>
                <option value="PowerPoint">PowerPoint &amp; Proyektor Visual</option>
                <option value="hands-on">Hands-on Sederhana / Eksperimen Alat Sekitar</option>
                <option value="video">Pembelajaran Audio Visual / YouTube</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Tingkat Interaksi Kelas</label>
              <select
                value={profile.gaya_mengajar.tingkat_interaktivitas}
                onChange={(e) => setProfile({
                  ...profile,
                  gaya_mengajar: { ...profile.gaya_mengajar, tingkat_interaktivitas: e.target.value }
                })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm cursor-pointer"
              >
                <option value="sangat_tinggi">Sangat Tinggi (Banyak Diskusi &amp; Game Belajar)</option>
                <option value="tinggi">Tinggi (Interupsi Tanya-Jawab Sering)</option>
                <option value="sedang">Sedang (Gabungan Teori &amp; Tanya Jawab)</option>
                <option value="rendah">Rendah (Penyampaian Fokus &amp; Tertib)</option>
              </select>
            </div>
          </div>
        </div>

        {/* KEARIFAN LOKAL & PERANGKAT SOAL */}
        <div className="space-y-4">
          <h3 className="text-base font-serif italic text-slate-950 flex items-center gap-2 border-b-2 border-slate-200 pb-2">
            <MapPin className="w-5 h-5 text-indigo-600" /> Preferensi Konten &amp; Kearifan Lokal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Gaya Pembawaan Bahasa AI</label>
              <select
                value={profile.preferensi_konten.gaya_bahasa}
                onChange={(e) => setProfile({
                  ...profile,
                  preferensi_konten: { ...profile.preferensi_konten, gaya_bahasa: e.target.value }
                })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm cursor-pointer"
              >
                <option value="semiformal">Semiformal (Hangat, Rileks - Direkomendasikan)</option>
                <option value="formal">Sangat Formal (Bahasa Baku Peraturan)</option>
                <option value="santai">Atraktif &amp; Riang (Populer bagi Kelas Muda)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Konteks Kearifan Lokal</label>
              <select
                value={profile.preferensi_konten.konteks_lokal}
                onChange={(e) => setProfile({
                  ...profile,
                  preferensi_konten: { ...profile.preferensi_konten, konteks_lokal: e.target.value }
                })}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm cursor-pointer"
              >
                <option value="pesisir">Masyarakat Pesisir &amp; Kelautan</option>
                <option value="agraris">Masyarakat Agraris, Sawah, &amp; Perkebunan</option>
                <option value="perkotaan">Masyarakat Perkotaan modern &amp; Wirausaha</option>
                <option value="pegunungan">Lembah Pegunungan &amp; Kehutanan</option>
                <option value="nasional">Kebhinnekaan Nasional Umum</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Karakter Profil Pancasila</label>
              <select
                multiple
                value={profile.preferensi_konten.nilai_karakter}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions).map((opt: any) => opt.value);
                  setProfile({
                    ...profile,
                    preferensi_konten: { ...profile.preferensi_konten, nilai_karakter: options }
                  });
                }}
                className="w-full px-3.5 py-2 border-2 border-slate-900 rounded-none text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 text-sm h-20 cursor-pointer"
              >
                <option value="Bernalar Kritis">Bernalar Kritis</option>
                <option value="Gotong Royong">Gotong Royong</option>
                <option value="Kreatif">Kreatif</option>
                <option value="Mandiri">Mandiri</option>
                <option value="Berkebinekaan Global">Berkebinekaan Global</option>
                <option value="Beriman &amp; Bertakwa">Beriman &amp; Bertakwa</option>
              </select>
              <p className="text-[10px] font-mono text-slate-400 mt-1">Tahan Ctrl/Cmd untuk memilih beberapa.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 text-sm">
              <input
                type="checkbox"
                checked={profile.preferensi_konten.contoh_nyata}
                onChange={(e) => setProfile({
                  ...profile,
                  preferensi_konten: { ...profile.preferensi_konten, contoh_nyata: e.target.checked }
                })}
                className="w-4 h-4 rounded-none border-2 border-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              Gunakan Contoh Kontekstual Masalah Sosial di Indonesia
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 text-sm">
              <input
                type="checkbox"
                checked={profile.preferensi_konten.humor_ringan}
                onChange={(e) => setProfile({
                  ...profile,
                  preferensi_konten: { ...profile.preferensi_konten, humor_ringan: e.target.checked }
                })}
                className="w-4 h-4 rounded-none border-2 border-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              Sisipkan Humor Guru Sederhana / Anekdot Hangat
            </label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-6 flex flex-wrap items-center justify-between border-t border-slate-200 gap-4">
          <p className="text-slate-400 text-[10px] font-mono leading-none">GURUAL v2.0 &bull; POWERED BY GOOGLE GEMINI</p>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold font-mono text-xs uppercase tracking-widest rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-indigo-700 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "MENYIMPAN DNA..." : "SIMPAN DNA PEDAGOGIS & MULAI"}
          </button>
        </div>
      </form>

      {success && (
        <div className="bg-indigo-50 border-t-2 border-slate-900 text-indigo-900 py-3.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider font-mono">
          <BookOpen className="w-4 h-4 text-indigo-600 animate-pulse" /> Profil DNA Mengajar Anda berhasil disimpan dan diaktifkan!
        </div>
      )}
    </div>
  );
}
