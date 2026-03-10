import React from 'react';

export const CustomSlackIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="#E01E5A" />
        <path d="M5.042 11.381a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 6.336a2.528 2.528 0 0 1 2.52 2.522v6.306a2.528 2.528 0 0 1-2.52 2.522A2.528 2.528 0 0 1 2.522 15.165v-3.784h2.52z" fill="#E01E5A" />
        <path d="M8.825 5.042a2.528 2.528 0 0 1-2.523-2.52A2.528 2.528 0 0 1 8.825 0a2.527 2.527 0 0 1 2.52 2.522v2.52h-2.52z" fill="#36C5F0" />
        <path d="M12.609 5.042a2.528 2.528 0 0 1 2.523-2.52A2.528 2.528 0 0 1 17.654 5.042a2.528 2.528 0 0 1-2.522 2.52H8.825a2.528 2.528 0 0 1-2.522-2.52A2.528 2.528 0 0 1 8.825 2.52h3.784v2.522z" fill="#36C5F0" />
        <path d="M18.958 8.825a2.528 2.528 0 0 1 2.52-2.523A2.528 2.528 0 0 1 24 8.825a2.527 2.527 0 0 1-2.522 2.52h-2.52v-2.52z" fill="#2EB67D" />
        <path d="M18.958 12.609a2.528 2.528 0 0 1 2.52 2.523A2.528 2.528 0 0 1 18.958 17.654a2.528 2.528 0 0 1-2.52-2.522V8.825a2.528 2.528 0 0 1 2.52-2.522A2.528 2.528 0 0 1 21.478 8.825v3.784h-2.52z" fill="#2EB67D" />
        <path d="M15.175 18.958a2.528 2.528 0 0 1 2.523 2.52A2.528 2.528 0 0 1 15.175 24a2.527 2.527 0 0 1-2.52-2.522v-2.52h2.52z" fill="#ECB22E" />
        <path d="M11.391 18.958a2.528 2.528 0 0 1-2.523 2.52A2.528 2.528 0 0 1 6.346 18.958a2.528 2.528 0 0 1 2.522-2.52h6.307a2.528 2.528 0 0 1 2.522 2.52A2.528 2.528 0 0 1 15.175 21.48h-3.784v-2.522z" fill="#ECB22E" />
    </svg>
);

export const CustomPdfIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#E03131" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 11V16" stroke="#E03131" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 11H12.5C13.3284 11 14 11.6716 14 12.5C14 13.3284 13.3284 14 12.5 14H10" stroke="#E03131" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 2V8H20" stroke="#E03131" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const CustomDocxIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#3B82F6" />
        <path d="M14 2V8H20" fill="#2563EB" />
        <path d="M8 13H16M8 17H16M8 9H11" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const CustomTxtIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#333333" />
        <path d="M14 2V8H20" fill="#1F1F1F" />
        <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="7" fontFamily="sans-serif" fontWeight="bold">TXT</text>
    </svg>
);
