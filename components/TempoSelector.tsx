
import React from 'react';
import { Language } from '../types';

interface TempoSelectorProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
  language: Language;
}

const TEXT = {
    vn: { label: "NHỊP ĐIỆU (BPM)" },
    en: { label: "TEMPO (BPM)" }
};

const TempoSelector: React.FC<TempoSelectorProps> = ({ tempo, onTempoChange, language }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = parseInt(e.target.value, 10);
    if (!isNaN(newTempo)) {
      onTempoChange(newTempo);
    }
  };

  return (
    <div>
      <label htmlFor="tempo-slider" className="block text-base font-bold text-teal-300 uppercase tracking-wider mb-3">
        {TEXT[language].label}
      </label>
      <div className="flex items-center gap-5 bg-gray-800/40 p-4 rounded-xl border border-gray-700">
        <input
          id="tempo-slider"
          type="range"
          min="60"
          max="180"
          value={tempo}
          onChange={handleChange}
          className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
        />
        <input
          type="number"
          min="60"
          max="180"
          value={tempo}
          onChange={handleChange}
          className="w-20 bg-gray-900 border-2 border-gray-600 rounded-lg p-2 text-center text-lg font-bold text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-inner"
        />
      </div>
    </div>
  );
};

export default TempoSelector;
