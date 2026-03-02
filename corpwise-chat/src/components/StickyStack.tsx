import React, { ReactNode } from 'react';
import './StickyStack.css';

interface StickyStackItem {
    children: ReactNode;
}

interface StickyStackProps {
    items: StickyStackItem[];
    topOffset?: number; // px from top where cards stick, default 120
}

/**
 * StickyStack — each item pins to a top position and the next card
 * slides up over it as the user scrolls. Once all cards are visible
 * and stacked, the section scrolls away normally.
 */
const StickyStack = ({ items, topOffset = 120 }: StickyStackProps) => {
    return (
        <div className="sticky-stack-container">
            {items.map((item, index) => (
                <div
                    key={index}
                    className="sticky-stack-item"
                    style={{
                        top: `${topOffset + index * 20}px`,
                        zIndex: index + 1,
                    }}
                >
                    {item.children}
                </div>
            ))}
        </div>
    );
};

export default StickyStack;
