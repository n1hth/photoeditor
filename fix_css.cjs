const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Restore floating-bar--l2 completely from scratch for the media query section
const newMobileCSS = `
    .floating-bar--l2 {
        position: absolute;
        bottom: 70px;
        left: 50%;
        transform: translateX(-50%);
        height: 40px;
        width: fit-content;
        max-width: calc(100vw - 24px);
        padding: 4px 8px;
        border-radius: 999px;
        transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
        animation: barSlideUpCentered 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .text-editing-mode .floating-bar--l2 {
        bottom: 8px !important;
    }

    .seg-btn {
        height: 28px;
        padding: 0 10px;
        font-size: 11px;
        border-radius: 14px;
    }

    .floating-bar--l3 {
        position: absolute;
        bottom: 115px;
        left: 50%;
        transform: translateX(-50%);
        width: fit-content;
        max-width: calc(100vw - 24px);
        padding: 6px 8px;
        border-radius: 999px;
    }

    .text-editing-mode .floating-bar--l3 {
        bottom: 53px !important;
        transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    }
`;

// Find the start of floating-bar--l2 in the media query (around line 1250)
const mediaQueryStart = css.indexOf('@media (max-width: 768px)');
const l2Start = css.indexOf('.floating-bar--l2 {', mediaQueryStart);
const fontBoxStart = css.indexOf('.font-box, .preset-preview-btn', mediaQueryStart);

if (l2Start !== -1 && fontBoxStart !== -1) {
    css = css.substring(0, l2Start) + newMobileCSS + '\n    ' + css.substring(fontBoxStart);
}

// Add global top-right-done-btn just before media query
const globalDoneBtn = `
.top-right-done-btn {
    position: fixed;
    top: 24px;
    right: 24px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1000;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}
.top-right-done-btn:hover { transform: scale(1.1); }
.top-right-done-btn:active { transform: scale(0.95); }

`;

css = css.replace('@media (max-width: 768px) {', globalDoneBtn + '@media (max-width: 768px) {');

fs.writeFileSync('src/index.css', css);
console.log('Fixed index.css');
