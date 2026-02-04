import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, Timer, Zap, Aperture, RotateCcw, Wifi } from 'lucide-react';

const HumanInput = ({ 
  onImageSelect, 
  designPreview, 
  compact = false,
  instruction = "Ensure your entire body from head to waist is visible in the frame",
  zoom = 1.0,
  maxDim = 1024
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [timer, setTimer] = useState(5); 
  const [countdown, setCountdown] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [flash, setFlash] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const countdownInterval = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCountdown(null);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const containerWidth = video.clientWidth;
      const containerHeight = video.clientHeight;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const videoAR = videoWidth / videoHeight;
      const containerAR = containerWidth / containerHeight;
      
      let sX, sY, sW, sH;
      if (containerAR > videoAR) {
          sW = videoWidth;
          sH = videoWidth / containerAR;
          sX = 0;
          sY = (videoHeight - sH) / 2;
      } else {
          sH = videoHeight;
          sW = videoHeight * containerAR;
          sY = 0;
          sX = (videoWidth - sW) / 2;
      }

      const MAX_DIM = maxDim;
      let targetWidth = sW;
      let targetHeight = sH;
      
      // Implement a tighter center crop if zoom is provided
      const zoomedSW = sW * zoom;
      const zoomedSH = sH * zoom;
      const zoomedSX = sX + (sW - zoomedSW) / 2;
      const zoomedSY = sY + (sH - zoomedSH) / 2;

      if (targetWidth > targetHeight) {
          if (targetWidth > MAX_DIM) {
              targetHeight *= MAX_DIM / targetWidth;
              targetWidth = MAX_DIM;
          }
      } else {
          if (targetHeight > MAX_DIM) {
              targetWidth *= MAX_DIM / targetHeight;
              targetHeight = MAX_DIM;
          }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      context.drawImage(video, zoomedSX, zoomedSY, zoomedSW, zoomedSH, 0, 0, targetWidth, targetHeight);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(dataUrl);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const triggerCapture = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
      capturePhoto();
  };

  const startCountdown = () => {
    if (timer === 0) {
        triggerCapture();
        return;
    }
    
    setCountdown(timer);
    countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
            if (prev <= 1) {
                clearInterval(countdownInterval.current);
                triggerCapture();
                return null;
            }
            return prev - 1;
        });
    }, 1000);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (showCamera && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      const playPromise = video.play();
      if (playPromise !== undefined) {
          playPromise.catch(e => {
              if (isMounted) console.error("Error playing video:", e);
          });
      }
    }
    return () => { isMounted = false; };
  }, [showCamera, stream]);

  if (capturedImage) {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-between animate-in fade-in zoom-in duration-500`}>
            <div className={`flex gap-6 w-full justify-center ${compact ? 'mb-6 w-full max-w-[90vw] px-4' : 'max-w-6xl mb-10'}`}>
                {/* User Portrait */}
                <div className="relative flex-1 p-4 bg-white rounded-[40px] shadow-[0_30px_60px_rgba(52,55,65,0.12)] border-2 border-tech-black/5">
                    <div className={`relative w-full h-full overflow-hidden rounded-[24px] aspect-[3/4]`}>
                        <img src={capturedImage} alt="Capture Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4 bg-tech-black text-white text-[10px] font-black uppercase px-3 py-1.5 tracking-widest rounded-pill shadow-lg">
                            YOU
                        </div>
                    </div>
                </div>
                
                {/* Designed Canvas */}
                {designPreview && (
                    <div className="relative flex-1 p-4 bg-white rounded-[40px] shadow-[0_30px_60px_rgba(215,63,9,0.12)] border-2 border-u-orange/10 hidden md:block">
                        <div className="relative w-full h-full overflow-hidden rounded-[24px] aspect-video bg-soft-white/20">
                            <img src={designPreview} alt="Design Preview" className="w-full h-full object-contain p-4" />
                            <div className="absolute top-4 left-4 bg-u-orange text-white text-[10px] font-black uppercase px-3 py-1.5 tracking-widest rounded-pill shadow-lg">
                                YOUR DESIGN
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`flex gap-4 w-full ${compact ? 'max-w-sm pb-6 px-4' : 'max-w-xl'}`}>
                <button 
                    onClick={() => {
                        setCapturedImage(null);
                        startCamera();
                    }}
                    className="flex-1 py-6 bg-u-orange text-white rounded-pill font-black uppercase tracking-tighter hover:bg-tech-black transition-all active:scale-95 flex items-center justify-center gap-3 text-sm shadow-md border-2 border-white/20"
                >
                    <RotateCcw size={24} /> RETAKE
                </button>
                <button 
                    onClick={() => onImageSelect(capturedImage)}
                    className="flex-[2] py-6 bg-u-orange text-white rounded-pill font-black uppercase tracking-tighter shadow-[0_20px_40px_rgba(215,63,9,0.25)] hover:bg-tech-black transition-all active:scale-95 flex items-center justify-center gap-4 text-lg italic"
                >
                    STITCH IT <Zap size={24} fill="white" />
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center ${compact ? 'px-4' : ''}`}>
      {!showCamera ? (
        <div className={`${compact ? 'p-12 rounded-[60px] w-full' : 'p-20 rounded-[80px] max-w-2xl'} text-center bg-tech-black border-4 border-u-orange shadow-[0_50px_100px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in duration-1000`}>
            <div className={`${compact ? 'w-20 h-20 mb-8' : 'w-28 h-28 mb-12'} bg-u-orange rounded-[40px] flex items-center justify-center mx-auto text-white shadow-[0_20px_40px_rgba(215,63,9,0.3)] rotate-3 hover:rotate-0 transition-transform duration-500`}>
                <Camera size={compact ? 40 : 56} />
            </div>
            <p className="text-white text-white uppercase font-bold text-[16px] mb-12 italic">{instruction}</p>
            <button 
                onClick={startCamera}
                className="w-full py-8 bg-u-orange text-white rounded-pill font-black hover:bg-tech-black transition-all duration-500 shadow-2xl active:scale-95 uppercase tracking-tighter text-2xl flex items-center justify-center gap-6 italic group"
            >
                OPEN CAMERA <Zap size={32} className="group-hover:scale-125 transition-transform" fill="currentColor" />
            </button>
        </div>
      ) : (
        <div className={`relative w-full mx-auto ${compact ? 'max-w-[90vw] rounded-[60px] border-[12px]' : 'max-w-2xl rounded-[80px] border-[16px]'} aspect-[3/4] overflow-hidden bg-tech-black shadow-[0_60px_120px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-700 border-white/5 group`}>
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover transition-all duration-1000"
            />

            <div className="absolute inset-0 pointer-events-none border-[4px] border-u-orange/20 m-8 rounded-[48px]"></div>
            {flash && <div className="absolute inset-0 bg-white z-50 animate-flash"></div>}

            {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center z-40 bg-u-orange/5 backdrop-blur-[2px]">
                    <div className={`${compact ? 'text-[12rem]' : 'text-[15rem]'} font-black text-white drop-shadow-[0_0_100px_#ff7b00] italic`}>
                        {countdown}
                    </div>
                </div>
            )}
            
            <div className={`absolute ${compact ? 'bottom-8' : 'bottom-12'} left-0 right-0 flex justify-center items-center gap-12 z-30 px-10`}>
                <button 
                    onClick={startCountdown}
                    disabled={countdown !== null}
                    className="group relative pointer-events-auto p-2 bg-white rounded-full transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.4)] active:scale-90"
                >
                    <div className={`${compact ? 'w-20 h-20' : 'w-24 h-24'} border-4 border-tech-black rounded-full flex items-center justify-center`}>
                        <div className={`${compact ? 'w-16 h-16' : 'w-18 h-18'} bg-u-orange rounded-full flex items-center justify-center shadow-inner group-hover:scale-95 transition-transform`}>
                            {countdown !== null ? (
                                <Aperture className="w-full h-full p-3 text-white animate-spin" />
                            ) : (
                                <Zap className="w-full h-full p-4 text-white" fill="white" />
                            )}
                        </div>
                    </div>
                </button>
                
                <button 
                    onClick={stopCamera}
                    className="pointer-events-auto w-12 h-12 bg-tech-black/80 backdrop-blur-3xl text-white rounded-2xl flex items-center justify-center hover:bg-u-orange transition-all active:scale-95 border border-white/10 shadow-xl"
                >
                    <X size={24} />
                </button>
            </div>
            
            <div className="absolute top-8 left-0 right-0 flex justify-center gap-3 z-30 pointer-events-auto">
                {[0, 3, 5, 10].map(t => (
                    <button 
                        key={t}
                        onClick={() => setTimer(t)}
                        className={`px-6 py-2.5 rounded-pill text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                            timer === t 
                            ? 'bg-u-orange border-u-orange text-white shadow-[0_0_30px_#ff7b00] scale-110' 
                            : 'bg-tech-black/80 border-white/10 text-white/60 backdrop-blur-2xl hover:bg-tech-black hover:text-white'
                        }`}
                    >
                        {t === 0 ? 'OFF' : `${t}S`}
                    </button>
                ))}
            </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default HumanInput;