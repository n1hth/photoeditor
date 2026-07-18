import React, { useState, useRef, useEffect, useCallback } from 'react';

const snap = (val, step = 5) => Math.round(val / step) * step;
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const ASPECT_RATIOS = [
    { label: 'Original', value: 'original' },
    { label: '1:1', value: '1/1' },
    { label: '4:5', value: '4/5' },
    { label: '16:9', value: '16/9' },
    { label: '9:16', value: '9/16' },
];

const BOX_SHAPES = [
    { label: 'Free', w: 40, h: 40, icon: null },
    { label: 'Square', w: 35, h: 35, icon: { w: 12, h: 12 } },
    { label: 'Classic H', w: 40, h: 30, icon: { w: 14, h: 11 } },
    { label: 'Classic V', w: 30, h: 40, icon: { w: 11, h: 14 } },
    { label: 'Landscape', w: 48, h: 27, icon: { w: 16, h: 9 } },
    { label: 'Portrait', w: 27, h: 48, icon: { w: 9, h: 16 } },
];

export function CustomLayoutBuilder({ initialLayout, originalAspectRatio, onApply, onCancel }) {
    const defaultAR = originalAspectRatio || '1/1';
    const [aspectRatio, setAspectRatio] = useState(
        initialLayout?.aspectRatio || defaultAR
    );
    const [customW, setCustomW] = useState('1080');
    const [customH, setCustomH] = useState('1080');
    const [cells, setCells] = useState(
        initialLayout?.type === 'freeform' ? [...initialLayout.cells] : []
    );
    const [selectedId, setSelectedId] = useState(null);
    const [showSizePanel, setShowSizePanel] = useState(false);
    const canvasRef = useRef(null);
    const dragRef = useRef({
        active: false, type: null, cellId: null,
        startX: 0, startY: 0, original: null
    });

    // --- Global pointer handlers ---
    const onPointerMove = useCallback((e) => {
        const d = dragRef.current;
        if (!d.active || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const dx = ((e.clientX - d.startX) / rect.width) * 100;
        const dy = ((e.clientY - d.startY) / rect.height) * 100;
        const o = d.original;

        setCells(prev => prev.map(c => {
            if (c.id !== d.cellId) return c;
            let { x, y, w, h } = o;

            if (d.type === 'move') {
                x = snap(clamp(o.x + dx, 0, 100 - o.w));
                y = snap(clamp(o.y + dy, 0, 100 - o.h));
            } else {
                const MIN = 10;
                let newX = o.x;
                let newY = o.y;
                let newW = o.w;
                let newH = o.h;

                if (c.fixedRatio) {
                     const isHeightDriven = d.type === 'n' || d.type === 's';
                     
                     if (isHeightDriven) {
                         if (d.type.includes('n')) {
                             const shift = snap(clamp(dy, -o.y, o.h - MIN));
                             newH = o.h - shift;
                             newW = newH * c.fixedRatio;
                             newY = o.y + shift;
                         } else {
                             newH = snap(clamp(o.h + dy, MIN, 100 - o.y));
                             newW = newH * c.fixedRatio;
                         }
                         if (newW + o.x > 100) {
                             newW = 100 - o.x;
                             newH = newW / c.fixedRatio;
                             if (d.type.includes('n')) newY = o.y + (o.h - newH);
                         }
                     } else {
                         if (d.type.includes('w')) {
                             const shift = snap(clamp(dx, -o.x, o.w - MIN));
                             newW = o.w - shift;
                             newH = newW / c.fixedRatio;
                             newX = o.x + shift;
                         } else {
                             newW = snap(clamp(o.w + dx, MIN, 100 - o.x));
                             newH = newW / c.fixedRatio;
                         }
                         
                         if (d.type.includes('n')) {
                             newY = o.y + (o.h - newH);
                             if (newY < 0) {
                                 newY = 0;
                                 newH = o.y + o.h;
                                 newW = newH * c.fixedRatio;
                                 if (d.type.includes('w')) newX = o.x + (o.w - newW);
                             }
                         } else {
                             if (newH + o.y > 100) {
                                 newH = 100 - o.y;
                                 newW = newH * c.fixedRatio;
                                 if (d.type.includes('w')) newX = o.x + (o.w - newW);
                             }
                         }
                     }
                } else {
                    if (d.type.includes('w')) {
                        const shift = snap(clamp(dx, -o.x, o.w - MIN));
                        newX = o.x + shift;
                        newW = o.w - shift;
                    }
                    if (d.type.includes('e')) {
                        newW = snap(clamp(o.w + dx, MIN, 100 - o.x));
                    }
                    if (d.type.includes('n')) {
                        const shift = snap(clamp(dy, -o.y, o.h - MIN));
                        newY = o.y + shift;
                        newH = o.h - shift;
                    }
                    if (d.type.includes('s')) {
                        newH = snap(clamp(o.h + dy, MIN, 100 - o.y));
                    }
                }
                x = newX; y = newY; w = newW; h = newH;
            }
            return { ...c, x, y, w, h };
        }));
    }, []);

    const onPointerUp = useCallback(() => {
        if (dragRef.current.active) {
            dragRef.current.active = false;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }
    }, []);

    useEffect(() => {
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [onPointerMove, onPointerUp]);

    const startDrag = (e, cell, type) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedId(cell.id);
        dragRef.current = {
            active: true, type, cellId: cell.id,
            startX: e.clientX, startY: e.clientY,
            original: { ...cell }
        };
        document.body.style.userSelect = 'none';
        if (type !== 'move') document.body.style.cursor = `${type}-resize`;
    };

    const addBox = (shape) => {
        const id = `cell-${Date.now()}`;
        
        // Calculate the physical size so it drops in with the exact visual aspect ratio
        const parseRatio = (ar) => {
            if (!ar) return 1;
            const [w, h] = String(ar).split('/');
            return h ? Number(w) / Number(h) : Number(w);
        };
        const canvasAR = parseRatio(aspectRatio);
        const boxAR = shape.w / shape.h;

        let finalW = shape.w;
        let finalH = finalW * (canvasAR / boxAR);

        // Constrain to reasonable maximum percentage size (80%)
        if (finalH > 80) {
            finalH = 80;
            finalW = finalH * (boxAR / canvasAR);
        }
        if (finalW > 80) {
            finalW = 80;
            finalH = finalW * (canvasAR / boxAR);
        }

        const newCell = { 
            id, x: 20, y: 20, w: finalW, h: finalH,
            fixedRatio: shape.label !== 'Free' ? finalW / finalH : null
        };
        setCells(prev => [...prev, newCell]);
        setSelectedId(id);
    };

    const deleteSelected = () => {
        setCells(prev => prev.filter(c => c.id !== selectedId));
        setSelectedId(null);
    };

    const handleApplyCustomSize = () => {
        const w = parseInt(customW) || 1080;
        const h = parseInt(customH) || 1080;
        // Convert to CSS aspect-ratio string
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const d = gcd(w, h);
        setAspectRatio(`${w / d}/${h / d}`);
        setShowSizePanel(false);
    };

    return (
        <div className="custom-layout-builder-root">
            <div className="layout-glow-bg layout-glow-1" />
            <div className="layout-glow-bg layout-glow-2" />

            {/* ── Top Bar ── */}
            <header className="layout-glass-header">
                <button onClick={onCancel} style={{ ...topBtnStyle, color: '#a1a1aa' }}>Cancel</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                    <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px', color: '#fff' }}>
                        Custom Layout
                    </span>
                </div>
                <button
                    onClick={() => onApply({ type: 'freeform', cells, aspectRatio })}
                    style={{ background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '8px 20px', border: 'none', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)' }}
                >
                    Apply
                </button>
            </header>

            {/* ── Main Workspace ── */}
            <main className="layout-main-container">
                
                {/* ── Aspect Ratio Top Panel ── */}
                <div className="layout-aspect-panel">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 600, letterSpacing: '1px', margin: 0 }}>
                            Select Canvas Aspect Ratio
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#71717a' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            <span>Canvas dimensions resize automatically</span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {ASPECT_RATIOS.map(ar => {
                            const val = ar.value === 'original' ? defaultAR : ar.value;
                            const isActive = aspectRatio === val;
                            return (
                                <button
                                    key={ar.value}
                                    onClick={() => {
                                        setAspectRatio(val);
                                        setShowSizePanel(false);
                                    }}
                                    style={{
                                        padding: '6px 14px', borderRadius: '9999px',
                                        border: '1px solid',
                                        borderColor: isActive ? 'transparent' : 'rgba(255,255,255,0.1)',
                                        background: isActive ? '#4f46e5' : 'rgba(24, 24, 27, 0.6)',
                                        color: isActive ? '#fff' : '#a1a1aa',
                                        fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                                        transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                                        boxShadow: isActive ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none'
                                    }}
                                >{ar.label}</button>
                            );
                        })}
                        <button
                            onClick={() => setShowSizePanel(!showSizePanel)}
                            style={{
                                padding: '6px 14px', borderRadius: '9999px',
                                border: '1px solid',
                                borderColor: showSizePanel ? 'transparent' : 'rgba(255,255,255,0.1)',
                                background: showSizePanel ? '#4f46e5' : 'rgba(24, 24, 27, 0.6)',
                                color: showSizePanel ? '#fff' : '#a1a1aa',
                                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                                transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                                boxShadow: showSizePanel ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none'
                            }}
                        >
                            Custom Size
                        </button>
                    </div>

                    {showSizePanel && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '12px', borderRadius: '12px',
                            background: 'rgba(24, 24, 27, 0.5)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            marginTop: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: 'monospace' }}>Width (px)</span>
                                <input
                                    type="number" value={customW}
                                    onChange={e => setCustomW(e.target.value)}
                                    style={dimInputStyle}
                                />
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: '0 4px' }}>×</span>
                                <span style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: 'monospace' }}>Height (px)</span>
                                <input
                                    type="number" value={customH}
                                    onChange={e => setCustomH(e.target.value)}
                                    style={dimInputStyle}
                                />
                            </div>
                            <button onClick={handleApplyCustomSize} style={{
                                padding: '6px 12px', borderRadius: '8px', border: 'none',
                                background: '#6366f1', color: '#fff',
                                fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                            }}>Apply Size</button>
                        </div>
                    )}
                </div>

                {/* ── Split Layout: Canvas + Right Sidebar ── */}
                <div className="layout-workspace-split">
                    
                    {/* ── Left side: Canvas + Docked Toolbar ── */}
                    <div className="layout-canvas-area">
                        <div className="layout-canvas-wrapper" onClick={() => setSelectedId(null)}>
                            {(() => {
                                const parseRatio = (ar) => {
                                    if (!ar) return 1;
                                    const [w, h] = String(ar).split('/');
                                    return h ? Number(w) / Number(h) : Number(w);
                                };
                                const ratioNum = parseRatio(aspectRatio);
                                return (
                                    <div
                                        ref={canvasRef}
                                        style={{
                                            position: 'relative',
                                            width: '100%',
                                            maxWidth: ratioNum >= 1 ? '560px' : `${480 * ratioNum}px`,
                                            maxHeight: ratioNum < 1 ? '480px' : `${560 / ratioNum}px`,
                                            minWidth: '220px',
                                            minHeight: '220px',
                                            aspectRatio: aspectRatio,
                                            background: 'rgba(24, 24, 27, 0.8)',
                                            backdropFilter: 'blur(16px)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: '12px',
                                            boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
                                            touchAction: 'none',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Subtle grid dots */}
                                        <div style={{
                                            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.2,
                                            backgroundSize: '40px 40px',
                                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)'
                                        }} />

                                        {/* Cells */}
                                {cells.map(cell => {
                                    const isSel = selectedId === cell.id;
                                    return (
                                        <div
                                            key={cell.id}
                                            onPointerDown={e => startDrag(e, cell, 'move')}
                                            onClick={e => { e.stopPropagation(); setSelectedId(cell.id); }}
                                            style={{
                                                position: 'absolute',
                                                left: `${cell.x}%`, top: `${cell.y}%`,
                                                width: `${cell.w}%`, height: `${cell.h}%`,
                                                background: isSel ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                                                backdropFilter: 'blur(4px)',
                                                border: isSel ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.15)',
                                                borderRadius: '8px',
                                                cursor: 'move',
                                                touchAction: 'none',
                                                boxSizing: 'border-box',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: isSel ? 'none' : 'background 0.2s ease, border-color 0.2s ease',
                                                boxShadow: isSel ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none'
                                            }}
                                        >
                                            {/* Plus icon */}
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                style={{ opacity: isSel ? 0.8 : 0.3, pointerEvents: 'none', color: isSel ? '#818cf8' : '#fff' }}>
                                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>

                                            {/* Delete Button (Separated from Block) */}
                                            {isSel && (
                                                <button
                                                    onPointerDown={(e) => {
                                                        e.stopPropagation();
                                                        deleteSelected();
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        [cell.y + cell.h > 85 ? 'bottom' : 'top']: 'calc(100% + 12px)',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        padding: '8px 16px',
                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                        backdropFilter: 'blur(12px)',
                                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                                        borderRadius: '12px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                        cursor: 'pointer', zIndex: 50,
                                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                                                        color: '#ef4444',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                    Delete
                                                </button>
                                            )}

                                            {/* Resize Handles */}
                                            {isSel && ['nw', 'ne', 'sw', 'se'].map(pos => (
                                                <div
                                                    key={pos}
                                                    onPointerDown={e => startDrag(e, cell, pos)}
                                                    style={{
                                                        position: 'absolute',
                                                        width: '16px', height: '16px',
                                                        background: '#fff',
                                                        border: '3px solid #818cf8',
                                                        borderRadius: '50%',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                                        cursor: `${pos}-resize`,
                                                        zIndex: 5,
                                                        [pos.includes('n') ? 'top' : 'bottom']: '-8px',
                                                        [pos.includes('w') ? 'left' : 'right']: '-8px',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                                );
                            })()}
                        </div>

                        {/* Docked Toolbar */}
                        <div className="layout-docked-toolbar">
                            <div className="layout-toolbar-inner">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '12px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Add Block</span>
                                </div>

                                {BOX_SHAPES.map(shape => (
                                    <button
                                        key={shape.label}
                                        onClick={() => addBox(shape)}
                                        className="layout-toolbar-btn"
                                    >
                                        {shape.icon ? (
                                            <div style={{
                                                width: `${shape.icon.w}px`, height: `${shape.icon.h}px`,
                                                border: '2px solid currentColor', borderRadius: '3px'
                                            }} />
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                        )}
                                        <span>{shape.label}</span>
                                    </button>
                                ))}

                                {/* Delete button moved to the block itself */}
                            </div>
                        </div>
                    </div>

                    {/* ── Right side: Sidebar Placeholder ── */}
                    <aside className="layout-glass-sidebar">
                        {selectedId ? (
                            <div className="layout-sidebar-card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1' }} />
                                        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#fff', fontWeight: 600, letterSpacing: '1px', margin: 0 }}>
                                            Edit Element
                                        </h3>
                                    </div>
                                </div>
                                <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.5 }}>
                                    Drag the selected block inside the canvas to reposition it, or use the corner handles to resize.
                                </p>
                            </div>
                        ) : (
                            <div className="layout-sidebar-card" style={{ alignItems: 'center', textAlign: 'center', opacity: 0.6 }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                                <p style={{ fontSize: '13px', color: '#e4e4e7' }}>Select an element on the canvas to view its properties.</p>
                            </div>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
}

// ── Shared Styles ──
const topBtnStyle = {
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.7)', fontSize: '14px',
    fontWeight: 500, cursor: 'pointer', padding: '4px'
};

const dimInputStyle = {
    width: '70px', padding: '6px 10px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px', color: '#fff',
    fontSize: '13px', textAlign: 'center',
    outline: 'none'
};

const toolBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s ease'
};
