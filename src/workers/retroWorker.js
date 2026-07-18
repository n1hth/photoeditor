import { PALETTES } from '../utils/palettes.js';

// Simple nearest neighbor in RGB space
function findNearestColor(r, g, b, palette) {
    let minDistanceSq = Infinity;
    let nearestIndex = 0;
    
    for (let i = 0; i < palette.length; i += 3) {
        const pr = palette[i];
        const pg = palette[i + 1];
        const pb = palette[i + 2];
        
        // Euclidean distance squared
        const distSq = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
        
        if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            nearestIndex = i;
        }
    }
    
    return [palette[nearestIndex], palette[nearestIndex + 1], palette[nearestIndex + 2]];
}

function applyFloydSteinberg(imageData, paletteName, contrast = 1.0) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const palette = PALETTES[paletteName] || PALETTES.bw;
    
    // Apply optional contrast stretch before dithering
    if (contrast !== 1.0) {
        const intercept = 128 * (1 - contrast);
        for (let i = 0; i < data.length; i += 4) {
            data[i]     = data[i] * contrast + intercept;
            data[i + 1] = data[i + 1] * contrast + intercept;
            data[i + 2] = data[i + 2] * contrast + intercept;
        }
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            
            const oldR = data[i];
            const oldG = data[i + 1];
            const oldB = data[i + 2];
            
            const [newR, newG, newB] = findNearestColor(oldR, oldG, oldB, palette);
            
            data[i]     = newR;
            data[i + 1] = newG;
            data[i + 2] = newB;
            
            const errR = oldR - newR;
            const errG = oldG - newG;
            const errB = oldB - newB;
            
            // Distribute error
            const addError = (xOff, yOff, ratio) => {
                if (x + xOff >= 0 && x + xOff < width && y + yOff < height) {
                    const idx = ((y + yOff) * width + (x + xOff)) * 4;
                    data[idx]     += errR * ratio;
                    data[idx + 1] += errG * ratio;
                    data[idx + 2] += errB * ratio;
                }
            };
            
            addError(1, 0, 7/16);
            addError(-1, 1, 3/16);
            addError(0, 1, 5/16);
            addError(1, 1, 1/16);
        }
    }
    
    // Clamp to 0-255 handled implicitly by Uint8ClampedArray
    return imageData;
}

self.onmessage = function(e) {
    const { id, type, imageData, params } = e.data;
    
    try {
        if (type === 'floyd-steinberg') {
            const result = applyFloydSteinberg(imageData, params.palette, params.contrast);
            self.postMessage({ id, imageData: result }, [result.data.buffer]);
        } else {
            self.postMessage({ id, error: 'Unknown worker task type' });
        }
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};
