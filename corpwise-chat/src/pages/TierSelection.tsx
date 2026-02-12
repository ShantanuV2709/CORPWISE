import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Sparkles, Lightbulb, Database, Key, Users, ArrowLeft, BookOpen, Terminal, Copy, ExternalLink, ChevronRight } from 'lucide-react';
import { TierCard } from '../components/TierCard';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { fetchSubscriptionTiers, updateSubscriptionTier, type SubscriptionTier } from '../api/subscription';
import { adminSignup, adminLogin } from '../api/auth';
import { getSubscription, type SubscriptionDetails } from '../api/admin';
import './TierSelection.css';




export function TierSelection() {
    const navigate = useNavigate();
    const [tiers, setTiers] = useState<Record<string, SubscriptionTier>>({});
    const [loadingTiers, setLoadingTiers] = useState(true);
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'plan' | 'quick-start' | 'docs'>('plan');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Form states
    const [companyName, setCompanyName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [adminUsername, setAdminUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [recommendedTier, setRecommendedTier] = useState<string | null>(null);
    const [currentSub, setCurrentSub] = useState<SubscriptionDetails | null>(null);

    useEffect(() => {
        loadTiers();
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        const storedCompanyId = localStorage.getItem('admin_company_id');
        if (storedCompanyId) {
            setIsLoggedIn(true);
            setCompanyId(storedCompanyId); // Pre-fill for convenience

            // NEW: Fetch current subscription + usage
            try {
                const subData = await getSubscription(storedCompanyId);
                setCurrentSub(subData);
            } catch (err) {
                console.error("Failed to load subscription details:", err);
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_company_id');
        setIsLoggedIn(false);
        setCompanyId('');
        navigate('/');
    };

    const loadTiers = async () => {
        try {
            const data = await fetchSubscriptionTiers();
            setTiers(data.tiers);
        } catch (err) {
            console.error('Failed to load tiers:', err);
        } finally {
            setLoadingTiers(false);
        }
    };

    const handleTierSelect = async (tierId: string) => {
        setSelectedTierId(tierId);
        setRecommendedTier(null); // Clear recommendation when manually selecting

        if (isLoggedIn) {
            // If logged in, update tier directly
            setLoading(true);
            try {
                // We need the companyId from somewhere. 
                // We set setCompanyId from localStorage on mount, but let's be safe.
                const currentCompanyId = localStorage.getItem('admin_company_id') || companyId;
                if (!currentCompanyId) throw new Error("Please log in again");

                await updateSubscriptionTier(tierId, currentCompanyId);
                setSuccessMessage(`Plan updated to ${tiers[tierId]?.name}!`);
                setShowSuccessModal(true);
                // Reload page to reflect changes
                setTimeout(() => {
                    setShowSuccessModal(false);
                    window.location.reload();
                }, 2000);
            } catch (err: any) {
                console.error("Failed to update tier:", err);
                setShowAuthModal(true); // Fallback to auth if something is wrong
            } finally {
                setLoading(false);
            }
        } else {
            setAuthMode('register');
            setShowAuthModal(true);
        }
    };

    const handleOnboardingComplete = (data: any, tier: string) => {
        console.log('Onboarding data:', data);
        setRecommendedTier(tier);
        setSelectedTierId(tier);
        setShowOnboarding(false);
        // Scroll to tier cards
        setTimeout(() => {
            const tierSection = document.querySelector('.tier-grid');
            tierSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let userCompanyId = companyId;

            if (authMode === 'register') {
                // Allow registration without selectedTierId
                // Default to 'professional' if null, or maybe 'free' if your backend supports it?
                // For now we'll pass the selected tier OR undefined/null to let backend handle default (which is professional)
                const tierToRegister = selectedTierId || "professional"; // Fallback to professional as per API default

                const data = await adminSignup(adminUsername, password, companyId, tierToRegister);
                userCompanyId = data.company_id;

                setSuccessMessage(`Welcome to CORPWISE! Account created.`);
            } else {
                const data = await adminLogin(adminUsername, password, companyId);
                userCompanyId = data.company_id;

                if (selectedTierId && data.subscription_tier && data.subscription_tier !== selectedTierId) {
                    try {
                        // Auto-update tier if selected and different
                        await updateSubscriptionTier(selectedTierId, userCompanyId);
                        setSuccessMessage(`Welcome back! Your plan has been updated to ${tiers[selectedTierId]?.name}.`);
                    } catch (updateErr) {
                        console.error("Failed to update tier:", updateErr);
                        setSuccessMessage(`Welcome back! You are currently on the ${data.subscription_tier} plan.`);
                    }
                } else {
                    setSuccessMessage(`Welcome back!`);
                }
            }

            localStorage.setItem('admin_company_id', userCompanyId);
            setIsLoggedIn(true);
            setShowAuthModal(false);
            setShowSuccessModal(true);

            // Access check: only redirect if they have a plan selected or we want to force them to dashboard
            // User said: "let them select after registering".
            // So if they just registered (no tier selected originally), maybe we keep them here?
            if (selectedTierId) {
                setTimeout(() => {
                    navigate('/admin');
                }, 2000);
            } else {
                // Just close modal (already done) and let them stay
                setTimeout(() => {
                    setShowSuccessModal(false);
                }, 2000);
            }

        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const openAuthModal = (mode: 'register' | 'login') => {
        setAuthMode(mode);
        setShowAuthModal(true);
    };



    return (
        <div className="tier-selection-page">

            {/* Side Panel */}
            <div className="side-panel" style={{ zIndex: 1 }}>
                <div className="side-panel-logo">CORPWISE</div>

                <div className="side-panel-section">
                    <div className="side-panel-section-title">Getting Started</div>
                    <div
                        className={`side-panel-item ${activeTab === 'plan' ? 'active' : ''}`}
                        onClick={() => setActiveTab('plan')}
                    >
                        <span>Choose Your Plan</span>
                        {activeTab !== 'plan' && <ChevronRight size={14} className="side-panel-arrow" />}
                    </div>
                    <div
                        className={`side-panel-item ${activeTab === 'quick-start' ? 'active' : ''}`}
                        onClick={() => setActiveTab('quick-start')}
                    >
                        <span>Quick Start</span>
                        {activeTab !== 'quick-start' && <ChevronRight size={14} className="side-panel-arrow" />}
                    </div>
                </div>

                <div className="side-panel-section">
                    <div className="side-panel-section-title">Resources</div>
                    <div
                        className={`side-panel-item ${activeTab === 'docs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('docs')}
                    >
                        <span>Documentation</span>
                        {activeTab !== 'docs' && <ChevronRight size={14} className="side-panel-arrow" />}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Header Actions */}
                {/* Header Actions */}
                {/* Header Actions */}
                <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '32px' }}>
                    <div className="header-left">
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.7)',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                            }}
                            title="Back to Role Selection"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    <div className="header-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Hint Button */}
                        {!isLoggedIn && (
                            <div className="header-hint-wrapper">
                                <button
                                    onClick={() => setShowOnboarding(true)}
                                    className="header-btn-secondary"
                                    style={{
                                        padding: '10px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(234, 179, 8, 0.1)',
                                        border: '1px solid rgba(234, 179, 8, 0.3)',
                                        color: '#eab308',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    title="Help me choose"
                                >
                                    <Lightbulb size={20} />
                                </button>
                            </div>
                        )}

                        {isLoggedIn ? (
                            <>
                                <button
                                    className="header-btn header-btn-secondary"
                                    onClick={() => navigate('/admin')}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.05) 100%)',
                                        borderColor: 'rgba(96, 165, 250, 0.4)',
                                        color: '#60a5fa'
                                    }}
                                >
                                    Dashboard
                                </button>
                                <button
                                    className="header-btn header-btn-primary"
                                    onClick={handleLogout}
                                    style={{
                                        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                                        borderColor: '#3b82f6',
                                        color: '#fff',
                                        boxShadow: '0 4px 15px rgba(96, 165, 250, 0.3)'
                                    }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="header-btn header-btn-secondary"
                                    onClick={() => openAuthModal('login')}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.05) 100%)',
                                        borderColor: 'rgba(96, 165, 250, 0.4)',
                                        color: '#60a5fa'
                                    }}
                                >
                                    Login
                                </button>
                                <button
                                    className="header-btn header-btn-primary"
                                    onClick={() => openAuthModal('register')}
                                    style={{
                                        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                                        borderColor: '#3b82f6',
                                        color: '#fff',
                                        boxShadow: '0 4px 15px rgba(96, 165, 250, 0.3)'
                                    }}
                                >
                                    Get Started
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {activeTab === 'plan' && (
                    <>
                        {/* Dashboard Header */}
                        <div className="tier-dashboard-header">
                            <h1 className="tier-dashboard-title">{isLoggedIn ? 'Current Plan' : 'Choose Your Plan'}</h1>
                            {!isLoggedIn && (
                                <p className="tier-dashboard-subtitle">
                                    Select the perfect subscription tier for your organization
                                </p>
                            )}
                        </div>

                        {/* Onboarding Stepper */}
                        {showOnboarding && (
                            <div className="onboarding-section" style={{ position: 'relative', marginBottom: '80px' }}>
                                <button
                                    onClick={() => setShowOnboarding(false)}
                                    style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        right: '0',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        zIndex: 20
                                    }}
                                    title="Close"
                                >
                                    ✕
                                </button>
                                <OnboardingStepper onComplete={handleOnboardingComplete} />
                            </div>
                        )}

                        {/* Content Logic: Logged In vs Guest */}
                        {isLoggedIn && currentSub ? (
                            <>
                                {/* Current Plan Section */}
                                <div className="current-plan-section">
                                    <div className="current-plan-card">
                                        {/* Left: Plan Card */}
                                        <div className="plan-card-wrapper-current">
                                            <TierCard
                                                tierId={currentSub.subscription_tier}
                                                tierName={tiers[currentSub.subscription_tier]?.name || currentSub.subscription_tier}
                                                price={tiers[currentSub.subscription_tier]?.price_display}
                                                description={tiers[currentSub.subscription_tier]?.description}
                                                features={[
                                                    {
                                                        text: tiers[currentSub.subscription_tier]?.max_documents === -1
                                                            ? 'Unlimited Documents'
                                                            : `${tiers[currentSub.subscription_tier]?.max_documents} Documents`,
                                                        enabled: true
                                                    },
                                                    {
                                                        text: tiers[currentSub.subscription_tier]?.max_queries_per_month === -1
                                                            ? 'Unlimited Queries'
                                                            : `${tiers[currentSub.subscription_tier]?.max_queries_per_month.toLocaleString()} Queries/month`,
                                                        enabled: true
                                                    },
                                                    {
                                                        text: 'Advanced Analytics',
                                                        enabled: tiers[currentSub.subscription_tier]?.analytics_enabled
                                                    },
                                                    {
                                                        text: 'Custom Branding',
                                                        enabled: tiers[currentSub.subscription_tier]?.custom_branding
                                                    },
                                                    {
                                                        text: 'Priority Support',
                                                        enabled: tiers[currentSub.subscription_tier]?.priority_support
                                                    }
                                                ]}
                                                onSelect={() => { }} // No action for current plan here
                                                currentPlan={true}
                                                enableTilt={true}
                                            />
                                        </div>

                                        {/* Right: Usage Stats */}
                                        <div className="usage-stats-right">
                                            <div className="usage-title">
                                                <Sparkles size={20} color="#fbbf24" />
                                                <span>Usage Statistics</span>
                                            </div>

                                            {/* Storage Usage */}
                                            <div className="usage-item">
                                                <div className="usage-header">
                                                    <span>
                                                        <Database size={14} style={{ marginRight: 6, opacity: 0.7 }} />
                                                        Storage Used
                                                    </span>
                                                    <span style={{ color: '#fff', fontWeight: 600 }}>
                                                        {currentSub.usage.storage_used_formatted || "0 B"}
                                                    </span>
                                                </div>
                                                <div className="progress-bar-bg">
                                                    {/* Arbitrary scale for now, say 1GB max for visual context if not defined */}
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{
                                                            width: `${Math.min(((currentSub.usage.storage_used_bytes || 0) / (1024 * 1024 * 100)) * 100, 100)}%`, // visual scale based on 100MB for demo
                                                            background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* API Keys */}
                                            <div className="usage-item">
                                                <div className="usage-header">
                                                    <span>
                                                        <Key size={14} style={{ marginRight: 6, opacity: 0.7 }} />
                                                        Active API Keys
                                                    </span>
                                                    <span>
                                                        <span style={{ color: '#fff', fontWeight: 600 }}>{currentSub.usage.active_api_keys || 0}</span>
                                                        <span className="usage-limit"> / {currentSub.usage.max_api_keys === -1 ? '∞' : currentSub.usage.max_api_keys}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Team Members */}
                                            <div className="usage-item">
                                                <div className="usage-header">
                                                    <span>
                                                        <Users size={14} style={{ marginRight: 6, opacity: 0.7 }} />
                                                        Team Seats
                                                    </span>
                                                    <span>
                                                        <span style={{ color: '#fff', fontWeight: 600 }}>{currentSub.usage.team_members || 1}</span>
                                                        <span className="usage-limit"> / {currentSub.usage.max_team_members === -1 ? '∞' : currentSub.usage.max_team_members}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Tech Specs Badge Area */}
                                            {currentSub.tech_specs && (
                                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Powering Your AI
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
                                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Model Precision</div>
                                                            <div style={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>{currentSub.tech_specs.vector_dimensions}-dim</div>
                                                        </div>
                                                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
                                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Analytics</div>
                                                            <div style={{ color: currentSub.tech_specs.analytics_enabled ? '#34d399' : '#9ca3af', fontWeight: 500, fontSize: '0.9rem' }}>
                                                                {currentSub.tech_specs.analytics_enabled ? 'Active' : 'Disabled'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                                                        Renews on {currentSub.usage.renews_at}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Upgrade Options Title */}
                                {/* Only show if there are other plans */}
                                <div className="upgrade-section-title">
                                    Available Upgrades
                                </div>

                                {/* Tier Cards (Filtered or All?) - Showing all for now, maybe highlight current differently or hide it */}
                                <div className="tier-cards-container">
                                    {Object.entries(tiers).map(([tierId, tier]) => {
                                        // Optional: Don't show current tier in upgrade list?
                                        // User request: "only need to show information about the ALREADY SUBSCRIBED tier... example if Standard then all details... along with the card"
                                        // "Add scroll option to display upgrade tier option"
                                        // So we should probably show ALL cards in the scroll section, but maybe disable the current one button?
                                        const isCurrent = currentSub.subscription_tier === tierId;

                                        return (
                                            <TierCard
                                                key={tierId}
                                                tierId={tierId}
                                                tierName={tier.name}
                                                price={tier.price_display}
                                                description={tier.description}
                                                isPopular={tierId === 'professional'}
                                                isSelected={selectedTierId === tierId}
                                                onSelect={handleTierSelect}
                                                // If it's the current plan, maybe change button text?
                                                currentPlan={isCurrent}
                                                features={[
                                                    {
                                                        text: tier.max_documents === -1
                                                            ? 'Unlimited Documents'
                                                            : `${tier.max_documents} Documents`,
                                                        enabled: true
                                                    },
                                                    {
                                                        text: tier.max_queries_per_month === -1
                                                            ? 'Unlimited Queries'
                                                            : `${tier.max_queries_per_month.toLocaleString()} Queries/month`,
                                                        enabled: true
                                                    },
                                                    {
                                                        text: 'Advanced Analytics',
                                                        enabled: tier.analytics_enabled
                                                    },
                                                    {
                                                        text: 'Custom Branding',
                                                        enabled: tier.custom_branding
                                                    },
                                                    {
                                                        text: 'Priority Support',
                                                        enabled: tier.priority_support
                                                    }
                                                ]}
                                                behindGlowColor={
                                                    tierId === 'enterprise'
                                                        ? 'rgba(167, 139, 250, 0.67)'
                                                        : tierId === 'professional'
                                                            ? 'rgba(16, 185, 129, 0.67)'
                                                            : 'rgba(59, 130, 246, 0.67)'
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            /* GUEST VIEW: Original Layout */
                            !showOnboarding && (loadingTiers ? (
                                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.6)' }}>
                                    Loading plans...
                                </div>
                            ) : (
                                <div className="tier-cards-container">
                                    {Object.entries(tiers).map(([tierId, tier]) => (
                                        <TierCard
                                            key={tierId}
                                            tierId={tierId}
                                            tierName={tier.name}
                                            price={tier.price_display}
                                            description={tier.description}
                                            isPopular={tierId === 'professional'}
                                            isSelected={selectedTierId === tierId}
                                            onSelect={handleTierSelect}
                                            features={[
                                                {
                                                    text: tier.max_documents === -1
                                                        ? 'Unlimited Documents'
                                                        : `${tier.max_documents} Documents`,
                                                    enabled: true
                                                },
                                                {
                                                    text: tier.max_queries_per_month === -1
                                                        ? 'Unlimited Queries'
                                                        : `${tier.max_queries_per_month.toLocaleString()} Queries/month`,
                                                    enabled: true
                                                },
                                                {
                                                    text: 'Advanced Analytics',
                                                    enabled: tier.analytics_enabled
                                                },
                                                {
                                                    text: 'Custom Branding',
                                                    enabled: tier.custom_branding
                                                },
                                                {
                                                    text: 'Priority Support',
                                                    enabled: tier.priority_support
                                                }
                                            ]}
                                            behindGlowColor={
                                                tierId === 'enterprise'
                                                    ? 'rgba(167, 139, 250, 0.67)'
                                                    : tierId === 'professional'
                                                        ? 'rgba(16, 185, 129, 0.67)'
                                                        : 'rgba(59, 130, 246, 0.67)'
                                            }
                                        />
                                    ))}
                                </div>
                            ))
                        )}

                        {recommendedTier && !showOnboarding && (
                            <div style={{ textAlign: 'center', marginTop: '30px', paddingBottom: '20px' }}>
                                <div className="recommendation-badge" style={{ display: 'inline-flex' }}>
                                    <Target className="recommendation-icon" size={20} />
                                    <span className="recommendation-text">
                                        Based on your needs, we recommend <strong>{tiers[recommendedTier]?.name}</strong>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Project Quote */}
                        {!showOnboarding && (
                            <div className="footer-quote" style={{
                                textAlign: 'center',
                                marginTop: recommendedTier ? '10px' : '30px', /* Pulled up */
                                marginBottom: '60px', /* Increased bottom spacing */
                                padding: '0 20px',
                                opacity: 0.6,
                                transition: 'all 0.5s ease'
                            }}>
                                <p style={{
                                    fontStyle: 'italic',
                                    fontSize: '1.1rem',
                                    fontFamily: 'serif',
                                    color: 'rgba(255,255,255,0.6)',
                                    maxWidth: '600px',
                                    margin: '0 auto',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                                    padding: '20px',
                                    borderRadius: '16px',
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    "The goal is to turn data into information, and information into insight."
                                </p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'quick-start' && (
                    <div className="content-section" style={{ padding: '0 40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                        <h1 className="tier-dashboard-title" style={{ marginBottom: 10 }}>Quick Start Guide</h1>
                        <p className="tier-dashboard-subtitle" style={{ marginBottom: 40 }}>Get up and running with CORPWISE in minutes</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 24 }}>
                            {/* Step 1 */}
                            <div className="tier-card" style={{ padding: 32, height: 'auto', background: 'rgba(255, 255, 255, 0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: 16 }}>1</div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', margin: 0 }}>Get Your API Key</h3>
                                </div>
                                <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 20, lineHeight: 1.6 }}>
                                    To integrate the chatbot, you need a unique API key for your organization.
                                </p>
                                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: 20, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <ol style={{ margin: 0, paddingLeft: 20, color: 'rgba(255, 255, 255, 0.8)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <li>Log in to your <strong>Dashboard</strong>.</li>
                                        <li>Navigate to <strong>Settings &gt; API Keys</strong>.</li>
                                        <li>Click <strong>"Generate New Key"</strong>.</li>
                                        <li>Copy the key immediately (it won't be shown again).</li>
                                    </ol>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="tier-card" style={{ padding: 32, height: 'auto', background: 'rgba(255, 255, 255, 0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: 16 }}>2</div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', margin: 0 }}>Embed the Widget</h3>
                                </div>
                                <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 20, lineHeight: 1.6 }}>
                                    Copy the following code and paste it before the closing <code>&lt;/body&gt;</code> tag of your website.
                                </p>
                                <div style={{ position: 'relative' }}>
                                    <pre style={{ background: '#1e293b', padding: 24, borderRadius: 8, overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                        {`<script 
  src="https://cdn.corpwise.ai/widget.v1.js" 
  data-api-key="YOUR_API_KEY_HERE"
  data-company-id="YOUR_COMPANY_ID"
></script>`}
                                    </pre>
                                    <button
                                        style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: 4, padding: '4px 8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                                        onClick={() => navigator.clipboard.writeText('<script src="https://cdn.corpwise.ai/widget.v1.js" data-api-key="YOUR_API_KEY_HERE" data-company-id="YOUR_COMPANY_ID"></script>')}
                                    >
                                        <Copy size={14} /> Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="content-section" style={{ padding: '0 40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                        <h1 className="tier-dashboard-title" style={{ marginBottom: 10 }}>Documentation</h1>
                        <p className="tier-dashboard-subtitle" style={{ marginBottom: 40 }}>Everything you need to build with CORPWISE</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                            <div className="tier-card" style={{ padding: 32, height: 'auto', background: 'rgba(255, 255, 255, 0.03)', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => window.open('https://docs.corpwise.ai', '_blank')}>
                                <BookOpen size={32} color="#60a5fa" style={{ marginBottom: 20 }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: 10 }}>Official Documentation</h3>
                                <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 20 }}>Comprehensive guides, tutorials, and concepts.</p>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#60a5fa', fontSize: '0.9rem', fontWeight: 500 }}>
                                    Read Docs <ExternalLink size={14} style={{ marginLeft: 6 }} />
                                </div>
                            </div>

                            <div className="tier-card" style={{ padding: 32, height: 'auto', background: 'rgba(255, 255, 255, 0.03)', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => window.open('https://api.corpwise.ai', '_blank')}>
                                <Terminal size={32} color="#f472b6" style={{ marginBottom: 20 }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: 10 }}>API Reference</h3>
                                <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 20 }}>Detailed API endpoints, parameters, and response types.</p>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#f472b6', fontSize: '0.9rem', fontWeight: 500 }}>
                                    View Reference <ExternalLink size={14} style={{ marginLeft: 6 }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 40, padding: 32, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 16 }}>Need Help?</h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 0 }}>
                                Contact our support team at <a href="mailto:support@corpwise.ai" style={{ color: '#60a5fa', textDecoration: 'none' }}>support@corpwise.ai</a> for assistance with integration or billing.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Auth Modal */}
            {
                showAuthModal && (
                    <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
                        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="auth-modal-header">
                                <h2 className="auth-modal-title">
                                    {authMode === 'register' ? 'Create Your Account' : 'Welcome Back'}
                                </h2>
                                {selectedTierId && authMode === 'register' && (
                                    <div className="auth-modal-selected-tier">
                                        {tiers[selectedTierId]?.name} Plan Selected
                                    </div>
                                )}
                            </div>

                            {/* Toggle Register/Login */}
                            <div className="auth-toggle">
                                <button
                                    className={`auth-toggle-btn ${authMode === 'register' ? 'active' : ''}`}
                                    onClick={() => setAuthMode('register')}
                                >
                                    Register
                                </button>
                                <button
                                    className={`auth-toggle-btn ${authMode === 'login' ? 'active' : ''}`}
                                    onClick={() => setAuthMode('login')}
                                >
                                    Login
                                </button>
                            </div>

                            {error && (
                                <div style={{
                                    padding: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    fontSize: '0.9rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleAuthSubmit}>
                                {authMode === 'register' && (
                                    <input
                                        type="text"
                                        placeholder="Company Name (e.g. Acme Corp)"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="auth-input"
                                        style={{ marginBottom: '16px' }}
                                    />
                                )}

                                <input
                                    type="text"
                                    placeholder="Workspace ID (e.g. acmecorp)"
                                    value={companyId}
                                    onChange={(e) => setCompanyId(e.target.value.toLowerCase())}
                                    className="auth-input"
                                    required
                                    pattern="^[a-z0-9\-]+$"
                                    title="Alphanumeric characters only"
                                    style={{ marginBottom: '16px' }}
                                />

                                <input
                                    type="text"
                                    placeholder="Admin Username"
                                    value={adminUsername}
                                    onChange={(e) => setAdminUsername(e.target.value)}
                                    className="auth-input"
                                    required
                                    style={{ marginBottom: '16px' }}
                                />

                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="auth-input"
                                    required
                                    minLength={6}
                                    style={{ marginBottom: '24px' }}
                                />

                                <button
                                    type="submit"
                                    className="auth-btn-primary"
                                    disabled={loading}
                                    style={{ width: '100%' }}
                                >
                                    {loading
                                        ? (authMode === 'register' ? 'Creating Account...' : 'Logging in...')
                                        : (authMode === 'register' ? 'Create Account' : 'Login')
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Success Modal */}
            {
                showSuccessModal && (
                    <div className="auth-modal-overlay">
                        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Success!</h2>
                            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px', lineHeight: '1.5' }}>
                                {successMessage}
                            </p>
                            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '16px' }}>
                                Redirecting you to dashboard...
                            </p>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
