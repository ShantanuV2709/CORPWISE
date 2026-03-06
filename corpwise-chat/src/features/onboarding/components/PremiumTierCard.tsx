import React from 'react';
import { Check, X } from 'lucide-react';
import '../styles/OnboardingPage.css';

export interface PremiumTierFeature {
    text: string;
    enabled: boolean;
}

export interface PremiumTierCardProps {
    tierId: string;
    tierName: string;
    price: string;
    description?: string;
    isPopular?: boolean;
    isRecommended?: boolean;
    isCurrent?: boolean;
    isLoading?: boolean;
    onSelect?: (tierId: string) => void;
    features: PremiumTierFeature[];
    buttonLabel?: string;
    disabled?: boolean;
}

export function PremiumTierCard({
    tierId,
    tierName,
    price,
    isPopular = false,
    isRecommended = false,
    isCurrent = false,
    isLoading = false,
    onSelect,
    features,
    buttonLabel,
    disabled = false,
}: PremiumTierCardProps) {
    const isPro = isPopular || tierId === 'professional';
    const cardClass = `ob-card${isPro ? ' ob-card--pro' : ''}${isRecommended ? ' ob-card--recommended' : ''}`;

    const defaultBtn = isCurrent
        ? 'Current Plan'
        : tierId === 'enterprise'
            ? 'Contact Sales'
            : 'Select Plan';
    const btnText = buttonLabel || defaultBtn;

    return (
        <div style={{ position: 'relative' }}>
            <div className={cardClass}>
                {/* Card Header */}
                <div className="ob-card-header">
                    {isPro ? (
                        <div className="ob-card-pro-row">
                            <span className="ob-card-tier-label">{tierName}</span>
                            <span className="ob-badge-popular">Most Popular</span>
                        </div>
                    ) : (
                        <div className="ob-card-tier-label">{tierName}</div>
                    )}
                    <div className="ob-card-price">
                        <span className="ob-card-price-value">{price}</span>
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    className={`ob-card-btn${isPro ? ' ob-card-btn--primary' : ''}`}
                    onClick={() => onSelect?.(tierId)}
                    disabled={disabled || isLoading || isCurrent}
                    style={isCurrent ? { opacity: 0.6, cursor: 'default' } : undefined}
                >
                    {isLoading ? 'Processing...' : btnText}
                </button>

                {/* Features */}
                <div style={{ flex: 1 }}>
                    <ul className="ob-features">
                        {features.map((f, i) => (
                            <li key={i} className="ob-feature-item" style={isPro ? { color: '#e2e8f0' } : undefined}>
                                {f.enabled ? (
                                    <Check className="ob-feature-check" size={18} strokeWidth={3} />
                                ) : (
                                    <X className="ob-feature-cross" size={18} />
                                )}
                                <span>{f.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Current Plan badge */}
            {isCurrent && (
                <div style={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: 99,
                    padding: '4px 14px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#fff',
                    zIndex: 10,
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}>
                    Current Plan
                </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
                <div className="ob-card-loading-overlay">
                    <div className="loading-spinner" style={{ width: 30, height: 30 }} />
                </div>
            )}
        </div>
    );
}
