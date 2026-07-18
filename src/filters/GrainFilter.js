/**
 * GrainFilter — Custom PIXI.Filter for procedural film grain.
 * Generates noise entirely in the GPU shader (no texture assets needed).
 * Blends noise in overlay mode with the source image.
 *
 * Uniforms:
 *   uIntensity  f32  Grain strength (0–1)
 *   uSeed       f32  Random seed (change for animation, keep fixed for static grain)
 *   uSize       f32  Grain size multiplier (1.0 = pixel-level)
 */
import { Filter, UniformGroup, defaultFilterVert as defaultVertex } from 'pixi.js';


const fragment = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;

uniform float uIntensity;
uniform float uSeed;
uniform float uSize;

// Fast hash-based noise
float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

// Overlay blend mode (per-channel)
float overlay(float base, float blend) {
    return base < 0.5
        ? 2.0 * base * blend
        : 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
}

void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);

    // Generate noise at scaled coordinates
    vec2 noiseCoord = floor(vTextureCoord * uSize * 512.0) / (uSize * 512.0);
    float noise = hash(noiseCoord * 1000.0 + uSeed);

    // Overlay blend the noise with the image
    vec3 grainColor = vec3(
        overlay(color.r, noise),
        overlay(color.g, noise),
        overlay(color.b, noise)
    );

    // Mix based on intensity
    finalColor = vec4(mix(color.rgb, grainColor, uIntensity), color.a);
}
`;

export function createGrainFilter(options = {}) {
    return Filter.from({
        gl: { fragment, vertex: defaultVertex },
        resources: {
            grainUniforms: new UniformGroup({
                uIntensity: { value: options.intensity ?? 0.15, type: 'f32' },
                uSeed:      { value: options.seed      ?? 0.0,  type: 'f32' },
                uSize:      { value: options.size      ?? 1.0,  type: 'f32' },
            }, false, false),
        },
    });
}
