import React, { useState, useEffect } from 'react';
import DesignCanvas from '../components/DesignCanvas';
import Toolbar from '../components/Toolbar';
import WardrobeSelector from '../components/WardrobeSelector';
import HumanInput from '../components/HumanInput';
import { ArrowRight, ArrowLeft, RefreshCw, BarChart3, Image as ImageIcon, Sparkles, Scissors, Zap, Download, Wifi } from 'lucide-react';
import { tryOn } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { saveToHistory } from '../services/history';
import { saveImageToDrive } from '../services/google-drive';
import { getAccessToken as refreshGoogleToken } from '../services/auth';

const LOADING_STEPS = [
    "Analyzing silhouette...",
    "Extracting fabric texture...",
    "Simulating drape & flow...",
    "Stitching design to body...",
    "Finalizing your look..."
];

function WizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [canvas, setCanvas] = useState(null);
  const [savedDesign, setSavedDesign] = useState(null);
  const [selectedShirt, setSelectedShirt] = useState('/assets/shirts/base-canvas-black-shirt.png');
  const [designImage, setDesignImage] = useState(null);
  const [humanImage, setHumanImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  
  const [isPortraitMode, setIsPortraitMode] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => setIsPortraitMode(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    try {
        const token = await refreshGoogleToken(true);
        if (token) {
            setError(null);
            setStep(3);
        }
    } catch (err) {
        setError("Authorization failed. Please ensure popups are allowed.");
    } finally {
        setIsAuthorizing(false);
    }
  };

  useEffect(() => {
    let interval;
    if (loading) {
        interval = setInterval(() => {
            setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
        }, 2500);
    } else {
        setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleCanvasReady = (fabricCanvas) => {
    setCanvas(fabricCanvas);
  };
  
  const handleShirtSelect = (shirtSrc) => {
      setSelectedShirt(shirtSrc);
  };

  const handleNextToDesign = () => {
    setSavedDesign(null);
    if (selectedShirt) setStep(2);
  };

  const handleNextToHuman = () => {
    if (canvas) {
        // Only save objects that ARE NOT backgrounds
        const stickersOnly = canvas.getObjects().filter(obj => !obj.isBackground);
        const stickersJson = {
            version: canvas.version,
            objects: stickersOnly.map(obj => obj.toObject(['isBackground', 'selectable', 'evented', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'hoverCursor']))
        };
        
        setSavedDesign(stickersJson);
        const dataURL = canvas.toDataURL({ format: 'png', multiplier: 2 });
        setDesignImage(dataURL);
        setStep(3);
    }
  };

  const handleGenerate = async (imgToUse) => {
      const finalHumanImage = imgToUse || humanImage;
      if (!finalHumanImage || !designImage) return;

      setStep(4);
      setLoading(true);
      setError(null);
      setShareUrl(null);
      try {
          const result = await tryOn(finalHumanImage, designImage);
          if (result) {
            setResultImage(result);
            saveToHistory(result);
            saveImageToDrive(result, `vto-design-${Date.now()}.png`).then(driveData => {
                if (driveData?.webViewLink) {
                    setShareUrl(driveData.webViewLink);
                }
            }).catch(() => {});
          } else {
             setResultImage(finalHumanImage); 
          }
      } catch (err) {
          setError(err.response?.data?.error?.message || err.message || "Generation failed.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className={`min-h-screen branded-bg flex flex-col font-sans selection:bg-u-orange/20 ${isPortraitMode ? 'h-screen overflow-y-auto' : ''}`}>
      {/* U Mobile Ultra5G Header */}
      <header className={`bg-tech-black text-white p-5 border-b-4 border-u-orange z-50 shadow-xl`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-5">
                <button 
                    onClick={() => navigate('/')}
                    className='p-3 bg-white/10 rounded-pill hover:bg-u-orange transition-all border border-white/20 active:scale-95'
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-4">
                    <img src="/assets/logo/umobile-logo.png" alt="U Mobile Logo" className="h-10 w-auto object-contain" />
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tight uppercase leading-none italic">
                            AI <span className="text-u-orange">WARDROBE</span>
                        </h1>
                        <span className="text-[10px] font-black text-u-orange/80 tracking-[0.2em] uppercase">CARA U Sabah Ultra5G Fest</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex gap-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-500 ${
                            step >= s ? 'bg-u-orange border-u-orange text-white shadow-lg scale-110' : 'bg-tech-black border-white/20 text-white/30'
                        }`}>
                            {s}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </header>

      <main className={`flex-grow flex flex-col items-center justify-center ${isPortraitMode ? 'p-0 overflow-y-auto relative' : 'p-4 md:p-8'}`}>
        
        {step === 1 && (
            <div className={`w-full max-w-6xl animate-in fade-in duration-700 flex items-center ${isPortraitMode ? 'flex-col min-h-full justify-between' : 'flex-col lg:flex-row gap-12'}`}>
                {/* Instruction Panel */}
                <div className="flex-1 flex flex-col items-center justify-center w-full relative group">
                    <div className="absolute -inset-4 bg-u-orange/5 rounded-[80px] blur-3xl opacity-50"></div>
                    <div className="relative w-full max-w-xl bg-white p-10 md:p-16 rounded-[60px] shadow-[0_40px_100px_rgba(52,55,65,0.1)] border-2 border-tech-black/5 flex flex-col items-center text-center">
                        <div className="mb-10">
                            <h3 className="text-4xl font-black text-tech-black uppercase tracking-tighter italic leading-none mb-4">
                                WELCOME TO <span className="text-u-orange text-5xl block">AI WARDROBE.</span>
                            </h3>
                        </div>

                        <div className="w-full flex flex-col items-start mb-8">
                            <div className="w-full h-px bg-tech-black/5 mb-6"></div>
                            <div className="text-[10px] font-black text-u-orange tracking-[0.3em] uppercase px-3 py-1 bg-u-orange/5 rounded-pill border border-u-orange/10">
                                HOW TO USE
                            </div>
                        </div>

                        <div className="space-y-10 w-full text-left mb-4">
                            {[ 
                                { id: '01', title: 'INITIALIZE DRIP', desc: 'Tap "Start Designing" to launch' },
                                { id: '02', title: 'STICKER FLEX', desc: 'Pick your vibe & place it' },
                                { id: '03', title: 'FIT CHECK', desc: 'Strike a full body pose' },
                                { id: '04', title: 'THE GLOW UP', desc: 'Wait for the AI to cook' }
                            ].map((item) => (
                                <div key={item.id} className="flex items-start gap-8 group/item">
                                    <span className="text-u-orange font-black italic text-4xl tracking-tighter opacity-20 group-hover/item:opacity-100 transition-opacity">{item.id}</span>
                                    <div>
                                        <h4 className="text-2xl font-black text-tech-black uppercase tracking-tighter leading-none mb-2">{item.title}</h4>
                                        <p className="text-tech-black/40 text-sm font-bold uppercase tracking-widest">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`w-full flex flex-col gap-8 ${isPortraitMode ? 'bg-white p-10 rounded-t-[60px] shadow-[0_-30px_100px_rgba(52,55,65,0.15)] border-t-4 border-u-orange' : 'lg:w-[450px]'}`}>
                    <div className="space-y-2">
                        <h2 className="text-5xl font-black text-tech-black tracking-tighter leading-none italic uppercase">
                            THIS IS YOUR <span className="text-u-orange">CANVAS.</span>
                        </h2>
                    </div>
                    
                    <div className="bg-soft-white/50 p-6 rounded-[32px]">
                        <WardrobeSelector selectedShirt={selectedShirt} onSelect={handleShirtSelect} compact={isPortraitMode} />
                    </div>

                    <button 
                        onClick={handleNextToDesign}
                        disabled={!selectedShirt}
                        className="w-full py-8 bg-u-orange text-white rounded-pill shadow-[0_20px_50px_rgba(215,63,9,0.3)] hover:bg-tech-black hover:shadow-2xl disabled:bg-slate-200 transition-all duration-500 font-black text-2xl uppercase tracking-tighter flex items-center justify-center gap-4 active:scale-95 group"
                    >
                        START DESIGNING <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className={`w-full max-w-6xl animate-in fade-in zoom-in-95 duration-700 flex items-center ${isPortraitMode ? 'flex-col min-h-full justify-between' : 'flex-col lg:flex-row gap-12'}`}>
                <div className="flex-1 flex flex-col items-center justify-center w-full relative text-center">
                    <div className={`relative p-6 bg-white rounded-[40px] shadow-[0_40px_100px_rgba(52,55,65,0.1)] border-2 border-tech-black/5 ${isPortraitMode ? 'transform scale-[0.9] origin-center' : ''}`}>
                        <DesignCanvas onCanvasReady={handleCanvasReady} selectedShirt={selectedShirt} initialDesign={savedDesign} />
                    </div>
                </div>

                <div className={`w-full flex flex-col gap-8 ${isPortraitMode ? 'bg-white p-10 rounded-t-[60px] shadow-[0_-30px_100px_rgba(52,55,65,0.15)] border-t-4 border-u-orange' : 'lg:w-[450px]'}`}>
                    <div className="space-y-2">
                        <h2 className="text-5xl font-black text-tech-black tracking-tighter leading-none italic uppercase text-left">
                            ADD SOME <span className="text-u-orange">FLAVOUR.</span>
                        </h2>
                    </div>

                    <Toolbar canvas={canvas} compact={isPortraitMode} />

                    <div className="flex gap-4">
                        <button 
                            onClick={() => { setSavedDesign(null); setStep(1); }} 
                            className="p-6 bg-u-orange text-white rounded-pill hover:bg-tech-black transition-all active:scale-95 shadow-md border-2 border-white/20"
                        >
                            <ArrowLeft size={32} />
                        </button>
                        <button 
                            onClick={handleNextToHuman}
                            className="flex-grow py-6 bg-u-orange text-white rounded-pill shadow-[0_20px_50px_rgba(215,63,9,0.3)] hover:bg-tech-black transition-all font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-4 active:scale-95"
                        >
                            FINALIZE VIBE <Zap size={28} fill="white" />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {step === 3 && (
            <div className={`w-full min-h-full flex flex-col items-center ${isPortraitMode ? 'justify-between py-12 px-6' : 'max-w-4xl text-center justify-center'}`}>
                <div className="space-y-2 mb-8">
                    <h2 className="text-6xl font-black text-tech-black tracking-tighter italic uppercase leading-tight">
                        FINALLY, STRIKE A <span className="text-u-orange">POSE.</span>
                    </h2>
                </div>
                
                <div className={`w-full relative flex items-center justify-center p-4 ${isPortraitMode ? 'flex-1' : ''}`}>
                    <div className="relative p-2 bg-white rounded-[60px] shadow-2xl border-4 border-u-orange/10 w-full max-w-lg">
                        <HumanInput 
                            onImageSelect={(img) => { setHumanImage(img); handleGenerate(img); }} 
                            designPreview={designImage}
                            compact={isPortraitMode}
                        />
                    </div>
                </div>

                <div className="pb-12">
                    <button onClick={() => setStep(2)} className="px-12 py-5 bg-u-orange text-white rounded-pill font-black hover:bg-tech-black transition-all active:scale-95 flex items-center gap-4 uppercase text-lg tracking-tighter shadow-xl">
                        <ArrowLeft size={24} /> Back
                    </button>
                </div>
            </div>
        )}

        {step === 4 && (
            <div className={`w-full min-h-full flex flex-col items-center p-4 ${isPortraitMode ? 'justify-between py-16 px-8' : 'justify-center max-w-5xl'}`}>
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                        <div className="relative p-6 bg-white rounded-[60px] shadow-2xl mb-12 border-4 border-u-orange/20 animate-pulse">
                            <div className={`relative overflow-hidden rounded-[40px] ${isPortraitMode ? 'w-72 h-[450px]' : 'w-80 h-96'}`}>
                                <img src={humanImage} alt="Scanning" className="w-full h-full object-cover opacity-40 grayscale" />
                                <div className="absolute left-0 right-0 h-2 bg-u-orange shadow-[0_0_40px_#ff7b00] z-10 animate-scan"></div>
                            </div>
                        </div>
                        <div className="text-center space-y-8">
                            <div className="inline-flex items-center gap-6 px-12 py-6 bg-tech-black text-white rounded-pill font-black uppercase tracking-[0.2em] text-sm shadow-2xl">
                                <RefreshCw size={28} className="animate-spin text-u-orange" /> {LOADING_STEPS[loadingStep]}
                            </div>
                            <p className="text-[10px] font-black text-tech-black/40 uppercase tracking-[0.5em]">CARA U Ultra5G Network Active</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-white p-16 rounded-[60px] border-8 border-soft-white shadow-2xl text-center max-w-2xl animate-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                            <Zap size={48} />
                        </div>
                        <h3 className="text-5xl font-black text-tech-black uppercase italic mb-6">ENGINE_ERROR</h3>
                        <p className="font-bold text-slate-400 mb-12 text-2xl leading-relaxed italic">{error}</p>
                        <button onClick={() => setStep(3)} className="w-full py-8 bg-tech-black text-white rounded-pill font-black text-2xl hover:bg-u-orange transition-all active:scale-95 uppercase tracking-tighter">RE-INITIALIZE STUDIO</button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                        <div className={`relative w-full flex ${isPortraitMode ? 'flex-col items-center' : 'justify-center gap-12'}`}>
                            {/* Result Display */}
                            <div className="relative group max-w-3xl">
                                <div className="absolute -inset-10 bg-u-orange/10 rounded-[100px] blur-3xl opacity-50 pointer-events-none"></div>
                                <div className="relative p-6 bg-white rounded-[60px] shadow-[0_60px_120px_rgba(52,55,65,0.2)] border-2 border-tech-black/5">
                                    <div className="absolute -top-4 -left-4 bg-tech-black text-white px-6 py-2 rounded-pill text-xs font-black uppercase tracking-widest shadow-xl">
                                        ULTRA5G_RENDER
                                    </div>
                                    {resultImage ? (
                                        <img src={resultImage} alt="Result" className="w-full h-full object-contain rounded-[40px]" />
                                    ) : (
                                        <div className="w-full aspect-[3/4] flex items-center justify-center bg-soft-white text-tech-black/10 rounded-[40px]">
                                            <ImageIcon size={64} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Technical Sync Card */}
                            <div className={`flex flex-col items-center justify-center bg-white p-12 rounded-[60px] shadow-2xl border-4 border-soft-white animate-in slide-in-from-right-8 duration-1000 delay-300 ${isPortraitMode ? 'mt-12 w-full max-w-md' : 'w-96'}`}>
                                <div className="text-center mb-8">
                                    <h4 className="text-3xl font-black text-tech-black tracking-tighter uppercase italic leading-none mb-2">SYNC DESIGN</h4>
                                    <p className="text-[10px] font-black text-u-orange uppercase tracking-[0.2em]">Ready for Mobile Sync</p>
                                </div>
                                
                                <div className="bg-soft-white/50 p-8 rounded-[48px] mb-10 relative flex items-center justify-center min-h-[220px] w-full border-2 border-tech-black/5 group">
                                    {shareUrl ? (
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`} 
                                            alt="QR Code" 
                                            className="w-44 h-44 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-tech-black/20">
                                            <RefreshCw size={40} className="animate-spin text-u-orange" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-center px-4">Processing Cloud Node...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 px-8 py-4 bg-deep-blue text-white rounded-pill w-full justify-center shadow-lg border border-white/10">
                                    <Wifi size={18} className="animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Instant Sync Active</span>
                                </div>
                            </div>
                        </div>

                        <div className={`flex gap-6 w-full mt-20 pb-12 ${isPortraitMode ? 'max-w-2xl flex-col px-10' : 'md:flex-row max-sm'}`}>
                            <button 
                                onClick={() => { setStep(1); setResultImage(null); setSelectedShirt('/assets/shirts/base-canvas-black-shirt.png'); setSavedDesign(null); }}
                                className="flex-grow py-10 bg-u-orange text-white rounded-pill font-black text-3xl hover:bg-tech-black shadow-[0_30px_80px_rgba(215,63,9,0.3)] transition-all active:scale-95 uppercase tracking-tighter italic"
                            >
                                NEW SESSION
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </main>

      {/* Mini Footer */}
      <div className="bg-tech-black py-3 flex justify-center items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
              Powered by EventzFlow 2026
          </p>
      </div>
    </div>
  );
}

export default WizardPage;