
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Genre, SongData, LyricsAnalysisData, VoiceGender, VocalCharacteristic, SavedProject, SongStructure, Language } from './types';
import GenreSelector from './components/GenreSelector';
import VoiceGenderSelector from './components/VoiceSelector';
import VocalCharacteristicSelector from './components/VocalCharacteristicSelector';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { generateSong, analyzeLyrics, regenerateLyrics, generateInspiration } from './services/geminiService';
import { MusicNoteIcon, SparklesIcon, BrainIcon, HeartIcon, EyeIcon, LinkIcon, FolderOpenIcon, AlertIcon } from './components/icons';
import TempoSelector from './components/TempoSelector';
import LoadProjectModal from './components/LoadProjectModal';
import StructureSelector from './components/StructureSelector';

// --- TRANSLATION DATA ---
const TEXT = {
    vn: {
        appTitle: "AI Songwriter Studio",
        subTitle: "SÁNG TÁC LỜI CA • KHƠI NGUỒN CẢM HỨNG • PHÂN TÍCH CHUYÊN SÂU",
        modeSongwriter: "Sáng Tác",
        modeAnalyzer: "Phân Tích Lời",
        topicLabel: "BÀI HÁT CỦA BẠN NÓI VỀ ĐIỀU GÌ?",
        topicPlaceholder: "Hãy mô tả chi tiết ý tưởng, câu chuyện, hoặc cảm xúc bạn muốn truyền tải...",
        btnSuggest: "Gợi ý cho tôi",
        btnThinking: "Đang nghĩ...",
        btnGenerate: "Tạo Bài Hát",
        btnCreating: "Đang Kiến Tạo...",
        btnAnalyzeGen: "Phân Tích Lời Vừa Tạo",
        btnAnalyzeCustom: "Phân Tích Lời Của Tôi",
        customLyricsLabel: "DÁN LỜI BÀI HÁT CẦN PHÂN TÍCH VÀO ĐÂY",
        footer: "Powered by Y2TubeX.Com",
        library: "Thư Viện",
        analysis: {
            deepDive: "PHÂN TÍCH CHUYÊN SÂU",
            theme: "Chủ đề chính",
            emotion: "Cảm xúc chủ đạo",
            imagery: "Hình ảnh & Biểu tượng",
            rhyme: "Cấu trúc gieo vần",
            message: "Thông điệp & Ý nghĩa"
        }
    },
    en: {
        appTitle: "AI Songwriter Studio",
        subTitle: "CRAFT LYRICS • DISCOVER TITLES • ANALYZE MUSICAL POETRY",
        modeSongwriter: "Songwriter Mode",
        modeAnalyzer: "Lyrics Analyzer",
        topicLabel: "WHAT IS YOUR SONG ABOUT?",
        topicPlaceholder: "Describe your idea, story, or the specific emotion you want to convey...",
        btnSuggest: "Suggest for me",
        btnThinking: "Thinking...",
        btnGenerate: "Generate Song",
        btnCreating: "Creating Masterpiece...",
        btnAnalyzeGen: "Analyze Generated Lyrics",
        btnAnalyzeCustom: "Analyze My Lyrics",
        customLyricsLabel: "PASTE YOUR LYRICS HERE FOR ANALYSIS",
        footer: "Powered by Y2TubeX.Com",
        library: "Library",
        analysis: {
            deepDive: "LYRICS DEEP DIVE",
            theme: "Main Theme",
            emotion: "Dominant Emotion",
            imagery: "Imagery & Symbols",
            rhyme: "Rhyme Scheme",
            message: "Core Message"
        }
    }
};

// Default BPM mapping for each genre
const GENRE_TEMPO_DEFAULTS: Record<Genre, number> = {
    // International
    [Genre.Pop]: 105,
    [Genre.Rock]: 125,
    [Genre.Ballad]: 68,
    [Genre.HipHop]: 90,
    [Genre.Electronic]: 128,
    [Genre.Country]: 110,
    [Genre.RnB]: 75,
    [Genre.Lofi]: 80,
    [Genre.Trap]: 140,
    [Genre.BoomBap]: 88,
    [Genre.Jazz]: 100,
    [Genre.Blues]: 60,
    [Genre.Funk]: 115,
    [Genre.Reggae]: 75,
    [Genre.Metal]: 150,
    [Genre.Classical]: 70,
  
    // Vietnamese
    [Genre.VPop]: 95,
    [Genre.Bolero]: 64,
    [Genre.IndieViet]: 85,
    [Genre.DanCa]: 68,
    [Genre.NhacCachMang]: 100,
    [Genre.Vinahouse]: 138,
  
    // Dance
    [Genre.Tango]: 120,
    [Genre.Waltz]: 90,
    [Genre.ChaChaCha]: 125,
    [Genre.Rumba]: 100,
    [Genre.Samba]: 105,
};

// Component to display analysis results
const AnalysisCard: React.FC<{ title: string; content: string; icon: React.ReactNode }> = ({ title, content, icon }) => (
    <div className="bg-gray-800/60 p-5 rounded-xl border border-gray-700 backdrop-blur-sm transition-all duration-300 hover:border-teal-500 hover:bg-gray-800 shadow-md">
        <div className="flex items-center gap-3 mb-3">
            <div className="text-teal-400 p-1.5 bg-teal-900/20 rounded-lg">{icon}</div>
            <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider">{title}</h3>
        </div>
        <p className="text-gray-200 text-base leading-relaxed font-light">{content}</p>
    </div>
);

const LyricsAnalysisDisplay: React.FC<{ data: LyricsAnalysisData; language: Language }> = ({ data, language }) => {
  const t = TEXT[language].analysis;
  return (
    <div className="mt-10 space-y-8 animate-fade-in">
        <h2 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400 mb-6 tracking-tight">
            {t.deepDive}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <AnalysisCard title={t.theme} content={data.theme} icon={<BrainIcon className="w-6 h-6" />} />
           <AnalysisCard title={t.emotion} content={data.emotion} icon={<HeartIcon className="w-6 h-6" />} />
           <AnalysisCard title={t.imagery} content={data.imagery} icon={<EyeIcon className="w-6 h-6" />} />
           <AnalysisCard title={t.rhyme} content={data.rhymeScheme} icon={<LinkIcon className="w-6 h-6" />} />
           <div className="md:col-span-2">
            <AnalysisCard title={t.message} content={data.message} icon={<SparklesIcon className="w-6 h-6" />} />
           </div>
        </div>
    </div>
  );
};

interface ValidationState {
    isOpen: boolean;
    type: 'topic' | 'genre' | 'other';
    title: string;
    message: string;
    tips: string[];
    action?: string;
}

const ValidationModal: React.FC<{ state: ValidationState; onClose: () => void }> = ({ state, onClose }) => {
    if (!state.isOpen) return null;

    const Icon = state.type === 'topic' ? BrainIcon : (state.type === 'genre' ? MusicNoteIcon : AlertIcon);
    const accentColor = state.type === 'topic' ? 'text-teal-400' : (state.type === 'genre' ? 'text-cyan-400' : 'text-amber-400');
    const bgColor = state.type === 'topic' ? 'bg-teal-900/30' : (state.type === 'genre' ? 'bg-cyan-900/30' : 'bg-amber-900/30');
    const borderColor = state.type === 'topic' ? 'border-teal-500/30' : (state.type === 'genre' ? 'border-cyan-500/30' : 'border-amber-500/30');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
            <div className={`bg-gray-800 border ${borderColor} rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden transform transition-all scale-100`}>
                <div className="bg-gray-900/50 p-6 border-b border-gray-700 flex items-start gap-4">
                    <div className={`${bgColor} p-3 rounded-full flex-shrink-0`}>
                         <Icon className={`w-6 h-6 ${accentColor}`} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-100">{state.title}</h3>
                        <p className={`${accentColor} text-xs uppercase tracking-wider font-bold mt-1.5`}>{state.action}</p>
                    </div>
                </div>
                
                <div className="p-6 space-y-5">
                    <p className="text-gray-200 text-base leading-relaxed whitespace-pre-line font-medium">
                        {state.message}
                    </p>
                    
                    <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wide">Gợi ý chuyên nghiệp / Pro Tips:</h4>
                        <ul className="space-y-2">
                            {state.tips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                    <span className={`${accentColor} mt-1 text-base`}>•</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="p-5 bg-gray-900/80 border-t border-gray-700 flex justify-end">
                    <button 
                        onClick={onClose}
                        className={`px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-${state.type === 'topic' ? 'teal' : 'cyan'}-500/20 border border-gray-600`}
                    >
                        Đã hiểu / Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

const initialTopic = '';

const App: React.FC = () => {
  type Mode = 'songwriter' | 'analyzer';
  const PROJECTS_STORAGE_KEY = 'ai-songwriter-studio-projects';
  const PREFS_STORAGE_KEY = 'ai-songwriter-user-prefs';
  
  // Set initial mode to 'songwriter' for a fresh start
  const [mode, setMode] = useState<Mode>('songwriter');
  const [language, setLanguage] = useState<Language>('vn');
  
  // Songwriter state
  const [topic, setTopic] = useState<string>(initialTopic);
  // Initialize genres as empty, will load from local storage
  const [genres, setGenres] = useState<Genre[]>([]);
  const [structure, setStructure] = useState<SongStructure>(SongStructure.Standard);
  const [customStructure, setCustomStructure] = useState<string>('');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(VoiceGender.Male);
  const [vocalCharacteristics, setVocalCharacteristics] = useState<VocalCharacteristic[]>([VocalCharacteristic.Warm, VocalCharacteristic.Passionate]);
  const [tempo, setTempo] = useState<number>(75);
  const [songData, setSongData] = useState<SongData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isInspiring, setIsInspiring] = useState<boolean>(false);

  // Analyzer state - Start empty
  const [customLyrics, setCustomLyrics] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<LyricsAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Project Save/Load State
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);
  const [isProjectSaved, setIsProjectSaved] = useState<boolean>(false);
  
  // Validation Modal State
  const [validationState, setValidationState] = useState<ValidationState>({ isOpen: false, type: 'other', title: '', message: '', tips: [] });


  // Ref to ensure initial generation only runs once
  const didInitialGenerate = useRef(false);

  const handleInspirationClick = async () => {
    setIsInspiring(true);
    setError(null);
    try {
        const suggestion = await generateInspiration();
        setTopic(suggestion);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Could not get an inspiration. Please try again.');
        }
    } finally {
        setIsInspiring(false);
    }
  };

  // Load Projects & Preferences
  useEffect(() => {
    try {
        const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (storedProjects) {
            setSavedProjects(JSON.parse(storedProjects));
        }

        const storedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
        if (storedPrefs) {
            const parsed = JSON.parse(storedPrefs);
            if (parsed.genres) setGenres(parsed.genres);
            if (parsed.voiceGender) setVoiceGender(parsed.voiceGender);
            if (parsed.vocalCharacteristics) setVocalCharacteristics(parsed.vocalCharacteristics);
            if (parsed.structure) setStructure(parsed.structure);
            if (parsed.language) setLanguage(parsed.language);
        }
    } catch (error) {
        console.error("Failed to load data from localStorage:", error);
    }
  }, []);

  // Save Preferences whenever they change
  useEffect(() => {
      const prefs = {
          genres,
          voiceGender,
          vocalCharacteristics,
          structure,
          language
      };
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  }, [genres, voiceGender, vocalCharacteristics, structure, language]);

  const handleSetMode = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setAnalysisError(null);
    if (newMode === 'analyzer') {
        setSongData(null);
        setCustomLyrics('');
        setAnalysisData(null);
    } else {
        setAnalysisData(null);
        setCustomLyrics('');
        setTopic('');
        setSongData(null);
    }
    setIsLoading(false);
    setIsAnalyzing(false);
    setSelectedTitle(null);
    setIsRegenerating(false);
  };

  const handleToggleGenre = (genre: Genre) => {
    const isAdding = !genres.includes(genre);
    const newGenres = isAdding
        ? [...genres, genre]
        : genres.filter(g => g !== genre);
    
    setGenres(newGenres);

    // Intelligent Tempo Adjustment: Prioritize Highest BPM among selected genres
    if (newGenres.length > 0) {
        // Get BPM for all selected genres, default to 0 if not found
        const bpms = newGenres.map(g => GENRE_TEMPO_DEFAULTS[g] || 0);
        // Find the maximum BPM
        const maxBpm = Math.max(...bpms);
        
        // Update tempo if we found a valid BPM
        if (maxBpm > 0) {
            setTempo(maxBpm);
        }
    } else {
        // Default reset if no genres selected
        setTempo(75);
    }
  };

  const handleToggleVocalCharacteristic = (char: VocalCharacteristic) => {
    setVocalCharacteristics(prev => {
        const newChars = prev.includes(char)
            ? prev.filter(c => c !== char)
            : [...prev, char];
        return newChars.length > 0 ? newChars : prev;
    });
  };

  const runSongGeneration = useCallback(async () => {
    if (!topic.trim() || genres.length === 0) {
        return; 
    }

    setError(null);
    setIsLoading(true);
    setSongData(null);
    setAnalysisData(null);
    setAnalysisError(null);
    setSelectedTitle(null);

    try {
        const data = await generateSong(topic, genres, voiceGender, vocalCharacteristics, tempo, structure, customStructure);
        setSongData(data);
        if (data.titles && data.titles.length > 0) {
            const recommendedTitle = data.titles.find(t => t.isRecommended);
            setSelectedTitle(recommendedTitle ? recommendedTitle.title : data.titles[0].title);
        }
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred.');
        }
    } finally {
        setIsLoading(false);
    }
  }, [topic, genres, voiceGender, vocalCharacteristics, tempo, structure, customStructure]);


  const handleGenerateSong = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!topic.trim()) {
        setValidationState({
            isOpen: true,
            type: 'topic',
            title: language === 'vn' ? "Khởi tạo Ý tưởng" : "Creative Kickstart",
            action: language === 'vn' ? "Chưa nhập chủ đề" : "Missing Topic",
            message: language === 'vn' 
                ? "AI cần một 'hạt giống' cảm xúc để bắt đầu sáng tác."
                : "The AI needs an emotional 'seed' to start composing.",
            tips: language === 'vn'
                ? [
                    "Hãy mô tả một kỷ niệm, một câu chuyện, hoặc đơn giản là một cảm xúc (VD: Nỗi nhớ nhà, Tình yêu đơn phương).",
                    "Nếu bạn đang bí ý tưởng? Hãy nhấn nút 'Gợi ý cho tôi' để AI giúp bạn tìm cảm hứng."
                ]
                : [
                    "Describe a memory, a story, or just a feeling (e.g., Homesickness, Unrequited Love).",
                    "Stuck? Click 'Suggest for me' to let the AI spark an idea."
                ]
        });
        return;
    }

    if (genres.length === 0) {
        setValidationState({
            isOpen: true,
            type: 'genre',
            title: language === 'vn' ? "Định hình Phong cách" : "Define Music Style",
            action: language === 'vn' ? "Chưa chọn dòng nhạc" : "Missing Genre",
            message: language === 'vn'
                ? "Lời bài hát cần một 'chiếc áo' âm nhạc phù hợp để tỏa sáng."
                : "Lyrics need a suitable musical 'outfit' to shine.",
            tips: language === 'vn'
                ? [
                    "Hãy chọn ít nhất một thể loại (VD: V-Pop, Ballad).",
                    "Bạn có thể kết hợp nhiều dòng nhạc (VD: Vinahouse + Bolero) để tạo ra màu sắc độc đáo.",
                    "Dòng nhạc sẽ quyết định cấu trúc, nhịp điệu và cách gieo vần của lời ca."
                ]
                : [
                    "Select at least one genre (e.g., V-Pop, Ballad).",
                    "You can mix multiple styles (e.g., Vinahouse + Bolero) for a unique sound.",
                    "The genre dictates the structure, rhythm, and rhyme scheme."
                ]
        });
        return;
    }

    if (structure === SongStructure.Custom && !customStructure.trim()) {
         setValidationState({
            isOpen: true,
            type: 'other',
            title: language === 'vn' ? "Cấu trúc Tùy chỉnh" : "Custom Structure",
            action: language === 'vn' ? "Thiếu thông tin" : "Missing Info",
            message: language === 'vn'
                ? "Bạn đã chọn 'Tùy chỉnh' nhưng chưa nhập cấu trúc mong muốn."
                : "You selected 'Custom' but haven't entered your desired structure.",
            tips: language === 'vn'
                ? [
                    "Hãy nhập các phần của bài hát theo thứ tự (VD: Intro - Verse - Chorus - Rap...)."
                ]
                : [
                    "List the song sections in order (e.g., Intro - Verse - Chorus - Rap...)."
                ]
        });
        return;
    }

    runSongGeneration();
  }, [topic, genres, runSongGeneration, language, structure, customStructure]);


  useEffect(() => {
    if (!didInitialGenerate.current) {
        didInitialGenerate.current = true;
        if (topic && mode === 'songwriter' && genres.length > 0) {
            runSongGeneration();
        }
    }
  }, [topic, mode, genres.length, runSongGeneration]);


  const handleTitleSelect = useCallback(async (title: string) => {
    if (title === selectedTitle || !topic || !genres.length || !songData) {
        return;
    }

    setSelectedTitle(title);
    setIsRegenerating(true);
    setError(null);
    setAnalysisData(null);

    try {
        const { lyrics, soundStyle } = await regenerateLyrics(topic, genres, title, voiceGender, vocalCharacteristics, tempo, structure, customStructure);
        setSongData(prevData => {
            if (!prevData) return null;
            return { ...prevData, lyrics, soundStyle };
        });
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred while regenerating lyrics.');
        }
    } finally {
        setIsRegenerating(false);
    }
  }, [selectedTitle, topic, genres, voiceGender, vocalCharacteristics, songData, tempo, structure, customStructure]);

  const handleAnalyzeGeneratedLyrics = useCallback(async () => {
    if (!songData?.lyrics) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);

    try {
      const data = await analyzeLyrics(songData.lyrics);
      setAnalysisData(data);
    } catch (err) {
        if (err instanceof Error) {
            setAnalysisError(err.message);
        } else {
            setAnalysisError('An unknown error occurred during analysis.');
        }
    } finally {
        setIsAnalyzing(false);
    }
  }, [songData]);

  const handleAnalyzeCustomLyrics = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customLyrics.trim()) {
        setAnalysisError('Please paste the lyrics you want to analyze.');
        return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);
    try {
        const data = await analyzeLyrics(customLyrics);
        setAnalysisData(data);
    } catch (err) {
        if (err instanceof Error) {
            setAnalysisError(err.message);
        } else {
            setAnalysisError('An unknown error occurred during analysis.');
        }
    } finally {
        setIsAnalyzing(false);
    }
  }, [customLyrics]);

  const handleSaveProject = useCallback(() => {
    if (!songData) return;

    const newProject: SavedProject = {
        id: Date.now().toString(),
        name: selectedTitle || topic || 'Untitled Project',
        savedAt: new Date().toISOString(),
        topic,
        genres,
        structure,
        customStructure,
        voiceGender,
        vocalCharacteristics,
        tempo,
        songData,
        selectedTitle,
    };

    const updatedProjects = [newProject, ...savedProjects];
    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
        setSavedProjects(updatedProjects);
        setIsProjectSaved(true);
        setTimeout(() => setIsProjectSaved(false), 2000); 
    } catch (error) {
        console.error("Failed to save project:", error);
        setError("Could not save project. Storage might be full.");
    }
  }, [songData, selectedTitle, topic, genres, structure, customStructure, voiceGender, vocalCharacteristics, tempo, savedProjects]);

  const handleLoadProject = (project: SavedProject) => {
    setTopic(project.topic);
    setGenres(project.genres);
    setStructure(project.structure || SongStructure.Standard);
    setCustomStructure(project.customStructure || '');
    setVoiceGender(project.voiceGender);
    setVocalCharacteristics(project.vocalCharacteristics);
    setTempo(project.tempo);
    setSongData(project.songData);
    setSelectedTitle(project.selectedTitle);
    
    setMode('songwriter');
    setError(null);
    setAnalysisData(null);
    setAnalysisError(null);
    setIsLoading(false);
    setIsAnalyzing(false);
    setIsRegenerating(false);
    setIsLoadModalOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = savedProjects.filter(p => p.id !== projectId);
    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
        setSavedProjects(updatedProjects);
    } catch (error) {
        console.error("Failed to delete project:", error);
        setError("Could not delete project.");
    }
  };

  const t = TEXT[language];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8 selection:bg-teal-500/30 selection:text-teal-200">
      <div className="w-full max-w-5xl mx-auto relative z-10">
        
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center mb-8 bg-gray-800/40 backdrop-blur-md p-2.5 rounded-2xl border border-gray-700/50">
             {/* Language Switcher */}
             <div className="flex items-center bg-gray-900 rounded-xl p-1 border border-gray-700">
                <button 
                    onClick={() => setLanguage('vn')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${language === 'vn' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    VN
                </button>
                <button 
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${language === 'en' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    EN
                </button>
             </div>

             <button
                onClick={() => setIsLoadModalOpen(true)}
                className="group flex items-center gap-2.5 px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 hover:text-white hover:border-teal-500/50 transition-all duration-300 shadow-sm hover:shadow-teal-500/10"
            >
                <FolderOpenIcon className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition-colors" />
                <span>{t.library}</span>
            </button>
        </div>

        <header className="text-center mb-10 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-teal-500/15 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col items-center justify-center relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <MusicNoteIcon className="h-10 w-10 sm:h-12 sm:w-12 text-teal-400 drop-shadow-[0_0_25px_rgba(45,212,191,0.6)]" />
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-200 via-cyan-400 to-blue-500">
                        {t.appTitle}
                    </h1>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-400 font-bold tracking-[0.3em] uppercase mt-1 leading-relaxed opacity-80 max-w-2xl">
                    {t.subTitle}
                </p>
            </div>
        </header>

        <main>
          <div className="flex justify-center mb-8">
             <div className="bg-gray-800/80 backdrop-blur-xl p-1 rounded-full border border-gray-700/50 shadow-xl inline-flex">
                <button
                onClick={() => handleSetMode('songwriter')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${mode === 'songwriter' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md ring-1 ring-white/20' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
                >
                {t.modeSongwriter}
                </button>
                <button
                onClick={() => handleSetMode('analyzer')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${mode === 'analyzer' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md ring-1 ring-white/20' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
                >
                {t.modeAnalyzer}
                </button>
             </div>
          </div>

          {mode === 'songwriter' && (
            <>
              <div className="bg-gray-800/40 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-gray-700/50">
                <form onSubmit={handleGenerateSong} className="space-y-8">
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <label htmlFor="topic" className="text-base font-bold text-teal-300 uppercase tracking-wider drop-shadow-sm">
                        {t.topicLabel}
                      </label>
                      <button
                        type="button"
                        onClick={handleInspirationClick}
                        disabled={isInspiring}
                        className="flex items-center gap-2 text-xs text-teal-300 hover:text-white transition-colors font-bold rounded-full py-1 px-3 bg-teal-900/40 border border-teal-500/30 hover:border-teal-400/80 hover:bg-teal-600/20 disabled:opacity-60 disabled:cursor-wait"
                      >
                        <SparklesIcon className={`w-3.5 h-3.5 ${isInspiring ? 'animate-spin' : ''}`} />
                        <span>{isInspiring ? t.btnThinking : t.btnSuggest}</span>
                      </button>
                    </div>
                    <textarea
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder={t.topicPlaceholder}
                      rows={3}
                      className="w-full bg-gray-900/60 border border-gray-600 rounded-xl p-5 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-lg leading-relaxed shadow-inner font-medium"
                    />
                  </div>
                  
                  <GenreSelector selectedGenres={genres} onToggleGenre={handleToggleGenre} language={language} />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <StructureSelector 
                        selectedStructure={structure} 
                        onSelectStructure={setStructure}
                        customInput={customStructure}
                        onCustomInputChange={setCustomStructure} 
                        language={language} 
                      />
                      <div className="space-y-8">
                          <VoiceGenderSelector selectedGender={voiceGender} onSelectGender={setVoiceGender} language={language} />
                          <TempoSelector tempo={tempo} onTempoChange={setTempo} language={language} />
                      </div>
                  </div>
                  
                  <VocalCharacteristicSelector selectedCharacteristics={vocalCharacteristics} onToggleCharacteristic={handleToggleVocalCharacteristic} language={language} />
                  
                  <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-lg font-black uppercase tracking-widest py-5 px-8 rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none ring-1 ring-white/10"
                      >
                        {isLoading ? t.btnCreating : (<><SparklesIcon className="h-6 w-6" /> {t.btnGenerate}</>)}
                      </button>
                  </div>
                </form>
              </div>

              <div className="mt-10 min-h-[100px]">
                {isLoading && <LoadingSpinner mode="generating" />}
                {error && <div className="text-center text-red-200 bg-red-900/40 p-5 rounded-xl border border-red-500/30 text-base font-medium shadow-lg">{error}</div>}
                {songData && (
                  <>
                    <ResultsDisplay
                      data={songData}
                      selectedTitle={selectedTitle}
                      onTitleSelect={handleTitleSelect}
                      isRegenerating={isRegenerating}
                      onSaveProject={handleSaveProject}
                      isProjectSaved={isProjectSaved}
                      language={language}
                    />
                    <div className="mt-12 text-center">
                      {!analysisData && !isAnalyzing && (
                        <button
                          onClick={handleAnalyzeGeneratedLyrics}
                          className="inline-flex items-center justify-center gap-2.5 bg-transparent border-2 border-teal-500/40 text-teal-400 font-bold text-base py-3 px-6 rounded-xl transition-all duration-300 ease-in-out hover:bg-teal-500/10 hover:border-teal-400 hover:text-teal-300 transform hover:-translate-y-1"
                        >
                          <BrainIcon className="w-5 h-5" />
                          {t.btnAnalyzeGen}
                        </button>
                      )}
                    </div>
                  </>
                )}
                {isAnalyzing && <LoadingSpinner mode="analyzing" />}
                {analysisError && <div className="text-center text-red-200 bg-red-900/40 p-5 rounded-xl border border-red-500/30 text-base font-medium">{analysisError}</div>}
                {analysisData && <LyricsAnalysisDisplay data={analysisData} language={language} />}
              </div>
            </>
          )}

          {mode === 'analyzer' && (
             <>
                <div className="bg-gray-800/40 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-gray-700/50">
                    <form onSubmit={handleAnalyzeCustomLyrics} className="space-y-6">
                        <div>
                            <label htmlFor="custom-lyrics" className="block text-base font-bold text-teal-300 uppercase tracking-wider mb-3 drop-shadow-sm">
                                {t.customLyricsLabel}
                            </label>
                            <textarea
                                id="custom-lyrics"
                                value={customLyrics}
                                onChange={(e) => setCustomLyrics(e.target.value)}
                                placeholder="[Verse 1]..."
                                rows={12}
                                className="w-full bg-gray-900/60 border border-gray-600 rounded-xl p-5 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base leading-relaxed shadow-inner font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isAnalyzing}
                             className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-lg font-black uppercase tracking-widest py-5 px-8 rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none ring-1 ring-white/10"
                        >
                            {isAnalyzing ? t.btnThinking : (<><BrainIcon className="h-6 w-6" /> {t.btnAnalyzeCustom}</>)}
                        </button>
                    </form>
                </div>

                <div className="mt-10 min-h-[100px]">
                    {isAnalyzing && !analysisData && <LoadingSpinner mode="analyzing" />}
                    {analysisError && <div className="text-center text-red-200 bg-red-900/40 p-5 rounded-xl border border-red-500/30 text-base font-medium">{analysisError}</div>}
                    {analysisData && <LyricsAnalysisDisplay data={analysisData} language={language} />}
                </div>
            </>
          )}
        </main>
        
        <footer className="mt-24 py-8 text-center border-t border-gray-800/50">
          <p className="text-xs text-gray-500 font-bold tracking-[0.3em] uppercase opacity-70">
            {t.footer}
          </p>
        </footer>
      </div>
      {isLoadModalOpen && (
        <LoadProjectModal
            projects={savedProjects}
            onLoad={handleLoadProject}
            onDelete={handleDeleteProject}
            onClose={() => setIsLoadModalOpen(false)}
            language={language}
        />
      )}
      
      <ValidationModal 
         state={validationState} 
         onClose={() => setValidationState(prev => ({ ...prev, isOpen: false }))} 
      />

    </div>
  );
};

export default App;
