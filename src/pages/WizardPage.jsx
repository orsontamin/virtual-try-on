import React, { useState, useEffect } from 'react';
import DesignCanvas from '../components/DesignCanvas';
import Toolbar from '../components/Toolbar';
import WardrobeSelector from '../components/WardrobeSelector';
import HumanInput from '../components/HumanInput';
import { ArrowRight, ArrowLeft, RefreshCw, BarChart3, Image as ImageIcon, Sparkles, Scissors, Zap, Download, Wifi } from 'lucide-react';
import { tryOn, analyzePersonAttire } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { saveToHistory } from '../services/history';
import { saveImageToDrive } from '../services/google-drive';
import { getAccessToken as refreshGoogleToken } from '../services/auth';
import { applyFrame } from '../utils/image-utils';
import { generateDesignImage } from '../utils/fabric-utils';

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
          // Analyze person for specific requirements (Hijab, Sleeveless)
          let finalDesignImage = designImage;
          const attire = await analyzePersonAttire(finalHumanImage);
          
          if (savedDesign) {
              if (attire.is_muslimah) {
                  console.log("🧕 Muslimah detected. Switching to long-sleeve canvas...");
                  const LONG_SLEEVE_CANVAS = '/assets/shirts/long-sleeve-canvas.png';
                  finalDesignImage = await generateDesignImage(savedDesign, LONG_SLEEVE_CANVAS);
              } else if (attire.is_sleeveless) {
                  console.log("👕 Sleeveless detected. Ensuring output has sleeves...");
                  // If they are sleeveless, we use the standard shirt but regenerate it 
                  // to be sure the model treats it as a full garment swap.
                  const STANDARD_CANVAS = '/assets/shirts/base-canvas-black-shirt.png';
                  finalDesignImage = await generateDesignImage(savedDesign, STANDARD_CANVAS);
              }
          }

          const result = await tryOn(finalHumanImage, finalDesignImage);
          if (result) {
            // Apply Frame to the result
            const framedImage = await applyFrame(result, '/assets/screen/screen-wardrobe-frame.png');
            setResultImage(framedImage);
            saveToHistory(framedImage);
            saveImageToDrive(framedImage, `vto-design-${Date.now()}.png`).then(driveData => {
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
    <div className={`flex flex-col font-sans selection:bg-u-orange/20 h-full`}>
      <main className={`flex-grow flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden`}>
        
        {step === 1 && (
            <div className={`w-full max-w-lg animate-in fade-in duration-700 flex flex-col items-center justify-center gap-8 py-4`}>
                {/* Instruction Panel */}
                <div className="w-full relative group">
                    <div className="absolute -inset-4 bg-u-orange/5 rounded-[80px] blur-3xl opacity-50"></div>
                    <div className="relative w-full bg-white p-8 md:p-12 rounded-[60px] shadow-[0_40px_100px_rgba(52,55,65,0.1)] border-2 border-tech-black/5 flex flex-col items-center text-center">
                        <div className="mb-8">
                            <h3 className="text-4xl font-black text-tech-black uppercase tracking-tighter italic leading-none mb-3">
                                WELCOME TO <span className="text-u-orange text-5xl block mt-2">AI WARDROBE.</span>
                            </h3>
                        </div>

                        <div className="w-full flex flex-col items-start mb-8">
                            <div className="w-full h-px bg-tech-black/5 mb-6"></div>
                            <div className="text-[10px] font-black text-u-orange tracking-[0.3em] uppercase px-3 py-1 bg-u-orange/5 rounded-pill border border-u-orange/10">
                                HOW TO USE
                            </div>
                        </div>

                        <div className="space-y-8 w-full text-left mb-4">
                            {[ 
                                { id: '01', title: 'INITIALIZE DRIP', desc: 'Tap "Start Designing" below' },
                                { id: '02', title: 'STICKER FLEX', desc: 'Pick your vibe & place it' },
                                { id: '03', title: 'FIT CHECK', desc: 'Strike a full body pose' },
                                { id: '04', title: 'THE GLOW UP', desc: 'Wait for the AI to cook' }
                            ].map((item) => (
                                <div key={item.id} className="flex items-start gap-6 group/item">
                                    <span className="text-u-orange font-black italic text-4xl tracking-tighter opacity-20 group-hover/item:opacity-100 transition-opacity leading-none">{item.id}</span>
                                    <div>
                                        <h4 className="text-2xl font-black text-tech-black uppercase tracking-tighter leading-none mb-2">{item.title}</h4>
                                        <p className="text-tech-black/40 text-sm font-bold uppercase tracking-widest">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleNextToDesign}
                    className="w-full py-8 bg-tech-black text-white rounded-pill shadow-[0_30px_80px_rgba(52,55,65,0.3)] hover:bg-u-orange hover:shadow-2xl transition-all duration-500 font-black text-3xl uppercase tracking-tighter flex items-center justify-center gap-6 active:scale-95 group italic"
                >
                    START DESIGNING <ArrowRight size={40} className="group-hover:translate-x-2 transition-transform" />
                </button>
            </div>
        )}

        {step === 2 && (
            <div className={`w-full max-w-4xl animate-in fade-in zoom-in-95 duration-700 flex flex-col lg:flex-row items-center justify-center gap-10 py-2 px-6`}>
                <div className="flex-1 flex flex-col items-center justify-center w-full relative text-center">
                    <div className={`relative p-2 bg-white rounded-[24px] shadow-[0_20px_60px_rgba(52,55,65,0.1)] border-2 border-tech-black/5 transform scale-[0.7] origin-center`}>
                        <DesignCanvas onCanvasReady={handleCanvasReady} initialDesign={savedDesign} />
                    </div>
                </div>

                <div className={`w-full flex flex-col gap-4 lg:w-[280px]`}>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-black text-tech-black tracking-tighter leading-none italic uppercase text-left">
                            ADD SOME FLAVOUR.
                        </h2>
                    </div>

                    <div className="bg-white p-3 rounded-[24px] shadow-sm border border-tech-black/5">
                        <Toolbar canvas={canvas} compact={true} />
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setSavedDesign(null); setStep(1); }} 
                            className="p-3 bg-tech-black text-white rounded-pill hover:bg-u-orange transition-all active:scale-95 shadow-md border-2 border-white/10"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <button 
                            onClick={handleNextToHuman}
                            className="flex-grow py-3 bg-tech-black text-white rounded-pill shadow-[0_10px_30px_rgba(52,55,65,0.3)] hover:bg-u-orange transition-all font-black text-xs uppercase tracking-tighter flex items-center justify-center gap-2 active:scale-95"
                        >
                            FINALIZE VIBE <Zap size={16} fill="white" />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {step === 3 && (
            <div className={`w-full flex flex-col items-center justify-center py-4`}>
                <div className="space-y-1 mb-6 text-center">
                    <h2 className="text-5xl font-black text-tech-black tracking-tighter italic uppercase leading-tight">
                        FINALLY, STRIKE A POSE.
                    </h2>
                </div>
                
                <div className={`w-full relative flex items-center justify-center p-2`}>
                    <div className="relative p-2 bg-white rounded-[48px] shadow-2xl border-4 border-u-orange/10 w-full max-w-xl">
                        <HumanInput 
                            onImageSelect={(img) => { setHumanImage(img); handleGenerate(img); }} 
                            designPreview={designImage}
                            compact={true}
                        />
                    </div>
                </div>

                <div className="pt-6">
                    <button onClick={() => setStep(2)} className="px-10 py-4 bg-tech-black text-white rounded-pill font-black hover:bg-tech-black transition-all active:scale-95 flex items-center gap-3 uppercase text-base tracking-tighter shadow-xl">
                        <ArrowLeft size={20} /> Back
                    </button>
                </div>
            </div>  
        )}

        {step === 4 && (
            <div className={`w-full min-h-full flex flex-col items-center p-4 ${isPortraitMode ? 'justify-between px-8' : 'justify-center max-w-5xl'}`}>
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
                        <div className={`relative w-full flex ${isPortraitMode ? 'flex-col items-center -mt-8' : 'justify-center gap-12'}`}>
                            {/* Result Display */}
                            <div className="relative group max-w-3xl">
                                <div className="absolute -inset-10 bg-u-orange/10 rounded-[100px] blur-3xl opacity-50 pointer-events-none"></div>
                                <div className="relative p-6 bg-white rounded-[60px] shadow-[0_60px_120px_rgba(52,55,65,0.2)] border-2 border-tech-black/5">
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
                            <div className={`flex flex-col items-center justify-center bg-white p-5 rounded-[32px] shadow-2xl border-4 border-soft-white animate-in slide-in-from-right-8 duration-1000 delay-300 w-64 ${isPortraitMode ? 'mt-4' : 'mt-10'}`}>
                                <div className="text-center">
                                    <h4 className="text-lg font-black text-tech-black tracking-tighter uppercase italic leading-none mb-1">SCAN TO DOWNLOAD</h4>
                                </div>
                                
                                <div className="bg-soft-white/50 p-4 rounded-[24px] mb-6 relative flex items-center justify-center min-h-[140px] w-full border-2 border-tech-black/5 group">
                                    {shareUrl ? (
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`} 
                                            alt="QR Code" 
                                            className="w-28 h-28 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-tech-black/20">
                                            <RefreshCw size={24} className="animate-spin text-u-orange" />
                                            <span className="text-[7px] font-black uppercase tracking-[0.2em] italic text-center px-4">Processing...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={`relative flex gap-6 w-full m-6 pb-12 ${isPortraitMode ? 'max-w-2xl flex-col px-10' : 'md:flex-row max-sm'}`}>
                            <button 
                                onClick={() => { setStep(1); setResultImage(null); setSelectedShirt('/assets/shirts/base-canvas-black-shirt.png'); setSavedDesign(null); }}
                                className="flex-grow p-2 bg-black text-white rounded-pill font-black text-xl hover:bg-tech-black shadow-[0_30px_80px_rgba(215,63,9,0.3)] transition-all active:scale-95 uppercase tracking-tighter italic"
                            >
                                NEW SESSION
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
}

export default WizardPage;