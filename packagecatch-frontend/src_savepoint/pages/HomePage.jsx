import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productService } from '../api/productService'

const HomePage = () => {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const [cartCount, setCartCount] = useState(0)
    const [wishlist, setWishlist] = useState([])
    const [notification, setNotification] = useState('')
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    const categories = ['All', 'Tops', 'Dresses', 'Bottoms', 'Accessories']

    useEffect(() => {
        productService.getAll()
            .then(data => setProducts(data))
            .catch(err => console.error("Failed to fetch products:", err))
            .finally(() => setLoading(false))
    }, [])

    const tagColors = {
        'NEW': { bg: '#111', color: '#fff' },
        'BEST SELLER': { bg: '#e63946', color: '#fff' },
        'FLASH SALE': { bg: '#f4a261', color: '#fff' },
    }

    const filtered = products.filter(p => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
    })

    const showNotif = (msg) => {
        setNotification(msg)
        setTimeout(() => setNotification(''), 2500)
    }

    const addToCart = (e, product) => {
        e.stopPropagation()
        if (product.stock === 0) return
        setCartCount(prev => prev + 1)
        showNotif(`${product.name} added to cart!`)
    }

    const toggleWishlist = (e, id) => {
        e.stopPropagation()
        setWishlist(prev =>
            prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>

            {/* NOTIFICATION TOAST */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '32px', left: '50%',
                    transform: 'translateX(-50%)', zIndex: 999,
                    background: '#111', color: '#fff', padding: '14px 28px',
                    borderRadius: '40px', fontSize: '14px', fontWeight: '600',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    animation: 'fadeIn 0.3s ease',
                }}>
                    ✓ {notification}
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
                gap: '24px',
            }}>
                {/* Logo */}
                <div onClick={() => navigate('/')} style={{
                    fontSize: '20px', fontWeight: '900', cursor: 'pointer', flexShrink: 0,
                }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>

                {/* Search */}
                <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
          <span style={{
              position: 'absolute', left: '14px', top: '50%',
              transform: 'translateY(-50%)', fontSize: '16px', color: '#999',
          }}>🔍</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search products..."
                        style={{
                            width: '100%', padding: '10px 16px 10px 42px',
                            borderRadius: '40px', fontSize: '14px',
                            border: '1.5px solid #e0e0e0', background: '#fafafa',
                            transition: 'border 0.2s',
                        }}
                        onFocus={e => e.target.style.border = '1.5px solid #111'}
                        onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
                    />
                </div>

                {/* Right icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    <div onClick={() => navigate('/cart')} style={{
                        position: 'relative', cursor: 'pointer', fontSize: '22px',
                    }}>
                        🛒
                        {cartCount > 0 && (
                            <div style={{
                                position: 'absolute', top: '-6px', right: '-8px',
                                width: '18px', height: '18px', borderRadius: '50%',
                                background: '#e63946', color: '#fff',
                                fontSize: '10px', fontWeight: '700',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{cartCount}</div>
                        )}
                    </div>
                    <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer', fontSize: '22px' }}>👤</div>
                </div>
            </nav>

            {/* CATEGORY NAV */}
            <div style={{
                display: 'flex', gap: '8px', padding: '20px 48px',
                borderBottom: '1px solid #f0f0f0', overflowX: 'auto',
            }}>
                {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                        padding: '8px 20px', borderRadius: '40px', fontSize: '14px',
                        fontWeight: '600', cursor: 'pointer', flexShrink: 0,
                        background: activeCategory === cat ? '#111' : '#f5f5f5',
                        color: activeCategory === cat ? '#fff' : '#555',
                        border: 'none', transition: 'all 0.2s',
                    }}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* RESULTS COUNT */}
            <div style={{ padding: '24px 48px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '14px', color: '#888' }}>
                    Showing <strong style={{ color: '#111' }}>{filtered.length}</strong> products
                    {activeCategory !== 'All' && ` in ${activeCategory}`}
                    {search && ` for "${search}"`}
                </p>
            </div>

            {/* PRODUCT GRID */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '24px', padding: '24px 48px 80px',
            }}>
                {filtered.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: '#999' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>No products found</div>
                        <div style={{ fontSize: '14px', marginTop: '8px' }}>Try a different search or category</div>
                    </div>
                ) : (
                    filtered.map(product => (
                        <div key={product.id}
                             onClick={() => navigate(`/product/${product.id}`)}
                             style={{
                                 borderRadius: '12px', overflow: 'hidden', background: '#fff',
                                 border: '1px solid #f0f0f0',
                                 cursor: product.stock === 0 ? 'default' : 'pointer',
                                 transition: 'transform 0.2s, box-shadow 0.2s',
                                 position: 'relative',
                             }}
                             onMouseEnter={e => {
                                 if (product.stock > 0) {
                                     e.currentTarget.style.transform = 'translateY(-4px)'
                                     e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'
                                 }
                             }}
                             onMouseLeave={e => {
                                 e.currentTarget.style.transform = 'translateY(0)'
                                 e.currentTarget.style.boxShadow = 'none'
                             }}
                        >
                            {/* Product Image Area */}
                            <div style={{
                                height: '260px', background: product.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative',
                            }}>
                                <span style={{ fontSize: '72px' }}>👗</span>

                                {/* Sold Out Overlay */}
                                {product.stock === 0 && (
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'rgba(255,255,255,0.75)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                    <span style={{
                        background: '#111', color: '#fff',
                        padding: '8px 20px', borderRadius: '4px',
                        fontSize: '13px', fontWeight: '700', letterSpacing: '2px',
                    }}>SOLD OUT</span>
                                    </div>
                                )}

                                {/* Wishlist button */}
                                <button onClick={e => toggleWishlist(e, product.id)} style={{
                                    position: 'absolute', top: '12px', right: '12px',
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: '#fff', border: 'none', cursor: 'pointer',
                                    fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                }}>
                                    {wishlist.includes(product.id) ? '❤️' : '🤍'}
                                </button>

                                {/* Quick add button */}
                                {product.stock > 0 && (
                                    <button onClick={e => addToCart(e, product)} style={{
                                        position: 'absolute', bottom: '12px', right: '12px',
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        background: '#111', border: 'none', cursor: 'pointer',
                                        fontSize: '20px', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    }}>+</button>
                                )}
                            </div>

                            {/* Product Info */}
                            <div style={{ padding: '14px 16px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{
                      fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px',
                      padding: '3px 8px', borderRadius: '3px',
                      background: tagColors[product.tag]?.bg,
                      color: tagColors[product.tag]?.color,
                  }}>{product.tag}</span>

                                    {/* Low stock warning */}
                                    {product.stock > 0 && product.stock <= 3 && (
                                        <span style={{ fontSize: '11px', color: '#f4a261', fontWeight: '600' }}>
                      ⚠ Only {product.stock} left
                    </span>
                                    )}
                                </div>

                                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{product.name}</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#e63946' }}>₱{product.price}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
        </div>
    )
}

export default HomePage