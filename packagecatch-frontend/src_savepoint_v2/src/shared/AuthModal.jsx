import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus, X } from 'lucide-react'

const AuthModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate()

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            padding: '20px',
            animation: 'fadeIn 0.3s ease'
        }} onClick={onClose}>
            <div style={{
                background: '#fff',
                width: '100%',
                maxWidth: '400px',
                borderRadius: '32px',
                padding: '40px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                textAlign: 'center',
                animation: 'modalSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Close Button */}
                <button onClick={onClose} style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: '#f5f5f5',
                    border: 'none',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#666',
                    transition: 'all 0.2s'
                }} onMouseEnter={e => e.currentTarget.style.background = '#eee'}>
                    <X size={18} />
                </button>

                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '22px',
                    background: '#fff0f0',
                    color: '#e63946',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    <LogIn size={32} strokeWidth={2.5} />
                </div>

                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '900',
                    letterSpacing: '-1px',
                    marginBottom: '12px',
                    color: '#111'
                }}>Exclusive Access</h2>
                
                <p style={{
                    fontSize: '15px',
                    color: '#666',
                    lineHeight: '1.6',
                    marginBottom: '32px',
                    fontWeight: '500'
                }}>Log in or Sign up to start building your curated collection.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                        onClick={() => { navigate('/login'); onClose(); }}
                        style={{
                            width: '100%',
                            height: '56px',
                            borderRadius: '16px',
                            background: '#111',
                            color: '#fff',
                            border: 'none',
                            fontSize: '15px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <LogIn size={18} /> LOG IN
                    </button>
                    
                    <button 
                        onClick={() => { navigate('/register'); onClose(); }}
                        style={{
                            width: '100%',
                            height: '56px',
                            borderRadius: '16px',
                            background: '#fff',
                            color: '#111',
                            border: '2px solid #f0f0f0',
                            fontSize: '15px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#111';
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#f0f0f0';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <UserPlus size={18} /> SIGN UP
                    </button>
                </div>

                <button 
                    onClick={onClose}
                    style={{
                        marginTop: '20px',
                        background: 'none',
                        border: 'none',
                        color: '#999',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        letterSpacing: '0.5px'
                    }}
                >
                    CONTINUE BROWSING
                </button>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    )
}

export default AuthModal
