import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Scissors, Shirt, ArrowRight, Zap, Wifi } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col font-sans selection:bg-u-orange/20 items-center justify-center p-6 h-full">
      <div className="w-full max-w-6xl z-10 flex flex-col items-center">
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
    </div>
  );
};

export default LandingPage;