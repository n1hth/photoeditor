/**
 * PixiFilterEngine.js — singleton module that manages an off-screen
 * PIXI.Application for GPU-accelerated filter rendering.
 *
 * Public API:
 *   initFilterEngine()           — create the off-screen Pixi app
 *   applyFilter(src, name, intensity, w, h) — render filtered image, return data URL
 *   exportFiltered(src, name, intensity)     — full-res export
 *   destroyFilterEngine()        — cleanup
 */
import { Application, Sprite, Texture, Container, Text, BlurFilter, Assets, Rectangle, TilingSprite, ColorMatrixFilter, NoiseFilter } from 'pixi.js';
import { RGBSplitFilter } from 'pixi-filters';
import { getFilterStack } from './filterStacks';

let retroWorker = null;
let app = null;
let initialized = false;
const MAX_PREVIEW_DIM = 1400; // cap preview resolution for performance

/**
 * Initialize the off-screen Pixi application.
 */
export async function initFilterEngine() {
    if (initialized) return;
    app = new Application();
    
    if (!retroWorker) {
        retroWorker = new Worker(new URL('../workers/retroWorker.js', import.meta.url), { type: 'module' });
    }

    await app.init({
        preference: 'webgl',
        backgroundAlpha: 0,
        antialias: true,
        width: 800,
        height: 600,
        resolution: 1, // ensure pixel density is strictly 1x for preview extraction
    });

    // Start loading texture overlays for retro filters
    Assets.add({ alias: 'tex_paper', src: '/textures/paper-grain.svg' });
    Assets.add({ alias: 'tex_scanlines', src: '/textures/scanlines.svg' });
    Assets.add({ alias: 'tex_halftone', src: '/textures/halftone-dot.svg' });
    Assets.add({ alias: 'tex_riso', src: '/textures/riso-texture.svg' });
    Assets.load(['tex_paper', 'tex_scanlines', 'tex_halftone', 'tex_riso']).catch(console.warn);

    // Append to hidden div to ensure WebGL context is active in all browsers (Safari often requires this)
    let hiddenContainer = document.getElementById('pixi-hidden-container');
    if (!hiddenContainer) {
        hiddenContainer = document.createElement('div');
        hiddenContainer.id = 'pixi-hidden-container';
        hiddenContainer.style.position = 'absolute';
        hiddenContainer.style.width = '1px';
        hiddenContainer.style.height = '1px';
        hiddenContainer.style.overflow = 'hidden';
        hiddenContainer.style.visibility = 'hidden';
        hiddenContainer.style.pointerEvents = 'none';
        hiddenContainer.style.zIndex = '-9999';
        document.body.appendChild(hiddenContainer);
    }
    // In Pixi v8, the canvas is app.canvas
    if (app.canvas) {
        hiddenContainer.appendChild(app.canvas);
    }

    initialized = true;
}

/**
 * Load an image as a Pixi Texture.
 * @param {string} src - image URL or data URL
 * @returns {Promise<Texture>}
 */
async function loadTexture(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (!src.startsWith('data:') && !src.startsWith('blob:')) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = async () => {
            try {
                // Ensure image is fully decoded before creating texture
                await img.decode();
                const texture = Texture.from(img);
                // Force an update to ensure dimensions are ready
                texture.source.update();
                resolve(texture);
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Add timestamp text overlays to a container.
 * @param {Container} container - the container to add text to
 * @param {object} tsConfig - timestamp configuration from filterStacks
 * @param {number} width - container width
 * @param {number} height - container height
 */
function addTimestampOverlay(container, tsConfig, width, height) {
    const fontSize = Math.max(14, Math.round(height * 0.035));
    const textContent = typeof tsConfig.text === 'function' ? tsConfig.text() : tsConfig.text;

    // Glow layer (blurred duplicate behind)
    const glowText = new Text({
        text: textContent,
        style: {
            fontFamily: tsConfig.fontFamily || '"Courier New", monospace',
            fontSize,
            fill: tsConfig.color,
            fontWeight: 'bold',
        },
    });
    glowText.filters = [new BlurFilter({ strength: 4, quality: 2 })];
    glowText.alpha = 0.5;

    // Sharp text on top
    const sharpText = new Text({
        text: textContent,
        style: {
            fontFamily: tsConfig.fontFamily || '"Courier New", monospace',
            fontSize,
            fill: tsConfig.color,
            fontWeight: 'bold',
        },
    });

    // Position based on config
    const pad = Math.round(width * 0.03);
    if (tsConfig.position === 'top-left') {
        glowText.x = pad;
        glowText.y = pad;
        sharpText.x = pad;
        sharpText.y = pad;
    } else {
        // bottom-right
        glowText.anchor = { x: 1, y: 1 };
        sharpText.anchor = { x: 1, y: 1 };
        glowText.x = width - pad;
        glowText.y = height - pad;
        sharpText.x = width - pad;
        sharpText.y = height - pad;
    }

    container.addChild(glowText);
    container.addChild(sharpText);
}

/**
 * Core render function — loads image, applies filter stack, extracts result.
 * @param {string} imageSrc - source image URL
 * @param {Array<{id: string, intensity: number, visible: boolean}>} activeFilters - active filters array
 * @param {number} [maxDim] - max dimension cap (null for full res)
 * @returns {Promise<string>} data URL of the rendered result
 */
async function renderFiltered(imageSrc, activeFilters, maxDim = MAX_PREVIEW_DIM) {
    try {
        if (!initialized || !app) {
            await initFilterEngine();
        }

        const texture = await loadTexture(imageSrc);
        let w = texture.width;
        let h = texture.height;

        // Scale down for preview if needed
        if (maxDim && (w > maxDim || h > maxDim)) {
            const scale = maxDim / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
        }

        // Resize the renderer
        app.renderer.resize(w, h);

        // Create sprite
        const sprite = new Sprite(texture);
        sprite.width = w;
        sprite.height = h;

        // Get filter stacks
        let combinedFilters = [];
        let combinedTimestamps = [];
        let combinedOverlays = [];

        if (activeFilters && activeFilters.length > 0) {
            for (const f of activeFilters) {
                if (!f.visible) continue;
                const stack = getFilterStack(f.id, f.intensity ?? 100, f.params ?? {});
                if (stack && stack.filters) {
                    combinedFilters = combinedFilters.concat(stack.filters);
                }
                if (stack && stack.timestamp) {
                    combinedTimestamps.push(stack.timestamp);
                }
                if (stack && stack.overlays) {
                    combinedOverlays = combinedOverlays.concat(stack.overlays);
                }
            }
        }

        let retroFilter = activeFilters?.find(f => f.id.startsWith('retro'));
        
        let preFilters = [];
        let postFilters = [];
        let textureOverlay = null;

        if (retroFilter && retroFilter.visible) {
            // Pre-pass: Blur + Noise + Contrast
            const blur = new BlurFilter({ strength: 1.2 });
            const noise = new NoiseFilter({ noise: 0.12, seed: Math.random() });
            const cm = new ColorMatrixFilter();
            cm.contrast(1.15, false); // slight contrast push
            preFilters.push(blur, noise, cm);

            // Post-pass / Compositing
            if (retroFilter.id === 'retroRiso' || retroFilter.id === 'retroCMYK') {
                const misreg = retroFilter.params?.misregistration ?? 2.0;
                const rgbSplit = new RGBSplitFilter({ red: [misreg, -misreg/2], blue: [-misreg/2, misreg], green: [0, 0] });
                postFilters.push(rgbSplit);
                
                if (Assets.cache.has('tex_riso') && retroFilter.id === 'retroRiso') {
                    textureOverlay = { tex: Assets.cache.get('tex_riso'), blend: 'multiply', alpha: 0.8 };
                } else if (Assets.cache.has('tex_halftone')) {
                    textureOverlay = { tex: Assets.cache.get('tex_halftone'), blend: 'multiply', alpha: 0.5 };
                }
            } else if (retroFilter.id === 'retroTeletext' || retroFilter.id === 'retroPunk') {
                if (Assets.cache.has('tex_scanlines')) {
                    textureOverlay = { tex: Assets.cache.get('tex_scanlines'), blend: 'overlay', alpha: 0.4 };
                }
            } else {
                if (Assets.cache.has('tex_paper')) {
                    textureOverlay = { tex: Assets.cache.get('tex_paper'), blend: 'multiply', alpha: 0.6 };
                }
            }
        }

        // --- CPU OFFLOAD (Phase 2 & 3) ---
        if (retroFilter && retroFilter.id === 'retroDither' && retroWorker) {
            // Remove the shader-based dither filter so we don't double-process
            combinedFilters = combinedFilters.filter(f => !f.resources?.ditherUniforms);
            
            // Render the pre-pass to a temporary canvas to get ImageData
            sprite.filters = preFilters;
            const tempContainer = new Container();
            tempContainer.addChild(sprite);
            app.stage.removeChildren();
            app.stage.addChild(tempContainer);
            app.render();
            
            const tempCanvas = app.renderer.extract.canvas({ target: tempContainer, frame: new Rectangle(0, 0, w, h) });
            const ctx = tempCanvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, w, h);
            
            // Map params to palette
            let palette = 'bw'; // Default 1-bit
            if (retroFilter.params?.palette) {
                palette = retroFilter.params.palette;
            }
            
            // Send to Web Worker
            const processedImageData = await new Promise((resolve, reject) => {
                const msgId = Date.now() + '_' + Math.random();
                const handler = (e) => {
                    if (e.data.id === msgId) {
                        retroWorker.removeEventListener('message', handler);
                        if (e.data.error) reject(new Error(e.data.error));
                        else resolve(e.data.imageData);
                    }
                };
                retroWorker.addEventListener('message', handler);
                retroWorker.postMessage({ 
                    id: msgId, 
                    type: 'floyd-steinberg', 
                    imageData, 
                    params: { palette, contrast: retroFilter.params?.contrast ?? 1.0 } 
                }, [imageData.data.buffer]);
            });
            
            // Load processed data back into a new texture
            ctx.putImageData(processedImageData, 0, 0);
            const newTexture = Texture.from(tempCanvas);
            
            // Replace sprite's texture and clear preFilters (since they're already baked in)
            sprite.texture = newTexture;
            preFilters = [];
            sprite.filters = null;
        }

        if (combinedFilters.length === 0 && combinedOverlays.length === 0 && preFilters.length === 0 && postFilters.length === 0 && !textureOverlay) {
            const dataUrl = await app.renderer.extract.base64({
                target: sprite,
                frame: new Rectangle(0, 0, w, h)
            });
            texture.destroy(true);
            return dataUrl;
        }

        // Force padding to 0 to prevent image shifting
        const allFilters = [...preFilters, ...combinedFilters, ...postFilters];
        allFilters.forEach(f => {
            if (f) f.padding = 0;
        });

        // Apply filters to sprite
        sprite.filters = allFilters;

        // Create a container for sprite + optional timestamp text + graphical overlays
        const container = new Container();
        container.addChild(sprite);

        // Add Retro texture overlay if configured
        if (textureOverlay && textureOverlay.tex) {
            const overlaySprite = new TilingSprite({
                texture: textureOverlay.tex,
                width: w,
                height: h,
            });
            overlaySprite.blendMode = textureOverlay.blend;
            overlaySprite.alpha = textureOverlay.alpha;
            container.addChild(overlaySprite);
        }

        // Add graphical overlays (Light leaks, Duotones, etc.)
        for (const overlayFn of combinedOverlays) {
            overlayFn(container, w, h);
        }

        // Add timestamp overlays if configured
        for (const ts of combinedTimestamps) {
            addTimestampOverlay(container, ts, w, h);
        }

        // Add to stage, render, then extract (fixes blank texture issues)
        app.stage.removeChildren();
        app.stage.addChild(container);
        app.render(); // Force GPU to upload textures and evaluate filters

        const dataUrl = await app.renderer.extract.base64({
            target: container,
            frame: new Rectangle(0, 0, w, h),
            clearColor: '#00000000'
        });

        app.stage.removeChildren();
        sprite.filters = null;
        texture.destroy(true);

        return dataUrl;
    } catch (err) {
        console.error("Pixi render failed:", err);
        try {
            // Draw the error message to the canvas
            const { Graphics } = await import('pixi.js');
            const errorContainer = new Container();
            const bg = new Graphics().rect(0, 0, 800, 600).fill(0x330000);
            errorContainer.addChild(bg);

            const errText = new Text({
                text: `ERROR:\n${err.stack || err.message || err}`,
                style: { fill: 0xff3333, fontSize: 16, wordWrap: true, wordWrapWidth: 760 }
            });
            errText.x = 20;
            errText.y = 20;
            errorContainer.addChild(errText);

            app.renderer.resize(800, 600);
            const renderTex = app.renderer.generateTexture({ target: errorContainer });
            const dataUrl = await app.renderer.extract.base64(renderTex);
            renderTex.destroy(true);
            return dataUrl;
        } catch (innerErr) {
            return "";
        }
    }
}

/**
 * Apply a filter to an image for preview display.
 * Generate a preview of the filtered image
 * @param {string} src - source image
 * @param {Array<{id: string, intensity: number, visible: boolean}>} activeFilters
 * @returns {Promise<string>}
 */
export function applyFilter(src, activeFilters) {
    return renderFiltered(src, activeFilters, MAX_PREVIEW_DIM);
}

/**
 * Generate a full-resolution filtered image for export
 * @param {string} src - source image
 * @param {Array<{id: string, intensity: number, visible: boolean}>} activeFilters
 * @returns {Promise<string>}
 */
export function exportFiltered(src, activeFilters) {
    return renderFiltered(src, activeFilters, null);
}

/**
 * Cleanup — destroy the Pixi application.
 */
export function destroyFilterEngine() {
    if (app) {
        try {
            app.destroy(false, { children: true });
        } catch (e) {
            console.error("Error destroying Pixi app:", e);
        }
        app = null;
        initialized = false;
    }
}
