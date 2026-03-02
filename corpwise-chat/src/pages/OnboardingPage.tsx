import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, X, CheckCircle } from 'lucide-react';
import { fetchSubscriptionTiers, updateSubscriptionTier, type SubscriptionTier } from '../api/subscription';
import { TierCard } from '../components/TierCard';
import { OnboardingStepper } from '../components/OnboardingStepper';
import toast from 'react-hot-toast';
import './LandingPage.css'; // Reuse landing page base styles like gradients
import '../index.css';

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

    return (
        <div style={{
            minHeight: '100vh',
            background: '#09090b',
            color: '#e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 20px 120px 20px', // Extra bottom padding
            position: 'relative',
            overflowX: 'hidden',
            overflowY: 'auto' // Allow scrolling over the 100vh body
        }}>
            {/* Background elements */}
            <div className="hero-glow" style={{ top: '-20%', left: '50%', transform: 'translateX(-50%)', opacity: 0.3 }} />

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px', zIndex: 1, maxWidth: '800px' }}>
                <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    marginBottom: '32px'
                }}>
                    CORPWISE
                </div>

                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>
                    Choose Your Plan
                </h1>
                <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.6 }}>
                    Select the intelligence tier that fits your organization's needs. You can always upgrade later as your requirements grow.
                </p>

                <button
                    onClick={() => setShowWizard(true)}
                    style={{
                        marginTop: '24px',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        color: '#facc15',
                        padding: '10px 20px',
                        borderRadius: '24px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(234, 179, 8, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(234, 179, 8, 0.1)';
                    }}
                >
                    <Lightbulb size={18} />
                    Help me choose
                </button>
            </div>

            {/* Recommended alert */}
            {recommendedTier && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: 500,
                    animation: 'slideUp 0.3s ease',
                    zIndex: 1
                }}>
                    <CheckCircle size={20} />
                    Based on your answers, we strongly recommend the {tiers[recommendedTier]?.name || recommendedTier} plan.
                </div>
            )}

            {/* Plan Cards */}
            {loading ? (
                <div style={{ padding: '60px', color: '#64748b' }}>Loading available plans...</div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '24px',
                    width: '100%',
                    maxWidth: '1200px',
                    zIndex: 1
                }}>
                    {Object.entries(tiers).map(([tierId, tier]) => (
                        <div key={tierId} style={{ position: 'relative' }}>
                            {recommendedTier === tierId && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-14px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#10b981',
                                    color: '#fff',
                                    padding: '4px 16px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    zIndex: 10,
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                                }}>
                                    Recommended For You
                                </div>
                            )}
                            <TierCard
                                tierId={tierId}
                                tierName={tier.name}
                                price={tier.price_display}
                                description={tier.description}
                                isPopular={tierId === 'professional'}
                                isSelected={selectedTier === tierId}
                                onSelect={() => handleSelectPlan(tierId)}
                                features={[
                                    { text: tier.max_documents === -1 ? "Unlimited Documents" : `${tier.max_documents} Documents`, enabled: true },
                                    { text: tier.max_queries_per_month === -1 ? "Unlimited Queries" : `${tier.max_queries_per_month.toLocaleString()} Queries/month`, enabled: true },
                                    { text: "Advanced Analytics", enabled: tier.analytics_enabled },
                                    { text: "Custom Branding", enabled: tier.custom_branding },
                                    { text: "Priority Support", enabled: tier.priority_support }
                                ]}
                                behindGlowColor={
                                    recommendedTier === tierId ? 'rgba(16, 185, 129, 0.67)' :
                                        tierId === 'professional' ? 'rgba(99, 102, 241, 0.4)' :
                                            'rgba(255, 255, 255, 0.1)'
                                }
                            />
                            {loadingAction === tierId && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.5)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 20,
                                    backdropFilter: 'blur(2px)'
                                }}>
                                    <div className="loading-spinner" style={{ width: 30, height: 30 }} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmingTier && tiers[confirmingTier] && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#18181b', // zinc-900
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '400px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
                            Confirm Selection
                        </h2>
                        <p style={{ color: '#a1a1aa', marginBottom: '24px', lineHeight: 1.5 }}>
                            You selected the <span style={{ color: '#fff', fontWeight: 600 }}>{tiers[confirmingTier].name}</span> plan for {tiers[confirmingTier].price_display}. Are you ready to proceed to the dashboard?
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmingTier(null)}
                                style={{
                                    padding: '10px 24px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#e4e4e7',
                                    borderRadius: '8px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAndSubscribe}
                                disabled={loadingAction === confirmingTier}
                                style={{
                                    padding: '10px 24px',
                                    background: '#fff',
                                    border: 'none',
                                    color: '#000',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: loadingAction === confirmingTier ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {loadingAction === confirmingTier ? (
                                    <>
                                        <div className="loading-spinner" style={{ width: 14, height: 14, borderTopColor: '#000', borderRightColor: '#000' }} />
                                        Confirming...
                                    </>
                                ) : (
                                    'Proceed to Dashboard'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Wizard Modal */}
            {showWizard && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="onboarding-section" style={{
                        background: '#09090b',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        borderRadius: 24,
                        boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 40px rgba(234, 179, 8, 0.1)',
                        padding: '32px',
                        position: 'relative',
                        width: '100%',
                        maxWidth: '700px',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <button
                            onClick={() => setShowWizard(false)}
                            style={{
                                position: 'absolute',
                                top: 20,
                                right: 20,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                zIndex: 10,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#94a3b8';
                            }}
                        >
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
