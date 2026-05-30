import React, { useState, useRef } from "react";
import { ProfilGuru, KelasData } from "../types";
import { Users, Plus, Award, ChevronRight, TrendingUp, Sparkles, BookOpen, FileImage, ShieldAlert, Check } from "lucide-react";

interface DiagnosticToolProps {
  profile: ProfilGuru;
  classroomList: KelasData[];
  onSaveClassroom: (classroom: KelasData) => void;
  onRefreshClassrooms: () => void;
}

export default function DiagnosticTool({ profile, classroomList, onSaveClassroom, onRefreshClassrooms }: DiagnosticToolProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classroomList[0]?.kelas_id || "class_demo_1");
  const [newClassName, setNewClassName] = useState("");
  const [newClassStudents, setNewClassStudents] = useState("");

  const activeClass = classroomList.find((c) => c.kelas_id === selectedClassId) || classroomList[0];

  // Grading Exam State
  const [examName, setExamName] = useState("");
  const [studentGrades, setStudentGrades] = useState<Record<string, number>>({});
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Vision File State
  const [visionStudentName, setVisionStudentName] = useState("");
  const [visionKunciJawaban, setVisionKunciJawaban] = useState("");
  const [visionImageBase64, setVisionImageBase64] = useState<string | null>(null);
  const [visionResult, setVisionResult] = useState<string | null>(null);
  const [visionAnalyzing, setVisionAnalyzing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const list = newClassStudents
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const generatedId = "class_" + Math.random().toString(36).substring(2, 9);
    const newClass: KelasData = {
      id: generatedId,
      guru_id: profile.uid,
      kelas_id: generatedId,
      nama_kelas: newClassName,
      daftar_siswa: list.length > 0 ? list : ["Andi", "Budi", "Cici", "Dedi"],
      nilai_history: [],
      laporan_diagnostik: []
    };

    onSaveClassroom(newClass);
    setSelectedClassId(newClass.kelas_id);
    setNewClassName("");
    setNewClassStudents("");
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !activeClass) return;

    // Build standard scores
    const scores: Record<string, number> = {};
    activeClass.daftar_siswa.forEach((student) => {
      scores[student] = studentGrades[student] !== undefined ? studentGrades[student] : 70;
    });

    const updatedClass = {
      ...activeClass,
      nilai_history: [
        ...activeClass.nilai_history,
        {
          topik: examName,
          tanggal: new Date().toISOString().split("T")[0],
          scores
        }
      ]
    };

    onSaveClassroom(updatedClass);
    setExamName("");
    setStudentGrades({});
  };

  const handleRunDiagnostic = async (examIndex: number) => {
    if (!activeClass) return;
    setAnalyzing(true);
    setActiveAnalysis(null);

    try {
      const response = await fetch("/api/diagnostic/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guruId: profile.uid,
          classId: activeClass.kelas_id,
          examIndex
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setActiveAnalysis(data.newReport.konten);
        onRefreshClassrooms();
      } else {
        alert("Eror saat menganalisis diagnosa: " + data.error);
      }
    } catch (err: any) {
      alert("Gagal memanggil API Diagnosa: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Upload visual exam logic
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setVisionImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunVisionAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visionImageBase64) {
      alert("Mohon pilih atau unggah lembar foto jawaban kuis terlebih dahulu.");
      return;
    }

    setVisionAnalyzing(true);
    setVisionResult(null);

    try {
      const response = await fetch("/api/diagnostic/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guruId: profile.uid,
          imageBase64: visionImageBase64,
          kunciJawaban: visionKunciJawaban,
          namaSiswa: visionStudentName || "Siswa S1"
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setVisionResult(data.analysis);
      } else {
        alert("Eror memproses visual OCR: " + data.error);
      }
    } catch (err: any) {
      alert("Gagal menghubungi API Vision: " + err.message);
    } finally {
      setVisionAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8" id="diagnostic-panel">
      
      {/* HEADER CARD */}
      <div className="bg-white p-5 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] rounded-none">
            <Users className="w-6 h-6 animate-none" />
          </div>
          <div>
            <h2 className="text-xl font-sans font-bold text-slate-900 mb-0.5">Detektif Kesulitan (Analisis Diagnostik Kelas)</h2>
            <p className="text-slate-500 font-mono text-[11px] uppercase tracking-wider">Kelompokkan remedial kustom siswa dan jalankan OCR lembar jawaban cetak.</p>
          </div>
        </div>

        {/* SELECT ACTIVE CLASS */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 whitespace-nowrap">Pilih Kelas:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-850 bg-white text-xs font-bold font-mono focus:outline-none w-full md:w-auto cursor-pointer"
          >
            {classroomList.map((c) => (
              <option key={c.kelas_id} value={c.kelas_id}>{c.nama_kelas}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CLASSROOM CONTROL & ADD MARKS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CREATE NEW CLASS */}
          <div className="bg-white p-5 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 border-b-2 border-slate-200 pb-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Daftarkan Kelas Baru
            </h3>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-600 mb-1">Nama Rombel / Kelas</label>
                <input
                  type="text"
                  placeholder="Kelas 8-B Matematika..."
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-600 mb-1">Daftar Nama Siswa (Pisahkan Koma)</label>
                <textarea
                  placeholder="Andi, Budi, Candra, Desi"
                  value={newClassStudents}
                  onChange={(e) => setNewClassStudents(e.target.value)}
                  className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white h-16 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                Buat Rombel Kelas
              </button>
            </form>
          </div>

          {/* INPUT EXAM MARKS */}
          {activeClass && (
            <div className="bg-white p-5 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 border-b-2 border-slate-200 pb-2">
                <Award className="w-4 h-4 text-indigo-600" /> Input Buku Nilai Ujian
              </h3>
              <form onSubmit={handleAddExam} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-600 mb-1">Nama Ujian / Penilaian</label>
                  <input
                    type="text"
                    placeholder="Penilaian Harian SPLDV..."
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-2 border-t-2 border-slate-100 pt-2.5 max-h-48 overflow-y-auto pr-1">
                  <span className="block text-[10px] uppercase font-bold font-mono text-slate-400 mb-1">Nilai Siswa (Skala 0-100):</span>
                  {activeClass.daftar_siswa.map((student) => (
                    <div key={student} className="flex items-center justify-between text-xs py-1 border-b border-dashed border-slate-100">
                      <span className="text-slate-700 font-bold font-sans select-none truncate max-w-[120px]">{student}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="70"
                        value={studentGrades[student] !== undefined ? studentGrades[student] : ""}
                        onChange={(e) => setStudentGrades({
                          ...studentGrades,
                          [student]: parseInt(e.target.value) || 0
                        })}
                        className="w-16 px-1.5 py-0.5 border-2 border-slate-900 rounded-none text-center font-mono font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Simpan Buku Nilai
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REVIEWS, STATS ANALYZERS & VISION COMPONENT */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STATS HISTORY & ANALYZE ACTION */}
          <div className="bg-white p-5 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex flex-wrap items-center justify-between border-b-2 border-slate-200 pb-2.5">
              <span className="font-sans font-bold text-base text-slate-950">Evaluasi Diagnostik: {activeClass?.nama_kelas}</span>
              <span className="text-xs text-indigo-600 font-bold font-mono">KKM TUNTAS &ge; 75</span>
            </h3>

            {(!activeClass || activeClass.nilai_history.length === 0) ? (
              <p className="text-slate-400 text-xs py-12 text-center border-2 border-dashed border-slate-300 rounded-none bg-slate-50/20 font-mono">
                Belum ada rekap nilai ujian yang tersimpan. Silakan isi form di sebelah kiri untuk menginput ujian murid Anda.
              </p>
            ) : (
              <div className="space-y-4">
                {activeClass.nilai_history.map((exam, examIdx) => (
                  <div key={examIdx} className="border-2 border-slate-900 rounded-none p-4 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm font-sans">{exam.topik}</h4>
                      <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider">Tanggal: {exam.tanggal} &bull; Total: {activeClass.daftar_siswa.length} Murid</p>
                      
                      {/* Mini grade values badge preview */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {Object.entries(exam.scores).slice(0, 5).map(([name, val]) => (
                          <span key={name} className={`text-[10px] px-2 py-0.5 rounded-none font-mono font-bold border ${
                            val >= 75 ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {name}: {val}
                          </span>
                        ))}
                        {Object.keys(exam.scores).length > 5 && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 self-center">+{Object.keys(exam.scores).length - 5} LAINNYA</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRunDiagnostic(examIdx)}
                      disabled={analyzing}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all disabled:opacity-50 self-start sm:self-center cursor-pointer active:translate-y-0.5 active:shadow-none"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {analyzing ? "Mendiagnosis..." : "Diagnostik Remedial AI"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* EXPAND DIAGNOSIS RESULT */}
            {analyzing && (
              <div className="p-6 border-2 border-slate-900 bg-indigo-50/20 rounded-none text-center space-y-2 animate-pulse">
                <Sparkles className="w-6 h-6 text-indigo-600 mx-auto animate-spin" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">Mengkalkulasikan Peta Remedial Kelas...</h4>
                <p className="text-slate-500 font-mono text-[10px]">Memecah data kognitif ke taksonomi Bloom, melacak miskonsepsi fundamental, dan menyusun partner tutor sebaya secara instan.</p>
              </div>
            )}

            {activeAnalysis && (
              <div className="border-2 border-slate-900 bg-indigo-50/20 rounded-none p-5 space-y-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-indigo-600" /> Laporan Diagnostik Remedial Terbaru
                  </span>
                  <button
                    onClick={() => setActiveAnalysis(null)}
                    className="text-xs font-mono font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest cursor-pointer"
                  >
                    [Tutup]
                  </button>
                </div>
                <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans prose prose-slate">
                  {activeAnalysis}
                </div>
              </div>
            )}
          </div>

          {/* MULTIMODAL VISION OCR & HOMEWORK EVALUATION */}
          <div className="bg-white p-5 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 border-b-2 border-slate-200 pb-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" /> Vision OCR: Analisis Visual Jawaban Murid
            </h3>
            
            <form onSubmit={handleRunVisionAnalysis} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-755 mb-1">Nama Siswa yang Dikoreksi</label>
                  <input
                    type="text"
                    placeholder="contoh: Farhan"
                    value={visionStudentName}
                    onChange={(e) => setVisionStudentName(e.target.value)}
                    className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-755 mb-1">Kunci Jawaban Ujian (Opsional)</label>
                  <input
                    type="text"
                    placeholder="contoh: 1. A, 2. B, 3. D..."
                    value={visionKunciJawaban}
                    onChange={(e) => setVisionKunciJawaban(e.target.value)}
                    className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* UPLOAD TRIGGER WITH DRAG & DROP DESIGN */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Upload box */}
                <div className="md:col-span-6">
                  <span className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-1">Unggah Lembar Jawaban (Foto)</span>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-none p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] hover:bg-slate-50/50 ${
                      visionImageBase64 ? "border-emerald-500 bg-emerald-50/20" : "border-slate-350"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {visionImageBase64 ? (
                      <div className="space-y-1">
                        <img
                          src={visionImageBase64}
                          alt="preview sheet"
                          className="w-20 h-20 object-cover rounded-none border-2 border-slate-900 mx-auto mb-1.5 shadow-[2px_2px_0px_0px_#0f172a]"
                        />
                        <p className="text-[10px] font-mono font-bold text-indigo-700 flex items-center justify-center gap-1 uppercase tracking-wider">
                          <Check className="w-3.5 h-3.5" /> Foto Siap Dienkripsi
                        </p>
                        <p className="text-[9px] font-mono text-slate-400">Klik untuk mengganti foto</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <FileImage className="w-7 h-7 text-slate-500 mx-auto" />
                        <h5 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-700">Pilih / Seret Foto Jawaban</h5>
                        <p className="text-[9px] font-mono text-slate-400 leading-normal px-2">Format JPEG, PNG dari kamera handphone siswa atau berkas pdf scan</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preset simulator triggers */}
                <div className="md:col-span-6 flex flex-col justify-end space-y-2">
                  <span className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500">Simulasikan Lembar Ujian:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVisionStudentName("Dodi");
                      setVisionKunciJawaban("1. B, 2. C, 3. A, 4. D");
                      // Base64 generic short visual placeholder
                      setVisionImageBase64("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
                    }}
                    className="w-full text-left p-2.5 rounded-none bg-indigo-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:bg-indigo-100 text-[10.5px] font-mono text-indigo-900 font-bold tracking-tight transition cursor-pointer"
                  >
                    Simulasi: Lembar Ujian Dodi (SPLDV Aljabar)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVisionStudentName("Gita");
                      setVisionKunciJawaban("Tabel pengamatan sel tumbuhan dengan kloroplas terbaca");
                      setVisionImageBase64("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
                    }}
                    className="w-full text-left p-2.5 rounded-none bg-slate-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:bg-slate-100 text-[10.5px] font-mono text-slate-900 font-bold tracking-tight transition cursor-pointer"
                  >
                    Simulasi: Gambar Sel Biologi Gita (Kloroplas)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={visionAnalyzing || !visionImageBase64}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-xs font-bold font-mono uppercase tracking-wider text-white rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5 active:shadow-none"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {visionAnalyzing ? "Mengevaluasi Kertas Kuis (OCR)..." : "Analisis Lembar Jawaban (Vision)"}
              </button>
            </form>

            {/* VISION ANALYSIS RESULT */}
            {visionAnalyzing && (
              <div className="p-6 border-2 border-slate-900 bg-slate-50 rounded-none text-center space-y-1 animate-pulse">
                <Sparkles className="w-5 h-5 text-indigo-600 mx-auto animate-spin" />
                <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">Membaca Kertas Visual Lewat API Vision...</h5>
                <p className="text-[10px] font-mono text-slate-500">Mendeteksi tulisan tangan, mencocokkan coretan pensil, dan mengklasifikasikan kepahaman kompetensi.</p>
              </div>
            )}

            {visionResult && (
              <div className="border-2 border-slate-900 bg-indigo-50/20 rounded-none p-5 space-y-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1.5">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-900">
                    Hasil Koreksi Vision: {visionStudentName}
                  </span>
                  <button
                    onClick={() => setVisionResult(null)}
                    className="text-[10px] uppercase font-mono font-bold text-slate-500 hover:text-slate-800 tracking-wider cursor-pointer"
                  >
                    [Tutup]
                  </button>
                </div>
                <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans prose prose-indigo">
                  {visionResult}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
