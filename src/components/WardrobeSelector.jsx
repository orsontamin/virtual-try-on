import React from 'react';
import { Shirt } from 'lucide-react';

const SHIRTS = [
  { id: 'premium', name: 'Premium Tee', src: '/assets/shirts/base-canvas-black-shirt.png' },
];

const WardrobeSelector = ({ selectedShirt, onSelect, compact = true }) => {
  if (compact) {
      return (
        <div className="w-full space-y-4">
            <div className="flex gap-6 overflow-x-auto pt-4 pb-4 scrollbar-hide px-4">
                {SHIRTS.map((shirt) => (
                    <button 
                        key={shirt.id}
                        onClick={() => onSelect(shirt.src)}
                        className={`flex-shrink-0 w-44 h-52 border-2 transition-all duration-500 rounded-[40px] p-6 shadow-sm ${
                            selectedShirt === shirt.src 
                            ? 'border-u-orange bg-white shadow-[0_20px_50px_rgba(215,63,9,0.15)] scale-105 z-10' 
                            : 'border-tech-black/10 bg-white/50 opacity-50 hover:opacity-100 hover:bg-white'
                        }`}
                    >
                        <img src={shirt.src} alt={shirt.name} className="w-full h-full object-contain" />
                    </button>
                ))}
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-6 p-8 bg-white rounded-[48px] shadow-[0_30px_80px_rgba(52,55,65,0.08)] border-2 border-tech-black/5 w-full max-w-sm h-full">
      <section>
        <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-u-orange/10 text-u-orange rounded-2xl flex items-center justify-center">
                <Shirt size={24} />
            </div>
            <div>
                <h3 className="text-xl font-black text-tech-black uppercase tracking-tighter italic leading-none">BASE CANVAS</h3>
                <p className="text-tech-black/40 text-[8px] font-black uppercase tracking-widest mt-1">Sabah Edition</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
            {SHIRTS.map((shirt) => (
                <button 
                    key={shirt.id}
                    onClick={() => onSelect(shirt.src)}
                    className={`group relative border-2 p-6 transition-all duration-500 flex flex-col items-center gap-6 rounded-[40px] ${
                        selectedShirt === shirt.src 
                        ? 'border-u-orange bg-white shadow-[0_30px_60px_rgba(215,63,9,0.15)] scale-[1.02]' 
                        : 'border-tech-black/5 hover:border-u-orange/20 hover:bg-soft-white/20'
                    }`}
                    title={shirt.name}
                >
                    <div className="w-full h-48 relative transform group-hover:scale-110 transition-transform duration-500">
                        <img src={shirt.src} alt={shirt.name} className="w-full h-full object-contain" />
                    </div>
                    <div className={`px-6 py-2 rounded-pill text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                        selectedShirt === shirt.src ? 'bg-u-orange text-white' : 'bg-tech-black/5 text-tech-black/40'
                    }`}>
                        {shirt.name}
                    </div>
                </button>
            ))}
        </div>
      </section>
    </div>
  );
};

export default WardrobeSelector;
