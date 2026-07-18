import React, { useState } from 'react';

export function UploadScreen({ onImageUpload }) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => onImageUpload(e.target.result);
        reader.readAsDataURL(file);
    };

    return (
        <div id="upload-screen">
            <div className="upload-bg-orb upload-bg-orb--1"></div>
            <div className="upload-bg-orb upload-bg-orb--2"></div>
            <div className="upload-bg-orb upload-bg-orb--3"></div>

            <div className="upload-container">
                <div className="upload-brand">
                    <div className="brand-icon">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <defs>
                                <linearGradient id="brand-grad" x1="0" y1="0" x2="40" y2="40">
                                    <stop offset="0%" stopColor="#7c5dff"/>
                                    <stop offset="100%" stopColor="#00d4ff"/>
                                </linearGradient>
                            </defs>
                            <rect x="2" y="2" width="36" height="36" rx="10" stroke="url(#brand-grad)" strokeWidth="2.5" fill="none"/>
                            <circle cx="15" cy="15" r="4" fill="url(#brand-grad)"/>
                            <path d="M8 30 L16 20 L22 26 L28 18 L34 30" stroke="url(#brand-grad)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="brand-name">LumiEdit</h1>
                </div>
                
                <div 
                    className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
                    onClick={() => document.getElementById('file-input').click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        handleFile(e.dataTransfer.files[0]);
                    }}
                >
                    <div className="upload-zone-inner">
                        <div className="upload-icon">
                            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                <path d="M28 8v28M16 20l12-12 12 12" stroke="url(#brand-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 38v6a4 4 0 004 4h32a4 4 0 004-4v-6" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h2>Drop your photo here</h2>
                        <p>or <span className="upload-browse-link">click to browse</span></p>
                        <div className="upload-formats">JPG, PNG, WEBP supported</div>
                    </div>
                </div>
                <input 
                    type="file" 
                    id="file-input" 
                    accept="image/*" 
                    hidden 
                    onChange={(e) => handleFile(e.target.files[0])} 
                />
            </div>
        </div>
    );
}
