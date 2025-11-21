
import React, { useState, useEffect } from 'react';
import { SoundStyleData } from '../types';
import { SoundWaveIcon } from './icons';

interface SoundStyleDisplayProps {
  data: SoundStyleData;
  title?: string; // Make title optional for backward compatibility if needed
}

// Robust copy function with fallback for HTTP environments
const copyToClipboard = async (text: string): Promise<boolean> => {
    // Try modern API first (works on HTTPS/Localhost)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn("Clipboard API failed, falling back to legacy copy", err);
      }
    }
  
    // Fallback for HTTP or restricted environments
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Ensure it's not visible but part of DOM to work
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

const SoundStyleDisplay: React.FC<SoundStyleDisplayProps> = ({ data, title }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleCopy = async () => {
        const success = await copyToClipboard(data.prompt);
        if (success) setCopied(true);
    };

    const charCount = data.prompt.length;
    const maxChars = 1000;

    return (
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-gray-700 pb-3">
                <div className="flex items-center gap-3">
                    <SoundWaveIcon className="h-6 w-6 text-teal-400" />
                    <h2 className="text-xl font-black text-teal-400 tracking-tight">
                        {title || "Sound Style & Instrumentation Prompt"}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono font-bold ${charCount > maxChars ? 'text-red-400' : 'text-gray-500'}`}>
                        {charCount}/{maxChars}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="px-4 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white flex-shrink-0 shadow-sm"
                    >
                        {copied ? 'Copied!' : 'Copy Prompt'}
                    </button>
                </div>
            </div>

            <div>
                <pre className="text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">{data.prompt}</pre>
            </div>
        </div>
    );
};

export default SoundStyleDisplay;
