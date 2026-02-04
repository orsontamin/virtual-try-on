import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as fabric from 'fabric';
import { createDeleteControl, applyStickerSettings } from '../utils/fabric-utils';

const DesignCanvas = ({ onCanvasReady, initialDesign }) => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const isInitRef = useRef(false);
  const isLoadedRef = useRef(false);
  const guideState = useRef({ showV: false, showH: false });
  
  const deleteControl = useMemo(() => createDeleteControl(), []);

  const DEFAULT_SHIRT = '/assets/shirts/base-canvas-black-shirt.png';
  const currentShirt = DEFAULT_SHIRT; // Force use of base-canvas-black-shirt

  const CM_TO_PX = 10; 
  const SHIRT_WIDTH_CM = 55; // Natural width for relative scaling

  const lockBackground = (obj) => {
      obj.set({
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          isBackground: true,
          hoverCursor: 'default'
      });
  };

  const addBackground = (canvas, imgSrc) => {
      // Clear any potential leftover backgrounds first
      const existing = canvas.getObjects().filter(o => o.isBackground);
      existing.forEach(o => canvas.remove(o));

      return fabric.Image.fromURL(imgSrc, { crossOrigin: 'anonymous' }).then((img) => {
          // Use natural aspect ratio based on a fixed width (1cm = 10px)
          img.scaleToWidth(SHIRT_WIDTH_CM * CM_TO_PX);
          
          img.set({
              left: canvas.width / 2, 
              top: canvas.height / 2, 
              originX: 'center', 
              originY: 'center' 
          });
          lockBackground(img);
          canvas.add(img);
          canvas.sendObjectToBack(img);
          canvas.requestRenderAll();
          return img;
      });
  };

  // 1. Initialize Canvas & Load Logic
  useEffect(() => {
    if (canvasRef.current && !isInitRef.current) {
      isInitRef.current = true;
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 625,
        height: 750,
        backgroundColor: 'transparent',
      });

      // Alignment Guide logic
      canvas.on('object:moving', (e) => {
        const obj = e.target;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const snapRange = 10;
        let showV = false;
        let showH = false;
        if (Math.abs(obj.left - centerX) < snapRange) { obj.set({ left: centerX }); showV = true; }
        if (Math.abs(obj.top - centerY) < snapRange) { obj.set({ top: centerY }); showH = true; }
        guideState.current = { showV, showH };
        canvas.requestRenderAll();
      });

      canvas.on('before:render', () => { if (canvas.contextTop) canvas.clearContext(canvas.contextTop); });
      canvas.on('after:render', () => {
          if ((guideState.current.showV || guideState.current.showH) && canvas.contextContainer) {
              const ctx = canvas.contextContainer;
              ctx.save();
              ctx.setLineDash([5, 5]);
              ctx.strokeStyle = '#ff7b00';
              ctx.lineWidth = 1;
              if (guideState.current.showV) { ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke(); }
              if (guideState.current.showH) { ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke(); }
              ctx.restore();
          }
      });

      canvas.on('object:modified', () => { guideState.current = { showV: false, showH: false }; canvas.requestRenderAll(); });
      canvas.on('selection:cleared', () => { guideState.current = { showV: false, showH: false }; canvas.requestRenderAll(); });

      // LOGIC: Always add background first, then load stickers on top
      addBackground(canvas, currentShirt).then(() => {
          if (initialDesign && initialDesign.objects) {
              // Use enlivenObjects to add stickers manually without clearing the background
              fabric.util.enlivenObjects(initialDesign.objects).then((enlivenedObjects) => {
                  enlivenedObjects.forEach(obj => {
                      if (obj.isBackground) {
                          // Skip backgrounds found in JSON to avoid duplicates
                          return;
                      }
                      applyStickerSettings(obj, deleteControl);
                      canvas.add(obj);
                  });
                  isLoadedRef.current = true;
                  canvas.requestRenderAll();
              });
          } else {
              isLoadedRef.current = true;
          }
      });

      setFabricCanvas(canvas);
      if (onCanvasReady) onCanvasReady(canvas);
      return () => { isInitRef.current = false; canvas.dispose(); };
    }
  }, []); 

  // 2. Surgical Background Update
  useEffect(() => {
    if (fabricCanvas && isLoadedRef.current) {
       const objects = fabricCanvas.getObjects();
       const bgObjects = objects.filter(o => o.isBackground);
       const mainBg = bgObjects[0];
       
       // If source changed, replace it
       if (mainBg && mainBg.getSrc() !== currentShirt) {
           bgObjects.forEach(o => fabricCanvas.remove(o));
           addBackground(fabricCanvas, currentShirt);
       } else if (bgObjects.length === 0) {
           // No background found, add one
           addBackground(fabricCanvas, currentShirt);
       } else if (bgObjects.length > 1) {
           // Cleanup duplicates if they somehow got in
           bgObjects.slice(1).forEach(o => fabricCanvas.remove(o));
       }
    }
  }, [currentShirt, fabricCanvas]); 

  return (
    <div className="flex justify-center items-center bg-transparent p-2 border-4 border-u-orange rounded-[32px] shadow-2xl overflow-hidden max-w-full">
      <div className="relative w-full overflow-auto flex justify-center">
        <canvas ref={canvasRef} className="max-w-full h-auto" />
      </div>
    </div>
  );
};

export default DesignCanvas;