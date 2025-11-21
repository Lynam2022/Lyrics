
import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  mode?: 'generating' | 'analyzing';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ mode = 'generating' }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  const generatingMessages = [
    "Initializing Creative Engine...",
    "Analyzing Emotional Context...",
    "Drafting Lyrical Structure...",
    "Harmonizing Genre Elements...",
    "Composing Sound Style...",
    "Finalizing Production Brief...",
    "Polishing Output..."
  ];

  const analyzingMessages = [
    "Reading Lyrics...",
    "Decoding Metaphors & Imagery...",
    "Detecting Emotional Tone...",
    "Analyzing Rhyme Scheme...",
    "Extracting Core Message...",
    "Compiling Analysis Report..."
  ];

  const messages = mode === 'generating' ? generatingMessages : analyzingMessages;

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500); // Change message every 1.5 seconds

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center w-full py-12 relative overflow-hidden rounded-xl bg-gray-800/30 border border-gray-700/50 backdrop-blur-md">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>

      {/* Sound Wave Animation */}
      <div className="flex items-end justify-center gap-1 h-16 mb-6 z-10">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-teal-500 to-cyan-300 rounded-t-sm animate-sound-wave"
            style={{
              animationDelay: `${i * 0.1}s`,
              height: '20%', // Initial height
            }}
          ></div>
        ))}
      </div>

      {/* Dynamic Text */}
      <div className="flex flex-col items-center z-10">
        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-cyan-200 mb-2 tracking-wide">
          AI Songwriter Studio
        </h3>
        <div className="h-6 overflow-hidden relative">
             <p key={messageIndex} className="text-sm text-teal-400/80 font-mono animate-fade-in-up">
                {messages[messageIndex]}
             </p>
        </div>
      </div>

      {/* Inline Styles for the custom animation */}
      <style>{`
        @keyframes sound-wave {
          0% { height: 20%; opacity: 0.5; }
          50% { height: 100%; opacity: 1; }
          100% { height: 20%; opacity: 0.5; }
        }
        .animate-sound-wave {
          animation: sound-wave 1.2s ease-in-out infinite;
        }
        @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
