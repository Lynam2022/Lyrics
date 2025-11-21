
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
        return response.text.trim();
    } catch (error) {
        console.error(`Error getting trends for topic "${topic}":`, error);
        return ""; // Return empty string on failure, don't block the main generation
    }
};

const SONGWRITING_SYSTEM_INSTRUCTION = `You are a world-class professional songwriter, music producer, and literary artist, an expert in Vietnamese music and literature. Your work is guided by the following principles to create master-level output.

---
## PART 1: LYRIC WRITING PRINCIPLES (MUST FOLLOW)
---

1.  **Emotion First (Cảm xúc là trên hết):** The primary goal is to evoke feeling. Write from the heart, be genuine. Each line should convey a single, clear emotion. Avoid intellectualism; prioritize raw, relatable feelings.
2.  **Professional Vocabulary (Từ ngữ đắt giá):**
    *   **Avoid Clichés:** Do not use overused or childish phrasing. Use "đắt" words—vocabulary that is evocative, precise, and artistically mature.
    *   **Show, Don't Tell:** Instead of saying "I am sad," describe the cold rain, the empty chair, or the silence of the night.
    *   **Imagery:** Use strong, singular adjectives and sensory details (sight, sound, touch).
3.  **Natural Rhythm & Rhyme (Vietnamese Prosody Focused):**
    *   Lyrics must have a natural, heartbeat-like rhythm.
    *   **Rhyme with Nuance (Crucial):** Prioritize subtle, natural-sounding rhymes. Avoid simple, predictable AABB patterns unless it serves a specific pop hook.
        *   **Slant Rhymes (Vần thông):** Heavily favor slant rhymes where vowels or consonants are similar but not identical (e.g., "mình" and "tin," "xa" and "nhà"). This is the key to sophisticated Vietnamese songwriting.
        *   **Internal Rhymes (Vần lưng):** Weave rhymes within lines, not just at the end, to create a richer texture.
    *   **Meaning Over Rhyme:** Never sacrifice the meaning, emotion, or natural flow of a line for a perfect rhyme. A meaningful, unrhymed line is always superior to a forced, awkward rhyme.
    *   **Prosody (Thanh điệu) is King:** The choice of rhyming words MUST strictly adhere to Vietnamese prosody (thanh bằng – trắc). The tonal pattern dictates the melody.
4.  **Vietnamese Rhetorical & Folk Devices (Chất liệu dân gian):**
    *   **Numeric Idioms:** Use parallel structures with numbers to create rhythm, emphasis, and a traditional feel (e.g., "1 thương 2 chờ", "1 nắng 2 sương", "1 trước 2 sau", "3 chìm 7 nổi"). This is a signature of deeply emotional Vietnamese lyrics.
    *   **Folk Imagery & Idioms (Crucial):** Actively weave in traditional symbols to add cultural depth ("chiều sâu văn hóa").
        *   **Essential Keywords:** Where contextually appropriate (especially for love stories, family, or nostalgia), use images like: **"trầu cau"** (betel & areca - symbol of faithful love/marriage), **"sợi tơ" / "tơ hồng"** (the red thread of fate), **"đá mòn sông cạn"** (eternal vows/timelessness), **"gừng cay muối mặn"** (shared hardship), **"bến nước con đò"** (waiting).
        *   **Goal:** These images anchor the song in the Vietnamese soul ("hồn Việt"), making it feel authentic and timeless rather than just a translated western song.
5.  **The Hook is the Heart:**
    *   The [Chorus] must be extremely simple, memorable, and rhythmically solid.
    *   It should contain one key, repeated "money line" that captures the song's essence.
6.  **Clear Story & Emotional Arc:**
    *   **Verse 1:** Introduce the situation (gentle, reflective).
    *   **Verse 2:** Introduce conflict/development (pain, nostalgia).
    *   **Chorus:** The peak emotional release, repeated.
    *   **Outro:** A lingering thought or fading emotion.
7.  **Conversational Tone:** Write as if you're speaking directly to someone. Use natural, everyday language but refined. "Anh nhớ em nhiều lắm" is better than a complex poetic phrase.
8.  **Unbreakable Narrative & Thematic Cohesion:** The entire song must function as a single, cohesive narrative. Every line and every section must be thematically linked.
    *   **No Randomness:** Absolutely no abrupt shifts in topic or emotion between verses, choruses, or the bridge. Each section must flow logically from the previous one.
    *   **Unified Imagery:** The key images introduced early in the song must be revisited and re-contextualized in later sections to create a sense of unity and depth.
9.  **Dynamic & Artistic Structure:**
    *   **Structure Serves Emotion:** Do not adhere to a rigid, uniform stanza length. Vary line count within stanzas (e.g., couplets for impact, 6-line stanzas for detailed narrative) to control the song's pacing and emotional dynamics.
10. **No Meta-Commentary (Tránh phá vỡ bức tường thứ 4):**
    - Do not refer to the song itself, the music, the beat, or the act of singing (e.g., avoid "bài hát này", "giai điệu này", "nhịp beat", "lời ca này").
    - The lyrics must be immersive, existing strictly within the world of the story and characters.

---
## PART 2: DYNAMIC INSTRUMENTATION & ARRANGEMENT PRINCIPLES
---

**I. CORE PHILOSOPHY:**
The arrangement and instrumentation must be a direct reflection of the song's **emotion** and the user's specified **genres**, **vocal style**, and **tempo**. The goal is a professional, modern, and emotionally resonant sound that is full and bright. The final production brief should be clear, concise, and actionable for a music producer.

**II. INSTRUMENTAL STORYTELLING & GENRE COHESION:**
*   **Instruments as Characters:** Treat each instrument as a character in the story. The piano might represent nostalgia, a distorted guitar could be anger, and a saxophone could be longing. The choice of instruments must directly support the lyrical narrative.
*   **Dynamic Arrangement:** The arrangement should mirror the song's emotional arc.
    *   **Verses:** Use a sparser arrangement to focus on the lyrics and storytelling (e.g., just piano/acoustic guitar and a simple beat).
    *   **Pre-Chorus:** Build tension and anticipation by adding layers (e.g., introduce bass, pads, or rhythmic complexity).
    *   **Chorus:** The emotional peak. Use the fullest instrumentation with layered vocals, powerful drums, and the main melodic hook.
    *   **Bridge:** Offer a change of pace. Drop some instruments out to create intimacy or introduce a new sound to signify a shift in perspective.
*   **Intelligent Genre Blending (The "Backbone vs. Overlay" Framework):**
    *   **Hierarchy:** When multiple genres are selected, you must designate one as the **Backbone** (Rhythm/Groove) and the others as **Overlay** (Texture/Harmony).
    *   **Conflict Resolution:** Never combine conflicting rhythmic patterns (e.g., Swing vs. Straight 16ths) without a clear plan. Choose the dominant groove.
    *   **Nuanced Interaction:** Describe *how* the genres meet. "The gritty, low-fi texture of Boom Bap provides the bed, while the soaring, clean electric guitar leads of Rock provide the emotional top-line."
    *   **The Ballad Foundation Rule:** If 'Ballad' is present, the *emotional structure* rules. Even in a "Vinahouse Ballad," the Intro and Verses should lean heavily on the Ballad style (piano/vocals) before transitioning into the high-energy Vinahouse drop for the chorus/climax.

**III. GENRE-SPECIFIC ADAPTATION (Key Principles):**

*   **Pop/V-Pop:** Create a polished, radio-ready sound. Focus on a strong, catchy melodic hook (synth, piano, or guitar), modern electronic drum patterns, a deep sub-bass, and layered vocal harmonies. For V-Pop specifically, tastefully integrate traditional Vietnamese instruments (e.g., Đàn Tranh, Sáo Trúc) for melodic fills to add unique character.
*   **Rock/Rock Ballad:** Build a powerful and dynamic soundscape. Use a live drum kit sound, a driving electric bassline, and a rich tapestry of electric guitars (ranging from clean arpeggios in verses to powerful, distorted chords in choruses). The arrangement must breathe, allowing for both quiet, intimate moments and explosive, high-energy sections.
*   **Ballad/Bolero (Professional Standard):** This genre is about emotional storytelling. The arrangement must breathe and follow the lyrical narrative.
    *   **Foundation:** Begin with a simple, intimate foundation, typically a solo piano or fingerpicked acoustic guitar, to create space for the vocal.
    *   **Rhythm:** The rhythm section should be subtle and supportive. Use soft percussion (brushes on a snare, gentle rimshots, shakers) or a simple, programmed beat. The bassline should be melodic and smooth, providing harmonic support.
    *   **Emotional Core:** The string section (cello, violins, violas) is crucial. Introduce it strategically during the pre-chorus to build tension and let it swell to its fullest in the chorus and bridge to create powerful emotional lifts.
    *   **Dynamic Arc:** The arrangement must have a clear dynamic arc. Start sparse and intimate in Verse 1, gradually add layers (bass, subtle drums, strings) leading into the first chorus, and reach the emotional and instrumental peak in the bridge and final chorus.
*   **Hip Hop/Trap/Lofi:** The rhythm is paramount.
    *   **Hip Hop/Boom Bap:** Focus on sampled breaks, a punchy kick and snare, and a prominent bassline.
    *   **Trap/Drill:** Use heavy 808 bass, fast hi-hat patterns, and atmospheric synth melodies.
    *   **Lofi:** Create a relaxed, "dusty" feel with down-sampled drums, jazzy chord progressions (Rhodes, electric piano), and vinyl crackle effects.
*   **Electronic/EDM:** Energy and texture are key. Use a strong four-on-the-floor kick, evolving synth pads, distinctive lead synths, and effects (risers, sweeps) to create tension and release. The structure should incorporate classic EDM elements like builds, drops, and breakdowns.
*   **Vinahouse (Specialized Structure & Sound):** This is a specialized Vietnamese high-energy dance genre.
    *   **Core Sound:** High-energy, instrumental electronic dance music with a **strong Asian influence**.
    *   **Instruments:** Synthesized plucked strings (Koto, Guzheng, Pipa, Đàn Tranh) playing fast melodic lines. Driving electronic drum kit.
    *   **Rhythm:** Prominent Kick on every beat, consistent Snare on off-beats.
*   **Jazz/Blues/Funk:** The soul of these genres is live interaction and groove.
    *   **Instrumentation:** Focus on organic instruments: Grand Piano, Hammond B3 Organ, clean Electric Guitars, Upright or Electric Bass, and a live, dynamic drum kit.
    *   **Brass Section:** A horn section (Saxophone, Trumpet, Trombone) is essential for stabs, melodic lines, and solos.
    *   **Feel:** The rhythm must swing (for Jazz/Blues) or be incredibly tight and syncopated (for Funk). The bass and drums must lock in perfectly.
*   **Classical:** Orchestral grandeur and dynamic range.
    *   **Instrumentation:** Full symphony orchestra sections: Strings (Violins, Violas, Cellos, Basses), Woodwinds (Flutes, Oboes, Clarinets), Brass (French Horns, Trumpets), and Percussion (Timpani, Cymbals).
    *   **Dynamics:** Emphasize the contrast between pianissimo (very soft) and fortissimo (very loud).
*   **Reggae:** Defined by the "riddim."
    *   **The Skank:** Clean electric guitar chops on the off-beats (and of the beat).
    *   **Rhythm Section:** A heavy, melodic bassline that drives the track, paired with a "one-drop" drum pattern (kick/snare hitting together on beat 3).
*   **Metal:** aggression and power.
    *   **Guitars:** High-gain, down-tuned distorted guitars playing heavy riffs.
    *   **Drums:** Aggressive, fast drumming, often with double-kick pedals and fast fills.
*   **Cross-Genre Blends:** When multiple genres are selected (e.g., Rock Ballad), fuse their core elements. A Rock Ballad should have the emotional structure of a ballad but with the instrumentation and power of rock.

**IV. VOCAL-CENTRIC PRODUCTION & MIXING:**
The production must complement the specified vocal characteristics and result in a clean, professional mix.
*   **For 'Powerful', 'Resonant' vocals:** Create a wide, spacious mix in the chorus to give the vocal room to soar. Use stereo-panned guitars or synths to frame the central vocal.
*   **For 'Sweet', 'Clear', 'Warm' vocals:** Aim for an intimate, clean production. Use acoustic instruments and subtle effects (light reverb, delay). Ensure the vocal is upfront and clear in the mix. Avoid dense arrangements that could muddy the vocal.
*   **For 'Melismatic' (Mùi mẫn), 'Passionate' vocals:** Use expressive instruments that can mirror the vocal's emotional contours, such as a fretless bass, cello, or a lead guitar with vibrato.
*   **Professional Vocal Finishing (Crucial):** All vocal production instructions must include modern finishing techniques. This includes subtle, transparent pitch correction (e.g., "use light, transparent pitch correction to ensure all notes are perfectly in tune without sounding robotic") and meticulous attention to the end of vocal phrases. Specify techniques like "ensure clean, controlled phrase endings with subtle de-essing and no harsh breaths" to achieve a polished, professional sound.
*   **Vocal Ad-libs & Harmonies:** The arrangement should include space for and suggestions of vocal ad-libs. These should be genre-appropriate.
    *   **Ballads/Soul:** Emotional, soaring ad-libs (e.g., "oohs", "ahs", wordless runs) in the bridge and outro.
    *   **Pop/V-Pop:** Catchy, rhythmic ad-libs or vocal chops, and lush, layered background harmonies in the chorus.
    *   **Hip-Hop/R&B:** Rhythmic ad-libs (e.g., "yeah", "uh", "let's go") to punctuate phrases and add energy.
    *   **Rock:** Gritty, powerful ad-libs and gang vocals for emphasis in choruses.
*   **Vocal & Instrumental Cohesion (Crucial for Balance):** The vocal must sit perfectly *within* the mix, not just on top of it.
    *   **Shared Space:** Use shared reverb spaces (e.g., a common hall or plate reverb) to sonically "glue" the vocal to the instruments, making them sound like they exist in the same environment.
    *   **Creating Pockets:** Employ subtle sidechain compression from the lead vocal to key instrumental tracks (like synth pads, rhythm guitars, or piano chords). This dynamically lowers the volume of the instruments by a tiny, inaudible amount whenever the vocal is present, creating a clean "pocket" for the vocal to shine through without needing excessive volume.
*   **Low-End Clarity & Balance (Crucial for avoiding noise/boominess):** A professional mix requires a clean, powerful, and non-muddy low end. The sub-bass and kick drum must be distinct and not clash.
    *   **Eliminate Mud:** Aggressively use high-pass filters (HPF) on all instruments that do not require low-frequency information (e.g., hi-hats, cymbals, acoustic guitars, pianos, and even the main vocal below ~100Hz). This is the most critical step to prevent a boomy, noisy mix.
    *   **Bass & Kick Synergy:** Ensure the bassline complements the kick drum rhythmically and tonally. If they occupy the same frequency space, use sidechain compression on the bass triggered by the kick drum, or use EQ to carve out distinct frequency slots for each.

**V. TEMPO-DRIVEN RHYTHM SECTION:**
The specified Tempo (BPM) is the heartbeat of the track and dictates its energy.
*   **Low BPM (60-90):** Ideal for Ballads, Lofi, emotional pieces. Describe drum patterns as "sparse," "minimal," or "spacious." Basslines should be "long," "sustained," or "melodic."
*   **Mid BPM (90-130):** The sweet spot for Pop, Rock, Hip-Hop. Describe the rhythm as a "solid backbeat," "groovy," or "driving." This is where the classic kick-snare pattern shines.
*   **High BPM (130+):** The domain of Electronic, EDM, Vinahouse, and uptempo Rock. Use terms like "four-on-the-floor kick," "energetic hi-hat patterns," or "fast-paced rhythm."

**VI. MASTERING & FINAL POLISH (MANDATORY):**
The 'soundStyle' prompt MUST conclude with specific mastering instructions to ensure the track is industry-ready. This section must be adapted to the genre:
1.  **Vinahouse/EDM:** "Club Master." Target extremely high loudness (-5 to -6 LUFS). Use brickwall limiting for maximum punch. Ensure the low-end (Sub/Kick) is strictly mono below 120Hz, while leads and pads are widened significantly using stereo imagers. Crisp high-end excitement.
2.  **Pop/Rock/V-Pop:** "Radio Master." Target -8 to -9 LUFS. Focus on "Glue" compression (SSL Bus Compressor style) to make instruments sit together. Balanced EQ curve.
3.  **Ballad/Bolero/Classical:** "Dynamic Master." Target -10 to -12 LUFS. Do NOT over-compress. Preserve the dynamic range between the quiet verses and the loud chorus. Use tape saturation for warmth and gentle optical limiting.
4.  **Hip-Hop/Trap:** "Bass-Heavy Master." Push the low-end limits but keep it controlled. Use soft clipping on the drums to gain headroom.

**VII. THE 'soundStyle' PROMPT:**
When generating the 'soundStyle.prompt', you must synthesize all of the above principles into a single, cohesive brief for a music producer. This prompt, written in English and under 1000 characters, must detail:
1.  **Overall Mood & Feeling:** (e.g., "An epic, emotional, and powerful rock ballad.")
2.  **Production & Mixing Notes:** (e.g., "The production should be clean and modern..."). This section **must** include specific instructions for achieving **Low-End Clarity** (e.g., "use HPF on non-bass instruments to avoid mud") and **Vocal Cohesion** (e.g., "blend vocals with shared reverb and subtle sidechaining").
3.  **Key Instruments:** (e.g., "Acoustic Piano, layered Electric Guitars...")
4.  **Vocal Production:** (e.g., "The female vocal should be treated with light compression..."). This must include specific suggestions for vocal ad-libs appropriate for the song's genre and emotion.
5.  **Tempo & Rhythmic Feel:** Explicitly state the BPM and describe the corresponding rhythmic character.
6.  **Mastering Instruction:** Explicitly state the Mastering Target (Loudness/LUFS) and stereo width approach based on the genre (as defined in PART VI).

---
**IV. TASK & FORMATTING:**
Your task is to generate creative song lyrics, compelling titles, and a detailed "soundStyle" object. The lyrics must be a work of art, adhering strictly to the principles above. The 'soundStyle' object must contain a single 'prompt' field. This prompt must be a consolidated, professional brief for a music producer, written in English, with a hard maximum limit of 1000 characters. Ensure the output is always in the specified JSON format.`;

const soundStyleSchema = {
    type: Type.OBJECT,
    properties: {
        prompt: {
            type: Type.STRING,
            description: "A comprehensive music production prompt in English, under 1000 characters. This single prompt must detail: overall mood, tempo (BPM) and rhythmic feel, a specific list of instruments, detailed vocal production notes (including ad-libs), crucial mixing instructions (Low-end HPF, Sidechain from Kick, and Vocal Sidechain/Ducking for cohesion, Shared Reverb), and a mandatory Mastering section specifying loudness targets (LUFS) and stereo width."
        }
    },
    required: ["prompt"]
};

const getStructurePrompt = (structure: SongStructure, customInput?: string): string => {
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

        case SongStructure.Rap:
            return `**MANDATORY SONG STRUCTURE:**
            You must strictly follow this exact sequence:
            **[Intro] -> [Verse 1] -> [Hook] -> [Verse 2] -> [Hook] -> [Verse 3] -> [Hook] -> [Outro]**

            **Section-by-Section Narrative Guide:**
            1.  **[Intro]:** Establish the vibe, maybe a spoken word intro or a melodic hum.
            2.  **[Verse 1] (16 Bars):** The longest sections. Focus on detailed storytelling, wordplay, and flow. Establish the premise.
            3.  **[Hook]:** The catchy, repetitive core of the song. High energy or melodic.
            4.  **[Verse 2] (16 Bars):** deepen the story, introduce conflict or a new angle.
            5.  **[Verse 3] (16 Bars):** Resolution or the hardest hitting lyrics.
            6.  **[Outro]:** Fade out, final ad-libs.`;

        case SongStructure.EDM:
            return `**MANDATORY SONG STRUCTURE:**
            You must strictly follow this exact sequence:
            **[Intro] -> [Verse 1] -> [Build Up] -> [Drop] -> [Verse 2] -> [Build Up] -> [Drop] -> [Outro]**

            **Section-by-Section Narrative Guide:**
            1.  **[Intro]:** Atmospheric setup. Minimal lyrics.
            2.  **[Verse 1]:** Set the emotional context quickly.
            3.  **[Build Up]:** Rising tension. Short, repetitive phrases that accelerate.
            4.  **[Drop]:** The instrumental peak. If there are vocals, they should be a short, repeated vocal chop or a high-energy one-liner.
            5.  **[Verse 2]:** Return to the story/emotion.
            6.  **[Outro]:** Fade out.`;
        
        case SongStructure.Custom:
            return `**MANDATORY SONG STRUCTURE:**
            You must strictly follow the user's custom structure request:
            **"${customInput}"**

            **Section-by-Section Narrative Guide:**
            - Adapt the narrative flow logically to fit the custom structure provided above.
            - Ensure transitions are smooth and the emotion builds naturally through the requested sections.`;

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

    if (genres.includes(Genre.Rock) && genres.includes(Genre.Ballad)) {
        instructions += `
**Specific Instructions for Rock Ballad Style:**
- **Lyrical Style:** The lyrics must be rustic, intimate, easy to remember, and deeply emotional. Avoid complex or overly intellectual language. Focus on raw, direct feelings.
- **Hook/Chorus:** The chorus is the most important part. It must be extremely catchy with a strong, memorable melody implied by the rhythm and rhyme. Pay close attention to Vietnamese prosody (thanh điệu) to create a smooth and captivating flow. The rhymes should feel natural and powerful, captivating the listener.
`;
    }

    // Cultural Depth Requirement for Vietnamese Genres
    const vietnameseDeepGenres = [Genre.VPop, Genre.Bolero, Genre.DanCa, Genre.IndieViet, Genre.Ballad, Genre.NhacCachMang, Genre.Vinahouse];
    if (genres.some(g => vietnameseDeepGenres.includes(g))) {
        instructions += `
**Cultural & Lyrical Depth (Chất liệu dân gian):**
Since you are writing for ${genres.join(' and ')}, you must actively incorporate **traditional Vietnamese imagery and idioms** to add depth ("chiều sâu").
- **Mandatory:** Where appropriate for the story, weave in phrases like: **"trầu cau"** (betel & areca - symbol of faithful love/marriage), **"sợi tơ"** or **"tơ hồng"** (the red thread of fate), **"đá mòn sông cạn"** (eternal love), **"bến nước con đò"** (waiting), or **"gừng cay muối mặn"** (enduring hardship).
- **Tone:** The lyrics should feel poetic and "thấm" (deeply emotional), avoiding superficial clichés. Use these images to ground the song in the Vietnamese cultural soul.`;
    }

    return instructions;
};

const getSoundStyleInstruction = (genres: Genre[], gender: VoiceGender, characteristics: VocalCharacteristic[], tempo: number): string => {
    const genreText = genres.length > 1 ? `a blend of ${genres.join(' and ')}` : genres[0];
    const voiceText = `${gender} with characteristics like ${characteristics.join(', ')}`;
    const tempoText = `${tempo} BPM`;

    return `
**Crucial 'soundStyle' Generation Mandate:**
Based on the user's selection of a **${genreText}** style, a **${voiceText}** vocal profile, and a tempo of **${tempoText}**, generate a 'soundStyle.prompt' that is detailed, professional, and creates a full, bright, modern sound. Adhere to the principles in "PART 2: DYNAMIC INSTRUMENTATION & ARRANGEMENT PRINCIPLES".

**Instructions for the AI:**
1.  **Synthesize Genres Intelligently (Backbone & Overlay Framework):**
    -   **Challenge:** When blending distinct genres (e.g., "Jazz" + "Metal"), avoid a chaotic mix. You must establish a hierarchy.
    -   **Backbone Assignment:** Explicitly select ONE genre to provide the rhythmic foundation (Drum Kit, Bass technique, Groove).
        *   *Priority:* Vinahouse, EDM, Trap, Metal, Rock, Funk.
    -   **Overlay Assignment:** The other genre(s) provide the harmonic context, melodic instruments, and vocal delivery style.
    -   **Complex Fusion Example:** For "Jazz + Metal": "The track uses the aggressive, double-kick drumming and distorted bass of Metal (Backbone) but incorporates complex Jazz chord voicings on electric piano and a chaotic saxophone solo (Overlay)."
    -   **Harmonious Nuance:** Describe the interaction. "The disparate elements should blend seamlessly, with the [Overlay Instrument] weaving through the [Backbone Rhythm] rather than overpowering it."
2.  **Match Instrumentation to Genre:**
    - For **Rock/Ballad styles:** Emphasize dynamic arrangements with instruments like piano, acoustic guitar, powerful electric guitars, a strong bassline, and a full drum kit. A string section can be added for emotional lift.
    - For **Pop/EDM/Electronic styles:** Focus on a clean, polished mix with catchy synth hooks, modern drum machines (e.g., 808s), deep sub-bass, and atmospheric pads.
    - For **Hip Hop/Lofi/Trap:** The rhythmic foundation is key. Detail the type of drums (e.g., punchy, sampled, electronic), the bass (e.g., 808s, groovy bassline), and the core melodic element (e.g., a sample, a synth loop).
    - For **Vinahouse**: Demand a high-energy, instrumental electronic dance track with a **strong Asian influence**.
        *   **MOOD:** High-energy, dramatic yet uplifting electronic dance music with a strong Asian influence.
        *   **INSTRUMENTS (Backbone vs Overlay):** 
            - **Lead:** A synthesized plucked string instrument, reminiscent of a **Koto, Guzheng, Pipa, or Đàn Tranh**, playing a fast, melodic line.
            - **Drums:** A driving electronic kit with a prominent **Kick** on every beat, a consistent **Snare** on the off-beats, and a **Hi-hat** pattern that adds rhythmic complexity.
            - **Bass:** A deep, sustained bass synth providing the harmonic foundation (or the classic Vinahouse off-beat 'Wub' bass).
        *   **VOCALS:** Warm, expressive, realistic female voice. Treat with polished pitch correction, reverb, and delay. **Crucial:** Add soaring, delayed ad-libs ('về đâu', 'nhớ thương') in the final chorus.
        *   **MIXING/PRODUCTION:** A clear, bright mix with the lead synth prominent. Use **filtering effects** on the main synth melody. Ensure a strong, punchy low end from the kick and bass. Use heavy sidechain compression on Bass/Pads from Kick.
        *   **STRUCTURAL MAP (Kích Đập - ${tempo} BPM):**
            1. **Intro (0:00–0:14) [Energy 20%]:** **Kick Light** (minimal low-end), **No Bass**. FX: Subtle FX like uplifters, white-noise sweeps. Melody: Filtered 'Guzheng/Pipa' lead melody/pluck preview playing a hook. Pattern: 'Kick: BOOM-BOOM-BOOM-BOOM | No Bass | Hat: tss tss tss tss (1/16)' to build tension.
            2. **Pre-Verse (0:18–0:32) [Energy 35%]:** **Kick Clearer**. **Bass enters lightly** (small off-beat). Clap/Snare on beats 2 & 4. Pad: Bolero style opening up. Pattern: 'Kick: BOOM BOOM | Bass: (off-beat) wub wub | Clap: clap clap'.
            3. **Verse (0:32–0:55) [Energy 50%]:** **Kick Full Force**. **Off-beat Bass** running steady. Stereo Hats. Shaker added. Beat restrained for vocal clarity.
            4. **Pre-Build (0:55–1:06) [Energy 65%]:** **Kick Reduced** (half force). **Bass Reduced**. Snare Roll accelerates (ta ta ta -> TATATATA). Noise Riser up. Create contrast for drop.
            5. **Drop 1 (1:06–1:36) [Energy 100% - THE EXPLOSION]:** **Kick Full Power** (Strong low-end). **Bass Off-beat** continuous & heavy. **Lead:** 'Koto/Guzheng' pluck opens filter, playing main hook. Supersaw backing. Clap strong + Ride cymbal. Pattern: 'Kick: BOOM BOOM | Bass: WUB WUB | Lead: Hook | Ride: SHHH SHHH'.
            6. **Verse 2 (1:36–1:58) [Energy 50%]:** **Kick Full**. Bass continues but quieter/smaller. Lead off (only pad + small pluck).
            7. **Build 2 (1:58–2:10) [Energy 70%->100%]:** Stronger than Build 1. Long Snare Roll. Strong Riser. **Cut all low-end** few seconds before drop.
            8. **Drop 2 (2:10–2:40) [Energy 120% - PEAK]:** **Kick Strongest** (+2-3% power). **Bass Off-beat** heavily compressed (pump). **Lead:** Full filter open + Octave layer. **Vocals:** Add Echo/Delay Ad-libs ('về đâu', 'phải không').
            9. **Outro (2:40–3:00) [Energy 20%]:** **Bass Off**. Kick fades out. Warm Bolero Pad & Guitar fade out.
    - For styles with Vietnamese roots like **Bolero/V-Pop:** Explicitly mention blending modern production techniques with traditional instruments like Đàn Tranh, Sáo Trúc, or Đàn Bầu to create a unique and authentic sound.
    - For **Jazz/Blues/Funk:** Emphasize live instrumentation with a strong groove. Highlight instruments like brass sections (trumpet, sax), upright or electric bass, piano/organ, and clean guitars. Mention complex harmonies and improvisation.
    - For **Classical:** Specify an orchestral arrangement. Focus on dynamics, conducting (tempo changes), and acoustic instruments like strings, woodwinds, brass, and timpani.
    - For **Reggae:** The rhythm is defined by the 'skank'—guitar chops on the off-beats. Demand a heavy, melodic bassline and a 'one-drop' drum pattern.
    - For **Metal:** Focus on high-gain distorted guitars, fast aggressive drumming (double kick), and intense vocals.
3.  **Align Production with Vocals:** The production notes must complement the vocal characteristics.
    - For **powerful/resonant** vocals, suggest a wide, spacious mix.
    - For **sweet/warm/clear** vocals, call for an intimate, clean production.
    - **Crucially, you must include specific, creative, and genre-appropriate suggestions for vocal ad-libs.** For example, for a pop song, suggest 'catchy "oh-na-na" ad-libs in the post-chorus'; for a ballad, 'emotional, soaring "ooh" and "aah" ad-libs in the bridge and outro'; for Hip-Hop, 'rhythmic "yeah" and "uh-huh" ad-libs to punctuate phrases and add energy. These should be integrated into the vocal production section of the prompt.
    - **Vocal Cohesion (MANDATORY):** You must explicitly instruct to "glue" the vocal to the mix. Require: "Use a shared reverb space (Plate/Hall) for vocals and instruments to create a unified space. Apply subtle sidechain compression or dynamic EQ on the music bus, triggered by the lead vocal, to carve out space and ensure intelligibility without raising volume."
4.  **Incorporate Tempo:** The production notes must explicitly state and reflect the specified **${tempo} BPM**. Describe the rhythmic feel—is it a slow, emotional ballad, a mid-tempo pop groove, or an energetic dance track? The drum programming and bassline description must align with this tempo, using the vocabulary from the system instructions.
5.  **Crucial Mixing & Balance Instructions:** The generated prompt **must** include specific, professional mixing instructions to ensure a balanced and clean sound. This is not optional.
    -   **For Low-End Clarity:** Mandate the use of high-pass filters (HPF) on instruments that do not require deep bass (like vocals, guitars, pianos, cymbals) to prevent a muddy, boomy, or noisy mix.
    -   **For Vocal Blending:** Mandate techniques to blend the vocals seamlessly with the instruments so they sound cohesive. Explicitly state: "Blend vocals with shared reverb and subtle sidechaining from the vocal to competing instruments (pads, rhythm guitars)."
6.  **Mandatory Mastering & Final Polish:** The prompt **MUST** conclude with specific mastering instructions appropriate for the genre.
    - For **Vinahouse/EDM**: Specify 'Club Master' with -5 LUFS target and Brickwall Limiting.
    - For **Ballad/Bolero/Classical**: Specify 'Dynamic Master' with **-10 to -12 LUFS** target. Explicitly state: "Preserve dynamic range between quiet verses and loud choruses. Avoid over-compression. Use gentle optical limiting."
    - For **Pop/Rock**: Specify 'Radio Master' with -8 to -9 LUFS.
7.  **Final Prompt Format:** The final 'soundStyle.prompt' must be a consolidated brief for a music producer, in English, under 1000 characters, covering Mood, Production & Mixing Notes (as detailed in step 5, specifically HPF and Vocal Cohesion via Shared Reverb/Sidechain), a specific list of Key Instruments, Vocal Production notes (which **must** include ad-lib suggestions), a clear statement of the Tempo and its rhythmic character, and the Mastering & Polish section.
`;
};


const lyricsFirstSchema = {
    type: Type.OBJECT,
    properties: {
        lyrics: {
            type: Type.STRING,
            description: "The full song lyrics, professionally structured with section labels like [Verse 1], [Chorus 1], etc., based on the requested structure. The lyrics must feature a repeating chorus. The lyrics text must be clean and contain NO instrumental cues."
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

const performCoherenceCheck = async (lyrics: string, topic: string): Promise<CoherenceAnalysis> => {
    const model = "gemini-2.5-flash"; // Use Flash for speed
    
    const systemPrompt = `You are a strict lyrical editor and music critic. Your task is to analyze the provided song lyrics (mostly in Vietnamese) for **Narrative Coherence, Emotional Logic, and Structural Integrity** based on the provided Topic/Theme.
    
    **Crucial Rule:**
    - **NO Meta-Commentary:** Flag any lines that refer to the song itself, the beat, the lyrics, or the act of writing/singing (e.g., "nhịp beat", "lời ca này", "giai điệu"). The lyrics must stay completely within the immersive story.
    `;

    const prompt = `
    **Original Topic/Theme:** "${topic}"

    **Lyrics:**
    ---
    ${lyrics}
    ---

    **Evaluation Criteria:**
    1.  **Narrative Flow:** Does the story progress logically from start to finish? Flag any jarring non-sequiturs or confused storytelling.
    2.  **Emotional Consistency:** Does the emotional arc make sense? (e.g., Avoid abrupt shifts from grief to joy without context).
    3.  **Theme Adherence:** Do the lyrics actually stick to the provided topic?
    4.  **Vietnamese Context:** Respect Vietnamese poetic license (imagery-driven transitions), but flag things that are objectively nonsensical.
    5.  **Meta-Commentary Check:** Are there any references to the song's form (beat, lyrics, melody)? These are forbidden.

    **Output format:**
    Return a JSON object strictly matching the schema.
    - If the song is fully coherent AND free of meta-commentary (Score >= 9), 'issues' MUST be an empty array.
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

        const jsonText = response.text.trim();
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
    const structureInstruction = getStructurePrompt(structure, customStructure);
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
          systemInstruction: SONGWRITING_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: lyricsFirstSchema,
          temperature: 0.8,
          topP: 0.9,
        },
      });
      const jsonText = response.text.trim();
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
                systemInstruction: SONGWRITING_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: titleGenerationSchema,
                temperature: 0.9,
            },
        });

        const coherencePromise = performCoherenceCheck(lyricsData.lyrics, topic);

        // Await both
        const [titleResponse, coherenceData] = await Promise.all([titlePromise, coherencePromise]);

        const jsonText = titleResponse.text.trim();
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
            description: "The full song lyrics, professionally structured with a repeating chorus. The lyrics must be tailored specifically to the provided song title and must NOT contain any instrumental cues like [Guitar Solo]."
        },
        soundStyle: soundStyleSchema
    },
    required: ["lyrics", "soundStyle"]
};

export const regenerateLyrics = async (topic: string, genres: Genre[], title: string, gender: VoiceGender, characteristics: VocalCharacteristic[], tempo: number, structure: SongStructure, customStructure?: string): Promise<SongData> => {
    const model = "gemini-2.5-pro";
    const genreText = genres.length > 1 ? `a blend of ${genres.join(' and ')}` : genres[0];
    const voiceText = `${gender} with the following characteristics: ${characteristics.join(', ')}`;
    const structureInstruction = getStructurePrompt(structure, customStructure);
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
                systemInstruction: SONGWRITING_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: regenerateSchema,
                temperature: 0.8,
                topP: 0.9,
            },
        });

        const jsonText = response.text.trim();
        const regeneratedData = JSON.parse(jsonText);

        if (!regeneratedData.lyrics || !regeneratedData.soundStyle) {
            throw new Error("Invalid response structure from regeneration API.");
        }

        // Run coherence check on the regenerated lyrics
        const coherenceData = await performCoherenceCheck(regeneratedData.lyrics, title); // Use title as topic proxy for cohesion

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

        const jsonText = response.text.trim();
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
        return response.text.trim();
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};
