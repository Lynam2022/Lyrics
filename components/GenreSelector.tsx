
import React, { useState, useMemo } from 'react';
import { Genre, Language } from '../types';
import { SearchIcon } from './icons';

interface GenreSelectorProps {
  selectedGenres: Genre[];
  onToggleGenre: (genre: Genre) => void;
  language: Language;
}

const genreGroups: Record<string, Genre[]> = {
    'International Styles': [
        Genre.Pop, Genre.Rock, Genre.Ballad, Genre.HipHop, Genre.Electronic,
        Genre.Country, Genre.RnB, Genre.Lofi, Genre.Trap, Genre.BoomBap,
        Genre.Jazz, Genre.Blues, Genre.Reggae, Genre.Funk, Genre.Metal, Genre.Classical
    ],
    'Vietnamese Styles': [
        Genre.VPop, Genre.Bolero, Genre.IndieViet, Genre.DanCa,
        Genre.NhacCachMang, Genre.Vinahouse,
    ],
    'Dance Styles': [
        Genre.Tango, Genre.Waltz, Genre.ChaChaCha, Genre.Rumba, Genre.Samba,
    ],
};

const TEXT = {
    vn: {
        label: "Phong cách âm nhạc",
        desc1: "Lựa chọn màu sắc âm nhạc bạn muốn.",
        desc2: "Có thể kết hợp nhiều thể loại (VD: V-Pop + Ballad) để tạo sự độc đáo.",
        placeholder: "Tìm kiếm thể loại...",
        notFound: "Không tìm thấy thể loại nào",
        tryAgain: "Hãy thử từ khóa khác...",
        selected: "đã chọn",
        selectOne: "Vui lòng chọn ít nhất một thể loại",
        groups: {
            'International Styles': 'Quốc Tế',
            'Vietnamese Styles': 'Việt Nam',
            'Dance Styles': 'Khiêu Vũ',
        }
    },
    en: {
        label: "MUSIC STYLE / GENRE",
        desc1: "Choose the musical color for your lyrics.",
        desc2: "Mix multiple styles (e.g., V-Pop + Ballad) for a unique sound.",
        placeholder: "Search styles...",
        notFound: "No styles found",
        tryAgain: "Try a different keyword...",
        selected: "styles selected",
        selectOne: "Please select at least one style",
        groups: {
            'International Styles': 'International Styles',
            'Vietnamese Styles': 'Vietnamese Styles',
            'Dance Styles': 'Dance Styles',
        }
    }
};

const GenreSelector: React.FC<GenreSelectorProps> = ({ selectedGenres, onToggleGenre, language }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const t = TEXT[language];

    const filteredGenreGroups = useMemo(() => {
        if (!searchTerm.trim()) return genreGroups;

        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered: Record<string, Genre[]> = {};

        for (const groupName in genreGroups) {
            const genres = genreGroups[groupName].filter(genre =>
                genre.toLowerCase().includes(lowercasedFilter)
            );
            if (genres.length > 0) {
                filtered[groupName] = genres;
            }
        }
        return filtered;
    }, [searchTerm]);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-1">
                <label className="block text-base font-bold text-teal-300 uppercase tracking-wider">
                    {t.label}
                </label>
                <p className="text-sm text-gray-400 font-medium tracking-wide leading-relaxed">
                    {t.desc1} <span className="text-gray-500">|</span> {t.desc2}
                </p>
            </div>
            
            <div className="relative mb-5">
                <input
                    type="text"
                    placeholder={t.placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900/80 border border-gray-600 rounded-xl py-3 pl-11 pr-4 text-base text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors placeholder-gray-500 shadow-sm"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-gray-500" />
                </div>
            </div>

            <div className="space-y-5 max-h-[20rem] overflow-y-auto pr-2 custom-scrollbar">
                {Object.keys(filteredGenreGroups).length > 0 ? (
                    Object.keys(filteredGenreGroups).map((groupName) => (
                        <div key={groupName} className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                            <h4 className="text-xs font-bold uppercase text-teal-500/90 mb-3 tracking-widest flex items-center gap-2.5">
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)]"></span>
                                {t.groups[groupName as keyof typeof t.groups] || groupName}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2.5">
                                {filteredGenreGroups[groupName].map((genre) => (
                                    <label key={genre} className={`
                                        flex items-center space-x-2.5 cursor-pointer p-2.5 rounded-lg border transition-all duration-200 group
                                        ${selectedGenres.includes(genre) 
                                            ? 'bg-teal-900/30 border-teal-500/50 shadow-[0_0_12px_rgba(20,184,166,0.15)]' 
                                            : 'border-transparent bg-gray-900/20 hover:bg-gray-800 hover:border-gray-600'}
                                    `}>
                                        <div className="relative flex items-center flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={selectedGenres.includes(genre)}
                                                onChange={() => onToggleGenre(genre)}
                                                className="peer appearance-none h-4 w-4 border-2 border-gray-500 rounded checked:bg-teal-500 checked:border-teal-500 focus:ring-0 transition-colors cursor-pointer"
                                            />
                                            <svg
                                                className="absolute w-3 h-3 text-white pointer-events-none hidden peer-checked:block left-[2px]"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className={`text-sm sm:text-base font-medium transition-colors truncate ${selectedGenres.includes(genre) ? 'text-teal-100' : 'text-gray-300 group-hover:text-gray-100'}`}>
                                            {genre}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                        <p className="text-base font-medium">{t.notFound}</p>
                        <p className="text-xs mt-1 opacity-70">{t.tryAgain}</p>
                    </div>
                )}
            </div>
            
            <div className="text-xs text-gray-500 text-right font-medium tracking-wide">
               {selectedGenres.length > 0 ? `${selectedGenres.length} ${t.selected}` : t.selectOne}
            </div>
        </div>
    );
};

export default GenreSelector;
