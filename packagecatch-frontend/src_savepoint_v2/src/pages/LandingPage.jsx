import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const LandingPage = () => {
    const navigate = useNavigate()
    const [currentSlide, setCurrentSlide] = useState(0)

    const slides = [
        {
            bg: '#1a1a1a',
            tag: 'NEW ARRIVALS',
            title: 'Affordable Surplus Fashion,\nDelivered to You.',
            sub: 'Premium quality pieces at unbeatable prices.',
            cta: 'Shop Now',
            accent: '#ffffff',
        },
        {
            bg: '#0f3460',
            tag: 'FLASH SALE',
            title: 'Up to 70% Off\nSelected Items.',
            sub: 'Limited stocks only. Grab yours before it\'s gone.',
            cta: 'See Deals',
            accent: '#ffd700',
        },
        {
            bg: '#1b4332',
            tag: 'BEST SELLERS',
            title: 'What Everyone\nis Wearing.',
            sub: 'Top picks from our community of shoppers.',
            cta: 'Explore',
            accent: '#ffffff',
        },
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length)
        }, 4000)
        return () => clearInterval(timer)
    }, [])

    const slide = slides[currentSlide]

    const categories = [
        { name: 'Tops', emoji: '👕' },
        { name: 'Dresses', emoji: '👗' },
        { name: 'Bottoms', emoji: '👖' },
        { name: 'Accessories', emoji: '👜' },
    ]

    const featured = [
        { id: 1, name: 'Oversized Hoodie', price: '₱299', tag: 'NEW', bg: '#f5f5f5' },
        { id: 2, name: 'Floral Midi Dress', price: '₱459', tag: 'BEST SELLER', bg: '#fff0f3' },
        { id: 3, name: 'Cargo Pants', price: '₱389', tag: 'FLASH SALE', bg: '#f0f4ff' },
        { id: 4, name: 'Bucket Hat', price: '₱149', tag: 'NEW', bg: '#f5fff0' },
    ]

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>

            {/* NAVBAR */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 48px', height: '64px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid #f0f0f0',
            }}>
                <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>
                <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: '500' }}>
                    <span style={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>Shop</span>
                    <span style={{ cursor: 'pointer' }}>About</span>
                    <span style={{ cursor: 'pointer' }}>FAQ</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => navigate('/login')} style={{
                        padding: '8px 20px', borderRadius: '6px', fontSize: '14px',
                        fontWeight: '600', background: 'transparent',
                        border: '1.5px solid #111', cursor: 'pointer',
                    }}>Log in</button>
                    <button onClick={() => navigate('/register')} style={{
                        padding: '8px 20px', borderRadius: '6px', fontSize: '14px',
                        fontWeight: '600', background: '#111', color: '#fff', cursor: 'pointer',
                    }}>Sign up</button>
                </div>
            </nav>

            {/* HERO SECTION */}
            <div style={{
                height: '100vh', background: slide.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', textAlign: 'center',
                transition: 'background 0.8s ease',
                padding: '0 24px',
            }}>
                <div style={{
                    fontSize: '11px', fontWeight: '700', letterSpacing: '4px',
                    color: slide.accent, opacity: 0.7, marginBottom: '20px',
                }}>{slide.tag}</div>
                <h1 style={{
                    fontSize: 'clamp(36px, 6vw, 80px)', fontWeight: '900',
                    color: '#ffffff', lineHeight: 1.1, marginBottom: '20px',
                    whiteSpace: 'pre-line',
                }}>{slide.title}</h1>
                <p style={{
                    fontSize: '18px', color: 'rgba(255,255,255,0.7)',
                    marginBottom: '40px', maxWidth: '480px',
                }}>{slide.sub}</p>
                <button onClick={() => navigate('/home')} style={{
                    padding: '16px 48px', background: '#fff', color: '#111',
                    fontSize: '15px', fontWeight: '700', borderRadius: '4px',
                    letterSpacing: '1px', cursor: 'pointer',
                    transition: 'transform 0.2s',
                }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                >{slide.cta}</button>

                {/* Slide dots */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '48px' }}>
                    {slides.map((_, i) => (
                        <div key={i} onClick={() => setCurrentSlide(i)} style={{
                            width: i === currentSlide ? '24px' : '8px', height: '8px',
                            borderRadius: '4px', background: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer', transition: 'width 0.3s',
                            opacity: i === currentSlide ? 1 : 0.4,
                        }} />
                    ))}
                </div>
            </div>

            {/* CATEGORIES */}
            <div style={{ padding: '80px 48px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: '700', color: '#999', marginBottom: '8px' }}>BROWSE BY</p>
                <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '48px' }}>Shop by Category</h2>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                        <div key={cat.name} onClick={() => navigate('/home')} style={{
                            padding: '32px 48px', borderRadius: '12px', background: '#f5f5f5',
                            cursor: 'pointer', transition: 'all 0.2s', minWidth: '160px',
                        }}
                             onMouseEnter={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#fff' }}
                             onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#111' }}
                        >
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{cat.emoji}</div>
                            <div style={{ fontSize: '15px', fontWeight: '700' }}>{cat.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FEATURED PRODUCTS */}
            <div style={{ padding: '0 48px 80px', background: '#fafafa' }}>
                <div style={{ textAlign: 'center', paddingTop: '80px', marginBottom: '48px' }}>
                    <p style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: '700', color: '#999', marginBottom: '8px' }}>HANDPICKED</p>
                    <h2 style={{ fontSize: '32px', fontWeight: '800' }}>Trending Now</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
                    {featured.map(item => (
                        <div key={item.id} onClick={() => navigate(`/product/${item.id}`)} style={{
                            borderRadius: '12px', overflow: 'hidden', background: '#fff',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                             onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
                             onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
                        >
                            <div style={{ height: '260px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '64px' }}>👗</span>
                            </div>
                            <div style={{ padding: '16px' }}>
                <span style={{
                    fontSize: '10px', fontWeight: '700', letterSpacing: '2px',
                    background: '#111', color: '#fff', padding: '3px 8px', borderRadius: '3px',
                }}>{item.tag}</span>
                                <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '10px' }}>{item.name}</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#e63946', marginTop: '4px' }}>{item.price}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '48px' }}>
                    <button onClick={() => navigate('/home')} style={{
                        padding: '14px 48px', background: '#111', color: '#fff',
                        fontSize: '14px', fontWeight: '700', borderRadius: '4px',
                        letterSpacing: '1px', cursor: 'pointer',
                    }}>View All Products</button>
                </div>
            </div>

            {/* FOOTER */}
            <footer style={{
                background: '#111', color: '#fff', padding: '48px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '24px',
            }}>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>
                <div style={{ display: 'flex', gap: '32px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ cursor: 'pointer' }}>About</span>
                    <span style={{ cursor: 'pointer' }}>FAQ</span>
                    <span style={{ cursor: 'pointer' }}>Contact</span>
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                    © 2025 PackageCatch. All rights reserved.
                </div>
            </footer>

        </div>
    )
}

export default LandingPage