import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import './button-04.css';

interface ButtonIconHoverProps {
    children?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

const ButtonIconHoverDemo: React.FC<ButtonIconHoverProps> = ({
    children = 'Get In Touch',
    onClick,
    className = '',
}) => {
    return (
        <button className={`btn-icon-hover group ${className}`} onClick={onClick}>
            {children}
            <ArrowRightIcon
                size={18}
                className="btn-icon-hover-arrow"
            />
        </button>
    );
};

export default ButtonIconHoverDemo;
