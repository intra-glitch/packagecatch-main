import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Home } from 'lucide-react'

const LoginPage = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [form, setForm] = useState({ identifier: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setError('')
    }

    const handleSubmit = async e => {
        e.preventDefault()
        if (!form.identifier || !form.password) {
            setError('Please fill in all fields.')
            return
        }
        setLoading(true)
        try {
            const user = await login(form.identifier, form.password)
            if (user?.user_metadata?.role === 'ADMIN') navigate('/admin')
            else navigate('/home')
        } catch (err) {
            setError(err.message || 'Invalid email or password.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>

            {/* Floating Home Button */}
            <button 
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute', top: '30px', right: '30px', zIndex: 10,
                    background: '#fff', border: '2px solid #eee', width: '44px', height: '44px',
                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}
            >
                <Home size={20} color="#111" />
            </button>

            {/* LEFT PANEL: Branding & Experience */}
            <div style={{
                flex: 1.2, background: '#111', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '80px', color: '#fff', position: 'relative', overflow: 'hidden'
            }}>
                {/* Abstract Background Decoration */}
                <div style={{
                    position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(230, 57, 70, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%'
                }} />

                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                    <div style={{ 
                        fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                    </div>
                    <p style={{ 
                        fontSize: '18px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', 
                        maxWidth: '320px', lineHeight: 1.6, fontWeight: '500'
                    }}>
                        Curated surplus fashion for the conscious shopper. 
                        Style shouldn't cost the Earth.
                    </p>
                    
                    <div style={{ 
                        marginTop: '80px', display: 'flex', flexDirection: 'column', 
                        gap: '28px', width: '100%', maxWidth: '340px', textAlign: 'left'
                    }}>
                        {[
                            { title: 'Boutique Quality', desc: 'Hand-picked items from top surplus stock.' },
                            { title: 'Sustainable Choice', desc: 'Reduce waste by shopping luxury surplus.' },
                            { title: 'VIP Support', desc: 'Real-time tracking and 24/7 assistance.' }
                        ].map((perk, i) => (
                            <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '10px',
                                    background: 'rgba(230, 57, 70, 0.2)', color: '#e63946',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <CheckCircle2 size={18} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>{perk.title}</h4>
                                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{perk.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer simple link */}
                <div style={{ position: 'absolute', bottom: '40px', left: '80px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                    © 2024 PACKAGE CATCH. ALL RIGHTS RESERVED.
                </div>
            </div>

            {/* RIGHT PANEL: Login Form */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '60px', background: '#fafafa'
            }}>
                <div style={{ width: '100%', maxWidth: '420px', background: '#fff', padding: '48px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.03)' }}>

                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#111', marginBottom: '12px', letterSpacing: '-1px' }}>Welcome back</h1>
                        <p style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>
                            New here?{' '}
                            <span onClick={() => navigate('/register')} style={{ color: '#e63946', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}>
                                Create an account
                            </span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                <input
                                    name="identifier"
                                    type="email"
                                    value={form.identifier}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    style={{
                                        width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px',
                                        fontSize: '15px', border: '2px solid #eee',
                                        background: '#fff', transition: 'all 0.2s', boxSizing: 'border-box',
                                        outline: 'none', fontWeight: '500'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#111'}
                                    onBlur={e => e.target.style.borderColor = '#eee'}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '13px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Password
                                </label>
                                <span onClick={() => navigate('/recover')} style={{ fontSize: '12px', fontWeight: '800', color: '#e63946', cursor: 'pointer' }}>
                                    Forgot password?
                                </span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%', padding: '16px 48px 16px 48px', borderRadius: '14px',
                                        fontSize: '15px', border: '2px solid #eee',
                                        background: '#fff', transition: 'all 0.2s', boxSizing: 'border-box',
                                        outline: 'none', fontWeight: '500'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#111'}
                                    onBlur={e => e.target.style.borderColor = '#eee'}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                                    position: 'absolute', right: '16px', top: '50%',
                                    transform: 'translateY(-50%)', cursor: 'pointer', background: 'none', border: 'none', color: '#999',
                                }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                padding: '14px 18px', borderRadius: '12px',
                                background: '#fff0f0', border: '1px solid #ffebeb',
                                fontSize: '13px', color: '#e63946', fontWeight: '700',
                                textAlign: 'center'
                            }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '18px',
                            background: loading ? '#888' : '#111',
                            color: '#fff', fontSize: '16px', fontWeight: '900',
                            borderRadius: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '10px', border: 'none', transition: 'all 0.2s',
                        }}>
                            {loading ? 'Verifying...' : 'Sign In Now'}
                            {!loading && <ArrowRight size={18} />}
                        </button>

                    </form>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        margin: '32px 0', color: '#eee', fontSize: '12px',
                        fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        <div style={{ flex: 1, height: '1.5px', background: '#f5f5f5' }} />
                        OR
                        <div style={{ flex: 1, height: '1.5px', background: '#f5f5f5' }} />
                    </div>

                    <button onClick={() => navigate('/home')} style={{
                        width: '100%', padding: '16px', background: '#fff', color: '#111',
                        fontSize: '14px', fontWeight: '800', borderRadius: '16px',
                        cursor: 'pointer', border: '2px solid #eee', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}
                    >
                        Browse as Guest
                    </button>

                </div>
            </div>
        </div>
    )
}

export default LoginPage