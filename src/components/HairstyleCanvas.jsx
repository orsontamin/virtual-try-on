import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

const HairstyleCanvas = ({ baseImage, hairstyleImage }) => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 500,
        height: 500,
        backgroundColor: '#1a1a1a',
      });

      console.log("Canvas init with hairstyle:", hairstyleImage);

      // Load User Base Image
      console.log("Loading base image...");
      fabric.Image.fromURL(baseImage, { crossOrigin: 'anonymous' }).then((img) => {
        console.log("Base image loaded");
        img.scaleToWidth(canvas.width);
        img.set({
          selectable: false,
          evented: false,
          left: 0,
          top: 0
        });
        canvas.add(img);
        canvas.sendObjectToBack(img);
        
        // Load Hairstyle Overlay
        if (hairstyleImage) {
            console.log("Loading hairstyle overlay:", hairstyleImage);
            fabric.Image.fromURL(hairstyleImage, { crossOrigin: 'anonymous' }).then((hair) => {
                console.log("Hairstyle overlay loaded successfully");
                hair.scaleToWidth(canvas.width * 0.6);
                hair.set({
                    left: canvas.width / 2,
                    top: canvas.height / 3,
                    originX: 'center',
                    originY: 'center',
                    opacity: 0.9,
                    cornerColor: '#f59e0b',
                    cornerStrokeColor: '#000',
                    transparentCorners: false,
                    cornerStyle: 'circle',
                    borderColor: '#f59e0b',
                    borderScaleFactor: 2
                });
                canvas.add(hair);
                canvas.setActiveObject(hair);
                setLoading(false);
                canvas.requestRenderAll();
            }).catch(err => {
                console.error("CRITICAL: Error loading hairstyle image:", err);
                // Fallback: Add a text label if image fails
                const text = new fabric.IText('Hairstyle Load Error\nTry another style', {
                    left: canvas.width / 2,
                    top: canvas.height / 2,
                    originX: 'center',
                    originY: 'center',
                    fontSize: 20,
                    fill: '#f59e0b',
                    backgroundColor: 'rgba(0,0,0,0.5)'
                });
                canvas.add(text);
                setLoading(false);
            });
        } else {
            console.warn("No hairstyle image provided to canvas");
            setLoading(false);
        }
      }).catch(err => {
          console.error("CRITICAL: Error loading base image:", err);
          setLoading(false);
      });

      setFabricCanvas(canvas);
      return () => canvas.dispose();
    }
  }, [baseImage, hairstyleImage]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative border-4 border-amber-600 rounded-xl overflow-hidden shadow-2xl bg-stone-900">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
        )}
        <canvas ref={canvasRef} />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest">
            Drag to position • Pinch/Scroll to Scale
        </p>
        <p className="text-[8px] text-amber-600/50 uppercase font-bold">
            Interactive Silhouette Matching
        </p>
      </div>
    </div>
  );
};

export default HairstyleCanvas;
