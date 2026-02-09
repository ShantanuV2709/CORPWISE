import React from "react";
import { useNavigate } from "react-router-dom";
import DecryptedText from "../components/DecryptedText";
import BlurText from "../components/BlurText";
import { UserAuth } from "../components/UserAuth";
import { AdminAuth } from "../components/AdminAuth";
import { CompanyRegistration } from "../components/CompanyRegistration";
import { SuperAdminDashboard } from "../components/SuperAdminDashboard";

export function RoleSelection() {
    const navigate = useNavigate();
    const [showEmployeeLogin, setShowEmployeeLogin] = React.useState(false);
    const [showAdminLogin, setShowAdminLogin] = React.useState(false); // New state for admin auth visibility
    const [showRegister, setShowRegister] = React.useState(false);
    const [superAdminToken, setSuperAdminToken] = React.useState<string | null>(null); // Super Admin state
    const [registrationSuccess, setRegistrationSuccess] = React.useState(false); // Registration success flag

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
            {/* Try Demo Button - Top Left */}
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
                    zIndex: 10
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

            {/* Blur Text Background - Behind Everything */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0,
                pointerEvents: 'none',
                fontSize: '12rem',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.15)',
                letterSpacing: '0.2em',
                userSelect: 'none'
            }}>
                <BlurText
                    text="CORPWISE"
                    delay={150}
                    animateBy="words"
                    direction="top"
                />
            </div>



            {/* Subtitle Section */}
            <div style={{
                textAlign: 'center',
                marginBottom: '80px',
                zIndex: 1
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
                    gap: '32px',
                    alignItems: 'stretch', // Ensure cards are same height
                    justifyContent: 'center',
                    zIndex: 1,
                    flexWrap: 'wrap',
                    maxWidth: '1200px', // Allow more width
                    width: '100%',
                    padding: '20px'
                }}>
                    {/* Choose Your Plan Card */}
                    <button
                        onClick={() => navigate('/choose-plan')}
                        className="role-btn user"
                        style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15))',
                            border: '2px solid rgba(59, 130, 246, 0.3)',
                            transform: 'scale(1)',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)',
                            padding: '32px',
                            minWidth: '280px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
                        }}
                    >
                        <div className="role-icon">
                            <img
                                src="/target-icon.png"
                                alt="Choose Plan"
                                style={{
                                    width: '72px',
                                    height: '72px',
                                    filter: 'brightness(0) invert(1)'
                                }}
                            />
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
                        style={{
                            backdropFilter: 'blur(10px)',
                            padding: '32px',
                            minWidth: '280px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
                        }}
                    >
                        <div className="role-icon">
                            <img
                                src="/lock-icon.png"
                                alt="Admin Login"
                                style={{
                                    width: '72px',
                                    height: '72px',
                                    filter: 'brightness(0) invert(1)'
                                }}
                            />
                        </div>
                        <div className="role-info">
                            <h3>Existing Admin Login</h3>
                            <span>Access your workspace</span>
                        </div>
                    </button>
                </div>
            ) : showAdminLogin ? (
                <div style={{ zIndex: 1, maxWidth: '500px', width: '100%' }}>
                    <AdminAuth
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
