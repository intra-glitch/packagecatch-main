import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { orderService } from '../../api/orderService'
import { cartService } from '../../api/cartService'
import { Truck, Store, CreditCard, ShieldCheck, CheckCircle2, ChevronLeft, Package, MapPin, Phone, User, ArrowRight } from 'lucide-react'

const CheckoutPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [orderItems, setOrderItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('checkout_items') || '[]')
        } catch {
            return []
        }
    })

    const meta = user?.user_metadata || {}
    const [form, setForm] = useState({
        name: meta.fullName || '',
        phone: meta.phone || '',
        address: meta.address || '',
        landmark: meta.landmark || '',
        paymentMethod: 'cod',
        shippingMethod: 'standard',
    })

    const [couponCode, setCouponCode] = useState('')
    const [couponData, setCouponData] = useState(null)
    const [couponLoading, setCouponLoading] = useState(false)
    const [couponError, setCouponError] = useState('')

    useEffect(() => {
        if (user?.user_metadata) {
            const m = user.user_metadata
            setForm(prev => ({
                ...prev,
                name: prev.name || m.fullName || '',
                phone: prev.phone || m.phone || '',
                address: prev.address || m.address || '',
                landmark: prev.landmark || m.landmark || '',
            }))
        }
    }, [user])

    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [orderPlaced, setOrderPlaced] = useState(false)
    const [orderId, setOrderId] = useState('')

    useEffect(() => {
        if (orderItems.length === 0) navigate('/home')
    }, [orderItems, navigate])

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    
    const shippingRates = {
        standard: 45,
        express: 95,
        pickup: 0
    }
    const deliveryFee = form.paymentMethod === 'pickup' ? 0 : (subtotal >= 250 ? 0 : shippingRates[form.shippingMethod])
    const discount = couponData ? couponData.discount : 0
    const total = Math.max(0, subtotal + deliveryFee - discount)

    const handleApplyCoupon = async () => {
        if (!couponCode) return
        setCouponLoading(true)
        setCouponError('')
        try {
            // In a real multi-billion company, we use a dedicated service
            const res = await orderService.validateCoupon(couponCode, subtotal)
            setCouponData(res)
            setCouponCode('')
        } catch (err) {
            setCouponError(err.response?.data?.error || 'Invalid coupon')
            setCouponData(null)
        } finally {
            setCouponLoading(false)
        }
    }

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setErrors({ ...errors, [e.target.name]: '' })
    }

    const validate = () => {
        const errs = {}
        if (!form.name || form.name.length < 3) errs.name = 'Full name is required.'
        if (!form.phone || !/^09\d{9}$/.test(form.phone)) errs.phone = 'Valid 11-digit number required.'
        if (form.paymentMethod !== 'pickup' && !form.address) errs.address = 'Delivery address is required.'
        return errs
    }

    const handleSubmit = async e => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        
        setLoading(true)
        try {
            const orderPayload = { items: orderItems, subtotal, deliveryFee, total, shippingInfo: form }
            const result = await orderService.createOrder(orderPayload)
            setOrderId(result.id)
            setOrderPlaced(true)
            localStorage.removeItem('checkout_items')
            const cart = cartService.getCart(user?.id)
            const remainingCart = cart.filter(cartItem => !orderItems.find(orderItem => orderItem.id === cartItem.id))
            cartService.saveCart(user?.id, remainingCart)
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message))
        } finally {
            setLoading(false)
        }
    }

    const inputStyle = (field) => ({
        width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '13px',
        border: `1.5px solid ${errors[field] ? '#e63946' : '#f0f0f0'}`,
        background: '#fff', transition: 'all 0.2s', outline: 'none', fontWeight: '500'
    })

    if (orderPlaced) {
        return (
            <div style={{ minHeight: '100vh', background: '#fcfcfc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '40px', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#f0fff8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a9d8f', marginBottom: '24px' }}>
                    <CheckCircle2 size={40} />
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-1.5px' }}>Payment Successful.</h1>
                <p style={{ fontSize: '15px', color: '#888', marginBottom: '32px' }}>Your digital receipt has been generated.</p>
                
                {/* OFFICIAL RECEIPT DESIGN */}
                <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: '#e63946' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '900' }}>PACKAGE<span style={{ color: '#e63946' }}>CATCH</span></div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#bbb' }}>{new Date().toLocaleDateString()}</div>
                    </div>
                    
                    <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', letterSpacing: '1px', marginBottom: '4px' }}>ORDER ID</p>
                        <p style={{ fontSize: '14px', fontWeight: '900' }}>#{String(orderId).substring(0, 12).toUpperCase()}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {orderItems.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: '#666' }}>{item.name} <span style={{ fontSize: '10px', color: '#bbb' }}>x{item.quantity}</span></span>
                                <span style={{ fontWeight: '700' }}>₱{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px dashed #eee', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: '#888' }}>Subtotal</span>
                            <span>₱{subtotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: '#888' }}>Shipping ({form.shippingMethod.toUpperCase()})</span>
                            <span>₱{deliveryFee.toLocaleString()}</span>
                        </div>
                        {discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#e63946' }}>
                                <span>Discount</span>
                                <span>-₱{discount.toLocaleString()}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                            <span>Total</span>
                            <span style={{ color: '#e63946' }}>₱{total.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '32px', textAlign: 'center' }}>
                        <div style={{ width: '100%', height: '40px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#ccc', letterSpacing: '2px' }}>
                            |||| || ||||| ||| || ||||
                        </div>
                        <p style={{ fontSize: '10px', color: '#bbb', marginTop: '12px', fontWeight: '600' }}>THANK YOU FOR SHOPPING</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                    <button onClick={() => window.print()} style={{ padding: '16px 32px', background: '#111', color: '#fff', fontSize: '13px', fontWeight: '900', borderRadius: '14px', cursor: 'pointer', border: 'none' }}>PRINT RECEIPT</button>
                    <button onClick={() => navigate('/home')} style={{ padding: '16px 32px', background: 'transparent', color: '#111', fontSize: '13px', fontWeight: '900', borderRadius: '14px', cursor: 'pointer', border: '2px solid #111' }}>HOME</button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fcfcfc', fontFamily: "'Inter', sans-serif", color: '#111' }}>
            
            {loading && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #f0f0f0', borderTop: '3px solid #111', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontWeight: '900', letterSpacing: '1.5px', fontSize: '11px', color: '#111' }}>PROCESSING SECURE CHECKOUT...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* NAVBAR: COMPACT */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '60px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0' }}>
                <div onClick={() => navigate('/')} style={{ fontSize: '18px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.8px' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>
                <button onClick={() => navigate('/cart')} style={{ background: 'transparent', border: 'none', fontSize: '11px', fontWeight: '900', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ChevronLeft size={16} /> BACK TO BAG
                </button>
            </nav>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '40px', alignItems: 'start' }}>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Section 1: Identity - COMPACT */}
                        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.01)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f5f5', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} /></div>
                                <h2 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>Recipient Info</h2>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', display: 'block', marginBottom: '8px', letterSpacing: '0.8px' }}>FULL NAME</label>
                                    <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" style={inputStyle('name')} />
                                    {errors.name && <span style={{ fontSize: '10px', color: '#e63946', marginTop: '6px', display: 'block', fontWeight: '600' }}>{errors.name}</span>}
                                </div>
                                <div>
                                    <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', display: 'block', marginBottom: '8px', letterSpacing: '0.8px' }}>MOBILE NUMBER</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="09123456789" maxLength={11} style={inputStyle('phone')} />
                                    {errors.phone && <span style={{ fontSize: '10px', color: '#e63946', marginTop: '6px', display: 'block', fontWeight: '600' }}>{errors.phone}</span>}
                                </div>
                            </div>

                            {form.shippingMethod !== 'pickup' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', display: 'block', marginBottom: '8px', letterSpacing: '0.8px' }}>BARANGAY</label>
                                            <input name="barangay" value={form.barangay} onChange={handleChange} placeholder="e.g. Mabolo" style={inputStyle('barangay')} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', display: 'block', marginBottom: '8px', letterSpacing: '0.8px' }}>CITY / MUNICIPALITY (CEBU ONLY)</label>
                                            <input name="city" value={form.city} onChange={handleChange} placeholder="Cebu City" style={inputStyle('city')} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', display: 'block', marginBottom: '8px', letterSpacing: '0.8px' }}>STREET ADDRESS / HOUSE NO.</label>
                                        <input name="address" value={form.address} onChange={handleChange} placeholder="Unit No., Building, Street" style={inputStyle('address')} />
                                        {errors.address && <span style={{ fontSize: '10px', color: '#e63946', marginTop: '6px', display: 'block', fontWeight: '600' }}>{errors.address}</span>}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', display: 'block', marginBottom: '8px', letterSpacing: '0.8px' }}>LANDMARK (OPTIONAL)</label>
                                        <input name="landmark" value={form.landmark} onChange={handleChange} placeholder="e.g. Near Market" style={inputStyle('landmark')} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 2: Shipping & Payment - COMPACT */}
                        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.01)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f5f5', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Truck size={18} /></div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', margin: 0 }}>Delivery & Payment</h2>
                                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#ff7b9c', margin: '2px 0 0 0', letterSpacing: '1px' }}>CEBU LOCAL SERVICE</p>
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', display: 'block', marginBottom: '12px', letterSpacing: '0.8px' }}>SHIPPING SPEED (CEBU)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                    {[
                                        { id: 'standard', label: 'Standard', price: '₱45', time: 'Same/Next Day' },
                                        { id: 'express', label: 'Express', price: '₱95', time: 'Within 4-12 Hours' },
                                        { id: 'pickup', label: 'Pickup', price: 'FREE', time: 'Ready in 1 Hour' }
                                    ].map(s => (
                                        <div key={s.id} onClick={() => setForm({...form, shippingMethod: s.id, paymentMethod: s.id === 'pickup' ? 'pickup' : (form.paymentMethod === 'pickup' ? 'cod' : form.paymentMethod)})} style={{
                                            padding: '16px', borderRadius: '16px', border: `2px solid ${form.shippingMethod === s.id ? '#111' : '#f5f5f5'}`,
                                            background: form.shippingMethod === s.id ? '#fcfcfc' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                        }}>
                                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#111' }}>{s.label}</div>
                                            <div style={{ fontSize: '10px', color: '#e63946', fontWeight: '800', margin: '4px 0' }}>{s.price}</div>
                                            <div style={{ fontSize: '9px', color: '#bbb', fontWeight: '600' }}>{s.time}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', display: 'block', marginBottom: '12px', letterSpacing: '0.8px' }}>PAYMENT METHOD</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { id: 'cod', title: 'Cash on Delivery', sub: 'Pay at your doorstep', icon: <Truck size={18} />, hidden: form.shippingMethod === 'pickup' },
                                    { id: 'pickup', title: 'Pay at Store', sub: 'Ready for collection', icon: <Store size={18} />, hidden: form.shippingMethod !== 'pickup' }
                                ].filter(m => !m.hidden).map(m => (
                                    <div key={m.id} onClick={() => setForm({...form, paymentMethod: m.id})} style={{
                                        padding: '16px', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px',
                                        border: `2px solid ${form.paymentMethod === m.id ? '#111' : '#f5f5f5'}`,
                                        background: form.paymentMethod === m.id ? '#fcfcfc' : '#fff',
                                        transition: 'all 0.2s'
                                    }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: form.paymentMethod === m.id ? '#111' : '#f5f5f5', color: form.paymentMethod === m.id ? '#fff' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {m.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#111' }}>{m.title}</div>
                                            <div style={{ fontSize: '11px', color: '#999', fontWeight: '500' }}>{m.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={{ height: '60px', background: '#111', color: '#fff', borderRadius: '16px', border: 'none', fontSize: '14px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            COMPLETE PURCHASE <ArrowRight size={18} />
                        </button>
                    </form>

                    {/* ORDER REVIEW SIDEBAR: COMPACT */}
                    <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #f0f0f0', padding: '28px', position: 'sticky', top: '100px', boxShadow: '0 15px 40px rgba(0,0,0,0.02)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '24px', letterSpacing: '-0.5px' }}>Order Selection</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', maxHeight: '280px', overflowY: 'auto', paddingRight: '8px' }}>
                            {orderItems.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '55px', height: '65px', borderRadius: '12px', background: '#f8f8f8', overflow: 'hidden', flexShrink: 0, border: '1px solid #f0f0f0' }}>
                                        {item.imageUrl || (item.images && item.images[0]) ? (
                                            <img src={item.imageUrl || item.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👗</div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '2px', color: '#111' }}>{item.name}</div>
                                        <div style={{ fontSize: '10px', color: '#bbb', fontWeight: '700' }}>QTY: {item.quantity} · CURATED</div>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: '900' }}>₱{(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ height: '1.5px', background: '#f9f9f9', marginBottom: '24px' }} />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#888' }}>
                                <span>Subtotal</span>
                                <span style={{ color: '#111' }}>₱{subtotal.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#888' }}>
                                <span>Delivery ({form.shippingMethod.toUpperCase()})</span>
                                <span style={{ color: deliveryFee === 0 ? '#2a9d8f' : '#111', fontWeight: '900' }}>
                                    {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}
                                </span>
                            </div>
                            {couponData && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '900', color: '#2a9d8f' }}>
                                    <span>Promo ({couponData.code})</span>
                                    <span>-₱{discount.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* COUPON INPUT */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    placeholder="PROMO CODE" 
                                    value={couponCode} 
                                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #f0f0f0', fontSize: '11px', fontWeight: '900', outline: 'none' }} 
                                />
                                <button 
                                    onClick={handleApplyCoupon}
                                    disabled={couponLoading || !couponCode}
                                    style={{ padding: '0 20px', borderRadius: '10px', background: '#111', color: '#fff', border: 'none', fontSize: '11px', fontWeight: '900', cursor: 'pointer', opacity: (couponLoading || !couponCode) ? 0.5 : 1 }}
                                >
                                    {couponLoading ? '...' : 'APPLY'}
                                </button>
                            </div>
                            {couponError && <p style={{ fontSize: '10px', color: '#e63946', marginTop: '6px', fontWeight: '600' }}>{couponError}</p>}
                            {couponData && <p style={{ fontSize: '10px', color: '#2a9d8f', marginTop: '6px', fontWeight: '600' }}>Code applied!</p>}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: '#bbb', letterSpacing: '0.8px' }}>ESTIMATED TOTAL</span>
                            <span style={{ fontSize: '24px', fontWeight: '900', color: '#e63946', letterSpacing: '-1px' }}>₱{total.toLocaleString()}</span>
                        </div>

                        <div style={{ background: '#f0fff8', color: '#1b6b4a', padding: '12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <ShieldCheck size={16} /> <span>SSL SECURE PAYMENT</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckoutPage