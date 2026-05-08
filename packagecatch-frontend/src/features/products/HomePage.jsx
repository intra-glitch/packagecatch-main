import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productService } from '../../api/productService'
import { cartService } from '../../api/cartService'
import { orderService } from '../../api/orderService'
import { useAuth } from '../auth/AuthContext'
import { Search, ShoppingCart, User, Filter, SlidersHorizontal, Package, ArrowRight, Heart } from 'lucide-react'
import { AuthModal } from '../../shared'

const HomePage = () => {
    const navigate = useNavigate()
    const { isAdmin, user, isLoggedIn } = useAuth()
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const [cartCount, setCartCount] = useState(0)
    const [notification, setNotification] = useState('')
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [orderCount, setOrderCount] = useState(0)

    const categories = ['All', 'Tops', 'Dresses', 'Bottoms', 'Accessories']

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await productService.getAll()
                setProducts(data)
            } catch (err) {
                console.error("Failed to fetch products:", err)
            } finally {
                setLoading(false)
            }
        }
        
        const syncCartCount = () => {
            const cart = cartService.getCart(user?.id)
            setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0))
        }

        const syncOrderCount = async () => {
            if (!user) return;
            try {
                const ords = await orderService.getMyOrders();
                setOrderCount(orderService.getActiveCount(ords));
            } catch (e) { console.error(e); }
        }
        
        syncCartCount()
        syncOrderCount()
        loadProducts()

        // Listen for updates
        window.addEventListener('cartUpdated', syncCartCount)
        window.addEventListener('ordersUpdated', syncOrderCount)
        return () => {
            window.removeEventListener('cartUpdated', syncCartCount)
            window.removeEventListener('ordersUpdated', syncOrderCount)
        }
    }, [user])

    const tagStyles = {
        'NEW': { bg: '#111', color: '#fff' },
        'BEST SELLER': { bg: '#e63946', color: '#fff' },
        'FLASH SALE': { bg: '#ff9f1c', color: '#fff' },
    }

    const filtered = products.filter(p => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
    })

    return (
        <div style={{ minHeight: '100vh', background: '#fcfcfc', fontFamily: "'Inter', sans-serif", color: '#111' }}>

            {/* PREMIUM NOTIFICATION */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '40px', left: '50%',
                    transform: 'translateX(-50%)', zIndex: 1000,
                    background: '#111', color: '#fff', 
                    padding: '16px 32px', borderRadius: '16px',
                    fontSize: '12px', fontWeight: '900', letterSpacing: '1px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    animation: 'slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={12} color="#fff" />
                    </div>
                    {notification.toUpperCase()}
                </div>
            )}

            {/* ULTRA-SLEEK NAVBAR: 60PX */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 32px', height: '60px',
                background: 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid #f0f0f0',
                gap: '24px',
            }}>
                {/* Minimal Logo */}
                <div onClick={() => navigate('/')} style={{
                    fontSize: '18px', fontWeight: '900', cursor: 'pointer', flexShrink: 0,
                    letterSpacing: '-0.5px'
                }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>

                {/* Minimal Search Bar */}
                <div style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
                    <Search size={14} style={{
                        position: 'absolute', left: '14px', top: '50%',
                        transform: 'translateY(-50%)', color: '#bbb',
                    }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search surplus gems..."
                        style={{
                            width: '100%', padding: '10px 14px 10px 40px',
                            borderRadius: '12px', fontSize: '13px',
                            border: '1px solid #f0f0f0', background: '#f9f9f9',
                            transition: 'all 0.3s', outline: 'none', fontWeight: '500'
                        }}
                        onFocus={e => { e.target.style.borderColor = '#111'; e.target.style.background = '#fff'; }}
                        onBlur={e => { e.target.style.borderColor = '#f0f0f0'; e.target.style.background = '#f9f9f9'; }}
                    />
                </div>

                {/* Minimal Action Icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                    <div onClick={() => {
                        if (!isLoggedIn) {
                            setShowAuthModal(true);
                            return;
                        }
                        navigate('/cart');
                    }} style={{
                        position: 'relative', cursor: 'pointer', color: '#111', transition: 'transform 0.2s'
                    }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <ShoppingCart size={20} strokeWidth={2.5} />
                        {isLoggedIn && cartCount > 0 && (
                            <div style={{
                                position: 'absolute', top: '-5px', right: '-6px',
                                minWidth: '16px', height: '16px', borderRadius: '50%',
                                background: '#e63946', color: '#fff',
                                fontSize: '9px', fontWeight: '900',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid #fff', padding: '0 2px'
                            }}>{cartCount}</div>
                        )}
                    </div>
                    <div onClick={() => {
                        if (!isLoggedIn) {
                            setShowAuthModal(true);
                            return;
                        }
                        navigate(isAdmin ? '/admin' : '/profile');
                    }} style={{ position: 'relative', cursor: 'pointer', color: '#111', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <User size={20} strokeWidth={2.5} />
                        {isLoggedIn && orderCount > 0 && !isAdmin && (
                            <div style={{
                                position: 'absolute', top: '-5px', right: '-6px',
                                minWidth: '16px', height: '16px', borderRadius: '50%',
                                background: '#111', color: '#fff',
                                fontSize: '9px', fontWeight: '900',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid #fff', padding: '0 2px'
                            }}>{orderCount}</div>
                        )}
                    </div>
                </div>
            </nav>

            {/* ULTRA-COMPACT CATEGORY BAR */}
            <div style={{
                display: 'flex', gap: '10px', padding: '12px 32px',
                background: '#fff', borderBottom: '1px solid #f0f0f0', overflowX: 'auto',
                scrollbarWidth: 'none', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px', color: '#bbb', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>
                    <SlidersHorizontal size={14} /> FILTERS
                </div>
                {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                        padding: '6px 18px', borderRadius: '10px', fontSize: '11px',
                        fontWeight: '900', cursor: 'pointer', flexShrink: 0,
                        background: activeCategory === cat ? '#111' : '#fff',
                        color: activeCategory === cat ? '#fff' : '#888',
                        border: activeCategory === cat ? 'none' : '1.5px solid #eee', 
                        transition: 'all 0.2s', letterSpacing: '0.3px'
                    }}
                    onMouseEnter={e => { if (activeCategory !== cat) e.target.style.borderColor = '#111' }}
                    onMouseLeave={e => { if (activeCategory !== cat) e.target.style.borderColor = '#eee' }}
                    >
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* MAIN GRID CONTENT: HIGH DENSITY */}
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 32px 60px' }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.8px', marginBottom: '2px' }}>
                            {activeCategory === 'All' ? 'Curated Feed' : activeCategory}
                        </h1>
                        <p style={{ fontSize: '12px', color: '#bbb', fontWeight: '500' }}>Discovering {filtered.length} unique surplus pieces</p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                         <div style={{ width: '32px', height: '32px', border: '2px solid #eee', borderTop: '2px solid #e63946', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                         <p style={{ fontWeight: '900', letterSpacing: '1px', fontSize: '10px', color: '#e63946' }}>CURATING...</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '24px',
                    }}>
                        {filtered.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: '24px', border: '1.5px dashed #f0f0f0' }}>
                                <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔎</div>
                                <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px' }}>No gems found.</div>
                                <button onClick={() => { setSearch(''); setActiveCategory('All') }} style={{ 
                                    marginTop: '20px', padding: '12px 24px', background: '#111', color: '#fff', 
                                    border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '12px'
                                }}>Clear All Filters</button>
                            </div>
                        ) : (
                            filtered.map(product => (
                                <div key={product.id}
                                     onClick={() => navigate(`/product/${product.id}`)}
                                     style={{
                                         borderRadius: '20px', overflow: 'hidden', background: '#fff',
                                         border: '1px solid #f0f0f0',
                                         cursor: product.stockQuantity === 0 ? 'default' : 'pointer',
                                         transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                         position: 'relative',
                                     }}
                                     onMouseEnter={e => {
                                         if (product.stockQuantity > 0) {
                                             e.currentTarget.style.transform = 'translateY(-6px)'
                                             e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.04)'
                                         }
                                     }}
                                     onMouseLeave={e => {
                                         e.currentTarget.style.transform = 'translateY(0)'
                                         e.currentTarget.style.boxShadow = 'none'
                                     }}
                                >
                                    {/* Product Image Area: Ultra-Compact */}
                                    <div style={{
                                        height: '240px', background: '#f7f7f7',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        position: 'relative', overflow: 'hidden'
                                    }}>
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s' }} />
                                        ) : (
                                            <Package size={40} color="#ddd" strokeWidth={1} />
                                        )}

                                        {/* Premium Labels: Nano */}
                                        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{
                                                fontSize: '8px', fontWeight: '900', letterSpacing: '0.8px',
                                                padding: '4px 10px', borderRadius: '6px',
                                                background: tagStyles[product.tag]?.bg || '#fff',
                                                color: tagStyles[product.tag]?.color || '#111',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                            }}>{product.tag || 'CURATED'}</span>
                                        </div>

                                        {/* Sold Out Mask: Nano */}
                                        {product.stockQuantity === 0 && (
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'rgba(255,255,255,0.7)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backdropFilter: 'blur(3px)'
                                            }}>
                                                <span style={{
                                                    background: '#111', color: '#fff',
                                                    padding: '8px 20px', borderRadius: '8px',
                                                    fontSize: '9px', fontWeight: '900', letterSpacing: '1px',
                                                }}>SOLD OUT</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details: Nano */}
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{ fontSize: '9px', fontWeight: '800', color: '#e63946', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{product.category}</div>
                                            {product.stockQuantity > 0 && product.stockQuantity <= 3 && (
                                                <div style={{ fontSize: '8px', color: '#e63946', fontWeight: '900', background: '#fff0f0', padding: '2px 5px', borderRadius: '4px' }}>
                                                    LAST {product.stockQuantity}
                                                </div>
                                            )}
                                        </div>

                                        <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#111', marginBottom: '10px', letterSpacing: '-0.3px', lineHeight: '1.2' }}>{product.name}</h3>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                                <div style={{ fontSize: '17px', fontWeight: '900', color: '#111' }}>₱{product.price.toLocaleString()}</div>
                                                {product.originalPrice && product.originalPrice > product.price && (
                                                    <>
                                                        <div style={{ fontSize: '11px', color: '#ccc', textDecoration: 'line-through', fontWeight: '500' }}>₱{product.originalPrice.toLocaleString()}</div>
                                                        <div style={{ fontSize: '9px', fontWeight: '900', color: '#e63946', background: '#fff0f0', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>
                                                            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isLoggedIn) {
                                                        setShowAuthModal(true);
                                                        return;
                                                    }
                                                    cartService.addToCart(user?.id, product, 1);
                                                    setNotification(`${product.name} added to bag!`);
                                                    setTimeout(() => setNotification(''), 3000);
                                                }}
                                                disabled={product.stockQuantity === 0}
                                                style={{ 
                                                    padding: '8px 12px', background: '#111', color: '#fff', 
                                                    borderRadius: '10px', border: 'none', cursor: 'pointer',
                                                    fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px'
                                                }}
                                            >
                                                <ShoppingCart size={14} /> ADD
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
                body { margin: 0; }
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); borderRadius: 10px; }
            `}</style>
        </div>
    )
}

export default HomePage