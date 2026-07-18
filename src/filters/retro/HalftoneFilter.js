import { Filter, UniformGroup, defaultFilterVert as defaultVertex } from 'pixi.js';

const fragment = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uDotScale;
uniform float uAngle;
uniform float uMode;       // 0: Halftone, 1: CMYK, 2: Risograph
uniform vec3 uInkColor;    // Used for Risograph mode
uniform vec2 uResolution;

// 2D Rotation matrix
mat2 rotate(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

// Convert RGB to CMYK
vec4 rgb2cmyk(vec3 rgb) {
    float k = 1.0 - max(max(rgb.r, rgb.g), rgb.b);
    if (k == 1.0) return vec4(0.0, 0.0, 0.0, 1.0);
    float c = (1.0 - rgb.r - k) / (1.0 - k);
    float m = (1.0 - rgb.g - k) / (1.0 - k);
    float y = (1.0 - rgb.b - k) / (1.0 - k);
    return vec4(c, m, y, k);
}

// Convert CMYK back to RGB
vec3 cmyk2rgb(vec4 cmyk) {
    float c = cmyk.x;
    float m = cmyk.y;
    float y = cmyk.z;
    float k = cmyk.w;
    float r = (1.0 - c) * (1.0 - k);
    float g = (1.0 - m) * (1.0 - k);
    float b = (1.0 - y) * (1.0 - k);
    return vec3(r, g, b);
}

// Dot pattern generator
float halftoneDot(vec2 uv, float angle, float scale, float intensity) {
    vec2 st = uv * uResolution / scale;
    st = rotate(angle) * st;
    vec2 grid = fract(st) - 0.5;
    float radius = sqrt(1.0 - intensity) * 0.707; // 0.707 = sqrt(2)/2 (max radius)
    return smoothstep(radius, radius - 0.1, length(grid));
}

// Hash for noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    
    if (uMode == 0.0) {
        // Mode 0: Standard Black & White Halftone
        float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float dotVal = halftoneDot(vTextureCoord, radians(uAngle), uDotScale, luma);
        finalColor = vec4(vec3(1.0 - dotVal), color.a);
        
    } else if (uMode == 1.0) {
        // Mode 1: CMYK
        vec4 cmyk = rgb2cmyk(color.rgb);
        
        // CMYK standard angles: C: 15, M: 75, Y: 0, K: 45
        float baseAngle = radians(uAngle);
        float dC = halftoneDot(vTextureCoord, baseAngle + radians(15.0), uDotScale, 1.0 - cmyk.x);
        float dM = halftoneDot(vTextureCoord, baseAngle + radians(75.0), uDotScale, 1.0 - cmyk.y);
        float dY = halftoneDot(vTextureCoord, baseAngle + radians(0.0),  uDotScale, 1.0 - cmyk.z);
        float dK = halftoneDot(vTextureCoord, baseAngle + radians(45.0), uDotScale, 1.0 - cmyk.w);
        
        vec4 outCMYK = vec4(dC, dM, dY, dK);
        finalColor = vec4(cmyk2rgb(outCMYK), color.a);
        
    } else {
        // Mode 2: Risograph
        float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        
        // Misregistration (slight offset for the color layer)
        vec2 offset = vec2(2.0, -1.0) / uResolution;
        vec4 colorOffset = texture(uTexture, vTextureCoord + offset);
        float lumaOffset = dot(colorOffset.rgb, vec3(0.299, 0.587, 0.114));
        
        // Halftone dots for ink layer and black layer
        float inkDot = halftoneDot(vTextureCoord, radians(uAngle), uDotScale, lumaOffset);
        float blackDot = halftoneDot(vTextureCoord, radians(uAngle + 45.0), uDotScale, luma);
        
        // Map ink dot to ink color, black dot to black
        vec3 paper = vec3(0.98, 0.96, 0.92); // Warm paper
        vec3 outColor = paper;
        
        // Blend in ink (multiply)
        outColor *= mix(vec3(1.0), uInkColor, inkDot);
        // Blend in black (multiply)
        outColor *= mix(vec3(1.0), vec3(0.1), blackDot);
        
        // Add some noise
        float noise = hash(vTextureCoord * uResolution) * 0.08 - 0.04;
        outColor += noise;
        
        finalColor = vec4(outColor, color.a);
    }
}
`;

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
}

export function createHalftoneFilter(options = {}) {
    const inkColor = hexToRgb(options.ink ?? '#ff2d6f');
    
    return Filter.from({
        gl: { fragment, vertex: defaultVertex },
        resources: {
            halftoneUniforms: new UniformGroup({
                uMode:       { value: options.mode       ?? 0.0, type: 'f32' },
                uDotScale:   { value: options.dotScale   ?? 6.0, type: 'f32' },
                uAngle:      { value: options.angle      ?? 45.0, type: 'f32' },
                uInkColor:   { value: inkColor, type: 'vec3<f32>' },
                uResolution: { value: options.resolution ?? [800.0, 600.0], type: 'vec2<f32>' }
            }, false, false),
        },
    });
}
