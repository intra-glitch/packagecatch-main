import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RegisterPage = () => {
    const navigate = useNavigate()
    const { register } = useAuth()
    const [form, setForm] = useState({
        fullName: '', mobileNumber: '', email: '',
        password: '', confirmPassword: '', deliveryAddress: '', landmark: '',
    })
    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setErrors({ ...errors, [e.target.name]: '' })
    }

    const validateStep1 = () => {
        const newErrors = {}
        if (!form.fullName || form.fullName.length < 3)
            newErrors.fullName = 'Full name must be at least 3 characters.'
        if (!form.mobileNumber || !/^09\d{9}$/.test(form.mobileNumber))
            newErrors.mobileNumber = 'Mobile number must start with 09 and be 11 digits.'
        if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
            newErrors.email = 'Enter a valid email address.'
        return newErrors
    }

    const validateStep2 = () => {
        const newErrors = {}
        const pwRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])/
        if (!form.password || form.password.length < 8)
            newErrors.password = 'Password must be at least 8 characters.'
        else if (!pwRegex.test(form.password))
            newErrors.password = 'Must include at least 1 number and 1 special character.'
        if (form.password !== form.confirmPassword)
            newErrors.confirmPassword = 'Passwords do not match.'
        if (!form.deliveryAddress)
            newErrors.deliveryAddress = 'Delivery address is required.'
        return newErrors
    }

    const handleNext = () => {
        const errs = validateStep1()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setStep(2)
    }

    const handleSubmit = async e => {
        e.preventDefault()
        const errs = validateStep2()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setLoading(true)
        try {
            // Split fullName into first/last
            const nameParts = form.fullName.trim().split(' ')
            const firstName = nameParts[0]
            const lastName = nameParts.slice(1).join(' ') || ''
            
                await register(form.email, form.password, {
                    fullName: form.fullName,
                    mobileNumber: form.mobileNumber,
                    deliveryAddress: form.deliveryAddress,
                    landmark: form.landmark,
                    role: 'USER'
                })
            // Redirect to login page so they can input the information to connect
            navigate('/login')
        } catch (err) {
            setErrors({ confirmPassword: err.message || 'Registration failed. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    const inputStyle = (hasError) => ({
        width: '100%', padding: '14px 16px', borderRadius: '8px', fontSize: '15px',
        border: `1.5px solid ${hasError ? '#e63946' : '#e0e0e0'}`,
        background: '#fafafa', transition: 'border 0.2s', boxSizing: 'border-box',
    })

    const errorText = (field) => errors[field] ? (
        <span style={{ fontSize: '12px', color: '#e63946', marginTop: '4px', display: 'block' }}>
      {errors[field]}
    </span>
    ) : null

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#fff' }}>

            {/* LEFT PANEL */}
            <div style={{
                flex: 1, background: '#111', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '48px', color: '#fff',
            }}>
                <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '16px' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: '280px', lineHeight: 1.7 }}>
                    Join thousands of smart shoppers saving big on surplus fashion.
                </p>

                {/* Step indicator */}
                <div style={{ marginTop: '64px', display: 'flex', flexDirection: 'column', gap: '0', width: '100%', maxWidth: '280px' }}>
                    {[
                        { n: 1, label: 'Personal Info', sub: 'Name, mobile, email' },
                        { n: 2, label: 'Security & Address', sub: 'Password, delivery details' },
                    ].map((s, i) => (
                        <div key={s.n} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: step >= s.n ? '#e63946' : 'rgba(255,255,255,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', fontWeight: '700', flexShrink: 0, transition: 'background 0.3s',
                                }}>
                                    {step > s.n ? '✓' : s.n}
                                </div>
                                {i < 1 && <div style={{ width: '2px', height: '40px', background: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />}
                            </div>
                            <div style={{ paddingTop: '6px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: step >= s.n ? '#fff' : 'rgba(255,255,255,0.4)' }}>{s.label}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{s.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', overflowY: 'auto' }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>

                    <div onClick={() => step === 1 ? navigate('/') : setStep(1)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '13px', color: '#999', cursor: 'pointer', marginBottom: '40px',
                    }}>
                        ← {step === 1 ? 'Back to home' : 'Back to step 1'}
                    </div>

                    <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
                        {step === 1 ? 'Create account' : 'Almost done!'}
                    </h1>
                    <p style={{ fontSize: '15px', color: '#888', marginBottom: '36px' }}>
                        {step === 1 ? (
                            <>Already have an account?{' '}
                                <span onClick={() => navigate('/login')} style={{ color: '#111', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>
                  Log in
                </span>
                            </>
                        ) : 'Set your password and delivery address.'}
                    </p>

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>Full Name</label>
                                <input name="fullName" value={form.fullName} onChange={handleChange}
                                       placeholder="e.g. Juan Dela Cruz" style={inputStyle(errors.fullName)}
                                       onFocus={e => e.target.style.border = '1.5px solid #111'}
                                       onBlur={e => e.target.style.border = `1.5px solid ${errors.fullName ? '#e63946' : '#e0e0e0'}`}
                                />
                                {errorText('fullName')}
                            </div>

                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>Mobile Number</label>
                                <input name="mobileNumber" value={form.mobileNumber} onChange={handleChange}
                                       placeholder="09XXXXXXXXX" maxLength={11} style={inputStyle(errors.mobileNumber)}
                                       onFocus={e => e.target.style.border = '1.5px solid #111'}
                                       onBlur={e => e.target.style.border = `1.5px solid ${errors.mobileNumber ? '#e63946' : '#e0e0e0'}`}
                                />
                                {errorText('mobileNumber')}
                            </div>

                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>Email Address</label>
                                <input name="email" value={form.email} onChange={handleChange}
                                       placeholder="email@example.com" style={inputStyle(errors.email)}
                                       onFocus={e => e.target.style.border = '1.5px solid #111'}
                                       onBlur={e => e.target.style.border = `1.5px solid ${errors.email ? '#e63946' : '#e0e0e0'}`}
                                />
                                {errorText('email')}
                            </div>

                            <button onClick={handleNext} style={{
                                width: '100%', padding: '16px', background: '#111',
                                color: '#fff', fontSize: '15px', fontWeight: '700',
                                borderRadius: '8px', cursor: 'pointer', marginTop: '8px', border: 'none',
                            }}>
                                Continue →
                            </button>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input name="password" type={showPassword ? 'text' : 'password'}
                                           value={form.password} onChange={handleChange}
                                           placeholder="Min 8 chars, 1 number, 1 special char"
                                           style={inputStyle(errors.password)}
                                           onFocus={e => e.target.style.border = '1.5px solid #111'}
                                           onBlur={e => e.target.style.border = `1.5px solid ${errors.password ? '#e63946' : '#e0e0e0'}`}
                                    />
                                    <span onClick={() => setShowPassword(!showPassword)} style={{
                                        position: 'absolute', right: '14px', top: '50%',
                                        transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '18px', color: '#999',
                                    }}>{showPassword ? '🙈' : '👁️'}</span>
                                </div>
                                {errorText('password')}
                            </div>

                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                                           value={form.confirmPassword} onChange={handleChange}
                                           placeholder="Re-enter your password"
                                           style={inputStyle(errors.confirmPassword)}
                                           onFocus={e => e.target.style.border = '1.5px solid #111'}
                                           onBlur={e => e.target.style.border = `1.5px solid ${errors.confirmPassword ? '#e63946' : '#e0e0e0'}`}
                                    />
                                    <span onClick={() => setShowConfirm(!showConfirm)} style={{
                                        position: 'absolute', right: '14px', top: '50%',
                                        transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '18px', color: '#999',
                                    }}>{showConfirm ? '🙈' : '👁️'}</span>
                                </div>
                                {errorText('confirmPassword')}
                            </div>

                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>Delivery Address</label>
                                <input name="deliveryAddress" value={form.deliveryAddress} onChange={handleChange}
                                       placeholder="House No., Street, Barangay, City"
                                       style={inputStyle(errors.deliveryAddress)}
                                       onFocus={e => e.target.style.border = '1.5px solid #111'}
                                       onBlur={e => e.target.style.border = `1.5px solid ${errors.deliveryAddress ? '#e63946' : '#e0e0e0'}`}
                                />
                                {errorText('deliveryAddress')}
                            </div>

                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
                                    Landmark / Directions <span style={{ color: '#aaa', fontWeight: '400' }}>(optional)</span>
                                </label>
                                <input name="landmark" value={form.landmark} onChange={handleChange}
                                       placeholder="e.g. Near 7-Eleven, beside blue gate"
                                       style={inputStyle(false)}
                                       onFocus={e => e.target.style.border = '1.5px solid #111'}
                                       onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
                                />
                            </div>

                            <button type="submit" disabled={loading} style={{
                                width: '100%', padding: '16px',
                                background: loading ? '#888' : '#111',
                                color: '#fff', fontSize: '15px', fontWeight: '700',
                                borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
                                marginTop: '8px', border: 'none',
                            }}>
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </div>
    )
}

export default RegisterPage