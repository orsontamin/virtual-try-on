import React from 'react';
import { Sparkles, Palette } from 'lucide-react';

const STYLES = [
  { id: 'cleangirl', name: 'Clean Girl', description: 'Fresh, minimal, dew-glow', color: 'bg-pink-100' },
  { id: 'softglam', name: 'Soft Glam', description: 'Classy, blended, evening', color: 'bg-amber-100' },
  { id: 'cybervibe', name: 'Cyberpunk', description: 'Neon eyes, bold lines', color: 'bg-violet-200' },
  { id: 'midnight', name: 'Midnight', description: 'Deep tones, dark hair', color: 'bg-slate-300' },
  { id: 'ethereal', name: 'Angelic', description: 'Pastel hues, soft curls', color: 'bg-blue-100' },
  { id: 'lattemakeup', name: 'Latte', description: 'Warm bronzy coffee vibes', color: 'bg-orange-200' },
];

const StyleSelector = ({ selectedStyle, onSelect }) => {
  return (
    <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
          <h3 className="text-2xl font-black text-white flex items-center gap-2 mb-2">
              <Palette className="text-pink-500" /> 1. Choose your Vibe
          </h3>
          <p className="text-white/40 text-sm">Select the AI makeup & hair style to stitch.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STYLES.map((style) => (
              <button 
                  key={style.id}
                  onClick={() => onSelect(style)}
                  className={`relative p-6 rounded-3xl text-left transition-all active:scale-95 border-2 ${
                      selectedStyle?.id === style.id 
                      ? 'bg-white text-black border-pink-500 ring-4 ring-pink-500/20' 
                      : 'bg-white/5 text-white border-transparent hover:border-white/20 hover:bg-white/10'
                  }`}
              >
                  <div className={`w-8 h-8 rounded-full mb-4 ${style.color} shadow-inner`}></div>
                  <div className="font-black uppercase text-xs tracking-widest">{style.name}</div>
                  <div className={`text-[10px] mt-1 ${selectedStyle?.id === style.id ? 'text-black/60' : 'text-white/40'}`}>
                      {style.description}
                  </div>
                  
                  {selectedStyle?.id === style.id && (
                      <div className="absolute top-4 right-4 text-pink-500">
                          <Sparkles size={16} />
                      </div>
                  )}
              </button>
          ))}
      </div>
    </div>
  );
};

export default StyleSelector;
