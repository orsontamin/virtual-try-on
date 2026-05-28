import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scissors, RefreshCw, Download, Zap, ClipboardList, Box, Cloud, Sparkles, BarChart3, Settings, X, Save, RotateCcw, RotateCcw as ResetIcon, FileUp, FileDown, Wifi } from 'lucide-react';
import HumanInput from '../components/HumanInput';
import { analyzeAndConsult, getStoredBarberPrompt, setStoredBarberPrompt } from '../services/barber-api';
import { saveToHistory } from '../services/history';
import { saveImageToDrive } from '../services/google-drive';
import { getAccessToken as refreshGoogleToken } from '../services/auth';
import { applyFrame } from '../utils/image-utils';

const LOADING_MESSAGES = [
    'Analyzing facial geometry...',
    'Consulting style database...',
    'Synthesizing hair strands...',
    'Applying professional lighting...',
    'Finalizing style collage...'
];

const BarberKioskPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Capture, 2: Loading/Result
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [result, setResult] = useState(null); // { image, text }
  const [originalImage, setOriginalImage] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [processDuration, setProcessDuration] = useState(null);
  
  const [isPortraitMode, setIsPortraitMode] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => setIsPortraitMode(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prompt Editor State
  const [showSettings, setShowSettings] = useState(false);
  const [tempPrompt, setTempPrompt] = useState(getStoredBarberPrompt());

  const handleSavePrompt = () => {
      setStoredBarberPrompt(tempPrompt);
      setShowSettings(false);
  };

  const handleResetPrompt = () => {
      localStorage.removeItem('barber_master_prompt');
      setTempPrompt(getStoredBarberPrompt());
  };

  const handleExportJSON = () => {
      const data = { master_prompt: tempPrompt, version: "1.0", updated_at: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barber-config-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target.result);
              if (json.master_prompt) {
                  setTempPrompt(json.master_prompt);
                  alert("Configuration imported successfully!");
              }
          } catch (err) {
              alert("Invalid JSON file.");
          }
      };
      reader.readAsText(file);
  };

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    try {
        const token = await refreshGoogleToken(true);
        if (token) {
            setError(null);
            setStep(1);
        }
    } catch (err) {
        setError("Authorization failed. Please allow popups for Google Login.");
    } finally {
        setIsAuthorizing(false);
    }
  };

  const handleCapture = async (img) => {
      // Phase 1: Capture -> Review
      if (img && !showReview) {
          setOriginalImage(img);
          setShowReview(true);
          return;
      }

      // Phase 2: Confirmed -> Process
      const startTime = performance.now();
      setStep(2); // Go directly to loading/result
      setLoading(true);
      setError(null);
      setProcessDuration(null);
      setShareUrl(null);
      
      const interval = setInterval(() => {
          setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);

      try {
          const data = await analyzeAndConsult(originalImage);
          if (data && data.image) {
              const endTime = performance.now();
              const duration = ((endTime - startTime) / 1000).toFixed(2);
              setProcessDuration(duration);
              
              setResult(data);
              
              // Apply Frame to the result (scale down content to avoid logo overlap)
              const framedImage = await applyFrame(data.image, '/assets/screen/screen-03.png', { 
                  contentScale: 0.90,
                  backgroundPath: '/assets/screen/orange-background.png',
                  offsetY: -150,
                  showGrid: false,
                  gridColor: '#F47321'
              });
              data.image = framedImage; // Update data.image with framed version
              
              saveToHistory(data.image);
              
              saveImageToDrive(data.image, `barber-collage-${Date.now()}.png`).then(driveData => {
                  if (driveData?.webViewLink) {
                      setShareUrl(driveData.webViewLink);
                  }
              }).catch(() => {});
          }
      } catch (err) {
          const errMsg = err.response?.data?.error?.message || err.message;
          setError(errMsg || 'The AI is busy. Please wait a moment.');
      } finally {
          clearInterval(interval);
          setLoading(false);
          setShowReview(false); // Reset review state for next time
      }
  };

  return (
    <div className='flex flex-col font-sans selection:bg-u-orange/20 h-full'>
      <main className='flex-grow flex flex-col items-center justify-center p-4 md:p-8'>
        
        {step === 1 && (
            <div className={`w-full h-full flex flex-col items-center justify-center py-4 px-6 ${isPortraitMode ? 'scale-[0.9] transform-gpu origin-center' : ''}`}>
                <div className='text-center mb-8 space-y-2'>
                    <h2 className="font-black tracking-tighter leading-tight text-tech-black italic uppercase text-5xl md:text-6xl">
                        {showReview ? 'REVIEW YOUR LOOK.' : 'TAKE YOUR SEAT.'}
                    </h2>
                    <p className='text-tech-black/40 font-black uppercase tracking-[0.5em] text-[10px]'>
                        {showReview ? 'Confirm your capture' : 'Premium Hairstyle Transformation'}
                    </p>
                </div>
                
                <div className="relative p-2 bg-white rounded-[48px] shadow-2xl border-4 border-u-orange/10 w-full max-w-lg mb-8">
                    {showReview ? (
                        <div className="w-full flex flex-col gap-8 p-4">
                            <div className="relative rounded-[32px] overflow-hidden border-2 border-tech-black/5 aspect-[3/4]">
                                <img src={originalImage} alt="Capture Review" className="w-full h-full object-cover" />
                                <div className="absolute top-4 left-4 bg-tech-black text-white text-[10px] font-black uppercase px-3 py-1.5 tracking-widest rounded-pill shadow-lg">
                                    CAPTURE
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        setOriginalImage(null);
                                        setShowReview(false);
                                    }}
                                    className="flex-1 py-6 bg-tech-black text-white rounded-pill font-black uppercase tracking-tighter hover:bg-u-orange transition-all active:scale-95 flex items-center justify-center gap-3 text-sm shadow-md"
                                >
                                    <RotateCcw size={24} /> RETAKE
                                </button>
                                <button 
                                    onClick={() => handleCapture()}
                                    className="flex-[2] py-6 bg-u-orange text-white rounded-pill font-black uppercase tracking-tighter shadow-[0_20px_40px_rgba(215,63,9,0.25)] hover:bg-tech-black transition-all active:scale-95 flex items-center justify-center gap-4 text-lg italic"
                                >
                                    CONFIRM <Zap size={24} fill="white" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <HumanInput 
                            onImageSelect={handleCapture} 
                            compact={true}
                            instruction="Ensure your face is clearly visible in the center of the frame"
                            zoom={0.8}
                            maxDim={768}
                            actionLabel="STYLE NOW"
                        />
                    )}
                </div>
            </div>
        )}

        {step === 2 && (
            <div className={`w-full max-w-7xl flex flex-col items-center gap-6 animate-in fade-in duration-1000 ${isPortraitMode ? 'scale-[0.9] transform-gpu origin-center' : ''}`}>
                {loading ? (
                    <div className='flex flex-col items-center justify-center py-20 text-center space-y-12 animate-in fade-in duration-500'>
                        <div className="relative">
                            <div className="absolute -inset-8 bg-u-orange/20 rounded-full blur-2xl animate-pulse"></div>
                            <div className='relative w-32 h-32 flex items-center justify-center'>
                                <div className='absolute inset-0 border-t-4 border-u-orange rounded-full animate-spin'></div>
                                <RefreshCw size={40} className='text-tech-black animate-spin' />
                            </div>
                        </div>
                        <div className='space-y-4'>
                            <h3 className='text-2xl md:text-4xl font-black tracking-tighter uppercase italic text-tech-black'>{LOADING_MESSAGES[loadingMsgIdx]}</h3>
                        </div>
                    </div>
                ) : error ? (
                    <div className='bg-white p-8 md:p-16 rounded-[40px] md:rounded-[60px] border-4 border-u-orange/20 text-center max-w-2xl shadow-2xl animate-in zoom-in duration-300'>
                        <h3 className='text-2xl md:text-4xl font-black text-tech-black mb-4 uppercase tracking-tighter italic'>Studio Offline</h3>
                        <p className='text-tech-black/40 font-bold mb-8 md:mb-12 text-sm md:text-lg italic uppercase tracking-widest'>{error}</p>
                        <button 
                            onClick={() => setStep(1)} 
                            className='w-full py-6 md:py-8 bg-u-orange text-white font-black rounded-pill text-xl md:text-2xl shadow-xl hover:bg-tech-black transition active:scale-95 uppercase tracking-tighter italic'
                        >
                            RE-INITIALIZE SESSION
                        </button>
                    </div>
                ) : (
                    <div className='w-full flex flex-col items-center gap-10 px-4 md:px-0'>
                        {/* Title Section */}
                        <div className="space-y-1 w-full text-center">
                            <h2 className="text-2xl md:text-4xl font-black text-tech-black tracking-tighter uppercase italic leading-none">THE TRANSFORMATION.</h2>
                            <p className="text-[10px] text-tech-black/40 font-black uppercase tracking-[0.4em]">AI Style Variations</p>
                        </div>

                        {/* Result Display */}
                        <div className='relative group rounded-[32px] md:rounded-[60px] overflow-hidden shadow-[0_40px_100px_rgba(52,55,65,0.15)] border-8 md:border-[16px] border-white bg-white w-full max-w-3xl'>
                            <div className="absolute -inset-12 bg-u-orange/5 blur-[100px] opacity-50 pointer-events-none animate-pulse"></div>
                            <img src={result?.image} alt='Result' className='w-full h-auto object-contain relative z-10' />
                        </div>

                        {/* Actions Section: QR + Next Button (Now directly below) */}
                        <div className="w-full max-w-3xl flex flex-col gap-6">
                            {/* Horizontal QR Banner */}
                            <div className="bg-white rounded-[32px] md:rounded-[48px] border-2 border-tech-black/5 shadow-xl flex items-center justify-center p-6 w-full">
                                <div className="flex items-center gap-6">
                                    <div className="bg-soft-white rounded-[24px] border-2 border-tech-black/5 flex items-center justify-center relative group w-28 h-28 md:w-36 md:h-36">
                                        {shareUrl ? (
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}`} 
                                                alt="QR" 
                                                className="w-20 h-20 md:w-28 md:h-28 mix-blend-multiply animate-in fade-in duration-500"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-tech-black/20">
                                                <RefreshCw size={24} className="animate-spin text-tech-black" />
                                                <span className="text-[8px] font-black uppercase tracking-widest italic">Syncing...</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl md:text-2xl font-black text-tech-black uppercase tracking-tighter italic leading-tight">SCAN TO DOWNLOAD</h3>
                                        <p className="text-[10px] font-bold text-tech-black/30 uppercase tracking-[0.2em]">YOUR NEW LOOK</p>
                                    </div>
                                </div>
                            </div>

                            {/* Next User Button */}
                            <button 
                                onClick={() => {
                                    setStep(1);
                                    setResult(null);
                                    setOriginalImage(null);
                                }}
                                className="bg-u-orange text-white rounded-[32px] md:rounded-[48px] font-black hover:bg-tech-black transition-all active:scale-95 shadow-lg uppercase tracking-tighter italic flex flex-col items-center justify-center gap-1 group relative overflow-hidden w-full py-8 md:py-10 text-3xl"
                            >
                                <span className="text-[10px] font-black tracking-[0.5em] text-white/60 group-hover:text-white transition-colors uppercase">READY?</span>
                                START NEW
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
};

export default BarberKioskPage;