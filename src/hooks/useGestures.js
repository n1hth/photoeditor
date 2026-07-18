import { useRef, useEffect, useCallback } from 'react';

/**
 * useGestures — drag / pinch-scale / two-finger-rotate for overlay items.
 *
 * @param {Object}   opts
 * @param {number}   opts.scale       current scale value
 * @param {number}   opts.rotation    current rotation in degrees
 * @param {Function} opts.onUpdate    (newScale, newRotation) → void
 * @param {Function} opts.onSelect    () → void  — called on tap
 * @returns {{ elementRef: React.RefObject }}
 */
export function useGestures({ id, type, scale, rotation, onUpdate, onSelect, onUpdateEnd }) {
    const elementRef = useRef(null);

    // Mutable gesture state that persists across renders without causing them.
    const g = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        // Position of the element in pixels (left, top).
        posLeft: null,  // null = not yet initialised from DOM
        posTop: null,
        activePointers: new Map(),
        initPinchDist: null,
        initPinchAngle: null,
        initScale: 1,
        initRotation: 0,
    });

    // Keep latest callback refs so the effect closure never goes stale.
    const cbRefs = useRef({ id, type, onUpdate, onSelect, onUpdateEnd, scale, rotation });
    cbRefs.current = { id, type, onUpdate, onSelect, onUpdateEnd, scale, rotation };

    useEffect(() => {
        const elem = elementRef.current;
        if (!elem) return;

        /* ------------------------------------------------------------------ */
        /*  Helpers                                                           */
        /* ------------------------------------------------------------------ */

        /**
         * Resolve the element's current left/top into pixel values.
         * Handles both 'px' and '%' units; for '%' we use the parent's dimensions.
         */
        const resolvePosition = () => {
            const parent = elem.parentElement;
            if (!parent) return;

            const rect = elem.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            
            // Due to translate(-50%, -50%), the element's actual position (left/top)
            // corresponds to its visual center point.
            g.current.posLeft = (rect.left + rect.width / 2) - parentRect.left;
            g.current.posTop  = (rect.top + rect.height / 2) - parentRect.top;
        };

        /* ------------------------------------------------------------------ */
        /*  Pointer handlers                                                  */
        /* ------------------------------------------------------------------ */

        const handlePointerDown = (e) => {
            // Ignore events that originated on the resize/rotate handles
            if (e.target.hasAttribute('data-handle') || e.target.closest('[data-handle]')) {
                return;
            }
            
            // If the target is contentEditable AND already focused, let the
            // browser handle pointer events so the user can select text.
            if (e.target.isContentEditable && document.activeElement === e.target) {
                return;
            }

            g.current.activePointers.set(e.pointerId, e);

            if (g.current.activePointers.size === 1) {
                // --- Single-finger: start drag ---
                g.current.isDragging = true;
                elem.style.transition = 'none';

                // ALWAYS resolve position from the DOM on interaction,
                // so we pick up changes made by external handle dragging.
                resolvePosition();

                g.current.startX = e.clientX;
                g.current.startY = e.clientY;

                cbRefs.current.onSelect?.();
                elem.setPointerCapture(e.pointerId);
            } else if (g.current.activePointers.size === 2) {
                // --- Two-finger: pinch / rotate ---
                g.current.isDragging = false;
                const pts = Array.from(g.current.activePointers.values());
                g.current.initPinchDist = Math.hypot(
                    pts[0].clientX - pts[1].clientX,
                    pts[0].clientY - pts[1].clientY,
                );
                g.current.initPinchAngle = Math.atan2(
                    pts[1].clientY - pts[0].clientY,
                    pts[1].clientX - pts[0].clientX,
                );
                g.current.initScale    = cbRefs.current.scale || 1;
                g.current.initRotation = cbRefs.current.rotation || 0;
            }
        };

        const handlePointerMove = (e) => {
            if (!g.current.activePointers.has(e.pointerId)) return;
            g.current.activePointers.set(e.pointerId, e);

            if (g.current.activePointers.size === 1 && g.current.isDragging) {
                const dx = e.clientX - g.current.startX;
                const dy = e.clientY - g.current.startY;

                g.current.posLeft += dx;
                g.current.posTop  += dy;
                g.current.startX = e.clientX;
                g.current.startY = e.clientY;

                elem.style.left = `${g.current.posLeft}px`;
                elem.style.top  = `${g.current.posTop}px`;
                
                // Dispatch event for hit detection (e.g. layout cell snapping)
                if (cbRefs.current.id) {
                    window.dispatchEvent(new CustomEvent('overlay-drag-move', {
                        detail: { clientX: e.clientX, clientY: e.clientY, id: cbRefs.current.id, type: cbRefs.current.type }
                    }));
                }
            } else if (g.current.activePointers.size === 2 && g.current.initPinchDist) {
                const pts   = Array.from(g.current.activePointers.values());
                const dist  = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
                const angle = Math.atan2(pts[1].clientY - pts[0].clientY, pts[1].clientX - pts[0].clientX);

                const newScale    = g.current.initScale * (dist / g.current.initPinchDist);
                const newRotation = g.current.initRotation + (angle - g.current.initPinchAngle) * (180 / Math.PI);

                cbRefs.current.onUpdate?.(newScale, newRotation);
            }
        };

        const handlePointerUp = (e) => {
            g.current.activePointers.delete(e.pointerId);

            if (g.current.activePointers.size < 2) {
                g.current.initPinchDist = null;
            }

            if (g.current.activePointers.size === 0) {
                if (g.current.isDragging) {
                    const parent = elem.parentElement;
                    if (parent && cbRefs.current.onUpdateEnd) {
                        const parentRect = parent.getBoundingClientRect();
                        const xPercent = (g.current.posLeft / parentRect.width) * 100;
                        const yPercent = (g.current.posTop / parentRect.height) * 100;
                        cbRefs.current.onUpdateEnd({ x: xPercent, y: yPercent });
                    }
                    if (cbRefs.current.id) {
                        window.dispatchEvent(new CustomEvent('overlay-drag-end', {
                            detail: { clientX: e.clientX, clientY: e.clientY, id: cbRefs.current.id, type: cbRefs.current.type }
                        }));
                    }
                }
                if (g.current.initPinchDist && cbRefs.current.onUpdateEnd) {
                    cbRefs.current.onUpdateEnd({}); // Commit scale/rotation
                }
                g.current.isDragging = false;
                elem.style.transition = '';
            }
        };

        /* ------------------------------------------------------------------ */
        /*  Trackpad / Wheel Pinch                                            */
        /* ------------------------------------------------------------------ */

        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const currentScale = cbRefs.current.scale || 1;
                // e.deltaY is usually positive for pinch-in (zoom out), negative for pinch-out (zoom in).
                const newScale = Math.max(0.1, currentScale - (e.deltaY * 0.002));
                cbRefs.current.onUpdate?.(newScale, cbRefs.current.rotation || 0);
            }
        };

        /* ------------------------------------------------------------------ */
        /*  Attach / detach                                                   */
        /* ------------------------------------------------------------------ */

        elem.addEventListener('pointerdown', handlePointerDown);
        elem.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup',   handlePointerUp);
        document.addEventListener('pointercancel', handlePointerUp);

        return () => {
            elem.removeEventListener('pointerdown', handlePointerDown);
            elem.removeEventListener('wheel', handleWheel);
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup',   handlePointerUp);
            document.removeEventListener('pointercancel', handlePointerUp);
        };
        // The effect intentionally runs only once (on mount).
        // We read live values from cbRefs so the closure never goes stale.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { elementRef };
}
