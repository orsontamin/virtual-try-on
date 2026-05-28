import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Settings, RefreshCw, Download, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { applyFrame } from '../utils/image-utils';

const FRAMES = [
    { id: 'screen-01', name: 'Interface V1', path: '/assets/screen/screen-01.png' },
    { id: 'screen-02', name: 'Interface V2', path: '/assets/screen/screen-02.png' },
    { id: 'screen-03', name: 'Modern Border', path: '/assets/screen/screen-03.png' },
    { id: 'screen-04', name: 'Classic Border', path: '/assets/screen/screen-04.png' },
    { id: 'grooming', name: 'Grooming Frame', path: '/assets/screen/screen-grooming-frame.png' },
    { id: 'wardrobe', name: 'Wardrobe Frame', path: '/assets/screen/screen-wardrobe-frame.png' }
];

const BACKGROUNDS = [
    { id: 'orange', name: 'U-Orange', path: '/assets/screen/orange-background.png' },
    { id: 'none', name: 'Plain White', path: null }
];

const FrameStudioPage = () => {
    const [rawImage, setRawImage] = useState(null);
    const [framedImage, setFramedImage] = useState(null);
    const [config, setConfig] = useState({
        frame: '/assets/screen/screen-03.png',
        background: '/assets/screen/orange-background.png',
        scale: 0.9,
        offsetY: -160,
        showGrid: true,
        useTargetArea: true,
        targetArea: { x: 140, y: 150, w: 1000, h: 1000 },
        showPlaceholder: true
    });
    const [processing, setProcessing] = useState(false);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setRawImage(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (rawImage) {
            updateFrame();
        }
    }, [rawImage, config]);

    const updateFrame = async () => {
        setProcessing(true);
        try {
            const result = await applyFrame(rawImage || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', config.frame, {
                contentScale: config.scale,
                backgroundPath: config.background,
                offsetY: config.offsetY,
                showGrid: config.showGrid,
                gridColor: '#F47321',
                targetArea: config.useTargetArea ? config.targetArea : null,
                showPlaceholder: config.showPlaceholder
            });
            setFramedImage(result);
        } catch (err) {
            console.error("Frame update failed", err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-soft-white text-tech-black font-sans">
            {/* Header */}
            <header className="p-6 flex items-center justify-between border-b border-tech-black/5 bg-white">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-tech-black/5 rounded-full transition">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-black uppercase tracking-tighter italic">Frame Studio</h1>
                </div>
                {framedImage && (
                    <a 
                        href={framedImage} 
                        download="studio-framed-image.png"
                        className="flex items-center gap-2 px-6 py-2 bg-u-orange text-white rounded-pill font-bold text-sm shadow-lg hover:brightness-110"
                    >
                        <Download size={18} /> EXPORT
                    </a>
                )}
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Controls */}
                <div className="w-80 bg-white border-r border-tech-black/5 p-6 overflow-y-auto space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-tech-black/40">1. Source Image</h3>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-tech-black/10 rounded-2xl cursor-pointer hover:border-u-orange transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload size={24} className="text-tech-black/20 mb-2" />
                                <p className="text-[10px] font-bold text-tech-black/40 uppercase">Click to upload</p>
                            </div>
                            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                        </label>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-tech-black/40">2. Select Frame</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {FRAMES.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setConfig({...config, frame: f.path})}
                                    className={`p-2 text-[8px] font-black uppercase tracking-tighter border-2 rounded-xl transition ${config.frame === f.path ? 'border-u-orange bg-u-orange/5 text-u-orange' : 'border-tech-black/5 hover:border-tech-black/20'}`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-tech-black/40">3. Background</h3>
                        <div className="flex gap-2">
                            {BACKGROUNDS.map(bg => (
                                <button
                                    key={bg.id}
                                    onClick={() => setConfig({...config, background: bg.path})}
                                    className={`flex-1 py-2 text-[8px] font-black uppercase tracking-tighter border-2 rounded-xl transition ${config.background === bg.path ? 'border-u-orange bg-u-orange/5 text-u-orange' : 'border-tech-black/5 hover:border-tech-black/20'}`}
                                >
                                    {bg.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-widest text-tech-black/40">4. Content Scale</h3>
                            <span className="text-[10px] font-black text-u-orange">{Math.round(config.scale * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="1.0" 
                            step="0.01" 
                            value={config.scale} 
                            onChange={(e) => setConfig({...config, scale: parseFloat(e.target.value)})}
                            className="w-full accent-u-orange"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-widest text-tech-black/40">5. Vertical Offset</h3>
                            <span className="text-[10px] font-black text-u-orange">{config.offsetY}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="-500" 
                            max="500" 
                            step="1" 
                            value={config.offsetY} 
                            onChange={(e) => setConfig({...config, offsetY: parseInt(e.target.value)})}
                            className="w-full accent-u-orange"
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-tech-black/5">
                        <label className="flex items-center justify-between cursor-pointer">
                            <h3 className="text-xs font-black uppercase tracking-widest text-tech-black/40">Show Orange Grid</h3>
                            <input 
                                type="checkbox" 
                                checked={config.showGrid} 
                                onChange={(e) => setConfig({...config, showGrid: e.target.checked})}
                                className="w-5 h-5 accent-u-orange"
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <h3 className="text-xs font-black uppercase tracking-widest text-tech-black/40">Show Placeholder</h3>
                            <input 
                                type="checkbox" 
                                checked={config.showPlaceholder} 
                                onChange={(e) => setConfig({...config, showPlaceholder: e.target.checked})}
                                className="w-5 h-5 accent-u-orange"
                            />
                        </label>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-tech-black/5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-tech-black/40">Target Area Mode</h3>
                            <input 
                                type="checkbox" 
                                checked={config.useTargetArea} 
                                onChange={(e) => setConfig({...config, useTargetArea: e.target.checked})}
                                className="w-5 h-5 accent-u-orange"
                            />
                        </div>
                        
                        {config.useTargetArea && (
                            <div className="grid grid-cols-2 gap-4">
                                {['x', 'y', 'w', 'h'].map(key => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-[10px] font-black text-tech-black/30 uppercase">{key}</label>
                                        <input 
                                            type="number"
                                            value={config.targetArea[key]}
                                            onChange={(e) => setConfig({
                                                ...config, 
                                                targetArea: { ...config.targetArea, [key]: parseInt(e.target.value) }
                                            })}
                                            className="w-full p-2 bg-soft-white border border-tech-black/5 rounded-lg text-xs font-bold"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Preview Area */}
                <div className="flex-1 bg-soft-white p-12 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    {framedImage ? (
                        <div className="relative max-h-full max-w-full shadow-2xl rounded-[32px] overflow-hidden bg-white animate-in zoom-in duration-500">
                            {processing && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
                                    <RefreshCw className="animate-spin text-u-orange" size={48} />
                                </div>
                            )}
                            <img src={framedImage} alt="Preview" className="max-h-[70vh] w-auto block" />
                        </div>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                                <ImageIcon size={48} className="text-tech-black/10" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-black uppercase tracking-tighter italic">No Image Selected</h2>
                                <p className="text-xs font-bold text-tech-black/40 uppercase tracking-widest">Upload a past result to test frames</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FrameStudioPage;