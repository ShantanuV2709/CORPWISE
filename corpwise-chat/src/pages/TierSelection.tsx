import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Sparkles, Lightbulb } from 'lucide-react';
import { TierCard } from '../components/TierCard';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { fetchSubscriptionTiers, updateSubscriptionTier, type SubscriptionTier } from '../api/subscription';
import { adminSignup, adminLogin } from '../api/auth';
import './TierSelection.css';




export function TierSelection() {
    const navigate = useNavigate();
    const [tiers, setTiers] = useState<Record<string, SubscriptionTier>>({});
    const [loadingTiers, setLoadingTiers] = useState(true);
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
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

    useEffect(() => {
        loadTiers();
        checkLoginStatus();
    }, []);

    const checkLoginStatus = () => {
        const storedCompanyId = localStorage.getItem('admin_company_id');
        if (storedCompanyId) {
            setIsLoggedIn(true);
            setCompanyId(storedCompanyId); // Pre-fill for convenience
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
                // Optionally redirect to dashboard after a delay
                setTimeout(() => setShowSuccessModal(false), 2000);
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
                    <div className="side-panel-item active">
                        <span>Choose Your Plan</span>
                    </div>
                    <div className="side-panel-item">
                        <span>Quick Start</span>
                        <span className="side-panel-arrow">›</span>
                    </div>
                    <div className="side-panel-item">
                        <span>Video Tutorials</span>
                        <span className="side-panel-arrow">›</span>
                    </div>
                </div>

                <div className="side-panel-section">
                    <div className="side-panel-section-title">Using the App</div>
                    <div className="side-panel-item">
                        <span>Upload Documents</span>
                        <span className="side-panel-arrow">›</span>
                    </div>
                    <div className="side-panel-item">
                        <span>Manage Team</span>
                        <span className="side-panel-arrow">›</span>
                    </div>
                    <div className="side-panel-item">
                        <span>Embed Widget</span>
                        <span className="side-panel-arrow">›</span>
                    </div>
                </div>

                <div className="side-panel-section">
                    <div className="side-panel-section-title">Resources</div>
                    <div className="side-panel-item">
                        <span>Documentation</span>
                        <span className="side-panel-arrow">›</span>
                    </div>
                    <div className="side-panel-item">
                        <span>API Reference</span>
                        <span className="side-panel-arrow">›</span>
                    </div>
                    <div className="side-panel-item">
                        <span>Support</span>
                        <span className="side-panel-arrow">›</span>
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
                            className="header-btn header-btn-secondary"
                            onClick={() => navigate('/')}
                            style={{
                                background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.05) 100%)',
                                borderColor: 'rgba(96, 165, 250, 0.4)',
                                color: '#60a5fa'
                            }}
                        >
                            ← Back
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

                {/* Dashboard Header */}
                <div className="tier-dashboard-header">
                    <h1 className="tier-dashboard-title">Choose Your Plan</h1>
                    <p className="tier-dashboard-subtitle">
                        Select the perfect subscription tier for your organization
                    </p>
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

                {/* Tier Cards */}
                {!showOnboarding && (loadingTiers ? (
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
                ))}



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
                            fontFamily: 'serif',
                            fontStyle: 'italic',
                            fontSize: '1.1rem',
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
