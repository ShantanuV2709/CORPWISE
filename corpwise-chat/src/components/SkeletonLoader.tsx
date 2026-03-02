import React from 'react';

interface SkeletonLoaderProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
    animated?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '8px',
    className = '',
    style = {},
    animated = true
}) => {
    return (
        <div
            className={`skeleton-loader ${animated ? 'animated' : ''} ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: 'rgba(255, 255, 255, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                ...style
            }}
        >
            {animated && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
                        animation: 'shimmer 1.5s infinite',
                        transform: 'translateX(-100%)'
                    }}
                />
            )}
            <style>
                {`
                    @keyframes shimmer {
                        100% {
                            transform: translateX(100%);
                        }
                    }
                `}
            </style>
        </div>
    );
};
