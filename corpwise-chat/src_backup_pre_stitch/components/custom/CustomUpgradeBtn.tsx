import React from 'react';
import { Zap } from 'lucide-react';
import './CustomUpgradeBtn.css';

interface CustomUpgradeBtnProps {
    onClick: () => void;
}

const CustomUpgradeBtn: React.FC<CustomUpgradeBtnProps> = ({ onClick }) => {
    return (
        <button className="custom-upgrade-btn" onClick={onClick}>
            Upgrade Plan <Zap size={16} />
        </button>
    );
};

export default CustomUpgradeBtn;
