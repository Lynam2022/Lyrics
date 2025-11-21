
import React from 'react';
import { VoiceGender, Language } from '../types';
import { MaleIcon, FemaleIcon, MicrophoneIcon } from './icons';

interface VoiceGenderSelectorProps {
  selectedGender: VoiceGender;
  onSelectGender: (gender: VoiceGender) => void;
  language: Language;
}

const TEXT = {
    vn: {
        label: "GIỌNG HÁT CHỦ ĐẠO",
        male: "Giọng Nam",
        female: "Giọng Nữ"
    },
    en: {
        label: "MAIN VOCAL",
        male: "Male Voice",
        female: "Female Voice"
    }
};

const VoiceGenderSelector: React.FC<VoiceGenderSelectorProps> = ({ selectedGender, onSelectGender, language }) => {
  const genders = Object.values(VoiceGender);
  const t = TEXT[language];

  const getIcon = (gender: VoiceGender) => {
      if (gender.includes('Nam')) return <MaleIcon className="w-6 h-6" />;
      return <FemaleIcon className="w-6 h-6" />;
  };

  const getLabel = (gender: VoiceGender) => {
      if (gender.includes('Nam')) return t.male;
      return t.female;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <MicrophoneIcon className="w-5 h-5 text-teal-400" />
        <label className="block text-base font-bold text-teal-300 uppercase tracking-wider">
            {t.label}
        </label>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {genders.map((gender) => {
          const isSelected = selectedGender === gender;
          return (
            <button
              key={gender}
              type="button"
              onClick={() => onSelectGender(gender)}
              className={`
                relative flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all duration-300 ease-in-out group
                ${isSelected 
                    ? 'bg-gradient-to-br from-teal-900/60 to-cyan-900/60 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.25)] scale-[1.02]' 
                    : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800 hover:border-gray-500'
                }
              `}
            >
              <div className={`mb-2 transition-colors duration-300 ${isSelected ? 'text-teal-300' : 'text-gray-400 group-hover:text-gray-200'}`}>
                  {getIcon(gender)}
              </div>
              <span className={`text-base font-bold tracking-wide transition-colors duration-300 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {getLabel(gender)}
              </span>
              
              {isSelected && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-teal-400 rounded-full shadow-[0_0_10px_rgba(45,212,191,1)] animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VoiceGenderSelector;
