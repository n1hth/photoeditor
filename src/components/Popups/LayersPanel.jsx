import React, { useState } from 'react';
import { FILTERS, RETRO_DEFAULTS } from '../../utils/constants';

const isRetroFilter = (id) => !!RETRO_DEFAULTS[id];

export function LayersPanel({ overlays, activeFilters = [], updateActiveFilters, selectedOverlayId, onSelect, onReorder, onDelete, onClose }) {
    const [activeTab, setActiveTab] = useState('elements');
    const [expandedFilter, setExpandedFilter] = useState(null);

    // Reverse the lists so that the topmost layer (last in array) appears at the top of the UI
    const reversedOverlays = [...overlays].reverse();
    const reversedFilters = [...activeFilters].reverse();

    const updateParam = (actualIndex, key, value) => {
        const newFilters = [...activeFilters];
        newFilters[actualIndex] = {
            ...newFilters[actualIndex],
            params: { ...newFilters[actualIndex].params, [key]: value }
        };
        updateActiveFilters(newFilters);
    };

    const renderSlider = (filter, actualIndex, key, label, min, max, step) => (
        <div className="slider-row" key={key} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                <span className="slider-label">{label}</span>
                <span className="slider-value" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{filter.params?.[key]}</span>
            </div>
            <input 
                type="range" 
                min={min} 
                max={max} 
                step={step}
                value={filter.params?.[key]} 
                onChange={(e) => updateParam(actualIndex, key, parseFloat(e.target.value))}
                className="smart-slider"
            />
        </div>
    );

    const renderColorPicker = (filter, actualIndex, key, label) => (
        <div className="slider-row" key={key} style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="slider-header" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                <span className="slider-label">{label}</span>
            </div>
            <input 
                type="color" 
                value={filter.params?.[key]} 
                onChange={(e) => updateParam(actualIndex, key, e.target.value)}
                style={{ background: 'none', border: 'none', width: '24px', height: '24px', cursor: 'pointer', padding: 0 }}
            />
        </div>
    );
    
    const renderSelect = (filter, actualIndex, key, label, options) => (
        <div className="slider-row" key={key} style={{ marginTop: '8px' }}>
            <div className="slider-header" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                <span className="slider-label">{label}</span>
            </div>
            <select 
                value={filter.params?.[key]} 
                onChange={(e) => updateParam(actualIndex, key, e.target.value)}
                style={{ width: '100%', padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontSize: '12px' }}
            >
                {options.map(o => <option key={o.value} value={o.value} style={{color:'black'}}>{o.label}</option>)}
            </select>
        </div>
    );

    const renderRetroControls = (filter, actualIndex) => {
        if (!isRetroFilter(filter.id) || !filter.params) return null;
        
        let controls = null;
        switch (filter.id) {
            case 'retroPixelate':
            case 'retroFatPixel':
            case 'retroBootleg':
                controls = (
                    <>
                        {renderSlider(filter, actualIndex, 'blockSize', 'Block Size', 2, 50, 1)}
                        {renderSlider(filter, actualIndex, 'colorLevels', 'Colors', 2, 32, 1)}
                    </>
                );
                break;
            case 'retroHalftone':
                controls = (
                    <>
                        {renderSlider(filter, actualIndex, 'dotScale', 'Dot Scale', 2, 20, 0.5)}
                        {renderSlider(filter, actualIndex, 'angle', 'Angle', 0, 90, 1)}
                    </>
                );
                break;
            case 'retroCMYK':
                controls = (
                    <>
                        {renderSlider(filter, actualIndex, 'dotScale', 'Dot Scale', 2, 20, 0.5)}
                        {renderSlider(filter, actualIndex, 'angle', 'Angle', 0, 90, 1)}
                        {renderSlider(filter, actualIndex, 'misregistration', 'Offset', 0, 10, 0.5)}
                    </>
                );
                break;
            case 'retroRiso':
                controls = (
                    <>
                        {renderSlider(filter, actualIndex, 'dotScale', 'Dot Scale', 2, 20, 0.5)}
                        {renderColorPicker(filter, actualIndex, 'ink', 'Ink Color')}
                        {renderSlider(filter, actualIndex, 'misregistration', 'Offset', 0, 10, 0.5)}
                    </>
                );
                break;
            case 'retroDither':
                controls = (
                    <>
                        {renderSelect(filter, actualIndex, 'palette', 'Palette', [
                            { value: 'bw', label: '1-Bit (B&W)' },
                            { value: 'gameboy', label: 'Game Boy' },
                            { value: 'cga', label: 'CGA' },
                            { value: 'c64', label: 'Commodore 64' },
                            { value: 'nes', label: 'NES' },
                            { value: 'teletext', label: 'Teletext' }
                        ])}
                        {renderSlider(filter, actualIndex, 'contrast', 'Contrast', 0.5, 2.0, 0.1)}
                    </>
                );
                break;
            case 'retroTeletext':
                controls = renderSlider(filter, actualIndex, 'blockSize', 'Block Size', 4, 30, 1);
                break;
            case 'retroASCII':
                controls = renderSlider(filter, actualIndex, 'cellSize', 'Cell Size', 4, 20, 1);
                break;
            case 'retroPunk':
                controls = (
                    <>
                        {renderColorPicker(filter, actualIndex, 'bgColor', 'Background')}
                        {renderSlider(filter, actualIndex, 'scribbleOpacity', 'Scribble', 0, 1, 0.05)}
                    </>
                );
                break;
            default:
                controls = null;
        }
        
        if (!controls) return null;
        
        return (
            <div style={{ padding: '8px 12px 12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {controls}
            </div>
        );
    };

    return (
        <div className="layers-panel glass-surface" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="layers-header" style={{ paddingBottom: '8px' }}>
                <span className="layers-title">Layers</span>
                <button className="layers-close-btn" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div style={{ display: 'flex', padding: '0 16px 12px', gap: '8px' }}>
                <button 
                    style={{ flex: 1, padding: '6px 0', borderRadius: '16px', background: activeTab === 'elements' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'elements' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setActiveTab('elements')}
                >
                    Elements
                </button>
                <button 
                    style={{ flex: 1, padding: '6px 0', borderRadius: '16px', background: activeTab === 'filters' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'filters' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setActiveTab('filters')}
                >
                    Filters
                </button>
            </div>
            
            <div className="layers-list" style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'elements' ? (
                    reversedOverlays.length === 0 ? (
                        <div className="empty-layers">No layers added</div>
                    ) : (
                        reversedOverlays.map((layer, index) => {
                            const actualIndex = overlays.length - 1 - index;
                            const isSelected = layer.id === selectedOverlayId;
                            
                            return (
                                <div 
                                    key={layer.id} 
                                    className={`layer-item ${isSelected ? 'active' : ''}`}
                                    onClick={() => onSelect(layer.id)}
                                >
                                    {layer.type === 'sticker' ? (
                                        <>
                                            <div className="layer-preview">
                                                <img src={layer.content} alt="Sticker" className="layer-thumb" />
                                            </div>
                                            <div className="layer-info" style={{ flex: 1, padding: '0 12px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--text-1)', fontSize: '14px', fontWeight: 500 }}>
                                                Sticker
                                            </div>
                                        </>
                                    ) : (
                                        <div className="layer-text-only" style={{ flex: 1, padding: '8px 12px 8px 0', minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: '#ffffff', fontSize: '16px', fontFamily: layer.style?.font, display: 'block', lineHeight: 'normal' }}>
                                            {layer.content || 'Text Layer'}
                                        </div>
                                    )}
                                    <div className="layer-actions">
                                        <div className="layer-reorder-btns">
                                            <button 
                                                className="layer-btn" 
                                                disabled={actualIndex === overlays.length - 1}
                                                onClick={(e) => { e.stopPropagation(); onReorder(actualIndex, 1); }}
                                                title="Move Up"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 15l-6-6-6 6"/>
                                                </svg>
                                            </button>
                                            <button 
                                                className="layer-btn" 
                                                disabled={actualIndex === 0}
                                                onClick={(e) => { e.stopPropagation(); onReorder(actualIndex, -1); }}
                                                title="Move Down"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M6 9l6 6 6-6"/>
                                                </svg>
                                            </button>
                                        </div>
                                        <button 
                                            className="layer-btn delete-btn" 
                                            onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : (
                    reversedFilters.length === 0 ? (
                        <div className="empty-layers">No filters applied</div>
                    ) : (
                        reversedFilters.map((filter, index) => {
                            const actualIndex = activeFilters.length - 1 - index;
                            const label = FILTERS[filter.id]?.label || filter.id;
                            const isRetro = isRetroFilter(filter.id);
                            const isExpanded = expandedFilter === filter.id;
                            
                            return (
                                <div key={filter.id} style={{ display: 'flex', flexDirection: 'column', padding: '0', background: 'transparent' }}>
                                    <div className="layer-item" style={{ marginBottom: 0, borderRadius: isExpanded ? '12px 12px 0 0' : '12px', alignItems: 'center' }}>
                                        <div className="layer-text-only" style={{ flex: 1, padding: '4px 12px 4px 0', minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: '#ffffff', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', lineHeight: '1.2' }}>
                                            {isRetro && (
                                                <button 
                                                    style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                    onClick={() => setExpandedFilter(isExpanded ? null : filter.id)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                        <path d="M9 18l6-6-6-6" />
                                                    </svg>
                                                </button>
                                            )}
                                            {label}
                                        </div>
                                        <div className="layer-actions" style={{ gap: '12px' }}>
                                            {!isRetro && (
                                                <input 
                                                    type="range" 
                                                    className="glass-slider"
                                                    min="0" max="150"
                                                    value={filter.intensity}
                                                    style={{ width: '60px', height: '2px' }}
                                                    onChange={(e) => {
                                                        const newFilters = [...activeFilters];
                                                        newFilters[actualIndex] = { ...filter, intensity: parseInt(e.target.value) };
                                                        updateActiveFilters(newFilters);
                                                    }}
                                                />
                                            )}
                                            <button 
                                                className="layer-btn"
                                                style={{ opacity: filter.visible ? 1 : 0.4 }}
                                                onClick={() => {
                                                    const newFilters = [...activeFilters];
                                                    newFilters[actualIndex] = { ...filter, visible: !filter.visible };
                                                    updateActiveFilters(newFilters);
                                                }}
                                                title="Toggle Visibility"
                                            >
                                                {filter.visible ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button 
                                                className="layer-btn delete-btn" 
                                                onClick={() => {
                                                    const newFilters = activeFilters.filter((_, i) => i !== actualIndex);
                                                    updateActiveFilters(newFilters);
                                                    if (expandedFilter === filter.id) setExpandedFilter(null);
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    {isExpanded && renderRetroControls(filter, actualIndex)}
                                </div>
                            );
                        })
                    )
                )}
            </div>
        </div>
    );
}
