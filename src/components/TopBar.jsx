import React from 'react';

export function TopBar({ onReset, onExport, undo, redo, canUndo, canRedo }) {
    return (
        <div className="top-bar glass-surface">
            <button className="top-btn" onClick={onReset} title="Close">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M6 6l10 10M16 6L6 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
            </button>
            <div className="top-bar-center">
                <button className={`top-btn ${canUndo ? '' : 'disabled'}`} onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4 8h10a4 4 0 010 8H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 4L4 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button className={`top-btn ${canRedo ? '' : 'disabled'}`} onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16 8H6a4 4 0 000 8h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
            <button className="top-btn accent-btn" onClick={onExport} title="Export">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 13v3a2 2 0 002 2h10a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Export</span>
            </button>
        </div>
    );
}
