import React from 'react';

const PRESETS = [
    {
        id: 'single', label: 'Single',
        render: () => (
            <svg viewBox="0 0 40 40" width="40" height="40">
                <rect x="2" y="2" width="36" height="36" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        )
    },
    {
        id: 'split-v', label: 'Split V',
        render: () => (
            <svg viewBox="0 0 40 40" width="40" height="40">
                <rect x="2" y="2" width="17" height="36" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
                <rect x="21" y="2" width="17" height="36" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        )
    },
    {
        id: 'split-h', label: 'Split H',
        render: () => (
            <svg viewBox="0 0 40 40" width="40" height="40">
                <rect x="2" y="2" width="36" height="17" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
                <rect x="2" y="21" width="36" height="17" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        )
    },
    {
        id: 'grid-2x2', label: 'Grid',
        render: () => (
            <svg viewBox="0 0 40 40" width="40" height="40">
                <rect x="2" y="2" width="17" height="17" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
                <rect x="21" y="2" width="17" height="17" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
                <rect x="2" y="21" width="17" height="17" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
                <rect x="21" y="21" width="17" height="17" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        )
    },
    {
        id: 'tri-panel', label: '3-Panel',
        render: () => (
            <svg viewBox="0 0 40 40" width="40" height="40">
                <rect x="2" y="2" width="22" height="36" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
                <rect x="26" y="2" width="12" height="17" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
                <rect x="26" y="21" width="12" height="17" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        )
    }
];

export function LayoutsPopup({ onClose, currentLayout, onSelectLayout, onOpenBuilder, canvasBg, onBgChange }) {
    return (
        <>
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
                onClick={onClose}
            />
            <div
                className="glass-surface"
                style={{
                    position: 'fixed', bottom: '80px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%', maxWidth: '380px',
                    borderRadius: '24px',
                    padding: '20px',
                    zIndex: 101,
                    animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.3px' }}>Layouts</span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-2)',
                            cursor: 'pointer', fontSize: '16px', padding: '4px', lineHeight: 1
                        }}
                    >✕</button>
                </div>

                {/* Preset Grid */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
                    {PRESETS.map(preset => {
                        const isActive = (currentLayout?.type || 'single') === preset.id;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => {
                                    onSelectLayout(preset.id);
                                    onClose();
                                }}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                    padding: '12px 14px',
                                    background: isActive ? 'var(--accent-1)' : 'rgba(255,255,255,0.04)',
                                    color: isActive ? '#fff' : 'var(--text-1)',
                                    border: '1px solid',
                                    borderColor: isActive ? 'var(--accent-1)' : 'rgba(255,255,255,0.08)',
                                    borderRadius: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minWidth: '60px'
                                }}
                            >
                                {preset.render()}
                                <span style={{ fontSize: '11px', fontWeight: 500 }}>{preset.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Custom Button */}
                <button
                    onClick={() => {
                        onClose();
                        onOpenBuilder();
                    }}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px dashed rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        color: 'var(--text-1)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Custom Layout
                </button>

                {/* Canvas Background Color */}
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Canvas Background</span>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: canvasBg,
                            border: '2px solid rgba(255,255,255,0.2)'
                        }} />
                        <input
                            type="color"
                            value={canvasBg}
                            onChange={(e) => onBgChange(e.target.value)}
                            style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
                        />
                    </label>
                </div>
            </div>
        </>
    );
}
