import React, { useState, useEffect } from "react";
import { ProfilGuru, KontenGuru } from "../types";
import { Sparkles, FileText, Download, Check, Clipboard, Bookmark, History, Globe2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface ContentForgeProps {
  profile: ProfilGuru;
  onRefreshHistory: () => void;
  historyList: KontenGuru[];
}

export default function ContentForge({ profile, onRefreshHistory, historyList }: ContentForgeProps) {
  const [activeTab, setActiveTab] = useState<"modul" | "kuis">("modul");
  const [topik, setTopik] = useState("");
  const [kelas, setKelas] = useState("Kelas 8");
  const [alokasi, setAlokasi] = useState("2 JP (2 x 40 menit)");
  
  // Kuis config
  const [jumlahSoal, setJumlahSoal] = useState(5);
  const [kesulitan, setKesulitan] = useState("sedang");
  const [formatSoal, setFormatSoal] = useState("PG & Esai");

  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<KontenGuru | null>(null);
  const [copying, setCopying] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topik.trim()) {
      alert("Mohon masukkan topik pembelajaran terlebih dahulu.");
      return;
    }

    setLoading(true);
    setGeneratedContent(null);
    setPublished(false);

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guruId: profile.uid,
          tipe: activeTab === "modul" ? "modul_ajar" : "bank_soal",
          topik,
          params: {
            kelas,
            alokasi,
            jumlahSoal,
            kesulitan,
            formatSoal
          }
        })
      });

      const data = await response.json();
      if (data.status === "success") {
        setGeneratedContent(data.content);
        onRefreshHistory();
      } else {
        alert("Eror saat menghubungi GuruAI: " + (data.error || "Gagal membuat konten."));
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal memanggil API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent.konten);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handlePublish = async () => {
    if (!generatedContent || !generatedContent.id) return;
    setPublishing(true);
    try {
      const response = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: generatedContent.id,
          profile
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setPublished(true);
        // Toggle flag locally
        setGeneratedContent({ ...generatedContent, is_published: true });
        onRefreshHistory();
      } else {
        alert("Gagal mempublikasikan: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const selectHistoryItem = (item: KontenGuru) => {
    setGeneratedContent(item);
    setTopik(item.topik);
    setKelas(item.kelas);
    setPublished(item.is_published);
    setActiveTab(item.tipe === "modul_ajar" ? "modul" : "kuis");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="content-forge-panel">
      
      {/* FORM INPUT / LEFT COLUMN */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-none p-5 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          {/* TAB CHANGER */}
          <div className="flex bg-slate-100 p-1 rounded-none border-2 border-slate-900 mb-5">
            <button
              onClick={() => { setActiveTab("modul"); setGeneratedContent(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-none transition-all cursor-pointer ${
                activeTab === "modul"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-4 h-4" />
              Modul Ajar
            </button>
            <button
              onClick={() => { setActiveTab("kuis"); setGeneratedContent(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-none transition-all cursor-pointer ${
                activeTab === "kuis"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Bank Soal / Kuis
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">
                {activeTab === "modul" ? "Topik / Bab Pembelajaran" : "Topik / Materi Ujian"}
              </label>
              <input
                type="text"
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                placeholder="Aljabar Linear, Ekosistem Laut, Teks Prosedur..."
                className="w-full px-3 py-2 border-2 border-slate-900 rounded-none text-slate-800 text-sm focus:outline-none focus:border-indigo-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Tingkat Kelas</label>
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-900 rounded-none text-slate-800 text-sm focus:outline-none focus:border-indigo-600 bg-white cursor-pointer"
                >
                  <option value="PAUD Fondasi">PAUD (Fondasi)</option>
                  <option value="Kelas 1">Kelas 1 (Fase A)</option>
                  <option value="Kelas 2">Kelas 2 (Fase A)</option>
                  <option value="Kelas 3">Kelas 3 (Fase B)</option>
                  <option value="Kelas 4">Kelas 4 (Fase B)</option>
                  <option value="Kelas 5">Kelas 5 (Fase C)</option>
                  <option value="Kelas 6">Kelas 6 (Fase C)</option>
                  <option value="Kelas 7">Kelas 7 (Fase D)</option>
                  <option value="Kelas 8">Kelas 8 (Fase D)</option>
                  <option value="Kelas 9">Kelas 9 (Fase D)</option>
                  <option value="Kelas 10">Kelas 10 (Fase E)</option>
                  <option value="Kelas 11">Kelas 11 (Fase F)</option>
                  <option value="Kelas 12">Kelas 12 (Fase F)</option>
                </select>
              </div>

              {activeTab === "modul" ? (
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Alokasi Waktu</label>
                  <input
                    type="text"
                    value={alokasi}
                    onChange={(e) => setAlokasi(e.target.value)}
                    placeholder="2 JP (2 x 40 menit)"
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-none text-slate-800 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Jumlah Soal</label>
                  <select
                     value={jumlahSoal}
                     onChange={(e) => setJumlahSoal(parseInt(e.target.value))}
                     className="w-full px-3 py-2 border-2 border-slate-900 rounded-none text-slate-800 text-sm focus:outline-none focus:border-indigo-600 bg-white cursor-pointer"
                  >
                    <option value="3">3 Nomor</option>
                    <option value="5">5 Nomor</option>
                    <option value="10">10 Nomor (Rekomendasi)</option>
                    <option value="15">15 Nomor</option>
                  </select>
                </div>
              )}
            </div>

            {activeTab === "kuis" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Tingkat Kesulitan</label>
                  <select
                     value={kesulitan}
                     onChange={(e) => setKesulitan(e.target.value)}
                     className="w-full px-3 py-2 border-2 border-slate-900 rounded-none text-slate-800 text-sm focus:outline-none focus:border-indigo-600 bg-white cursor-pointer"
                  >
                    <option value="mudah">Mudah (Pemahaman C1-C2)</option>
                    <option value="sedang">Sedang (Metode Aplikasi C3-C4)</option>
                    <option value="sulit">HOTS (Analisis Menganalisis C5-C6)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Format Soal</label>
                  <select
                     value={formatSoal}
                     onChange={(e) => setFormatSoal(e.target.value)}
                     className="w-full px-3 py-2 border-2 border-slate-900 rounded-none text-slate-800 text-sm focus:outline-none focus:border-indigo-600 bg-white cursor-pointer"
                  >
                    <option value="Pilihan Ganda">Pilihan Ganda Saja</option>
                    <option value="Esai &amp; Uraian">Esai / Uraian Saja</option>
                    <option value="Campuran PG &amp; Uraian">Campuran (Paling Ideal)</option>
                  </select>
                </div>
              </div>
            )}

            <button
               type="submit"
               disabled={loading}
               className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold font-mono uppercase tracking-widest rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer mt-2"
            >
              <Sparkles className="w-4 h-4 text-white" />
              {loading ? "Menenun Draf..." : "Buat dengan DNA Pedagogis"}
            </button>
          </form>
        </div>

        {/* RECENT HISTORI COLUMN */}
        <div className="bg-white rounded-none p-5 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-3">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
            <History className="w-4 h-4 text-indigo-600" /> Histori Penyusunan
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {historyList.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">Bapak/Ibu belum pernah menyusun materi melalui Forge ini.</p>
            ) : (
              historyList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectHistoryItem(item)}
                  className={`w-full text-left p-3 rounded-none border-2 text-xs transition-all flex items-center justify-between cursor-pointer ${
                    generatedContent?.id === item.id
                      ? "bg-indigo-50/50 border-indigo-600 shadow-[1.5px_1.5px_0px_0px_#0f172a]"
                      : "bg-slate-50/55 border-slate-200 hover:border-slate-900"
                  }`}
                >
                  <div className="truncate pr-4">
                    <span className={`inline-block px-1.5 py-0.5 rounded-none border font-semibold font-mono text-[9px] uppercase tracking-wide mb-1 ${
                      item.tipe === "modul_ajar" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {item.tipe === "modul_ajar" ? "Modul" : "Soal / Kuis"}
                    </span>
                    <h4 className="font-bold text-slate-800 truncate">{item.topik}</h4>
                    <p className="text-slate-500 mt-0.5">{item.kelas} • {item.kurikulum}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CONTENT PREVIEW / RIGHT COLUMN */}
      <div className="lg:col-span-7">
        {loading ? (
          <div className="bg-white rounded-none p-12 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col items-center justify-center text-center h-full min-h-[400px]">
            <div className="relative mb-6">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-none animate-spin"></div>
              <Sparkles className="w-5 h-5 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h4 className="text-base font-sans font-bold text-slate-900">Menyampul Modul Pedagogis Terbaik...</h4>
            <p className="text-slate-500 text-xs font-mono max-w-sm mt-3 leading-relaxed">
              GuruAI sedang membaca profil DNA mengajar Bapak/Ibu, merancang indikator Taksonomi Bloom, mengecek kearifan lokal, dan menyusun teks ajar.
            </p>
          </div>
        ) : generatedContent ? (
          <div className="bg-white rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] h-full flex flex-col min-h-[450px]">
            {/* ACTION HEADER */}
            <div className="px-5 py-4 border-b-2 border-slate-900 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-none">
              <div>
                <span className="text-[10px] font-mono tracking-wider font-extrabold text-indigo-600 select-none uppercase">BERHASIL DIGENERATE</span>
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">{generatedContent.topik}</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-900 hover:bg-slate-50 active:bg-slate-100 text-xs font-bold font-mono uppercase rounded-none text-slate-800 transition cursor-pointer"
                  title="Salin Markdown"
                >
                  {copying ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Disalin!
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                      Salin
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-900 hover:bg-slate-50 text-xs font-bold font-mono uppercase rounded-none text-slate-800 transition cursor-pointer"
                  title="Cetak sebagai PDF"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  PDF
                </button>

                {published ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-none border border-emerald-400">
                    <Globe2 className="w-3.5 h-3.5" />
                    Telah Berbagi
                  </span>
                ) : (
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold font-mono uppercase text-white rounded-none border border-slate-900 transition cursor-pointer disabled:opacity-50"
                  >
                    <Globe2 className="w-3.5 h-3.5 text-indigo-200" />
                    {publishing ? "Berbagi..." : "Bagikan"}
                  </button>
                )}
              </div>
            </div>

            {/* PREVIEW CONTENT BODY */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[500px] text-sm text-slate-800 prose prose-indigo max-w-none custom-scrollbar">
              <div className="p-4 bg-indigo-50/40 text-slate-800 rounded-none text-xs leading-relaxed mb-6 border-l-4 border-indigo-600 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Modul Terlindungi DNA Bapak/Ibu:</strong> Teks ajar ini sepenuhnya dibuat dengan menyesuaikan profil instruktur <strong>{profile.nama}</strong>, berakar pada kearifan lokal <strong>{profile?.preferensi_konten?.konteks_lokal || "pesisir"}</strong>, dan mengajarkan nilai karakter Pancasila.
                </div>
              </div>
              
              {/* Render Markdown blocks */}
              <div className="space-y-4 font-sans leading-relaxed text-slate-900">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    h1: ({ children }) => <h1 className="text-xl md:text-2xl font-sans font-bold text-slate-950 border-b-2 border-slate-200 pb-2.5 mt-6 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg md:text-xl font-sans font-bold text-slate-950 mt-5 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base md:text-lg font-sans font-bold text-slate-900 mt-4 mb-2.5">{children}</h3>,
                    p: ({ children }) => <p className="text-slate-800 leading-relaxed mb-4 text-sm font-sans">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-800 text-sm font-sans">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-800 text-sm font-sans">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-800 leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-indigo-600 bg-slate-50 pl-4 py-2.5 pr-2.5 my-5 text-slate-700 text-xs md:text-sm leading-relaxed">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                        <table className="min-w-full divide-y-2 divide-slate-900 text-xs md:text-sm bg-white font-sans">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-[#f8fafc] text-slate-950 font-bold border-b-2 border-slate-900">{children}</thead>,
                    tbody: ({ children }) => <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>,
                    tr: ({ children }) => <tr className="hover:bg-slate-50/70 transition-colors">{children}</tr>,
                    th: ({ children }) => <th className="px-4 py-3 text-left font-bold border-r-2 border-slate-900 last:border-r-0 select-none uppercase tracking-wider text-[10px] sm:text-xs">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-3 border-r border-slate-205 last:border-r-0 text-slate-850 leading-relaxed">{children}</td>,
                    code: ({ node, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      return (
                        <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 font-mono text-xs rounded font-semibold border border-slate-200" {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => <pre className="bg-slate-905 text-slate-100 p-4 rounded-none font-mono text-xs overflow-x-auto shadow-inner my-5 whitespace-pre-wrap leading-relaxed border-2 border-slate-900">{children}</pre>,
                  }}
                >
                  {generatedContent.konten}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-none p-12 border-2 border-dashed border-slate-300 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="p-3 bg-slate-100 rounded-none border border-slate-400 mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-800">Studio Pembuat Materi Ajar</h4>
            <p className="text-slate-500 text-xs font-mono max-w-xs mt-2 leading-relaxed">
              Isi form di sebelah kiri dengan materi yang ingin Anda ajarkan hari ini lalu klik tombol generate. Modul lengkap berstruktur nasional akan tersusun seketika.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
