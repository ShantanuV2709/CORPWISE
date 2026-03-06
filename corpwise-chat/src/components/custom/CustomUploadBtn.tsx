import React from 'react';
import './CustomUploadBtn.css';
import { Upload } from 'lucide-react';

interface CustomUploadBtnProps {
    onClick: (e: React.FormEvent) => void;
    disabled: boolean;
    uploading: boolean;
}

const CustomUploadBtn: React.FC<CustomUploadBtnProps> = ({ onClick, disabled, uploading }) => {
    return (
        <button
            type="button"
            className={`custom-upload-btn-container ${disabled ? 'disabled' : ''}`}
            onClick={(e) => {
                if (!disabled && !uploading) {
                    onClick(e);
                }
            }}
            disabled={disabled}
        >
            <span className="custom-upload-btn-icon-wrapper">
                <Upload size={16} strokeWidth={2.5} className={uploading ? "animate-pulse" : ""} />
            </span>
            {uploading ? "Uploading..." : "Upload Document"}
        </button>
    );
};

export default CustomUploadBtn;
