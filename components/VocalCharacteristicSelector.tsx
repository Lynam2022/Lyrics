
import React from 'react';
import { VocalCharacteristic, Language } from '../types';
import { MicrophoneIcon } from './icons';

interface VocalCharacteristicSelectorProps {
  selectedCharacteristics: VocalCharacteristic[];
  onToggleCharacteristic: (characteristic: VocalCharacteristic) => void;
  language: Language;
}

const TEXT = {
    vn: {
        label: "ĐẶC ĐIỂM GIỌNG HÁT",
        selected: "đã chọn",
        note: "* Chọn các đặc điểm để AI định hình phong cách mix & master phù hợp nhất."
    },
    en: {
        label: "VOCAL TONE & CHARACTER",
        selected: "selected",
        note: "* Select characteristics to help AI shape the perfect mix & master style."
    }
};

// Reverse mapping for display purposes since Enums are in Vietnamese
const CHAR_MAP: Record<string, string> = {
    'Trầm ấm': 'Warm',
    'Vang': 'Resonant',
    'Mạnh mẽ': 'Powerful',
    'Sắc': 'Sharp',
    'Ngọt ngào': 'Sweet',
    'Mộc mạc': 'Rustic',
    'Thiết tha': 'Passionate',
    'Tình cảm': 'Emotional',
    'Mùi mẫn': 'Melismatic',
    'Luyến láy': 'Vibrato',
    'Trong trẻo': 'Clear',
    'Cao vút': 'High-Pitched',
    'Hơi': 'Breathy',
    'Giọng mũi': 'Nasal',
    'Khàn': 'Raspy',
    'Mượt mà': 'Smooth',
    'Mong manh': 'Vulnerable'
};

const VocalCharacteristicSelector: React.FC<VocalCharacteristicSelectorProps> = ({ selectedCharacteristics, onToggleCharacteristic, language }) => {
  const characteristics = Object.values(VocalCharacteristic);
  const t = TEXT[language];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-2">
            <MicrophoneIcon className="w-5 h-5 text-teal-400" />
            <label className="block text-base font-bold text-teal-300 uppercase tracking-wider">
                {t.label}
            </label>
        </div>
        <span className="text-xs text-gray-500 italic font-medium">
            {selectedCharacteristics.length} {t.selected}
        </span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {characteristics.map((char) => {
          const isSelected = selectedCharacteristics.includes(char);
          const displayLabel = language === 'vn' ? char : (CHAR_MAP[char] || char);

          return (
            <button
              key={char}
              type="button"
              onClick={() => onToggleCharacteristic(char)}
              className={`
                px-4 py-2 text-sm font-bold rounded-xl border transition-all duration-200 ease-in-out select-none tracking-wide
                ${isSelected
                  ? 'bg-teal-500/20 border-teal-500 text-teal-100 shadow-[0_0_10px_rgba(20,184,166,0.2)] transform scale-105 ring-1 ring-teal-500/50'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-gray-500 hover:text-gray-200'
                }
              `}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2 pl-1 font-medium opacity-80">
          {t.note}
      </p>
    </div>
  );
};

export default VocalCharacteristicSelector;
