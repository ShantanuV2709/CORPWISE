import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminAuth } from '../../auth/components/AdminAuth';
import LightRays from '../../../components/LightRays';
import toast from 'react-hot-toast';

export function AdminLoginPage() {
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 200); // reduced from 800ms
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 10%, #1e1e24, #000)'
        }}>
            {/* Background elements */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 1s ease-out'
            }}>
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
                    className="custom-rays"
                    pulsating={false}
                    fadeDistance={1}
                    saturation={1}
                />
            </div>

            <div style={{
                position: 'fixed',
                top: '42%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0,
                pointerEvents: 'none',
                fontSize: '12rem',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.10)',
                letterSpacing: '0.2em',
                userSelect: 'none',
                filter: isLoaded ? 'blur(0px)' : 'blur(20px)',
                opacity: isLoaded ? 1 : 0,
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                CORPWISE
            </div>

            {/* Admin Login Component */}
            <div style={{
                zIndex: 10,
                width: '100%',
                maxWidth: '420px',
                padding: '20px',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(40px)',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.2s' // 1.2s delay to wait for text
            }}>
                <AdminAuth
                    embedded={true}
                    onAuthenticated={(companyId, isNewUser) => {
                        localStorage.setItem('admin_company_id', companyId);
                        toast.success('Welcome Back!', { position: 'bottom-center' });
                        if (isNewUser) {
                            navigate('/onboarding');
                        } else {
                            navigate('/admin/overview');
                        }
                    }}
                    onSuperAdmin={(token) => {
                        localStorage.setItem('super_admin_token', token);
                        toast.success('Super Admin Authenticated');
                        navigate('/super-admin');
                    }}
                    onBack={() => navigate('/')}
                />
            </div>
        </div>
    );
}
