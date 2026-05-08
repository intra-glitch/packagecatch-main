import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartService } from '../../api/cartService'
import { useAuth } from '../auth/AuthContext'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ChevronRight, Check, Package, Truck, ShieldCheck } from 'lucide-react'

const CartPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [cartItems, setCartItems] = useState([])
    const [notification, setNotification] = useState('')
    const [isProceeding, setIsProceeding] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Initial load
    useEffect(() => {
        if (user) {
            const items = cartService.getCart(user.id)
            setCartItems(items.map(item => ({ ...item, selected: item.selected ?? true })))
            setIsLoaded(true)
        }
    }, [user])

    // Save changes
    useEffect(() => {
        if (isLoaded && user) {
            cartService.saveCart(user.id, cartItems)
        }
    }, [cartItems, user, isLoaded])

    const showNotif = (msg) => {
        setNotification(msg)
        setTimeout(() => setNotification(''), 2500)
    }

    const toggleSelect = (id) => {
        setCartItems(prev => prev.map(item => 
            item.id === id ? { ...item, selected: !item.selected } : item
        ))
    }

    const toggleSelectAll = () => {
        const allSelected = cartItems.every(item => item.selected)
        setCartItems(prev => prev.map(item => ({ ...item, selected: !allSelected })))
    }

    const updateQuantity = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id !== id) return item
            const newQty = Math.max(1, Math.min(item.stockQuantity || 99, item.quantity + delta))
            return { ...item, quantity: newQty }
        }))
    }

    const removeItem = (id) => {
        const item = cartItems.find(i => i.id === id)
        setCartItems(prev => prev.filter(i => i.id !== id))
        showNotif(`${item.name} removed`)
    }

    const selectedItems = cartItems.filter(item => item.selected)
    const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const deliveryFee = selectedItems.length === 0 ? 0 : subtotal >= 150 ? 0 : 70
    const total = subtotal + deliveryFee

    const handleProceed = () => {
        if (selectedItems.length === 0) {
            showNotif('Select items to checkout')
            return
        }
        setIsProceeding(true)
        localStorage.setItem('checkout_items', JSON.stringify(selectedItems))
        localStorage.removeItem('buy_now_item')
        
        setTimeout(() => {
            navigate('/checkout')
        }, 1200)
    }

    if (isProceeding) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fff', gap: '16px' }}>
                <div style={{ width: '32px', height: '32px', border: '2px solid #f0f0f0', borderTop: '2px solid #e63946', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontWeight: '900', color: '#111', letterSpacing: '1px', fontSize: '10px' }}>PREPARING SECURE CHECKOUT...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fcfcfc', fontFamily: "'Inter', sans-serif", color: '#111' }}>

            {/* NOTIFICATION: NANO */}
            {notification && (
                <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#111', color: '#fff', padding: '10px 20px', borderRadius: '50px', fontSize: '11px', fontWeight: '900', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', animation: 'slideUp 0.4s ease' }}>
                    {notification.toUpperCase()}
                </div>
            )}

            {/* NAVBAR: ULTRA-COMPACT */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '60px', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0' }}>
                <div onClick={() => navigate('/')} style={{ fontSize: '18px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.5px' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>
                <button onClick={() => navigate('/home')} style={{ background: 'transparent', border: 'none', fontSize: '10px', fontWeight: '900', color: '#bbb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} /> CONTINUE SHOPPING
                </button>
            </nav>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 32px' }}>
                
                {/* PAGE HEADER: ULTRA-COMPACT */}
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.8px', marginBottom: '2px' }}>Shopping Bag</h1>
                        <p style={{ fontSize: '12px', color: '#bbb', fontWeight: '500' }}>You have {cartItems.length} curated pieces.</p>
                    </div>
                    {cartItems.length > 0 && (
                        <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', color: '#111', fontSize: '10px', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px', textDecoration: 'underline' }}>
                            {cartItems.every(i => i.selected) ? 'DESELECT ALL' : 'SELECT ALL'}
                        </button>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: '24px', border: '1.5px dashed #f0f0f0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛍️</div>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '8px' }}>Your bag is waiting.</h2>
                        <button onClick={() => navigate('/home')} style={{ padding: '12px 32px', background: '#111', color: '#fff', fontSize: '12px', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', border: 'none' }}>EXPLORE THE FEED</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>

                        {/* ITEMS LIST: ULTRA-COMPACT */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {cartItems.map(item => (
                                <div key={item.id} style={{
                                    background: '#fff', borderRadius: '16px', 
                                    border: item.selected ? '1.5px solid #111' : '1px solid #f0f0f0',
                                    padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', position: 'relative',
                                    transition: 'all 0.2s'
                                }}>
                                    
                                    <div onClick={() => toggleSelect(item.id)} style={{
                                        width: '18px', height: '18px', borderRadius: '6px', cursor: 'pointer',
                                        border: '1.5px solid #111', background: item.selected ? '#111' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0
                                    }}>
                                        {item.selected && <Check size={12} color="#fff" strokeWidth={3} />}
                                    </div>

                                    <div onClick={() => navigate(`/product/${item.id}`)} style={{
                                        width: '80px', height: '100px', borderRadius: '10px', background: '#f7f7f7',
                                        overflow: 'hidden', flexShrink: 0, cursor: 'pointer', border: '1px solid #eee'
                                    }}>
                                        {item.imageUrl || (item.images && item.images[0]) ? (
                                            <img src={item.imageUrl || item.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👗</div>
                                        )}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div onClick={() => navigate(`/product/${item.id}`)} style={{ fontSize: '16px', fontWeight: '900', marginBottom: '2px', cursor: 'pointer', letterSpacing: '-0.3px', lineHeight: '1.2' }}>{item.name}</div>
                                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#e63946', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.category || 'Surplus'}</div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8f8f8', borderRadius: '8px', width: 'fit-content', padding: '2px', border: '1px solid #eee' }}>
                                            <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <Minus size={10} strokeWidth={3} />
                                            </button>
                                            <span style={{ width: '28px', textAlign: 'center', fontWeight: '900', fontSize: '13px' }}>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <Plus size={10} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#111' }}>₱{(item.price * item.quantity).toLocaleString()}</div>
                                        <button onClick={() => removeItem(item.id)} style={{ background: '#fff', border: '1px solid #eee', color: '#ddd', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ORDER SUMMARY: ULTRA-COMPACT */}
                        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', padding: '24px', position: 'sticky', top: '90px', boxShadow: '0 10px 30px rgba(0,0,0,0.01)' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '20px', letterSpacing: '-0.3px' }}>Summary</h2>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600' }}>
                                    <span style={{ color: '#bbb' }}>Items</span>
                                    <span style={{ color: '#111' }}>₱{subtotal.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600' }}>
                                    <span style={{ color: '#bbb' }}>Delivery</span>
                                    <span style={{ color: deliveryFee === 0 ? '#2a9d8f' : '#111', fontWeight: '900' }}>
                                        {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}
                                    </span>
                                </div>
                                
                                <div style={{ background: '#f0fff8', color: '#1b6b4a', padding: '10px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <ShieldCheck size={12} /> <span>SECURE CHECKOUT</span>
                                </div>
                            </div>

                            <div style={{ height: '1px', background: '#f9f9f9', marginBottom: '20px' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '900', color: '#bbb', letterSpacing: '0.5px' }}>TOTAL</span>
                                <span style={{ fontSize: '22px', fontWeight: '900', color: '#e63946', letterSpacing: '-0.8px' }}>₱{total.toLocaleString()}</span>
                            </div>

                            <button onClick={handleProceed} style={{ 
                                width: '100%', height: '52px', background: '#111', color: '#fff', borderRadius: '12px', 
                                fontSize: '13px', fontWeight: '900', cursor: 'pointer', border: 'none', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}>
                                CHECKOUT <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
                body { margin: 0; }
            `}</style>
        </div>
    )
}

export default CartPage