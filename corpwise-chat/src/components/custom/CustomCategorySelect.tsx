import React, { useState, useEffect, useRef } from 'react';
import './CustomCategorySelect.css';

interface CategoryOption {
    id: string;
    label: string;
}

interface CustomCategorySelectProps {
    category: string;
    setCategory: (category: string) => void;
    disabled: boolean;
}

const CustomCategorySelect: React.FC<CustomCategorySelectProps> = ({ category, setCategory, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const categories: CategoryOption[] = [
        { id: "general", label: "General Knowledge" },
        { id: "policy", label: "Policy Document" },
        { id: "technical", label: "Technical Specification" },
        { id: "hr", label: "HR & Compliance" },
    ];

    const categoryLabel = categories.find(c => c.id === category)?.label || "Select Category";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="custom-category-select-wrapper" ref={dropdownRef}>
            <button
                type="button"
                className={`custom-category-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <span>{categoryLabel}</span>
                <span className="custom-category-caret">▼</span>
            </button>

            {isOpen && (
                <div className="custom-category-menu">
                    <div className="custom-category-label">Document Category</div>
                    <div className="custom-category-options-group">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                className="custom-category-option"
                                onClick={() => {
                                    setCategory(cat.id);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="flex-1">{cat.label}</span>
                                {category === cat.id && <span className="custom-category-check">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomCategorySelect;
