import { Filter, UniformGroup, defaultFilterVert as defaultVertex } from 'pixi.js';

const fragment = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uBlockSize;
uniform vec2 uResolution;

// The 8 classic teletext colors
// 0: Black, 1: Red, 2: Green, 3: Yellow, 4: Blue, 5: Magenta, 6: Cyan, 7: White
const vec3 COLORS[8] = vec3[8](
    vec3(0.0, 0.0, 0.0), // Black
    vec3(1.0, 0.0, 0.0), // Red
    vec3(0.0, 1.0, 0.0), // Green
    vec3(1.0, 1.0, 0.0), // Yellow
    vec3(0.0, 0.0, 1.0), // Blue
    vec3(1.0, 0.0, 1.0), // Magenta
    vec3(0.0, 1.0, 1.0), // Cyan
    vec3(1.0, 1.0, 1.0)  // White
);

void main(void) {
    // Quantize UV coordinates for blocky pixelation
    vec2 pixels = uResolution / uBlockSize;
    vec2 pixelatedUV = floor(vTextureCoord * pixels) / pixels;
    
    // Sample color at quantized UV
    vec4 color = texture(uTexture, pixelatedUV);
    
    // Find the nearest teletext color
    float minDist = 10.0;
    vec3 nearestColor = COLORS[0];
    
    for (int i = 0; i < 8; i++) {
        float d = distance(color.rgb, COLORS[i]);
        if (d < minDist) {
            minDist = d;
            nearestColor = COLORS[i];
        }
    }
    
    finalColor = vec4(nearestColor, color.a);
}
`;

export function createTeletextFilter(options = {}) {
    return Filter.from({
        gl: { fragment, vertex: defaultVertex },
        resources: {
            teletextUniforms: new UniformGroup({
                uBlockSize:  { value: options.blockSize  ?? 14.0, type: 'f32' },
                uResolution: { value: options.resolution ?? [800.0, 600.0], type: 'vec2<f32>' }
            }, false, false),
        },
    });
}
