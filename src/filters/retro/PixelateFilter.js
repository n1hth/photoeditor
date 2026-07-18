import { Filter, UniformGroup, defaultFilterVert as defaultVertex } from 'pixi.js';

const fragment = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uBlockSize;
uniform float uColorLevels;
uniform vec2 uResolution;

void main(void) {
    // Quantize UV coordinates for pixelation
    vec2 pixels = uResolution / uBlockSize;
    vec2 pixelatedUV = floor(vTextureCoord * pixels) / pixels;
    
    // Sample color at quantized UV
    vec4 color = texture(uTexture, pixelatedUV);
    
    // Color quantization
    // Prevent div by 0 just in case
    float levels = max(2.0, uColorLevels); 
    
    vec3 quantizedColor = floor(color.rgb * levels + 0.5) / levels;
    
    finalColor = vec4(quantizedColor, color.a);
}
`;

export function createPixelateFilter(options = {}) {
    return Filter.from({
        gl: { fragment, vertex: defaultVertex },
        resources: {
            pixelateUniforms: new UniformGroup({
                uBlockSize:   { value: options.blockSize   ?? 8.0, type: 'f32' },
                uColorLevels: { value: options.colorLevels ?? 8.0, type: 'f32' },
                uResolution:  { value: options.resolution  ?? [800.0, 600.0], type: 'vec2<f32>' }
            }, false, false),
        },
    });
}
