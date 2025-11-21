
export enum Genre {
  // International Styles
  Pop = 'Pop',
  Rock = 'Rock',
  Ballad = 'Ballad',
  HipHop = 'Hip Hop / Rap',
  Electronic = 'Electronic / EDM',
  Country = 'Country',
  RnB = 'R&B / Soul',
  Lofi = 'Lofi',
  Trap = 'Trap / Drill',
  BoomBap = 'Boom Bap',
  Jazz = 'Jazz',
  Blues = 'Blues',
  Funk = 'Funk',
  Reggae = 'Reggae',
  Metal = 'Metal',
  Classical = 'Classical',

  // Vietnamese Styles
  VPop = 'V-Pop / Nhạc Trẻ',
  Bolero = 'Bolero / Trữ Tình',
  IndieViet = 'Indie Việt',
  DanCa = 'Dân Ca',
  NhacCachMang = 'Nhạc Cách Mạng',
  Vinahouse = 'Vinahouse',

  // Dance Styles
  Tango = 'Tango',
  Waltz = 'Waltz',
  ChaChaCha = 'Cha-cha-cha',
  Rumba = 'Rumba',
  Samba = 'Samba',
}

export enum SongStructure {
  Standard = 'Standard (V-C-V-C-C-O)',
  WithBridge = 'With Bridge (V-C-V-C-B-C-O)',
  Pop = 'Pop / Modern (V-PC-C-V-PC-C-B-C-O)',
  Rap = 'Rap / Hip-Hop (I-V1-H-V2-H-V3-H-O)',
  EDM = 'EDM / Dance (I-V-Build-Drop-V-Build-Drop-O)',
  Custom = 'Custom / Tùy chỉnh',
}

export enum VoiceGender {
  Male = 'Giọng Nam',
  Female = 'Giọng Nữ',
}

export enum VocalCharacteristic {
  Warm = 'Trầm ấm',
  Resonant = 'Vang',
  Powerful = 'Mạnh mẽ',
  Sharp = 'Sắc',
  Sweet = 'Ngọt ngào',
  Rustic = 'Mộc mạc',
  Passionate = 'Thiết tha',
  Emotional = 'Tình cảm',
  Melismatic = 'Mùi mẫn',
  Vibrato = 'Luyến láy',
  Clear = 'Trong trẻo',
  HighPitched = 'Cao vút',
  Breathy = 'Hơi',
  Nasal = 'Giọng mũi',
  Raspy = 'Khàn',
  Smooth = 'Mượt mà',
  Vulnerable = 'Mong manh',
}

export type Language = 'vn' | 'en';

export interface SoundStyleData {
  prompt: string;
}

export interface TitleSuggestion {
  title: string;
  isRecommended?: boolean;
  reasoning?: string;
}

export interface CoherenceIssue {
    section: string; // e.g., "Transition Verse 1 -> Chorus"
    issue: string;   // Description of the disconnect
    suggestion: string; // How to fix it
}

export interface CoherenceAnalysis {
    isCoherent: boolean;
    overallScore: number; // 1-10 scale
    critique: string; // General summary
    issues: CoherenceIssue[];
}

export interface SongData {
  titles: TitleSuggestion[];
  lyrics: string;
  soundStyle: SoundStyleData;
  coherenceAnalysis?: CoherenceAnalysis;
}

export interface LyricsAnalysisData {
  theme: string;
  emotion: string;
  imagery: string;
  rhymeScheme: string;
  message: string;
}

export interface SavedProject {
  id: string;
  name: string;
  savedAt: string;
  topic: string;
  genres: Genre[];
  structure: SongStructure;
  customStructure?: string;
  voiceGender: VoiceGender;
  vocalCharacteristics: VocalCharacteristic[];
  tempo: number;
  songData: SongData;
  selectedTitle: string | null;
}