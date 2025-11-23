
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
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center w-full py-16 relative overflow-hidden rounded-3xl bg-gray-900/50 border border-gray-700/30 backdrop-blur-xl shadow-2xl group">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-90 z-0"></div>
      
      {/* Rotating & Pulsing Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px] animate-pulse pointer-events-none mix-blend-screen"></div>
      
      {/* Rotating Ring Border Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-teal-500/20 border-t-teal-500/80 animate-spin-slow z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-cyan-400/10 border-b-cyan-400/60 animate-spin-reverse z-0"></div>

      {/* Center Visual: Dynamic Equalizer / Sound Wave */}
      <div className="relative z-10 flex items-center justify-center h-24 w-full gap-1.5 mb-6">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 bg-gradient-to-t from-teal-600 via-teal-400 to-cyan-200 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.5)]"
            style={{
              animation: `music-bar 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.1 - 0.6}s`, // Staggered start
              height: '20%',
            }}
          ></div>
        ))}
      </div>

      {/* Text Container */}
      <div className="flex flex-col items-center z-10 relative">
        <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-cyan-200 tracking-widest uppercase">
            AI Thinking
            </h3>
        </div>
        
        <div className="h-8 overflow-hidden relative flex items-center justify-center min-w-[280px]">
             <p key={messageIndex} className="text-sm sm:text-base text-teal-300/90 font-mono animate-slide-up-fade text-center">
                {messages[messageIndex]}
             </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes music-bar {
          0% { height: 15%; opacity: 0.3; }
          50% { height: 80%; opacity: 1; box-shadow: 0 0 20px rgba(45,212,191,0.6); }
          100% { height: 15%; opacity: 0.3; }
        }
        @keyframes spin-slow {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spin-reverse {
          0% { transform: translate(-50%, -50%) rotate(360deg); }
          100% { transform: translate(-50%, -50%) rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-spin-reverse {
            animation: spin-reverse 12s linear infinite;
        }
        @keyframes slide-up-fade {
            0% { opacity: 0; transform: translateY(10px); filter: blur(4px); }
            100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-slide-up-fade {
            animation: slide-up-fade 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
        .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
