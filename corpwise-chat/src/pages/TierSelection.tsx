import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TierCard } from '../components/TierCard';
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

    useEffect(() => {
        loadTiers();
    }, []);

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

    const handleTierSelect = (tierId: string) => {
        setSelectedTierId(tierId);
        setAuthMode('register');
        setShowAuthModal(true);
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let userCompanyId = companyId;

            if (authMode === 'register') {
                if (!selectedTierId) {
                    setError('Please select a tier first');
                    return;
                }
                const data = await adminSignup(adminUsername, password, companyId, selectedTierId);
                userCompanyId = data.company_id;
                setSuccessMessage(`Welcome to CORPWISE! Your ${tiers[selectedTierId]?.name || 'new'} plan is active.`);
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
                        setSuccessMessage(`Welcome back! You are currently on the ${data.subscription_tier} plan. (Update failed)`);
                    }
                } else {
                    setSuccessMessage(`Welcome back! Redirecting to your dashboard...`);
                }
            }

            localStorage.setItem('admin_company_id', userCompanyId);
            setShowAuthModal(false);
            setShowSuccessModal(true);

            // Auto-redirect after delay
            setTimeout(() => {
                navigate('/admin');
            }, 3000);

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
            <div className="side-panel">
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
                <div className="header-actions">
                    <button
                        className="header-btn header-btn-secondary"
                        onClick={() => navigate('/')}
                        style={{ marginRight: 'auto' }}
                    >
                        ← Back
                    </button>
                    <button
                        className="header-btn header-btn-secondary"
                        onClick={() => openAuthModal('login')}
                    >
                        Login
                    </button>
                    <button
                        className="header-btn header-btn-primary"
                        onClick={() => openAuthModal('register')}
                    >
                        Get Started
                    </button>
                </div>

                {/* Dashboard Header */}
                <div className="tier-dashboard-header">
                    <h1 className="tier-dashboard-title">Choose Your Plan</h1>
                    <p className="tier-dashboard-subtitle">
                        Select the perfect subscription tier for your organization
                    </p>
                </div>

                {/* Tier Cards */}
                {loadingTiers ? (
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
                )}
            </div>

            {/* Auth Modal */}
            {showAuthModal && (
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
            )}

            {/* Success Modal */}
            {showSuccessModal && (
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
            )}
        </div>
    );
}
