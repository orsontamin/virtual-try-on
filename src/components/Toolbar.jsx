import React, { useMemo } from 'react';
import { Trash2, Download, Sticker, Zap } from 'lucide-react';
import * as fabric from 'fabric';
import { createDeleteControl, applyStickerSettings } from '../utils/fabric-utils';

const STICKERS = Array.from({ length: 12 }, (_, i) => ({
  id: `sticker-${i + 1}`,
  src: `assets/stickers/sticker-${i + 1}.png`
}));

const STICKER_DIMENSIONS = {
  'sticker-1': { w: 28, h: 40 },
  'sticker-2': { w: 32, h: 32 },
  'sticker-3': { w: 31, h: 32 },
  'sticker-4': { w: 27, h: 35 },
  'sticker-5': { w: 38.5, h: 26.5 },
  'sticker-6': { w: 26, h: 40 }
};

const CM_TO_PX = 7.2; // Reduced by additional 10%

const Toolbar = ({ canvas, compact }) => {
  const deleteControl = useMemo(() => createDeleteControl(), []);

  const addSticker = (sticker) => {
    if (!canvas) return;
    fabric.Image.fromURL(sticker.src, { crossOrigin: 'anonymous' }).then((img) => {
      const dims = STICKER_DIMENSIONS[sticker.id];
      
      if (dims) {
        // Apply specific physical dimensions (1cm = 7.2px)
        const targetW = dims.w * CM_TO_PX;
        const targetH = dims.h * CM_TO_PX;
        
        // Calculate scale to fit these dimensions while maintaining aspect ratio 
        // OR force dimensions if you want exact CM sizing regardless of original image AR
        img.set({
          scaleX: targetW / img.width,
          scaleY: targetH / img.height
        });
      } else {
        img.scaleToWidth(72); // Reduced from 80
      }

      img.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
      });

      applyStickerSettings(img, deleteControl);
      canvas.add(img);
      canvas.setActiveObject(img);
    });
  };

  const clearCanvas = () => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    for(let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (obj.selectable) { 
            canvas.remove(obj);
        }
    }
  };

  if (compact) {
      return (
        <div className="w-full space-y-2 -mt-4">
            <div className="flex justify-between items-center px-4">
                <p className="text-sm font-black uppercase tracking-[0.4em] text-tech-black/40 italic">STICKER CATALOGUE</p>
                <button onClick={clearCanvas} className="text-[10px] font-bold text-u-orange uppercase tracking-tighter flex items-center gap-2 px-4 py-2 bg-u-orange/5 border-2 border-u-orange/10 rounded-pill active:scale-95 transition-all">
                    <Trash2 size={12} /> CLEAR DESIGN
                </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pt-2 pb-6 scrollbar-hide px-4">
                {STICKERS.map((sticker) => (
                    <button 
                        key={sticker.id}
                        onClick={() => addSticker(sticker)}
                        className="flex-shrink-0 w-36 h-36 border-2 border-tech-black/5 bg-white rounded-[40px] p-6 transition-all duration-500 hover:border-u-orange hover:shadow-[0_20px_40px_rgba(215,63,9,0.15)] active:scale-90 shadow-sm"
                    >
                        <img src={sticker.src} alt={sticker.id} className="w-full h-full object-contain" />
                    </button>
                ))}
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-6 p-8 bg-white rounded-[48px] shadow-[0_30px_80px_rgba(52,55,65,0.08)] border-2 border-tech-black/5 w-full max-w-sm h-full overflow-y-auto">
      <section>
        <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-u-orange text-white rounded-2xl flex items-center justify-center shadow-lg shadow-u-orange/20">
                <Sticker size={24} />
            </div>
            <div>
                <h3 className="text-xl font-black text-tech-black uppercase tracking-tighter italic leading-none">ADD STYLING</h3>
                <p className="text-tech-black/40 text-[8px] font-black uppercase tracking-widest mt-1">Tap to apply to Canvas</p>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
             {STICKERS.map((sticker) => (
                <button 
                    key={sticker.id}
                    onClick={() => addSticker(sticker)}
                    className="border-2 border-tech-black/5 rounded-[32px] p-6 hover:border-u-orange hover:bg-u-orange/5 transition-all shadow-sm flex justify-center items-center group bg-soft-white/10"
                >
                    <img src={sticker.src} alt={sticker.id} className="w-16 h-16 object-contain group-hover:scale-110 transition-transform duration-500" />
                </button>
            ))}
        </div>
      </section>
      
      <div className="mt-auto pt-8 border-t-2 border-tech-black/5">
        <button onClick={clearCanvas} className="w-full flex items-center justify-center gap-3 py-5 bg-u-orange text-white rounded-pill hover:bg-tech-black transition-all duration-500 text-xs font-black uppercase tracking-widest shadow-xl group">
            <Trash2 size={18} className="group-hover:rotate-12 transition-transform" /> RESET
        </button>
      </div>
    </div>
  );
};

export default Toolbar;