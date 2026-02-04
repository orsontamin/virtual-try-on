import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scissors, RefreshCw, Download, Zap, ClipboardList, Box, Cloud, Sparkles, BarChart3, Settings, X, Save, RotateCcw as ResetIcon, FileUp, FileDown, Wifi } from 'lucide-react';
import HumanInput from '../components/HumanInput';
import { analyzeAndConsult, getStoredBarberPrompt, setStoredBarberPrompt } from '../services/barber-api';
import { saveToHistory } from '../services/history';
import { saveImageToDrive } from '../services/google-drive';
import { getAccessToken as refreshGoogleToken } from '../services/auth';

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
      const startTime = performance.now();
      setStep(2);
      setLoading(true);
      setError(null);
      setOriginalImage(img);
      setProcessDuration(null);
      setShareUrl(null);
      
      const interval = setInterval(() => {
          setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);

      try {
          const data = await analyzeAndConsult(img);
          if (data && data.image) {
              const response = await fetch(data.image);
              const blob = await response.blob();
              const bitmap = await createImageBitmap(blob);
              
              const endTime = performance.now();
              const duration = ((endTime - startTime) / 1000).toFixed(2);
              setProcessDuration(duration);
              
              setResult(data);
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
      }
  };

  return (
    <div className='min-h-screen branded-bg flex flex-col font-sans selection:bg-u-orange/20'>
      {/* Dynamic Header */}
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
                            AI <span className="text-u-orange">GROOMING</span>
                        </h1>
                        <span className="text-[10px] font-black text-u-orange/80 tracking-[0.2em] uppercase">CARA U Sabah Ultra5G Fest</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowSettings(true)}
                        className='p-3 bg-white/10 border border-white/20 rounded-pill text-white hover:bg-u-orange transition shadow-sm active:scale-95'
                        title="Edit AI Instructions"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-tech-black/60 backdrop-blur-md" onClick={() => setShowSettings(false)}></div>
              <div className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-2 border-tech-black/5">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-soft-white/30">
                      <div>
                          <h3 className="text-2xl font-black text-tech-black uppercase tracking-tighter italic">AI Master Groomer Instructions</h3>
                          <p className="text-xs text-tech-black/40 font-bold uppercase tracking-widest">Customize how the AI analyzes and styles hair</p>
                      </div>
                      <button onClick={() => setShowSettings(false)} className="p-4 hover:bg-soft-white rounded-pill transition">
                          <X size={24} className="text-tech-black/40" />
                      </button>
                  </div>
                  
                  <div className="flex-1 p-8 overflow-y-auto">
                      <textarea 
                          value={tempPrompt}
                          onChange={(e) => setTempPrompt(e.target.value)}
                          className="w-full h-[400px] p-6 rounded-[32px] border-2 border-tech-black/10 focus:border-u-orange focus:ring-4 focus:ring-u-orange/10 transition-all font-mono text-sm leading-relaxed text-tech-black bg-soft-white/20"
                          placeholder="Enter AI instructions here..."
                      />
                  </div>

                  <div className="p-8 border-t border-slate-100 flex flex-wrap gap-4 bg-soft-white/30">
                      <div className="flex gap-2 mr-auto">
                          <button 
                              onClick={handleExportJSON}
                              className="px-6 py-4 bg-white border border-tech-black/10 text-tech-black/60 rounded-pill font-black uppercase text-xs hover:bg-white hover:border-u-orange transition flex items-center gap-2"
                          >
                              <FileDown size={18} /> Export
                          </button>
                          <label className="px-6 py-4 bg-white border border-tech-black/10 text-tech-black/60 rounded-pill font-black uppercase text-xs hover:bg-white hover:border-u-orange transition flex items-center gap-2 cursor-pointer">
                              <FileUp size={18} /> Import
                              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                          </label>
                      </div>
                      
                      <button 
                          onClick={handleResetPrompt}
                          className="px-8 py-4 bg-white border border-tech-black/10 text-tech-black/30 rounded-pill font-black uppercase text-xs hover:bg-soft-white transition flex items-center gap-2"
                      >
                          <ResetIcon size={18} /> Reset Defaults
                      </button>
                      <button 
                          onClick={handleSavePrompt}
                          className="flex-1 py-4 bg-u-orange text-white rounded-pill font-black uppercase tracking-widest hover:bg-tech-black transition shadow-xl flex items-center justify-center gap-3"
                      >
                          <Save size={20} /> Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}

      <main className='flex-grow flex flex-col items-center justify-center p-4 md:p-8'>
        
        {step === 1 && (
            <div className={`w-full min-h-full flex flex-col items-center ${isPortraitMode ? 'justify-between py-12 px-6' : 'max-w-4xl text-center justify-center'}`}>
                <div className='text-center mb-16 space-y-4'>
                    <h2 className={`font-black tracking-tighter leading-tight text-tech-black italic uppercase ${isPortraitMode ? 'text-6xl' : 'text-6xl md:text-8xl'}`}>
                        TAKE YOUR <span className="text-u-orange">SEAT.</span>
                    </h2>
                    <p className='text-tech-black/40 font-black uppercase tracking-[0.5em] text-xs'>Premium Hairstyle Transformation</p>
                </div>
                
                <div className={`w-full relative flex items-center justify-center p-4 ${isPortraitMode ? 'flex-1' : ''}`}>
                    <div className="relative p-2 bg-white rounded-[60px] shadow-2xl border-4 border-u-orange/10 w-full max-w-lg">
                        <HumanInput 
                            onImageSelect={handleCapture} 
                            compact={isPortraitMode}
                            instruction="Ensure your face is clearly visible in the center of the frame"
                            zoom={0.8}
                            maxDim={768}
                        />
                    </div>
                </div>

                <div className="pb-12">
                    <button onClick={() => navigate('/')} className="px-12 py-5 bg-u-orange text-white rounded-pill font-black hover:bg-tech-black transition-all active:scale-95 flex items-center gap-4 uppercase text-lg tracking-tighter shadow-xl">
                        <ArrowLeft size={24} /> Back
                    </button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className='w-full max-w-7xl md:h-[calc(100vh-180px)] flex flex-col items-center gap-6 animate-in fade-in duration-1000 md:overflow-hidden'>
                {loading ? (
                    <div className='flex-1 flex flex-col items-center justify-center py-10 md:py-20 text-center space-y-12 animate-in fade-in duration-500'>
                        <div className="relative">
                            <div className="absolute -inset-8 bg-u-orange/20 rounded-full blur-2xl animate-pulse"></div>
                            <div className='relative w-32 h-32 flex items-center justify-center'>
                                <div className='absolute inset-0 border-t-4 border-u-orange rounded-full animate-spin'></div>
                                <RefreshCw size={40} className='text-u-orange animate-spin' />
                            </div>
                        </div>
                        <div className='space-y-4'>
                            <h3 className='text-2xl md:text-4xl font-black tracking-tighter uppercase italic text-tech-black'>{LOADING_MESSAGES[loadingMsgIdx]}</h3>
                            <div className="inline-flex items-center gap-3 px-6 py-2 bg-u-orange text-white rounded-pill font-black uppercase tracking-widest text-[10px] shadow-lg shadow-u-orange/20">
                                <Zap size={12} fill="currentColor" /> Neural Rendering via Ultra5G
                            </div>
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
                    <>
                        <div className='w-full flex-1 flex flex-col md:flex-row gap-6 md:gap-10 min-h-0 items-start overflow-y-auto md:overflow-hidden px-4 md:px-0'>
                            {/* Left Col: Info & Original (Small) */}
                            <div className='w-full md:w-[200px] flex flex-row md:flex-col gap-4 min-h-0 items-center md:items-start'>
                                <div className="space-y-1">
                                    <h2 className="text-lg md:text-xl font-black text-tech-black tracking-tighter uppercase italic whitespace-nowrap">Original</h2>
                                </div>
                                
                                <div className='w-24 md:w-full relative rounded-[20px] overflow-hidden shadow-[0_20px_50px_rgba(52,55,65,0.1)] border-4 border-white bg-white aspect-[3/4]'>
                                    <img src={originalImage} alt='Original' className='w-full h-full object-cover' />
                                </div>
                            </div>

                            {/* Right Col: Result (Dominant) */}
                            <div className='flex-1 w-full flex flex-col gap-4 min-h-0'>
                                <div className="space-y-1">
                                    <h2 className="text-2xl md:text-4xl font-black text-tech-black tracking-tighter uppercase italic leading-none">THE <span className="text-u-orange">TRANSFORMATION.</span></h2>
                                    <p className="text-[10px] text-tech-black/40 font-black uppercase tracking-[0.4em]">AI Style Variations // Ultra5G Render</p>
                                </div>

                                <div className='flex-1 relative group rounded-[32px] md:rounded-[60px] overflow-hidden shadow-[0_40px_100px_rgba(52,55,65,0.15)] border-8 md:border-[16px] border-white bg-white min-h-[350px] md:min-h-0'>
                                    <div className="absolute -inset-12 bg-u-orange/5 blur-[100px] opacity-50 pointer-events-none animate-pulse"></div>
                                    <img src={result?.image} alt='Result' className='w-full h-full object-contain relative z-10' />
                                    <div className='absolute top-4 left-4 md:top-8 md:left-8 bg-u-orange text-white px-4 py-2 md:px-6 md:py-3 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] rounded-pill shadow-2xl flex items-center gap-2 md:gap-3 z-20'>
                                        <Zap size={12} fill="white" /> Result
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integrated Footer Section: QR + Next Button */}
                        <div className='w-full max-w-5xl flex flex-col gap-4 md:gap-6 mb-4 px-4 md:px-0'>
                            {/* Horizontal QR Banner */}
                            <div className='bg-white p-6 md:p-10 rounded-[40px] md:rounded-[60px] border-2 border-tech-black/5 shadow-2xl flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12'>
                                <div className='flex flex-col md:flex-row items-center gap-6 md:gap-10'>
                                    <div className="bg-soft-white p-4 rounded-[32px] border-2 border-tech-black/5 min-w-[180px] min-h-[180px] md:min-w-[220px] md:min-h-[220px] flex items-center justify-center relative group">
                                        {shareUrl ? (
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}`} 
                                                alt="QR" 
                                                className="w-36 h-36 md:w-48 md:h-48 mix-blend-multiply animate-in fade-in duration-500"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-tech-black/20">
                                                <RefreshCw size={24} md:size={32} className="animate-spin text-u-orange" />
                                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest italic">Syncing...</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2 text-center md:text-left">
                                        <h3 className='text-3xl md:text-5xl font-black text-tech-black uppercase tracking-tighter italic leading-none'>GET YOUR LOOK</h3>
                                        <p className='text-[10px] md:text-sm font-black text-u-orange uppercase tracking-[0.2em]'>Scan to sync with your device instantly</p>
                                        
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-deep-blue text-white rounded-pill text-[10px] font-black uppercase tracking-widest mt-4 shadow-lg">
                                            <Wifi size={12} className="animate-pulse" /> Ultra5G Secure Sync
                                        </div>
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
                                className='w-full py-8 md:py-12 bg-u-orange text-white rounded-pill font-black text-3xl md:text-5xl hover:bg-tech-black transition-all active:scale-95 shadow-[0_30px_80px_rgba(215,63,9,0.3)] uppercase tracking-tighter italic flex flex-col items-center justify-center gap-1 group relative overflow-hidden'
                            >
                                <span className='text-[8px] md:text-[10px] font-black tracking-[0.5em] text-white/60 group-hover:text-white transition-colors uppercase'>READY FOR THE NEXT GLOW UP?</span>
                                START NEW SESSION
                            </button>
                        </div>
                    </>
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
};

export default BarberKioskPage;