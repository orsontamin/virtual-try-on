import React, { useState, useEffect } from 'react';
import * as fabric from 'fabric';
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
import { applyFrame, combineImagesSideBySide } from '../utils/image-utils';
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
  const [designImageBack, setDesignImageBack] = useState(null);
  const [humanImage, setHumanImage] = useState(null);
  const [humanImageBack, setHumanImageBack] = useState(null);
  const [capCityStep, setCapCityStep] = useState('front'); // 'front' or 'back'
  const [showReview, setShowReview] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [resultImageBack, setResultImageBack] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  
  const [isPortraitMode, setIsPortraitMode] = useState(window.innerHeight > window.innerWidth);

  // DEBUG WATCHERS
  useEffect(() => {
      if (humanImage) console.log("🔍 [STATE] humanImage updated, length:", humanImage.length);
      else console.log("🔍 [STATE] humanImage is null");
  }, [humanImage]);

  useEffect(() => {
      console.log("🔍 [STATE] step changed to:", step);
  }, [step]);

  useEffect(() => {
      if (shareUrl) console.log("🔍 [STATE] shareUrl updated:", shareUrl);
      else console.log("🔍 [STATE] shareUrl is null (Syncing...)");
  }, [shareUrl]);

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
    if (!selectedShirt) return;
    setStep(2);
    
    // If it's Cap City, we pre-generate both front and back design images
    if (selectedShirt.includes('cap-city')) {
        const generateView = (src) => {
            return new Promise((resolve) => {
                const canvasEl = document.createElement('canvas');
                canvasEl.width = 625;
                canvasEl.height = 750;
                const tempCanvas = new fabric.Canvas(canvasEl);
                
                fabric.Image.fromURL(src, { crossOrigin: 'anonymous' }).then((img) => {
                    img.scaleToWidth(550); 
                    img.set({
                        left: 312.5,
                        top: 375,
                        originX: 'center',
                        originY: 'center'
                    });
                    tempCanvas.add(img);
                    tempCanvas.requestRenderAll();
                    const dataURL = tempCanvas.toDataURL({ format: 'png', multiplier: 2 });
                    tempCanvas.dispose();
                    resolve(dataURL);
                });
            });
        };

        Promise.all([
            generateView('/assets/shirts/cap-city-front.png'),
            generateView('/assets/shirts/cap-city-back.png')
        ]).then(([frontData, backData]) => {
            setDesignImage(frontData);
            setDesignImageBack(backData);
            setSavedDesign({ objects: [] });
        });
    } else {
        setSavedDesign(null);
    }
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
      console.log("🎬 handleGenerate called!", { selectedShirt, capCityStep, showReview, hasImage: !!imgToUse });
      const isCapCity = selectedShirt.includes('cap-city');
      
      // Step 1: Handle Front Confirmation
      if (isCapCity && capCityStep === 'front') {
          setHumanImage(imgToUse);
          setCapCityStep('back');
          return;
      }

      // Step 2: Handle Back Confirmation -> Move to Review
      if (isCapCity && capCityStep === 'back' && !showReview) {
          setHumanImageBack(imgToUse);
          setShowReview(true);
          return;
      }

      // Step 3: Processing (Triggered from Review)
      const finalHumanFront = isCapCity ? humanImage : (imgToUse || humanImage);
      const finalHumanBack = isCapCity ? humanImageBack : null;
      
      // Ensure front image is set for the scanning preview
      if (!isCapCity && imgToUse) {
          setHumanImage(imgToUse);
      }

      if (!finalHumanFront || !designImage) return;

      setStep(4);
      setLoading(true);
      setError(null);
      setShareUrl(null); // Reset shareUrl
      try {
          if (isCapCity) {
              console.log("🏙️ Processing Cap City Dual VTO...");
              
              const resultFront = await tryOn(finalHumanFront, designImage);
              console.log("🎨 Front VTO result:", resultFront ? "Success" : "Failed");

              const resultBack = await tryOn(finalHumanBack, designImageBack);
              console.log("🎨 Back VTO result:", resultBack ? "Success" : "Failed");
              
              if (resultFront && resultBack) {
                  const framedFront = await applyFrame(resultFront, '/assets/screen/screen-wardrobe-frame.png');
                  const framedBack = await applyFrame(resultBack, '/assets/screen/screen-wardrobe-frame.png');
                  
                  setResultImage(framedFront); 
                  setResultImageBack(framedBack);
                  
                  console.log("📜 Saving both views to session history...");
                  saveToHistory(framedFront);
                  saveToHistory(framedBack);
                  
                  const timestamp = Date.now();
                  console.log("💾 Starting Drive uploads for Cap City...");
                  
                  // Upload Front Image (This creates the folder and returns the folder URL)
                  const frontDriveData = await saveImageToDrive(framedFront, `vto-capcity-front-${timestamp}.png`);
                  
                  if (frontDriveData?.webViewLink) {
                      console.log("🔗 Received Folder URL for QR:", frontDriveData.webViewLink);
                      setShareUrl(frontDriveData.webViewLink);
                  } else {
                      console.warn("⚠️ No share URL received from Drive upload");
                  }
                  
                  // Upload Back Image (This joins the existing folder)
                  saveImageToDrive(framedBack, `vto-capcity-back-${timestamp}.png`).catch(e => console.error("Error saving back image:", e));

              } else {
                  throw new Error("One or both transformations failed.");
              }
          } else {
              // SINGLE GENERATION (Standard)
              console.log("👕 Processing Single VTO...");
              let finalDesignImage = designImage;
              const attire = await analyzePersonAttire(finalHumanFront);
              
              if (savedDesign) {
                  if (attire.is_muslimah) {
                      console.log("🧕 Muslimah detected - adjusting design...");
                      const LONG_SLEEVE_CANVAS = '/assets/shirts/long-sleeve-canvas.png';
                      finalDesignImage = await generateDesignImage(savedDesign, LONG_SLEEVE_CANVAS);
                  } else if (attire.is_sleeveless) {
                      console.log("👕 Sleeveless detected - adjusting design...");
                      const STANDARD_CANVAS = '/assets/shirts/base-canvas-black-shirt.png';
                      finalDesignImage = await generateDesignImage(savedDesign, STANDARD_CANVAS);
                  }
              }

              const result = await tryOn(finalHumanFront, finalDesignImage);
              if (result) {
                console.log("🎨 VTO result: Success");
                const framedImage = await applyFrame(result, '/assets/screen/screen-04.png');
                setResultImage(framedImage);
                saveToHistory(framedImage);
                
                console.log("💾 Starting Drive upload...");
                const driveData = await saveImageToDrive(framedImage, `vto-design-${Date.now()}.png`);
                if (driveData?.webViewLink) {
                    console.log("🔗 Received Share URL:", driveData.webViewLink);
                    setShareUrl(driveData.webViewLink);
                } else {
                    console.warn("⚠️ No share URL received from Drive upload");
                }
              } else {
                 console.warn("⚠️ VTO result failed, showing original image");
                 setResultImage(finalHumanFront); 
              }
          }
      } catch (err) {
          console.error("❌ Generation Error:", err);
          setError(err.response?.data?.error?.message || err.message || "Generation failed.");
      } finally {
          // Small delay to ensure state updates (like shareUrl) are processed before loading finishes
          setTimeout(() => {
              setLoading(false);
              setShowReview(false);
              setCapCityStep('front');
          }, 500);
      }
  };

  return (
    <div className={`flex flex-col font-sans selection:bg-u-orange/20 h-full`}>
      <main className={`flex-grow flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden`}>
        
        {step === 1 && (
            <div className={`w-full max-w-lg animate-in fade-in duration-700 flex flex-col items-center justify-center gap-8 py-4`}>
                <div className="w-full relative group">
                    <div className="absolute -inset-4 bg-u-orange/5 rounded-[80px] blur-3xl opacity-50"></div>
                    <div className="relative w-full bg-white p-8 md:p-12 rounded-[60px] shadow-[0_40px_100px_rgba(52,55,65,0.1)] border-2 border-tech-black/5 flex flex-col items-center text-center">
                        <div className="mb-12">
                            <h3 className="text-4xl font-black text-tech-black uppercase tracking-tighter italic leading-none">
                                SELECT YOUR <span className="text-u-orange text-5xl block mt-2">DRIP.</span>
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6 w-full mb-4">
                            <button 
                                onClick={() => handleShirtSelect('/assets/shirts/cap-city-front.png')}
                                className={`group relative p-8 rounded-[12px] border-4 transition-all duration-500 flex flex-col items-center gap-4 ${
                                    selectedShirt?.includes('cap-city') 
                                    ? 'border-u-orange bg-white shadow-2xl scale-[1.05]' 
                                    : 'border-tech-black/5 bg-soft-white/20 grayscale hover:grayscale-0 hover:border-u-orange/30'
                                }`}
                            >
                                <div className="w-16 h-16 bg-u-orange text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                                    <Sparkles size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-tech-black uppercase tracking-tighter italic">CAP CITY</h4>
                                    <p className="text-[10px] font-bold text-tech-black/40 uppercase tracking-widest">Pre-printed Special</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleShirtSelect('/assets/shirts/base-canvas-black-shirt.png')}
                                className={`group relative p-8 rounded-[12px] border-4 transition-all duration-500 flex flex-col items-center gap-4 ${
                                    selectedShirt?.includes('base-canvas') 
                                    ? 'border-u-orange bg-white shadow-2xl scale-[1.05]' 
                                    : 'border-tech-black/5 bg-soft-white/20 grayscale hover:grayscale-0 hover:border-u-orange/30'
                                }`}
                            >
                                <div className="w-16 h-16 bg-tech-black text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:-rotate-6 transition-transform">
                                    <Zap size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-tech-black uppercase tracking-tighter italic">HEAT PRESS</h4>
                                    <p className="text-[10px] font-bold text-tech-black/40 uppercase tracking-widest">Custom Design</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleNextToDesign}
                    disabled={!selectedShirt}
                    className="w-full py-8 bg-tech-black text-white rounded-pill shadow-[0_30px_80px_rgba(52,55,65,0.3)] hover:bg-u-orange hover:shadow-2xl disabled:opacity-50 disabled:hover:bg-tech-black transition-all duration-500 font-black text-3xl uppercase tracking-tighter flex items-center justify-center gap-6 active:scale-95 group italic"
                >
                    CONTINUE <ArrowRight size={40} className="group-hover:translate-x-2 transition-transform" />
                </button>
            </div>
        )}

        {step === 2 && (
            <div className={`w-full max-w-6xl animate-in fade-in zoom-in-95 duration-700 flex flex-col ${selectedShirt.includes('cap-city') ? 'lg:flex-row gap-10' : 'items-center gap-6'} justify-center py-2 px-6`}>
                <div className={`${selectedShirt.includes('cap-city') ? 'flex-1' : 'flex-none'} flex flex-col items-center justify-center w-full relative text-center`}>
                    {selectedShirt.includes('cap-city') ? (
                        <div className="space-y-6 flex flex-col items-center w-full">
                            <div className={`flex flex-col md:flex-row gap-10 items-center justify-center transform scale-[0.6] md:scale-[0.55] lg:scale-[0.65] origin-center`}>
                                <div className="space-y-6">
                                    <div className={`relative p-2 bg-white rounded-[24px] shadow-[0_20px_60px_rgba(52,55,65,0.1)] border-2 border-tech-black/5`}>
                                        <DesignCanvas onCanvasReady={handleCanvasReady} initialDesign={savedDesign} background="/assets/shirts/cap-city-front.png" />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className={`relative p-2 bg-white rounded-[24px] shadow-[0_20px_60px_rgba(52,55,65,0.1)] border-2 border-tech-black/5`}>
                                        <DesignCanvas background="/assets/shirts/cap-city-back.png" readOnly={true} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 w-full max-w-xl">
                                <button 
                                    onClick={() => { setSavedDesign(null); setStep(1); }} 
                                    className="p-6 bg-tech-black text-white rounded-pill hover:bg-u-orange transition-all active:scale-95 shadow-xl border-2 border-white/10"
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <button 
                                    onClick={() => setStep(3)}
                                    className="flex-grow py-6 bg-tech-black text-white rounded-pill shadow-xl hover:bg-u-orange transition-all font-black text-2xl uppercase tracking-tighter flex items-center justify-center gap-4 active:scale-95 italic group"
                                >
                                    STRIKE A POSE <ImageIcon size={32} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`relative p-2 bg-white rounded-[24px] shadow-[0_20px_60px_rgba(52,55,65,0.1)] border-2 border-tech-black/5 transform scale-[0.75] md:scale-[0.8] lg:scale-[0.85] origin-center -my-8`}>
                            <DesignCanvas onCanvasReady={handleCanvasReady} initialDesign={savedDesign} background={selectedShirt} />
                        </div>
                    )}
                </div>

                {!selectedShirt.includes('cap-city') && (
                    <div className="w-full flex flex-col gap-4 max-w-xl">
                        <div className="bg-white p-3 rounded-[24px] shadow-sm border border-tech-black/5">
                            <Toolbar canvas={canvas} compact={true} onShirtChange={setSelectedShirt} />
                        </div>

                        <div className="flex gap-2 w-full">
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
                                FINALIZE DESIGN <Zap size={16} fill="white" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {step === 3 && (
            <div className={`w-full flex flex-col items-center justify-center py-4`}>
                <div className="space-y-1 mb-6 text-center">
                    <h2 className="text-5xl font-black text-tech-black tracking-tighter italic uppercase leading-tight">
                        {selectedShirt.includes('cap-city') 
                            ? (showReview ? 'REVIEW YOUR POSES' : `STRIKE A POSE: ${capCityStep.toUpperCase()} VIEW`) 
                            : 'STRIKE A POSE.'}
                    </h2>
                </div>
                
                <div className={`w-full relative flex items-center justify-center p-2`}>
                    <div className="relative p-2 bg-white rounded-[48px] shadow-2xl border-4 border-u-orange/10 w-full max-w-xl">
                        {showReview ? (
                            <div className="w-full flex flex-col gap-8 p-4">
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="aspect-[3/4] rounded-[24px] overflow-hidden border-2 border-tech-black/5">
                                            <img src={humanImage} alt="Front Pose" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="aspect-[3/4] rounded-[24px] overflow-hidden border-2 border-tech-black/5">
                                            <img src={humanImageBack} alt="Back Pose" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleGenerate()}
                                    className="w-full py-8 bg-u-orange text-white rounded-pill font-black text-2xl uppercase tracking-tighter shadow-xl hover:bg-tech-black transition-all flex items-center justify-center gap-4 italic"
                                >
                                    CONFIRM <Zap size={32} fill="white" />
                                </button>
                            </div>
                        ) : (
                            <HumanInput 
                                key={capCityStep}
                                onImageSelect={(img) => handleGenerate(img)} 
                                designPreview={selectedShirt.includes('cap-city') 
                                    ? (capCityStep === 'front' ? designImage : designImageBack) 
                                    : designImage}
                                compact={true}
                                instruction={selectedShirt.includes('cap-city')
                                    ? (capCityStep === 'front' ? "Capture your FRONT view pose" : "Capture your BACK view pose")
                                    : "Ensure your entire body from head to waist is visible"}
                                actionLabel={selectedShirt.includes('cap-city') && capCityStep === 'front' ? "NEXT VIEW" : "TRY ON"}
                            />
                        )}
                    </div>
                </div>

                <div className="pt-6 flex gap-4">
                    <button 
                        onClick={() => {
                            if (showReview) {
                                setShowReview(false);
                                setCapCityStep('back');
                            } else if (selectedShirt.includes('cap-city') && capCityStep === 'back') {
                                setCapCityStep('front');
                            } else {
                                setStep(2);
                            }
                        }} 
                        className="px-10 py-4 bg-tech-black text-white rounded-pill font-black hover:bg-tech-black transition-all active:scale-95 flex items-center gap-3 uppercase text-base tracking-tighter shadow-xl"
                    >
                        <ArrowLeft size={20} /> Back
                    </button>
                    {selectedShirt.includes('cap-city') && (capCityStep === 'back' || showReview) && (
                        <button 
                            onClick={() => {
                                setCapCityStep('front');
                                setHumanImage(null);
                                setHumanImageBack(null);
                                setShowReview(false);
                            }} 
                            className="px-10 py-4 bg-u-orange text-white rounded-pill font-black hover:bg-tech-black transition-all active:scale-95 flex items-center gap-3 uppercase text-base tracking-tighter shadow-xl"
                        >
                            <RefreshCw size={20} /> Reset All
                        </button>
                    )}
                </div>
            </div>  
        )}

        {step === 4 && (
            <div className={`w-full min-h-full flex flex-col items-center p-4 ${isPortraitMode ? 'justify-between px-8' : 'justify-center max-w-5xl'}`}>
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                        <div className="relative p-6 bg-white rounded-[60px] shadow-2xl mb-12 border-4 border-u-orange/20 animate-pulse">
                            <div className={`relative overflow-hidden rounded-[12px] ${isPortraitMode ? 'w-72 h-[450px]' : 'w-80 h-96'}`}>
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
                            <div className="relative group max-w-4xl flex gap-6">
                                <div className="absolute -inset-10 bg-u-orange/10 rounded-[100px] blur-3xl opacity-50 pointer-events-none"></div>
                                
                                {/* Front Result */}
                                <div className="relative flex-1">
                                    {resultImage ? (
                                        <img src={resultImage} alt="Front Result" className="w-full h-full object-contain rounded-[12px] shadow-2xl" />
                                    ) : (
                                        <div className="w-full aspect-[3/4] flex items-center justify-center bg-soft-white/10 text-tech-black/10 rounded-[12px] border-2 border-dashed border-white/20">
                                            <ImageIcon size={64} />
                                        </div>
                                    )}
                                </div>

                                {/* Back Result (Cap City Only) */}
                                {selectedShirt.includes('cap-city') && (
                                    <div className="relative flex-1">
                                        {resultImageBack ? (
                                            <img src={resultImageBack} alt="Back Result" className="w-full h-full object-contain rounded-[12px] shadow-2xl" />
                                        ) : (
                                            <div className="w-full aspect-[3/4] flex items-center justify-center bg-soft-white/10 text-tech-black/10 rounded-[12px] border-2 border-dashed border-white/20">
                                                <ImageIcon size={64} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Technical Sync Card */}
                            <div className={`flex flex-col items-center justify-center bg-white p-4 rounded-[12px] shadow-2xl border-4 border-u-orange/10 animate-in slide-in-from-right-8 duration-1000 delay-300 w-48 ${isPortraitMode ? 'mt-4' : 'mt-10'}`}>
                                <div className="text-center">
                                    <h4 className="text-[10px] font-black text-tech-black tracking-widest uppercase italic leading-none mb-3">DOWNLOAD</h4>
                                </div>
                                
                                <div className="bg-soft-white/50 p-3 rounded-[24px] mb-2 relative flex items-center justify-center min-h-[110px] w-full border-2 border-tech-black/5 group">
                                    {shareUrl ? (
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`} 
                                            alt="QR Code" 
                                            className="w-20 h-20 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-tech-black/20">
                                            <RefreshCw size={20} className="animate-spin text-u-orange" />
                                            <span className="text-[7px] font-black uppercase tracking-[0.2em] italic text-center px-4">Syncing...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={`relative flex gap-6 w-full m-6 pb-12 ${isPortraitMode ? 'max-w-2xl flex-col px-10' : 'md:flex-row max-sm'}`}>
                            <button 
                                onClick={() => { 
                                    setStep(1); 
                                    setResultImage(null); 
                                    setResultImageBack(null);
                                    setSelectedShirt('/assets/shirts/base-canvas-black-shirt.png'); 
                                    setSavedDesign(null); 
                                    setCapCityStep('front');
                                    setHumanImageBack(null);
                                    setShowReview(false);
                                }}
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