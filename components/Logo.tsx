import React from 'react';

export const AppLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#C4B5FD', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#F472B6', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <path
            fill="url(#logoGradient)"
            d="M50,5 C74.85,5 95,25.15 95,50 C95,74.85 74.85,95 50,95 C25.15,95 5,74.85 5,50 C5,25.15 25.15,5 50,5 Z M50,15 C30.67,15 15,30.67 15,50 C15,69.33 30.67,85 50,85 C69.33,85 85,69.33 85,50 C85,30.67 69.33,15 50,15 Z"
        />
        <path
            fill="url(#logoGradient)"
            d="M50 25 C 40 45, 40 55, 50 75 C 60 55, 60 45, 50 25 Z"
        />
    </svg>
);