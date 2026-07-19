import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGestures } from '../hooks/useGestures';

export function OverlayItem({ item, isSelected, onSelect, onUpdate, onUpdateEnd, onTextChange, onDelete, onEditChange }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const hasMounted = useRef(false);
    const textRef    = useRef(null);

    /* ------------------------------------------------------------------ */
    /*  Gestures                                                          */
    /* ------------------------------------------------------------------ */
    
    // We bind useGestures to the WRAPPER element.
    const { elementRef } = useGestures({
        id: item.id,
        type: item.type,
        scale:    item.scale,
        rotation: item.rotation,
        onSelect,
        onUpdate: useCallback(
            (s, r) => onUpdate(item.id, { scale: s, rotation: r }),
            [item.id, onUpdate],
        ),
        onUpdateEnd: useCallback(
            (updates) => onUpdateEnd(item.id, updates),
            [item.id, onUpdateEnd]
        ),
    });

    useEffect(() => {
        if (!isSelected && isEditing) {
            setIsEditing(false);
            onEditChange?.(false);
        }
    }, [isSelected, isEditing, onEditChange]);

    useEffect(() => {
        const raf = requestAnimationFrame(() => { hasMounted.current = true; });
        return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        if (item.type === 'text' && item.content === '' && isSelected) {
            setIsEditing(true);
            onEditChange?.(true);
            requestAnimationFrame(() => focusAtEnd());
        }
    }, [item.type, item.content, isSelected, onEditChange]);

    useEffect(() => {
        if (item.type === 'text' && !isEditing && textRef.current) {
            const currentText = textRef.current.innerText;
            if (currentText !== item.content) {
                textRef.current.innerText = item.content;
            }
        }
    }, [item.content, item.type, isEditing]);

    const focusAtEnd = useCallback(() => {
        const el = textRef.current;
        if (!el) return;
        el.focus();
        if (typeof window.getSelection === 'undefined') return;
        const sel = window.getSelection();
        if (!sel) return;
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }, []);

    const enterEditMode = useCallback(() => {
        setIsEditing(true);
        onEditChange?.(true);
        requestAnimationFrame(() => focusAtEnd());
    }, [focusAtEnd, onEditChange]);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setIsDeleting(true);
        setTimeout(() => onDelete(item.id), 200);
    };

    /* ------------------------------------------------------------------ */
    /*  Handles Logic                                                     */
    /* ------------------------------------------------------------------ */

    const dragRef = useRef(null);
    
    const handleRefs = {
        tl: useRef(null),
        tr: useRef(null),
        bl: useRef(null),
        br: useRef(null),
        rot: useRef(null),
        line: useRef(null),
        del: useRef(null)
    };

    const updateDOM = (newScale, newRot) => {
        const invScale = 1 / newScale;
        const elem = elementRef.current;
        if (elem) {
            elem.style.transform = `translate(-50%, -50%) scale(${newScale}) rotate(${newRot}deg)`;
            elem.style.setProperty('--inv-scale', invScale);
        }
        const invTransform = `translate(-50%, -50%) scale(${invScale})`;
        
        if (handleRefs.tl.current) handleRefs.tl.current.style.transform = invTransform;
        if (handleRefs.tr.current) handleRefs.tr.current.style.transform = invTransform;
        if (handleRefs.bl.current) handleRefs.bl.current.style.transform = invTransform;
        if (handleRefs.br.current) handleRefs.br.current.style.transform = invTransform;
        
        if (handleRefs.line.current) {
            handleRefs.line.current.style.height = `${30 * invScale}px`;
        }
        if (handleRefs.rot.current) {
            handleRefs.rot.current.style.transform = `translate(-50%, calc(-50% - ${30 * invScale}px)) scale(${invScale})`;
        }
        if (handleRefs.del.current) {
            handleRefs.del.current.style.transform = `translateX(-50%) scale(${invScale})`;
            handleRefs.del.current.style.top = `calc(100% + ${20 * invScale}px)`;
        }
    };

    const getCenter = (elem) => {
        const rect = elem.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    };

    const handleScalePointerDown = (e, cornerId) => {
        e.stopPropagation();
        e.preventDefault();
        const elem = elementRef.current;
        if (!elem) return;

        const C0 = getCenter(elem);
        
        // Find the unrotated local position of the corner
        const W = elem.offsetWidth;
        const H = elem.offsetHeight;
        let lx = 0, ly = 0;
        if (cornerId === 'tl') { lx = -W/2; ly = -H/2; }
        if (cornerId === 'tr') { lx = W/2; ly = -H/2; }
        if (cornerId === 'bl') { lx = -W/2; ly = H/2; }
        if (cornerId === 'br') { lx = W/2; ly = H/2; }
        
        const startScale = item.scale || 1;
        const currentRot = item.rotation || 0;
        const rad = currentRot * Math.PI / 180;
        
        // Scaled local coords
        const sx = lx * startScale;
        const sy = ly * startScale;
        
        // Rotated screen offsets
        const rx = sx * Math.cos(rad) - sy * Math.sin(rad);
        const ry = sx * Math.sin(rad) + sy * Math.cos(rad);
        
        // Exact mathematical corner in screen space
        const P0_exact = { x: C0.x + rx, y: C0.y + ry };
        
        // The anchor is exactly the opposite corner
        const A = { x: C0.x - rx, y: C0.y - ry };
        
        // The axis vector from Anchor to Corner
        const vx = P0_exact.x - A.x;
        const vy = P0_exact.y - A.y;
        const vLenSq = vx * vx + vy * vy;
        
        const parentRect = elem.parentElement.getBoundingClientRect();
        const startLeft = C0.x - parentRect.left;
        const startTop = C0.y - parentRect.top;

        const onMove = (moveEvent) => {
            const mx = moveEvent.clientX - A.x;
            const my = moveEvent.clientY - A.y;
            
            // Project mouse position onto the diagonal axis to find scaling factor
            let t = (mx * vx + my * vy) / vLenSq;
            t = Math.max(0.1, t); // Clamp scale
            
            const newScale = startScale * t;
            
            // Vector from Anchor to original center was exactly halfway to the corner
            // So new center vector is scaled by t
            const dx_center = (C0.x - A.x) * t;
            const dy_center = (C0.y - A.y) * t;
            
            const C1 = { x: A.x + dx_center, y: A.y + dy_center };
            
            const dx = C1.x - C0.x;
            const dy = C1.y - C0.y;
            
            // Mutate DOM immediately for zero jank
            elem.style.left = `${startLeft + dx}px`;
            elem.style.top = `${startTop + dy}px`;
            
            updateDOM(newScale, currentRot);
            
            // Track latest state for onUp without triggering React renders
            dragRef.current = { scale: newScale, rotation: currentRot };
        };

        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointercancel', onUp);
            if (dragRef.current) {
                // Also commit the final position if the center moved during scale
                const finalRect = elem.getBoundingClientRect();
                const pRect = elem.parentElement.getBoundingClientRect();
                const finalX = ((finalRect.left + finalRect.width / 2 - pRect.left) / pRect.width) * 100;
                const finalY = ((finalRect.top + finalRect.height / 2 - pRect.top) / pRect.height) * 100;
                onUpdateEnd(item.id, { ...dragRef.current, x: finalX, y: finalY });
                dragRef.current = null;
            }
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
    };

    const handleRotatePointerDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const elem = elementRef.current;
        if (!elem) return;

        const C0 = getCenter(elem);
        
        const startAngle = Math.atan2(e.clientY - C0.y, e.clientX - C0.x);
        const startRot = item.rotation || 0;
        const currentScale = item.scale || 1;

        const onMove = (moveEvent) => {
            const angle = Math.atan2(moveEvent.clientY - C0.y, moveEvent.clientX - C0.x);
            const angleDiff = (angle - startAngle) * (180 / Math.PI);
            const newRot = startRot + angleDiff;
            
            updateDOM(currentScale, newRot);
            
            // Track latest state for onUp without triggering React renders
            dragRef.current = { scale: currentScale, rotation: newRot };
        };

        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointercancel', onUp);
            if (dragRef.current) {
                onUpdateEnd(item.id, dragRef.current);
                dragRef.current = null;
            }
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
    };

    const currentScale = item.scale || 1;
    const currentRot = item.rotation || 0;

    const renderHandles = () => {
        if (!isSelected || isEditing) return null;
        
        const invScale = 1 / currentScale;
        const handleStyle = {
            position: 'absolute',
            width: '14px',
            height: '14px',
            backgroundColor: 'var(--accent-1)',
            border: '2px solid white',
            borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${invScale})`,
            cursor: 'grab',
            touchAction: 'none',
        };

        return (
            <>
                <div data-handle="true" ref={handleRefs.tl} style={{ ...handleStyle, top: 0, left: 0 }} onPointerDown={(e) => handleScalePointerDown(e, 'tl')} />
                <div data-handle="true" ref={handleRefs.tr} style={{ ...handleStyle, top: 0, left: '100%' }} onPointerDown={(e) => handleScalePointerDown(e, 'tr')} />
                <div data-handle="true" ref={handleRefs.bl} style={{ ...handleStyle, top: '100%', left: 0 }} onPointerDown={(e) => handleScalePointerDown(e, 'bl')} />
                <div data-handle="true" ref={handleRefs.br} style={{ ...handleStyle, top: '100%', left: '100%' }} onPointerDown={(e) => handleScalePointerDown(e, 'br')} />
                
                {/* Connecting line for rotate handle */}
                <div data-handle="true" ref={handleRefs.line} style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: '2px',
                    height: `${30 * invScale}px`,
                    backgroundColor: 'white',
                    boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                    transform: `translate(-50%, -100%)`,
                    pointerEvents: 'none',
                }} />
                {/* Rotate handle */}
                <div data-handle="true" ref={handleRefs.rot} style={{
                    ...handleStyle,
                    top: 0,
                    left: '50%',
                    transform: `translate(-50%, calc(-50% - ${30 * invScale}px)) scale(${invScale})`,
                    cursor: 'grab'
                }} onPointerDown={handleRotatePointerDown} />

                <button 
                    data-handle="true"
                    ref={handleRefs.del}
                    onClick={handleDeleteClick}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        top: `calc(100% + ${20 * invScale}px)`,
                        left: '50%',
                        transform: `translateX(-50%) scale(${invScale})`,
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
                        whiteSpace: 'nowrap',
                        transformOrigin: 'center top',
                    }}
                    title="Delete Element"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                </button>
            </>
        );
    };

    /* ------------------------------------------------------------------ */
    /*  Shared styles                                                     */
    /* ------------------------------------------------------------------ */

    const renderInvScale = 1 / currentScale;

    const baseStyle = {
        transform: `translate(-50%, -50%) scale(${isDeleting ? 0 : currentScale}) rotate(${currentRot}deg)`,
        '--inv-scale': isDeleting ? 1 : renderInvScale,
        left: item.x !== undefined ? `${item.x}%` : '50%',
        top: item.y !== undefined ? `${item.y}%` : '50%',
        touchAction: 'none',
        zIndex: isEditing ? 50 : (isSelected ? 10 : 1),
        opacity: isDeleting ? 0 : 1,
        transition: isDeleting ? 'transform 0.2s cubic-bezier(0.3, -0.2, 0.2, 1), opacity 0.15s' : 'none',
    };

    const popClass = !hasMounted.current ? 'animate-pop' : '';
    // Hide dashed border if editing, for cleaner view
    const selectedClass = isSelected && !isEditing ? 'selected' : '';

    /* ------------------------------------------------------------------ */
    /*  TEXT overlay                                                       */
    /* ------------------------------------------------------------------ */

    if (item.type === 'text') {
        const s = item.style || {};
        
        let presetStyles = {};
        if (s.preset === 'chrome') {
            presetStyles = {
                WebkitTextFillColor: 'transparent',
                WebkitTextStroke: `calc(${s.size}px * 0.008) #ffffff`,
                backgroundImage: 'linear-gradient(to bottom, #e2e2e2 0%, #ffffff 40%, #555555 50%, #ffffff 52%, #b5b5b5 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                textShadow: '0px 15px 25px rgba(0,0,0,0.9)'
            };
        } else if (s.preset === 'y2k-outline') {
            const out = `calc(${s.size}px * 0.025)`;
            const drop = `calc(${s.size}px * 0.08)`;
            presetStyles = {
                color: s.color || '#ff007f',
                WebkitTextStroke: `${out} #ffffff`,
                textShadow: `${drop} ${drop} 0 #000000`
            };
        } else if (s.preset === 'brat') {
            presetStyles = {
                backgroundColor: '#8ace00',
                padding: '0.1em 0.25em',
                filter: 'blur(0.8px)',
                lineHeight: 1
            };
        }

        // Put text properties on the wrapper so canvasExport.js picks them up via getComputedStyle
        const wrapperStyle = {
            ...baseStyle,
            display: 'inline-block',
            fontFamily:  `'${s.font || 'Inter'}', sans-serif`,
            fontSize:    `${s.size || 24}px`,
            color:       s.color || '#ffffff',
            fontWeight:  s.bold   ? '700' : '400',
            fontStyle:   s.italic ? 'italic' : 'normal',
            textShadow:  s.shadow && s.preset !== 'chrome' && s.preset !== 'y2k-outline' && s.preset !== 'bubble' ? '0 2px 8px rgba(0,0,0,.6)' : 'none',
            ...presetStyles
        };

        const innerStyle = {
            minWidth:    '1ch',
            minHeight:   '1em',
            outline:     'none',
            whiteSpace:  'pre',
            wordBreak:   'normal',
        };

        return (
            <div
                ref={elementRef}
                id={item.id}
                className={`overlay-item overlay-text ${popClass} ${selectedClass}`.trim()}
                data-preset={s.preset || 'none'}
                style={wrapperStyle}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isSelected) onSelect();
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isEditing) enterEditMode();
                }}
            >
                <div
                    ref={textRef}
                    style={innerStyle}
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    data-placeholder="Type here..."
                    enterKeyHint="done"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur();
                        }
                    }}
                    onBlur={(e) => {
                        const txt = e.currentTarget.innerText.trim();
                        if (!txt) {
                            onDelete?.(item.id);
                        } else {
                            onTextChange(item.id, e.currentTarget.innerText);
                        }
                    }}
                    onInput={(e) => {
                        onTextChange(item.id, e.currentTarget.innerText);
                    }}
                />
                {renderHandles()}
            </div>
        );
    }

    /* ------------------------------------------------------------------ */
    /*  STICKER overlay                                                   */
    /* ------------------------------------------------------------------ */

    if (item.type === 'sticker') {
        return (
            <div
                ref={elementRef}
                id={item.id}
                className={`overlay-item overlay-sticker ${popClass} ${selectedClass}`.trim()}
                style={{
                    ...baseStyle,
                    width: '120px',
                    height: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
            >
                <img
                    src={item.content}
                    alt="Sticker"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                    }}
                />
                {renderHandles()}
            </div>
        );
    }

    return null;
}
