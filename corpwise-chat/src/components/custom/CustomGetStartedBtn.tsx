import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import './CustomGetStartedBtn.css';

interface CustomGetStartedBtnProps {
    onClick: () => void;
    text?: string;
}

const CustomGetStartedBtn: React.FC<CustomGetStartedBtnProps> = ({ onClick, text = "Get Started" }) => {
    return (
        <button className="custom-get-started-btn" onClick={onClick}>
            <span className="btn-label">{text}</span>
            <span className="btn-icon-wrapper">
                <span className="btn-icon-bg"></span>
                <span className="btn-icon-fg">
                    <ArrowUpRight size={18} className="arrow-icon" strokeWidth={2.5} />
                </span>
            </span>
        </button>
    );
};

export default CustomGetStartedBtn;
