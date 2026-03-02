import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import LightRays from './LightRays';
import { adminLogin, adminSignup, googleAdminLogin } from '../api/auth';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import toast from 'react-hot-toast';
import './AuthSheet.css';

interface AuthSheetProps {
    isOpen: boolean;
    onClose: () => void;
    defaultMode?: 'login' | 'register';
    onAuthenticated: (companyId: string, isNewUser: boolean) => void;
    onSuperAdmin?: (token: string) => void;
    selectedTierId?: string | null;
}

const FEATURES = [
    { label: 'Zero-Trust Security', sub: 'Cryptographic tenant isolation' },
    { label: 'Multi-Dim Embeddings', sub: '1024-dim enterprise vector search' },
    { label: 'Instant Deployment', sub: 'Upload docs, ship a widget in minutes' },
    { label: 'Usage Analytics', sub: 'Real-time queries, tokens and costs' },
];

export function AuthSheet({
    isOpen,
    onClose,
    defaultMode = 'register',
    onAuthenticated,
    onSuperAdmin,
    selectedTierId = null,
}: AuthSheetProps) {
    const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
    const [isLoaded, setIsLoaded] = useState(false);

    // Form state
    const [companyName, setCompanyName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Sync mode when sheet opens with a different default
    useEffect(() => {
        if (isOpen) {
            setMode(defaultMode);
            setError('');
            // Small delay so CSS transition fires properly
            setTimeout(() => setIsLoaded(true), 50);
        } else {
            setIsLoaded(false);
            // Reset form on close
            setCompanyName('');
            setCompanyId('');
            setUsername('');
            setPassword('');
            setError('');
        }
    }, [isOpen, defaultMode]);

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return;

        setError('');
        setLoading(true);

        try {
            const data = await googleAdminLogin(
                credentialResponse.credential,
                companyId ? companyId : undefined
            );

            console.log("Admin Google Login Response:", data);

            if (data.is_admin) {
                localStorage.setItem('admin_company_id', data.company_id);
                if (data.access_token) {
                    localStorage.setItem('admin_access_token', data.access_token);
                }
                toast.success('Google Authentication Successful', { position: 'bottom-center' });
                onAuthenticated(data.company_id, data.is_new_user);
                onClose();
            } else {
                throw new Error("Logged in, but not recognized as an Admin");
            }

        } catch (err: any) {
            setError(err.message || "Google Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                if (!companyId || !username || !password) {
                    throw new Error("Workspace ID, Username, and Password are required for Registration");
                }
                const tier = selectedTierId || 'starter';
                const data = await adminSignup(username, password, companyId, tier);
                localStorage.setItem('admin_company_id', data.company_id);
                if (data.access_token) {
                    localStorage.setItem('admin_access_token', data.access_token);
                }
                toast.success('Account created! Welcome to CORPWISE.', { position: 'bottom-center' });
                onAuthenticated(data.company_id, true);
            } else {
                if (!companyId || !username || !password) {
                    throw new Error("Workspace ID, Username, and Password are required to sign in manually.");
                }
                const data = await adminLogin(username, password, companyId);

                // Super-admin path
                if (data.is_super_admin && onSuperAdmin) {
                    localStorage.setItem('super_admin_token', data.access_token);
                    toast.success('Super Admin authenticated');
                    onSuperAdmin(data.access_token);
                    return;
                }

                if (data.company_id.toLowerCase() !== companyId.toLowerCase() && data.company_id !== 'GLOBAL') {
                    throw new Error('User does not belong to this workspace');
                }

                localStorage.setItem('admin_company_id', data.company_id);
                if (data.access_token) {
                    localStorage.setItem('admin_access_token', data.access_token);
                }
                toast.success('Welcome back!', { position: 'bottom-center' });
                onAuthenticated(data.company_id, false);
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`auth-sheet-overlay ${isLoaded ? 'loaded' : ''}`} onClick={onClose}>
            <div className="auth-sheet" onClick={(e) => e.stopPropagation()}>

                {/* ─── LEFT PANEL — Form ─── */}
                <div className="auth-sheet-left">
                    {/* Close button */}
                    <button className="auth-sheet-close" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>

                    <div className="auth-sheet-form-wrap">
                        {/* Logo */}
                        <div className="auth-sheet-brand">CORPWISE</div>
                        <p className="auth-sheet-tagline">Enterprise AI Platform</p>

                        {/* Pill Tab Toggle */}
                        <div className="auth-tab-toggle">
                            <div
                                className="auth-tab-pill"
                                style={{ transform: mode === 'register' ? 'translateX(0)' : 'translateX(100%)' }}
                            />
                            <button
                                className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
                                onClick={() => { setMode('register'); setError(''); }}
                                type="button"
                            >
                                Register
                            </button>
                            <button
                                className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
                                onClick={() => { setMode('login'); setError(''); }}
                                type="button"
                            >
                                Sign In
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="auth-error">
                                <span>&#x26A0;</span> {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="auth-form">
                            {mode === 'register' && (
                                <input
                                    type="text"
                                    placeholder="Company Name"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="auth-field"
                                    required
                                    autoComplete="organization"
                                />
                            )}

                            <input
                                type="text"
                                placeholder={mode === 'register' ? 'Workspace ID  (e.g. acmecorp)' : 'Workspace ID'}
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                className="auth-field"
                                autoComplete="username"
                            />

                            <input
                                type="text"
                                placeholder="Admin Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="auth-field"
                                autoComplete="nickname"
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="auth-field"
                                minLength={6}
                                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                            />

                            <button
                                type="submit"
                                className="auth-submit-btn"
                                disabled={loading}
                            >
                                {loading
                                    ? (mode === 'register' ? 'Creating account...' : 'Signing in...')
                                    : (mode === 'register' ? 'Create Account' : 'Sign In')
                                }
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '8px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <GoogleLogin
                                    theme="filled_black"
                                    onSuccess={handleGoogleLogin}
                                    onError={() => setError("Google Login Failed")}
                                />
                            </div>

                        </form>

                        {/* Features */}
                        <div className="auth-features">
                            {FEATURES.map((f) => (
                                <div key={f.label} className="auth-feature-item">
                                    <div className="auth-feature-dot" />
                                    <div>
                                        <div className="auth-feature-label">{f.label}</div>
                                        <div className="auth-feature-sub">{f.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT PANEL — Cinematic ─── */}
                <div className="auth-sheet-right">
                    {/* LightRays WebGL background */}
                    <div className="auth-rays-container">
                        <LightRays
                            raysOrigin="top-center"
                            raysColor="#ffffff"
                            raysSpeed={1}
                            lightSpread={0.5}
                            rayLength={3}
                            followMouse={true}
                            mouseInfluence={0.1}
                            noiseAmount={0}
                            distortion={0}
                            pulsating={false}
                            fadeDistance={1}
                            saturation={1}
                        />
                    </div>

                    {/* Stacked CORP / WISE text */}
                    <div className={`auth-brand-stack ${isLoaded ? 'visible' : ''}`}>
                        <span className="auth-brand-corp">CORP</span>
                        <span className="auth-brand-wise">WISE.</span>
                    </div>

                    {/* Minimal tagline */}
                    <div className={`auth-right-tagline ${isLoaded ? 'visible' : ''}`}>
                        Your Private Enterprise AI Brain
                    </div>
                </div>
            </div>
        </div>
    );
}
