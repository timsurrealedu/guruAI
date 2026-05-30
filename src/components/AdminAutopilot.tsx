import React, { useState } from "react";
import { ProfilGuru } from "../types";
import { FileText, Sparkles, Clipboard, Check, Printer } from "lucide-react";

interface AdminAutopilotProps {
  profile: ProfilGuru;
}

export default function AdminAutopilot({ profile }: AdminAutopilotProps) {
  const [jenisDokumen, setJenisDokumen] = useState("Undangan Rapat Orang Tua / Wali Murid");
  const [topik, setTopik] = useState("Koordinasi Evaluasi Hasil Belajar Semester Genap");
  const [detailPelaksanaan, setDetailPelaksanaan] = useState("Sabtu, 6 Juni 2026 jam 09.00 WIB s.d Selesai di Aula Atas Sekolah");

  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [copying, setCopying] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topik.trim() || !detailPelaksanaan.trim()) {
      alert("Mohon lengkapi perihal topik dan detail pelaksanaan acara.");
      return;
    }

    setLoading(true);
    setResultText("");

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guruId: profile.uid,
          tipe: "admin_autopilot",
          topik,
          params: {
            jenisDokumen,
            detailPelaksanaan
          }
        })
      });

      const data = await response.json();
      if (data.status === "success") {
        setResultText(data.content.konten);
      } else {
        alert("Gagal merumuskan dokumen formal: " + data.error);
      }
    } catch (err: any) {
      alert("Gagal memanggil API Autopilot: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="admin-autopilot-panel">
      
      {/* INPUT COLS */}
      <div className="lg:col-span-5 bg-white p-5 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
        <h3 className="text-base font-serif italic text-slate-950 font-bold flex items-center gap-2 border-b-2 border-slate-200 pb-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Admin Autopilot
        </h3>
        <p className="text-slate-500 font-mono text-xs leading-relaxed uppercase tracking-wider">
          Urus birokrasi sekolah tanpa hambatan. Pilih tipe surat resmi, definisikan isinya secara kasat, dan saksikan draf format KOP formal siap guna seketika.
        </p>

        <form onSubmit={handleGenerate} className="space-y-4 pt-2">
          <div>
            <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-655 mb-1">Tipe Draft Dokumen</label>
            <select
              value={jenisDokumen}
              onChange={(e) => setJenisDokumen(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-900 rounded-none text-slate-850 font-bold font-mono text-xs focus:outline-none bg-slate-50"
            >
              <option value="Undangan Rapat Orang Tua / Wali Murid">Surat Undangan Rapat Orang Tua / Wali</option>
              <option value="Berita Acara Rapat Kenaikan Kelas">Berita Acara Rapat Dewan Pendidik</option>
              <option value="Agenda Supervisi Bulanan Kelas">Agenda Supervisi Kelas / Kunjungan Kelas</option>
              <option value="Proposal Singkat Kegiatan Ekstrakurikuler">Proposal Kegiatan Singkat Ekskul</option>
              <option value="Surat Permohonan Izin Kegiatan Lapangan">Surat Permohonan Izin Kegiatan Lapangan</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-655 mb-1">Perihal / Topik Surat</label>
            <input
              type="text"
              placeholder="contoh: Pembagian Laporan Rapor UTS"
              value={topik}
              onChange={(e) => setTopik(e.target.value)}
              className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-655 mb-1">Detail Tempat / Waktu / Keterangan</label>
            <textarea
              placeholder="contoh: Sabtu 14 Maret di GSG Sekolah, jam 08.00 WIB. Dimohon membawa fotokopi akta murid."
              value={detailPelaksanaan}
              onChange={(e) => setDetailPelaksanaan(e.target.value)}
              className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white h-24"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-100" />
            {loading ? "MENYUSUN DOKUMEN..." : "URUS ADMINISTRASI INSTAN"}
          </button>
        </form>
      </div>

      {/* PREVIEW COL */}
      <div className="lg:col-span-7">
        {loading ? (
          <div className="bg-white rounded-none p-12 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-center h-full min-h-[350px] flex flex-col items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-indigo-600 mx-auto animate-spin mb-3.5" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 text-center">Merapikan Format Kop Birokrasi...</h4>
            <p className="text-slate-500 font-mono text-[10px] max-w-xs mt-2 leading-relaxed">Mengintegrasikan nama sekolah, membakar blanko ttd kepala sekolah, dan merapikan sapaan pembuka formal.</p>
          </div>
        ) : resultText ? (
          <div className="bg-white rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] h-full flex flex-col min-h-[350px]">
            <div className="px-5 py-3 border-b-2 border-slate-900 flex flex-wrap items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold font-mono uppercase text-slate-900 tracking-wider">Administrasi Terbit</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white border-2 border-slate-900 hover:bg-slate-50 text-[10px] font-mono font-bold uppercase rounded-none text-slate-800 cursor-pointer active:translate-y-0.5"
                >
                  {copying ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Clipboard className="w-3.5 h-3.5 text-slate-400" />}
                  {copying ? "Disalin!" : "Salin Surat"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white border-2 border-slate-900 hover:bg-slate-50 text-[10px] font-mono font-bold uppercase rounded-none text-slate-800 cursor-pointer active:translate-y-0.5"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  Cetak
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre bg-slate-50/55 overflow-x-auto max-h-[450px]">
              {resultText}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-none p-12 border-2 border-dashed border-slate-350 text-center flex flex-col items-center justify-center h-full min-h-[350px]">
            <div className="p-3 bg-slate-50 border border-slate-900 rounded-none mb-4">
              <FileText className="w-7 h-7 text-slate-550" />
            </div>
            <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-800">Display KOP Surat Sekolah</h4>
            <p className="text-slate-500 font-mono text-[10px] max-w-xs mt-2 leading-relaxed">
              Surat birokrasi, agenda kunjungan pengawas, atau proposal ekstra yang Anda buat dengan standar dinas Indonesia akan tampil rapi di panel kanan setelah generate sukses.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
