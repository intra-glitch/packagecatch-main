import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { User, Phone, Mail, Lock, MapPin, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, Home } from 'lucide-react'

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
            newErrors.mobileNumber = 'Must start with 09 and be 11 digits.'
        if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
            newErrors.email = 'Enter a valid email address.'
        return newErrors
    }

    const validateStep2 = () => {
        const newErrors = {}
        const pwRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])/
        if (!form.password || form.password.length < 8)
            newErrors.password = 'Min 8 characters.'
        else if (!pwRegex.test(form.password))
            newErrors.password = 'Add 1 number and 1 symbol.'
        if (form.password !== form.confirmPassword)
            newErrors.confirmPassword = 'Passwords do not match.'
        if (!form.deliveryAddress)
            newErrors.deliveryAddress = 'Address is required.'
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
            await register(form.email, form.password, {
                full_name: form.fullName,
                phone: form.mobileNumber,
                address: form.deliveryAddress,
                landmark: form.landmark,
                role: 'USER'
            })
            navigate('/login')
        } catch (err) {
            setErrors({ confirmPassword: err.message || 'Registration failed.' })
        } finally {
            setLoading(false)
        }
    }

    const renderInput = (name, type, icon, placeholder, error, extraProps = {}) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {name.replace(/([A-Z])/g, ' $1')}
            </label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: error ? '#e63946' : '#999' }}>
                    {icon}
                </div>
                <input
                    name={name}
                    type={type}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    style={{
                        width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px',
                        fontSize: '14px', border: `2px solid ${error ? '#e63946' : '#eee'}`,
                        background: '#fff', transition: 'all 0.2s', boxSizing: 'border-box',
                        outline: 'none', fontWeight: '500'
                    }}
                    onFocus={e => e.target.style.borderColor = '#111'}
                    onBlur={e => e.target.style.borderColor = error ? '#e63946' : '#eee'}
                    {...extraProps}
                />
            </div>
            {error && <span style={{ fontSize: '11px', color: '#e63946', fontWeight: '700' }}>{error}</span>}
        </div>
    )

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

            {/* LEFT PANEL */}
            <div style={{
                flex: 1.2, background: '#111', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '80px', color: '#fff', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '-10%', width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(230, 57, 70, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%'
                }} />

                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                    <div style={{ 
                        fontSize: '36px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                    </div>
                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', maxWidth: '280px', margin: '0 auto 60px', lineHeight: 1.6 }}>
                        Join the community of smart shoppers and start catching deals.
                    </p>

                    {/* Step Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%', maxWidth: '280px', textAlign: 'left' }}>
                        {[
                            { step: 1, title: 'Identity', desc: 'Your name & contact details' },
                            { step: 2, title: 'Security', desc: 'Secure your account & delivery' }
                        ].map((s) => (
                            <div key={s.step} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: step >= s.step ? '#e63946' : 'rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: step >= s.step ? '#fff' : 'rgba(255,255,255,0.3)',
                                    fontWeight: '900', fontSize: '16px', transition: 'all 0.3s'
                                }}>
                                    {step > s.step ? <CheckCircle2 size={20} /> : s.step}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: step >= s.step ? '#fff' : 'rgba(255,255,255,0.3)' }}>{s.title}</h4>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '60px', background: '#fafafa'
            }}>
                <div style={{ 
                    width: '100%', maxWidth: '440px', background: '#fff', 
                    padding: '48px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.03)',
                    position: 'relative'
                }}>
                    
                    <button 
                        onClick={() => step === 1 ? navigate('/') : setStep(1)}
                        style={{
                            position: 'absolute', left: '20px', top: '20px', background: '#f5f5f5', border: 'none',
                            width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#111'
                        }}
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111', marginBottom: '8px', letterSpacing: '-1px' }}>
                            {step === 1 ? 'Start Catching' : 'Final Step'}
                        </h1>
                        <p style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                            {step === 1 ? (
                                <>Already a member? <span onClick={() => navigate('/login')} style={{ color: '#e63946', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}>Log In</span></>
                            ) : 'Complete your secure profile.'}
                        </p>
                    </div>

                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {renderInput('fullName', 'text', <User size={18} />, 'Juan Dela Cruz', errors.fullName)}
                            {renderInput('mobileNumber', 'text', <Phone size={18} />, '09XXXXXXXXX', errors.mobileNumber, { maxLength: 11 })}
                            {renderInput('email', 'email', <Mail size={18} />, 'your@email.com', errors.email)}

                            <button onClick={handleNext} style={{
                                width: '100%', padding: '18px', background: '#111', color: '#fff', 
                                fontSize: '15px', fontWeight: '900', borderRadius: '14px', border: 'none',
                                cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', gap: '10px', transition: 'all 0.2s'
                            }}>
                                Continue <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                {renderInput('password', showPassword ? 'text' : 'password', <Lock size={18} />, 'Create Password', errors.password)}
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                                    position: 'absolute', right: '16px', top: '44px', background: 'none', border: 'none', color: '#999', cursor: 'pointer'
                                }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            <div style={{ position: 'relative' }}>
                                {renderInput('confirmPassword', showConfirm ? 'text' : 'password', <Lock size={18} />, 'Confirm Password', errors.confirmPassword)}
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                                    position: 'absolute', right: '16px', top: '44px', background: 'none', border: 'none', color: '#999', cursor: 'pointer'
                                }}>
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {renderInput('deliveryAddress', 'text', <MapPin size={18} />, 'Delivery Address', errors.deliveryAddress)}
                            {renderInput('landmark', 'text', <MapPin size={18} />, 'Landmark (Optional)', null)}

                            <button type="submit" disabled={loading} style={{
                                width: '100%', padding: '18px', background: loading ? '#888' : '#e63946', color: '#fff', 
                                fontSize: '15px', fontWeight: '900', borderRadius: '14px', border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                            }}>
                                {loading ? 'Creating Account...' : 'Complete Registration'}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </div>
    )
}

export default RegisterPage