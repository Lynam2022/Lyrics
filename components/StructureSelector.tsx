
import React from 'react';
import { SongStructure, Language } from '../types';

interface StructureSelectorProps {
  selectedStructure: SongStructure;
  onSelectStructure: (structure: SongStructure) => void;
  customInput: string;
  onCustomInputChange: (value: string) => void;
  language: Language;
}

const TEXT = {
    vn: {
        label: "CẤU TRÚC BÀI HÁT",
        details: {
            standard: "Cấu trúc kinh điển: Verse - Chorus - Verse - Chorus - Reprise - Outro.",
            bridge: "Thêm đoạn Bridge (Cầu nối) tạo cao trào cảm xúc trước Chorus cuối.",
            pop: "Phong cách Pop hiện đại với Pre-Chorus xây dựng kịch tính và Bridge.",
            rap: "Cấu trúc Rap/Hip-Hop: 3 đoạn Verse dài để kể chuyện, xen kẽ Hook bắt tai.",
            edm: "Cấu trúc nhạc điện tử/Dance: Verse dẫn dắt, Build Up đẩy kịch tính, Drop bùng nổ.",
            custom: "Tự thiết kế cấu trúc bài hát theo ý muốn của bạn."
        },
        placeholder: "Nhập cấu trúc mong muốn (VD: Verse 1 - Chorus - Rap - Chorus...)"
    },
    en: {
        label: "SONG STRUCTURE",
        details: {
            standard: "Classic flow: Verse - Chorus - Verse - Chorus - Reprise - Outro.",
            bridge: "Adds a Bridge for an emotional peak before the final Chorus.",
            pop: "Modern Pop style with Pre-Choruses building tension and a Bridge.",
            rap: "Rap/Hip-Hop structure: 3 long Verses for storytelling, interleaved with catchy Hooks.",
            edm: "Electronic/Dance flow: Verse leads in, Build Up raises tension, Drop explodes.",
            custom: "Design your own song structure exactly how you want it."
        },
        placeholder: "Enter desired structure (e.g., Verse 1 - Chorus - Rap - Chorus...)"
    }
};

const VN_TITLES: Record<SongStructure, string> = {
    [SongStructure.Standard]: "Tiêu Chuẩn",
    [SongStructure.WithBridge]: "Có Bridge (Cầu nối)",
    [SongStructure.Pop]: "Pop / Hiện đại",
    [SongStructure.Rap]: "Rap / Hip-Hop",
    [SongStructure.EDM]: "EDM / Dance / Vinahouse",
    [SongStructure.Custom]: "Tùy chỉnh (Custom)"
};

const StructureSelector: React.FC<StructureSelectorProps> = ({ 
    selectedStructure, 
    onSelectStructure, 
    customInput,
    onCustomInputChange,
    language 
}) => {
  const structures = Object.values(SongStructure);
  const t = TEXT[language];

  const getStructureDetails = (s: SongStructure) => {
    switch (s) {
      case SongStructure.Standard: return t.details.standard;
      case SongStructure.WithBridge: return t.details.bridge;
      case SongStructure.Pop: return t.details.pop;
      case SongStructure.Rap: return t.details.rap;
      case SongStructure.EDM: return t.details.edm;
      case SongStructure.Custom: return t.details.custom;
      default: return "";
    }
  };

  const getStructureTitle = (s: SongStructure) => {
      if (language === 'vn') {
          return VN_TITLES[s] || s;
      }
      return s.split('(')[0].trim();
  };

  return (
    <div>
      <label className="block text-base font-bold text-teal-300 uppercase tracking-wider mb-3">
        {t.label}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
        {structures.map((structure) => (
          <div key={structure} className="relative">
            <button
                type="button"
                onClick={() => onSelectStructure(structure)}
                className={`w-full px-5 py-3 text-left rounded-xl border transition-all duration-300 ease-in-out group relative overflow-hidden
                ${
                    selectedStructure === structure
                    ? 'bg-gradient-to-r from-cyan-900/40 to-teal-900/40 border-cyan-500 ring-1 ring-cyan-400/50 shadow-lg'
                    : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800 hover:border-gray-500'
                }`}
            >
                <div className={`font-bold text-base mb-1.5 transition-colors ${selectedStructure === structure ? 'text-teal-300' : 'text-gray-300 group-hover:text-white'}`}>
                    {getStructureTitle(structure)}
                </div>
                <div className="text-sm text-gray-400 font-medium leading-relaxed opacity-90">
                    {getStructureDetails(structure)}
                </div>
                {structure !== SongStructure.Custom && (
                    <div className={`mt-2.5 text-[10px] font-mono p-1 rounded bg-black/30 inline-block ${selectedStructure === structure ? 'text-cyan-200' : 'text-gray-500'}`}>
                        {structure.match(/\((.*?)\)/)?.[1]}
                    </div>
                )}
                
                {selectedStructure === structure && (
                    <div className="absolute right-0 top-0 h-full w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                )}
            </button>

            {/* Custom Input Field - Only shows when Custom is selected */}
            {structure === SongStructure.Custom && selectedStructure === SongStructure.Custom && (
                <div className="mt-3 animate-fade-in px-1">
                    <textarea
                        value={customInput}
                        onChange={(e) => onCustomInputChange(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full bg-gray-900/80 border border-teal-500/50 rounded-xl p-4 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm leading-relaxed shadow-inner font-medium"
                        rows={3}
                    />
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StructureSelector;
