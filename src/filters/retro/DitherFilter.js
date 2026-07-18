import { Filter, UniformGroup, defaultFilterVert as defaultVertex } from 'pixi.js';

const fragment = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uMatrixScale;
uniform float uContrast;
uniform vec2 uResolution;

// 4x4 Bayer Dithering Matrix
// Values normalized to 0.0 - 1.0 (divided by 16)
float getBayerThreshold(vec2 pos) {
    int x = int(mod(pos.x, 4.0));
    int y = int(mod(pos.y, 4.0));
    
    float bayer[16] = float[16](
        0.0/16.0, 8.0/16.0, 2.0/16.0, 10.0/16.0,
        12.0/16.0, 4.0/16.0, 14.0/16.0, 6.0/16.0,
        3.0/16.0, 11.0/16.0, 1.0/16.0, 9.0/16.0,
        15.0/16.0, 7.0/16.0, 13.0/16.0, 5.0/16.0
    );
    
    // Convert 2D index to 1D index
    return bayer[y * 4 + x];
}

void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    
    // Calculate luminance
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // Apply contrast
    luma = (luma - 0.5) * uContrast + 0.5;
    luma = clamp(luma, 0.0, 1.0);
    
    // Get pixel coordinate in the scaled Bayer grid
    vec2 pos = vTextureCoord * uResolution / uMatrixScale;
    
    // Compare luminance against Bayer threshold
    float threshold = getBayerThreshold(pos);
    float dithered = luma > threshold ? 1.0 : 0.0;
    
    finalColor = vec4(vec3(dithered), color.a);
}
`;

export function createDitherFilter(options = {}) {
    return Filter.from({
        gl: { fragment, vertex: defaultVertex },
        resources: {
            ditherUniforms: new UniformGroup({
                uMatrixScale: { value: options.matrixScale ?? 4.0, type: 'f32' },
                uContrast:    { value: options.contrast    ?? 1.0, type: 'f32' },
                uResolution:  { value: options.resolution  ?? [800.0, 600.0], type: 'vec2<f32>' }
            }, false, false),
        },
    });
}
