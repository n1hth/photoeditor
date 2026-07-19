import React, { useState, useRef, useEffect } from 'react';
import { FILTERS, FILTER_SETS, RETRO_DEFAULTS } from '../../utils/constants';

export function BottomBar({ activeTool, setActiveTool, activeFilters = [], setActiveFilters, commitIntensity, imageSrc, isCropDisabled }) {
    const [showFilters, setShowFilters] = useState(false);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const prevTool = useRef(activeTool);

    useEffect(() => {
        if (activeTool === 'filters' && prevTool.current !== 'filters') {
            setShowFilters(true);
        } else if (activeTool !== 'filters' && prevTool.current === 'filters') {
            setShowFilters(false);
        }
        prevTool.current = activeTool;
    }, [activeTool]);

    const handleFilterClick = () => {
        setActiveTool('filters');
    };

    const handleBackClick = () => {
        setActiveTool(null);
    };

    const isFiltersVisible = showFilters && activeTool === 'filters';
    const isTextMode = activeTool === 'text';
    const isSidePillVisible = isFiltersVisible || isTextMode;

    const setNames = Object.keys(FILTER_SETS);
    const activeSetName = setNames[currentSetIndex];
    const filtersInSet = FILTER_SETS[activeSetName];

    const cycleFilterSet = () => {
        setCurrentSetIndex((prev) => (prev + 1) % setNames.length);
    };

    return (
        <div className="bottom-bar-wrapper">
            {/* Left Side Pill: Back Arrow */}
            <div className={`side-pill-container ${isSidePillVisible ? 'visible' : ''}`}>
                <button className="side-pill glass-surface icon-only" onClick={handleBackClick} title="Back">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>

            {/* Intensity Slider Tooltip/Pill Removed since we moved it to LayersPanel */}

            <div className={`floating-bar floating-bar--l1 glass-surface ${isTextMode ? 'hidden' : ''}`} style={{ display: isTextMode ? 'none' : 'flex' }}>
                {/* Filters Layer (Only the filters now) */}
                <div className={`l1-content-layer filters-layer ${isFiltersVisible ? 'visible' : ''}`}>
                    <div className="filter-pills-scroll no-controls">
                        {<button 
                            className="filter-pill"
                            onClick={() => {
                                // Remove all filters belonging to the current set
                                const filteredOut = activeFilters.filter(f => !filtersInSet.includes(f.id));
                                setActiveFilters(filteredOut);
                            }}
                        >
                            None
                        </button>}
                        {filtersInSet.map(key => {
                            if (key === 'none') return null; // Fallback incase 'none' is still in the list

                            const label = FILTERS[key]?.label || key;
                            const isActive = activeFilters.some(f => f.id === key);
                            const onClick = () => {
                                if (isActive) {
                                    setActiveFilters(activeFilters.filter(f => f.id !== key));
                                } else {
                                    const isRetro = !!RETRO_DEFAULTS[key];
                                    if (activeFilters.length < 4 || isRetro) {
                                        const newFilter = { id: key, intensity: 100, visible: true };
                                        if (isRetro) {
                                            newFilter.params = { ...RETRO_DEFAULTS[key] };
                                            // Ensure only one retro filter at a time
                                            const filtered = activeFilters.filter(f => !RETRO_DEFAULTS[f.id]);
                                            setActiveFilters([...filtered, newFilter]);
                                        } else if (activeFilters.length < 4) {
                                            setActiveFilters([...activeFilters, newFilter]);
                                        }
                                    }
                                }
                            };

                            return (
                                <button 
                                    key={key}
                                    className={`filter-pill ${isActive ? 'active' : ''}`}
                                    onClick={onClick}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tabs Layer */}
                <div className={`l1-content-layer tabs-layer ${isFiltersVisible ? 'hidden' : ''}`}>
                    <div className="bar-tabs">
                        <button 
                            className={`bar-tab-btn ${activeTool === 'filters' ? 'active' : ''}`} 
                            onClick={handleFilterClick}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M10 2.5v15M2.5 10h15" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
                            </svg>
                            <span>Filters</span>
                        </button>
                        <button 
                            className={`bar-tab-btn ${activeTool === 'crop' ? 'active' : ''} ${isCropDisabled ? 'disabled' : ''}`} 
                            onClick={() => !isCropDisabled && setActiveTool(activeTool === 'crop' ? null : 'crop')}
                            disabled={isCropDisabled}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M4 16h8V8H4v8zM4 16v4M4 16H0M12 16h8M12 16v4M12 0v8M12 8h4M16 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Crop</span>
                        </button>
                        <button 
                            className={`bar-tab-btn ${activeTool === 'text' ? 'active' : ''}`} 
                            onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M4 5h12M10 5v11M7 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <span>Text</span>
                        </button>
                        <button 
                            className={`bar-tab-btn ${activeTool === 'stickers' ? 'active' : ''}`} 
                            onClick={() => setActiveTool(activeTool === 'stickers' ? null : 'stickers')}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="7.5" cy="8.5" r="1.2" fill="currentColor"/>
                                <circle cx="12.5" cy="8.5" r="1.2" fill="currentColor"/>
                                <path d="M6.5 12.5c1 1.5 5 1.5 7 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                            </svg>
                            <span>Stickers</span>
                        </button>
                        <button 
                            className={`bar-tab-btn ${activeTool === 'adjust' ? 'active' : ''}`} 
                            onClick={() => setActiveTool(activeTool === 'adjust' ? null : 'adjust')}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M3 6h4M11 6h6M3 10h8M15 10h2M3 14h2M9 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="9" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="13" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="7" cy="14" r="2" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            <span>Adjust</span>
                        </button>
                        <button 
                            className={`bar-tab-btn ${activeTool === 'layouts' ? 'active' : ''}`} 
                            onClick={() => setActiveTool(activeTool === 'layouts' ? null : 'layouts')}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <span>Layouts</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side Pill: Filter Set Selector */}
            <div className={`side-pill-container ${isFiltersVisible ? 'visible' : ''}`}>
                <button className="side-pill glass-surface text-only" onClick={cycleFilterSet}>
                    {activeSetName}
                </button>
            </div>
        </div>
    );
}
