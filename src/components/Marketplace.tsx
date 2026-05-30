import React, { useState, useEffect } from "react";
import { ProfilGuru, MarketplaceItem } from "../types";
import { Search, Globe2, Sparkles, Download, Check, AlertCircle } from "lucide-react";

interface MarketplaceProps {
  profile: ProfilGuru;
  onRefreshHistory: () => void;
  onSetTab: (tab: "forge" | "profil" | "diag" | "rapor" | "admin" | "market") => void;
}

export default function Marketplace({ profile, onRefreshHistory, onSetTab }: MarketplaceProps) {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("Semua");
  const [loading, setLoading] = useState(false);
  
  // Remix state
  const [remixingId, setRemixingId] = useState<string | null>(null);
  const [successRemix, setSuccessRemix] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/marketplace");
      const data = await response.json();
      if (data.status === "success") {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Gagal menarik data marketplace:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleRemix = async (item: MarketplaceItem) => {
    if (!item.id) return;
    setRemixingId(item.id);
    setSuccessRemix(false);

    try {
      const response = await fetch("/api/marketplace/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalId: item.id,
          guruId: profile.uid
        })
      });

      const data = await response.json();
      if (data.status === "success") {
        setSuccessRemix(true);
        onRefreshHistory();
        // Prompt to go to studio to view the remixed element
        setTimeout(() => {
          setSuccessRemix(false);
          setRemixingId(null);
          // Redirect to creator studio tab
          onSetTab("forge");
        }, 3000);
      } else {
        alert("Gagal melakukan remix kustom: " + data.error);
        setRemixingId(null);
      }
    } catch (err: any) {
      alert("Kesalahan transmisi remix: " + err.message);
      setRemixingId(null);
    }
  };

  // Get unique tags/subjects
  const tagsList = ["Semua", "Matematika", "Fisika", "Biologi", "IPA", "IPS", "Bahasa Inggris"];

  const filteredItems = items.filter((item) => {
    if (!item) return false;
    const judul = item.judul || "";
    const konten = item.konten || "";
    const original_guru_nama = item.original_guru_nama || "";
    const mapel = item.mapel || "";
    const tags = item.tags || [];

    const matchesSearch = judul.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          konten.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          original_guru_nama.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = selectedTag === "Semua" || 
                       mapel.toLowerCase() === selectedTag.toLowerCase() || 
                       tags.some(t => (t || "").toLowerCase() === selectedTag.toLowerCase());

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6" id="marketplace-panel">
      
      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-5 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari RRP, Kuis, topik pembelajaran, atau guru kontributor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-slate-900 rounded-none text-slate-800 text-xs focus:outline-none bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Filter Scrollable */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {tagsList.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-none text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer border-2 border-slate-900 ${
                selectedTag === tag
                  ? "bg-indigo-600 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {successRemix && (
        <div className="bg-indigo-50 border-2 border-slate-900 text-indigo-950 p-4 rounded-none text-xs flex items-center justify-center gap-2.5 font-bold font-mono animate-bounce max-w-xl mx-auto shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-spin" />
          <span>REMIX BERHASIL! Menyelaraskan modul dengan kearifan lokal Anda. Mengalihkan ke editor...</span>
        </div>
      )}

      {/* ITEMS CATALOG GRID */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 animate-pulse font-mono text-xs uppercase tracking-wider">
          <Globe2 className="w-8 h-8 text-indigo-600 mx-auto animate-spin mb-3" />
          Membuka Katalog Pendidikan Guru Indonesia...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-none border-2 border-dashed border-slate-300">
          <AlertCircle className="w-10 h-10 text-slate-550 mx-auto mb-3" />
          <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-900">Materi mengajar tidak ditemukan</h4>
          <p className="text-slate-500 font-mono text-xs mt-1">Coba sesuaikan kata pencarian atau pilihan kategori filter subjek Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-6 space-y-4 flex flex-col justify-between transition-all">
              
              {/* Card Meta Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {/* Subject badge and stats */}
                  <span className="px-2 py-0.5 border-2 border-slate-900 rounded-none text-[9px] font-bold font-mono uppercase bg-amber-100 text-slate-900">
                    {item.mapel}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-650 font-mono font-bold uppercase">
                    <span>★ {item.rating?.toFixed(1) || "5.0"}</span>
                    <span>•</span>
                    <span>{item.downloads_count || 0} Unduh</span>
                    <span>•</span>
                    <span>{item.remix_count || 0} Remix</span>
                  </div>
                </div>

                <h4 className="font-serif italic font-bold text-slate-950 text-base leading-snug">{item.judul}</h4>
                
                <p className="text-[10px] font-mono text-slate-600 uppercase">
                  Kontributor: <strong className="text-slate-900">{item.original_guru_nama}</strong> ({item.original_sekolah}, {item.original_kota})
                </p>
              </div>

              {/* Card Code block preview */}
              <div className="p-3 bg-slate-50 rounded-none text-slate-600 text-xs font-mono max-h-24 overflow-hidden leading-normal border-2 border-slate-900 select-none">
                {item.konten}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t-2 border-dashed border-slate-200 mt-2">
                
                {/* tags array */}
                <div className="hidden sm:flex flex-wrap gap-1.5">
                  {(item.tags || []).slice(0, 2).map((t) => (
                    <span key={t} className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-none bg-slate-50 text-slate-700 border-2 border-slate-950">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {remixingId === item.id ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-indigo-50 text-indigo-900 font-bold font-mono uppercase text-[10px] tracking-wider rounded-none border-2 border-slate-900 animate-pulse w-full sm:w-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      Remixing...
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemix(item)}
                      disabled={remixingId !== null}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold font-mono uppercase text-[10px] tracking-wider rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-colors cursor-pointer w-full sm:w-auto text-center"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Remix materi
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
