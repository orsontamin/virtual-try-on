import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Scissors, Shirt, ArrowRight, Zap, Wifi } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen branded-bg flex flex-col font-sans selection:bg-u-orange/20 items-center justify-center p-6">
      <div className="w-full max-w-6xl z-10 flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-tech-black text-white rounded-pill shadow-xl border border-white/10 mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Zap size={16} className="text-u-orange" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">CARA U Sabah Ultra5G Fest</span>
          </div>
          
          <img src="/assets/logo/umobile-logo.png" alt="U Mobile Logo" className="h-16 md:h-24 w-auto object-contain mx-auto mb-8 drop-shadow-xl" />
          
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-tech-black leading-none uppercase italic">
            AI <span className="text-u-orange text-outline">EXPERIENCE.</span>
          </h1>
        </div>

        {/* Choice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
          {/* AI Wardrobe Card */}
          <button 
            onClick={() => navigate('/wardrobe')}
            className="group relative bg-white p-12 rounded-[60px] border-2 border-tech-black/5 shadow-[0_30px_100px_rgba(52,55,65,0.05)] hover:shadow-[0_50px_120px_rgba(215,63,9,0.15)] transition-all duration-500 hover:-translate-y-2 text-left flex flex-col justify-between h-[480px] overflow-hidden"
          >
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-u-orange/5 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-tech-black text-u-orange rounded-[32px] flex items-center justify-center shadow-2xl group-hover:bg-u-orange group-hover:text-white transition-all duration-500 mb-10">
                <Shirt size={40} />
              </div>
              <h2 className="text-5xl font-black text-tech-black tracking-tighter mb-4 italic uppercase">AI <br /><span className="text-u-orange">WARDROBE.</span></h2>
              <p className="text-tech-black/40 font-black uppercase tracking-widest text-[10px]">Instant Garment Stitching</p>
            </div>

            <div className="relative z-10 flex items-center justify-between mt-auto pt-8 border-t border-tech-black/5">
              <span className="text-tech-black font-black text-xl uppercase tracking-tighter group-hover:text-u-orange transition-colors italic">Initialize Drip</span>
              <div className="w-16 h-16 rounded-full border-2 border-tech-black/10 flex items-center justify-center group-hover:bg-u-orange group-hover:border-u-orange group-hover:text-white transition-all duration-500">
                <ArrowRight size={24} />
              </div>
            </div>
          </button>

          {/* AI Grooming Card */}
          <button 
            onClick={() => navigate('/barber-kiosk')}
            className="group relative bg-white p-12 rounded-[60px] border-2 border-tech-black/5 shadow-[0_30px_100px_rgba(52,55,65,0.05)] hover:shadow-[0_50px_120px_rgba(215,63,9,0.15)] transition-all duration-500 hover:-translate-y-2 text-left flex flex-col justify-between h-[480px] overflow-hidden"
          >
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-u-orange/5 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-tech-black text-u-orange rounded-[32px] flex items-center justify-center shadow-2xl group-hover:bg-u-orange group-hover:text-white transition-all duration-500 mb-10">
                <Scissors size={40} />
              </div>
              <h2 className="text-5xl font-black text-tech-black tracking-tighter mb-4 italic uppercase">AI <br /><span className="text-u-orange">GROOMING.</span></h2>
              <p className="text-tech-black/40 font-black uppercase tracking-widest text-[10px]">Real-time Style Analysis</p>
            </div>

            <div className="relative z-10 flex items-center justify-between mt-auto pt-8 border-t border-tech-black/5">
              <span className="text-tech-black font-black text-xl uppercase tracking-tighter group-hover:text-u-orange transition-colors italic">Take Your Seat</span>
              <div className="w-16 h-16 rounded-full border-2 border-tech-black/10 flex items-center justify-center group-hover:bg-u-orange group-hover:border-u-orange group-hover:text-white transition-all duration-500">
                <ArrowRight size={24} />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mini Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-tech-black py-3 flex justify-center items-center z-50">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
              Powered by EventzFlow 2026
          </p>
      </div>
    </div>
  );
};

export default LandingPage;