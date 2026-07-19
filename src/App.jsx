import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { UploadScreen } from './components/UploadScreen';
import { TopBar } from './components/TopBar';
import { BottomBar } from './components/Toolbars/BottomBar';
import { StackedTextBar } from './components/Toolbars/StackedTextBar';
import { StickersPopup } from './components/Popups/StickersPopup';
import { LayoutsPopup } from './components/Popups/LayoutsPopup';
import { AdjustPopup } from './components/Popups/AdjustPopup';
import { OverlayItem } from './components/OverlayItem';
import { CropTool } from './components/Popups/CropTool';
import { CustomLayoutBuilder } from './components/Popups/CustomLayoutBuilder';
import { LayersPanel } from './components/Popups/LayersPanel';
import { LayoutRenderer } from './components/LayoutRenderer';
import { FILTERS, DEFAULT_ADJUSTMENTS, DEFAULT_TEXT_STYLE } from './utils/constants';
import { exportImage } from './utils/canvasExport';
import { initFilterEngine, destroyFilterEngine, applyFilter, exportFiltered } from './filters/PixiFilterEngine';
import { useHistory } from './hooks/useHistory';

export default function App() {
    const [baseImageSrc, setBaseImageSrc] = useState(null);
    const [activeTool, setActiveTool] = useState(null);
    const [selectedOverlayId, setSelectedOverlayId] = useState(null);
    const [textStyle, setTextStyle] = useState({ ...DEFAULT_TEXT_STYLE });
    const [editingTextId, setEditingTextId] = useState(null);
    const [selectedCellIndex, setSelectedCellIndex] = useState(null);
    const [showLayers, setShowLayers] = useState(false);

    const { 
        state: canvasState, 
        commit: commitCanvasState, 
        updatePresent: updateCanvasState, 
        undo, redo, canUndo, canRedo, reset: resetCanvasState 
    } = useHistory({
        imageSrc: null,
        activeFilters: [],
        effect: 'none',
        adjustments: { ...DEFAULT_ADJUSTMENTS },
        overlays: [],
        aspectRatio: null
    });

    const { imageSrc, layout, activeFilters, adjustments, overlays, aspectRatio } = canvasState;

    const [filteredCanvasUrl, setFilteredCanvasUrl] = useState(null);

    const imgRef = useRef(null);
    const imageContentRef = useRef(null);
    const nextId = useRef(0);
    const [originalAspectRatio, setOriginalAspectRatio] = useState('1/1');

    // Compute original image aspect ratio when base image loads
    useEffect(() => {
        if (!baseImageSrc) return;
        const img = new Image();
        img.onload = () => {
            setOriginalAspectRatio(`${img.naturalWidth}/${img.naturalHeight}`);
        };
        img.src = baseImageSrc;
    }, [baseImageSrc]);

    // PixiJS Engine Lifecycle
    useEffect(() => {
        initFilterEngine();
        return () => destroyFilterEngine();
    }, []);

    // Pixi Filter Application Flow
    useEffect(() => {
        if (!imageSrc || layout) return; // Don't run Pixi in layout mode for now
        
        let isMounted = true;
        
        if (activeFilters && activeFilters.length > 0) {
            applyFilter(imageSrc, activeFilters)
                .then(url => {
                    if (isMounted) setFilteredCanvasUrl(url);
                })
                .catch(err => {
                    console.error("Pixi apply filter failed:", err);
                    if (isMounted) setFilteredCanvasUrl(null);
                });
        } else {
            setFilteredCanvasUrl(null);
        }
        
        return () => { isMounted = false; };
    }, [imageSrc, activeFilters, layout]);

    const handleReset = () => {
        setBaseImageSrc(null);
        resetCanvasState({
            imageSrc: null,
            activeFilters: [],
            frame: 'none',
            adjustments: { ...DEFAULT_ADJUSTMENTS },
            overlays: [],
            aspectRatio: null
        });
        setActiveTool(null);
        setSelectedOverlayId(null);
        setSelectedCellIndex(null);
    };

    const handleExport = () => {
        setSelectedOverlayId(null);
        setSelectedCellIndex(null);
        setActiveTool(null);
        // Delay to allow React to re-render (deselect overlays, hide handles)
        setTimeout(async () => {
            if (activeFilters && activeFilters.length > 0 && !layout) {
                try {
                    // Export the full-resolution filtered image via PixiJS
                    const fullResDataUrl = await exportFiltered(imageSrc, activeFilters);
                    exportImage({ imageSrc: fullResDataUrl, adjustments, overlays, imgRef, fullResOverrideUrl: fullResDataUrl });
                } catch (err) {
                    console.error("Pixi export failed:", err);
                    exportImage({ imageSrc, adjustments, overlays, imgRef });
                }
            } else {
                exportImage({ imageSrc, adjustments, overlays, imgRef });
            }
        }, 150);
    };

    const addText = useCallback((initialContent = '', initialStyle = null) => {
        const id = `text-${nextId.current++}`;
        commitCanvasState(prev => ({
            ...prev,
            overlays: [...prev.overlays, {
                id, type: 'text', content: initialContent, scale: 1, rotation: 0, style: initialStyle || { ...textStyle }
            }]
        }));
        setSelectedOverlayId(id);
        return id;
    }, [textStyle]);

    const handleInsertDate = useCallback((formatString) => {
        const d = new Date();
        let dateStr = '';
        if (formatString === 'MM DD YYYY') {
            const m = String(d.getMonth()+1).padStart(2,'0');
            const day = String(d.getDate()).padStart(2,'0');
            dateStr = `'${m} ${day} ${d.getFullYear()}`;
        } else if (formatString === 'YY/MM/DD') {
            const y = String(d.getFullYear()).slice(-2);
            const m = String(d.getMonth()+1).padStart(2,'0');
            const day = String(d.getDate()).padStart(2,'0');
            dateStr = `${y}/${m}/${day}`;
        } else if (formatString === 'HH:MM AM') {
            let h = d.getHours();
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            const min = String(d.getMinutes()).padStart(2,'0');
            dateStr = `${h}:${min} ${ampm}`;
        }
        const stampStyle = { ...DEFAULT_TEXT_STYLE, font: 'VT323', size: 38, color: '#f7c948', bold: false, italic: false, shadow: false };
        const id = `stamp-${nextId.current++}`;
        commitCanvasState(prev => ({
            ...prev,
            overlays: [...prev.overlays, {
                id, type: 'text', content: dateStr,
                x: 75, y: 85,
                scale: 1, rotation: 0, style: stampStyle
            }]
        }));
        setSelectedOverlayId(id);
    }, [nextId]);

    const addSticker = useCallback((emoji) => {
        const id = `sticker-${nextId.current++}`;
        commitCanvasState(prev => ({
            ...prev,
            overlays: [...prev.overlays, {
                id, type: 'sticker', content: emoji, scale: 1, rotation: 0
            }]
        }));
        setSelectedOverlayId(id);
    }, []);

    const handleUpdateOverlay = useCallback((id, updates) => {
        // We use updateCanvasState here to avoid spamming history during drags
        updateCanvasState(prev => ({
            ...prev,
            overlays: prev.overlays.map(o => o.id === id ? { ...o, ...updates } : o)
        }));
    }, [updateCanvasState]);

    const handleUpdateOverlayEnd = useCallback((id, updates = {}) => {
        // Called when a drag or scale gesture finishes to commit the final state
        commitCanvasState(prev => ({
            ...prev,
            overlays: prev.overlays.map(o => o.id === id ? { ...o, ...updates } : o)
        }));
    }, [commitCanvasState]);

    const handleDeleteOverlay = useCallback((idToDelete) => {
        const id = typeof idToDelete === 'string' ? idToDelete : selectedOverlayId;
        if (!id) return;
        commitCanvasState(prev => ({
            ...prev,
            overlays: prev.overlays.filter(o => o.id !== id)
        }));
        if (id === selectedOverlayId) {
            setSelectedOverlayId(null);
            // We intentionally do NOT close the text tool here.
            // This prevents the tool from closing if an empty text auto-deletes on blur
            // when the user is trying to click a toolbar button (like Date).
        }
    }, [selectedOverlayId]);

    // Style changes should update the style without deselecting text
    const handleStyleChange = useCallback((updates) => {
        setTextStyle(prev => {
            const newStyle = { ...prev, ...updates };
            // Also update the currently selected overlay's style
            if (selectedOverlayId) {
                updateCanvasState(prevCanvas => ({
                    ...prevCanvas,
                    overlays: prevCanvas.overlays.map(o => 
                        o.id === selectedOverlayId ? { ...o, style: { ...o.style, ...updates } } : o
                    )
                }));
            }
            return newStyle;
        });
    }, [selectedOverlayId, updateCanvasState]);

    const handleStyleChangeEnd = useCallback(() => {
        if (selectedOverlayId) {
            commitCanvasState(p => p);
        }
    }, [selectedOverlayId, commitCanvasState]);

    const handleReorderOverlay = useCallback((index, direction) => {
        commitCanvasState(prev => {
            const newOverlays = [...prev.overlays];
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= newOverlays.length) return prev;
            
            // Swap
            const temp = newOverlays[index];
            newOverlays[index] = newOverlays[newIndex];
            newOverlays[newIndex] = temp;
            
            return { ...prev, overlays: newOverlays };
        });
    }, [commitCanvasState]);

    const handleToolChange = useCallback((tool) => {
        if (tool === 'text') {
            // If no text overlay is selected, add one
            const hasSelectedText = selectedOverlayId && overlays.find(o => o.id === selectedOverlayId && o.type === 'text');
            if (!hasSelectedText) {
                addText();
            }
        }
        setActiveTool(tool);
    }, [selectedOverlayId, overlays, addText]);

    const handleCanvasClick = useCallback((e) => {
        if (e.target.id === 'editor-screen' || e.target.classList.contains('canvas-area') || e.target.classList.contains('image-wrapper')) {
            setSelectedOverlayId(null);
            setSelectedCellIndex(null);
            if (activeTool && activeTool !== 'crop' && activeTool !== 'filters') {
                setActiveTool(null);
            }
        }
    }, [activeTool]);

    const handleOverlaySelect = useCallback((id) => {
        setSelectedOverlayId(id);
        const overlay = overlays.find(o => o.id === id);
        if (overlay?.type === 'text') {
            // Load this overlay's style into the text style controls
            if (overlay.style) {
                setTextStyle(overlay.style);
            }
        }
    }, [overlays]);

    const handleTextDone = useCallback(() => {
        setSelectedOverlayId(null);
        setActiveTool(null);
        setEditingTextId(null);
    }, []);

    // Layout Cell Upload Logic
    const cellFileInputRef = useRef(null);
    const [targetCellIndex, setTargetCellIndex] = useState(null);

    const handleCellClick = useCallback((index) => {
        setTargetCellIndex(index);
        if (cellFileInputRef.current) cellFileInputRef.current.click();
    }, []);

    const handleCellFileChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file || targetCellIndex === null) return;
        const url = URL.createObjectURL(file);
        
        commitCanvasState(prev => {
            if (!prev.layout) return prev;
            const newCells = [...(prev.layout.cells || [])];
            newCells[targetCellIndex] = { ...newCells[targetCellIndex], imageSrc: url, transform: { x: 0, y: 0, scale: 1 } };
            return {
                ...prev,
                layout: { ...prev.layout, cells: newCells }
            };
        });
        
        e.target.value = '';
        setTargetCellIndex(null);
    }, [targetCellIndex, commitCanvasState]);

    const handleCellFileDrop = useCallback((index, file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        
        commitCanvasState(prev => {
            if (!prev.layout) return prev;
            const newCells = [...(prev.layout.cells || [])];
            newCells[index] = { ...newCells[index], imageSrc: url, transform: { x: 0, y: 0, scale: 1 } };
            return {
                ...prev,
                layout: { ...prev.layout, cells: newCells }
            };
        });
    }, [commitCanvasState]);

    const handleCellTransformChange = useCallback((index, newTransform) => {
        commitCanvasState(prev => {
            if (!prev.layout) return prev;
            const newCells = [...(prev.layout.cells || [])];
            newCells[index] = { ...newCells[index], transform: newTransform };
            return {
                ...prev,
                layout: { ...prev.layout, cells: newCells }
            };
        });
    }, [commitCanvasState]);

    const handleCellExtract = useCallback((index) => {
        commitCanvasState(prev => {
            if (!prev.layout || !prev.layout.cells[index]) return prev;
            const extractedSrc = prev.layout.cells[index].imageSrc;
            if (!extractedSrc) return prev;

            const newCells = [...prev.layout.cells];
            newCells[index] = { ...newCells[index], imageSrc: null, transform: { x: 0, y: 0, scale: 1 } };

            const id = `sticker-${nextId.current++}`;
            return {
                ...prev,
                layout: { ...prev.layout, cells: newCells },
                overlays: [...prev.overlays, {
                    id, type: 'sticker', content: extractedSrc, scale: 1, rotation: 0
                }]
            };
        });
    }, [commitCanvasState]);

    const handleStickerDropToLayout = useCallback((stickerId, cellIndex) => {
        commitCanvasState(prev => {
            if (!prev.layout || !prev.layout.cells) return prev;
            
            const sticker = prev.overlays.find(o => o.id === stickerId);
            if (!sticker || sticker.type !== 'sticker') return prev;

            const newCells = [...prev.layout.cells];
            newCells[cellIndex] = { ...newCells[cellIndex], imageSrc: sticker.content, transform: { x: 0, y: 0, scale: 1 } };

            return {
                ...prev,
                layout: { ...prev.layout, cells: newCells },
                overlays: prev.overlays.filter(o => o.id !== stickerId)
            };
        });
        setSelectedCellIndex(cellIndex);
    }, [commitCanvasState]);

    useEffect(() => {
        const handleDragMove = (e) => {
            if (e.detail.type !== 'sticker') return;
            const stickerElem = document.getElementById(e.detail.id);
            if (!stickerElem) return;

            const oldDisplay = stickerElem.style.display;
            stickerElem.style.display = 'none';
            const elem = document.elementFromPoint(e.detail.clientX, e.detail.clientY);
            stickerElem.style.display = oldDisplay;

            const cellElem = elem?.closest('.layout-cell');
            
            // clear highlights on all cells
            document.querySelectorAll('.layout-cell').forEach(el => {
                if (el !== cellElem) {
                    el.style.border = el.dataset.hasSrc === 'true' ? 'none' : '1.5px dashed rgba(255,255,255,0.2)';
                    el.style.background = el.dataset.hasSrc === 'true' ? 'transparent' : 'rgba(255,255,255,0.02)';
                }
            });

            if (cellElem && cellElem.dataset.hasSrc !== 'true') {
                cellElem.style.border = '2px solid var(--accent-1)';
                cellElem.style.background = 'rgba(100, 200, 255, 0.15)';
            }
        };

        const handleDragEnd = (e) => {
            if (e.detail.type !== 'sticker') return;
            const stickerElem = document.getElementById(e.detail.id);
            if (!stickerElem) return;

            const oldDisplay = stickerElem.style.display;
            stickerElem.style.display = 'none';
            const elem = document.elementFromPoint(e.detail.clientX, e.detail.clientY);
            stickerElem.style.display = oldDisplay;
            
            // clear highlights
            document.querySelectorAll('.layout-cell').forEach(el => {
                el.style.border = el.dataset.hasSrc === 'true' ? 'none' : '1.5px dashed rgba(255,255,255,0.2)';
                el.style.background = el.dataset.hasSrc === 'true' ? 'transparent' : 'rgba(255,255,255,0.02)';
            });

            const cellElem = elem?.closest('.layout-cell');
            
            if (cellElem && cellElem.dataset.hasSrc !== 'true') {
                const cellIndex = parseInt(cellElem.dataset.index, 10);
                if (!isNaN(cellIndex)) {
                    handleStickerDropToLayout(e.detail.id, cellIndex);
                }
            }
        };

        window.addEventListener('overlay-drag-move', handleDragMove);
        window.addEventListener('overlay-drag-end', handleDragEnd);
        return () => {
            window.removeEventListener('overlay-drag-move', handleDragMove);
            window.removeEventListener('overlay-drag-end', handleDragEnd);
        };
    }, [handleStickerDropToLayout]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === 'z') {
                    if (e.shiftKey) {
                        e.preventDefault();
                        redo();
                    } else {
                        e.preventDefault();
                        undo();
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const computedFilterCSS = useMemo(() => {
        const a = adjustments;
        
        const brightness = 1 + (a.exposure * 0.005) + (a.brightness * 0.003) + (a.highlights * 0.002) - (a.shadows * 0.001);
        const contrast = 1 + (a.contrast * 0.004) + (a.brilliance * 0.002) + (a.blackPoint * 0.001);
        const saturate = 1 + (a.saturation * 0.008) + (a.vibrance * 0.004);
        const sepia = (a.warmth > 0 ? a.warmth * 0.003 : 0);
        const hue = (a.warmth < 0 ? a.warmth * 0.1 : 0) + (a.tint * 0.2);
        
        let css = '';
        if (activeFilters && activeFilters.length > 0) {
            for (const f of activeFilters) {
                if (!f.visible) continue;
                const base = FILTERS[f.id]?.css || 'none';
                if (base !== 'none') {
                    const intensity = f.intensity / 100;
                    let scaledBase = base;
                    if (intensity !== 1) {
                        scaledBase = base.replace(/([a-z-]+)\(([^)]+)\)/g, (match, func, valStr) => {
                            let defaultVal = 1;
                            let unit = '';
                            if (func === 'sepia' || func === 'grayscale' || func === 'blur' || func === 'hue-rotate') defaultVal = 0;
                            if (valStr.endsWith('deg')) { unit = 'deg'; valStr = valStr.slice(0, -3); }
                            else if (valStr.endsWith('px')) { unit = 'px'; valStr = valStr.slice(0, -2); }
                            let val = parseFloat(valStr);
                            let scaled = defaultVal + (val - defaultVal) * intensity;
                            return `${func}(${scaled}${unit})`;
                        });
                    }
                    css += scaledBase + ' ';
                }
            }
        }
        css += `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;
        if (sepia > 0) css += ` sepia(${sepia})`;
        if (Math.abs(hue) > 0) css += ` hue-rotate(${hue}deg)`;
        if (a.fade > 0) css += ` opacity(${1 - a.fade*0.003})`;
        if (a.blur > 0) css += ` blur(${a.blur*0.1}px)`;
        return css;
    }, [activeFilters, adjustments]);

    const getLayoutAspectRatio = () => {
        if (!layout) return originalAspectRatio;
        if (layout.aspectRatio) return layout.aspectRatio;
        if (layout.type === 'split-v') return '16/9';
        if (layout.type === 'split-h') return '4/5';
        if (layout.type === 'grid-2x2') return '1/1';
        if (layout.type === 'tri-panel') return '4/5';
        return originalAspectRatio;
    };

    const currentAR = getLayoutAspectRatio();
    const [arW, arH] = currentAR.split('/').map(Number);
    const dummySvg = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${(arW || 1) * 1000}' height='${(arH || 1) * 1000}' viewBox='0 0 ${arW || 1} ${arH || 1}'%3E%3C/svg%3E`;

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            {!baseImageSrc ? (
                <UploadScreen onImageUpload={(src) => {
                    setBaseImageSrc(src);
                    resetCanvasState({
                        imageSrc: src,
                        layout: null, // null means single image
                        activeFilters: [],
                        filter: 'original',
                        effect: 'none',
                        adjustments: { ...DEFAULT_ADJUSTMENTS },
                        overlays: [],
                        aspectRatio: null
                    });
                }} />
            ) : (
                <div id="editor-screen">
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={cellFileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleCellFileChange} 
                    />
                    <TopBar 
                        onReset={handleReset} 
                        onExport={handleExport}
                        undo={undo}
                        redo={redo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                    />

                    {activeTool === 'crop' && (
                        <CropTool
                            baseImageSrc={layout && selectedCellIndex !== null ? layout.cells[selectedCellIndex].imageSrc : baseImageSrc}
                            onApply={(croppedUrl) => {
                                commitCanvasState(p => {
                                    if (p.layout && selectedCellIndex !== null) {
                                        const newCells = [...p.layout.cells];
                                        newCells[selectedCellIndex] = { ...newCells[selectedCellIndex], imageSrc: croppedUrl };
                                        return { ...p, layout: { ...p.layout, cells: newCells } };
                                    }
                                    return { ...p, imageSrc: croppedUrl };
                                });
                                setActiveTool(null);
                            }}
                            onClose={() => setActiveTool(null)}
                        />
                    )}

                    {activeTool === 'layout-builder' && (
                        <CustomLayoutBuilder
                            initialLayout={layout}
                            originalAspectRatio={originalAspectRatio}
                            onApply={(newLayout) => {
                                commitCanvasState(p => {
                                    // Give the original image to the first box so it doesn't disappear
                                    const updatedCells = [...newLayout.cells];
                                    if (updatedCells.length > 0) {
                                        updatedCells[0] = { ...updatedCells[0], imageSrc: p.imageSrc, transform: { x: 0, y: 0, scale: 1 } };
                                    }
                                    return { ...p, layout: { ...newLayout, cells: updatedCells } };
                                });
                                setActiveTool(null);
                            }}
                            onCancel={() => setActiveTool(null)}
                        />
                    )}

                    <div className="canvas-area" onClick={handleCanvasClick}>
                        <div className={`image-wrapper`} style={{ backgroundColor: adjustments.canvasBg, '--polaroid-padding': `${adjustments.polaroidPadding}px ${adjustments.polaroidPadding}px ${adjustments.polaroidPadding * 3.5}px ${adjustments.polaroidPadding}px` }} onClick={handleCanvasClick}>
                            <div ref={imageContentRef} className={`image-content-layer`} style={{ position: 'relative', display: 'flex', width: '100%', height: '100%' }}>
                                <img 
                                    ref={imgRef}
                                    id="editor-image" 
                                    src={layout ? dummySvg : (filteredCanvasUrl || imageSrc)} 
                                    style={{ 
                                        display: 'block', 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'fill', 
                                        filter: filteredCanvasUrl ? 'none' : computedFilterCSS, 
                                        visibility: layout ? 'hidden' : 'visible' 
                                    }}
                                    alt="Editing"
                                    crossOrigin={layout || filteredCanvasUrl ? undefined : "anonymous"}
                                />
                                {layout && (
                                    <LayoutRenderer 
                                        id="editor-image-layout" 
                                        layout={layout} 
                                        baseImageSrc={imageSrc}
                                        onCellClick={handleCellClick}
                                        onCellFileDrop={handleCellFileDrop}
                                        onCellTransformChange={handleCellTransformChange}
                                        onCellExtract={handleCellExtract}
                                        onCellSelect={(index) => setSelectedCellIndex(index)}
                                        selectedCellIndex={selectedCellIndex}
                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10, filter: computedFilterCSS }}
                                    />
                                )}

                            {/* Halation Effect */}
                            {adjustments.halation > 0 && (
                                <>
                                    <img 
                                        src={layout ? dummySvg : imageSrc} 
                                        style={{ 
                                            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none',
                                            filter: computedFilterCSS + ` blur(${adjustments.halation * 0.15}px) sepia(1) hue-rotate(-20deg) saturate(2.5) contrast(1.2)`, 
                                            mixBlendMode: 'screen', opacity: adjustments.halation * 0.006,
                                            visibility: layout ? 'hidden' : 'visible'
                                        }} 
                                    />
                                    {layout && (
                                        <LayoutRenderer 
                                            layout={layout} baseImageSrc={imageSrc} 
                                            onCellTransformChange={handleCellTransformChange}
                                            style={{ 
                                                position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
                                                filter: computedFilterCSS + ` blur(${adjustments.halation * 0.15}px) sepia(1) hue-rotate(-20deg) saturate(2.5) contrast(1.2)`, 
                                                mixBlendMode: 'screen', opacity: adjustments.halation * 0.006,
                                            }} 
                                        />
                                    )}
                                </>
                            )}

                            {/* Aberration Effect */}
                            {adjustments.aberration > 0 && (
                                <>
                                    <img src={layout ? dummySvg : imageSrc} style={{ 
                                        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none',
                                        filter: computedFilterCSS + ' sepia(1) hue-rotate(-50deg) saturate(3) brightness(0.8)', 
                                        mixBlendMode: 'lighten', opacity: adjustments.aberration * 0.008,
                                        transform: `translate(${adjustments.aberration * 0.05}px, 0)`,
                                        visibility: layout ? 'hidden' : 'visible'
                                    }} />
                                    <img src={layout ? dummySvg : imageSrc} style={{ 
                                        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none',
                                        filter: computedFilterCSS + ' sepia(1) hue-rotate(90deg) saturate(3) brightness(0.8)', 
                                        mixBlendMode: 'lighten', opacity: adjustments.aberration * 0.008,
                                        transform: `translate(-${adjustments.aberration * 0.05}px, 0)`,
                                        visibility: layout ? 'hidden' : 'visible'
                                    }} />
                                    {layout && (
                                        <>
                                            <LayoutRenderer layout={layout} baseImageSrc={imageSrc} onCellTransformChange={handleCellTransformChange} style={{ 
                                                position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
                                                filter: computedFilterCSS + ' sepia(1) hue-rotate(-50deg) saturate(3) brightness(0.8)', 
                                                mixBlendMode: 'lighten', opacity: adjustments.aberration * 0.008,
                                                transform: `translate(${adjustments.aberration * 0.05}px, 0)` 
                                            }} />
                                            <LayoutRenderer layout={layout} baseImageSrc={imageSrc} onCellTransformChange={handleCellTransformChange} style={{ 
                                                position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
                                                filter: computedFilterCSS + ' sepia(1) hue-rotate(90deg) saturate(3) brightness(0.8)', 
                                                mixBlendMode: 'lighten', opacity: adjustments.aberration * 0.008,
                                                transform: `translate(-${adjustments.aberration * 0.05}px, 0)` 
                                            }} />
                                        </>
                                    )}
                                </>
                            )}

                            {/* Glitch Effect Clones */}
                            {adjustments.glitch > 0 && (
                                <>
                                    <img src={layout ? dummySvg : imageSrc} style={{ 
                                        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none',
                                        filter: computedFilterCSS + ' sepia(1) hue-rotate(-50deg) saturate(3)', 
                                        mixBlendMode: 'screen', opacity: adjustments.glitch * 0.007,
                                        transform: `translate(${adjustments.glitch * 0.15}px, -${adjustments.glitch * 0.05}px)`,
                                        visibility: layout ? 'hidden' : 'visible'
                                    }} />
                                    <img src={layout ? dummySvg : imageSrc} style={{ 
                                        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none',
                                        filter: computedFilterCSS + ' sepia(1) hue-rotate(90deg) saturate(3)', 
                                        mixBlendMode: 'screen', opacity: adjustments.glitch * 0.007,
                                        transform: `translate(-${adjustments.glitch * 0.15}px, ${adjustments.glitch * 0.05}px)`,
                                        visibility: layout ? 'hidden' : 'visible'
                                    }} />
                                    {layout && (
                                        <>
                                            <LayoutRenderer layout={layout} baseImageSrc={imageSrc} onCellTransformChange={handleCellTransformChange} style={{ 
                                                position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
                                                filter: computedFilterCSS + ' sepia(1) hue-rotate(-50deg) saturate(3)', 
                                                mixBlendMode: 'screen', opacity: adjustments.glitch * 0.007,
                                                transform: `translate(${adjustments.glitch * 0.15}px, -${adjustments.glitch * 0.05}px)` 
                                            }} />
                                            <LayoutRenderer layout={layout} baseImageSrc={imageSrc} onCellTransformChange={handleCellTransformChange} style={{ 
                                                position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
                                                filter: computedFilterCSS + ' sepia(1) hue-rotate(90deg) saturate(3)', 
                                                mixBlendMode: 'screen', opacity: adjustments.glitch * 0.007,
                                                transform: `translate(-${adjustments.glitch * 0.15}px, ${adjustments.glitch * 0.05}px)` 
                                            }} />
                                        </>
                                    )}
                                </>
                            )}
                            {/* Split-Toning */}
                            {adjustments.shadowsTint && adjustments.shadowsTint !== '#000000' && (
                                <div className="split-tone-shadows" style={{
                                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9,
                                    background: adjustments.shadowsTint,
                                    mixBlendMode: 'screen', opacity: 0.5
                                }}></div>
                            )}
                            {adjustments.highlightsTint && adjustments.highlightsTint !== '#ffffff' && (
                                <div className="split-tone-highlights" style={{
                                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9,
                                    background: adjustments.highlightsTint,
                                    mixBlendMode: 'multiply', opacity: 0.5
                                }}></div>
                            )}

                            {/* Pixi filters handle advanced overlays automatically */}

                            <div className="vignette-overlay" style={{ 
                                opacity: adjustments.vignette * 0.01, 
                                zIndex: 11,
                                background: `radial-gradient(circle, transparent 40%, ${adjustments.vignetteColor || '#000000'} 100%)`,
                                mixBlendMode: (adjustments.vignetteColor && adjustments.vignetteColor !== '#000000') ? 'overlay' : 'multiply'
                            }}></div>
                            <div className="grain-overlay" style={{ 
                                opacity: adjustments.grain * 0.005,
                                background: adjustments.grain > 0 ? `url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="${1.0 - (adjustments.grainSize * 0.08)}" numOctaves="3" stitchTiles="stitch"/%3E${adjustments.grainColor ? '' : '%3CfeColorMatrix type="saturate" values="0"/%3E'}%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')` : undefined
                            }}></div>

                            <div className="overlays-container">
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: 'rgba(0,0,0,0.4)',
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                    opacity: editingTextId ? 1 : 0,
                                    pointerEvents: 'none',
                                    transition: 'opacity 0.2s, backdrop-filter 0.2s',
                                    zIndex: 40,
                                    transform: 'translateZ(0)',
                                    willChange: 'opacity, transform'
                                }}></div>
                                {overlays.map(item => (
                                    <OverlayItem 
                                        key={item.id} 
                                        item={item} 
                                        isSelected={item.id === selectedOverlayId}
                                        onSelect={() => handleOverlaySelect(item.id)}
                                        onUpdate={handleUpdateOverlay}
                                        onUpdateEnd={handleUpdateOverlayEnd}
                                        onTextChange={(id, content) => commitCanvasState(prev => ({...prev, overlays: prev.overlays.map(o => o.id === id ? { ...o, content } : o)}))}
                                        onDelete={handleDeleteOverlay}
                                        onEditChange={(isEditing) => {
                                            setEditingTextId(isEditing ? item.id : null);
                                            if (isEditing) setActiveTool('text');
                                        }}
                                    />
                                ))}
                                </div>
                                
                                {/* Layers Floating Button */}
                                {!editingTextId && (
                                    <button 
                                        className={`layers-toggle-btn glass-surface ${showLayers ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setShowLayers(p => !p); }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                        <polyline points="2 12 12 17 22 12" />
                                        <polyline points="2 17 12 22 22 17" />
                                    </svg>
                                    </button>
                                )}

                                {/* Layers Panel */}
                                {showLayers && (
                                    <div 
                                        onClick={(e) => e.stopPropagation()} 
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        <LayersPanel 
                                            overlays={overlays}
                                            activeFilters={activeFilters}
                                            updateActiveFilters={(newFilters) => commitCanvasState(p => ({ ...p, activeFilters: newFilters }))}
                                            selectedOverlayId={selectedOverlayId}
                                            onSelect={handleOverlaySelect}
                                            onReorder={handleReorderOverlay}
                                            onDelete={handleDeleteOverlay}
                                            onClose={() => setShowLayers(false)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Instagram-Style Vertical Text Size Slider */}
                            {activeTool === 'text' && (
                                <div className="vertical-size-slider-container">
                                    <div className="vertical-track">
                                        <div className="tapering-fill" style={{ height: `${((textStyle.size - 12) / (120 - 12)) * 100}%` }}></div>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="12" max="120" 
                                        value={textStyle.size}
                                        className="vertical-slider-input"
                                        onChange={(e) => handleStyleChange({ size: parseInt(e.target.value) })}
                                        onPointerUp={handleStyleChangeEnd}
                                        onKeyUp={handleStyleChangeEnd}
                                        orient="vertical"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Popups for Stickers, Adjust & Layouts */}
                    {activeTool === 'layouts' && (
                        <LayoutsPopup
                            onClose={() => setActiveTool(null)}
                            currentLayout={layout}
                            onSelectLayout={(layoutId) => {
                                commitCanvasState(p => {
                                    if (layoutId === 'single') return { ...p, layout: null };
                                    return { ...p, layout: { type: layoutId, cells: [{ imageSrc: p.imageSrc, transform: { x: 0, y: 0, scale: 1 } }] } };
                                });
                            }}
                            onOpenBuilder={() => setActiveTool('layout-builder')}
                            canvasBg={adjustments.canvasBg}
                            onBgChange={(color) => updateCanvasState(p => ({ ...p, adjustments: { ...p.adjustments, canvasBg: color } }))}
                        />
                    )}
                    {activeTool === 'stickers' && (
                        <StickersPopup 
                            onClose={() => setActiveTool(null)} 
                            onAddSticker={addSticker} 
                        />
                    )}
                    {activeTool === 'adjust' && (
                        <AdjustPopup 
                            onClose={() => setActiveTool(null)}
                            adjustments={adjustments}
                            onAdjust={(param, val) => updateCanvasState(p => ({ ...p, adjustments: { ...p.adjustments, [param]: val } }))}
                            onAdjustEnd={() => commitCanvasState(p => p)}
                        />
                    )}

                    {/* Stacked Bars */}
                    <div className="stacked-bars-container">
                        {activeTool === 'text' && (
                            <StackedTextBar 
                                textStyle={textStyle}
                                onStyleChange={handleStyleChange}
                                onDone={handleTextDone}
                                onDelete={handleDeleteOverlay}
                                onInsertDate={handleInsertDate}
                            />
                        )}
                        <BottomBar 
                            activeTool={activeTool} 
                            setActiveTool={handleToolChange}
                            activeFilters={activeFilters}
                            setActiveFilters={(f) => commitCanvasState(p => ({...p, activeFilters: f}))}
                            commitIntensity={() => commitCanvasState(p => p)}
                            imageSrc={imageSrc}
                            isCropDisabled={!!layout && selectedCellIndex === null}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
