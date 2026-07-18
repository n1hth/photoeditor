import React, { useState, useEffect } from 'react';
import { STICKER_PACKS } from '../../utils/constants';

export function StickersPopup({ onClose, onAddSticker }) {
    const [visible, setVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 250);
    };

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
        width: '340px',
        height: '420px',
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
        flexShrink: 0,
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

    const gridWrapStyle = {
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
    };

    const tabsWrapStyle = {
        display: 'flex',
        padding: '12px',
        gap: '8px',
        borderBottom: '1px solid var(--glass-border)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        flexShrink: 0,
    };

    const tabStyle = (isActive) => ({
        padding: '6px 16px',
        background: isActive ? '#fff' : 'rgba(255,255,255,0.15)',
        border: isActive ? '1px solid #fff' : '1px solid rgba(255,255,255,0.2)',
        borderRadius: '20px',
        color: isActive ? '#000' : 'var(--text-1)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'all 0.2s ease',
    });

    const stickerBtnStyle = {
        width: '100%',
        aspectRatio: '1',
        padding: '6px',
        borderRadius: 'var(--r-md)',
        cursor: 'pointer',
        transition: 'background 0.12s, transform 0.12s',
        background: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const stickerImgStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none',
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
                    <span style={titleStyle}>Stickers</span>
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

                {/* Tabs */}
                <style>{`
                    .tabs-scroll::-webkit-scrollbar { display: none; }
                `}</style>
                <div style={tabsWrapStyle} className="tabs-scroll">
                    <button
                        style={tabStyle(activeCategory === 'All')}
                        onClick={() => setActiveCategory('All')}
                    >
                        All
                    </button>
                    {STICKER_PACKS.map(pack => (
                        <button
                            key={pack.name}
                            style={tabStyle(activeCategory === pack.name)}
                            onClick={() => setActiveCategory(pack.name)}
                        >
                            {pack.name}
                        </button>
                    ))}
                </div>

                {/* Scrollable Sticker Grid */}
                <div style={gridWrapStyle}>
                    <div style={gridStyle}>
                        {(activeCategory === 'All' 
                            ? STICKER_PACKS.flatMap(p => p.items)
                            : STICKER_PACKS.find(p => p.name === activeCategory)?.items || []
                        ).map((imgPath) => (
                            <button
                                key={imgPath}
                                style={stickerBtnStyle}
                                onClick={() => {
                                    onAddSticker(imgPath);
                                    handleClose();
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                                    e.currentTarget.style.transform = 'scale(1.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <img src={imgPath} alt="Sticker" style={stickerImgStyle} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
