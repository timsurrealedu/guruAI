import React, { useState, useEffect } from "react";
import { ProfilGuru, KontenGuru, KelasData, Jenjang, Kurikulum } from "./types";
import { auth, loginWithGoogle, logoutUser } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";

// Components
import Onboarding from "./components/Onboarding";
import ContentForge from "./components/ContentForge";
import DiagnosticTool from "./components/DiagnosticTool";
import RaporCopilot from "./components/RaporCopilot";
import AdminAutopilot from "./components/AdminAutopilot";
import Marketplace from "./components/Marketplace";

// Icons
import {
  Sparkles,
  User as UserIcon,
  BookOpen,
  Users,
  FileSpreadsheet,
  FileText,
  Globe,
  Settings,
  Flame,
  LogOut,
  FolderOpen,
  PieChart
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"forge" | "profil" | "diag" | "rapor" | "admin" | "market">("forge");
  
  const [profile, setProfile] = useState<ProfilGuru | null>(null);
  const [historyList, setHistoryList] = useState<KontenGuru[]>([]);
  const [classroomList, setClassroomList] = useState<KelasData[]>([]);
  const [loading, setLoading] = useState(true);

  const activeUID = currentUser?.uid || (guestMode ? "simulated_guru_uid" : "");

  // Hydrate session from localStorage on start
  useEffect(() => {
    try {
      const isGuestSaved = localStorage.getItem("guruai_guest_mode") === "true";
      const cachedProfileRaw = localStorage.getItem("guruai_cached_profile");
      if (isGuestSaved && cachedProfileRaw) {
        const parsedProfile = JSON.parse(cachedProfileRaw);
        setGuestMode(true);
        setProfile(parsedProfile);
        setActiveTab("forge");
        fetchHistory(parsedProfile.uid);
        fetchClassrooms(parsedProfile.uid);
        setLoading(false);
      } else if (!isGuestSaved && cachedProfileRaw) {
        // Cache available for logged-in profile
        const parsedProfile = JSON.parse(cachedProfileRaw);
        setProfile(parsedProfile);
        fetchHistory(parsedProfile.uid);
        fetchClassrooms(parsedProfile.uid);
      }
    } catch (e) {
      console.warn("Failed to restore session from localStorage:", e);
    }
  }, []);

  // Whenever profile or guestMode states update, sync to localStorage to maintain access
  useEffect(() => {
    if (profile) {
      localStorage.setItem("guruai_cached_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("guruai_cached_profile");
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("guruai_guest_mode", guestMode ? "true" : "false");
  }, [guestMode]);

  // Start Auth Listeners
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setGuestMode(false);
        fetchProfile(user.uid);
      } else {
        setCurrentUser(null);
        const savedGuestMode = localStorage.getItem("guruai_guest_mode");
        if (savedGuestMode !== "true") {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Teacher Profil
  const fetchProfile = async (uid: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profile/${uid}`);
      const data = await response.json();
      if (data.status === "success" && data.profile) {
        setProfile(data.profile);
        // Load history and classrooms for this teacher
        fetchHistory(uid);
        fetchClassrooms(uid);
      } else {
        // No profile yet, prompt onboarding
        setProfile(null);
        setActiveTab("profil");
      }
    } catch (err) {
      console.error("Gagal memuat profil:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (uid: string) => {
    try {
      const response = await fetch(`/api/content/all/${uid}`);
      const data = await response.json();
      if (data.status === "success") {
        setHistoryList(data.contents);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClassrooms = async (uid: string) => {
    try {
      const response = await fetch(`/api/diagnostic/all/${uid}`);
      const data = await response.json();
      if (data.status === "success") {
        setClassroomList(data.classes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (newProfile: ProfilGuru) => {
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: newProfile })
      });
      const data = await response.json();
      if (data.status === "success") {
        setProfile(data.profile);
        fetchHistory(newProfile.uid);
        fetchClassrooms(newProfile.uid);
        setActiveTab("forge");
        return true;
      } else {
        alert("Gagal menyimpan DNA Profil ke database: " + (data.error || "Kesalahan server"));
        return false;
      }
    } catch (err: any) {
      console.error("Faktor eksternal gagal mendesain profil:", err);
      alert("Terjadi kesalahan jaringan saat menyimpan profil: " + (err.message || err));
      return false;
    }
  };

  const handleSaveClassroom = async (classroom: KelasData) => {
    try {
      const response = await fetch("/api/diagnostic/save-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classData: classroom })
      });
      const data = await response.json();
      if (data.status === "success") {
        fetchClassrooms(activeUID);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Signon Guest Mode immediately (high-utility simulator fallback)
  const handleGuestModeActive = () => {
    setGuestMode(true);
    const mockProfile: ProfilGuru = {
      uid: "simulated_guru_uid",
      nama: "Dian Sastro, S.Pd.",
      mapel: "Matematika & Umum",
      jenjang: Jenjang.SMP,
      kelas: ["Kelas 8"],
      kurikulum: Kurikulum.MERDEKA,
      sekolah: "SMP Negeri Indonesia",
      kota_provinsi: "Jakarta Utara, DKI Jakarta",
      tahun_mengajar: 5,
      gaya_mengajar: {
        pendekatan_favorit: "konstruktivis",
        media_utama: "whiteboard",
        tingkat_interaktivitas: "tinggi"
      },
      preferensi_konten: {
        gaya_bahasa: "semiformal",
        panjang_soal: "sedang",
        jenis_soal_favorit: ["PG", "esai"],
        konteks_lokal: "pesisir",
        nilai_karakter: ["Bernalar Kritis", "Gotong Royong"],
        contoh_nyata: true,
        humor_ringan: true
      },
      standar_kualitas: {
        distribusi_bloom: { C1: 20, C2: 25, C3: 25, C4: 20, C5: 7, C6: 3 },
        tingkat_kesulitan_default: "sedang",
        jumlah_soal_default: 5,
        format_output_default: "lengkap_dengan_rubrik"
      }
    };
    setProfile(mockProfile);
    fetchHistory("simulated_guru_uid");
    fetchClassrooms("simulated_guru_uid");
    setActiveTab("forge");
    setLoading(false);
  };

  const handleAuthGoogleFlow = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        fetchProfile(user.uid);
      }
    } catch (err) {
      console.warn("Auth popup failed/aborted. Continuing guest simulation.");
    }
  };

  const handleSignOutFlow = async () => {
    await logoutUser();
    localStorage.removeItem("guruai_cached_profile");
    localStorage.removeItem("guruai_guest_mode");
    setCurrentUser(null);
    setGuestMode(false);
    setProfile(null);
    setHistoryList([]);
    setClassroomList([]);
  };

  // IF NOT AUTHENTICATED OR ONBOARDED
  if (!activeUID && !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" id="auth-onboarding-screen">
        <div className="max-w-md w-full bg-white rounded-none border-2 border-slate-900 p-8 space-y-6 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-none flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-logo italic text-slate-900 tracking-tight">Guru<span className="text-indigo-600 font-sans font-extrabold not-italic">AI</span></h1>
            <p className="text-slate-500 text-xs font-mono tracking-wider uppercase mt-1">Co-Pilot Pedagogis Guru Indonesia</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 bg-slate-50 text-slate-800 rounded-none text-xs text-left leading-relaxed border-l-4 border-indigo-600">
              🇮🇩 <strong>Didesain Khusus Kurikulum Pendidikan Indonesia:</strong> Memahami Kurikulum Merdeka, RPP diferensiasi, Taksonomi Bloom kognitif, serta karakter lokal agraris/pesisir Indonesia.
            </div>

            <p className="text-slate-500 text-xs">Masuk satu-klik dengan Google Account Anda (direkomendasikan) atau mulai uji coba simulasi gratis instan.</p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleAuthGoogleFlow}
              className="w-full py-3 bg-indigo-600 text-white hover:bg-indigo-700 font-bold uppercase tracking-wider rounded-none transition border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Globe className="w-4 h-4 text-white" />
              Masuk dengan Akun Google
            </button>

            <button
              onClick={handleGuestModeActive}
              className="w-full py-2.5 bg-white border-2 border-slate-900 hover:bg-slate-50 text-slate-900 font-bold uppercase tracking-wider rounded-none transition cursor-pointer text-[11px] active:translate-y-0.5"
            >
              Mulai Modul Simulasi Instan (Guest)
            </button>
          </div>

          <div className="text-[10px] text-slate-400 pt-3 flex items-center justify-center gap-1.5 border-t border-slate-200 font-mono">
            <span>Indonesia SDG 4 Quality Education initiative</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between" id="app-workspace">
      
      {/* GLOBAL NAVBAR / NAVIGATION HEADER */}
      <header className="bg-white border-b-2 border-slate-900 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer animate-none" onClick={() => setActiveTab("forge")}>
            <div className="px-1.5 py-1.5 bg-indigo-600 text-white border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0f172a] rounded-none">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-logo italic text-slate-900 tracking-tight">Guru<span className="text-indigo-600 font-sans font-extrabold not-italic">AI</span></h1>
          </div>

          {/* QUICK SUMMARY OF THE ACTIVE TEACHER DNA */}
          {profile && (
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-600 bg-indigo-50/70 border border-indigo-200 px-3 py-1.5 rounded-none uppercase tracking-wide">
              <span className="font-bold text-indigo-900">{profile.nama}</span>
              <span>•</span>
              <span>{profile.mapel}</span>
              <span>•</span>
              <span className="text-indigo-700 font-bold">{profile.kurikulum}</span>
            </div>
          )}
        </div>

        {/* PROFILE ACTION COLS */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-mono hidden lg:inline border-r border-slate-200 pr-4">UTC +7 JAKARTA</span>
          
          <button
            onClick={handleSignOutFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-900 text-slate-800 hover:bg-slate-50 font-bold rounded-none text-xs transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-indigo-600" />
            Keluar
          </button>
        </div>
      </header>

      {/* DASHBOARD SUMMARY KPI ROW (High UI Polish) */}
      {profile && (
        <section className="bg-white border-b-2 border-slate-900 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-6" id="stats-banner">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-none">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-mono tracking-wider uppercase font-semibold">Penerapan Kurikulum</p>
              <h4 className="text-xs font-bold text-slate-900">{profile.kurikulum} • {profile.jenjang}</h4>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-none">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-mono tracking-wider uppercase font-semibold">Materi Dirancang</p>
              <h4 className="text-xs font-bold text-slate-900">{historyList.length} Draf Disimpan</h4>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-none">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-mono tracking-wider uppercase font-semibold">Kelas Aktif</p>
              <h4 className="text-xs font-bold text-slate-900">{classroomList.length} Rombel Terlacak</h4>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-none">
              <Flame className="w-4 h-4 animate-none" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-mono tracking-wider uppercase font-semibold">Daerah Adaptasi DNA</p>
              <h4 className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{(profile.preferensi_konten?.konteks_lokal || "pesisir").toUpperCase()}</h4>
            </div>
          </div>
        </section>
      )}

      {/* WORKSPACE SEPARATOR WITH INTERACTIVE MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT RAIL: TAB CONFIGURATIONS */}
        <aside className="md:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-1">
            <p className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider px-3 mb-2 border-b border-slate-100 pb-1">Workspace Menu</p>
            
            <button
              onClick={() => setActiveTab("forge")}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-none transition-all text-left cursor-pointer ${
                activeTab === "forge"
                  ? "bg-indigo-600 text-white border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Perangkat Ajar Forge
            </button>

            <button
              onClick={() => setActiveTab("diag")}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-none transition-all text-left cursor-pointer ${
                activeTab === "diag"
                  ? "bg-indigo-600 text-white border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <Users className="w-4 h-4" />
              Diagnostik &amp; Vision
            </button>

            <button
              onClick={() => setActiveTab("rapor")}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-none transition-all text-left cursor-pointer ${
                activeTab === "rapor"
                  ? "bg-indigo-600 text-white border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Rapor Co-Pilot
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-none transition-all text-left cursor-pointer ${
                activeTab === "admin"
                  ? "bg-indigo-600 text-white border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <FileText className="w-4 h-4" />
              Admin Autopilot
            </button>

            <button
              onClick={() => setActiveTab("market")}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-none transition-all text-left cursor-pointer ${
                activeTab === "market"
                  ? "bg-indigo-600 text-white border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <Globe className="w-4 h-4" />
              Remix Marketplace
            </button>
            
            <button
              onClick={() => setActiveTab("profil")}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-none transition-all text-left cursor-pointer ${
                activeTab === "profil"
                  ? "bg-indigo-600 text-white border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <Settings className="w-4 h-4" />
              DNA Profil Saya
            </button>
          </div>

          {/* MINI NOTICE */}
          <div className="bg-slate-50 p-4 rounded-none border-l-4 border-indigo-600 text-[11px] text-slate-700 leading-relaxed font-mono">
            💡 <strong>Rumah Remix Aktif:</strong> Bapak/Ibu dapat mencari modul ajar guru lain di tab Marketplace lalu mengeklik <strong>"Remix dengan DNA-ku"</strong> untuk menyatukannya dengan subjek dan lokasi kearifan lokal Anda secara otomatis.
          </div>
        </aside>

        {/* RIGHT WORK AREA: INJECT CORRESPONDING COMPONENT */}
        <section className="md:col-span-9">
          {!profile && activeTab !== "profil" ? (
            <div className="bg-white p-8 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-center space-y-5" id="missing-profile-warning">
              <div className="w-16 h-16 bg-indigo-50 border-2 border-slate-900 rounded-none flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <Settings className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold font-mono uppercase tracking-wider text-slate-900">DNA Profil Guru Belum Aktif</h3>
              <p className="text-slate-600 text-xs max-w-md mx-auto leading-relaxed">
                Bapak/Ibu perlu melengkapi identitas mengajar (DNA Profil) terlebih dahulu di tab <strong>"DNA PROFIL SAYA"</strong> agar kecerdasan buatan GuruAI dapat menyelaraskan modul, menganalisis penilaian, dan merancang laporan sesuai dengan data kustom Anda.
              </p>
              <button
                onClick={() => setActiveTab("profil")}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono uppercase text-xs tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition cursor-pointer"
                id="btn-go-to-profile"
              >
                Lengkapi DNA Profil Sekarang
              </button>
            </div>
          ) : (
            <>
              {activeTab === "profil" && (
                <Onboarding
                  uid={activeUID}
                  initialProfile={profile}
                  onSave={handleSaveProfile}
                />
              )}

              {activeTab === "forge" && profile && (
                <ContentForge
                  profile={profile}
                  historyList={historyList}
                  onRefreshHistory={() => fetchHistory(activeUID)}
                />
              )}

              {activeTab === "diag" && profile && (
                <DiagnosticTool
                  profile={profile}
                  classroomList={classroomList}
                  onSaveClassroom={handleSaveClassroom}
                  onRefreshClassrooms={() => fetchClassrooms(activeUID)}
                />
              )}

              {activeTab === "rapor" && profile && (
                <RaporCopilot profile={profile} />
              )}

              {activeTab === "admin" && profile && (
                <AdminAutopilot profile={profile} />
              )}

              {activeTab === "market" && profile && (
                <Marketplace
                  profile={profile}
                  onRefreshHistory={() => fetchHistory(activeUID)}
                  onSetTab={setActiveTab}
                />
              )}
            </>
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t-2 border-slate-900 py-6 px-6 text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
        <div>GuruAI &copy; {new Date().getFullYear()} Indonesia Pedagogic Copilot Initiative &bull; SDG 4 Quality Education</div>
        <div className="mt-1 text-[9px] text-slate-400">Powered by Google Gemini &middot; Cloud Run &middot; Firebase Enterprise</div>
      </footer>

    </div>
  );
}
