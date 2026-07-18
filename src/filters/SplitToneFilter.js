/**
 * SplitToneFilter — Custom PIXI.Filter for procedural split-toning.
 * Blends shadow regions toward one color and highlight regions toward another,
 * based on per-pixel luminance. Replaces LUT-based color grading.
 *
 * Uniforms:
 *   uShadowColor   vec3  RGB (0–1) color to push shadows toward
 *   uHighlightColor vec3  RGB (0–1) color to push highlights toward
 *   uBalance        f32   Midpoint balance (0–1, default 0.5)
 *   uStrength       f32   Overall intensity (0–1)
 */
import { Filter, UniformGroup, defaultFilterVert as defaultVertex } from 'pixi.js';


const fragment = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;

uniform vec3 uShadowColor;
uniform vec3 uHighlightColor;
uniform float uBalance;
uniform float uStrength;

void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);

    // Luminance (Rec. 709)
    float lum = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

    // Smooth interpolation: shadows below balance, highlights above
    float shadowWeight  = 1.0 - smoothstep(0.0, uBalance, lum);
    float highlightWeight = smoothstep(uBalance, 1.0, lum);

    // Blend toward tint colors
    vec3 tinted = color.rgb;
    tinted = mix(tinted, mix(tinted, uShadowColor, 0.5), shadowWeight * uStrength);
    tinted = mix(tinted, mix(tinted, uHighlightColor, 0.5), highlightWeight * uStrength);

    finalColor = vec4(tinted, color.a);
}
`;

export function createSplitToneFilter(options = {}) {
    return Filter.from({
        gl: { fragment, vertex: defaultVertex },
        resources: {
            splitToneUniforms: new UniformGroup({
                uShadowColor:    { value: options.shadowColor    ?? [0.0, 0.0, 0.0], type: 'vec3<f32>' },
                uHighlightColor: { value: options.highlightColor ?? [1.0, 1.0, 1.0], type: 'vec3<f32>' },
                uBalance:        { value: options.balance        ?? 0.5,             type: 'f32' },
                uStrength:       { value: options.strength       ?? 1.0,             type: 'f32' },
            }, false, false),
        },
    });
}
