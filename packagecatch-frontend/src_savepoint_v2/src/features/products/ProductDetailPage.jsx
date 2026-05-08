import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { productService } from '../../api/productService'
import { cartService } from '../../api/cartService'
import { useAuth } from '../auth/AuthContext'
import { Star, ShoppingCart, Zap, ShieldCheck, Truck, ChevronLeft, Trash2, Reply, CheckCircle2, MessageCircle, ArrowLeft, Plus, Minus, Heart, User } from 'lucide-react'
import { AuthModal } from '../../shared'

const StarRating = ({ rating, setRating, interactive = false, size = 18 }) => {
    return (
        <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    size={size}
                    onClick={() => interactive && setRating(star)}
                    fill={star <= rating ? "#111" : "transparent"}
                    stroke={star <= rating ? "#111" : "#E0E0E0"}
                    style={{ cursor: interactive ? 'pointer' : 'default', transition: 'all 0.2s' }}
                />
            ))}
        </div>
    )
}

export default function ProductDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isLoggedIn, isAdmin, user } = useAuth()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedImage, setSelectedImage] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [notification, setNotification] = useState('')
    const [isProceeding, setIsProceeding] = useState(false)
    const [cartCount, setCartCount] = useState(0)
    const [orderCount, setOrderCount] = useState(0)
    const [showAuthModal, setShowAuthModal] = useState(false)

    const syncCartCount = () => {
        const cart = cartService.getCart(user?.id)
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0))
    }

    useEffect(() => {
        syncCartCount()
        const syncOrderCount = async () => {
            if (!user) return;
            try {
                const { orderService } = await import('../../api/orderService');
                const ords = await orderService.getMyOrders();
                setOrderCount(orderService.getActiveCount(ords));
            } catch (e) { console.error(e); }
        }
        syncOrderCount();
        window.addEventListener('cartUpdated', syncCartCount)
        window.addEventListener('ordersUpdated', syncOrderCount)
        return () => {
            window.removeEventListener('cartUpdated', syncCartCount)
            window.removeEventListener('ordersUpdated', syncOrderCount)
        }
    }, [user])

    // Review States
    const [reviews, setReviews] = useState([])
    const [newRating, setNewRating] = useState(5)
    const [newComment, setNewComment] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)
    const [replyingTo, setReplyingTo] = useState(null)
    const [replyText, setReplyText] = useState('')
    const [submittingReply, setSubmittingReply] = useState(false)

    useEffect(() => {
        const loadPageData = async () => {
            try {
                setLoading(true)
                const productData = await productService.getById(id)
                setProduct(productData)
                const reviewsData = await productService.getReviews(id)
                setReviews(reviewsData || [])
            } catch (err) {
                setError(err.message || 'Product not found')
            } finally {
                setLoading(false)
            }
        }
        loadPageData()
    }, [id])

    const showNotif = (msg) => {
        setNotification(msg)
        setTimeout(() => setNotification(''), 2500)
    }

    const handleAddToCart = (quiet = false) => {
        if (!isLoggedIn) {
            setShowAuthModal(true)
            return
        }
        cartService.addToCart(user?.id, product, quantity)
        if (!quiet) showNotif('Added to bag!')
    }

    const handleBuyNow = () => {
        if (!isLoggedIn) {
            setShowAuthModal(true)
            return
        }
        setIsProceeding(true)
        localStorage.setItem('checkout_items', JSON.stringify([{ ...product, quantity, selected: true }]))
        setTimeout(() => { navigate('/checkout') }, 1200)
    }

    const handleReviewDelete = async (reviewId) => {
        if (!window.confirm('Delete review?')) return;
        try {
            await productService.deleteReview(id, reviewId);
            const updatedReviews = await productService.getReviews(id);
            setReviews(updatedReviews);
            showNotif('Review deleted');
        } catch (err) {
            showNotif('Failed to delete');
        }
    }

    const handleReviewSubmit = async (e) => {
        e.preventDefault()
        if (!isLoggedIn) return showNotif('Please login first')
        if (!newComment.trim()) return showNotif('Write a comment')

        try {
            setSubmittingReview(true)
            await productService.addReview(id, { rating: newRating, comment: newComment })
            const updatedReviews = await productService.getReviews(id)
            setReviews(updatedReviews)
            setNewComment('')
            setNewRating(5)
            showNotif('Review published!')
        } catch (err) {
            showNotif('Error publishing')
        } finally {
            setSubmittingReview(false)
        }
    }

    const handleReplySubmit = async (reviewId) => {
        if (!isLoggedIn || !replyText.trim()) return
        try {
            setSubmittingReply(true)
            await productService.replyToReview(id, reviewId, replyText, replyingTo?.name)
            const updatedReviews = await productService.getReviews(id)
            setReviews(updatedReviews)
            setReplyText('')
            setReplyingTo(null)
            showNotif('Reply posted!')
        } catch (err) {
            showNotif('Error posting reply')
        } finally {
            setSubmittingReply(false)
        }
    }

    if (loading || isProceeding) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fff', gap: '24px' }}>
            <div style={{ width: '50px', height: '50px', border: '4px solid #f0f0f0', borderTop: '4px solid #e63946', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontWeight: '900', color: '#111', letterSpacing: '2px', fontSize: '13px' }}>{isProceeding ? 'PREPARING YOUR ORDER...' : 'LOADING CURATED CONTENT...'}</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    )

    if (error || !product) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fff', gap: '24px' }}>
             <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1.5px' }}>Product not found.</h1>
             <button onClick={() => navigate('/home')} style={{ padding: '18px 48px', background: '#111', color: '#fff', borderRadius: '16px', border: 'none', cursor: 'pointer', fontWeight: '900' }}>BACK TO SHOP</button>
        </div>
    )

    const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl].filter(Boolean)
    const hasDiscount = product.originalPrice && product.originalPrice > product.price
    const discountPercent = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
    const reviewCount = reviews.length
    const avgRating = reviewCount > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1) : "0.0"

    return (
        <div style={{ minHeight: '100vh', background: '#fcfcfc', color: '#111', fontFamily: "'Inter', sans-serif" }}>

            {/* PREMIUM NOTIFICATION */}
            {notification && (
                <div style={{ 
                    position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', 
                    zIndex: 2000, background: '#111', color: '#fff', 
                    padding: '16px 32px', borderRadius: '16px', 
                    fontSize: '13px', fontWeight: '900', letterSpacing: '1px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)', 
                    display: 'flex', alignItems: 'center', gap: '12px',
                    animation: 'slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
                }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={16} />
                    </div>
                    {notification.toUpperCase()}
                </div>
            )}

            {/* STICKY NAVBAR: ULTRA-COMPACT */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '60px', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#666' }} onMouseEnter={e => e.currentTarget.style.color = '#111'}>
                        <ArrowLeft size={16} /> BACK
                    </div>
                    <div onClick={() => navigate('/')} style={{ fontSize: '18px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.5px' }}>
                        PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div onClick={() => {
                        if (!isLoggedIn) {
                            setShowAuthModal(true);
                            return;
                        }
                        navigate('/cart');
                    }} style={{ position: 'relative', cursor: 'pointer', color: '#111' }}>
                        <ShoppingCart size={22} strokeWidth={2.5} />
                        {isLoggedIn && cartCount > 0 && (
                            <div style={{
                                position: 'absolute', top: '-6px', right: '-8px',
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
                    }} style={{ position: 'relative', cursor: 'pointer', color: '#111' }}>
                        <User size={22} strokeWidth={2.5} />
                        {isLoggedIn && orderCount > 0 && !isAdmin && (
                            <div style={{
                                position: 'absolute', top: '-6px', right: '-8px',
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

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start', marginBottom: '60px' }}>

                    {/* GALLERY SECTION: COMPACT */}
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {images.map((img, idx) => (
                                <div key={idx} onClick={() => setSelectedImage(idx)} style={{
                                    width: '60px', height: '80px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                                    border: selectedImage === idx ? '2px solid #111' : '1px solid #f0f0f0',
                                    transition: 'all 0.2s'
                                }}>
                                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ flex: 1, position: 'relative', borderRadius: '24px', overflow: 'hidden', background: '#fff', maxHeight: '450px', aspectRatio: '3/4', border: '1px solid #f0f0f0' }}>
                            {images[selectedImage] && <img src={images[selectedImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            {hasDiscount && (
                                <div style={{ position: 'absolute', top: '20px', left: '20px', background: '#e63946', color: '#fff', padding: '6px 16px', borderRadius: '40px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>
                                    {discountPercent}% OFF
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PRODUCT INFO SECTION: REFINED */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '1px', color: '#e63946', background: '#fff0f0', padding: '5px 12px', borderRadius: '8px', textTransform: 'uppercase' }}>
                                    {product.category || 'BOUTIQUE CURATION'}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <StarRating rating={Math.round(Number(avgRating))} size={14} />
                                    <span onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: '11px', fontWeight: '900', color: '#111', cursor: 'pointer', textDecoration: 'underline', opacity: 0.6 }}>
                                        {reviewCount} Reviews
                                    </span>
                                </div>
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: '900', lineHeight: 1.2, marginBottom: '16px', letterSpacing: '-1px' }}>{product.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontSize: '24px', fontWeight: '900', color: '#111' }}>₱{product.price.toLocaleString()}</span>
                                {hasDiscount && <span style={{ fontSize: '16px', textDecoration: 'line-through', color: '#ccc', fontWeight: '600' }}>₱{product.originalPrice.toLocaleString()}</span>}
                            </div>
                        </div>
 
                        <div style={{ padding: '20px 0', borderTop: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5' }}>
                            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#666', margin: 0, fontWeight: '500' }}>{product.description || 'Elevate your wardrobe with this carefully curated surplus piece.'}</p>
                        </div>
 
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: '12px', height: '48px', padding: '0 4px', width: 'fit-content' }}>
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}><Minus size={16} /></button>
                                <span style={{ width: '40px', textAlign: 'center', fontWeight: '900', fontSize: '16px' }}>{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)} style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}><Plus size={16} /></button>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => handleAddToCart()} disabled={product.stockQuantity === 0} style={{ flex: 1, height: '52px', borderRadius: '14px', border: '2px solid #111', background: 'transparent', color: '#111', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}>ADD TO BAG</button>
                                <button onClick={handleBuyNow} disabled={product.stockQuantity === 0} style={{ flex: 1.2, height: '52px', borderRadius: '14px', border: 'none', background: product.stockQuantity === 0 ? '#ccc' : '#e63946', color: '#fff', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}>{product.stockQuantity === 0 ? 'OUT OF STOCK' : 'SECURE BUY NOW'}</button>
                            </div>
                        </div>
 
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: '#fff', padding: '12px', borderRadius: '16px', border: '1px solid #f0f0f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff0f0', color: '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Truck size={16} /></div>
                                <div><div style={{ fontSize: '11px', fontWeight: '900' }}>Express Shipping</div><div style={{ fontSize: '9px', color: '#999', fontWeight: '600' }}>2-4 Business Days</div></div>
                            </div>
                            <div style={{ background: '#fff', padding: '12px', borderRadius: '16px', border: '1px solid #f0f0f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fff8', color: '#2a9d8f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={16} /></div>
                                <div><div style={{ fontSize: '11px', fontWeight: '900' }}>Secure Checkout</div><div style={{ fontSize: '9px', color: '#999', fontWeight: '600' }}>Buyer Protection</div></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* REVIEWS & COMMUNITY SECTION: COMPACT */}
                <div id="reviews-section" style={{ borderTop: '1px solid #f0f0f0', paddingTop: '40px', paddingBottom: '60px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.3fr', gap: '40px' }}>
                        
                        {/* LEFT COLUMN: SUMMARY & FORM */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Community Feedback</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#111' }}>{avgRating}</div>
                                    <div>
                                        <StarRating rating={Math.round(Number(avgRating))} size={16} />
                                        <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '800', marginTop: '2px', letterSpacing: '0.5px' }}>BASED ON {reviewCount} REVIEWS</div>
                                    </div>
                                </div>
                            </div>
 
                            <div style={{ background: '#fff', border: '1px solid #f0f0f0', padding: '24px', borderRadius: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '8px' }}>Post a Review</h3>
                                <p style={{ fontSize: '12px', color: '#999', marginBottom: '20px' }}>Help the community discover the best surplus fashion.</p>

                                {isLoggedIn ? (
                                    !isAdmin ? (
                                        <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#999', marginBottom: '12px' }}>YOUR RATING</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star key={star} size={28} onClick={() => setNewRating(star)} fill={star <= newRating ? "#111" : "transparent"} stroke={star <= newRating ? "#111" : "#E0E0E0"} style={{ cursor: 'pointer' }} />
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Tell us about the quality..." style={{ width: '100%', minHeight: '120px', padding: '20px', borderRadius: '20px', background: '#fafafa', border: '2px solid #f0f0f0', fontSize: '15px', resize: 'none', outline: 'none' }} />
                                            <button type="submit" disabled={submittingReview} style={{ width: '100%', padding: '20px', borderRadius: '20px', background: '#111', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer' }}>{submittingReview ? 'PUBLISHING...' : 'PUBLISH REVIEW'}</button>
                                        </form>
                                    ) : <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '16px', fontWeight: '800', textAlign: 'center' }}>ADMIN RESPONSE PORTAL ACTIVE</div>
                                ) : <button onClick={() => setShowAuthModal(true)} style={{ width: '100%', padding: '20px', borderRadius: '20px', background: '#111', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer' }}>SIGN IN TO REVIEW</button>}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: REVIEWS LIST */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                            {reviews.length === 0 ? (
                                <div style={{ padding: '80px', textAlign: 'center', background: '#fff', borderRadius: '40px', border: '3px dashed #f0f0f0' }}>
                                    <MessageCircle size={48} color="#eee" style={{ marginBottom: '24px' }} />
                                    <h4 style={{ fontSize: '20px', fontWeight: '900' }}>No reviews yet.</h4>
                                </div>
                            ) : reviews.map(rev => (
                                <div key={rev.id} style={{ display: 'flex', gap: '32px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900' }}>{(rev.users?.full_name || '?').charAt(0).toUpperCase()}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>{rev.users?.full_name || 'Buyer'} <div style={{ background: '#f0fff8', color: '#2a9d8f', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderRadius: '30px' }}>VERIFIED</div></div>
                                                <div style={{ fontSize: '13px', color: '#aaa', fontWeight: '700' }}>{new Date(rev.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <StarRating rating={rev.rating} size={14} />
                                        </div>
                                        <p style={{ fontSize: '16px', lineHeight: 1.8, color: '#444', margin: '0 0 24px 0', fontWeight: '500' }}>{rev.comment}</p>
                                        
                                        {/* REPLIES DISPLAY */}
                                        {rev.replies && rev.replies.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', paddingLeft: '24px', borderLeft: '3px solid #f0f0f0' }}>
                                                {rev.replies.map(reply => (
                                                    <div key={reply.id} style={{ background: reply.is_admin ? '#fff8f8' : '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #f5f5f5' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '900', color: reply.is_admin ? '#e63946' : '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                {reply.is_admin ? <div style={{ background: '#e63946', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '10px' }}>ADMIN</div> : (reply.users?.full_name || 'User')}
                                                                {reply.reply_to_name && <span style={{ fontWeight: '600', color: '#999', fontSize: '12px' }}>replied to <span style={{ color: '#3b82f6' }}>@{reply.reply_to_name}</span></span>}
                                                            </div>
                                                            <button onClick={() => { setReplyingTo({ id: rev.id, name: reply.is_admin ? 'Admin' : (reply.users?.full_name || 'User') }); setReplyText(''); }} style={{ background: 'none', border: 'none', color: '#888', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>REPLY</button>
                                                        </div>
                                                        <p style={{ fontSize: '14px', color: '#555', margin: 0, lineHeight: 1.6, fontWeight: '500' }}>{reply.comment}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* REPLY ACTION */}
                                        <div style={{ marginTop: '16px' }}>
                                            {replyingTo?.id === rev.id ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff', padding: '20px', borderRadius: '24px', border: '2px solid #111' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#3b82f6' }}>Replying to @{replyingTo.name}</div>
                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                        <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your response..." autoFocus style={{ flex: 1, padding: '14px 20px', borderRadius: '14px', border: '1.5px solid #eee', fontSize: '14px', outline: 'none', background: '#fcfcfc' }} />
                                                        <button onClick={() => handleReplySubmit(rev.id)} disabled={submittingReply || !replyText.trim()} style={{ padding: '0 24px', borderRadius: '14px', background: '#111', color: '#fff', fontSize: '13px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>{submittingReply ? '...' : 'POST'}</button>
                                                        <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: '900', color: '#888', cursor: 'pointer' }}>CANCEL</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setReplyingTo({ id: rev.id, name: rev.users?.full_name || 'Verified Buyer' }); setReplyText('') }} style={{ background: 'none', border: 'none', color: '#111', fontSize: '12px', fontWeight: '900', cursor: 'pointer', padding: '8px 20px', borderRadius: '10px', background: '#f5f5f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Reply size={14} /> REPLY TO REVIEW
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
                body { margin: 0; }
            `}</style>
        </div>
    )
}