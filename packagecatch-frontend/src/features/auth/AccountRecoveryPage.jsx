import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../api/authService';
import { ArrowLeft, Mail, User, ShieldCheck, HelpCircle, Eye, EyeOff, Phone } from 'lucide-react';

const AccountRecoveryPage = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('choice'); // 'choice', 'email', 'password'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form States
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [emailHint, setEmailHint] = useState('');
    const [fullEmail, setFullEmail] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const resetFields = () => {
        setFullName('');
        setEmail('');
        setPhone('');
        setNewPassword('');
        setError('');
        setSuccess('');
        setEmailHint('');
        setFullEmail('');
        setIsVerified('');
    };

    const changeMode = (newMode) => {
        resetFields();
        setMode(newMode);
    };

    const handleGetHint = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authService.getEmailHint(fullName, phone);
            if (res.verified) {
                setFullEmail(res.email);
                setIsVerified(true);
            } else {
                setEmailHint(res.hint);
                setIsVerified(false);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to find account');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.resetPassword(email, fullName, newPassword);
            setSuccess('Password updated successfully!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const renderChoice = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#111', marginBottom: '8px' }}>Help Me Sign In</h1>
                <p style={{ color: '#666', fontSize: '14px' }}>Choose the option that matches your issue</p>
            </div>

            <button 
                onClick={() => changeMode('email')}
                style={{
                    padding: '24px', borderRadius: '16px', border: '2px solid #eee', background: '#fff',
                    display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s',
                    textAlign: 'left'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}
            >
                <div style={{ padding: '12px', background: '#f0f4ff', borderRadius: '12px' }}>
                    <Mail size={24} color="#1877F2" />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>I forgot my email</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Get a hint for your registered address</p>
                </div>
            </button>

            <button 
                onClick={() => changeMode('password')}
                style={{
                    padding: '24px', borderRadius: '16px', border: '2px solid #eee', background: '#fff',
                    display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s',
                    textAlign: 'left'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}
            >
                <div style={{ padding: '12px', background: '#fff0f3', borderRadius: '12px' }}>
                    <ShieldCheck size={24} color="#e63946" />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>I forgot my password</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Reset your password via identity check</p>
                </div>
            </button>
        </div>
    );

    const renderEmailHint = () => (
        <form onSubmit={handleGetHint} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#111', marginBottom: '8px' }}>Find Your Email</h1>
                <p style={{ color: '#666', fontSize: '14px' }}>Enter your full name to get an account hint</p>
            </div>

            <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input 
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    style={{
                        width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '2px solid #eee',
                        fontSize: '15px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                    }}
                />
            </div>

            {emailHint && !isVerified && (
                <div style={{ background: '#eef6ff', padding: '20px', borderRadius: '14px', border: '1px dashed #1877F2', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: '#1877F2', fontWeight: '700', marginBottom: '8px' }}>Account Found!</p>
                    <p style={{ fontSize: '18px', fontWeight: '900', color: '#111', margin: '0 0 16px' }}>{emailHint}</p>
                    
                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                        <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                        <input 
                            type="text"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="Verify your phone to see full email"
                            style={{
                                width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #1877F2',
                                fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={loading || !phone}
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#1877F2', color: '#fff', border: 'none', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}
                    >
                        Reveal Full Email
                    </button>
                </div>
            )}

            {isVerified && (
                <div style={{ background: '#f0fff4', padding: '20px', borderRadius: '14px', border: '1px dashed #2a9d8f', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: '#2a9d8f', fontWeight: '700', marginBottom: '8px' }}>Identity Verified!</p>
                    <p style={{ fontSize: '18px', fontWeight: '900', color: '#111', margin: '0 0 12px' }}>{fullEmail}</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                            type="button"
                            onClick={() => navigate('/login')}
                            style={{ padding: '8px 16px', borderRadius: '8px', background: '#111', color: '#fff', fontSize: '12px', fontWeight: '900', border: 'none', cursor: 'pointer' }}
                        >
                            Log In Now
                        </button>
                        <button 
                            type="button"
                            onClick={() => { 
                                const savedEmail = fullEmail;
                                changeMode('password'); 
                                setEmail(savedEmail); 
                            }}
                            style={{ padding: '8px 16px', borderRadius: '8px', background: '#fff', color: '#111', fontSize: '12px', fontWeight: '900', border: '1px solid #111', cursor: 'pointer' }}
                        >
                            Reset Password
                        </button>
                    </div>
                </div>
            )}

            {error && <div style={{ color: '#e63946', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>{error}</div>}

            {!emailHint && !isVerified && (
                <button 
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '16px', borderRadius: '14px', background: '#111', color: '#fff', 
                        fontSize: '15px', fontWeight: '900', border: 'none', cursor: 'pointer'
                    }}
                >
                    {loading ? 'Searching...' : 'Find My Account'}
                </button>
            )}
        </form>
    );

    const renderPasswordReset = () => (
        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#111', marginBottom: '8px' }}>Identity Check</h1>
                <p style={{ color: '#666', fontSize: '14px' }}>Verify your identity to set a new password</p>
            </div>

            <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input 
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Registered Full Name"
                    style={{
                        width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '2px solid #eee',
                        fontSize: '15px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input 
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Registered Email Address"
                    style={{
                        width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '2px solid #eee',
                        fontSize: '15px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input 
                    type={showPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New Secure Password"
                    style={{
                        width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '2px solid #eee',
                        fontSize: '15px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                    }}
                />
                <button 
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            {error && <div style={{ color: '#e63946', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>{error}</div>}
            {success && <div style={{ color: '#2a9d8f', fontSize: '14px', fontWeight: '800', textAlign: 'center' }}>{success}</div>}

            <button 
                type="submit"
                disabled={loading}
                style={{
                    padding: '16px', borderRadius: '14px', background: '#111', color: '#fff', 
                    fontSize: '15px', fontWeight: '900', border: 'none', cursor: 'pointer', marginTop: '10px'
                }}
            >
                {loading ? 'Verifying...' : 'Reset My Password'}
            </button>
        </form>
    );

    return (
        <div style={{
            minHeight: '100vh', background: '#fcfcfc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{
                width: '100%', maxWidth: '440px', background: '#fff', padding: '40px', borderRadius: '24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.04)', position: 'relative'
            }}>
                <button 
                    onClick={() => mode === 'choice' ? navigate('/login') : changeMode('choice')}
                    style={{
                        position: 'absolute', left: '20px', top: '20px', background: '#f5f5f5', border: 'none',
                        width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#111'
                    }}
                >
                    <ArrowLeft size={18} />
                </button>

                {mode === 'choice' && renderChoice()}
                {mode === 'email' && renderEmailHint()}
                {mode === 'password' && renderPasswordReset()}

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: '#888', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                        Remember your details? <span style={{ color: '#111' }}>Sign In</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AccountRecoveryPage;
