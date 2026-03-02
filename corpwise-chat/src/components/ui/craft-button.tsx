import React from 'react';
import './craft-button.css';

/* ── Label ── */
interface CraftButtonLabelProps {
    children: React.ReactNode;
    className?: string;
}

const CraftButtonLabel: React.FC<CraftButtonLabelProps> = ({ children, className = '' }) => (
    <span className={`craft-btn-label ${className}`}>{children}</span>
);

/* ── Icon ── */
interface CraftButtonIconProps {
    children: React.ReactNode;
    className?: string;
}

const CraftButtonIcon: React.FC<CraftButtonIconProps> = ({ children, className = '' }) => (
    <span className={`craft-btn-icon-wrap ${className}`}>
        {/* Circle that expands on hover */}
        <span className="craft-btn-icon-bg" />
        {/* Icon container */}
        <span className="craft-btn-icon-fg">
            {children}
        </span>
    </span>
);

/* ── Button ── */
interface CraftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
}

const CraftButton: React.FC<CraftButtonProps> = ({ children, className = '', ...rest }) => (
    <button className={`craft-btn group ${className}`} {...rest}>
        {children}
    </button>
);

export {
    CraftButton,
    CraftButtonLabel,
    CraftButtonIcon,
};
