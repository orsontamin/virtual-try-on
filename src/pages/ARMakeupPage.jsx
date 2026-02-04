import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Camera, Sparkles, Trash2, Download, RefreshCw } from 'lucide-react';
import { FaceLandmarker, ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

const WIG_STYLES = [
  { id: 'long_wavy', name: 'Long Wave', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Wig_long_hair.png/640px-Wig_long_hair.png' },
];

const MAKEUP_PRESETS = [
  { id: 'none', name: 'Natural', lips: 'transparent', eyes: 'transparent', blush: 'transparent', hair: 'transparent', wig: null, smoothing: 0 },
  { id: 'cleangirl', name: 'Clean Girl', lips: 'rgba(255, 192, 203, 0.25)', eyes: 'rgba(255, 239, 213, 0.1)', blush: 'rgba(255, 182, 193, 0.15)', hair: 'rgba(255, 255, 255, 0.1)', wig: null, smoothing: 0.4, gloss: true },
  { id: 'longhair', name: 'Long Vibe', lips: 'rgba(255, 105, 180, 0.3)', eyes: 'rgba(200, 160, 255, 0.2)', blush: 'rgba(255, 182, 193, 0.2)', hair: 'rgba(255, 105, 180, 0.4)', wig: 'long_wavy', smoothing: 0.5, gloss: true },
  { id: 'midnight', name: 'Midnight', lips: 'rgba(25, 25, 112, 0.3)', eyes: 'rgba(0, 0, 128, 0.2)', blush: 'rgba(0, 0, 128, 0.1)', hair: 'rgba(0, 0, 255, 0.3)', wig: null, smoothing: 0.2, gloss: false },
  { id: 'cyberpunk', name: 'CyberVibe', lips: 'rgba(124, 58, 237, 0.5)', eyes: 'rgba(236, 72, 153, 0.3)', blush: 'rgba(124, 58, 237, 0.15)', hair: 'rgba(124, 58, 237, 0.4)', wig: null, smoothing: 0.3, gloss: true },
];

const ARMakeupPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const segmenterRef = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const wigImagesRef = useRef({});
  
  const [loading, setLoading] = useState(true);
  const [generatingCollage, setGeneratingCollage] = useState(false); // New state
  const [stream, setStream] = useState(null);

  const generateStyleCollage = async () => {
      if (!videoRef.current || !faceLandmarkerRef.current) return;
      
      setGeneratingCollage(true);
      const { videoWidth: vw, videoHeight: vh } = videoRef.current;
      
      // Create a master collage canvas (2 columns, 5 rows)
      const masterCanvas = document.createElement('canvas');
      masterCanvas.width = vw * 2;
      masterCanvas.height = vh * 5;
      const mCtx = masterCanvas.getContext('2d');

      // Capture the base frame once
      const baseFrame = document.createElement('canvas');
      baseFrame.width = vw;
      baseFrame.height = vh;
      baseFrame.getContext('2d').drawImage(videoRef.current, 0, 0);

      // We'll use 10 variations (5 existing presets + 5 auto-generated variants)
      const allPresets = [...MAKEUP_PRESETS, ...MAKEUP_PRESETS]; 

      for (let i = 0; i < 10; i++) {
          const col = i % 2;
          const row = Math.floor(i / 2);
          
          // Create a temp canvas for this specific style
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = vw;
          tempCanvas.height = vh;
          const tCtx = tempCanvas.getContext('2d');
          
          // Draw base face
          tCtx.drawImage(baseFrame, 0, 0);
          
          // Detect landmarks for this style (using existing faceLandmarker)
          const results = faceLandmarkerRef.current.detect(baseFrame);
          
          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              const preset = allPresets[i];
              
              // Apply specific style
              if (preset.id !== 'none') {
                  if (preset.smoothing) applySkinSmoothingToCtx(tCtx, tempCanvas, baseFrame, preset.smoothing);
                  drawEyeshadowToCtx(tCtx, tempCanvas, landmarks, preset.eyes);
                  drawBlushToCtx(tCtx, tempCanvas, landmarks, preset.blush);
                  drawLipsToCtx(tCtx, tempCanvas, landmarks, preset);
              }
          }

          // Label the style
          tCtx.fillStyle = 'white';
          tCtx.font = 'bold 40px sans-serif';
          tCtx.shadowColor = 'black';
          tCtx.shadowBlur = 10;
          tCtx.fillText(allPresets[i].name + (i > 4 ? ' Alt' : ''), 40, 80);

          // Draw onto master collage
          mCtx.drawImage(tempCanvas, col * vw, row * vh);
      }

      // Download/Save result
      const dataUrl = masterCanvas.toDataURL('image/jpeg', 0.8);
      const link = document.createElement('a');
      link.download = `vto-style-card-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
      
      // Backup to Drive
      try {
          await saveImageToDrive(dataUrl, `vto-style-card-${Date.now()}.png`);
      } catch (e) {
          console.error("Collage backup failed", e);
      }

      setGeneratingCollage(false);
  };

  // Helper versions of draw functions that take target ctx/canvas
  const applySkinSmoothingToCtx = (ctx, canvas, source, strength) => {
      ctx.save();
      ctx.globalAlpha = strength;
      ctx.filter = 'blur(8px) contrast(1.1)';
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      ctx.restore();
  };

  const drawLipsToCtx = (ctx, landmarks, preset) => {
      ctx.save();
      ctx.fillStyle = preset.lips;
      ctx.globalCompositeOperation = 'multiply';
      const upperLip = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 78, 183, 42, 81, 82, 13, 312, 311, 310, 415];
      const lowerLip = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
      const dp = (indices) => {
          ctx.beginPath();
          indices.forEach(idx => ctx.lineTo(landmarks[idx].x * ctx.canvas.width, landmarks[idx].y * ctx.canvas.height));
          ctx.closePath(); ctx.fill();
      };
      dp(upperLip); dp(lowerLip);
      ctx.restore();
  };

  const drawEyeshadowToCtx = (ctx, canvas, landmarks, color) => {
      if (color === 'transparent') return;
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalCompositeOperation = 'multiply';
      ctx.filter = 'blur(4px)';
      const lids = [[133, 173, 157, 158, 159, 160, 161, 246, 33], [362, 398, 384, 385, 386, 387, 388, 466, 263]];
      lids.forEach(indices => {
          ctx.beginPath();
          indices.forEach(idx => ctx.lineTo(landmarks[idx].x * canvas.width, landmarks[idx].y * canvas.height));
          ctx.fill();
      });
      ctx.restore();
  };

  const drawBlushToCtx = (ctx, canvas, landmarks, color) => {
      if (color === 'transparent') return;
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      [landmarks[205], landmarks[425]].forEach(p => {
          const x = p.x * canvas.width, y = p.y * canvas.height, r = canvas.width * 0.08;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, color); g.addColorStop(1, 'transparent');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
  };
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(MAKEUP_PRESETS[0]);
  const selectedPresetRef = useRef(MAKEUP_PRESETS[0]);

  useEffect(() => {
    selectedPresetRef.current = selectedPreset;
  }, [selectedPreset]);

  useEffect(() => {
    WIG_STYLES.forEach(style => {
      const img = new Image();
      img.src = style.src;
      img.crossOrigin = 'anonymous';
      img.onload = () => { wigImagesRef.current[style.id] = img; };
    });

    const initAI = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });

        segmenterRef.current = await ImageSegmenter.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          outputCategoryMask: true
        });

        setLoading(false);
      } catch (err) {
        console.error("AI Init failed:", err);
        setLoading(false);
      }
    };

    initAI();
    return () => {
      stopCamera();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadeddata = () => {
        predictWebcam();
      };
    }
  }, [isCameraActive, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Please enable camera access.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const predictWebcam = async () => {
    if (!videoRef.current || !faceLandmarkerRef.current || !canvasRef.current) return;

    if (canvasRef.current.width !== videoRef.current.videoWidth) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }

    let startTimeMs = performance.now();
    if (lastVideoTimeRef.current !== videoRef.current.currentTime) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const faceResults = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      
      let hairMask = null;
      if (segmenterRef.current) {
        segmenterRef.current.segmentForVideo(videoRef.current, startTimeMs, (result) => {
          hairMask = result.categoryMask;
        });
      }
      drawMakeup(faceResults, hairMask);
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const applySkinSmoothing = (ctx, strength) => {
    ctx.save();
    ctx.globalAlpha = strength;
    ctx.filter = 'blur(8px) contrast(1.1)';
    ctx.globalCompositeOperation = 'source-atop'; 
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.restore();
  };

  const drawMakeup = (faceResults, hairMask) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const currentPreset = selectedPresetRef.current;

    if (hairMask && currentPreset.hair !== 'transparent') {
      drawHair(ctx, hairMask, currentPreset.hair);
    }

    if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
      const landmarks = faceResults.faceLandmarks[0];
      if (currentPreset.wig) {
        drawWig(ctx, landmarks, currentPreset.wig);
      }
      if (currentPreset.id !== 'none') {
        if (currentPreset.smoothing > 0) {
          applySkinSmoothing(ctx, currentPreset.smoothing);
        }
        drawEyeshadow(ctx, landmarks, currentPreset.eyes);
        drawBlush(ctx, landmarks, currentPreset.blush);
        drawLips(ctx, landmarks, currentPreset.lips);
      }
    }
  };

  const drawHair = (ctx, mask, color) => {
    const { width, height } = canvasRef.current;
    const maskData = mask.getAsUint8Array();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = mask.width;
    tempCanvas.height = mask.height;
    const tempCtx = tempCanvas.getContext('2d');
    const imgData = tempCtx.createImageData(mask.width, mask.height);
    for (let i = 0; i < maskData.length; i++) {
      imgData.data[i * 4 + 3] = maskData[i] === 1 ? 255 : 0;
    }
    tempCtx.putImageData(imgData, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = color;
    const maskPatternCanvas = document.createElement('canvas');
    maskPatternCanvas.width = width;
    maskPatternCanvas.height = height;
    const mpCtx = maskPatternCanvas.getContext('2d');
    mpCtx.drawImage(tempCanvas, 0, 0, width, height);
    ctx.drawImage(maskPatternCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  const drawWig = (ctx, landmarks, wigId) => {
    const img = wigImagesRef.current[wigId];
    if (!img) return;
    const top = landmarks[10];
    const bottom = landmarks[152];
    const left = landmarks[234];
    const right = landmarks[454];
    const faceWidth = (right.x - left.x) * canvasRef.current.width;
    const faceHeight = (bottom.y - top.y) * canvasRef.current.height;
    const centerX = (left.x + right.x) / 2 * canvasRef.current.width;
    const centerY = (top.y + bottom.y) / 2 * canvasRef.current.height;
    const wigWidth = faceWidth * 2.2;
    const wigHeight = wigWidth * (img.height / img.width);
    ctx.save();
    ctx.translate(centerX, centerY - faceHeight * 0.2);
    const eyeLeft = landmarks[33];
    const eyeRight = landmarks[263];
    ctx.rotate(Math.atan2(eyeRight.y - eyeLeft.y, eyeRight.x - eyeLeft.x));
    ctx.drawImage(img, -wigWidth / 2, -wigHeight / 2, wigWidth, wigHeight);
    ctx.restore();
  };

  const drawEyeshadow = (ctx, landmarks, color) => {
    if (color === 'transparent') return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = 'multiply';
    ctx.filter = 'blur(4px)';
    const leftEye = [133, 173, 157, 158, 159, 160, 161, 246, 33];
    const rightEye = [362, 398, 384, 385, 386, 387, 388, 466, 263];
    const drawLid = (indices) => {
      ctx.beginPath();
      indices.forEach((idx, i) => {
        const p = landmarks[idx];
        if (i === 0) ctx.moveTo(p.x * canvasRef.current.width, p.y * canvasRef.current.height);
        else ctx.lineTo(p.x * canvasRef.current.width, p.y * canvasRef.current.height);
      });
      ctx.fill();
    };
    drawLid(leftEye);
    drawLid(rightEye);
    ctx.restore();
  };

  const drawBlush = (ctx, landmarks, color) => {
    if (color === 'transparent') return;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const leftCheek = landmarks[205];
    const rightCheek = landmarks[425];
    const applyBlush = (point) => {
      const x = point.x * canvasRef.current.width;
      const y = point.y * canvasRef.current.height;
      const radius = canvasRef.current.width * 0.08;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };
    applyBlush(leftCheek);
    applyBlush(rightCheek);
    ctx.restore();
  };

  const drawLips = (ctx, landmarks, color) => {
    if (!landmarks || landmarks.length === 0) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = 'multiply';
    const upperLipIndices = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 78, 183, 42, 81, 82, 13, 312, 311, 310, 415];
    const lowerLipIndices = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
    const drawPath = (indices) => {
      ctx.beginPath();
      indices.forEach((idx, i) => {
        const point = landmarks[idx];
        if (point) {
          ctx.lineTo(point.x * canvasRef.current.width, point.y * canvasRef.current.height);
        }
      });
      ctx.closePath();
      ctx.fill();
    };
    drawPath(upperLipIndices);
    drawPath(lowerLipIndices);
    if (selectedPresetRef.current.gloss) {
      ctx.globalCompositeOperation = 'screen';
      const hp = landmarks[14];
      const x = hp.x * canvasRef.current.width;
      const y = hp.y * canvasRef.current.height;
      const gloss = ctx.createRadialGradient(x, y, 0, x, y, 20);
      gloss.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gloss.addColorStop(1, 'transparent');
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.ellipse(x, y + 5, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const capturePhoto = () => {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = videoRef.current.videoWidth;
    finalCanvas.height = videoRef.current.videoHeight;
    const ctx = finalCanvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    ctx.drawImage(canvasRef.current, 0, 0, finalCanvas.width, finalCanvas.height);
    const link = document.createElement('a');
    link.download = 'makeup-look.jpg';
    link.href = finalCanvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-800 rounded-full transition"><ArrowLeft size={24} /></Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-900/20"><Sparkles size={20} /></div>
            <h1 className="text-xl font-black tracking-tight">GLAM.<span className="text-pink-500">AI</span></h1>
          </div>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-full text-xs font-bold text-slate-400">BETA: AR Makeup</div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-pink-500 font-bold uppercase tracking-widest animate-pulse">Loading AI Models...</p>
          </div>
        )}

        <div className="relative w-full max-w-2xl aspect-[9/16] md:aspect-video rounded-[40px] overflow-hidden shadow-2xl bg-black border-8 border-slate-800">
          {!isCameraActive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-slate-600"><Camera size={48} /></div>
              <button onClick={startCamera} disabled={loading} className="px-8 py-4 bg-pink-500 text-white rounded-full font-black text-lg hover:bg-pink-600 transition-all shadow-xl active:scale-95 disabled:opacity-50">START MIRROR</button>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" width="1280" height="720" />
              <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 px-6">
                <button onClick={stopCamera} className="p-4 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition active:scale-90"><Trash2 size={24} /></button>
                                        <button 
                                            onClick={capturePhoto}
                                            className="p-6 bg-white text-slate-900 rounded-full hover:scale-110 transition shadow-2xl active:scale-95 border-8 border-white/30"
                                        >
                                            <div className="w-4 h-4 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]"></div>
                                        </button>
                                        
                                        <button 
                                            onClick={generateStyleCollage}
                                            disabled={generatingCollage}
                                            className="p-4 bg-brand-purple text-white rounded-2xl shadow-lg hover:bg-brand-purple/80 transition active:scale-90 flex flex-col items-center gap-1 min-w-[80px]"
                                        >
                                            {generatingCollage ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                            <span className="text-[8px] font-black uppercase">Style Card</span>
                                        </button>
                
                                        <button className="p-4 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-slate-700 transition active:scale-90"><Download size={24} /></button>
              </div>
            </>
          )}
        </div>

        {isCameraActive && (
          <div className="mt-8 w-full max-w-2xl bg-slate-800/50 backdrop-blur-xl p-6 rounded-[32px] border border-slate-700/50 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {MAKEUP_PRESETS.map((preset) => (
                <button key={preset.id} onClick={() => setSelectedPreset(preset)} className={`flex-shrink-0 flex flex-col items-center gap-2 group transition-all ${selectedPreset.id === preset.id ? 'scale-110' : 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}>
                  <div className={`w-16 h-16 rounded-2xl border-4 transition-all ${selectedPreset.id === preset.id ? 'border-pink-500 shadow-lg shadow-pink-500/20' : 'border-slate-700'}`} style={{ backgroundColor: preset.lips === 'transparent' ? '#334155' : preset.lips.replace(/0\.\d+/, '1') }}></div>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
      <footer className="p-8 mt-auto flex justify-center text-slate-500 font-medium text-xs uppercase tracking-widest border-t border-slate-800/50 bg-[#0f172a]">Face Tracking by MediaPipe &copy; 2026</footer>
    </div>
  );
};

export default ARMakeupPage;
