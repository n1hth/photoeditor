import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * LayoutRenderer — renders layout cells on the main editor canvas.
 * Supports preset grid types (split-v, split-h, grid-2x2, tri-panel) and freeform.
 */
export function LayoutRenderer({ layout, baseImageSrc, onCellClick, onCellFileDrop, onCellTransformChange, onCellExtract, onCellSelect, selectedCellIndex, style = {}, id }) {
    if (!layout) return null;

    const isFreeform = layout.type === 'freeform';

    // Build container style
    const containerStyle = {
        width: '100%', height: '100%',
        position: 'relative',
        ...style
    };

    if (!isFreeform) {
        containerStyle.display = 'grid';
        containerStyle.gap = '4px';
        if (layout.type === 'split-v') {
            containerStyle.gridTemplateColumns = '1fr 1fr';
        } else if (layout.type === 'split-h') {
            containerStyle.gridTemplateRows = '1fr 1fr';
        } else if (layout.type === 'grid-2x2') {
            containerStyle.gridTemplateColumns = '1fr 1fr';
            containerStyle.gridTemplateRows = '1fr 1fr';
        } else if (layout.type === 'tri-panel') {
            containerStyle.gridTemplateColumns = '2fr 1fr';
            containerStyle.gridTemplateRows = '1fr 1fr';
        }
    }

    // Determine cell count for preset types
    const cells = layout.cells || [];
    let cellCount;
    if (isFreeform) {
        cellCount = cells.length;
    } else if (layout.type === 'grid-2x2') {
        cellCount = 4;
    } else if (layout.type === 'tri-panel') {
        cellCount = 3;
    } else if (layout.type === 'single') {
        cellCount = 1;
    } else {
        cellCount = 2;
    }

    const renderedCells = [];
    for (let i = 0; i < cellCount; i++) {
        const cell = cells[i];
        const src = cell?.imageSrc || null;
        const transform = cell?.transform || { x: 0, y: 0, scale: 1 };

        let cellStyle = {};
        if (isFreeform && cell) {
            cellStyle = {
                position: 'absolute',
                left: `${cell.x}%`, top: `${cell.y}%`,
                width: `${cell.w}%`, height: `${cell.h}%`,
            };
        }
        // tri-panel: first cell spans 2 rows
        if (layout.type === 'tri-panel' && i === 0) {
            cellStyle.gridRow = '1 / 3';
        }

        renderedCells.push(
            <LayoutCell
                key={cell?.id || `preset-${i}`}
                index={i}
                src={src}
                transform={transform}
                style={cellStyle}
                isSelected={selectedCellIndex === i}
                onSelect={() => onCellSelect && onCellSelect(i)}
                onAddClick={() => onCellClick && onCellClick(i)}
                onFileDrop={(file) => onCellFileDrop && onCellFileDrop(i, file)}
                onTransformChange={(t) => onCellTransformChange && onCellTransformChange(i, t)}
                onExtract={() => onCellExtract && onCellExtract(i)}
            />
        );
    }

    return (
        <div className="layout-renderer" id={id} style={containerStyle}>
            {renderedCells}
        </div>
    );
}

/**
 * LayoutCell — single cell inside the layout.
 * Empty: dashed border + plus + "DROP IMAGE"
 * Filled: image with pan (drag) + zoom (scroll)
 * Supports drag-and-drop files from OS
 */
function LayoutCell({ index, src, transform, onAddClick, onTransformChange, onFileDrop, onExtract, onSelect, isSelected, style = {} }) {
    const [localTransform, setLocalTransform] = useState(transform);
    const [isDragOver, setIsDragOver] = useState(false);
    const panState = useRef({ active: false, startX: 0, startY: 0 });
    const cellRef = useRef(null);
    
    const [cellDims, setCellDims] = useState({ w: 1, h: 1 });
    const [imgDims, setImgDims] = useState({ w: 1, h: 1 });

    useEffect(() => {
        if (!cellRef.current) return;
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                setCellDims({ w: entries[0].contentRect.width, h: entries[0].contentRect.height });
            }
        });
        observer.observe(cellRef.current);
        return () => observer.disconnect();
    }, []);

    // Sync external transform
    useEffect(() => { setLocalTransform(transform); }, [transform]);

    // Calculate cover dimensions
    const scaleX = cellDims.w / (imgDims.w || 1);
    const scaleY = cellDims.h / (imgDims.h || 1);
    const coverScale = Math.max(scaleX, scaleY);
    const renderW = imgDims.w * coverScale;
    const renderH = imgDims.h * coverScale;

    // -- Pan handlers --
    const onPanMove = useCallback((e) => {
        if (!panState.current.active) return;
        setLocalTransform(prev => {
            const { startX, startY } = panState.current;
            let newX = e.clientX - startX;
            let newY = e.clientY - startY;
            
            const maxX = Math.max(0, (renderW * prev.scale - cellDims.w) / 2);
            const maxY = Math.max(0, (renderH * prev.scale - cellDims.h) / 2);
            
            newX = Math.max(-maxX, Math.min(maxX, newX));
            newY = Math.max(-maxY, Math.min(maxY, newY));
            
            return { ...prev, x: newX, y: newY };
        });
    }, [renderW, renderH, cellDims]);

    const onPanUp = useCallback(() => {
        if (!panState.current.active) return;
        panState.current.active = false;
        document.body.style.userSelect = '';
        setLocalTransform(prev => {
            setTimeout(() => onTransformChange(prev), 0);
            return prev;
        });
    }, [onTransformChange]);

    useEffect(() => {
        window.addEventListener('pointermove', onPanMove);
        window.addEventListener('pointerup', onPanUp);
        return () => {
            window.removeEventListener('pointermove', onPanMove);
            window.removeEventListener('pointerup', onPanUp);
        };
    }, [onPanMove, onPanUp]);

    const handlePointerDown = (e) => {
        if (!src) return;
        // Don't pan if clicking an action button inside the cell
        if (e.target.closest('button')) return;
        
        e.stopPropagation();
        panState.current = {
            active: true,
            startX: e.clientX - localTransform.x,
            startY: e.clientY - localTransform.y
        };
        document.body.style.userSelect = 'none';
    };

    const handleWheel = (e) => {
        if (!src) return;
        e.preventDefault();
        const delta = -e.deltaY * 0.004;
        setLocalTransform(prev => {
            const newScale = Math.max(1, Math.min(prev.scale * (1 + delta), 8)); // scale min 1
            
            // Re-eval bounds after scale change so it doesn't get stuck outside
            let nextX = prev.x;
            let nextY = prev.y;
            const maxX = Math.max(0, (renderW * newScale - cellDims.w) / 2);
            const maxY = Math.max(0, (renderH * newScale - cellDims.h) / 2);
            nextX = Math.max(-maxX, Math.min(maxX, nextX));
            nextY = Math.max(-maxY, Math.min(maxY, nextY));

            const next = { ...prev, scale: newScale, x: nextX, y: nextY };
            setTimeout(() => onTransformChange(next), 0);
            return next;
        });
    };

    // -- Drag-and-drop --
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (!isDragOver) setIsDragOver(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file && onFileDrop) onFileDrop(file);
    };

    return (
        <div
            ref={cellRef}
            className="layout-cell"
            data-index={index}
            data-has-src={!!src}
            onClick={(e) => { e.stopPropagation(); if (src && onSelect) onSelect(); }}
            onPointerDown={handlePointerDown}
            onWheel={handleWheel}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative',
                background: src ? 'transparent' : 'rgba(255,255,255,0.02)',
                border: isDragOver
                    ? '2px solid var(--accent-1)'
                    : (isSelected ? '2px solid #fff' : (src ? 'none' : '1.5px dashed rgba(255,255,255,0.2)')),
                borderRadius: '4px',
                cursor: src ? 'grab' : 'default',
                touchAction: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease, background 0.15s ease',
                ...style
            }}
        >
            {/* Drop highlight overlay */}
            {isDragOver && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'var(--accent-1)', opacity: 0.15,
                    zIndex: 10, borderRadius: 'inherit',
                    pointerEvents: 'none'
                }} />
            )}

            {src ? (
                <>
                    <div style={{
                        width: `${renderW}px`, height: `${renderH}px`,
                        transform: `translate(${localTransform.x}px, ${localTransform.y}px) scale(${localTransform.scale})`,
                        transformOrigin: 'center center',
                        pointerEvents: 'none',
                        position: 'absolute'
                    }}>
                        <img
                            src={src}
                            alt=""
                            draggable={false}
                            onLoad={(e) => setImgDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
                            style={{ width: '100%', height: '100%', display: 'block' }}
                        />
                    </div>
                    
                    {/* Extract button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); if(onExtract) onExtract(); }}
                        style={{
                            position: 'absolute', top: '8px', right: '8px', zIndex: 20,
                            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
                            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', cursor: 'pointer', opacity: 0.8
                        }}
                        title="Extract to Canvas"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                    </button>
                </>
            ) : (
                <button
                    onClick={(e) => { e.stopPropagation(); onAddClick(); }}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '40px', height: '40px',
                        background: 'transparent',
                        border: '1.5px solid rgba(255,255,255,0.4)',
                        borderRadius: '50%',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'background 0.2s, border-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
