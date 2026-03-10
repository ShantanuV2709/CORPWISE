import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, X, Check, CheckCircle } from 'lucide-react';
import { fetchSubscriptionTiers, updateSubscriptionTier, type SubscriptionTier } from '../api/subscription';
import { OnboardingStepper } from '../components/OnboardingStepper';
import toast from 'react-hot-toast';
import '../styles/OnboardingPage.css';

/* ─── Feature row helper ─── */
function FeatureItem({ text, enabled = true, highlight = false }: { text: string; enabled?: boolean; highlight?: boolean }) {
    return (
        <li className="ob-feature-item" style={highlight ? { color: '#e2e8f0' } : undefined}>
            {enabled ? (
                <Check className="ob-feature-check" size={18} strokeWidth={3} />
            ) : (
                <X className="ob-feature-cross" size={18} />
            )}
            <span>{text}</span>
        </li>
    );
}

/* ─── Main Page ─── */
export function OnboardingPage() {
    const navigate = useNavigate();
    const [tiers, setTiers] = useState<Record<string, SubscriptionTier>>({});
    const [loading, setLoading] = useState(true);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [showWizard, setShowWizard] = useState(false);
    const [recommendedTier, setRecommendedTier] = useState<string | null>(null);
    const [selectedTier, setSelectedTier] = useState<string | null>(null);
    const [confirmingTier, setConfirmingTier] = useState<string | null>(null);

    useEffect(() => {
        loadTiers();
    }, []);

    const loadTiers = async () => {
        try {
            const data = await fetchSubscriptionTiers();
            setTiers(data.tiers);
        } catch (err) {
            console.error('Failed to load tiers:', err);
            toast.error('Failed to load subscription tiers');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = (tierId: string) => {
        setConfirmingTier(tierId);
    };

    const confirmAndSubscribe = async () => {
        if (!confirmingTier) return;

        const companyId = localStorage.getItem('admin_company_id');
        if (!companyId) {
            toast.error('Session expired. Please log in again.');
            navigate('/');
            return;
        }

        setLoadingAction(confirmingTier);
        try {
            await updateSubscriptionTier(confirmingTier, companyId);
            toast.success(`Successfully subscribed to ${tiers[confirmingTier]?.name || confirmingTier} plan!`);
            navigate('/admin/overview');
        } catch (err: any) {
            console.error('Error selecting plan:', err);
            toast.error(err.message || 'Failed to assign subscription plan');
        } finally {
            setLoadingAction(null);
            setConfirmingTier(null);
        }
    };

    /* ─── Build feature lists from API data ─── */
    const getFeatures = (tierId: string, tier: SubscriptionTier) => {
        return [
            { text: tier.max_documents === -1 ? "Unlimited Documents" : `${tier.max_documents} Documents`, enabled: true },
            { text: tier.max_queries_per_month === -1 ? "Unlimited Queries" : `${tier.max_queries_per_month.toLocaleString()} Queries/month`, enabled: true },
            { text: "Advanced Analytics", enabled: tier.analytics_enabled },
            { text: "Custom Branding", enabled: tier.custom_branding },
            { text: "Priority Support", enabled: tier.priority_support },
        ];
    };

    return (
        <div className="ob-page">
            <div className="ob-container">

                {/* ─── Nav ─── */}
                <nav className="ob-nav">
                    <div className="ob-nav-brand">
                        <h2>CORPWISE</h2>
                    </div>

                    <div className="ob-nav-actions">
                        <button className="ob-help-btn" onClick={() => setShowWizard(true)}>
                            <Lightbulb size={16} />
                            Help me choose
                        </button>
                        <button className="ob-close-btn" onClick={() => navigate('/')}>
                            <X size={24} />
                        </button>
                    </div>
                </nav>

                {/* ─── Header ─── */}
                <header className="ob-header">
                    <h1 className="ob-heading">Choose Your Plan</h1>
                    <div className="ob-header-sub">
                        <p>Enterprise-grade AI infrastructure tailored for your team's scale.</p>
                    </div>
                </header>

                {/* ─── Recommended Alert ─── */}
                {recommendedTier && (
                    <div className="ob-recommended-badge">
                        <CheckCircle size={20} />
                        Based on your answers, we recommend the <strong>{tiers[recommendedTier]?.name || recommendedTier}</strong> plan.
                    </div>
                )}

                {/* ─── Cards ─── */}
                <main className="ob-main">
                    {loading ? (
                        <div className="ob-loading">Loading available plans...</div>
                    ) : (
                        <div className="ob-grid">
                            {Object.entries(tiers).map(([tierId, tier]) => {
                                const isPro = tierId === 'professional';
                                const isRecommended = recommendedTier === tierId;
                                const features = getFeatures(tierId, tier);
                                const cardClass = `ob-card${isPro ? ' ob-card--pro' : ''}${isRecommended ? ' ob-card--recommended' : ''}`;

                                return (
                                    <div key={tierId} style={{ position: 'relative' }}>
                                        <div className={cardClass}>
                                            {/* Card Header */}
                                            <div className="ob-card-header">
                                                {isPro ? (
                                                    <div className="ob-card-pro-row">
                                                        <span className="ob-card-tier-label">{tier.name}</span>
                                                        <span className="ob-badge-popular">Most Popular</span>
                                                    </div>
                                                ) : (
                                                    <div className="ob-card-tier-label">{tier.name}</div>
                                                )}
                                                <div className="ob-card-price">
                                                    <span className="ob-card-price-value">{tier.price_display}</span>
                                                </div>
                                            </div>

                                            {/* CTA Button */}
                                            <button
                                                className={`ob-card-btn${isPro ? ' ob-card-btn--primary' : ''}`}
                                                onClick={() => handleSelectPlan(tierId)}
                                                disabled={loadingAction === tierId}
                                            >
                                                {loadingAction === tierId ? 'Processing...' : (
                                                    tierId === 'enterprise' ? 'Contact Sales' : 'Select Plan'
                                                )}
                                            </button>

                                            {/* Features */}
                                            <div style={{ flex: 1 }}>
                                                <ul className="ob-features">
                                                    {features.map((f, i) => (
                                                        <FeatureItem key={i} text={f.text} enabled={f.enabled} highlight={isPro} />
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Loading overlay */}
                                        {loadingAction === tierId && (
                                            <div className="ob-card-loading-overlay">
                                                <div className="loading-spinner" style={{ width: 30, height: 30 }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>


            </div>

            {/* ─── Confirmation Modal ─── */}
            {confirmingTier && tiers[confirmingTier] && (
                <div className="ob-modal-overlay">
                    <div className="ob-modal">
                        <h2>Confirm Selection</h2>
                        <p>
                            You selected the <span style={{ color: '#fff', fontWeight: 600 }}>{tiers[confirmingTier].name}</span> plan for {tiers[confirmingTier].price_display}. Are you ready to proceed?
                        </p>
                        <div className="ob-modal-actions">
                            <button className="ob-modal-cancel" onClick={() => setConfirmingTier(null)}>Cancel</button>
                            <button
                                className="ob-modal-confirm"
                                onClick={confirmAndSubscribe}
                                disabled={loadingAction === confirmingTier}
                            >
                                {loadingAction === confirmingTier ? (
                                    <>
                                        <div className="loading-spinner" style={{ width: 14, height: 14, borderTopColor: '#000', borderRightColor: '#000' }} />
                                        Confirming...
                                    </>
                                ) : 'Proceed to Dashboard'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Wizard Modal ─── */}
            {showWizard && (
                <div className="ob-wizard-overlay">
                    <div className="ob-wizard-box onboarding-section">
                        <button className="ob-wizard-close" onClick={() => setShowWizard(false)}>
                            <X size={18} />
                        </button>
                        <OnboardingStepper
                            onComplete={(data: any, tier: string) => {
                                setRecommendedTier(tier);
                                setSelectedTier(tier);
                                setShowWizard(false);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
