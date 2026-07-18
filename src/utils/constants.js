export const FILTERS = {
    original:   { label:'Original',      css:'none', pixi: true },
    honey:      { label:'Honey',         css:'sepia(0.15) saturate(1.4) brightness(1.08) contrast(1.05)', pixi: true },
    golden:     { label:'Golden',        css:'sepia(0.22) saturate(1.35) brightness(1.06) contrast(1.1) hue-rotate(-3deg)', pixi: true },
    peach:      { label:'Peach',         css:'sepia(0.12) saturate(1.2) brightness(1.1) hue-rotate(-8deg) contrast(1.02)', pixi: true },
    rose:       { label:'Rosé',          css:'sepia(0.08) saturate(1.15) brightness(1.08) hue-rotate(-14deg) contrast(1.04)', pixi: true },
    cinnamon:   { label:'Cinnamon',      css:'sepia(0.28) contrast(1.12) saturate(1.05) brightness(0.96)', pixi: true },
    dreamy:     { label:'Dreamy',        css:'brightness(1.14) contrast(0.82) saturate(0.78) sepia(0.06)', pixi: true },
    cloud:      { label:'Cloud',         css:'brightness(1.16) contrast(0.84) saturate(0.72) sepia(0.03)', pixi: true },
    aura:       { label:'Aura',          css:'brightness(1.1) contrast(0.9) saturate(1.08) hue-rotate(-10deg) sepia(0.06)', pixi: true },
    lavender:   { label:'Lavender',      css:'saturate(0.82) hue-rotate(-18deg) brightness(1.07) contrast(1.03) sepia(0.04)', pixi: true },
    sage:       { label:'Sage',          css:'saturate(0.72) hue-rotate(22deg) brightness(1.06) contrast(0.96) sepia(0.05)', pixi: true },
    frost:      { label:'Frost',         css:'brightness(1.08) contrast(1.06) saturate(0.78) hue-rotate(16deg)', pixi: true },
    moody:      { label:'Moody',         css:'contrast(1.28) brightness(0.86) saturate(0.68) hue-rotate(8deg) sepia(0.06)', pixi: true },
    velvet:     { label:'Velvet',        css:'contrast(1.14) saturate(1.32) brightness(0.94) sepia(0.05)', pixi: true },
    film:       { label:'Film',          css:'contrast(1.08) brightness(1.03) saturate(0.82) sepia(0.1)', pixi: true },
    polaroid:   { label:'Polaroid',      css:'sepia(0.18) contrast(1.12) brightness(1.06) saturate(1.08)', pixi: true },
    sunset:     { label:'Sunset',        css:'sepia(0.2) saturate(1.5) brightness(1.04) hue-rotate(-10deg) contrast(1.06)', pixi: true },
    darkAcad:   { label:'Dark Acad',     css:'sepia(0.22) contrast(1.18) brightness(0.84) saturate(0.68)', pixi: true },
    cottage:    { label:'Cottage',       css:'sepia(0.07) saturate(0.88) brightness(1.1) contrast(0.94) hue-rotate(10deg)', pixi: true },
    cleanGirl:  { label:'Clean',         css:'brightness(1.07) contrast(1.1) saturate(1.12)', pixi: true },
    noir:       { label:'Noir',          css:'grayscale(1) contrast(1.22) brightness(0.94)', pixi: true },
    portra:     { label:'Portra',        css:'sepia(0.15) contrast(0.95) brightness(1.05) saturate(1.2) hue-rotate(-5deg)', pixi: true },
    fuji:       { label:'Fuji',          css:'contrast(1.1) brightness(1.05) saturate(1.1) hue-rotate(5deg) sepia(0.1)', pixi: true },
    vhs:        { label:'VHS',           css:'contrast(1.2) brightness(0.9) saturate(1.5) sepia(0.3) hue-rotate(-15deg) blur(0.5px)', pixi: true },
    disposable: { label:'Disposable',    css:'contrast(1.3) brightness(1.1) saturate(1.2) sepia(0.2)', pixi: true },

    /* ── PIXI WebGL FILTERS (rendered via PixiFilterEngine) ── */
    kodakGold:          { label: 'Kodak Gold',   css: 'none', pixi: true },
    kodakPortra:        { label: 'Portra 400',   css: 'none', pixi: true },
    fujiSuperia:        { label: 'Superia',      css: 'none', pixi: true },
    disposableFlash:    { label: 'Dispo Flash',  css: 'none', pixi: true },
    goldenFlash:        { label: 'Gold Flash',   css: 'none', pixi: true },
    dreamyGlow:         { label: 'Dream Glow',   css: 'none', pixi: true },
    polaroidFade:       { label: 'Pola Fade',    css: 'none', pixi: true },
    disposableTimestamp:{ label: 'Dispo Date',   css: 'none', pixi: true },
    vhsTimestamp:       { label: 'VHS Date',     css: 'none', pixi: true },
    crossProcessFlash:  { label: 'X-Process',    css: 'none', pixi: true },

    /* ── EFFECTS (Now treated as Filters) ── */
    leakWarm: { label: 'Warm Leak', type: 'leak', css: 'linear-gradient(45deg, rgba(255,100,0,0.4) 0%, rgba(255,200,0,0.1) 40%, transparent 70%)', pixi: true },
    leakPrism: { label: 'Prism', type: 'leak', css: 'linear-gradient(135deg, rgba(255,0,255,0.3) 0%, rgba(0,255,255,0.2) 50%, rgba(255,255,0,0.2) 100%)', pixi: true },
    leakVHS: { label: 'VHS', type: 'leak', css: 'linear-gradient(to bottom, transparent 40%, rgba(255,0,0,0.1) 45%, rgba(0,255,0,0.1) 50%, rgba(0,0,255,0.1) 55%, transparent 60%)', pixi: true },
    duoMidnight: { label: 'Midnight', type: 'duotone', css: 'linear-gradient(to bottom, #0a0033 0%, #ff0055 100%)', blend: 'lighten', pixi: true },
    duoSunset: { label: 'Sunset', type: 'duotone', css: 'linear-gradient(to bottom, #ff3b5c 0%, #ffcc00 100%)', blend: 'multiply', pixi: true },
    duoCyber: { label: 'Cyber', type: 'duotone', css: 'linear-gradient(to bottom, #000000 0%, #00ffcc 100%)', blend: 'lighten', pixi: true },

    /* ── RETRO SHADERS (GPU Pixel/Dither/Halftone) ── */
    retroPixelate:  { label: '16-Bit',    css: 'none', pixi: true, retro: true },
    retroFatPixel:  { label: 'Fat Pixel', css: 'none', pixi: true, retro: true },
    retroBootleg:   { label: 'Bootleg',   css: 'none', pixi: true, retro: true },
    retroHalftone:  { label: 'Halftone',  css: 'none', pixi: true, retro: true },
    retroCMYK:      { label: 'CMYK Dots', css: 'none', pixi: true, retro: true },
    retroRiso:      { label: 'Risograph', css: 'none', pixi: true, retro: true },
    retroDither:    { label: '1-Bit',     css: 'none', pixi: true, retro: true },
    retroTeletext:  { label: 'Teletext',  css: 'none', pixi: true, retro: true },
    retroASCII:     { label: 'ASCII',     css: 'none', pixi: true, retro: true },
    retroPunk:      { label: 'Punk',      css: 'none', pixi: true, retro: true }
};

export const FILTER_SETS = {
    'Warm': ['original', 'honey', 'golden', 'peach', 'rose', 'cinnamon', 'sunset'],
    'Cool': ['original', 'dreamy', 'cloud', 'aura', 'lavender', 'sage', 'frost'],
    'Cinematic': ['original', 'portra', 'fuji', 'vhs', 'disposable', 'moody', 'velvet', 'film', 'polaroid', 'darkAcad', 'cottage', 'cleanGirl', 'noir'],
    'Film Stocks': ['original', 'kodakGold', 'kodakPortra', 'fujiSuperia', 'polaroidFade'],
    'Advanced': ['original', 'disposableFlash', 'goldenFlash', 'dreamyGlow', 'disposableTimestamp', 'vhsTimestamp', 'crossProcessFlash'],
    'Effects': ['leakWarm', 'leakPrism', 'leakVHS', 'duoMidnight', 'duoSunset', 'duoCyber'],
    'Retro': ['original', 'retroPixelate', 'retroFatPixel', 'retroBootleg', 'retroHalftone', 'retroCMYK', 'retroRiso', 'retroDither', 'retroTeletext', 'retroASCII', 'retroPunk']
};

export const STICKER_PACKS = [
    {
        name: 'RANDOM STUFF',
        items: [
            '/stickers/RANDOM STUFF/a5de928cf132108cd65749e675111166.jpg',
            '/stickers/RANDOM STUFF/942a76a80ba67cc09f6f6da527f92bd3.png',
            '/stickers/RANDOM STUFF/59946fd8069721ab1e6e04622c8fb165.png',
            '/stickers/RANDOM STUFF/ce436877c3df9c8fbbe7d519286d9d73.png',
            '/stickers/RANDOM STUFF/ab41b0d03c95f08d3d7901a48511a900.jpg',
            '/stickers/RANDOM STUFF/77c5f0648d51c9cea280f705c871c496.png',
            '/stickers/RANDOM STUFF/18ac3906e6a496973effc6a1d871fccc.png',
            '/stickers/RANDOM STUFF/a27a20264f4d26f0f96d8a8574869efa.png',
            '/stickers/RANDOM STUFF/e11e7dc3b460a4bf91a1f3c5b7d3dbe0.png',
            '/stickers/RANDOM STUFF/a97e6d721f25f728be0269c3a7f060cb.png',
            '/stickers/RANDOM STUFF/b371635bf054aa3f295548bca596e978.png',
            '/stickers/RANDOM STUFF/44c50538647bc94892751bd4660b9a3b.png',
            '/stickers/RANDOM STUFF/930f24a9bec2fed0367b41ff5b7ce22d.png',
            '/stickers/RANDOM STUFF/8780ddb7c77889f603a7ecf11b100a3e.png',
            '/stickers/RANDOM STUFF/7f4a78b178bf809f9c343eeba1e31696.png',
            '/stickers/RANDOM STUFF/715e6fd9884be54cf0416783426dc04d.png',
            '/stickers/RANDOM STUFF/b2ff223c0d7d7d686f17fe9868071ecd.png',
            '/stickers/RANDOM STUFF/07be85e46531aa51a02b0f2e1d3ed7d8.png'
        ]
    },
    {
        name: 'CHEEKY EMOJIS',
        items: [
            '/stickers/CHEEKY EMOJIS/bbd7cca7b988d8b36b29e414f7caabd2.png',
            '/stickers/CHEEKY EMOJIS/c37e1a6120e1fabd8f40345eb3e10e39.png',
            '/stickers/CHEEKY EMOJIS/4757f951f27ebc747c356aafa5dcf736.png',
            '/stickers/CHEEKY EMOJIS/3e934061dbe80f1ccf17c4741cf09932.png',
            '/stickers/CHEEKY EMOJIS/ea6ea8267b5787562ad9e9d44ac2ccb4.png',
            '/stickers/CHEEKY EMOJIS/5dae5e7f394c669817f07f151794a0de.png'
        ]
    },
    {
        name: 'CUTE',
        items: [
            '/stickers/CUTE/3f8fbc8f5a71232730d9f1373c8de10e.png',
            '/stickers/CUTE/520327caad32982c2fa65ae3cc9d64db.png',
            '/stickers/CUTE/c51daa3b6afe7e82f37e1f317d82373f.png',
            '/stickers/CUTE/6f9296ad621df9a0080ac417619f8dde.png',
            '/stickers/CUTE/5f78af542fbfea616cb5938cc7235d90.png',
            '/stickers/CUTE/51a2804ea40c46afbda31848055fe4f0.png',
            '/stickers/CUTE/39d025d85c8426253abcb7013cefb524.png',
            '/stickers/CUTE/6a46278a351a0eca995183d52391c7f8.png',
            '/stickers/CUTE/4f40010ee611e5fe23ee7a85c834c922.png',
            '/stickers/CUTE/3e934061dbe80f1ccf17c4741cf09932.png',
            '/stickers/CUTE/451b0d12bf9e682287d32f2b8f99f083.png',
            '/stickers/CUTE/71e9f51eb5c17526805c4275c0186ccb.png',
            '/stickers/CUTE/6795ac5be977ddc27adda6ad95528ab4.jpg',
            '/stickers/CUTE/2d64b4805a1e410936f6c53e89c316e9.png',
            '/stickers/CUTE/237d728ea21ef2567abaa4a27810e38d.png',
            '/stickers/CUTE/39e20c4baf65236b31090a5d12e46bc1.png',
            '/stickers/CUTE/43f782d5c1e80c70908e22406afad2b8.jpg',
            '/stickers/CUTE/2f416ddda4304de5f5cb8f8df696d134.png',
            '/stickers/CUTE/b1ce9f2bfdc96531f246943ee19c4270.png'
        ]
    },
    {
        name: 'SPIDEY',
        items: [
            '/stickers/SPIDEY/a92de38b532c6d250cb937f86af22867.png',
            '/stickers/SPIDEY/70b410c9752b5492f6af9285d18cdde4.png',
            '/stickers/SPIDEY/aa4fd73fd413e1ef080412dbe3777566.png'
        ]
    },
    {
        name: 'MC ENERGY',
        items: [
            '/stickers/MC ENERGY/13aab38ed56c1aabf5b9419ce9037e94.png',
            '/stickers/MC ENERGY/68641c9b794e857c8acd17e563e2f6a1.png',
            '/stickers/MC ENERGY/13410e81ee0fc67f8c629376d25cea31.jpg',
            '/stickers/MC ENERGY/bb4b94cbd1de2593a0b20fb69cdcf4fa.png',
            '/stickers/MC ENERGY/0d38c2c50e9eb6484859cbda51535717.jpg',
            '/stickers/MC ENERGY/b0efa7ee78a4d8984d72bd89e5ae1021.jpg',
            '/stickers/MC ENERGY/fa057905938a5888a4cadc408afc50c4.jpg',
            '/stickers/MC ENERGY/60d21f293a589f349269d9f64f90730e.jpg',
            '/stickers/MC ENERGY/eab78bf4f832368555979e4e95222392.jpg',
            '/stickers/MC ENERGY/5922b504c03265e386147cde10b3e00c.jpg',
            '/stickers/MC ENERGY/0f22589734e93c2bdbbf0f5ce59c229c.png',
            '/stickers/MC ENERGY/362c6326098b9e10e7c8ba41c5e5ba23.jpg'
        ]
    },
    {
        name: 'ALBUM ART',
        items: [
            '/stickers/ALBUM ART/afc8ac4eaa51ff2b37fc075764aab8f1.png',
            '/stickers/ALBUM ART/17fc2a610c1a38035cee19da54ad187e.jpg',
            '/stickers/ALBUM ART/deec6f847021554ae3c01d2d085f8032.jpg',
            '/stickers/ALBUM ART/6df4624c4e4bc9c6783f794a88847fbd.jpg',
            '/stickers/ALBUM ART/5d9ac9262c33b01a9f12a116d14848c5.jpg'
        ]
    }
];



export const DATE_FORMATS = [
    { label: 'Classic', format: 'MM DD YYYY' },
    { label: 'Digital', format: 'YY/MM/DD' },
    { label: 'Time', format: 'HH:MM AM/PM' }
];

export const DEFAULT_ADJUSTMENTS = {
    exposure:0, brilliance:0, highlights:0, shadows:0, brightness:0, contrast:0, blackPoint:0,
    saturation:0, vibrance:0, warmth:0, tint:0,
    sharpness:0, definition:0, vignette:0, vignetteColor:'#000000', grain:0, grainSize:1, grainColor:false, fade:0, blur:0, glitch:0, halation:0, aberration:0,
    shadowsTint:'#000000', highlightsTint:'#ffffff', polaroidPadding:14, canvasBg:'#808080', filterIntensity: 100, effectIntensity: 100
};

export const DEFAULT_TEXT_STYLE = {
    font: 'Inter',
    size: 32,
    color: '#ffffff',
    bold: false,
    italic: false,
    shadow: true,
    preset: 'none'
};

export const RETRO_DEFAULTS = {
    retroPixelate:  { blockSize: 8,  colorLevels: 8 },
    retroFatPixel:  { blockSize: 20, colorLevels: 6 },
    retroBootleg:   { blockSize: 12, colorLevels: 4 },
    retroHalftone:  { dotScale: 6,   angle: 45 },
    retroCMYK:      { dotScale: 4,   angle: 15, misregistration: 2.0 },
    retroRiso:      { dotScale: 5,   ink: '#ff2d6f', misregistration: 3.0 },
    retroDither:    { palette: 'bw', contrast: 1.0 },
    retroTeletext:  { blockSize: 14 },
    retroASCII:     { cellSize: 8,   colored: true },
    retroPunk:      { bgColor: '#ff2d6f', scribbleOpacity: 0.6 }
};
