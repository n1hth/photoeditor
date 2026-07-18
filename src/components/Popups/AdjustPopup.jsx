import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Adjustment Configuration ────────────────────────────────
const ADJUST_CONFIG = {
    light: [
        { param: 'exposure',   label: 'Exposure',     icon: 'sun',        min: -100, max: 100, bipolar: true },
        { param: 'brilliance', label: 'Brilliance',   icon: 'sparkle',    min: -100, max: 100, bipolar: true },
        { param: 'highlights', label: 'Highlights',   icon: 'highlight',  min: -100, max: 100, bipolar: true },
        { param: 'shadows',    label: 'Shadows',      icon: 'shadow',     min: -100, max: 100, bipolar: true },
        { param: 'brightness', label: 'Brightness',   icon: 'brightness', min: -100, max: 100, bipolar: true },
        { param: 'contrast',   label: 'Contrast',     icon: 'contrast',   min: -100, max: 100, bipolar: true },
        { param: 'blackPoint', label: 'Black Point',  icon: 'blackpoint', min: -100, max: 100, bipolar: true },
    ],
    color: [
        { param: 'saturation', label: 'Saturation', icon: 'droplet',  min: -100, max: 100, bipolar: true },
        { param: 'vibrance',   label: 'Vibrance',   icon: 'vibrance', min: -100, max: 100, bipolar: true },
        { param: 'warmth',     label: 'Warmth',     icon: 'warmth',   min: -100, max: 100, bipolar: true },
        { param: 'tint',       label: 'Tint',       icon: 'tint',     min: -100, max: 100, bipolar: true },
        { param: 'shadowsTint',   label: 'Shadow Tint', type: 'color', icon: 'shadow' },
        { param: 'highlightsTint',label: 'High. Tint',  type: 'color', icon: 'highlight' },
    ],
    effects: [
        { param: 'sharpness',  label: 'Sharpness',  icon: 'sharpness',  min: 0, max: 100, bipolar: false },
        { param: 'definition', label: 'Definition', icon: 'definition', min: 0, max: 100, bipolar: false },
        { param: 'vignette',   label: 'Vignette',   icon: 'vignette',   min: 0, max: 100, bipolar: false },
        { param: 'vignetteColor', label: 'Vig. Color', type: 'color', icon: 'tint' },
        { param: 'grain',      label: 'Grain',      icon: 'grain',      min: 0, max: 100, bipolar: false },
        { param: 'grainSize',  label: 'Grain Size', icon: 'grain',      min: 1, max: 10, bipolar: false },
        { param: 'grainColor', label: 'Color Grain',type: 'boolean',    icon: 'tint' },
        { param: 'fade',       label: 'Fade',       icon: 'fade',       min: 0, max: 100, bipolar: false },
        { param: 'blur',       label: 'Blur',       icon: 'blur',       min: 0, max: 100, bipolar: false },
        { param: 'halation',   label: 'Halation',   icon: 'sun',        min: 0, max: 100, bipolar: false },
        { param: 'aberration', label: 'Aberration', icon: 'glitch',     min: 0, max: 100, bipolar: false },
        { param: 'glitch',     label: 'Glitch',     icon: 'glitch',     min: 0, max: 100, bipolar: false },
    ],
    canvas: [
        { param: 'canvasBg',   label: 'Background', type: 'color', icon: 'tint' },
        { param: 'polaroidPadding', label: 'Polaroid Pad', icon: 'crop', min: 0, max: 100, bipolar: false },
    ]
};

// ── SVG Icon helper ─────────────────────────────────────────
function getSliderIcon(iconName) {
    const s = { display: 'block' };
    const c = 'var(--text-2)';
    switch (iconName) {
        case 'sun':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            );
        case 'sparkle':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                </svg>
            );
        case 'highlight':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
                    <path d="M12 3v18M5.5 7.5l13 9M5.5 16.5l13-9" />
                </svg>
            );
        case 'shadow':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3a9 9 0 010 18" fill={c} opacity="0.3" />
                </svg>
            );
        case 'brightness':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
            );
        case 'contrast':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a10 10 0 010 20" fill={c} opacity="0.35" stroke="none" />
                </svg>
            );
        case 'blackpoint':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="6" fill={c} opacity="0.6" />
                    <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2" fill="none" />
                </svg>
            );
        case 'droplet':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
                </svg>
            );
        case 'vibrance':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                    <path d="M12 2a6 6 0 016 6c0 6-6 14-6 14S6 14 6 8a6 6 0 016-6z" />
                </svg>
            );
        case 'warmth':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
                    <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
                </svg>
            );
        case 'tint':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
                    <line x1="6" y1="14" x2="18" y2="14" opacity="0.4" />
                </svg>
            );
        case 'sharpness':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                </svg>
            );
        case 'definition':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" opacity="0.4" />
                </svg>
            );
        case 'vignette':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
                    <ellipse cx="12" cy="12" rx="10" ry="8" />
                    <ellipse cx="12" cy="12" rx="6" ry="4" opacity="0.3" />
                </svg>
            );
        case 'grain':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill={c}>
                    <circle cx="5" cy="5" r="1.5" opacity="0.7" />
                    <circle cx="12" cy="8" r="1" opacity="0.5" />
                    <circle cx="18" cy="4" r="1.2" opacity="0.6" />
                    <circle cx="8" cy="14" r="1.3" opacity="0.6" />
                    <circle cx="16" cy="12" r="1" opacity="0.4" />
                    <circle cx="4" cy="19" r="1.1" opacity="0.5" />
                    <circle cx="12" cy="18" r="1.4" opacity="0.7" />
                    <circle cx="19" cy="18" r="1" opacity="0.5" />
                </svg>
            );
        case 'fade':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
                    <path d="M2 12h4M8 12h4M14 12h4M20 12h2" strokeDasharray="0" opacity="0.3" />
                    <path d="M2 12h20" opacity="0.7" />
                </svg>
            );
        case 'blur':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
                    <circle cx="12" cy="12" r="5" opacity="0.4" />
                </svg>
            );
        case 'glitch':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
                    <path d="M4 8h6l-2 8h8M14 8h6l-2 8" />
                    <path d="M2 12h20" strokeDasharray="2 2" opacity="0.5"/>
                </svg>
            );
        case 'crop':
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
                    <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
                </svg>
            );
        default:
            return (
                <svg style={s} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            );
    }
}

function CustomSlider({ conf, value, onChange, onChangeEnd }) {
    const trackRef = useRef(null);
    const dragging = useRef(false);

    const pct = ((value - conf.min) / (conf.max - conf.min)) * 100;

    const getValueFromEvent = useCallback((clientX) => {
        if (!trackRef.current) return value;
        const rect = trackRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const raw = (x / rect.width) * (conf.max - conf.min) + conf.min;
        return Math.round(raw);
    }, [conf.min, conf.max, value]);

    const handlePointerDown = useCallback((e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onChange(getValueFromEvent(e.clientX));
    }, [getValueFromEvent, onChange]);

    const handlePointerMove = useCallback((e) => {
        if (!dragging.current) return;
        onChange(getValueFromEvent(e.clientX));
    }, [getValueFromEvent, onChange]);

    const handlePointerUp = useCallback(() => {
        if (dragging.current) {
            dragging.current = false;
            if (onChangeEnd) onChangeEnd(getValueFromEvent(trackRef.current?.getBoundingClientRect().right)); // ensure it commits current state
        }
    }, [onChangeEnd, getValueFromEvent]);

    // ── Fill calculation ──
    let fillLeft, fillWidth;
    if (conf.bipolar) {
        const center = 50;
        if (value >= 0) {
            fillLeft = `${center}%`;
            fillWidth = `${pct - center}%`;
        } else {
            fillLeft = `${pct}%`;
            fillWidth = `${center - pct}%`;
        }
    } else {
        fillLeft = '0%';
        fillWidth = `${pct}%`;
    }

    const isNonZero = value !== 0;

    // ── Styles ──
    const rowStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 0',
    };

    const iconWrapStyle = {
        flexShrink: 0,
        width: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.7,
    };

    const labelStyle = {
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--text-2)',
        width: '72px',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    };

    const trackContainerStyle = {
        flex: 1,
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        position: 'relative',
        touchAction: 'none',
    };

    const trackStyle = {
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        background: 'rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
    };

    const fillStyle = {
        position: 'absolute',
        top: 0,
        left: fillLeft,
        width: fillWidth,
        height: '100%',
        background: 'var(--accent-1)',
        borderRadius: '3px',
        transition: dragging.current ? 'none' : 'left 0.08s, width 0.08s',
    };

    const centerTickStyle = conf.bipolar ? {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '2px',
        height: '10px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '1px',
        zIndex: 1,
        pointerEvents: 'none',
    } : null;

    const thumbStyle = {
        position: 'absolute',
        top: '50%',
        left: `${pct}%`,
        transform: 'translate(-50%, -50%)',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
        zIndex: 2,
        pointerEvents: 'none',
        transition: dragging.current ? 'none' : 'left 0.08s',
    };

    const valStyle = {
        fontSize: '12px',
        fontWeight: 600,
        width: '34px',
        textAlign: 'right',
        flexShrink: 0,
        color: isNonZero ? 'var(--accent-1)' : 'var(--text-2)',
        transition: 'color 0.15s',
        fontVariantNumeric: 'tabular-nums',
    };

    return (
        <div style={rowStyle}>
            <div style={iconWrapStyle}>{getSliderIcon(conf.icon)}</div>
            <div style={labelStyle}>{conf.label}</div>
            <div
                ref={trackRef}
                style={trackContainerStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <div style={trackStyle}>
                    <div style={fillStyle} />
                    {conf.bipolar && <div style={centerTickStyle} />}
                </div>
                <div style={thumbStyle} />
            </div>
            <div style={valStyle}>{value > 0 ? `+${value}` : value}</div>
        </div>
    );
}

function CustomColorInput({ conf, value, onChange }) {
    const rowStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' };
    const iconWrapStyle = { flexShrink: 0, width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 };
    const labelStyle = { fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', width: '72px', flexShrink: 0 };
    const inputStyle = { flex: 1, height: '24px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' };
    return (
        <div style={rowStyle}>
            <div style={iconWrapStyle}>{getSliderIcon(conf.icon)}</div>
            <div style={labelStyle}>{conf.label}</div>
            <input 
                type="color" 
                style={inputStyle} 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
            />
        </div>
    );
}

function CustomToggleInput({ conf, value, onChange }) {
    const rowStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' };
    const iconWrapStyle = { flexShrink: 0, width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 };
    const labelStyle = { fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', width: '72px', flexShrink: 0 };
    return (
        <div style={rowStyle}>
            <div style={iconWrapStyle}>{getSliderIcon(conf.icon)}</div>
            <div style={labelStyle}>{conf.label}</div>
            <input 
                type="checkbox" 
                checked={!!value} 
                onChange={(e) => onChange(e.target.checked)} 
            />
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────
export function AdjustPopup({ onClose, adjustments, onAdjust, onAdjustEnd }) {
    const [activeTab, setActiveTab] = useState('light');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 250);
    };

    const tabs = Object.keys(ADJUST_CONFIG);

    // ── Styles ──────────────────────────────────────────────
    const backdropStyle = {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        zIndex: 30,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.25s ease',
    };

    const panelStyle = {
        position: 'absolute',
        bottom: '120px',
        left: '50%',
        transform: visible
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(24px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease',
        zIndex: 31,
        width: '380px',
        maxHeight: '440px',
        borderRadius: 'var(--r-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--glass-border)',
    };

    const titleStyle = {
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--text-1)',
        letterSpacing: '0.02em',
    };

    const closeBtnStyle = {
        background: 'none',
        border: 'none',
        color: 'var(--text-2)',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: 'var(--r-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.15s, background 0.15s',
    };

    // Segmented control for tabs
    const segmentBarStyle = {
        display: 'flex',
        margin: '12px 16px 8px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 'var(--r-pill)',
        padding: '3px',
        gap: '2px',
    };

    const segmentStyle = (isActive) => ({
        flex: 1,
        padding: '6px 0',
        fontSize: '12px',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--text-1)' : 'var(--text-2)',
        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: 'none',
        borderRadius: 'var(--r-pill)',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        textTransform: 'capitalize',
        letterSpacing: '0.03em',
    });

    const slidersWrapStyle = {
        flex: 1,
        overflowY: 'auto',
        padding: '6px 14px 14px',
    };

    // ── Render ───────────────────────────────────────────────
    return (
        <>
            {/* Backdrop — no blur, just dark overlay */}
            <div style={backdropStyle} onClick={handleClose} />

            {/* Panel */}
            <div className="glass-surface" style={panelStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <span style={titleStyle}>Adjust</span>
                    <button
                        style={closeBtnStyle}
                        onClick={handleClose}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--text-1)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-2)';
                            e.currentTarget.style.background = 'none';
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Segmented Control Tabs */}
                <div style={segmentBarStyle}>
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            style={segmentStyle(activeTab === tab)}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Sliders */}
                <div style={slidersWrapStyle}>
                    {ADJUST_CONFIG[activeTab].map((conf) => {
                        if (conf.type === 'color') {
                            return (
                                <CustomColorInput
                                    key={conf.param}
                                    conf={conf}
                                    value={adjustments[conf.param]}
                                    onChange={(v) => {
                                        onAdjust(conf.param, v);
                                        onAdjustEnd(conf.param, v);
                                    }}
                                />
                            );
                        }
                        if (conf.type === 'boolean') {
                            return (
                                <CustomToggleInput
                                    key={conf.param}
                                    conf={conf}
                                    value={adjustments[conf.param]}
                                    onChange={(v) => {
                                        onAdjust(conf.param, v);
                                        onAdjustEnd(conf.param, v);
                                    }}
                                />
                            );
                        }
                        return (
                            <CustomSlider
                                key={conf.param}
                                conf={conf}
                                value={adjustments[conf.param]}
                                onChange={(v) => onAdjust(conf.param, v)}
                                onChangeEnd={(v) => onAdjustEnd(conf.param, v)}
                            />
                        );
                    })}
                </div>
            </div>
        </>
    );
}
