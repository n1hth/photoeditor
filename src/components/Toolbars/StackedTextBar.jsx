import React, { useState } from 'react';

const FONTS = [
    { family: 'Papyrus',            weight: '400', name: 'Tribal',    preview: 'Avatar'    },
    { family: 'Cormorant Garamond', weight: '300', name: 'Gazette',   preview: 'Gazette'   },
    { family: 'Syne',               weight: '800', name: 'Y2K',       preview: 'Y2K'       },
    { family: 'Italiana',           weight: '400', name: 'Vogue',     preview: 'Vogue'     },
    { family: 'Cinzel',             weight: '700', name: 'Epic',      preview: 'EPIC'      },
    { family: 'Six Caps',           weight: '400', name: 'Blockbuster',preview: 'BLOCKBUSTER' },
    { family: 'UnifrakturMaguntia', weight: '400', name: 'Gothic',    preview: 'Gothic'    },
    { family: 'Krona One',          weight: '400', name: 'Wide',      preview: 'Wide'      },
    { family: 'VT323',              weight: '400', name: 'Glitch',    preview: 'Glitch'    },
    { family: 'Special Elite',      weight: '400', name: 'Indie',     preview: 'Indie'     },
    { family: 'DM Serif Display',   weight: '400', name: 'Editorial', preview: 'Editorial' },
    { family: 'Libre Baskerville',  weight: '400', name: 'Heritage',  preview: 'Heritage'  },
    { family: 'Yeseva One',         weight: '400', name: 'Bloom',     preview: 'Bloom'     },
    { family: 'Abril Fatface',      weight: '400', name: 'Bold Era',  preview: 'Bold Era'  },
    { family: 'Bebas Neue',         weight: '400', name: 'Poster',    preview: 'POSTER'    },
    { family: 'Josefin Sans',       weight: '100', name: 'Airy',      preview: 'Airy'      },
    { family: 'Sacramento',         weight: '400', name: 'Ribbon',    preview: 'Ribbon'    },
    { family: 'Great Vibes',        weight: '400', name: 'Flourish',  preview: 'Flourish'  },
    { family: 'Dancing Script',     weight: '500', name: 'Soft',      preview: 'Soft'      },
    { family: 'Arial Narrow',       weight: '400', name: 'Brat',      preview: 'brat'      },
];

export function StackedTextBar({ textStyle, onStyleChange, onDone, onDelete, onInsertDate }) {
    const [activeL2, setActiveL2] = useState('l3-fonts');

    return (
        <>
            {/* TOP RIGHT DONE BUTTON */}
            <button className="top-right-done-btn" onPointerDown={(e) => { e.preventDefault(); onDone(); }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>

            {/* LEVEL 3 */}
            <div className={`floating-bar floating-bar--l3 ${activeL2 !== 'l3-fonts' ? 'glass-surface' : 'font-mode-container'}`} onPointerDown={(e) => e.preventDefault()}>
                {activeL2 === 'l3-fonts' && (
                    <div className="l3-panel">
                        <div className="font-boxes">
                            {FONTS.map(f => (
                                <button 
                                    key={f.family}
                                    className={`font-box ${textStyle.font === f.family ? 'active' : ''}`}
                                    style={{ fontFamily: `'${f.family}', serif`, fontWeight: f.weight }}
                                    onClick={() => onStyleChange({ font: f.family })}
                                    title={f.family}
                                >
                                    {f.preview}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {activeL2 === 'l3-presets' && (
                    <div className="l3-panel">
                        <div className="style-row" style={{ overflowX: 'auto', padding: '8px 12px', justifyContent: 'flex-start', gap: '12px' }}>
                            <button 
                                className={`preset-preview-btn ${textStyle.preset === 'none' || !textStyle.preset ? 'active' : ''}`} 
                                onClick={() => onStyleChange({ preset: 'none' })}
                            >None</button>
                            <button 
                                className={`preset-preview-btn chrome-preview ${textStyle.preset === 'chrome' ? 'active' : ''}`} 
                                onClick={() => onStyleChange({ preset: 'chrome', color: '#ffffff' })}
                            >Chrome</button>
                            <button 
                                className={`preset-preview-btn brat-preview ${textStyle.preset === 'brat' ? 'active' : ''}`} 
                                onClick={() => onStyleChange({ preset: 'brat', color: '#000000' })}
                            >brat</button>
                            <button 
                                className={`preset-preview-btn y2k-preview ${textStyle.preset === 'y2k-outline' ? 'active' : ''}`} 
                                onClick={() => onStyleChange({ preset: 'y2k-outline', color: '#ffffff' })}
                            >Y2K</button>
                        </div>
                    </div>
                )}
                {activeL2 === 'l3-colors' && (
                    <div className="l3-panel">
                        <div className="color-swatches">
                            {['#ffffff', '#cccccc', '#999999', '#666666', '#333333', '#000000'].map(color => (
                                <div 
                                    key={color}
                                    className={`swatch ${textStyle.color === color ? 'active' : ''}`}
                                    style={{ background: color }}
                                    onClick={() => onStyleChange({ color })}
                                ></div>
                            ))}
                            <input 
                                type="color" 
                                className="custom-color-input" 
                                value={textStyle.color} 
                                onChange={(e) => onStyleChange({ color: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {activeL2 === 'l3-styles' && (
                    <div className="l3-panel">
                        <div className="style-row">
                            <button 
                                className={`style-btn ${textStyle.bold ? 'active' : ''}`} 
                                onClick={() => onStyleChange({ bold: !textStyle.bold })}
                            ><strong>B</strong></button>
                            <button 
                                className={`style-btn ${textStyle.italic ? 'active' : ''}`} 
                                onClick={() => onStyleChange({ italic: !textStyle.italic })}
                            ><em>I</em></button>
                            <button 
                                className={`style-btn ${textStyle.shadow ? 'active' : ''}`} 
                                onClick={() => onStyleChange({ shadow: !textStyle.shadow })}
                            >S</button>
                            <div className="v-divider"></div>
                            <button className="style-btn danger" onClick={onDelete}>
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 7v5M8 7v5M11 7v5M4 4l1 9a1 1 0 001 1h4a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
                {activeL2 === 'l3-date' && (
                    <div className="l3-panel">
                        <div className="font-boxes">
                            <button className="font-box date-stamp-btn" style={{fontFamily:"'VT323',monospace",color:'#f7c948',fontSize:'15px',letterSpacing:'0.05em'}} onClick={() => onInsertDate('MM DD YYYY')}>
                                {'\''}07 07 2026
                            </button>
                            <button className="font-box date-stamp-btn" style={{fontFamily:"'VT323',monospace",color:'#f7c948',fontSize:'15px',letterSpacing:'0.05em'}} onClick={() => onInsertDate('YY/MM/DD')}>
                                26/07/07
                            </button>
                            <button className="font-box date-stamp-btn" style={{fontFamily:"'VT323',monospace",color:'#f7c948',fontSize:'15px',letterSpacing:'0.05em'}} onClick={() => onInsertDate('HH:MM AM')}>
                                3:14 PM
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* LEVEL 2 */}
            <div className="floating-bar floating-bar--l2 glass-surface" onPointerDown={(e) => e.preventDefault()}>
                <div className="l2-group">
                    <div className="l2-scroller">
                        <button className={`seg-btn ${activeL2 === 'l3-presets' ? 'active' : ''}`} onClick={() => setActiveL2('l3-presets')}>Looks</button>
                        <button className={`seg-btn ${activeL2 === 'l3-fonts' ? 'active' : ''}`} onClick={() => setActiveL2('l3-fonts')}>Fonts</button>
                        <button className={`seg-btn ${activeL2 === 'l3-colors' ? 'active' : ''}`} onClick={() => setActiveL2('l3-colors')}>Color</button>
                        <button className={`seg-btn ${activeL2 === 'l3-styles' ? 'active' : ''}`} onClick={() => setActiveL2('l3-styles')}>Styles</button>
                        <button className={`seg-btn ${activeL2 === 'l3-date' ? 'active' : ''}`} onClick={() => setActiveL2('l3-date')}>Date</button>
                    </div>
                </div>
            </div>
        </>
    );
}
