import React, { useState } from "react";
import { ProfilGuru } from "../types";
import { BookOpen, Sparkles, Clipboard, Check, Printer } from "lucide-react";

interface RaporCopilotProps {
  profile: ProfilGuru;
}

export default function RaporCopilot({ profile }: RaporCopilotProps) {
  const [namaSiswa, setNamaSiswa] = useState("");
  const [gender, setGender] = useState("L");
  const [capaian, setCapaian] = useState("Sangat Baik, menyelesaikan tugas tepat waktu");
  const [karakter, setKarakter] = useState("Sopan, senang menolong, bergotong-royong");
  const [kekuatan, setKekuatan] = useState("Kemampuan komunikasi verbal menonjol, antusias berdiskusi kelompok");
  const [kebutuhan, setKebutuhan] = useState("Meningkatkan ketelitian coretan hitungan matematika dasar");

  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [copying, setCopying] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSiswa.trim()) {
      alert("Mohon masukkan nama siswa terlebih dahulu.");
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
          tipe: "rapor_naratif",
          topik: `Rapor Naratif: ${namaSiswa}`,
          params: {
            namaSiswa,
            gender,
            capaian,
            karakter,
            kekuatan,
            kebutuhan
          }
        })
      });

      const data = await response.json();
      if (data.status === "success") {
        setResultText(data.content.konten);
      } else {
        alert("Gagal memproses narasi rapor: " + data.error);
      }
    } catch (err: any) {
      alert("Gagal menghubungi API Rapor: " + err.message);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="rapor-copilot-panel">
      
      {/* INPUT FORM */}
      <div className="lg:col-span-5 bg-white p-5 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
        <h3 className="text-base font-serif italic text-slate-950 font-bold flex items-center gap-2 border-b-2 border-slate-200 pb-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> Co-Pilot Rapor Naratif
        </h3>
        <p className="text-slate-500 font-mono text-xs leading-relaxed uppercase tracking-wider">
          Tuliskan poin mentah capaian siswa. GuruAI akan mengubahnya menjadi narasi konstruktif verbal yang berakar moral Pancasila.
        </p>

        <form onSubmit={handleGenerate} className="space-y-3.5 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-650 mb-1">Nama Siswa</label>
              <input
                type="text"
                placeholder="contoh: Gibran Wardana"
                value={namaSiswa}
                onChange={(e) => setNamaSiswa(e.target.value)}
                className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-650 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-850 font-bold font-mono text-xs focus:outline-none bg-slate-50"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-650 mb-1">Capaian Akademis Umum</label>
            <input
              type="text"
              placeholder="Nilai rata-rata 80, mapel sejarah sangat mumpuni..."
              value={capaian}
              onChange={(e) => setCapaian(e.target.value)}
              className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-650 mb-1">Sikap / Karakter Sosial</label>
            <input
              type="text"
              placeholder="Ramah, santun, senang menolong sesama..."
              value={karakter}
              onChange={(e) => setKarakter(e.target.value)}
              className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-650 mb-1">Kekuatan Menonjol Murid</label>
            <input
              type="text"
              placeholder="Kemampuan komunikasi verbal menonjol..."
              value={kekuatan}
              onChange={(e) => setKekuatan(e.target.value)}
              className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-650 mb-1">Aspek yang Perlu Ditingkatkan</label>
            <input
              type="text"
              placeholder="Meningkatkan ketelitian coretan hitungan matematika..."
              value={kebutuhan}
              onChange={(e) => setKebutuhan(e.target.value)}
              className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-100" />
            {loading ? "MENYUSUN NARASI..." : "TULIS RAPOR NARATIF SEKETIKA"}
          </button>
        </form>
      </div>

      {/* COMPACT OUTPUT VIEW */}
      <div className="lg:col-span-7">
        {loading ? (
          <div className="bg-white rounded-none p-12 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-center h-full min-h-[350px] flex flex-col items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-indigo-600 mx-auto animate-spin mb-3.5" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 text-center">Menenun Dialog Rekomendasi Karakter...</h4>
            <p className="text-slate-500 font-mono text-[10px] max-w-xs mt-2 leading-relaxed">Mengemas apresiasi pedagogis tulus, memoles deskripsi tantangan berkelanjutan, dan memberikan dorongan semangat tuntas.</p>
          </div>
        ) : resultText ? (
          <div className="bg-white rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] h-full flex flex-col min-h-[350px]">
            <div className="px-5 py-3 border-b-2 border-slate-900 flex flex-wrap items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold font-mono uppercase text-slate-900 tracking-wider">Draf Rapor Naratif</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white border-2 border-slate-900 hover:bg-slate-50 text-[10px] font-mono font-bold uppercase rounded-none text-slate-800 cursor-pointer active:translate-y-0.5"
                >
                  {copying ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Clipboard className="w-3.5 h-3.5 text-slate-400" />}
                  {copying ? "Disalin!" : "Salin Teks"}
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
            
            <div className="flex-1 p-6 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {resultText}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-none p-12 border-2 border-dashed border-slate-350 text-center flex flex-col items-center justify-center h-full min-h-[350px]">
            <div className="p-3 bg-slate-50 border border-slate-900 rounded-none mb-4">
              <BookOpen className="w-7 h-7 text-slate-550" />
            </div>
            <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-800">Display Narasi Rapor Rapi</h4>
            <p className="text-slate-500 font-mono text-[10px] max-w-xs mt-2 leading-relaxed">
              Draf narasi rapor yang positif, konstruktif, dan sesuai profil pancasila milik murid Anda akan tampil di jendela panel kanan ini setelah penulisan berhasil.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
