import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CheckoutPage = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        landmark: '',
        paymentMethod: 'cod',
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [orderPlaced, setOrderPlaced] = useState(false)
    const [orderId, setOrderId] = useState('')

    const orderItems = [
        { id: 1, name: 'Oversized Hoodie', price: 299, size: 'M', quantity: 1, bg: '#f5f5f5' },
        { id: 2, name: 'Floral Midi Dress', price: 459, size: 'S', quantity: 1, bg: '#fff0f3' },
        { id: 5, name: 'Crop Tank Top', price: 199, size: 'XS', quantity: 2, bg: '#fff8f0' },
    ]

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const deliveryFee = form.paymentMethod === 'pickup' ? 0 : subtotal >= 200 ? 0 : 70
    const total = subtotal + deliveryFee

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setErrors({ ...errors, [e.target.name]: '' })
    }

    const validate = () => {
        const errs = {}
        if (!form.name || form.name.length < 3) errs.name = 'Full name is required.'
        if (!form.phone || !/^09\d{9}$/.test(form.phone)) errs.phone = 'Enter a valid 11-digit mobile number starting with 09.'
        if (form.paymentMethod !== 'pickup' && !form.address) errs.address = 'Delivery address is required.'
        return errs
    }

    const handleSubmit = e => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            setOrderId('PC-' + Math.random().toString(36).substring(2, 8).toUpperCase())
            setOrderPlaced(true)
        }, 1800)
    }

    const inputStyle = (field) => ({
        width: '100%', padding: '14px 16px',
        borderRadius: '8px', fontSize: '15px',
        border: `1.5px solid ${errors[field] ? '#e63946' : '#e0e0e0'}`,
        background: '#fafafa', transition: 'border 0.2s',
    })

    /* ── ORDER SUCCESS SCREEN ── */
    if (orderPlaced) {
        return (
            <div style={{
                minHeight: '100vh', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', textAlign: 'center', padding: '48px',
            }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: '#f0fff8', border: '3px solid #2a9d8f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '36px', marginBottom: '24px',
                }}>✓</div>
                <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '12px' }}>Order Placed!</h1>
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                    Thank you for your order. We'll get it ready soon!
                </p>
                <div style={{
                    background: '#fafafa', border: '1px solid #f0f0f0',
                    borderRadius: '12px', padding: '20px 40px', margin: '28px 0',
                }}>
                    <p style={{ fontSize: '13px', color: '#999', marginBottom: '4px', letterSpacing: '2px' }}>ORDER ID</p>
                    <p style={{ fontSize: '28px', fontWeight: '900', color: '#111', letterSpacing: '2px' }}>{orderId}</p>
                </div>
                <p style={{ fontSize: '14px', color: '#888', marginBottom: '36px', maxWidth: '360px' }}>
                    {form.paymentMethod === 'cod'
                        ? 'Please prepare the exact amount upon delivery.'
                        : 'Your order is ready for pickup. We\'ll notify you when it\'s available.'}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button onClick={() => navigate('/profile')} style={{
                        padding: '14px 32px', background: '#111', color: '#fff',
                        fontSize: '15px', fontWeight: '700', borderRadius: '8px', cursor: 'pointer',
                    }}>Track Order</button>
                    <button onClick={() => navigate('/home')} style={{
                        padding: '14px 32px', background: 'transparent', color: '#555',
                        fontSize: '15px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer',
                        border: '1.5px solid #e0e0e0',
                    }}>Continue Shopping</button>
                </div>
            </div>
        )
    }

    /* ── CHECKOUT FORM ── */
    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>

            {/* NAVBAR */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 48px', height: '64px',
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid #f0f0f0',
            }}>
                <div onClick={() => navigate('/')} style={{ fontSize: '20px', fontWeight: '900', cursor: 'pointer' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>
                <span onClick={() => navigate('/cart')} style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#555' }}>
          ← Back to Cart
        </span>
            </nav>

            {/* STEPS INDICATOR */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0', padding: '28px 48px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
                {['Cart', 'Checkout', 'Confirmation'].map((step, i) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: i === 1 ? '#111' : i === 0 ? '#2a9d8f' : '#e0e0e0',
                                color: i <= 1 ? '#fff' : '#999',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '13px', fontWeight: '700',
                            }}>{i === 0 ? '✓' : i + 1}</div>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: i === 1 ? '#111' : '#aaa' }}>{step}</span>
                        </div>
                        {i < 2 && <div style={{ width: '80px', height: '2px', background: i === 0 ? '#2a9d8f' : '#e0e0e0', margin: '0 8px', marginBottom: '20px' }} />}
                    </div>
                ))}
            </div>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 48px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

                    {/* FORM */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '32px', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Delivery Information</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>Full Name</label>
                                    <input name="name" value={form.name} onChange={handleChange}
                                           placeholder="e.g. Juan Dela Cruz"
                                           style={inputStyle('name')}
                                           onFocus={e => e.target.style.border = '1.5px solid #111'}
                                           onBlur={e => e.target.style.border = `1.5px solid ${errors.name ? '#e63946' : '#e0e0e0'}`}
                                    />
                                    {errors.name && <span style={{ fontSize: '12px', color: '#e63946', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>Mobile Number</label>
                                    <input name="phone" value={form.phone} onChange={handleChange}
                                           placeholder="09XXXXXXXXX" maxLength={11}
                                           style={inputStyle('phone')}
                                           onFocus={e => e.target.style.border = '1.5px solid #111'}
                                           onBlur={e => e.target.style.border = `1.5px solid ${errors.phone ? '#e63946' : '#e0e0e0'}`}
                                    />
                                    {errors.phone && <span style={{ fontSize: '12px', color: '#e63946', marginTop: '4px', display: 'block' }}>{errors.phone}</span>}
                                </div>

                                {form.paymentMethod !== 'pickup' && (
                                    <>
                                        <div>
                                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>Delivery Address</label>
                                            <input name="address" value={form.address} onChange={handleChange}
                                                   placeholder="House No., Street, Barangay, City"
                                                   style={inputStyle('address')}
                                                   onFocus={e => e.target.style.border = '1.5px solid #111'}
                                                   onBlur={e => e.target.style.border = `1.5px solid ${errors.address ? '#e63946' : '#e0e0e0'}`}
                                            />
                                            {errors.address && <span style={{ fontSize: '12px', color: '#e63946', marginTop: '4px', display: 'block' }}>{errors.address}</span>}
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
                                                Landmark / Directions <span style={{ color: '#aaa', fontWeight: '400' }}>(optional)</span>
                                            </label>
                                            <input name="landmark" value={form.landmark} onChange={handleChange}
                                                   placeholder="e.g. Near 7-Eleven, beside blue gate"
                                                   style={inputStyle('landmark')}
                                                   onFocus={e => e.target.style.border = '1.5px solid #111'}
                                                   onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* PAYMENT METHOD */}
                        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '32px', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Payment Method</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: '💵' },
                                    { value: 'pickup', label: 'Pickup', desc: 'Pick up your order in-store. No delivery fee.', icon: '🏪' },
                                ].map(method => (
                                    <div key={method.value} onClick={() => setForm({ ...form, paymentMethod: method.value })} style={{
                                        display: 'flex', alignItems: 'center', gap: '16px',
                                        padding: '16px 20px', borderRadius: '10px', cursor: 'pointer',
                                        border: `2px solid ${form.paymentMethod === method.value ? '#111' : '#e0e0e0'}`,
                                        background: form.paymentMethod === method.value ? '#f9f9f9' : '#fff',
                                        transition: 'all 0.2s',
                                    }}>
                                        <div style={{ fontSize: '24px' }}>{method.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '700' }}>{method.label}</div>
                                            <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{method.desc}</div>
                                        </div>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%',
                                            border: `2px solid ${form.paymentMethod === method.value ? '#111' : '#ccc'}`,
                                            background: form.paymentMethod === method.value ? '#111' : '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {form.paymentMethod === method.value && (
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SUBMIT */}
                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '18px',
                            background: loading ? '#888' : '#111',
                            color: '#fff', fontSize: '16px', fontWeight: '700',
                            borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s',
                        }}>
                            {loading ? 'Placing your order...' : `Confirm Order — ₱${total}`}
                        </button>
                    </form>

                    {/* ORDER SUMMARY */}
                    <div style={{
                        background: '#fff', borderRadius: '16px',
                        border: '1px solid #f0f0f0', padding: '28px',
                        position: 'sticky', top: '88px',
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Order Summary</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                            {orderItems.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '52px', height: '52px', borderRadius: '8px',
                                        background: item.bg, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '22px', flexShrink: 0,
                                    }}>👗</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{item.name}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>Size: {item.size} · Qty: {item.quantity}</div>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>₱{item.price * item.quantity}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '16px' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                            <span style={{ color: '#777' }}>Subtotal</span>
                            <span style={{ fontWeight: '600' }}>₱{subtotal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                            <span style={{ color: '#777' }}>Delivery fee</span>
                            <span style={{ fontWeight: '600', color: deliveryFee === 0 ? '#2a9d8f' : '#111' }}>
                {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}
              </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                            <span style={{ color: '#777' }}>Payment</span>
                            <span style={{ fontWeight: '600' }}>{form.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pickup'}</span>
                        </div>

                        <div style={{ height: '1px', background: '#f0f0f0', margin: '16px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900' }}>
                            <span>Total</span>
                            <span style={{ color: '#e63946' }}>₱{total}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckoutPage