/**
 * VignetteFilter — Custom PIXI.Filter for radial vignette / flash-falloff.
 * Supports two modes:
 *   - Vignette (dark edges, clear center)
 *   - Flash (bright center hotspot, cool dark edges — disposable camera look)
 *
 * Uniforms:
 *   uRadius    f32   Falloff radius (0–1)
 *   uSoftness  f32   Edge softness
 *   uCenter    vec2  Center point (default 0.5, 0.5)
 *   uDarkness  f32   Edge darkness amount (0–1)
 *   uFlashMode f32   0 = dark vignette, 1 = flash hotspot
 *   uEdgeColor vec3  Tint for edge region
 *   uStrength  f32   Overall intensity (0–1)
 */
import { Filter, UniformGroup, defaultFilterVert as defaultVertex } from 'pixi.js';


const fragment = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;

uniform float uRadius;
uniform float uSoftness;
uniform vec2  uCenter;
uniform float uDarkness;
uniform float uFlashMode;
uniform vec3  uEdgeColor;
uniform float uStrength;

void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);

    // Distance from center, adjusted for aspect ratio
    vec2 dist = vTextureCoord - uCenter;
    float d = length(dist);

    // Falloff curve
    float vignette = smoothstep(uRadius, uRadius + uSoftness, d);

    if (uFlashMode > 0.5) {
        // Flash mode: darken + cool-tint edges, keep center bright
        vec3 edgeTint = mix(color.rgb, uEdgeColor * color.rgb, vignette * uDarkness);
        vec3 result = mix(color.rgb, edgeTint, uStrength);
        finalColor = vec4(result, color.a);
    } else {
        // Vignette mode: darken edges with optional warm tint
        float darken = 1.0 - vignette * uDarkness;
        vec3 tinted = mix(color.rgb * darken, uEdgeColor * color.rgb * darken, vignette * 0.3);
        vec3 result = mix(color.rgb, tinted, uStrength);
        finalColor = vec4(result, color.a);
    }
}
`;

export function createVignetteFilter(options = {}) {
    const isFlash = options.flash ?? false;
    
    return Filter.from({
        gl: { fragment, vertex: defaultVertex },
        resources: {
            vignetteUniforms: new UniformGroup({
                uRadius:    { value: options.radius    ?? (isFlash ? 0.3 : 0.35), type: 'f32' },
                uSoftness:  { value: options.softness  ?? (isFlash ? 0.45 : 0.4), type: 'f32' },
                uCenter:    { value: options.center    ?? [0.5, 0.5],              type: 'vec2<f32>' },
                uDarkness:  { value: options.darkness   ?? (isFlash ? 0.7 : 0.6),  type: 'f32' },
                uFlashMode: { value: isFlash ? 1.0 : 0.0,                          type: 'f32' },
                uEdgeColor: { value: options.edgeColor ?? (isFlash ? [0.6, 0.65, 0.8] : [0.85, 0.75, 0.6]), type: 'vec3<f32>' },
                uStrength:  { value: options.strength   ?? 1.0,                     type: 'f32' },
            }, false, false),
        },
    });
}
