import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { productService } from '../products/productService'
import { ShoppingBag, Star, Zap, TrendingUp, ArrowRight, CheckCircle2, ChevronRight, Search, Menu, User, ShoppingCart } from 'lucide-react'

const LandingPage = () => {
    const { isLoggedIn, isAdmin } = useAuth()
    const navigate = useNavigate()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [featured, setFeatured] = useState([])
    const [loading, setLoading] = useState(true)
    const [cartCount, setCartCount] = useState(0)
    const [orderCount, setOrderCount] = useState(0)
    const { user } = useAuth()

    const slides = [
        { bg: '#080808', tag: 'SURPLUS LUXURY', title: 'Curated Fashion,\nSurplus Prices.', sub: 'Experience premium style without the premium price tag. Hand-picked surplus items delivered with care.', cta: 'Explore Collection', accent: '#e63946' },
        { bg: '#050505', tag: 'LIMITED DROPS', title: 'Up to 70% Off\nSelected Stock.', sub: 'High-quality surplus items from top brands. Limited stock availability—once it\'s gone, it\'s gone.', cta: 'View Flash Deals', accent: '#e63946' },
        { bg: '#0a0a0a', tag: 'CONSCIOUS STYLE', title: 'Sustainable Choice,\nSuperior Design.', sub: 'Join the community of shoppers making fashion more sustainable by choosing luxury surplus.', cta: 'Start Shopping', accent: '#e63946' },
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length)
        }, 6000)
        
        const loadFeatured = async () => {
            try {
                const products = await productService.getProducts()
                setFeatured(products.slice(0, 4))
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        const syncCounts = async () => {
            if (!user) return;
            try {
                // Cart
                const cart = JSON.parse(localStorage.getItem(`cart_${user.id}`) || '[]');
                setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
                // Orders
                const { orderService } = await import('../../api/orderService');
                const ords = await orderService.getMyOrders();
                setOrderCount(orderService.getActiveCount(ords));
            } catch (e) { console.error(e); }
        }
        
        loadFeatured()
        syncCounts()

        window.addEventListener('cartUpdated', syncCounts)
        window.addEventListener('ordersUpdated', syncCounts)
        return () => {
            clearInterval(timer)
            window.removeEventListener('cartUpdated', syncCounts)
            window.removeEventListener('ordersUpdated', syncCounts)
        }
    }, [user])

    const slide = slides[currentSlide]

    const categories = [
        { name: 'Tops', emoji: '👕', count: '120+ Items' },
        { name: 'Dresses', emoji: '👗', count: '85+ Items' },
        { name: 'Bottoms', emoji: '👖', count: '94+ Items' },
        { name: 'Accessories', emoji: '👜', count: '150+ Items' },
    ]

    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Inter', sans-serif", color: '#111' }}>

            {/* PREMIUM NAVBAR */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 32px', height: '60px',
                background: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
                <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>
                
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '32px', fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>
                    <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'} onClick={() => navigate('/home')}>SHOP FEED</span>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {isLoggedIn ? (
                        <>
                            <div onClick={() => navigate('/cart')} style={{ position: 'relative', cursor: 'pointer', color: '#fff' }}>
                                <ShoppingCart size={20} strokeWidth={2.5} />
                                {cartCount > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '-5px', right: '-6px',
                                        minWidth: '16px', height: '16px', borderRadius: '50%',
                                        background: '#e63946', color: '#fff', fontSize: '9px', fontWeight: '900',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #111', padding: '0 2px'
                                    }}>{cartCount}</div>
                                )}
                            </div>
                            <div onClick={() => navigate(isAdmin ? '/admin' : '/profile')} style={{ position: 'relative', cursor: 'pointer', color: '#fff' }}>
                                <User size={20} strokeWidth={2.5} />
                                {orderCount > 0 && !isAdmin && (
                                    <div style={{
                                        position: 'absolute', top: '-5px', right: '-6px',
                                        minWidth: '16px', height: '16px', borderRadius: '50%',
                                        background: '#fff', color: '#111', fontSize: '9px', fontWeight: '900',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #111', padding: '0 2px'
                                    }}>{orderCount}</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigate('/login')} style={{
                                padding: '10px 20px', borderRadius: '12px', fontSize: '11px',
                                fontWeight: '900', background: 'transparent', color: '#fff',
                                border: '1.5px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s'
                            }} onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.target.style.background = 'transparent'}>LOG IN</button>
                            <button onClick={() => navigate('/register')} style={{
                                padding: '10px 20px', borderRadius: '12px', fontSize: '11px',
                                fontWeight: '900', background: '#fff', color: '#111', cursor: 'pointer',
                                border: 'none', transition: 'all 0.2s'
                            }} onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.target.style.transform = 'translateY(0)'}>SIGN UP</button>
                        </>
                    )}
                </div>
            </nav>

            {/* CINEMATIC HERO SECTION */}
            <div style={{
                height: '80vh', background: slide.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', textAlign: 'center',
                transition: 'background 1.2s ease',
                padding: '60px 40px 0', position: 'relative', overflow: 'hidden'
            }}>
                {/* Background Glow */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '80vw', height: '80vh',
                    background: 'radial-gradient(circle, rgba(230, 57, 70, 0.08) 0%, transparent 70%)',
                    zIndex: 1
                }} />

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ 
                        fontSize: '11px', fontWeight: '900', letterSpacing: '4px', color: '#e63946', 
                        marginBottom: '20px', textTransform: 'uppercase', animation: 'fadeInDown 1s ease'
                    }}>
                        {slide.tag}
                    </div>
                    <h1 style={{ 
                        fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: '900', color: '#ffffff', 
                        lineHeight: 1, marginBottom: '24px', whiteSpace: 'pre-line', letterSpacing: '-2px',
                        animation: 'fadeInUp 1s ease'
                    }}>
                        {slide.title}
                    </h1>
                    <p style={{ 
                        fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginBottom: '40px', 
                        maxWidth: '500px', margin: '0 auto 40px', fontWeight: '500', lineHeight: 1.5,
                        animation: 'fadeInUp 1.2s ease'
                    }}>
                        {slide.sub}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', animation: 'fadeInUp 1.4s ease' }}>
                        <button onClick={() => navigate('/home')} style={{ 
                            padding: '16px 40px', background: '#e63946', color: '#fff', 
                            fontSize: '13px', fontWeight: '900', borderRadius: '12px', 
                            letterSpacing: '0.5px', cursor: 'pointer', border: 'none', 
                            transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '10px',
                            boxShadow: '0 15px 30px rgba(230, 57, 70, 0.2)'
                        }} onMouseEnter={e => e.target.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.target.style.transform = 'translateY(0)'}>
                            {slide.cta.toUpperCase()} <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', position: 'absolute', bottom: '60px', zIndex: 2 }}>
                    {slides.map((_, i) => (
                        <div key={i} onClick={() => setCurrentSlide(i)} style={{ 
                            width: i === currentSlide ? '48px' : '12px', height: '6px', 
                            borderRadius: '10px', background: i === currentSlide ? '#e63946' : 'rgba(255,255,255,0.2)', 
                            cursor: 'pointer', transition: 'all 0.5s'
                        }} />
                    ))}
                </div>
            </div>

            {/* TRUST BADGES */}
            <div style={{ 
                padding: '24px 32px', background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px'
            }}>
                {[
                    { icon: <CheckCircle2 color="#e63946" />, text: 'VERIFIED SURPLUS QUALITY' },
                    { icon: <Zap color="#e63946" />, text: 'INSTANT STYLE UPDATES' },
                    { icon: <Star color="#e63946" />, text: 'TOP-RATED CUSTOMER CARE' },
                    { icon: <TrendingUp color="#e63946" />, text: 'SUSTAINABLE FASHION CHOICE' }
                ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', fontSize: '11px', fontWeight: '900', letterSpacing: '1.5px' }}>
                        {item.icon} {item.text}
                    </div>
                ))}
            </div>

            {/* PREMIUM CATEGORIES */}
            <div style={{ padding: '60px 32px', textAlign: 'center', background: '#fff' }}>
                <div style={{ marginBottom: '40px' }}>
                    <p style={{ fontSize: '10px', letterSpacing: '4px', fontWeight: '900', color: '#e63946', marginBottom: '12px' }}>EXPLORE THE FEED</p>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>Curated Categories</h2>
                </div>
                
                <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                        <div key={cat.name} onClick={() => navigate('/home')} style={{ 
                            padding: '32px 24px', borderRadius: '24px', background: '#fafafa', 
                            border: '1.5px solid #f0f0f0', cursor: 'pointer', transition: 'all 0.3s', 
                            minWidth: '180px', position: 'relative', overflow: 'hidden'
                        }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.transform = 'translateY(-6px)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{cat.emoji}</div>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#111', marginBottom: '4px' }}>{cat.name}</div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#bbb' }}>{cat.count}</div>
                            <div style={{ position: 'absolute', bottom: '20px', right: '20px', color: '#e63946', opacity: 0 }}>
                                <ChevronRight size={24} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TRENDING NOW: PREMIUM GRID */}
            <div style={{ padding: '60px 32px', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', maxWidth: '1200px', margin: '0 auto 40px' }}>
                    <div>
                        <p style={{ fontSize: '10px', letterSpacing: '4px', fontWeight: '900', color: '#e63946', marginBottom: '12px' }}>LIVE TRENDS</p>
                        <h2 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>Trending Now</h2>
                    </div>
                    <button onClick={() => navigate('/home')} style={{
                        padding: '12px 24px', background: '#fff', border: '1.5px solid #111',
                        borderRadius: '12px', fontWeight: '900', fontSize: '11px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        VIEW FEED <ChevronRight size={14} />
                    </button>
                </div>
                
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid #eee', borderTop: '3px solid #e63946', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                        {featured.map(item => (
                            <div key={item.id} onClick={() => navigate(`/product/${item.id}`)} style={{ 
                                borderRadius: '24px', overflow: 'hidden', background: '#fff', 
                                border: '1px solid #f0f0f0', cursor: 'pointer', transition: 'all 0.4s' 
                            }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.05)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                                <div style={{ height: '300px', background: '#f5f5f5', overflow: 'hidden', position: 'relative' }}>
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>👗</div>
                                    )}
                                    <div style={{ 
                                        position: 'absolute', top: '16px', left: '16px', background: '#111', 
                                        color: '#fff', fontSize: '9px', fontWeight: '900', padding: '6px 12px', 
                                        borderRadius: '8px', letterSpacing: '1px' 
                                    }}>NEW IN</div>
                                </div>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#e63946', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{item.category}</div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#111', marginBottom: '8px', letterSpacing: '-0.3px' }}>{item.name}</div>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#111' }}>₱{item.price.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PRE-FOOTER CTA */}
            <div style={{ 
                padding: '80px 32px', background: '#111', color: '#fff', textAlign: 'center',
                position: 'relative', overflow: 'hidden'
            }}>
                 <div style={{
                    position: 'absolute', bottom: '-20%', right: '-10%', width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(230, 57, 70, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%'
                }} />
                
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <h2 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '24px', letterSpacing: '-2px' }}>Ready to catch some deals?</h2>
                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', maxWidth: '500px', margin: '0 auto 40px', fontWeight: '500' }}>
                        Join over 50,000 fashion lovers who never pay full price.
                    </p>
                    <button onClick={() => navigate('/register')} style={{ 
                        padding: '16px 48px', background: '#fff', color: '#111', 
                        fontSize: '14px', fontWeight: '900', borderRadius: '14px', 
                        cursor: 'pointer', border: 'none', transition: 'all 0.3s' 
                    }} onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                        CREATE FREE ACCOUNT
                    </button>
                </div>
            </div>

            {/* BOUTIQUE FOOTER */}
            <footer style={{ background: '#0a0a0a', color: '#fff', padding: '100px 60px 40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: '100px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1.5', minWidth: '300px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '32px', letterSpacing: '-1px' }}>PACKAGE<span style={{ color: '#e63946' }}>CATCH</span></div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', fontSize: '16px', marginBottom: '32px' }}>
                            We specialize in sourcing the finest surplus fashion from around the globe. Premium quality, sustainable choices, and prices that make sense.
                        </p>

                    </div>
                    
                    <div style={{ display: 'flex', gap: '100px', flex: '1' }}>
                        <div>
                            <h4 style={{ fontSize: '13px', fontWeight: '900', marginBottom: '32px', color: '#fff', letterSpacing: '2px' }}>DISCOVER</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>Trending</span>
                                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>New Arrivals</span>
                                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>Flash Sale</span>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '13px', fontWeight: '900', marginBottom: '32px', color: '#fff', letterSpacing: '2px' }}>COMPANY</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                                <span style={{ cursor: 'pointer' }}>About Us</span>
                                <span style={{ cursor: 'pointer' }}>Sustainability</span>
                                <span style={{ cursor: 'pointer' }}>Contact</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style={{ maxWidth: '1200px', margin: '100px auto 0', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontWeight: '700', letterSpacing: '1px' }}>
                    © 2026 PACKAGE CATCH ENTERPRISE. ALL RIGHTS RESERVED. DESIGNED FOR THE MODERN SHOPPER.
                </div>
            </footer>

            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                body { margin: 0; }
            `}</style>
        </div>
    )
}

export default LandingPage