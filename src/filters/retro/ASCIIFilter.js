import { Filter, UniformGroup, Texture, defaultFilterVert as defaultVertex } from 'pixi.js';

let asciiAtlasTexture = null;

// The 10 characters used, ordered from darkest to lightest
const ASCII_CHARS = " .:-=+*#%@";
const CHAR_WIDTH = 12;
const CHAR_HEIGHT = 16;
const ATLAS_WIDTH = ASCII_CHARS.length * CHAR_WIDTH;
const ATLAS_HEIGHT = CHAR_HEIGHT;

/**
 * Generate a 1D texture atlas containing the 10 ASCII characters.
 * This is done once and cached.
 */
function getASCIIAtlas() {
    if (asciiAtlasTexture) return asciiAtlasTexture;

    const canvas = document.createElement('canvas');
    canvas.width = ATLAS_WIDTH;
    canvas.height = ATLAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    
    // Transparent background
    ctx.clearRect(0, 0, ATLAS_WIDTH, ATLAS_HEIGHT);
    
    // Draw characters
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < ASCII_CHARS.length; i++) {
        const x = i * CHAR_WIDTH + (CHAR_WIDTH / 2);
        const y = CHAR_HEIGHT / 2;
        ctx.fillText(ASCII_CHARS[i], x, y);
    }
    
    asciiAtlasTexture = Texture.from(canvas);
    return asciiAtlasTexture;
}

const fragment = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform sampler2D uCharAtlas;
uniform float uCellSize;
uniform float uColored;
uniform vec2 uResolution;

// 10 characters in the atlas
const float NUM_CHARS = 10.0;

void main(void) {
    // Determine which cell this pixel belongs to
    vec2 pixels = uResolution / uCellSize;
    vec2 cellCoord = floor(vTextureCoord * pixels) / pixels;
    
    // The relative position within the current cell [0..1]
    vec2 intraCell = fract(vTextureCoord * pixels);
    
    // Sample the center of the cell for average luminance
    vec2 centerCoord = cellCoord + (0.5 / pixels);
    vec4 cellColor = texture(uTexture, centerCoord);
    
    // Calculate luminance
    float luma = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));
    
    // Map luminance to a character index (0 to NUM_CHARS - 1)
    float charIndex = floor(luma * (NUM_CHARS - 0.01));
    
    // Calculate the UV coordinate in the character atlas
    // Atlas is 1x10 characters wide
    vec2 atlasUV = vec2(
        (charIndex + intraCell.x) / NUM_CHARS,
        intraCell.y
    );
    
    // Sample the atlas
    float charMask = texture(uCharAtlas, atlasUV).a;
    
    vec3 outColor;
    if (uColored > 0.5) {
        outColor = cellColor.rgb * charMask;
    } else {
        outColor = vec3(charMask);
    }
    
    // Background is black
    finalColor = vec4(outColor, cellColor.a);
}
`;

export function createASCIIFilter(options = {}) {
    return Filter.from({
        gl: { fragment, vertex: defaultVertex },
        resources: {
            asciiUniforms: new UniformGroup({
                uCellSize:   { value: options.cellSize ?? 8.0, type: 'f32' },
                uColored:    { value: (options.colored ?? true) ? 1.0 : 0.0, type: 'f32' },
                uResolution: { value: options.resolution ?? [800.0, 600.0], type: 'vec2<f32>' }
            }, false, false),
            uCharAtlas: getASCIIAtlas().source
        },
    });
}
