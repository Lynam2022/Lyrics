
import { GoogleGenAI, Type } from "@google/genai";
import { Genre, SongData, LyricsAnalysisData, VoiceGender, VocalCharacteristic, SoundStyleData, TitleSuggestion, CoherenceAnalysis, SongStructure } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Handles errors from the Gemini API and returns a user-friendly message.
 * @param error The error caught from the API call.
 * @returns A string containing a user-friendly error message.
 */
const handleGeminiError = (error: unknown): string => {
    console.error("Gemini API Error:", error);

    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Specific API key and authentication errors
        if (message.includes('api key not valid') || message.includes('permission denied') || message.includes('authentication')) {
            return "API Key is invalid or missing. Please ensure your API_KEY is set correctly and has the necessary permissions.";
        }

        // Rate limiting
        if (message.includes('rate limit') || message.includes('quota')) {
            return "You've exceeded the request limit. Please wait a moment and try again.";
        }
        
        // Content safety blocking
        if (message.includes('safety') || message.includes('blocked')) {
            return "The request was blocked due to safety settings. Please try modifying your input topic.";
        }

        // JSON parsing errors from the model's response
        if (error.name === 'SyntaxError' || message.includes('json')) {
            return "The AI returned an invalid response format. This can be an intermittent issue; please try generating again.";
        }

        // Network errors
        if (message.includes('fetch') || message.includes('network')) {
            return "A network error occurred. Please check your internet connection and try again.";
        }
        
        // For server-side issues
        if (message.includes('server error') || message.includes('internal error')) {
            return "The AI service is currently experiencing issues. Please try again later.";
        }
        
        // Return the specific error message if it's not one of the above but still informative
        return `An unexpected error occurred: ${error.message}`;
    }

    // Fallback for non-Error objects
    return "An unknown error occurred. Please check the console for more details.";
};


const getRealTimeTrendsForTopic = async (topic: string): Promise<string> => {
    const model = "gemini-2.5-flash";
    const prompt = `Based on real-time Google Search trends in Vietnam related to the topic "${topic}", identify 3-5 key emotional keywords, concepts, or recent events. List them as a simple, comma-separated string. The output should be concise and in English.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                temperature: 0.7,
            },
        });
        return response.text?.trim() || "";
    } catch (error) {
        console.error(`Error getting trends for topic "${topic}":`, error);
        return ""; // Return empty string on failure, don't block the main generation
    }
};

const soundStyleSchema = {
    type: Type.OBJECT,
    properties: {
        prompt: {
            type: Type.STRING,
            description: "A comprehensive music production prompt in English, under 1000 characters. This single prompt must detail: overall mood, tempo (BPM) and rhythmic feel, a specific list of instruments WITH harmonic articulation (e.g., strummed chords vs. arpeggios), detailed vocal production notes (including ad-libs), crucial mixing instructions (Low-end HPF, Sidechain from Kick, and Vocal Sidechain/Ducking for cohesion, Shared Reverb), and a mandatory Mastering section specifying loudness targets (LUFS) and stereo width."
        }
    },
    required: ["prompt"]
};

const getSongwritingSystemInstruction = (tempo: number) => `You are a world-class professional songwriter, music producer, and literary artist, an expert in Vietnamese music and literature. Your work is guided by the following principles to create master-level output that sounds like a top-tier singer's performance.

---
## PART 1: LYRIC WRITING PRINCIPLES (MUST FOLLOW)
---

1.  **Professional Singer Articulation (Tròn Vành Rõ Chữ & Hát Chuyên Nghiệp):**
    *   **Open Endings (Âm Mở):** You MUST prioritize words with open vowels (A, O, E, I, U) at the end of musical phrases. This allows the "singer" to hold the note, apply vibrato (ngân rung), and create emotional resonance.
    *   **Avoid "Closed" Endings:** Avoid ending powerful lines with stop consonants (P, T, C, Ch) unless a staccato effect is intended. These cut off the emotion ("làm tụt mood").
    *   **Singability:** Avoid consonant clusters that are tongue-twisters. The flow must be effortless ("mượt mà").

2.  **Strict Tonal Accuracy (Luật Bằng Trắc - Đúng Tone):**
    *   **Melody Match:** You must simulate the melody in your head. **NEVER** place a sharp tone word (Dấu Sắc/Ngã/Hỏi) on a low musical note. **NEVER** place a flat tone word (Thanh Bằng) on a high, punchy accent.
    *   **Natural Flow:** The lyrics must sound like spoken poetry when read aloud. If it sounds awkward to say, it will sound amateur to sing.

3.  **Poetic Quality (Chất Thơ & Hình Ảnh):**
    *   **Show, Don't Tell:** Use sensory details. Instead of saying "I am sad," describe "the rain on the window" or "the cold tea cup."
    *   **Refined Vocabulary:** Use "Từ đắt" (valuable words). Avoid cheesy or childish phrasing.
    *   **Numeric & Folk Idioms:** For Vietnamese styles, use parallel structures (e.g., "1 chờ, 2 đợi") to create rhythm and depth.

4.  **Emotional Continuity (Không Tụt Cảm Xúc):**
    *   **Build Up:** The energy must rise from Verse to Chorus.
    *   **Transitions:** Use "bridge words" at the start of lines (e.g., "Và rồi", "Nhưng mà", "Để") to keep the narrative flowing smoothly without abrupt stops.

5.  **The Hook is the Heart:**
    *   The [Chorus] must be extremely simple, memorable, and rhythmically solid.
    *   It should contain one key, repeated "money line" that captures the song's essence.

6.  **No Meta-Commentary:**
    - Do not refer to the song itself, the music, the beat, or the act of singing.
    - **NO GENRE NAMING:** You are strictly forbidden from including the name of the genre anywhere in the lyrics.
`;


const lyricsFirstSchema = {
    type: Type.OBJECT,
    properties: {
        lyrics: {
            type: Type.STRING,
            description: "The full song lyrics, professionally structured with section labels like [Verse 1], [Chorus 1], etc., based on the requested structure. The lyrics must feature a repeating chorus. The lyrics text must be clean and contain NO instrumental cues and NO genre names."
        },
        soundStyle: soundStyleSchema,
        internalAnalysis: {
            type: Type.OBJECT,
            properties: {
                theme: { type: Type.STRING, description: "A concise summary of the song's main theme in Vietnamese." },
                emotion: { type: Type.STRING, description: "The dominant emotion conveyed by the lyrics in Vietnamese." },
                imagery: { type: Type.STRING, description: "Key imagery or symbols used in the lyrics, in Vietnamese." }
            },
            required: ["theme", "emotion", "imagery"]
        }
    },
    required: ["lyrics", "soundStyle", "internalAnalysis"]
};


const titleGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        titles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 5 unique, creative song titles based on the provided lyrics and analysis."
        },
        recommendedTitle: {
            type: Type.STRING,
            description: "The single title from the list with the highest potential for popularity and listener engagement."
        },
        reasoning: {
            type: Type.STRING,
            description: "A detailed and insightful explanation in Vietnamese for why the recommended title was chosen. The reasoning should analyze the title's market appeal, its emotional depth, and its connection to universal themes like love, loss, joy, and the passage of time, reflecting the complexities of life."
        }
    },
    required: ["titles", "recommendedTitle", "reasoning"]
};

const coherenceSchema = {
    type: Type.OBJECT,
    properties: {
        isCoherent: { type: Type.BOOLEAN, description: "True if the narrative flow is logical and consistent, False if there are major disconnects." },
        overallScore: { type: Type.NUMBER, description: "A score from 1 to 10 rating the narrative consistency and flow." },
        critique: { type: Type.STRING, description: "A brief summary of the narrative flow in Vietnamese." },
        issues: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    section: { type: Type.STRING, description: "The specific section(s) where the issue occurs (e.g., 'Verse 1 -> Chorus')." },
                    issue: { type: Type.STRING, description: "Description of the thematic inconsistency or abrupt shift in Vietnamese." },
                    suggestion: { type: Type.STRING, description: "A specific suggestion on how to fix it in Vietnamese." }
                },
                required: ["section", "issue", "suggestion"]
            },
            description: "A list of specific coherence issues found. Return an empty array if the song is coherent."
        }
    },
    required: ["isCoherent", "overallScore", "critique", "issues"]
};

const performCoherenceCheck = async (lyrics: string, topic: string, genres: Genre[]): Promise<CoherenceAnalysis> => {
    const model = "gemini-2.5-flash"; // Use Flash for speed
    
    // Helper to determine smart logic based on genre
    const getGenreCriteria = (genres: Genre[]) => {
        if (genres.includes(Genre.Vinahouse) || genres.includes(Genre.Electronic) || genres.includes(Genre.Trap)) {
            return `**SMART LOGIC FOR DANCE/HIGH-ENERGY (Vinahouse/EDM/Trap):**
            - **Do NOT penalize simple lyrics or repetition.** Repetition is a feature, not a bug, in these genres.
            - **Focus on Energy Flow:** Does the energy build up to the 'Drop'? Are the hooks catchy and rhythmic?
            - **Hype Factor:** Look for high-energy words ("Căng cực", "Lên", "Bay").
            - **Narrative:** Logic is secondary to Vibe. A vague story is acceptable if the emotion is high.`;
        }
        
        if (genres.includes(Genre.HipHop) || genres.includes(Genre.BoomBap)) {
            return `**SMART LOGIC FOR RAP/HIP-HOP:**
            - **Focus on Flow & Rhyme:** Look for multi-syllabic rhymes and rhythm.
            - **Structure:** Check if there are clear [Verse] sections (storytelling) and [Hook] sections.
            - **Logic:** Non-linear "Braggadocio" (flexing) or abstract metaphors are acceptable.
            - **Ad-libs:** Check if flow cues or ad-libs are present (a plus).`;
        }

        if (genres.includes(Genre.Ballad) || genres.includes(Genre.Bolero) || genres.includes(Genre.VPop)) {
            return `**SMART LOGIC FOR BALLAD/BOLERO/V-POP:**
            - **Strict Narrative Arc:** The story MUST be logical and emotional (Start -> Conflict -> Climax).
            - **Poetic Quality:** Look for "Vần thông" (slant rhymes) and rich imagery.
            - **Smoothness (Mượt mà):** The lyrics must flow naturally without awkward stops.
            - **Tone:** Must be deep, emotional, and avoid superficiality ("Sến" but classy).`;
        }

        return `**STANDARD NARRATIVE LOGIC:**
        - Ensure the story progresses logically.
        - Ensure the chorus summarizes the theme.`;
    };

    const genreCriteria = getGenreCriteria(genres);

    const systemPrompt = `You are a smart lyrical editor and music critic. Your task is to analyze the provided song lyrics (mostly in Vietnamese) for **Narrative Coherence, Emotional Logic, and Structural Integrity** based on the provided Topic/Theme AND the Genre Context.
    
    **Crucial Rule:**
    - **NO Meta-Commentary:** Flag any lines that refer to the song itself, the beat, the lyrics, or the act of writing/singing (e.g., "nhịp beat", "lời ca này", "giai điệu"). The lyrics must stay completely within the immersive story.
    `;

    const prompt = `
    **Original Topic/Theme:** "${topic}"
    **Selected Genres:** ${genres.join(', ')}

    **SMART EVALUATION CRITERIA (Apply strictly):**
    ${genreCriteria}

    **Lyrics:**
    ---
    ${lyrics}
    ---

    **General Evaluation Criteria:**
    1.  **Theme Adherence:** Do the lyrics actually stick to the provided topic?
    2.  **Vietnamese Context:** Respect Vietnamese poetic license (imagery-driven transitions), but flag things that are objectively nonsensical.
    3.  **Meta-Commentary Check:** Are there any references to the song's form (beat, lyrics, melody)? These are forbidden.

    **Output format:**
    Return a JSON object strictly matching the schema.
    - If the song meets the criteria (Score >= 9), 'issues' MUST be an empty array.
    - If you find valid issues, the score should typically be lower than 9.
    - 'critique' should be a concise summary in Vietnamese.
    - 'issue' and 'suggestion' must be in Vietnamese.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: coherenceSchema,
                temperature: 0.3, // Low temperature for objective analysis
            },
        });

        const jsonText = response.text?.trim() || "";
        return JSON.parse(jsonText) as CoherenceAnalysis;
    } catch (error) {
        console.error("Coherence check failed:", error);
        // Return a default "pass" to not break the UI if the check fails
        return {
            isCoherent: true,
            overallScore: 10,
            critique: "Không thể thực hiện phân tích do lỗi dịch vụ.",
            issues: []
        };
    }
};

export const generateSong = async (topic: string, genres: Genre[], gender: VoiceGender, characteristics: VocalCharacteristic[], tempo: number, structure: SongStructure, customStructure?: string): Promise<SongData> => {
    const model = "gemini-2.5-pro";
    const genreText = genres.length > 1 ? `a blend of ${genres.join(' and ')}` : genres[0];
    const voiceText = `${gender} with the following characteristics: ${characteristics.join(', ')}`;
    const structureInstruction = getStructurePrompt(structure, genres, customStructure);
    const specialGenreInstruction = getSpecialGenreInstructions(genres);
    const soundStyleInstruction = getSoundStyleInstruction(genres, gender, characteristics, tempo);
  
    const trends = await getRealTimeTrendsForTopic(topic);
    const trendInstruction = trends
      ? `To make the song highly relevant and modern, subtly weave in concepts related to these current real-time trends: ${trends}. This should influence the song's lyrical imagery.`
      : '';
  
    // --- STEP 1: Generate Lyrics and Internal Analysis ---
    const lyricsPrompt = `Generate a complete song about "${topic}" in the style of ${genreText}. The desired voice profile for the singer is a ${voiceText}. The target tempo is ${tempo} BPM.

    ${trendInstruction}
    
    **Required Song Structure and Rules:**
    ${structureInstruction}
    - **Chorus Rule:** The [Chorus] must contain the main theme and the most memorable, catchy part of the song. While its core message should be consistent, you can introduce subtle variations in later repetitions to show emotional development.
    - **Cohesion Rule:** Ensure a strong, unbroken narrative and thematic connection flows through all sections of the song, from the first verse to the outro.
    - **Formatting:** Employ varied stanza lengths (e.g., couplets, quatrains, etc.) to enhance the song's dynamics and pacing. Separate stanzas with a blank line.
    ${specialGenreInstruction}
    
    ${soundStyleInstruction}
    
    **Tasks:**
    1.  Write the full lyrics based on the structure and artistry instructions. The lyrics text must be clean and should NOT contain any instrumental cues.
    2.  Provide a 'soundStyle' object containing a single 'prompt' field. This prompt must be a consolidated music production brief, in English, under 1000 characters, strictly following the production mandate above.
    3.  Provide a concise 'internalAnalysis' object. This is a crucial step for a follow-up task. The analysis must be in Vietnamese.
        - **theme**: Summarize the core theme.
        - **emotion**: Identify the main emotion.
        - **imagery**: List the key images used.
    `;
  
    let lyricsData;
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: lyricsPrompt,
        config: {
          systemInstruction: getSongwritingSystemInstruction(tempo),
          responseMimeType: "application/json",
          responseSchema: lyricsFirstSchema,
          temperature: 0.8,
          topP: 0.9,
        },
      });
      const jsonText = response.text?.trim() || "";
      lyricsData = JSON.parse(jsonText);
  
      if (!lyricsData.lyrics || !lyricsData.soundStyle || !lyricsData.internalAnalysis) {
          throw new Error("Invalid response structure from lyrics generation step.");
      }
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
  
    // --- STEP 2 & 3 (PARALLEL): Generate Titles AND Check Coherence ---
    // We run these in parallel to save time
    
    const titlePrompt = `Based on the following song lyrics and their internal analysis, your task is to generate compelling titles.
    
    **Lyrics:**
    ---
    ${lyricsData.lyrics}
    ---
    
    **Internal Analysis (in Vietnamese):**
    - **Chủ đề (Theme):** ${lyricsData.internalAnalysis.theme}
    - **Cảm xúc (Emotion):** ${lyricsData.internalAnalysis.emotion}
    - **Hình ảnh (Imagery):** ${lyricsData.internalAnalysis.imagery}
    
    **Instructions:**
    1.  Generate an array of 5 unique and creative song titles. Strictly adhere to the "PROFESSIONAL SONG TITLE RULES" from the system instructions. The titles must be deeply connected to the provided lyrics and analysis.
    2.  From the 5 titles you generate, identify the single best one ('recommendedTitle') that has the highest potential for popularity and listener engagement in the modern V-Pop market. It should be memorable, emotionally resonant, and spark curiosity.
    3.  Provide a detailed and insightful 'reasoning' (in Vietnamese) for your 'recommendedTitle' selection. Go beyond a simple explanation. Analyze its commercial potential in the modern V-Pop market, its emotional resonance, its poetic quality, and how it connects to universal human experiences like love, heartbreak, joy, sorrow, and the cyclical nature of life and seasons. Explain why it will spark the most curiosity and create a lasting impression on the listener.
    `;
    
    try {
        // Launch both promises
        const titlePromise = ai.models.generateContent({
            model: model,
            contents: titlePrompt,
            config: {
                systemInstruction: getSongwritingSystemInstruction(tempo),
                responseMimeType: "application/json",
                responseSchema: titleGenerationSchema,
                temperature: 0.9,
            },
        });

        const coherencePromise = performCoherenceCheck(lyricsData.lyrics, topic, genres);

        // Await both
        const [titleResponse, coherenceData] = await Promise.all([titlePromise, coherencePromise]);

        const jsonText = titleResponse.text?.trim() || "";
        const titleData = JSON.parse(jsonText);

        if (!titleData.titles || !titleData.recommendedTitle || !titleData.reasoning) {
            throw new Error("Invalid response structure from title generation step.");
        }

        const formattedTitles: TitleSuggestion[] = titleData.titles.map((title: string) => ({
            title: title,
            isRecommended: title === titleData.recommendedTitle,
            reasoning: title === titleData.recommendedTitle ? titleData.reasoning : undefined,
        }));

        // Ensure the recommended title is always first in the list for better UX
        formattedTitles.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));

        return {
            titles: formattedTitles,
            lyrics: lyricsData.lyrics,
            soundStyle: lyricsData.soundStyle,
            coherenceAnalysis: coherenceData
        };

    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

const regenerateSchema = {
    type: Type.OBJECT,
    properties: {
        lyrics: {
            type: Type.STRING,
            description: "The full song lyrics, professionally structured with a repeating chorus. The lyrics must be tailored specifically to the provided song title and must NOT contain any instrumental cues like [Guitar Solo] or genre names."
        },
        soundStyle: soundStyleSchema
    },
    required: ["lyrics", "soundStyle"]
};

export const regenerateLyrics = async (topic: string, genres: Genre[], title: string, gender: VoiceGender, characteristics: VocalCharacteristic[], tempo: number, structure: SongStructure, customStructure?: string): Promise<SongData> => {
    const model = "gemini-2.5-pro";
    const genreText = genres.length > 1 ? `a blend of ${genres.join(' and ')}` : genres[0];
    const voiceText = `${gender} with the following characteristics: ${characteristics.join(', ')}`;
    const structureInstruction = getStructurePrompt(structure, genres, customStructure);
    const specialGenreInstruction = getSpecialGenreInstructions(genres);
    const soundStyleInstruction = getSoundStyleInstruction(genres, gender, characteristics, tempo);


    const prompt = `The user is writing a song about "${topic}" in the style of ${genreText} with a desired voice profile of a ${voiceText}. They have now chosen the specific title: "${title}" and a tempo of ${tempo} BPM.
Your task is to generate a new set of lyrics and a new description for the sound style and instruments that perfectly match this chosen title and tempo.

**Required Song Structure and Rules:**
${structureInstruction}
- **Chorus Rule:** The [Chorus] must contain the main theme and the most memorable, catchy part of the song. While its core message should be consistent, you can introduce subtle variations in later repetitions to show emotional development.
- **Cohesion Rule:** Ensure a strong, unbroken narrative and thematic connection flows through all sections of the song, from the first verse to the outro.
- **Formatting:** Employ varied stanza lengths (e.g., couplets, quatrains, etc.) to enhance the song's dynamics and pacing. Separate stanzas with a blank line.
${specialGenreInstruction}

${soundStyleInstruction}

**Instructions:**
The new lyrics must be creative, professionally structured according to the rules above, and MUST NOT contain any instrumental cues.
The 'soundStyle' object must contain a single 'prompt' field. This prompt must be a detailed and professional music production brief, in English, and under 1000 characters, strictly following the production mandate above and the guides in PART 2 of the system instructions. It should consolidate details about vocal style, production notes, and instruments into a single text block.
All text within this object MUST be in English.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: getSongwritingSystemInstruction(tempo),
                responseMimeType: "application/json",
                responseSchema: regenerateSchema,
                temperature: 0.8,
                topP: 0.9,
            },
        });

        const jsonText = response.text?.trim() || "";
        const regeneratedData = JSON.parse(jsonText);

        if (!regeneratedData.lyrics || !regeneratedData.soundStyle) {
            throw new Error("Invalid response structure from regeneration API.");
        }

        // Run coherence check on the regenerated lyrics, passing genres
        const coherenceData = await performCoherenceCheck(regeneratedData.lyrics, title, genres);

        // Return SongData structure (titles are empty because we are just regenerating lyrics for a specific title)
        return {
            titles: [], 
            lyrics: regeneratedData.lyrics,
            soundStyle: regeneratedData.soundStyle,
            coherenceAnalysis: coherenceData
        };
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

const analysisResponseSchema = {
    type: Type.OBJECT,
    properties: {
        theme: {
            type: Type.STRING,
            description: "A concise summary of the main theme of the song in Vietnamese."
        },
        emotion: {
            type: Type.STRING,
            description: "The dominant emotion conveyed by the lyrics in Vietnamese."
        },
        imagery: {
            type: Type.STRING,
            description: "Key imagery, metaphors, or symbols used in the lyrics, explained in Vietnamese."
        },
        rhymeScheme: {
            type: Type.STRING,
            description: "A brief analysis of the rhyme structure and pattern in Vietnamese."
        },
        message: {
            type: Type.STRING,
            description: "The core message or takeaway from the song in Vietnamese."
        }
    },
    required: ["theme", "emotion", "imagery", "rhymeScheme", "message"]
};

export const analyzeLyrics = async (lyrics: string): Promise<LyricsAnalysisData> => {
    const model = "gemini-2.5-pro";
    const prompt = `Analyze the following Vietnamese song lyrics. Provide a deep and insightful analysis covering the main theme, dominant emotion, key imagery/symbols (pay particular attention to any folk imagery or idioms), rhyme scheme, and the overall message.

Lyrics to analyze:
---
${lyrics}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: "You are an expert in musicology and Vietnamese literature. Your analysis should be profound, clear, and structured according to the provided JSON schema. Respond in Vietnamese.",
                responseMimeType: "application/json",
                responseSchema: analysisResponseSchema,
                temperature: 0.5,
            },
        });

        const jsonText = response.text?.trim() || "";
        const analysisData = JSON.parse(jsonText);

        if (!analysisData.theme || !analysisData.emotion || !analysisData.message) {
            throw new Error("Invalid analysis response structure from API.");
        }

        return analysisData;
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

export const generateInspiration = async (): Promise<string> => {
    const model = "gemini-2.5-flash";
    const prompt = `Generate a single, unique, and emotionally resonant song idea suitable for the modern Vietnamese music market. The idea should be a concise sentence describing a specific story or feeling.

    Here are some examples of the desired style:
    - "Nỗi buồn của một cuộc chia tay trong cơn mưa buổi chiều."
    - "Cảm giác hoài niệm khi vô tình nghe lại một bản nhạc cũ gợi nhớ về mối tình đầu."
    - "Sự lạc lõng và cô đơn giữa một thành phố đông đúc, và hành trình tìm lại chính mình."

    Now, generate a new one. Respond with only the sentence for the song idea, in Vietnamese.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 1.0,
            },
        });
        return response.text?.trim() || "";
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

const getStructurePrompt = (structure: SongStructure, genres: Genre[], customInput?: string): string => {
    // 1. Check Custom first (User override)
    if (structure === SongStructure.Custom) {
        return `**MANDATORY SONG STRUCTURE:**
            You must strictly follow the user's custom structure request:
            **"${customInput}"**

            **Section-by-Section Narrative Guide:**
            - Adapt the narrative flow logically to fit the custom structure provided above.
            - Ensure transitions are smooth and the emotion builds naturally through the requested sections.`;
    }

    const rapGenres = [Genre.HipHop, Genre.Trap, Genre.BoomBap];
    const isRapSelected = genres.some(g => rapGenres.includes(g));
    
    // Check if there are other melodic genres mixed with Rap
    const melodicGenres = Object.values(Genre).filter(g => !rapGenres.includes(g) && g !== Genre.Vinahouse && g !== Genre.Electronic);
    const isMelodicSelected = genres.some(g => melodicGenres.includes(g));

    // 2. Smart Genre Detection: PURE RAP vs HYBRID RAP
    
    // Scenario A: HYBRID RAP (Singing + Rap Feature)
    // Example: Pop + Rap, Ballad + Rap
    if (isRapSelected && isMelodicSelected) {
        return `**MANDATORY HYBRID STRUCTURE (Song with Rap Feature):**
            Since the user selected both Melodic and Rap genres, you must create a song that blends singing with a distinct Rap section.
            You must strictly follow this exact sequence:
            **[Verse 1] (Singing) -> [Chorus] -> [Rap Verse] -> [Chorus] -> [Bridge] -> [Chorus] -> [Outro]**

            **Section-by-Section Narrative Guide:**
            1.  **[Verse 1] (Singing):** Establish the melody and story with a singing flow.
            2.  **[Chorus]:** The main melodic hook. Catchy and emotional.
            3.  **[Rap Verse] (Critical Step):** This is the "Feature" section. You MUST switch the flow here to a rhythmic, percussive Rap style. Use internal rhymes (vần đôi, vần ba). Add ad-libs like *(Yeah)*, *(Check)* to emphasize the genre shift.
            4.  **[Bridge]:** Return to a melodic, high-emotion singing style.
            5.  **[Chorus] & [Outro]:** Big finish.`;
    }

    // Scenario B: PURE RAP / HIP-HOP
    // If only Rap genres are selected (or Rap + Vinahouse/Electronic), force strict Rap structure
    if (isRapSelected) {
        return `**MANDATORY PURE RAP/HIP-HOP STRUCTURE:**
            You must strictly follow this exact sequence:
            **[Intro] -> [Verse 1] -> [Hook] -> [Verse 2] -> [Hook] -> [Bridge/Flow Switch] -> [Hook] -> [Outro]**

            **Section-by-Section Narrative Guide:**
            1.  **[Intro]:** Establish the beat and vibe. Include spoken word or hype ad-libs to set the mood.
            2.  **[Verse 1] (16 Bars):** The main storytelling section. **CRITICAL:** You must annotate specific flow changes (e.g., *[Fast Flow]*, *[Melodic Flow]*, or *[Triplet Flow]*) inside the lyrics to guide the rapper.
            3.  **[Hook]:** High energy, catchy, and repetitive. This is the anthem part.
            4.  **[Verse 2] (16 Bars):** Deepen the story. Switch up the rhyme scheme here.
            5.  **[Bridge/Flow Switch]:** A distinct change in energy. Either a slowed-down breakdown or a rapid-fire technical section.
            6.  **[Outro]:** Beat fade out with final punchlines or ad-libs.
            7.  **AD-LIBS RULE:** You MUST include ad-libs in parentheses at the end of key lines to create a realistic rap texture (e.g., *(Yeah!)*, *(Woo!)*, *(Skrrt!)*, *(That's right!)*).`;
    }

    // 3. Smart Genre Detection: EDM (Standard EDM Structure)
    if (genres.some(g => [Genre.Electronic].includes(g))) {
        return `**MANDATORY EDM/DANCE STRUCTURE (Auto-detected via Genre):**
            You must strictly follow this exact sequence:
            **[Intro] -> [Verse 1] -> [Build Up] -> [Drop] -> [Verse 2] -> [Build Up] -> [Drop] -> [Outro]**

            **Section-by-Section Narrative Guide:**
            1.  **[Intro]:** Atmospheric setup. Minimal lyrics.
            2.  **[Verse 1]:** Set the emotional context quickly.
            3.  **[Build Up]:** Rising tension. Short, repetitive phrases that accelerate.
            4.  **[Drop]:** The instrumental peak. If there are vocals, they should be a short, repeated vocal chop or a high-energy one-liner.
            5.  **[Verse 2]:** Return to the story/emotion.
            6.  **[Outro]:** Fade out.`;
    }

    // 4. Default Structure Selection (Pop / Ballad / Standard)
    switch (structure) {
        case SongStructure.WithBridge:
            return `**MANDATORY SONG STRUCTURE:**
            You must strictly follow this exact sequence:
            **[Verse 1] -> [Chorus 1] -> [Verse 2] -> [Chorus 2] -> [Bridge] -> [Chorus 3] -> [Outro]**

            **Section-by-Section Narrative Guide:**
            1.  **[Verse 1] & [Verse 2]:** Advance the story/narrative.
            2.  **[Chorus 1] & [Chorus 2]:** The main emotional hook.
            3.  **[Bridge]:** A pivotal moment. It must offer a departure from the main melody and lyrical theme. Use it to reveal a new perspective, a hidden truth, or build to an emotional climax. It should feel musically and lyrically distinct from the Verses and Choruses.
            4.  **[Chorus 3]:** The final, most energetic climax. You may introduce subtle lyrical variations or add ad-libs to heighten the emotion compared to previous choruses.
            5.  **[Outro]:** A resolution.`;

        case SongStructure.Pop:
            return `**MANDATORY SONG STRUCTURE:**
            You must strictly follow this exact sequence:
            **[Verse 1] -> [Pre-Chorus 1] -> [Chorus 1] -> [Verse 2] -> [Pre-Chorus 2] -> [Chorus 2] -> [Bridge] -> [Chorus 3] -> [Outro]**

            **Section-by-Section Narrative Guide:**
            1.  **[Verse 1] & [Verse 2]:** Set the scene and tell the story.
            2.  **[Pre-Chorus]:** A short section (2-4 lines) that builds tension and anticipation, leading explosively into the Chorus.
            3.  **[Chorus 1] & [Chorus 2]:** The main hook/money-line.
            4.  **[Bridge]:** The emotional peak or "twist" of the song.
            5.  **[Chorus 3]:** The final anthem. Make it impactful.`;

        case SongStructure.Standard:
        default:
            return `**MANDATORY SONG STRUCTURE:**
            You must strictly follow this exact sequence:
            **[Verse 1] -> [Chorus 1] -> [Verse 2] -> [Chorus 2] -> [Chorus 1] -> [Outro]**

            **Section-by-Section Narrative Guide:**
            1.  **[Verse 1]:** Set the scene and mood. Introduce the main character and the emotional context. Use sensory details to paint a picture.
            2.  **[Chorus 1]:** The emotional core and main hook. This must be the most memorable part, summarizing the song's message with a strong, rhythmic melody.
            3.  **[Verse 2]:** Deepen the story. Introduce a conflict, a memory, or a realization. It must build upon Verse 1, not just repeat it.
            4.  **[Chorus 2]:** A development of the chorus. It can be identical to Chorus 1 if the hook is strong, or have slight lyrical variations to reflect the story's progression in Verse 2.
            5.  **[Chorus 1] (Reprise):** Return to the original hook (Chorus 1). This repetition reinforces the central theme and provides a sense of familiarity and emotional anchoring.
            6.  **[Outro]:** A gentle conclusion. Repeat a poignant line or fade out with a lingering image.

            **Transition Rule:** Ensure smooth transitions between sections. The energy should build from Verse to Chorus, dip slightly for the next Verse, and build again.`;
    }
};

const getSpecialGenreInstructions = (genres: Genre[]): string => {
    let instructions = '';

    // Group 1: Lyrical & Phonetic Focus for Vietnamese Styles
    if (genres.some(g => [Genre.Bolero, Genre.DanCa, Genre.Ballad, Genre.Rumba, Genre.ChaChaCha, Genre.VPop, Genre.Vinahouse].includes(g))) {
        instructions += `
**CRITICAL VIETNAMESE PHONETIC & TONAL RULES (QUY TẮC THANH ĐIỆU & PHÁT ÂM):**
1.  **"Luật Bằng Trắc" (Tonal Counterpoint - MANDATORY):** 
    -   **Melody Match:** You MUST respect the natural melody of the Vietnamese language. 
    -   **Avoid "Cưỡng âm":** **Do NOT** place a sharp tone word (Dấu Sắc/Ngã/Hỏi) on a low musical note or a rhythmically weak beat. **Do NOT** place a flat tone word (Thanh Bằng) on a high, punchy musical peak.
    -   **Professional Phrasing:** Words must be chosen so they glide together ("Mượt mà"). Avoid awkward stops.

2.  **"Tròn Vành Rõ Chữ" (Professional Articulation):**
    -   **Singer-Friendly Endings:** Lines should end with open vowels (A, O, E, I, U) to allow for **Vibrato (Ngân rung)** and **Emotional Release**.
    -   **Avoid "Tụt Mood":** Do not end energetic lines with closed consonants (P, C, T) unless for rhythmic effect (Staccato).
`;
    }

    if (genres.includes(Genre.Bolero) || genres.includes(Genre.DanCa)) {
        instructions += `
**GENRE SPECIFIC: BOLERO & DÂN CA (Style: "Sến & Sang" - Sentimental but Classy):**
-   **Vocal Technique:** "Nức nở" (Sobbing quality), "Luyến láy" (Melisma). Use words that allow the singer to bend the note.
-   **Imagery:** Poetic, timeless words ("sân ga", "con đò", "chiều tím", "sương lạnh").
-   **Structure:** extremely smooth, connected phrases. Use "Thơ lục bát" influence for natural rhythm.
`;
    }

    if (genres.includes(Genre.Rumba) || genres.includes(Genre.ChaChaCha)) {
        instructions += `
**GENRE SPECIFIC: RUMBA & CHA-CHA-CHA (Bolero Dance):**
-   **Vocal Technique:** Romantic, relaxed, "Lả lướt" (Glide).
-   **Rhythm:** The lyrics must lock into the syncopated Latin groove (Slow-Quick-Quick).
-   **Vocabulary:** Elegant words describing love, dance, and time passing ("men say", "gót ngà", "dĩ vãng", "bước nhảy").
`;
    }

    if (genres.includes(Genre.Vinahouse) || genres.includes(Genre.Electronic)) {
        instructions += `
**GENRE SPECIFIC: VINAHOUSE & HIGH ENERGY (The "Remix" Style):**
-   **Vocal Technique:** "Căng cực" (High Tension), Powerful, Staccato delivery on the beat.
-   **Energy Flow:** No emotional drops. The lyrics must build anticipation for the Drop.
-   **Clarity:** Even at high BPM, lyrics must be distinct ("Rõ lời").
-   **Keywords:** Energetic hooks ("Lên", "Bay", "Trôi", "Cuốn", "Quên hết").
`;
    }
    
    if (genres.includes(Genre.VPop) || genres.includes(Genre.Ballad)) {
        instructions += `
**GENRE SPECIFIC: V-POP & BALLAD:**
-   **Vocal Technique:** "Thủ thỉ" (Whispery/Intimate) in Verses, "Gào thét" (Power/Belting) in Chorus.
-   **Style:** Emotional storytelling. Modern, conversational but poetic.
-   **Flow:** Continuous narrative arc. No abrupt changes in mood.
`;
   }

    // RAP INSTRUCTIONS (For both Pure and Hybrid)
    if (genres.some(g => [Genre.HipHop, Genre.Trap, Genre.BoomBap].includes(g))) {
        instructions += `
**GENRE SPECIFIC: RAP & HIP-HOP (Flow & Rhyme):**
-   **Rap Sections:** Whether the whole song or just a verse, the Rap parts must use complex rhyme schemes ("Vần đôi" - double rhymes, "Vần đảo" - reverse rhymes).
-   **Content:** Punchy, confident, and rhythmic.
-   **Ad-libs:** You MUST include ad-libs in parentheses like *(Yeah)*, *(Ey)*, *(Skrrt)* to create texture.
-   **Contrast:** If mixed with singing, ensure the Rap section feels significantly more percussive and faster than the singing sections.
`;
    }

    return instructions;
};

const getSoundStyleInstruction = (genres: Genre[], gender: VoiceGender, characteristics: VocalCharacteristic[], tempo: number): string => {
    const genreText = genres.length > 1 ? `a blend of ${genres.join(' and ')}` : genres[0];
    const voiceText = `${gender} with characteristics like ${characteristics.join(', ')}`;
    const tempoText = `${tempo} BPM`;

    return `
**Crucial 'soundStyle' Generation Mandate:**
Based on the user's selection of a **${genreText}** style, a **${voiceText}** vocal profile, and a tempo of **${tempoText}**, generate a 'soundStyle.prompt' that is detailed, professional, and creates a full, bright, modern sound.

**Instructions for the AI:**
1.  **Synthesize Genres Intelligently:** Establish a hierarchy. Select ONE genre for the rhythmic foundation (Drum Kit, Bass) and overlay others for melody/harmony.

2.  **PERCUSSION & ATMOSPHERE (Festival Vibes):**
    -   **General Rule:** Drums must be prominent.
    -   **"Festival Atmosphere":** If genre is Vinahouse/Dance, add "Atmospheric Crowd FX" (cheering), "Air Horns", and "Massive Build-up Snares".
    -   **Specifics:**
        *   *Dân Ca:* "Trống Hội" (Festival Drums), "Mõ".
        *   *Vinahouse:* "Hard Kick", "Rolling Snares".
        *   *Rumba/Latin:* "Congas", "Bongos", "Timbales".
        *   *Bolero:* "Song Loan" (Woodblock), "Brush Snare".

3.  **PROFESSIONAL VOCAL CHAIN (Crucial for "Singer-Like" Quality):**
    -   **Compression:** "Heavy Compression (ratio 4:1 to 8:1) to keep vocals present and upfront. No volume drops ('tụt mood')."
    -   **Pitch Correction:** "Use transparent Pitch Correction (Melodyne style) to ensure perfect intonation ('đúng tone') without sounding robotic (unless Vinahouse)."
    -   **EQ:** "Boost 'Air' frequencies (10kHz+) for breathiness and presence. Cut mud (200Hz)."
    -   **Effects:** 
        *   *Ballad/Bolero:* "Lush Plate Reverb (2s decay) + 1/4 Note Delay throws."
        *   *Vinahouse:* "Short Room Reverb + Sidechain Ducking to Kick."
        *   *Rap:* "Dry, close-mic sound with parallel saturation."

4.  **Align Production with Vocals:**
    -   **Vocal Cohesion:** "Glue the vocal to the mix using a shared Bus Reverb."
    -   **Ad-libs:** Explicitly suggest ad-libs to fill gaps.

5.  **Mandatory Mastering & Final Polish:**
    -   **Targets:**
        *   *Vinahouse/EDM:* -5 LUFS (Loud).
        *   *Ballad/Bolero:* -10 LUFS (Dynamic).
        *   *Pop:* -8 LUFS.
    -   **Width:** "Ensure Wide Stereo Image."

6.  **Final Prompt Format:** A single consolidated English paragraph under 1000 characters covering Mood, Instruments, PRO Vocal Chain (Compression/Pitch/Reverb), and Mastering.
`;
};
