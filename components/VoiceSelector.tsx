
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
      if (gender.includes('Nam')) return <MaleIcon className="w-7 h-7 sm:w-8 sm:h-8" />;
      return <FemaleIcon className="w-7 h-7 sm:w-8 sm:h-8" />;
  };

  const getLabel = (gender: VoiceGender) => {
      if (gender.includes('Nam')) return t.male;
      return t.female;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <MicrophoneIcon className="w-5 h-5 text-teal-400" />
        <label className="block text-base font-bold text-teal-300 uppercase tracking-wider">
            {t.label}
        </label>
      </div>
      
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {genders.map((gender) => {
          const isSelected = selectedGender === gender;
          return (
            <button
              key={gender}
              type="button"
              onClick={() => onSelectGender(gender)}
              className={`
                relative flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 ease-out group overflow-hidden
                ${isSelected 
                    ? 'bg-gradient-to-br from-teal-900/80 to-cyan-900/80 border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)] scale-[1.02] ring-1 ring-teal-400/50' 
                    : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800 hover:border-gray-500 hover:shadow-lg hover:-translate-y-0.5'
                }
              `}
            >
              {/* Background Glow/Wave Effect for Selected State */}
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                   <div className="absolute w-20 h-20 bg-teal-500/20 rounded-full animate-ping"></div>
                   <div className="absolute w-[140%] h-[140%] border-[1px] border-teal-500/10 rounded-[40%] animate-[spin_10s_linear_infinite]"></div>
                   <div className="absolute w-[140%] h-[140%] border-[1px] border-cyan-500/10 rounded-[45%] animate-[spin_7s_linear_infinite_reverse]"></div>
                </div>
              )}

              <div className={`mb-3 transition-all duration-300 z-10 transform ${isSelected ? 'text-teal-200 scale-110 drop-shadow-[0_2px_10px_rgba(45,212,191,0.5)]' : 'text-gray-400 group-hover:text-gray-200 group-hover:scale-105'}`}>
                  {getIcon(gender)}
              </div>
              
              <span className={`text-sm sm:text-base font-bold tracking-wide transition-colors duration-300 z-10 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {getLabel(gender)}
              </span>
              
              {/* Active "Live" Indicator (EQ Bars) */}
              {isSelected && (
                  <div className="absolute top-3 right-3 flex gap-0.5 z-20 items-end h-3">
                      <span className="w-0.5 bg-teal-400 rounded-full animate-[sound-wave_1s_ease-in-out_infinite]" style={{ height: '60%', animationDelay: '0s' }}></span>
                      <span className="w-0.5 bg-teal-400 rounded-full animate-[sound-wave_1s_ease-in-out_infinite]" style={{ height: '100%', animationDelay: '0.1s' }}></span>
                      <span className="w-0.5 bg-teal-400 rounded-full animate-[sound-wave_1s_ease-in-out_infinite]" style={{ height: '40%', animationDelay: '0.2s' }}></span>
                      <span className="w-0.5 bg-teal-400 rounded-full animate-[sound-wave_1s_ease-in-out_infinite]" style={{ height: '80%', animationDelay: '0.3s' }}></span>
                  </div>
              )}
            </button>
          );
        })}
      </div>
      <style>{`
        @keyframes sound-wave {
          0%, 100% { height: 40%; }
          50% { height: 100%; }
        }
      `}</style>
    </div>
  );
};

export default VoiceGenderSelector;
