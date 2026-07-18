/**
 * canvasExport.js — Pixel-perfect export at original resolution.
 *
 * Strategy:
 *   1. Draw the base image (or PixiJS-filtered image) at full original resolution.
 *   2. Compute a single uniform scale factor: exportScale = canvasWidth / displayWidth.
 *   3. For every overlay (text / sticker), convert its percentage-based position
 *      to canvas-pixel coordinates, then scale its size and transform by exportScale.
 *   4. Draw vignette, grain, and tint overlays at full resolution.
 */

export function exportImage({ imageSrc, adjustments, overlays, imgRef, fullResOverrideUrl }) {
    if (!imgRef || !imgRef.current) return;

    const displayImg = imgRef.current;

    // The display image's on-screen bounding box (CSS pixels).
    // This is the coordinate space overlays are positioned in.
    const displayRect = displayImg.getBoundingClientRect();
    const displayW = displayRect.width;
    const displayH = displayRect.height;

    const doExport = (imgToDraw, skipFilter) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Use original image dimensions for full-res export
        const origW = imgToDraw.naturalWidth  || displayImg.naturalWidth;
        const origH = imgToDraw.naturalHeight || displayImg.naturalHeight;
        canvas.width  = origW;
        canvas.height = origH;

        // Uniform scale factor from screen-pixels → export-pixels
        const exportScale = origW / displayW;

        // 1. Draw base image
        ctx.filter = skipFilter ? 'none' : getComputedStyle(displayImg).filter;
        ctx.drawImage(imgToDraw, 0, 0, origW, origH);
        ctx.filter = 'none';

        // 2. Vignette
        if (adjustments.vignette > 0) {
            const cx = origW / 2;
            const cy = origH / 2;
            const maxDim = Math.max(origW, origH);
            const grad = ctx.createRadialGradient(cx, cy, maxDim * 0.2, cx, cy, maxDim * 0.75);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            const vigColor = adjustments.vignetteColor || '#000000';
            const isCustomVig = vigColor !== '#000000';
            const alpha = adjustments.vignette * 0.01;
            if (isCustomVig) {
                // Parse hex to rgba
                const r = parseInt(vigColor.slice(1,3), 16);
                const g = parseInt(vigColor.slice(3,5), 16);
                const b = parseInt(vigColor.slice(5,7), 16);
                grad.addColorStop(1, `rgba(${r},${g},${b},${alpha})`);
                ctx.globalCompositeOperation = 'overlay';
            } else {
                grad.addColorStop(1, `rgba(0,0,0,${alpha})`);
                ctx.globalCompositeOperation = 'multiply';
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, origW, origH);
            ctx.globalCompositeOperation = 'source-over';
        }

        // 3. Shadow/Highlight tints
        if (adjustments.shadowsTint && adjustments.shadowsTint !== '#000000') {
            ctx.fillStyle = adjustments.shadowsTint;
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(0, 0, origW, origH);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        }
        if (adjustments.highlightsTint && adjustments.highlightsTint !== '#ffffff') {
            ctx.fillStyle = adjustments.highlightsTint;
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(0, 0, origW, origH);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        }

        // 4. Overlays (text + stickers)
        // The overlays-container in the DOM is positioned absolutely over the
        // display image with position: absolute; inset: 0. So its coordinate
        // system matches displayImg exactly.
        //
        // overlay.x / overlay.y are stored as percentages of the container.
        // overlay.scale and overlay.rotation are the final gesture values.

        const overlaysContainer = displayImg.closest('.image-content-layer')?.querySelector('.overlays-container');

        overlays.forEach(item => {
            const node = document.getElementById(item.id);
            if (!node) return;

            // --- Position ---
            // Overlay x,y are in percentage of the overlays-container.
            // However, during drag the useGestures hook sets left/top in px.
            // After drag finishes, onUpdateEnd converts them to percentages.
            // So on export (which happens after deselect) they should be in %.
            // We parse whatever unit is on the node:
            let posXPx, posYPx;
            const leftStr = node.style.left;
            const topStr  = node.style.top;

            if (leftStr.endsWith('%')) {
                posXPx = (parseFloat(leftStr) / 100) * origW;
            } else {
                // px value — relative to display size
                posXPx = parseFloat(leftStr) * exportScale;
            }
            if (topStr.endsWith('%')) {
                posYPx = (parseFloat(topStr) / 100) * origH;
            } else {
                posYPx = parseFloat(topStr) * exportScale;
            }

            const overlayScale = item.scale || 1;
            const rot = (item.rotation || 0) * Math.PI / 180;

            ctx.save();
            ctx.translate(posXPx, posYPx);
            ctx.rotate(rot);
            ctx.scale(overlayScale, overlayScale);

            if (item.type === 'text') {
                const s = getComputedStyle(node);
                const screenFs = parseFloat(s.fontSize);
                // Scale font size from display pixels to export pixels
                const exportFs = screenFs * exportScale;

                ctx.font = `${s.fontStyle} ${s.fontWeight} ${exportFs}px ${s.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const lines = node.innerText.split('\n');
                const lineHeight = exportFs * 1.2;
                const startY = -(lines.length - 1) * lineHeight / 2;

                const preset = node.dataset.preset;

                // --- Brat preset ---
                if (preset === 'brat') {
                    ctx.filter = `blur(${0.8 * exportScale}px)`;
                    ctx.fillStyle = '#8ace00';
                    let maxWidth = 0;
                    lines.forEach(l => {
                        const w = ctx.measureText(l).width;
                        if (w > maxWidth) maxWidth = w;
                    });
                    const padX = exportFs * 0.25;
                    const padY = exportFs * 0.1;
                    const totalH = lines.length * lineHeight;
                    ctx.fillRect(
                        -maxWidth / 2 - padX,
                        startY - lineHeight / 2 - padY,
                        maxWidth + padX * 2,
                        totalH + padY * 2
                    );
                }

                // --- Chrome preset: gradient fill ---
                if (preset === 'chrome') {
                    const totalH = lines.length * lineHeight;
                    const gradTop = startY - lineHeight / 2;
                    const chromeGrad = ctx.createLinearGradient(0, gradTop, 0, gradTop + totalH);
                    chromeGrad.addColorStop(0, '#e2e2e2');
                    chromeGrad.addColorStop(0.4, '#ffffff');
                    chromeGrad.addColorStop(0.5, '#555555');
                    chromeGrad.addColorStop(0.52, '#ffffff');
                    chromeGrad.addColorStop(1, '#b5b5b5');
                    ctx.fillStyle = chromeGrad;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = exportFs * 0.008;
                    // Draw shadow for chrome
                    ctx.shadowColor = 'rgba(0,0,0,0.9)';
                    ctx.shadowBlur = 25 * exportScale;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 15 * exportScale;
                    
                    lines.forEach((line, i) => {
                        ctx.strokeText(line, 0, startY + (i * lineHeight));
                    });
                } else if (preset === 'y2k-outline') {
                    ctx.fillStyle = s.color || '#ff007f';
                    const outW = exportFs * 0.025;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = outW * 2;
                    ctx.lineJoin = 'round';
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = exportFs * 0.08;
                    ctx.shadowOffsetY = exportFs * 0.08;
                    // Draw stroked text first, then filled
                    lines.forEach((line, i) => {
                        ctx.strokeText(line, 0, startY + (i * lineHeight));
                    });
                } else if (preset !== 'brat') {
                    ctx.fillStyle = s.color;
                    // Standard text shadow
                    if (s.textShadow && s.textShadow !== 'none') {
                        ctx.shadowColor = 'rgba(0,0,0,.6)';
                        ctx.shadowBlur = 8 * exportScale;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 2 * exportScale;
                    }
                } else {
                    // brat: black text
                    ctx.fillStyle = s.color;
                }

                // Draw text
                lines.forEach((line, i) => {
                    const textStr = preset === 'brat' ? line.toLowerCase() : line;
                    const y = startY + (i * lineHeight);

                    if (preset === 'chrome') {
                        // Stroke outline + gradient fill
                        ctx.strokeText(textStr, 0, y);
                        ctx.fillText(textStr, 0, y);
                    } else {
                        ctx.fillText(textStr, 0, y);
                    }
                });

                // Reset shadow and filter
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.filter = 'none';

            } else if (item.type === 'sticker') {
                const imgNode = node.querySelector('img');
                if (imgNode) {
                    const stickerDisplaySize = 120; // matches OverlayItem.jsx
                    const containerSize = stickerDisplaySize * exportScale;
                    
                    const nw = imgNode.naturalWidth || 1;
                    const nh = imgNode.naturalHeight || 1;
                    let drawW = containerSize;
                    let drawH = containerSize;
                    
                    // Calculate object-fit: contain dimensions within the 120x120 square container
                    if (nw / nh > 1) {
                        // Wider than tall
                        drawH = containerSize * (nh / nw);
                    } else {
                        // Taller than wide
                        drawW = containerSize * (nw / nh);
                    }
                    
                    ctx.drawImage(
                        imgNode,
                        -drawW / 2,
                        -drawH / 2,
                        drawW,
                        drawH
                    );
                }
            }
            ctx.restore();
        });

        // 5. Download
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lumiedit-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    };

    if (fullResOverrideUrl) {
        const tempImg = new Image();
        tempImg.crossOrigin = 'anonymous';
        tempImg.onload = () => doExport(tempImg, true);
        tempImg.src = fullResOverrideUrl;
    } else {
        doExport(displayImg, false);
    }
}
