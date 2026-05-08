import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
            // Supabase stores custom data like 'role' inside 'user_metadata'
            if (user?.user_metadata?.role === 'ADMIN') navigate('/admin')
            else navigate('/home')
        } catch (err) {
            setError(err.message || 'Invalid email or password.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#fff' }}>

            {/* LEFT PANEL */}
            <div style={{
                flex: 1, background: '#111', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '48px', color: '#fff',
            }}>
                <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '16px' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: '280px', lineHeight: 1.7 }}>
                    Affordable surplus fashion, delivered straight to your door.
                </p>
                <div style={{ marginTop: '64px', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '300px' }}>
                    {['Free delivery on ₱200+', 'Exclusive member deals', 'Track orders in real time'].map(perk => (
                        <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '14px', flexShrink: 0,
                            }}>✓</div>
                            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{perk}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '48px',
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>

                    <div onClick={() => navigate('/')} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '13px', color: '#999', cursor: 'pointer', marginBottom: '40px',
                    }}>
                        ← Back to home
                    </div>

                    <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>Welcome back</h1>
                    <p style={{ fontSize: '15px', color: '#888', marginBottom: '40px' }}>
                        Don't have an account?{' '}
                        <span onClick={() => navigate('/register')} style={{ color: '#111', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>
              Sign up
            </span>
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
                                Email Address
                            </label>
                            <input
                                name="identifier"
                                type="email"
                                value={form.identifier}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                style={{
                                    width: '100%', padding: '14px 16px', borderRadius: '8px',
                                    fontSize: '15px', border: '1.5px solid #e0e0e0',
                                    background: '#fafafa', transition: 'border 0.2s', boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.border = '1.5px solid #111'}
                                onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    style={{
                                        width: '100%', padding: '14px 48px 14px 16px', borderRadius: '8px',
                                        fontSize: '15px', border: '1.5px solid #e0e0e0',
                                        background: '#fafafa', transition: 'border 0.2s', boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.target.style.border = '1.5px solid #111'}
                                    onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
                                />
                                <span onClick={() => setShowPassword(!showPassword)} style={{
                                    position: 'absolute', right: '14px', top: '50%',
                                    transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '18px', color: '#999',
                                }}>
                  {showPassword ? '🙈' : '👁️'}
                </span>
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                padding: '12px 16px', borderRadius: '8px',
                                background: '#fff0f0', border: '1px solid #ffc0c0',
                                fontSize: '13px', color: '#e63946',
                            }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '16px',
                            background: loading ? '#888' : '#111',
                            color: '#fff', fontSize: '15px', fontWeight: '700',
                            borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '8px', letterSpacing: '0.5px',
                            border: 'none', transition: 'background 0.2s',
                        }}>
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>

                    </form>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        margin: '28px 0', color: '#ccc', fontSize: '13px',
                    }}>
                        <div style={{ flex: 1, height: '1px', background: '#eee' }} />
                        or continue as
                        <div style={{ flex: 1, height: '1px', background: '#eee' }} />
                    </div>

                    <button onClick={() => navigate('/home')} style={{
                        width: '100%', padding: '14px', background: '#f5f5f5', color: '#111',
                        fontSize: '14px', fontWeight: '600', borderRadius: '8px',
                        cursor: 'pointer', border: '1.5px solid #e0e0e0',
                    }}>
                        Browse as Guest
                    </button>

                </div>
            </div>
        </div>
    )
}

export default LoginPage