import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedImg } from '../../utils/cropUtils';

const ASPECT_RATIOS = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:5', value: 4 / 5 },
    { label: '9:16', value: 9 / 16 },
    { label: '16:9', value: 16 / 9 },
];

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight
    );
}

export function CropTool({ baseImageSrc, onApply, onClose }) {
    const [crop, setCrop] = useState();
    const [aspect, setAspect] = useState(null); // start free form
    const imgRef = useRef(null);

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        imgRef.current = e.currentTarget;
        if (aspect) {
            setCrop(centerAspectCrop(width, height, aspect));
        } else {
            // Initial crop 100%
            setCrop({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
        }
    };

    const handleAspectChange = (newAspect) => {
        setAspect(newAspect);
        if (newAspect && imgRef.current) {
            const { width, height } = imgRef.current;
            setCrop(centerAspectCrop(width, height, newAspect));
        }
    };

    const handleApply = async () => {
        if (!crop || !imgRef.current) {
            onClose();
            return;
        }

        try {
            // Convert percent crop to pixel crop
            const pixelCrop = {
                x: (crop.x * imgRef.current.naturalWidth) / 100,
                y: (crop.y * imgRef.current.naturalHeight) / 100,
                width: (crop.width * imgRef.current.naturalWidth) / 100,
                height: (crop.height * imgRef.current.naturalHeight) / 100,
            };

            const croppedUrl = await getCroppedImg(baseImageSrc, pixelCrop);
            onApply(croppedUrl);
        } catch (e) {
            console.error('Error cropping image:', e);
            onClose();
        }
    };

    return (
        <div className="crop-overlay-screen" style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: '#000', display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                height: '56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0 16px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <button onClick={onClose} style={{ color: '#fff', background: 'transparent', border: 'none', fontSize: '15px' }}>Cancel</button>
                <div style={{ fontWeight: 600, color: '#fff' }}>Crop</div>
                <button onClick={handleApply} style={{ color: 'var(--accent-2)', background: 'transparent', border: 'none', fontWeight: 600, fontSize: '15px' }}>Apply</button>
            </div>

            {/* Crop Area */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px', overflow: 'hidden'
            }}>
                <ReactCrop
                    crop={crop}
                    onChange={(c, percentCrop) => setCrop(percentCrop)}
                    aspect={aspect}
                >
                    <img
                        src={baseImageSrc}
                        onLoad={onImageLoad}
                        style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 160px)', objectFit: 'contain' }}
                        alt="Crop source"
                    />
                </ReactCrop>
            </div>

            {/* Bottom Controls */}
            <div style={{
                padding: '24px 16px 40px', background: 'rgba(0,0,0,0.8)',
                display: 'flex', gap: '8px', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
                {ASPECT_RATIOS.map(ratio => (
                    <button
                        key={ratio.label}
                        onClick={() => handleAspectChange(ratio.value)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: aspect === ratio.value ? 'var(--accent-1)' : 'transparent',
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            fontSize: '14px',
                            fontWeight: 500
                        }}
                    >
                        {ratio.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
