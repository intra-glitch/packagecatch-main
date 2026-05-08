import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabaseClient'

const CartPage = () => {
    const navigate = useNavigate()
    const [cartItems, setCartItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('cart') || '[]')
        } catch {
            return []
        }
    })

    // Update localStorage whenever cartItems change
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems))
    }, [cartItems])
    const [notification, setNotification] = useState('')

    useEffect(() => {
        const testSupabaseConnection = async () => {
            try {
                const { data, error } = await supabase.auth.getSession()
                if (error) {
                    console.error('Supabase connection error:', error.message)
                } else {
                    console.log('Supabase connected successfully! Current session:', data.session)
                }
            } catch (err) {
                console.error('Unexpected error connecting to Supabase:', err)
            }
        }
        
        testSupabaseConnection()
    }, [])

    const showNotif = (msg) => {
        setNotification(msg)
        setTimeout(() => setNotification(''), 2500)
    }

    const updateQuantity = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id !== id) return item
            const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta))
            return { ...item, quantity: newQty }
        }))
    }

    const removeItem = (id) => {
        const item = cartItems.find(i => i.id === id)
        setCartItems(prev => prev.filter(i => i.id !== id))
        showNotif(`${item.name} removed from cart`)
    }

    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const deliveryFee = cartItems.length === 0 ? 0 : subtotal >= 200 ? 0 : 70
    const total = subtotal + deliveryFee

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>

            {/* TOAST */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '32px', left: '50%',
                    transform: 'translateX(-50%)', zIndex: 999,
                    background: '#111', color: '#fff', padding: '14px 28px',
                    borderRadius: '40px', fontSize: '14px', fontWeight: '600',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}>
                    {notification}
                </div>
            )}

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
                <span onClick={() => navigate('/home')} style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#555' }}>
          ← Continue Shopping
        </span>
            </nav>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 48px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>Your Cart</h1>
                <p style={{ fontSize: '14px', color: '#999', marginBottom: '40px' }}>
                    {cartItems.length === 0 ? 'Your cart is empty.' : `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your cart`}
                </p>

                {cartItems.length === 0 ? (
                    /* EMPTY STATE */
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ fontSize: '72px', marginBottom: '24px' }}>🛒</div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Your cart is empty</h2>
                        <p style={{ fontSize: '15px', color: '#888', marginBottom: '32px' }}>Looks like you haven't added anything yet.</p>
                        <button onClick={() => navigate('/home')} style={{
                            padding: '14px 40px', background: '#111', color: '#fff',
                            fontSize: '15px', fontWeight: '700', borderRadius: '8px', cursor: 'pointer',
                        }}>Start Shopping</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>

                        {/* CART ITEMS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* Reservation notice */}
                            <div style={{
                                background: '#fff8e1', border: '1px solid #ffe082',
                                borderRadius: '10px', padding: '12px 16px',
                                fontSize: '13px', color: '#b8860b', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                ⏱ Items in your cart are reserved for 10 minutes
                            </div>

                            {cartItems.map(item => (
                                <div key={item.id} style={{
                                    background: '#fff', borderRadius: '12px',
                                    border: '1px solid #f0f0f0', padding: '20px',
                                    display: 'flex', gap: '20px', alignItems: 'center',
                                }}>
                                    {/* Thumbnail */}
                                    <div onClick={() => navigate(`/product/${item.id}`)} style={{
                                        width: '100px', height: '100px', borderRadius: '10px',
                                        background: item.bg, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '40px', flexShrink: 0, cursor: 'pointer',
                                    }}>👗</div>

                                    {/* Details */}
                                    <div style={{ flex: 1 }}>
                                        <div onClick={() => navigate(`/product/${item.id}`)} style={{
                                            fontSize: '16px', fontWeight: '700', marginBottom: '4px', cursor: 'pointer',
                                        }}>{item.name}</div>
                                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>Size: {item.size}</div>

                                        {/* Low stock warning */}
                                        {item.stock <= 3 && (
                                            <div style={{ fontSize: '12px', color: '#f4a261', fontWeight: '600', marginBottom: '8px' }}>
                                                ⚠ Only {item.stock} left in stock
                                            </div>
                                        )}

                                        {/* Quantity controls */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1.5px solid #e0e0e0', borderRadius: '8px', width: 'fit-content' }}>
                                            <button onClick={() => updateQuantity(item.id, -1)} style={{
                                                width: '36px', height: '36px', background: 'transparent',
                                                border: 'none', fontSize: '18px', cursor: 'pointer', color: '#111',
                                            }}>−</button>
                                            <span style={{ width: '36px', textAlign: 'center', fontSize: '15px', fontWeight: '700' }}>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} style={{
                                                width: '36px', height: '36px', background: 'transparent',
                                                border: 'none', fontSize: '18px', cursor: 'pointer', color: '#111',
                                            }}>+</button>
                                        </div>
                                    </div>

                                    {/* Price + Remove */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', flexShrink: 0 }}>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#e63946' }}>
                                            ₱{item.price * item.quantity}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#bbb' }}>₱{item.price} each</div>
                                        <button onClick={() => removeItem(item.id)} style={{
                                            background: 'transparent', border: 'none', cursor: 'pointer',
                                            fontSize: '13px', color: '#ccc', fontWeight: '600',
                                            padding: '4px 0',
                                            transition: 'color 0.2s',
                                        }}
                                                onMouseEnter={e => e.target.style.color = '#e63946'}
                                                onMouseLeave={e => e.target.style.color = '#ccc'}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ORDER SUMMARY */}
                        <div style={{
                            background: '#fff', borderRadius: '16px',
                            border: '1px solid #f0f0f0', padding: '28px',
                            position: 'sticky', top: '88px',
                        }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Order Summary</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                                {cartItems.map(item => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#666' }}>{item.name} × {item.quantity}</span>
                                        <span style={{ fontWeight: '600' }}>₱{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '16px' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                                <span style={{ color: '#777' }}>Subtotal</span>
                                <span style={{ fontWeight: '600' }}>₱{subtotal}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '20px' }}>
                                <span style={{ color: '#777' }}>Delivery fee</span>
                                <span style={{ fontWeight: '600', color: deliveryFee === 0 ? '#2a9d8f' : '#111' }}>
                  {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}
                </span>
                            </div>

                            {deliveryFee > 0 && (
                                <div style={{
                                    background: '#f0fff8', border: '1px solid #b7e4c7',
                                    borderRadius: '8px', padding: '10px 14px',
                                    fontSize: '12px', color: '#2a9d8f', fontWeight: '600',
                                    marginBottom: '20px',
                                }}>
                                    Add ₱{200 - subtotal} more for FREE delivery!
                                </div>
                            )}

                            <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '16px' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', marginBottom: '28px' }}>
                                <span>Total</span>
                                <span style={{ color: '#e63946' }}>₱{total}</span>
                            </div>

                            <button onClick={() => navigate('/checkout')} style={{
                                width: '100%', padding: '16px', background: '#111',
                                color: '#fff', fontSize: '15px', fontWeight: '700',
                                borderRadius: '8px', cursor: 'pointer',
                                marginBottom: '12px',
                            }}>
                                Proceed to Checkout →
                            </button>

                            <button onClick={() => navigate('/home')} style={{
                                width: '100%', padding: '14px', background: 'transparent',
                                color: '#555', fontSize: '14px', fontWeight: '600',
                                borderRadius: '8px', cursor: 'pointer',
                                border: '1.5px solid #e0e0e0',
                            }}>
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CartPage