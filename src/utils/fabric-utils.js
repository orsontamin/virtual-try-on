import * as fabric from 'fabric';

export const createDeleteControl = () => {
    const deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='435.375' r='105'/%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/svg%3E";
    const img = document.createElement('img');
    img.src = deleteIcon;

    return new fabric.Control({
        x: 0.5,
        y: -0.5,
        offsetY: -16,
        offsetX: 16,
        cursorStyle: 'pointer',
        mouseUpHandler: (eventData, transform) => {
            const target = transform.target;
            const canvas = target.canvas;
            canvas.remove(target);
            canvas.requestRenderAll();
            return true;
        },
        render: (ctx, left, top, styleOverride, fabricObject) => {
            const size = 24;
            ctx.save();
            ctx.translate(left, top);
            ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
            ctx.drawImage(img, -size/2, -size/2, size, size);
            ctx.restore();
        },
        cornerSize: 24
    });
};

export const applyStickerSettings = (obj, deleteControl) => {
    obj.set({
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        hasBorders: true,
    });

    obj.controls = {
        deleteControl: deleteControl
    };
    
    obj.setControlsVisibility({
        tl: false, tr: false, br: false, bl: false,
        ml: false, mr: false, mt: false, mb: false,
        mtr: false
    });
};
