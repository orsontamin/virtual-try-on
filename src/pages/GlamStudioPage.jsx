import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, RefreshCw, Download, Zap, ClipboardList, Box, Cloud, Camera, Image as ImageIcon } from 'lucide-react';
import HumanInput from '../components/HumanInput';
import { analyzeAndConsultGlam } from '../services/glam-api';
import { saveToHistory } from '../services/history';
import { saveImageToDrive } from '../services/google-drive';
import { getAccessToken as refreshGoogleToken } from '../services/auth';

const LOADING_MESSAGES = [
    'Analyzing facial features...',
    'Mapping skin tones...',
    'Consulting makeup database...',
    'Synthesizing digital pigments...',
    'Applying professional lighting...',
    'Finalizing your look...'
];

const GlamStudioPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Capture, 2: Loading/Result
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [result, setResult] = useState(null); // { image, text }
  const [originalImage, setOriginalImage] = useState(null);
  const [driveUrl, setDriveUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [processDuration, setProcessDuration] = useState(null);

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
      setDriveUrl(null);
      
      const interval = setInterval(() => {
          setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);

      try {
          const data = await analyzeAndConsultGlam(img);
          if (data && data.image) {
              // Background Decoding (ImageBitmap Strategy)
              const response = await fetch(data.image);
              const blob = await response.blob();
              const bitmap = await createImageBitmap(blob);
              
              const endTime = performance.now();
              const duration = ((endTime - startTime) / 1000).toFixed(2);
              setProcessDuration(duration);

              setResult(data);
              saveToHistory(data.image);
              
              saveImageToDrive(data.image, `glam-collage-${Date.now()}.png`).then(driveData => {
                  if (driveData?.webViewLink) setDriveUrl(driveData.webViewLink);
              }).catch(() => {});
          }
      } catch (err) {
          const errMsg = err.response?.data?.error?.message || err.message;
          setError(errMsg || 'The Studio is busy. Please wait a moment.');
      } finally {
          clearInterval(interval);
          setLoading(false);
      }
  };

  return (
    <div className='min-h-screen bg-[#0a0a0a] text-stone-200 flex flex-col font-sans selection:bg-pink-500/30'>
      {/* Glam Header */}
      <header className='p-6 flex justify-between items-center max-w-7xl mx-auto w-full border-b border-white/5'>
        <div className='flex items-center gap-4'>
            <button 
                onClick={() => navigate('/')}
                className='p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white'
            >
                <ArrowLeft size={24} />
            </button>
            <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gradient-to-tr from-pink-500 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-xl shadow-pink-900/20'>
                    <Sparkles size={24} />
                </div>
                <div>
                    <h1 className='text-xl font-black tracking-tight uppercase leading-none'>AI.<span className='text-pink-500'>MAKEUP</span></h1>
                    <p className='text-[8px] text-pink-500 font-bold tracking-widest uppercase'>Master MUA Hybrid Engine</p>
                </div>
            </div>
        </div>
        <button 
            onClick={handleAuthorize}
            className='flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-pink-500 transition-all active:scale-95'
        >
            <RefreshCw size={12} className={isAuthorizing ? "animate-spin" : ""} />
            {isAuthorizing ? "Authorizing..." : "Refresh Session"}
        </button>
      </header>

      <main className='flex-grow flex flex-col items-center justify-center p-4 md:p-8'>
        
        {step === 1 && (
            <div className='w-full max-w-4xl animate-in fade-in duration-1000 flex flex-col items-center'>
                <div className='text-center mb-12 space-y-3'>
                    <h2 className='text-5xl md:text-7xl font-black tracking-tighter leading-tight text-white italic underline decoration-pink-500 decoration-8 underline-offset-8'>
                        UNVEIL YOUR GLOW.
                    </h2>
                    <p className='text-stone-500 font-bold uppercase tracking-widest text-sm pt-4'>AI Master MUA 4-Style Transformation</p>
                </div>
                
                <div className='w-full relative shadow-[0_0_50px_rgba(236,72,153,0.2)]'>
                    <HumanInput onImageSelect={handleCapture} />
                </div>
            </div>
        )}

        {step === 2 && (
            <div className='w-full max-w-6xl flex flex-col items-center'>
                {loading ? (
                    <div className='flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in fade-in duration-500'>
                        <div className='relative w-32 h-32 flex items-center justify-center'>
                            <div className='absolute inset-0 border-t-4 border-pink-500 rounded-full animate-spin'></div>
                            <RefreshCw size={40} className='text-pink-500 animate-spin' />
                        </div>
                        <div className='space-y-2'>
                            <h3 className='text-3xl font-black tracking-tight uppercase italic'>{LOADING_MESSAGES[loadingMsgIdx]}</h3>
                            <p className='text-stone-600 font-medium uppercase tracking-[0.3em] text-[10px]'>Digital Artistry in Progress</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className='bg-red-900/20 p-12 rounded-xl border border-red-900/30 text-center max-w-md'>
                        <h3 className='text-2xl font-black text-red-500 mb-2'>Studio Error</h3>
                        <p className='text-red-500/60 font-medium mb-8 italic'>{error}</p>
                        
                        {(error.toString().includes('401') || 
                          error.toString().includes('403') || 
                          error.toString().toLowerCase().includes('unauthenticated')) ? (
                            <button 
                                onClick={handleAuthorize} 
                                disabled={isAuthorizing}
                                className='w-full py-4 bg-pink-600 text-white font-bold rounded shadow-lg hover:bg-pink-700 transition flex items-center justify-center gap-2'
                            >
                                {isAuthorizing ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                                REFRESH SESSION
                            </button>
                        ) : (
                            <button onClick={() => setStep(1)} className='w-full py-4 bg-red-600 text-white font-bold rounded shadow-lg hover:bg-red-700 transition'>Retry Session</button>
                        )}
                    </div>
                ) : (
                    <div className='w-full flex flex-col items-center gap-12 animate-in fade-in duration-1000'>
                        
                        <div className='relative w-full flex flex-col xl:flex-row gap-8 items-start'>
                            {/* Comparison View */}
                            <div className='flex-1 flex flex-col md:flex-row gap-6 w-full'>
                                {/* Original Image */}
                                <div className='flex-1 space-y-4'>
                                    <div className='relative rounded-2xl overflow-hidden shadow-xl border-2 border-stone-800 bg-black aspect-[3/4]'>
                                        <img src={originalImage} alt='Original' className='w-full h-full object-cover' />
                                        <div className='absolute top-4 left-4 bg-stone-800 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded shadow-lg'>
                                            Reference
                                        </div>
                                    </div>
                                    <p className='text-center text-[10px] font-bold text-stone-600 uppercase tracking-widest'>Your Natural Look</p>
                                </div>

                                {/* Collage Result */}
                                <div className='flex-[2] space-y-4'>
                                    <div className='relative rounded-2xl overflow-hidden shadow-2xl border-4 border-pink-500/20 bg-black'>
                                        <img src={result?.image} alt='Glam Transformation' className='w-full h-auto' />
                                                                            <div className='absolute top-4 left-4 bg-pink-500 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded shadow-lg flex items-center gap-2'>
                                                                                <Zap size={10} /> Result
                                                                            </div>                                    </div>
                                    <p className='text-center text-[10px] font-black text-pink-500 uppercase tracking-widest'>Your AI Transformation</p>
                                </div>
                            </div>

                            {/* QR & Note Info */}
                            <div className='xl:w-[320px] w-full flex flex-col gap-6'>
                                <div className='bg-[#151515] p-8 rounded-2xl border border-stone-800 shadow-2xl flex flex-col items-center justify-center min-h-[300px]'>
                                    <h3 className='text-xl font-black text-pink-500 mb-4 flex items-center gap-2 italic uppercase text-center justify-center'>
                                        <Download size={20} /> Save Vibe
                                    </h3>
                                    
                                    <div className="bg-white p-4 rounded-xl mb-6 flex justify-center w-[200px] h-[200px] items-center relative group">
                                        {driveUrl ? (
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(driveUrl)}`} 
                                                alt="Download QR" 
                                                className="w-40 h-40 mix-blend-multiply animate-in fade-in duration-500"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-stone-400">
                                                <RefreshCw size={32} className="animate-spin text-pink-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Generating QR...</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className='p-4 bg-stone-900 border border-pink-500/20 rounded-lg'>
                                        <p className='text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-normal mb-0 text-center'>
                                            Scan to save your new vibe instantly
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Prominent Next User CTA */}
                        <div className='w-full max-w-4xl mt-12 mb-8 animate-in slide-in-from-bottom-8 duration-1000 delay-500'>
                            <button 
                                onClick={() => {
                                    setStep(1);
                                    setResult(null);
                                    setOriginalImage(null);
                                }}
                                className='w-full py-10 bg-gradient-to-r from-pink-600 to-violet-600 text-white rounded-[40px] font-black text-4xl md:text-5xl hover:brightness-110 transition-all active:scale-95 shadow-[0_0_80px_rgba(236,72,153,0.4)] uppercase tracking-tighter animate-pulse flex flex-col items-center justify-center gap-2 group'
                            >
                                <span className='text-xs font-bold tracking-[0.5em] text-white/60 group-hover:text-white transition-colors'>READY FOR THE NEXT GLAM?</span>
                                TAP TO START NEW SESSION
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

      </main>

      <footer className='p-8 mt-auto flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto w-full border-t border-white/5 bg-[#0a0a0a]'>
        <div className='text-stone-700 font-black text-[10px] uppercase tracking-[0.2em]'>
            Glam Logic &copy; EventzFlow Studio 2026
        </div>
      </footer>
    </div>
  );
};

export default GlamStudioPage;