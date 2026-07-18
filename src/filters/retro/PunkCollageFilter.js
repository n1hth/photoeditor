import { Filter, UniformGroup, defaultFilterVert as defaultVertex } from 'pixi.js';

const fragment = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec3 uBgColor;
uniform float uScribbleOpacity;
uniform float uSeed;
uniform vec2 uResolution;

// Procedural noise and shapes for the "Punk Collage" scribble effect
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233) + uSeed)) * 43758.5453);
}

// Value noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM (Fractal Brownian Motion)
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    
    // 1. High contrast & desaturation for the subject
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // Boost contrast significantly
    float contrastLuma = (luma - 0.5) * 2.5 + 0.5;
    contrastLuma = clamp(contrastLuma, 0.0, 1.0);
    
    // 2. Cutout effect (thresholding to background)
    // If the pixel is very dark, replace it with the solid background color
    vec3 baseImage = vec3(contrastLuma);
    float cutoutMask = smoothstep(0.1, 0.25, contrastLuma);
    vec3 compColor = mix(uBgColor, baseImage, cutoutMask);
    
    // 3. Procedural scribbles/tape
    // Generate some structural noise lines
    vec2 pos = vTextureCoord * uResolution;
    
    // Wavy lines
    float n1 = fbm(pos * 0.01);
    float n2 = fbm(pos * 0.015 + vec2(10.0, 20.0));
    
    // Sharp jagged shapes (simulate torn tape or marker)
    float scribbleLine = smoothstep(0.48, 0.5, fbm(pos * 0.005 + n1 * 5.0));
    float marker = smoothstep(0.6, 0.65, fbm(vec2(pos.y * 0.02, pos.x * 0.001) + n2 * 10.0));
    
    // Combine scribbles
    float scribbleMask = clamp(scribbleLine * marker * 1.5, 0.0, 1.0);
    
    // Blend scribbles over the image (as black ink)
    compColor = mix(compColor, vec3(0.1), scribbleMask * uScribbleOpacity);
    
    // Add overall grunge/grain
    float grunge = noise(pos * 0.5) * 0.1 - 0.05;
    compColor += grunge;
    
    finalColor = vec4(compColor, color.a);
}
`;

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
}

export function createPunkFilter(options = {}) {
    const bgColor = hexToRgb(options.bgColor ?? '#ff2d6f');
    
    return Filter.from({
        gl: { fragment, vertex: defaultVertex },
        resources: {
            punkUniforms: new UniformGroup({
                uBgColor:         { value: bgColor, type: 'vec3<f32>' },
                uScribbleOpacity: { value: options.scribbleOpacity ?? 0.6, type: 'f32' },
                uSeed:            { value: Math.random() * 100.0, type: 'f32' },
                uResolution:      { value: options.resolution ?? [800.0, 600.0], type: 'vec2<f32>' }
            }, false, false),
        },
    });
}
