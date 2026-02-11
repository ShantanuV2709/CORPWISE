import React, { useState } from 'react';
import { FileText, Globe, Target, Building2, Sparkles, Check } from 'lucide-react';
import Stepper, { Step } from './Stepper';
import './OnboardingStepper.css';

interface OnboardingData {
    documentTypes: string[];
    languages: number;
    complexity: string;
    companySize: string;
}

interface OnboardingStepperProps {
    onComplete: (data: OnboardingData, recommendedTier: string) => void;
}

export function OnboardingStepper({ onComplete }: OnboardingStepperProps) {
    const [documentTypes, setDocumentTypes] = useState<string[]>([]);
    const [languages, setLanguages] = useState<number>(1);
    const [complexity, setComplexity] = useState<string>('');
    const [companySize, setCompanySize] = useState<string>('');

    const handleDocTypeToggle = (type: string) => {
        setDocumentTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const calculateRecommendation = (): string => {
        let score = 0;

        // Document type scoring
        if (documentTypes.includes('technical') || documentTypes.includes('specialized')) score += 2;
        if (documentTypes.includes('mixed')) score += 1;

        // Language scoring
        if (languages >= 5) score += 2;
        else if (languages >= 2) score += 1;

        // Complexity scoring
        if (complexity === 'specialized') score += 2;
        else if (complexity === 'technical') score += 1;

        // Company size scoring
        if (['201-500', '500+'].includes(companySize)) score += 1;

        // Recommend tier based on score
        if (score >= 5) return 'enterprise';
        if (score >= 2) return 'professional';
        return 'starter';
    };

    const handleComplete = () => {
        const recommendedTier = calculateRecommendation();
        const data: OnboardingData = {
            documentTypes,
            languages,
            complexity,
            companySize
        };
        onComplete(data, recommendedTier);
    };

    return (
        <div className="onboarding-container">
            <Stepper
                initialStep={1}
                onFinalStepCompleted={handleComplete}
                backButtonText="Previous"
                nextButtonText="Continue"
            >
                {/* Step 1: Welcome */}
                <Step>
                    <div className="onboarding-step">
                        <div className="step-icon-wrapper">
                            <Sparkles className="step-icon" size={48} />
                        </div>
                        <h2>Welcome to CORPWISE</h2>
                        <p>Let's find the perfect AI intelligence tier for your organization.</p>
                        <p className="step-subtitle">
                            Answer a few quick questions to get a personalized recommendation.
                        </p>
                    </div>
                </Step>

                {/* Step 2: Document Types */}
                <Step>
                    <div className="onboarding-step">
                        <div className="step-icon-wrapper">
                            <FileText className="step-icon" size={48} />
                        </div>
                        <h2>What types of documents will you upload?</h2>
                        <p>Select all that apply</p>

                        <div className="checkbox-group">
                            <label className={`checkbox-card ${documentTypes.includes('policies') ? 'selected' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={documentTypes.includes('policies')}
                                    onChange={() => handleDocTypeToggle('policies')}
                                />
                                <div className="checkbox-content">
                                    <FileText className="checkbox-icon" size={28} />
                                    <div>
                                        <div className="checkbox-title">HR Policies & Guidelines</div>
                                        <div className="checkbox-desc">Vacation, expenses, code of conduct</div>
                                    </div>
                                </div>
                            </label>

                            <label className={`checkbox-card ${documentTypes.includes('technical') ? 'selected' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={documentTypes.includes('technical')}
                                    onChange={() => handleDocTypeToggle('technical')}
                                />
                                <div className="checkbox-content">
                                    <Target className="checkbox-icon" size={28} />
                                    <div>
                                        <div className="checkbox-title">Technical Documentation</div>
                                        <div className="checkbox-desc">IT manuals, engineering specs, API docs</div>
                                    </div>
                                </div>
                            </label>

                            <label className={`checkbox-card ${documentTypes.includes('specialized') ? 'selected' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={documentTypes.includes('specialized')}
                                    onChange={() => handleDocTypeToggle('specialized')}
                                />
                                <div className="checkbox-content">
                                    <Building2 className="checkbox-icon" size={28} />
                                    <div>
                                        <div className="checkbox-title">Specialized Content</div>
                                        <div className="checkbox-desc">Medical, legal, scientific documentation</div>
                                    </div>
                                </div>
                            </label>

                            <label className={`checkbox-card ${documentTypes.includes('mixed') ? 'selected' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={documentTypes.includes('mixed')}
                                    onChange={() => handleDocTypeToggle('mixed')}
                                />
                                <div className="checkbox-content">
                                    <FileText className="checkbox-icon" size={28} />
                                    <div>
                                        <div className="checkbox-title">Mixed Content</div>
                                        <div className="checkbox-desc">Combination of various document types</div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </Step>

                {/* Step 3: Languages */}
                <Step>
                    <div className="onboarding-step">
                        <div className="step-icon-wrapper">
                            <Globe className="step-icon" size={48} />
                        </div>
                        <h2>How many languages do you need?</h2>
                        <p>Select the number of languages your documents will be in</p>

                        <div className="radio-group">
                            <label className={`radio-card ${languages === 1 ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="languages"
                                    checked={languages === 1}
                                    onChange={() => setLanguages(1)}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">English Only</div>
                                    <div className="radio-desc">Single language support</div>
                                </div>
                            </label>

                            <label className={`radio-card ${languages === 3 ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="languages"
                                    checked={languages === 3}
                                    onChange={() => setLanguages(3)}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">2-3 Languages</div>
                                    <div className="radio-desc">Regional multilingual support</div>
                                </div>
                            </label>

                            <label className={`radio-card ${languages === 5 ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="languages"
                                    checked={languages === 5}
                                    onChange={() => setLanguages(5)}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">5+ Languages</div>
                                    <div className="radio-desc">Global multilingual support</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </Step>

                {/* Step 4: Complexity */}
                <Step>
                    <div className="onboarding-step">
                        <div className="step-icon-wrapper">
                            <Target className="step-icon" size={48} />
                        </div>
                        <h2>Document Complexity Level</h2>
                        <p>How complex is your content?</p>

                        <div className="radio-group">
                            <label className={`radio-card ${complexity === 'simple' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="complexity"
                                    checked={complexity === 'simple'}
                                    onChange={() => setComplexity('simple')}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">Straightforward Q&A</div>
                                    <div className="radio-desc">Simple policies, basic FAQs</div>
                                </div>
                            </label>

                            <label className={`radio-card ${complexity === 'technical' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="complexity"
                                    checked={complexity === 'technical'}
                                    onChange={() => setComplexity('technical')}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">Technical with Jargon</div>
                                    <div className="radio-desc">IT documentation, engineering specs</div>
                                </div>
                            </label>

                            <label className={`radio-card ${complexity === 'specialized' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="complexity"
                                    checked={complexity === 'specialized'}
                                    onChange={() => setComplexity('specialized')}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">Highly Specialized</div>
                                    <div className="radio-desc">Medical, legal, scientific terminology</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </Step>

                {/* Step 5: Company Size */}
                <Step>
                    <div className="onboarding-step">
                        <div className="step-icon-wrapper">
                            <Building2 className="step-icon" size={48} />
                        </div>
                        <h2>Company Size</h2>
                        <p>How many employees are in your organization?</p>

                        <div className="radio-group">
                            <label className={`radio-card ${companySize === '1-50' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="companySize"
                                    checked={companySize === '1-50'}
                                    onChange={() => setCompanySize('1-50')}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">1-50 employees</div>
                                    <div className="radio-desc">Small team or startup</div>
                                </div>
                            </label>

                            <label className={`radio-card ${companySize === '51-200' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="companySize"
                                    checked={companySize === '51-200'}
                                    onChange={() => setCompanySize('51-200')}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">51-200 employees</div>
                                    <div className="radio-desc">Growing mid-size company</div>
                                </div>
                            </label>

                            <label className={`radio-card ${companySize === '201-500' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="companySize"
                                    checked={companySize === '201-500'}
                                    onChange={() => setCompanySize('201-500')}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">201-500 employees</div>
                                    <div className="radio-desc">Large organization</div>
                                </div>
                            </label>

                            <label className={`radio-card ${companySize === '500+' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="companySize"
                                    checked={companySize === '500+'}
                                    onChange={() => setCompanySize('500+')}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">500+ employees</div>
                                    <div className="radio-desc">Enterprise scale</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </Step>

                {/* Step 6: Summary */}
                <Step>
                    <div className="onboarding-step">
                        <div className="step-icon-wrapper">
                            <Check className="step-icon" size={48} />
                        </div>
                        <h2>Perfect! We've Got Your Recommendation</h2>
                        <p>Based on your needs, we'll show you the best tier for your organization.</p>

                        <div className="summary-box">
                            <div className="summary-item">
                                <span className="summary-label">Document Types:</span>
                                <span className="summary-value">{documentTypes.join(', ') || 'None selected'}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Languages:</span>
                                <span className="summary-value">
                                    {languages === 1 ? 'English Only' : languages === 3 ? '2-3 Languages' : '5+ Languages'}
                                </span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Complexity:</span>
                                <span className="summary-value">{complexity || 'Not selected'}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Company Size:</span>
                                <span className="summary-value">{companySize || 'Not selected'}</span>
                            </div>
                        </div>

                        <p className="completion-note">
                            Click Complete to see your recommended tier!
                        </p>
                    </div>
                </Step>
            </Stepper>
        </div>
    );
}
