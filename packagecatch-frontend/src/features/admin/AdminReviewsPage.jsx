import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../api/adminService'
import { productService } from '../../api/productService'

const StarDisplay = ({ rating, size = '13px' }) => (
    <span style={{ fontSize: size, letterSpacing: '1px' }}>
        {[1,2,3,4,5].map(s => (
            <span key={s} style={{ color: s <= rating ? '#111' : '#ddd' }}>★</span>
        ))}
    </span>
)

const ratingColor = (r) => {
    if (r >= 4) return { bg: '#f0fff8', color: '#1b6b4a' }
    if (r === 3) return { bg: '#fffbe6', color: '#b8860b' }
    return { bg: '#fff0f0', color: '#c62828' }
}

export default function AdminReviewsPage({ onBack }) {
    const navigate = useNavigate()
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [notification, setNotification] = useState('')
    const [replyingTo, setReplyingTo] = useState(null) // { id: reviewId, name: targetName }
    const [replyText, setReplyText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [filterRating, setFilterRating] = useState('all')
    const [expandedReplies, setExpandedReplies] = useState({})

    const showNotif = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 2500) }

    const load = async () => {
        setLoading(true)
        try {
            const data = await adminService.getReviews()
            setReviews(data || [])
        } catch (e) {
            showNotif('Failed to load reviews: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleReply = async (review) => {
        if (!replyText.trim()) return
        setSubmitting(true)
        try {
            await productService.replyToReview(review.product_id, review.id, replyText, replyingTo?.name)
            setReplyingTo(null)
            setReplyText('')
            showNotif('Reply posted!')
            await load()
            setExpandedReplies(prev => ({ ...prev, [review.id]: true }))
        } catch (e) {
            console.error("Admin Reply Error:", e)
            const msg = e.response?.data?.error || e.message;
            showNotif('Error: ' + msg)
        } finally {
            setSubmitting(false)
        }
    }

    const filtered = filterRating === 'all' ? reviews : reviews.filter(r => r.rating === Number(filterRating))

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : '—'

    const ratingCounts = [5,4,3,2,1].map(n => ({
        star: n,
        count: reviews.filter(r => r.rating === n).length
    }))

    return (
        <div style={{ fontFamily: "'Outfit', sans-serif" }}>
            {notification && (
                <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, background: '#111', color: '#fff', padding: '14px 28px', borderRadius: '40px', fontSize: '14px', fontWeight: '800', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>✓ {notification}</div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Reviews & Ratings</h2>
                    <p style={{ fontSize: '13px', color: '#999', margin: '4px 0 0', fontWeight: '600' }}>
                        Monitor customer feedback and reply to reviews
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Star filter */}
                    {['all','5','4','3','2','1'].map(f => (
                        <button key={f} onClick={() => setFilterRating(f)} style={{
                            padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '800',
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: filterRating === f ? '#111' : '#f5f5f5',
                            color: filterRating === f ? '#fff' : '#666',
                        }}>
                            {f === 'all' ? 'All' : `${f}★`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '32px' }}>
                {ratingCounts.map(({ star, count }) => {
                    const { bg, color } = ratingColor(star)
                    return (
                        <div key={star} onClick={() => setFilterRating(String(star))} style={{
                            background: filterRating === String(star) ? '#111' : bg,
                            color: filterRating === String(star) ? '#fff' : color,
                            borderRadius: '16px', padding: '16px', textAlign: 'center',
                            cursor: 'pointer', transition: 'all 0.2s',
                            border: filterRating === String(star) ? '2px solid #111' : '2px solid transparent'
                        }}>
                            <div style={{ fontSize: '22px', fontWeight: '900' }}>{count}</div>
                            <div style={{ fontSize: '11px', fontWeight: '800', marginTop: '2px' }}>{star}★ Reviews</div>
                        </div>
                    )
                })}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{ width: '36px', height: '36px', border: '3px solid #f3f3f3', borderTop: '3px solid #111', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                    <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: '#fcfcfc', borderRadius: '24px', border: '1px dashed #eee', color: '#aaa' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌟</div>
                    <div style={{ fontWeight: '800', fontSize: '16px' }}>No reviews found</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filtered.map(review => {
                        const rc = ratingColor(review.rating)
                        const productImg = review.products?.images?.[0]
                        const repliesOpen = expandedReplies[review.id]
                        const hasReplies = review.replies?.length > 0

                        return (
                            <div key={review.id} style={{
                                background: '#fff', borderRadius: '20px',
                                border: '1px solid #f0f0f0',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                                overflow: 'hidden'
                            }}>
                                {/* Review Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: '16px', alignItems: 'start', padding: '20px 24px' }}>
                                    
                                    {/* Avatar */}
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '14px',
                                        background: '#111', color: '#fff', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px', fontWeight: '900', flexShrink: 0
                                    }}>
                                        {(review.users?.full_name || review.users?.email || '?').charAt(0).toUpperCase()}
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '15px', fontWeight: '900', color: '#111' }}>
                                                {review.users?.full_name || 'Verified Buyer'}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: '700' }}>
                                                {review.users?.email}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#ccc', fontWeight: '600' }}>
                                                {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Product link */}
                                        <div
                                            onClick={() => navigate(`/product/${review.product_id}`)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer', transition: 'opacity 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            {productImg && (
                                                <img src={productImg} alt="" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #f0f0f0' }} />
                                            )}
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1877F2', textDecoration: 'underline' }}>
                                                {review.products?.name || 'View Product'} ↗
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <StarDisplay rating={review.rating} />
                                            <span style={{
                                                fontSize: '10px', fontWeight: '900', padding: '3px 10px',
                                                borderRadius: '6px', background: rc.bg, color: rc.color, letterSpacing: '0.5px'
                                            }}>
                                                {review.rating}/5
                                            </span>
                                        </div>

                                        <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#444', margin: 0, fontWeight: '500' }}>
                                            {review.comment}
                                        </p>

                                        {/* Actions row */}
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                                            <button
                                                onClick={() => { setReplyingTo(replyingTo?.id === review.id ? null : { id: review.id, name: review.users?.full_name || 'Verified Buyer' }); setReplyText('') }}
                                                style={{
                                                    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '800',
                                                    background: replyingTo?.id === review.id ? '#111' : '#f5f5f5',
                                                    color: replyingTo?.id === review.id ? '#fff' : '#555',
                                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                {replyingTo?.id === review.id ? '✕ Cancel' : '↩ Reply as Admin'}
                                            </button>
                                            {hasReplies && (
                                                <button
                                                    onClick={() => setExpandedReplies(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
                                                    style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', background: 'transparent', color: '#888', border: '1px solid #eee', cursor: 'pointer' }}
                                                >
                                                    {repliesOpen ? '▲ Hide' : `▼ ${review.replies.length} ${review.replies.length === 1 ? 'Reply' : 'Replies'}`}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rating badge right */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '12px',
                                            background: rc.bg, color: rc.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '18px', fontWeight: '900'
                                        }}>
                                            {review.rating}
                                        </div>
                                    </div>
                                </div>

                                {/* Reply Input */}
                                {replyingTo?.id === review.id && (
                                    <div style={{ padding: '0 24px 20px 88px' }}>
                                        <div style={{ background: '#f8f8f8', borderRadius: '14px', padding: '16px', border: '1px solid #eee' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '900', color: '#e63946', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                                    ♛ Admin Reply
                                                </div>
                                                {replyingTo.name && (
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1877F2' }}>
                                                        Replying to @{replyingTo.name}
                                                    </div>
                                                )}
                                            </div>
                                            <textarea
                                                value={replyText}
                                                onChange={e => setReplyText(e.target.value)}
                                                placeholder={`Write your reply to ${replyingTo.name}...`}
                                                rows={3}
                                                autoFocus
                                                style={{
                                                    width: '100%', padding: '12px', borderRadius: '10px',
                                                    border: '1px solid #e0e0e0', fontSize: '14px',
                                                    fontFamily: 'inherit', resize: 'none', outline: 'none',
                                                    background: '#fff', color: '#111', boxSizing: 'border-box'
                                                }}
                                                onFocus={e => e.target.style.borderColor = '#111'}
                                                onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                                <button
                                                    onClick={() => handleReply(review)}
                                                    disabled={submitting || !replyText.trim()}
                                                    style={{
                                                        padding: '10px 24px', borderRadius: '10px', fontSize: '13px',
                                                        fontWeight: '900', background: '#111', color: '#fff',
                                                        border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                                                        opacity: !replyText.trim() ? 0.5 : 1, transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {submitting ? 'Posting...' : 'Post Reply'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Replies Thread */}
                                {repliesOpen && hasReplies && (
                                    <div style={{ padding: '0 24px 20px 88px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {review.replies.map(reply => (
                                            <div key={reply.id} style={{
                                                background: reply.is_admin ? '#fff8f8' : '#f8f8f8',
                                                borderLeft: `3px solid ${reply.is_admin ? '#e63946' : '#ddd'}`,
                                                borderRadius: '0 10px 10px 0', padding: '12px 16px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '900', color: reply.is_admin ? '#e63946' : '#111' }}>
                                                            {reply.is_admin ? '♛ Admin' : (reply.users?.full_name || 'User')}
                                                            {reply.reply_to_name && (
                                                                <span style={{ fontWeight: '600', color: '#999', fontSize: '11px', marginLeft: '6px' }}>
                                                                    replied to <span style={{ color: '#1877F2' }}>@{reply.reply_to_name}</span>
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span style={{ fontSize: '11px', color: '#bbb', fontWeight: '600' }}>
                                                            {new Date(reply.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            setReplyingTo({ id: review.id, name: reply.is_admin ? 'Admin' : (reply.users?.full_name || 'User') });
                                                            setReplyText('');
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: '#888', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                                <p style={{ fontSize: '13px', color: '#555', margin: 0, lineHeight: 1.5 }}>{reply.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
