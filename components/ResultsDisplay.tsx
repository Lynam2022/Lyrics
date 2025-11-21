
import React, { useState, useEffect } from 'react';
import { SongData, Language } from '../types';
import SoundStyleDisplay from './SoundStyleDisplay';
import { SparklesIcon, SaveIcon, AlertIcon, CheckCircleIcon } from './icons';

interface ResultsDisplayProps {
  data: SongData;
  selectedTitle: string | null;
  onTitleSelect: (title: string) => void;
  isRegenerating: boolean;
  onSaveProject: () => void;
  isProjectSaved: boolean;
  language: Language;
}

const TEXT = {
    vn: {
        titles: "Gợi ý Tiêu đề",
        saveProject: "Lưu Dự Án",
        saved: "Đã Lưu!",
        copySelected: "Sao chép Tiêu đề",
        copied: "Đã chép!",
        aiPick: "AI Khuyên dùng",
        adapting: "Đang viết lại lời theo tiêu đề mới...",
        generatedLyrics: "Lời Bài Hát",
        copy: "Sao chép",
        logicCheck: "Kiểm tra Logic Nội dung",
        viewReport: "Xem báo cáo",
        hideReport: "Ẩn báo cáo",
        score: "Điểm số",
        passMessage: "Mạch cảm xúc logic, nhất quán và không có lỗi cấu trúc.",
        soundStyle: "Gợi ý Phối khí"
    },
    en: {
        titles: "Suggested Titles",
        saveProject: "Save Project",
        saved: "Saved!",
        copySelected: "Copy Title",
        copied: "Copied!",
        aiPick: "AI's Pick",
        adapting: "Adapting lyrics to new title...",
        generatedLyrics: "Generated Lyrics",
        copy: "Copy",
        logicCheck: "Narrative Logic Check",
        viewReport: "View Report",
        hideReport: "Hide Report",
        score: "Score",
        passMessage: "Flow is logical, consistent, and free of structural errors.",
        soundStyle: "Sound Style & Instrumentation Prompt"
    }
};

// Robust copy function with fallback for HTTP environments
const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API failed, falling back to legacy copy", err);
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error("Copy failed", err);
    return false;
  }
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data, selectedTitle, onTitleSelect, isRegenerating, onSaveProject, isProjectSaved, language }) => {
  const [copied, setCopied] = useState(false);
  const [titleCopied, setTitleCopied] = useState(false);
  const [showCoherenceDetails, setShowCoherenceDetails] = useState(false);
  const t = TEXT[language];

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (titleCopied) {
      const timer = setTimeout(() => setTitleCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [titleCopied]);
  
  const handleCopy = async () => {
    const success = await copyToClipboard(data.lyrics);
    if (success) setCopied(true);
  };

  const handleTitleCopy = async () => {
    if (selectedTitle) {
      const success = await copyToClipboard(selectedTitle);
      if (success) setTitleCopied(true);
    }
  };

  const coherence = data.coherenceAnalysis;
  const hasIssues = coherence && coherence.issues.length > 0;

  return (
    <div className="mt-10 space-y-8 animate-fade-in">
      {/* Song Titles */}
      {data.titles.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
              <h2 className="text-2xl font-black text-teal-400 tracking-tight">{t.titles}</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                    onClick={onSaveProject}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-colors duration-200 bg-gray-800 text-gray-200 hover:bg-gray-700 flex items-center justify-center gap-2 border border-gray-700"
                >
                    <SaveIcon className="w-4 h-4" />
                    {isProjectSaved ? t.saved : t.saveProject}
                </button>
                <button
                    onClick={handleTitleCopy}
                    disabled={!selectedTitle}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-colors duration-200 bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700"
                >
                    {titleCopied ? t.copied : t.copySelected}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.titles.map((titleSuggestion, index) => {
                const isRecommended = titleSuggestion.isRecommended;
                const isSelected = selectedTitle === titleSuggestion.title;

                return (
                  <button
                    key={index}
                    onClick={() => onTitleSelect(titleSuggestion.title)}
                    title={isRecommended ? `AI's reasoning: ${titleSuggestion.reasoning}` : ''}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 w-full relative overflow-hidden group flex flex-col items-center justify-center min-h-[5rem]
                      ${
                        isSelected
                          ? 'bg-teal-600 border-teal-400 text-white font-bold shadow-xl scale-105 ring-2 ring-teal-300/50 z-10'
                          : isRecommended
                          ? 'bg-gray-800/80 border-cyan-500 hover:border-cyan-400 text-white font-semibold ring-2 ring-cyan-500/50'
                          : 'bg-gray-800/50 border-gray-700 hover:border-teal-500 text-gray-300 hover:text-white font-medium hover:bg-gray-800'
                      }`}
                  >
                    {isRecommended && !isSelected && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        <SparklesIcon className="w-2.5 h-2.5" />
                        {t.aiPick}
                      </div>
                    )}
                    
                    {isSelected && (
                        <div className="absolute top-2 right-2 transition-opacity duration-300">
                             <CheckCircleIcon className="w-5 h-5 text-white drop-shadow-sm" />
                        </div>
                    )}

                    <p className="text-center z-10 w-full break-words text-base sm:text-lg leading-tight">{titleSuggestion.title}</p>
                  </button>
                )
              })}
            </div>
          </div>
      )}

      <div className="relative">
        {isRegenerating && (
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl z-20 border border-teal-500/30">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-teal-400 mb-3"></div>
            <p className="text-teal-300 font-bold text-lg tracking-wide animate-pulse">{t.adapting}</p>
          </div>
        )}

        <div className={`space-y-8 ${isRegenerating ? 'opacity-30 pointer-events-none' : ''} transition-opacity duration-300`}>
          {/* Lyrics */}
          <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-teal-400 tracking-tight">{t.generatedLyrics}</h2>
                <button
                    onClick={handleCopy}
                    className="px-5 py-2 text-xs font-bold rounded-lg transition-colors duration-200 bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white shadow-md"
                >
                    {copied ? t.copied : t.copy}
                </button>
            </div>
            
            {/* Compact Narrative Coherence Check */}
            {coherence && (
                <div className={`mb-6 rounded-xl border overflow-hidden transition-all duration-300 ${
                    hasIssues 
                    ? 'border-orange-500/30 bg-orange-900/10' 
                    : 'border-teal-500/30 bg-teal-900/10'
                }`}>
                    <button 
                        onClick={() => setShowCoherenceDetails(!showCoherenceDetails)}
                        className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-800/50 transition-colors focus:outline-none group`}
                    >
                        <div className="flex items-center gap-3">
                             {hasIssues ? (
                                <AlertIcon className="w-5 h-5 text-orange-400" />
                             ) : (
                                <CheckCircleIcon className="w-5 h-5 text-teal-400" />
                             )}
                             <div>
                                 <span className={`text-sm sm:text-base font-bold ${hasIssues ? 'text-orange-200' : 'text-teal-200'}`}>
                                     {t.logicCheck}
                                 </span>
                                 <span className="mx-2 text-gray-600">|</span>
                                 <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                                     hasIssues 
                                     ? 'border-orange-500/30 text-orange-400' 
                                     : 'border-teal-500/30 text-teal-400'
                                 }`}>
                                     {t.score}: {coherence.overallScore}/10
                                 </span>
                             </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold group-hover:text-gray-300 transition-colors">
                                {showCoherenceDetails ? t.hideReport : t.viewReport}
                            </span>
                            <svg 
                                className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${showCoherenceDetails ? 'rotate-180' : ''}`} 
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    {showCoherenceDetails && (
                        <div className={`px-5 pb-5 pt-1 text-sm ${hasIssues ? 'text-orange-100/90' : 'text-teal-100/90'}`}>
                            <div className="h-px w-full bg-gray-700/30 mb-3"></div>
                            <p className="italic text-gray-400 mb-4 text-xs leading-relaxed border-l-2 border-gray-600 pl-3">
                                " {coherence.critique} "
                            </p>
                            
                            {hasIssues ? (
                                <ul className="space-y-3">
                                    {coherence.issues.map((issue, idx) => (
                                        <li key={idx} className="bg-gray-900/60 p-3 rounded-lg border border-orange-500/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider bg-orange-900/30 px-1.5 py-0.5 rounded">{issue.section}</span>
                                            </div>
                                            <p className="text-gray-200 mb-2 text-sm font-medium">{issue.issue}</p>
                                            <div className="flex items-start gap-2 text-sm text-teal-200 bg-teal-900/20 p-2.5 rounded-lg border border-teal-500/10">
                                                <SparklesIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-teal-400" />
                                                <span>{issue.suggestion}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex items-center gap-2 text-teal-400 font-medium bg-teal-900/20 p-3 rounded-lg text-sm">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    <span>{t.passMessage}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-inner max-h-[70vh] overflow-y-auto custom-scrollbar">
              <pre className="text-gray-100 whitespace-pre-wrap font-sans text-base sm:text-lg leading-loose tracking-wide">
                {data.lyrics}
              </pre>
            </div>
          </div>

          {/* Sound Style & Instrumentation */}
          <SoundStyleDisplay data={data.soundStyle} title={t.soundStyle} />
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
