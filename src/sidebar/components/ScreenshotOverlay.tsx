import React, { useState, useRef, useEffect } from 'react';

interface ScreenshotPath {
    path: string;
    previews?: PreviewItem[];
}

interface PreviewItem {
    preview: string;
    label?: string;
}

interface ScreenshotOverlayProps {
    screenshotPath: ScreenshotPath;
    setScreenshotPath: (path: ScreenshotPath | null) => void;
}

interface CropRect {
    top: number;
    left: number;
    right: number;
    bottom: number;
}

interface ImgDragRef {
    isDragging: boolean;
    lastX: number;
    lastY: number;
}

interface CropDragRef {
    activeHandle: string | null;
    startX: number;
    startY: number;
    startCrop: CropRect | null;
}

interface DrawRef {
    isDrawing: boolean;
    lastX: number;
    lastY: number;
}

const ScreenshotOverlay: React.FC<ScreenshotOverlayProps> = ({ screenshotPath, setScreenshotPath }) => {
    const [activePreviewIndex, setActivePreviewIndex] = useState(0);
    const [previews, setPreviews] = useState<PreviewItem[]>(screenshotPath.previews || []);
    const [isCopied, setIsCopied] = useState(false);
    const [isCropModified, setIsCropModified] = useState(false);
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [imgScale, setImgScale] = useState(1);
    const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
    const [crop, setCrop] = useState<CropRect>({ top: 0, left: 0, right: 0, bottom: 0 });

    const imgDragRef = useRef<ImgDragRef>({ isDragging: false, lastX: 0, lastY: 0 });
    const cropDragRef = useRef<CropDragRef>({ activeHandle: null, startX: 0, startY: 0, startCrop: null });
    const drawRef = useRef<DrawRef>({ isDrawing: false, lastX: 0, lastY: 0 });
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const annotationCanvasRef = useRef<HTMLCanvasElement>(null);

    const currentPreview = previews[activePreviewIndex]?.preview;

    useEffect(() => {
        setPreviews(screenshotPath.previews || []);
        setActivePreviewIndex(0);
        setImgScale(1);
        setImgOffset({ x: 0, y: 0 });
        setIsCropModified(false);
        setIsAnnotating(false);

        if (annotationCanvasRef.current) {
            const ctx = annotationCanvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, annotationCanvasRef.current.width, annotationCanvasRef.current.height);
        }
    }, [screenshotPath]);

    useEffect(() => {
        setImgScale(1);
        setImgOffset({ x: 0, y: 0 });
        setIsCropModified(false);
        setIsAnnotating(false);

        if (annotationCanvasRef.current) {
            const ctx = annotationCanvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, annotationCanvasRef.current.width, annotationCanvasRef.current.height);
        }

        const initTimer = setTimeout(() => {
            if (imgRef.current && imgRef.current.complete) {
                console.log('Image already loaded from cache, initializing crop');
                initializeCrop();
            }
        }, 100);

        return () => clearTimeout(initTimer);
    }, [activePreviewIndex, currentPreview]);

    const initializeCrop = () => {
        if (!imgRef.current || !containerRef.current) return;
        const img = imgRef.current;
        const container = containerRef.current;

        const containerRect = container.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();

        console.log('initializeCrop:', {
            containerWidth: containerRect.width,
            containerHeight: containerRect.height,
            imgWidth: imgRect.width,
            imgHeight: imgRect.height,
            imgLeft: imgRect.left - containerRect.left,
            imgTop: imgRect.top - containerRect.top
        });

        if (!imgRect.width || !imgRect.height || !containerRect.width || !containerRect.height) return;

        const leftPercent = ((imgRect.left - containerRect.left) / containerRect.width) * 100;
        const topPercent = ((imgRect.top - containerRect.top) / containerRect.height) * 100;
        const rightPercent = ((containerRect.right - imgRect.right) / containerRect.width) * 100;
        const bottomPercent = ((containerRect.bottom - imgRect.bottom) / containerRect.height) * 100;

        setCrop({
            top: Math.max(0, topPercent),
            left: Math.max(0, leftPercent),
            right: Math.max(0, rightPercent),
            bottom: Math.max(0, bottomPercent)
        });
        setIsCropModified(false);
    };

    const handleReset = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setImgScale(1);
        setImgOffset({ x: 0, y: 0 });
        setIsCropModified(false);
        setIsAnnotating(false);

        const originalPreviews = screenshotPath.previews || [];
        if (originalPreviews[activePreviewIndex]) {
            const newPreviews = [...previews];
            newPreviews[activePreviewIndex] = { ...originalPreviews[activePreviewIndex] };
            setPreviews(newPreviews);
            window.electronAPI.saveEditedImage(screenshotPath.path, originalPreviews[activePreviewIndex].preview);
        }

        if (annotationCanvasRef.current) {
            const ctx = annotationCanvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, annotationCanvasRef.current.width, annotationCanvasRef.current.height);
        }

        requestAnimationFrame(() => {
            initializeCrop();
            setTimeout(initializeCrop, 100);
        });
    };

    const handleDisplayChange = (index: number) => {
        if (index === activePreviewIndex) return;
        window.electronAPI.saveEditedImage(screenshotPath.path, previews[index].preview);
        setActivePreviewIndex(index);
    };

    const handleDrawStart = (e: React.PointerEvent) => {
        if (!isAnnotating || !annotationCanvasRef.current) return;
        e.stopPropagation();
        const rect = annotationCanvasRef.current.getBoundingClientRect();
        const scaleX = annotationCanvasRef.current.width / rect.width;
        const scaleY = annotationCanvasRef.current.height / rect.height;
        
        drawRef.current = {
            isDrawing: true,
            lastX: (e.clientX - rect.left) * scaleX,
            lastY: (e.clientY - rect.top) * scaleY
        };
        
        const ctx = annotationCanvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(drawRef.current.lastX, drawRef.current.lastY);
        ctx.lineTo(drawRef.current.lastX, drawRef.current.lastY);
        ctx.stroke();
    };

    const handleDrawMove = (e: React.PointerEvent) => {
        if (!drawRef.current.isDrawing || !annotationCanvasRef.current) return;
        e.stopPropagation();
        const rect = annotationCanvasRef.current.getBoundingClientRect();
        const scaleX = annotationCanvasRef.current.width / rect.width;
        const scaleY = annotationCanvasRef.current.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const ctx = annotationCanvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(drawRef.current.lastX, drawRef.current.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        drawRef.current.lastX = x;
        drawRef.current.lastY = y;
        setIsCropModified(true);
    };

    const handleDrawEnd = () => {
        drawRef.current.isDrawing = false;
    };

    const applyCrop = async () => {
        if (!imgRef.current || !containerRef.current) return;
        
        const img = imgRef.current;
        const containerRect = containerRef.current.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();

        const cropLeftPx = (crop.left / 100) * containerRect.width;
        const cropTopPx = (crop.top / 100) * containerRect.height;
        const cropRightPx = containerRect.width - (crop.right / 100) * containerRect.width;
        const cropBottomPx = containerRect.height - (crop.bottom / 100) * containerRect.height;

        const cropAbsLeft = containerRect.left + cropLeftPx;
        const cropAbsTop = containerRect.top + cropTopPx;
        const cropAbsRight = containerRect.left + cropRightPx;
        const cropAbsBottom = containerRect.top + cropBottomPx;

        const intersectLeft = Math.max(cropAbsLeft, imgRect.left);
        const intersectTop = Math.max(cropAbsTop, imgRect.top);
        const intersectRight = Math.min(cropAbsRight, imgRect.right);
        const intersectBottom = Math.min(cropAbsBottom, imgRect.bottom);

        const intersectWidth = intersectRight - intersectLeft;
        const intersectHeight = intersectBottom - intersectTop;

        if (intersectWidth <= 0 || intersectHeight <= 0) return;

        const scaleX = img.naturalWidth / imgRect.width;
        const scaleY = img.naturalHeight / imgRect.height;

        const realLeft = (intersectLeft - imgRect.left) * scaleX;
        const realTop = (intersectTop - imgRect.top) * scaleY;
        const realWidth = intersectWidth * scaleX;
        const realHeight = intersectHeight * scaleY;

        const canvas = document.createElement('canvas');
        canvas.width = realWidth;
        canvas.height = realHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const tempImg = new Image();
        tempImg.onload = () => {
            ctx.drawImage(tempImg, realLeft, realTop, realWidth, realHeight, 0, 0, realWidth, realHeight);
            
            if (annotationCanvasRef.current) {
                ctx.drawImage(annotationCanvasRef.current, realLeft, realTop, realWidth, realHeight, 0, 0, realWidth, realHeight);
            }

            const newBase64 = canvas.toDataURL('image/png');
            
            const newPreviews = [...previews];
            newPreviews[activePreviewIndex] = { ...newPreviews[activePreviewIndex], preview: newBase64 };
            setPreviews(newPreviews);
            
            window.electronAPI.saveEditedImage(screenshotPath.path, newBase64);
            
            setImgScale(1);
            setImgOffset({ x: 0, y: 0 });
            setIsCropModified(false);
            setIsAnnotating(false);
            
            if (annotationCanvasRef.current) {
                const ctx = annotationCanvasRef.current.getContext('2d');
                ctx?.clearRect(0, 0, annotationCanvasRef.current.width, annotationCanvasRef.current.height);
            }
        };
        tempImg.src = currentPreview;
    };

    const handleCropStart = (e: React.PointerEvent, handle: string) => {
        e.stopPropagation();
        cropDragRef.current = {
            activeHandle: handle,
            startX: e.clientX,
            startY: e.clientY,
            startCrop: { ...crop }
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleCropMove = (e: React.PointerEvent) => {
        const { activeHandle, startX, startY, startCrop } = cropDragRef.current;
        if (!activeHandle || !startCrop) return;
        e.stopPropagation();
        const container = (e.currentTarget as HTMLElement).closest('.screenshot-preview-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const moveX = ((e.clientX - startX) / rect.width) * 100;
        const moveY = ((e.clientY - startY) / rect.height) * 100;
        const newCrop = { ...startCrop };
        if (activeHandle.includes('top')) newCrop.top = Math.max(0, Math.min(100 - startCrop.bottom - 5, startCrop.top + moveY));
        if (activeHandle.includes('bottom')) newCrop.bottom = Math.max(0, Math.min(100 - startCrop.top - 5, startCrop.bottom - moveY));
        if (activeHandle.includes('left')) newCrop.left = Math.max(0, Math.min(100 - startCrop.right - 5, startCrop.left + moveX));
        if (activeHandle.includes('right')) newCrop.right = Math.max(0, Math.min(100 - startCrop.left - 5, startCrop.right - moveX));
        setCrop(newCrop);
        setIsCropModified(true);
    };

    const handleCropUp = (e: React.PointerEvent) => {
        cropDragRef.current.activeHandle = null;
        if ((e.currentTarget as HTMLElement).releasePointerCapture) {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
    };

    const handleImgWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(10, imgScale * delta));
        setImgScale(newScale);
    };

    const handleImgPointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        imgDragRef.current.isDragging = true;
        imgDragRef.current.lastX = e.clientX;
        imgDragRef.current.lastY = e.clientY;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleImgPointerMove = (e: React.PointerEvent) => {
        if (!imgDragRef.current.isDragging) return;
        e.stopPropagation();
        const deltaX = e.clientX - imgDragRef.current.lastX;
        const deltaY = e.clientY - imgDragRef.current.lastY;
        setImgOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        imgDragRef.current.lastX = e.clientX;
        imgDragRef.current.lastY = e.clientY;
    };

    const handleImgPointerUp = (e: React.PointerEvent) => {
        imgDragRef.current.isDragging = false;
        if ((e.currentTarget as HTMLElement).releasePointerCapture) {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div className="screenshot-overlay">
            <button 
                className="overlay-close" 
                onClick={(e) => {
                    e.stopPropagation();
                    setScreenshotPath(null);
                    setIsCopied(false);
                }}
            >
                <i className="fas fa-times"></i>
            </button>

            <div className="screenshot-overlay-header">
                <i className="fas fa-check-circle success-icon"></i>
                <span className="success-text">截图成功</span>
                {previews.length > 1 && (
                    <div className="display-tabs">
                        {previews.map((preview, index) => (
                            <button 
                                key={index} 
                                className={`display-tab-btn ${activePreviewIndex === index ? 'active' : ''}`}
                                onClick={() => handleDisplayChange(index)}
                            >
                                {preview.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="screenshot-preview-container" 
                 ref={containerRef}
                 onWheel={handleImgWheel}
                 onPointerDown={(e) => {
                     if (isAnnotating) handleDrawStart(e);
                     else handleImgPointerDown(e);
                 }}
                 onPointerMove={(e) => {
                     if (isAnnotating) handleDrawMove(e);
                     else if (cropDragRef.current.activeHandle) handleCropMove(e);
                     else handleImgPointerMove(e);
                 }}
                 onPointerUp={(e) => {
                     if (isAnnotating) handleDrawEnd();
                     else if (cropDragRef.current.activeHandle) handleCropUp(e);
                     else handleImgPointerUp(e);
                 }}
                 onPointerCancel={(e) => {
                     if (isAnnotating) handleDrawEnd();
                     else if (cropDragRef.current.activeHandle) handleCropUp(e);
                     else handleImgPointerUp(e);
                 }}
                 style={{ touchAction: 'none' }}
            >
                <div className="crop-wrapper" style={{ 
                    transform: `translate(${imgOffset.x}px, ${imgOffset.y}px) scale(${imgScale})`,
                    transition: (imgDragRef.current.isDragging || cropDragRef.current.activeHandle || drawRef.current.isDrawing) ? 'none' : 'transform 0.1s ease-out'
                }}>
                    <img 
                        ref={imgRef}
                        src={currentPreview} 
                        alt="Screenshot Preview" 
                        className="screenshot-preview-img"
                        draggable={false}
                        onLoad={(e) => {
                            const img = e.currentTarget;
                            console.log('Image onLoad:', img.naturalWidth, img.naturalHeight);
                            if (annotationCanvasRef.current) {
                                annotationCanvasRef.current.width = img.naturalWidth;
                                annotationCanvasRef.current.height = img.naturalHeight;
                            }
                            requestAnimationFrame(() => {
                                initializeCrop();
                                setTimeout(initializeCrop, 50);
                            });
                        }}
                    />
                    <canvas
                        ref={annotationCanvasRef}
                        className="annotation-canvas"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: isAnnotating ? 'auto' : 'none',
                            zIndex: 8
                        }}
                    />
                </div>
                
                <div className="crop-overlay-mask" style={{ top: 0, left: 0, right: 0, height: `${crop.top}%` }}></div>
                <div className="crop-overlay-mask" style={{ bottom: 0, left: 0, right: 0, height: `${crop.bottom}%` }}></div>
                <div className="crop-overlay-mask" style={{ top: `${crop.top}%`, left: 0, width: `${crop.left}%`, bottom: `${crop.bottom}%` }}></div>
                <div className="crop-overlay-mask" style={{ top: `${crop.top}%`, right: 0, width: `${crop.right}%`, bottom: `${crop.bottom}%` }}></div>

                <div className="crop-selection-area" style={{ 
                    top: `${crop.top}%`, 
                    left: `${crop.left}%`, 
                    right: `${crop.right}%`, 
                    bottom: `${crop.bottom}%` 
                }}>
                    <div className="crop-handle handle-tl" onPointerDown={(e) => handleCropStart(e, 'top-left')}></div>
                    <div className="crop-handle handle-tr" onPointerDown={(e) => handleCropStart(e, 'top-right')}></div>
                    <div className="crop-handle handle-bl" onPointerDown={(e) => handleCropStart(e, 'bottom-left')}></div>
                    <div className="crop-handle handle-br" onPointerDown={(e) => handleCropStart(e, 'bottom-right')}></div>
                    <div className="crop-edge edge-t" onPointerDown={(e) => handleCropStart(e, 'top')}></div>
                    <div className="crop-edge edge-b" onPointerDown={(e) => handleCropStart(e, 'bottom')}></div>
                    <div className="crop-edge edge-l" onPointerDown={(e) => handleCropStart(e, 'left')}></div>
                    <div className="crop-edge edge-r" onPointerDown={(e) => handleCropStart(e, 'right')}></div>
                </div>
            </div>

            <div className="overlay-actions-horizontal">
                <button 
                    className={`overlay-btn-small ${isAnnotating ? 'active' : ''}`} 
                    onClick={() => setIsAnnotating(!isAnnotating)}
                    style={{ backgroundColor: isAnnotating ? 'rgba(239, 68, 68, 0.1)' : '' }}
                >
                    <i className="fas fa-pen" style={{ color: isAnnotating ? '#ef4444' : '' }}></i>
                    <span>{isAnnotating ? '正在标注' : '标注'}</span>
                </button>

                {isCropModified ? (
                    <button className="overlay-btn-small crop-confirm" onClick={applyCrop}>
                        <i className="fas fa-check"></i>
                        <span>保存更改</span>
                    </button>
                ) : (
                    <button 
                        className="overlay-btn-small" 
                        title="复制图片"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.electronAPI.copyImage(screenshotPath.path);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                        }}
                    >
                        <i className={`fas ${isCopied ? 'fa-check' : 'fa-copy'}`}></i>
                        <span>{isCopied ? '已复制' : '复制'}</span>
                    </button>
                )}
                
                <button className="overlay-btn-small" onClick={handleReset}>
                    <i className="fas fa-undo"></i>
                    <span>重置</span>
                </button>

                <button 
                    className="overlay-btn-small" 
                    title="所在文件夹"
                    onClick={(e) => {
                        e.stopPropagation();
                        window.electronAPI.openFolder(screenshotPath.path);
                    }}
                >
                    <i className="fas fa-folder-open"></i>
                    <span>文件</span>
                </button>
            </div>
        </div>
    );
};

export default ScreenshotOverlay;
