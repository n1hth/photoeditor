/**
 * filterStacks.js — defines getFilterStack(name, intensity) which returns
 * an ordered PIXI.Filter[] array for each of the 10 WebGL filters.
 *
 * Each filter is built from community pixi-filters (AdjustmentFilter,
 * AdvancedBloomFilter, RGBSplitFilter) and our 3 custom shaders
 * (SplitToneFilter, GrainFilter, VignetteFilter).
 */
import { AdjustmentFilter, AdvancedBloomFilter, RGBSplitFilter } from 'pixi-filters';
import { ColorMatrixFilter, Texture, Sprite, BlurFilter } from 'pixi.js';
import { createSplitToneFilter } from './SplitToneFilter';
import { createGrainFilter } from './GrainFilter';
import { createVignetteFilter } from './VignetteFilter';
import { createPixelateFilter } from './retro/PixelateFilter';
import { createHalftoneFilter } from './retro/HalftoneFilter';
import { createDitherFilter } from './retro/DitherFilter';
import { createTeletextFilter } from './retro/TeletextFilter';
import { createASCIIFilter } from './retro/ASCIIFilter';
import { createPunkFilter } from './retro/PunkCollageFilter';
import { FILTERS } from '../utils/constants';

/**
 * Lerp a value toward a default based on intensity (0–1).
 * At intensity=0 → defaultVal, at intensity=1 → targetVal.
 */
function lerp(defaultVal, targetVal, intensity) {
    return defaultVal + (targetVal - defaultVal) * intensity;
}

/**
 * Scale an AdjustmentFilter's parameters toward their identity values.
 * Identity: contrast=1, saturation=1, brightness=1, gamma=1, red=1, green=1, blue=1
 */
function scaleAdjustment(filter, intensity) {
    const orig = filter._origParams;
    if (!orig) return;
    filter.contrast   = lerp(1, orig.contrast,   intensity);
    filter.saturation = lerp(1, orig.saturation, intensity);
    filter.brightness = lerp(1, orig.brightness, intensity);
    filter.gamma      = lerp(1, orig.gamma,      intensity);
    filter.red        = lerp(1, orig.red,        intensity);
    filter.green      = lerp(1, orig.green,      intensity);
    filter.blue       = lerp(1, orig.blue,       intensity);
}

/**
 * Create an AdjustmentFilter and store its original params for intensity scaling.
 */
function adj(params) {
    const f = new AdjustmentFilter({
        contrast:   params.contrast   ?? 1,
        saturation: params.saturation ?? 1,
        brightness: params.brightness ?? 1,
        gamma:      params.gamma      ?? 1,
        red:        params.red        ?? 1,
        green:      params.green      ?? 1,
        blue:       params.blue       ?? 1,
    });
    f._origParams = { ...params, contrast: params.contrast ?? 1, saturation: params.saturation ?? 1, brightness: params.brightness ?? 1, gamma: params.gamma ?? 1, red: params.red ?? 1, green: params.green ?? 1, blue: params.blue ?? 1 };
    return f;
}

/**
 * The 10 filter stack builders.
 * Each returns { filters: PIXI.Filter[], texts?: TextConfig[] }
 */
const FILTER_BUILDERS = {
    /* ── 1. Kodak Gold 200 ── */
    kodakGold: () => ({
        filters: [
            adj({ contrast: 1.15, saturation: 1.2, brightness: 1.02 }),
            createSplitToneFilter({
                shadowColor: [0.35, 0.33, 0.38],
                highlightColor: [1.0, 0.88, 0.55],
                balance: 0.45,
                strength: 0.4,
            }),
            createGrainFilter({ intensity: 0.12, seed: 1.0, size: 1.2 }),
            createVignetteFilter({
                flash: false,
                radius: 0.35,
                softness: 0.4,
                darkness: 0.45,
                edgeColor: [0.9, 0.75, 0.5],
            }),
        ],
    }),

    /* ── 2. Kodak Portra 400 ── */
    kodakPortra: () => ({
        filters: [
            adj({ contrast: 0.9, saturation: 0.85, brightness: 1.04 }),
            createSplitToneFilter({
                shadowColor: [0.45, 0.4, 0.38],     // warm neutral shadows
                highlightColor: [1.0, 0.94, 0.88],  // pale cream/pink highlights
                balance: 0.5,
                strength: 0.35,
            }),
            createGrainFilter({ intensity: 0.08, seed: 2.0, size: 1.0 }),
        ],
    }),

    /* ── 3. Fuji Superia ── */
    fujiSuperia: () => ({
        filters: [
            adj({ contrast: 1.2, saturation: 1.1 }),
            createSplitToneFilter({
                shadowColor: [0.15, 0.45, 0.42],    // teal/green shadows
                highlightColor: [0.95, 0.93, 0.9],  // neutral highlights
                balance: 0.48,
                strength: 0.45,
            }),
            createGrainFilter({ intensity: 0.15, seed: 3.0, size: 1.1 }),
        ],
    }),

    /* ── 4. Disposable Camera Flash ── */
    disposableFlash: () => ({
        filters: [
            adj({ contrast: 1.3, saturation: 1.05, brightness: 1.05 }),
            createVignetteFilter({
                flash: true,
                radius: 0.25,
                softness: 0.5,
                darkness: 0.75,
                edgeColor: [0.5, 0.55, 0.7],  // cool blue edges
            }),
            createGrainFilter({ intensity: 0.2, seed: 4.0, size: 1.3 }),
        ],
    }),

    /* ── 5. Golden Flash Glow ── */
    goldenFlash: () => ({
        filters: [
            adj({ contrast: 1.3, saturation: 1.1, brightness: 1.05 }),
            createVignetteFilter({
                flash: true,
                radius: 0.25,
                softness: 0.5,
                darkness: 0.7,
                edgeColor: [0.5, 0.55, 0.7],
            }),
            new AdvancedBloomFilter({
                threshold: 0.7,
                bloomScale: 1.2,
                brightness: 1.2,
                blur: 10,
                quality: 4,
            }),
            createSplitToneFilter({
                shadowColor: [0.4, 0.35, 0.3],
                highlightColor: [1.0, 0.85, 0.45],  // golden warm highlights
                balance: 0.55,
                strength: 0.25,
            }),
            createGrainFilter({ intensity: 0.15, seed: 5.0, size: 1.2 }),
        ],
    }),

    /* ── 6. Dreamy Glow (Halation) ── */
    dreamyGlow: () => ({
        filters: [
            adj({ contrast: 0.9, brightness: 1.05 }),
            new AdvancedBloomFilter({
                threshold: 0.65,
                bloomScale: 1.5,
                brightness: 1.1,
                blur: 12,
                quality: 4,
            }),
            createSplitToneFilter({
                shadowColor: [0.4, 0.38, 0.37],
                highlightColor: [1.0, 0.96, 0.88],  // subtle warm highlight push
                balance: 0.55,
                strength: 0.2,
            }),
        ],
    }),

    /* ── 7. Polaroid Fade ── */
    polaroidFade: () => ({
        filters: [
            adj({ contrast: 0.8, brightness: 1.06, saturation: 0.85 }),
            createSplitToneFilter({
                shadowColor: [0.45, 0.43, 0.42],    // lifted mid-gray (not black)
                highlightColor: [1.0, 0.96, 0.88],  // warm cream highlights
                balance: 0.4,
                strength: 0.45,
            }),
            createVignetteFilter({
                flash: false,
                radius: 0.4,
                softness: 0.45,
                darkness: 0.3,   // gentle, not dramatic
                edgeColor: [0.8, 0.7, 0.6],
            }),
            createGrainFilter({ intensity: 0.06, seed: 7.0, size: 0.9 }),
        ],
    }),

    /* ── 8. Disposable Camera + Timestamp ── */
    disposableTimestamp: () => ({
        filters: [
            adj({ contrast: 1.3, saturation: 1.05, brightness: 1.05 }),
            createVignetteFilter({
                flash: true,
                radius: 0.25,
                softness: 0.5,
                darkness: 0.75,
                edgeColor: [0.5, 0.55, 0.7],
            }),
            createGrainFilter({ intensity: 0.2, seed: 8.0, size: 1.3 }),
        ],
        timestamp: {
            text: () => {
                const now = new Date();
                const mo = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const yy = String(now.getFullYear()).slice(-2);
                return `'${mo}  ${dd}  '${yy}`;
            },
            color: 0xff6a1a,
            position: 'bottom-right',
            fontFamily: '"Courier New", monospace',
            glow: true,
        },
    }),

    /* ── 9. VHS Timestamp ── */
    vhsTimestamp: () => ({
        filters: [
            new RGBSplitFilter({
                red: { x: 2, y: 0 },
                green: { x: 0, y: 0 },
                blue: { x: -2, y: 0 },
            }),
            adj({ contrast: 0.92, saturation: 0.88, brightness: 0.98 }),
            createSplitToneFilter({
                shadowColor: [0.5, 0.15, 0.35],     // magenta shadows
                highlightColor: [0.6, 0.95, 0.95],  // cyan highlights
                balance: 0.5,
                strength: 0.4,
            }),
            createGrainFilter({ intensity: 0.12, seed: 9.0, size: 1.5 }),
        ],
        timestamp: {
            text: () => {
                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
                return `REC ● ${hh}:${mm} ${ampm}`;
            },
            color: 0xffffff,
            position: 'top-left',
            fontFamily: '"Courier New", monospace',
            glow: true,
        },
    }),

    /* ── 10. Cross-Process Flash ── */
    crossProcessFlash: () => ({
        filters: [
            createVignetteFilter({
                flash: true,
                radius: 0.25,
                softness: 0.5,
                darkness: 0.7,
                edgeColor: [0.5, 0.55, 0.7],
            }),
            createSplitToneFilter({
                shadowColor: [0.1, 0.5, 0.2],        // green shadows (strong)
                highlightColor: [0.9, 0.4, 0.65],    // magenta highlights (strong)
                balance: 0.5,
                strength: 0.55,
            }),
            adj({ contrast: 1.35, saturation: 1.15, brightness: 1.02 }),
            createGrainFilter({ intensity: 0.25, seed: 10.0, size: 1.4 }),
        ],
    }),

    /* ── RETRO SHADERS ── */
    retroPixelate: (params) => ({
        filters: [createPixelateFilter(params)]
    }),
    retroFatPixel: (params) => ({
        filters: [createPixelateFilter(params)]
    }),
    retroBootleg: (params) => ({
        filters: [createPixelateFilter(params)]
    }),
    retroHalftone: (params) => ({
        filters: [createHalftoneFilter({ ...params, mode: 0.0 })]
    }),
    retroCMYK: (params) => ({
        filters: [createHalftoneFilter({ ...params, mode: 1.0 })]
    }),
    retroRiso: (params) => ({
        filters: [createHalftoneFilter({ ...params, mode: 2.0 })]
    }),
    retroDither: (params) => ({
        filters: [createDitherFilter(params)]
    }),
    retroTeletext: (params) => ({
        filters: [createTeletextFilter(params)]
    }),
    retroASCII: (params) => ({
        filters: [createASCIIFilter(params)]
    }),
    retroPunk: (params) => ({
        filters: [createPunkFilter(params)]
    })
};

/**
 * Get the PIXI.Filter stack for a given filter name.
 * Returns { filters: Filter[], timestamp?: object } or null if not a Pixi filter.
 *
 * @param {string} name - Filter key (e.g. 'kodakGold')
 * @param {number} intensity - 0–100 intensity value
 * @param {object} params - Optional parameters for retro shaders
 * @returns {{ filters: Filter[], timestamp?: object } | null}
 */
export function getFilterStack(name, intensity = 100, params = {}) {
    const builder = FILTER_BUILDERS[name];
    const t = intensity / 100;
    let stack;
    
    if (builder) {
        stack = builder(params);
    } else if (FILTERS[name]) {
        // Fallback to dynamic parsing for legacy filters and effects
        const filterDef = FILTERS[name];
        stack = { filters: [], overlays: [] };
        
        if (filterDef.css && filterDef.css !== 'none') {
            if (filterDef.type === 'leak' || filterDef.type === 'duotone') {
                stack.overlays.push((container, w, h) => createEffectOverlay(name, filterDef, container, w, h, t));
            } else {
                const parsed = parseCSSFilter(filterDef.css, t);
                stack.filters = parsed.filters;
            }
        }
    } else {
        return null;
    }

    // Scale all filter parameters by intensity
    for (const filter of stack.filters) {
        if (filter.resources?.splitToneUniforms) {
            filter.resources.splitToneUniforms.uniforms.uStrength *= t;
        } else if (filter.resources?.grainUniforms) {
            filter.resources.grainUniforms.uniforms.uIntensity *= t;
        } else if (filter.resources?.vignetteUniforms) {
            filter.resources.vignetteUniforms.uniforms.uStrength = t;
        } else if (filter instanceof AdjustmentFilter) {
            if (filter._origParams) {
                scaleAdjustment(filter, t);
            }
        } else if (filter instanceof AdvancedBloomFilter) {
            filter.bloomScale = lerp(0, filter.bloomScale, t);
        } else if (filter instanceof RGBSplitFilter) {
            filter.red = { x: filter.red.x * t, y: filter.red.y * t };
            filter.blue = { x: filter.blue.x * t, y: filter.blue.y * t };
        } else if (filter instanceof ColorMatrixFilter) {
            if (filter._origAlpha !== undefined) {
                filter.alpha = filter._origAlpha * t;
            }
        } else if (filter instanceof BlurFilter) {
            if (filter._origBlur !== undefined) {
                filter.blur = filter._origBlur * t;
            }
        }
    }

    return stack;
}

function parseCSSFilter(css, t) {
    const filters = [];
    if (!css || css === 'none') return { filters };

    let contrast = 1, saturation = 1, brightness = 1;
    let sepiaAmt = 0, hueRotate = 0, grayscale = 0, blurAmt = 0;

    const matches = css.matchAll(/([a-z-]+)\(([^)]+)\)/g);
    for (const match of matches) {
        const func = match[1];
        const valStr = match[2];
        let val = parseFloat(valStr);
        if (valStr.includes('deg')) val = parseFloat(valStr);
        else if (valStr.includes('%')) val = val / 100;

        if (func === 'brightness') brightness = val;
        else if (func === 'contrast') contrast = val;
        else if (func === 'saturate') saturation = val;
        else if (func === 'sepia') sepiaAmt = val;
        else if (func === 'grayscale') grayscale = val;
        else if (func === 'hue-rotate') hueRotate = val;
        else if (func === 'blur') blurAmt = val;
    }

    if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
        filters.push(adj({ brightness, contrast, saturation }));
    }
    
    if (sepiaAmt > 0) {
        const cm = new ColorMatrixFilter();
        cm.sepia(false);
        cm.alpha = sepiaAmt;
        cm._origAlpha = sepiaAmt;
        filters.push(cm);
    }
    if (grayscale > 0) {
        const cm = new ColorMatrixFilter();
        cm.greyscale(1, false);
        cm.alpha = grayscale;
        cm._origAlpha = grayscale;
        filters.push(cm);
    }
    if (hueRotate !== 0) {
        const cm = new ColorMatrixFilter();
        cm.hue(hueRotate, false);
        cm._origAlpha = 1; 
        filters.push(cm);
    }
    if (blurAmt > 0) {
        const bf = new BlurFilter();
        bf.blur = blurAmt;
        bf._origBlur = blurAmt;
        filters.push(bf);
    }

    return { filters };
}

function createEffectOverlay(effectId, filterDef, container, w, h, t) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    if (effectId === 'leakWarm') {
        const grd = ctx.createLinearGradient(0, h, w, 0);
        grd.addColorStop(0, 'rgba(255,100,0,0.4)');
        grd.addColorStop(0.4, 'rgba(255,200,0,0.1)');
        grd.addColorStop(0.7, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0,0,w,h);
    } else if (effectId === 'leakPrism') {
        const grd = ctx.createLinearGradient(0, 0, w, h);
        grd.addColorStop(0, 'rgba(255,0,255,0.3)');
        grd.addColorStop(0.5, 'rgba(0,255,255,0.2)');
        grd.addColorStop(1, 'rgba(255,255,0,0.2)');
        ctx.fillStyle = grd;
        ctx.fillRect(0,0,w,h);
    } else if (effectId === 'leakVHS') {
        const grd = ctx.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0.4, 'transparent');
        grd.addColorStop(0.45, 'rgba(255,0,0,0.1)');
        grd.addColorStop(0.5, 'rgba(0,255,0,0.1)');
        grd.addColorStop(0.55, 'rgba(0,0,255,0.1)');
        grd.addColorStop(0.6, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0,0,w,h);
    } else if (effectId === 'duoMidnight') {
        const grd = ctx.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0, '#0a0033');
        grd.addColorStop(1, '#ff0055');
        ctx.fillStyle = grd;
        ctx.fillRect(0,0,w,h);
    } else if (effectId === 'duoSunset') {
        const grd = ctx.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0, '#ff3b5c');
        grd.addColorStop(1, '#ffcc00');
        ctx.fillStyle = grd;
        ctx.fillRect(0,0,w,h);
    } else if (effectId === 'duoCyber') {
        const grd = ctx.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0, '#000000');
        grd.addColorStop(1, '#00ffcc');
        ctx.fillStyle = grd;
        ctx.fillRect(0,0,w,h);
    }

    const texture = Texture.from(canvas);
    const sprite = new Sprite(texture);
    
    sprite.alpha = t;
    if (filterDef.blend) {
        sprite.blendMode = filterDef.blend; // e.g. 'multiply', 'lighten'
    } else {
        sprite.blendMode = 'screen';
    }
    
    container.addChild(sprite);
}

/** Get the list of all Pixi filter names */
export const PIXI_FILTER_NAMES = Object.keys(FILTER_BUILDERS);
