import React from "react";
import { useNavigate } from "react-router-dom";
import { Target, Lock } from "lucide-react";
import DecryptedText from "../components/DecryptedText";
import BlurText from "../components/BlurText";
import { UserAuth } from "../components/UserAuth";
import { AdminAuth } from "../components/AdminAuth";
import { CompanyRegistration } from "../components/CompanyRegistration";
import { SuperAdminDashboard } from "../components/SuperAdminDashboard";
import LightRays from "../components/LightRays";

export function RoleSelection() {
    const navigate = useNavigate();
    const [showEmployeeLogin, setShowEmployeeLogin] = React.useState(false);
    const [showAdminLogin, setShowAdminLogin] = React.useState(false); // New state for admin auth visibility
    const [showRegister, setShowRegister] = React.useState(false);
    const [superAdminToken, setSuperAdminToken] = React.useState<string | null>(null); // Super Admin state
    const [registrationSuccess, setRegistrationSuccess] = React.useState(false); // Registration success flag

    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
        // Reduced delay to 800ms for a snappier "flow"
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const handleAuthenticated = (username: string, companyId: string) => {
        // Save to localStorage so useChat hook picks it up
        localStorage.setItem("app_user_id", username); // Use username as ID for checks
        localStorage.setItem("app_company_id", companyId); // Save company ID context
        navigate("/chat");
    };

    const handleRegistrationSuccess = (username: string, companyId: string) => {
        // Show success message and return to role selection
        setShowRegister(false);
        setRegistrationSuccess(true);
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            setRegistrationSuccess(false);
        }, 5000);
    };

    if (superAdminToken) {
        return <SuperAdminDashboard token={superAdminToken} onLogout={() => setSuperAdminToken(null)} />;
    }

    return (
        <div className="role-selection-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* LightRays Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none'
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

            {/* Try Demo Button - Top Left */}
            <div style={{
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.8s ease',
                zIndex: 10
            }}>
                <button
                    onClick={() => navigate('/demo')}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        left: '24px',
                        padding: '10px 20px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                >
                    Try Demo
                </button>
            </div>

            {/* Blur Text Background - Behind Everything */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0, // Same layer as lights, but handled by order
                pointerEvents: 'none',
                fontSize: '12rem',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.15)',
                letterSpacing: '0.2em',
                userSelect: 'none'
            }}>
                <BlurText
                    text="CORPWISE"
                    delay={50} // Faster text animation
                    animateBy="words"
                    direction="top"
                />
            </div>



            {/* Subtitle Section */}
            {!showAdminLogin && !showRegister && !showEmployeeLogin && (
                <div style={{
                    textAlign: 'center',
                    marginBottom: '80px',
                    zIndex: 1,
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'opacity 0.8s ease, transform 0.8s ease'
                    /* No delay, appears immediately with isLoaded */
                }}>
                    <p style={{
                        fontSize: '1.3rem',
                        fontWeight: 500,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '0.05em',
                        maxWidth: '700px',
                        margin: '0 auto',
                        padding: '0 20px'
                    }}>
                        Secure Enterprise Knowledge Assistant
                    </p>
                    <div style={{
                        width: '80px',
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8), transparent)',
                        margin: '24px auto 0',
                        borderRadius: '2px'
                    }} />
                </div>
            )}
            {/* Registration Success Message */}
            {registrationSuccess && (
                <div style={{
                    padding: "12px 24px",
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    borderRadius: "12px",
                    color: "#22c55e",
                    marginBottom: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    zIndex: 1
                }}>
                    <span style={{ fontSize: "1.2rem" }}>✓</span>
                    <span>Registration Complete! Please log in to access the Admin Portal.</span>
                </div>
            )}

            {/* Role Selection Cards */}
            {!showAdminLogin && !showRegister && !showEmployeeLogin ? (
                <div style={{
                    display: 'flex',
                    gap: '40px', /* Increased gap */
                    alignItems: 'stretch',
                    justifyContent: 'center',
                    zIndex: 1,
                    flexWrap: 'wrap',
                    maxWidth: '1200px',
                    width: '100%',
                    padding: '20px',
                    perspective: '1000px', /* For 3D feel */
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s'
                    /* 200ms delay after subtitle */
                }}>
                    {/* Choose Your Plan Card */}
                    <button
                        onClick={() => navigate('/choose-plan')}
                        className="role-btn user"
                    /* Inline styles removed */
                    >
                        <div className="role-icon">
                            <Target size={64} strokeWidth={1.5} color="white" />
                        </div>
                        <div className="role-info">
                            <h3>Choose Your Plan</h3>
                            <span>Get started with CORPWISE</span>
                        </div>
                    </button>

                    {/* Existing Admin Login Card */}
                    <button
                        onClick={() => setShowAdminLogin(true)}
                        className="role-btn admin"
                    >
                        <div className="role-icon">
                            <Lock size={64} strokeWidth={1.5} color="white" />
                        </div>
                        <div className="role-info">
                            <h3>Existing Admin Login</h3>
                            <span>Access your workspace</span>
                        </div>
                    </button>
                </div>
            ) : showAdminLogin ? (
                <div style={{
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '500px',
                    padding: '20px',
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s'
                }}>
                    <AdminAuth
                        embedded={true}
                        onAuthenticated={(companyId) => {
                            localStorage.setItem("admin_company_id", companyId);
                            navigate("/admin");
                        }}
                        onBack={() => setShowAdminLogin(false)}
                        onSuperAdmin={(token) => setSuperAdminToken(token)}

                    />
                </div>
            ) : showRegister ? (
                <div style={{ zIndex: 1, maxWidth: '500px', width: '100%' }}>
                    <CompanyRegistration
                        onRegistered={handleRegistrationSuccess}
                        onBack={() => setShowRegister(false)}

                    />
                </div>
            ) : (
                <div style={{ zIndex: 1, maxWidth: '500px', width: '100%' }}>
                    <UserAuth
                        onAuthenticated={handleAuthenticated}
                        onBack={() => setShowEmployeeLogin(false)}

                    />
                </div>
            )
            }
        </div >
    );
}
