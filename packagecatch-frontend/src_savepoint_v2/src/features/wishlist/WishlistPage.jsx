import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartService } from '../../api/cartService'
import { useAuth } from '../auth/AuthContext'

export default function WishlistPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [wishlist, setWishlist] = useState([])
    const [addedToCart, setAddedToCart] = useState({})

    useEffect(() => {
        const key = user ? `wishlist_${user.id}` : 'wishlist_guest'
        const wl = JSON.parse(localStorage.getItem(key) || '[]')
        setWishlist(wl)
    }, [user])

    const removeFromWishlist = (id) => {
        const updated = wishlist.filter(item => item.id !== id)
        const key = user ? `wishlist_${user.id}` : 'wishlist_guest'
        localStorage.setItem(key, JSON.stringify(updated))
        setWishlist(updated)
    }

    const addToCart = (item) => {
        cartService.addToCart(user?.id, item, 1)
        setAddedToCart(prev => ({ ...prev, [item.id]: true }))
        setTimeout(() => setAddedToCart(prev => ({ ...prev, [item.id]: false })), 2000)
    }

    const addAllToCart = () => {
        wishlist.forEach(item => {
            cartService.addToCart(user?.id, item, 1)
        })
        const allAdded = {}
        wishlist.forEach(item => { allAdded[item.id] = true })
        setAddedToCart(allAdded)
        setTimeout(() => setAddedToCart({}), 2000)
    }

    const clearWishlist = () => {
        const key = user ? `wishlist_${user.id}` : 'wishlist_guest'
        localStorage.removeItem(key)
        setWishlist([])
    }

    return (
        <div style={S.page}>
            <div style={S.header}>
                <div>
                    <button onClick={() => navigate(-1)} style={S.backBtn}>← Continue Shopping</button>
                    <h1 style={S.title}>My Wishlist</h1>
                    <p style={S.subtitle}>{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
                </div>
                {wishlist.length > 0 && (
                    <div style={S.headerActions}>
                        <button onClick={clearWishlist} style={S.clearBtn}>Clear All</button>
                        <button onClick={addAllToCart} style={S.addAllBtn}>Add All to Cart</button>
                    </div>
                )}
            </div>

            {wishlist.length === 0 && (
                <div style={S.emptyState}>
                    <div style={S.emptyHeart}>♡</div>
                    <h2 style={S.emptyTitle}>Your wishlist is empty</h2>
                    <p style={S.emptySub}>Save items you love by clicking the heart icon on any product.</p>
                    <button onClick={() => navigate('/home')} style={S.browseBtn}>Browse Products</button>
                </div>
            )}

            <div style={S.grid}>
                {wishlist.map(item => {
                    const discount = item.originalPrice
                        ? Math.round((1 - item.price / item.originalPrice) * 100)
                        : 0
                    const isAdded = addedToCart[item.id]

                    return (
                        <div key={item.id} style={S.card}>
                            <button onClick={() => removeFromWishlist(item.id)} style={S.removeBtn}>×</button>
                            <div style={S.imgWrap} onClick={() => navigate(`/product/${item.id}`)}>
                                {item.imageUrl
                                    ? <img src={item.imageUrl} alt={item.name} style={S.img}
                                           onError={e => { e.target.src = `https://placehold.co/300x300/1a1a1a/555?text=No+Image` }} />
                                    : <div style={S.imgEmpty}>📦</div>
                                }
                                {discount > 0 && <div style={S.discountBadge}>-{discount}%</div>}
                                {item.stockQuantity === 0 && <div style={S.outOfStock}>Out of Stock</div>}
                            </div>
                            <div style={S.cardBody}>
                                {item.category && <span style={S.catTag}>{item.category}</span>}
                                <h3 style={S.itemName} onClick={() => navigate(`/product/${item.id}`)}>
                                    {item.name}
                                </h3>
                                <div style={S.priceRow}>
                                    <span style={S.price}>${Number(item.price).toFixed(2)}</span>
                                    {item.originalPrice && (
                                        <span style={S.origPrice}>${Number(item.originalPrice).toFixed(2)}</span>
                                    )}
                                </div>
                                <div style={S.stockRow}>
                                    <div style={{ ...S.stockDot, background: item.stockQuantity > 0 ? '#22c55e' : '#ef4444' }} />
                                    <span style={S.stockText}>
                    {item.stockQuantity > 0 ? `${item.stockQuantity} in stock` : 'Out of stock'}
                  </span>
                                </div>
                            </div>
                            <div style={S.cardFooter}>
                                <button
                                    onClick={() => addToCart(item)}
                                    disabled={item.stockQuantity === 0}
                                    style={{ ...S.addBtn, ...(isAdded ? S.addedBtn : {}), ...(item.stockQuantity === 0 ? S.disabledBtn : {}) }}
                                >
                                    {isAdded ? '✓ Added!' : item.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {wishlist.length > 0 && (
                <div style={S.savingsBar}>
                    <div style={S.savingsInfo}>
                        <span style={S.savingsLabel}>Total Value</span>
                        <span style={S.savingsAmount}>
              ${wishlist.reduce((sum, i) => sum + Number(i.price), 0).toFixed(2)}
            </span>
                    </div>
                    {wishlist.some(i => i.originalPrice) && (
                        <div style={S.savingsInfo}>
                            <span style={S.savingsLabel}>You're saving</span>
                            <span style={{ ...S.savingsAmount, color: '#22c55e' }}>
                ${wishlist.reduce((sum, i) =>
                                sum + (i.originalPrice ? Number(i.originalPrice) - Number(i.price) : 0), 0
                            ).toFixed(2)}
              </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

const S = {
    page: { minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: "'DM Sans', sans-serif", padding: '32px 24px', maxWidth: 1200, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
    backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13, marginBottom: 4, display: 'block', padding: 0 },
    title: { fontSize: 28, fontWeight: 700, margin: 0 },
    subtitle: { fontSize: 14, color: '#666', margin: '4px 0 0' },
    headerActions: { display: 'flex', gap: 12, alignItems: 'center' },
    clearBtn: { background: 'none', border: '1px solid #333', color: '#888', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13 },
    addAllBtn: { background: '#e85d04', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    emptyState: { textAlign: 'center', padding: '100px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    emptyHeart: { fontSize: 80, color: '#ef4444', opacity: 0.3, lineHeight: 1, marginBottom: 24 },
    emptyTitle: { fontSize: 24, fontWeight: 700, margin: '0 0 12px' },
    emptySub: { color: '#666', fontSize: 15, marginBottom: 32, maxWidth: 360 },
    browseBtn: { background: '#e85d04', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
    card: { background: '#1a1a1a', borderRadius: 16, border: '1px solid #222', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' },
    removeBtn: { position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 18, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    imgWrap: { height: 220, background: '#111', position: 'relative', overflow: 'hidden', cursor: 'pointer' },
    img: { width: '100%', height: '100%', objectFit: 'cover' },
    imgEmpty: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.2 },
    discountBadge: { position: 'absolute', top: 12, left: 12, background: '#e85d04', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 },
    outOfStock: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.75)', color: '#fff', textAlign: 'center', padding: '8px', fontSize: 13, fontWeight: 600 },
    cardBody: { padding: '16px', flex: 1 },
    catTag: { display: 'inline-block', background: '#e85d0422', color: '#e85d04', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    itemName: { fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: '#f0f0f0', cursor: 'pointer', lineHeight: 1.3 },
    priceRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
    price: { fontSize: 22, fontWeight: 800, color: '#e85d04' },
    origPrice: { fontSize: 14, color: '#555', textDecoration: 'line-through' },
    stockRow: { display: 'flex', alignItems: 'center', gap: 6 },
    stockDot: { width: 7, height: 7, borderRadius: '50%' },
    stockText: { fontSize: 12, color: '#888' },
    cardFooter: { padding: '12px 16px', borderTop: '1px solid #222' },
    addBtn: { width: '100%', padding: '12px', background: '#e85d04', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    addedBtn: { background: '#22c55e' },
    disabledBtn: { background: '#222', color: '#555', cursor: 'not-allowed' },
    savingsBar: { marginTop: 32, padding: '20px 24px', background: '#1a1a1a', borderRadius: 12, border: '1px solid #222', display: 'flex', gap: 32 },
    savingsInfo: { display: 'flex', flexDirection: 'column', gap: 4 },
    savingsLabel: { fontSize: 12, color: '#666' },
    savingsAmount: { fontSize: 22, fontWeight: 800, color: '#f0f0f0' },
}