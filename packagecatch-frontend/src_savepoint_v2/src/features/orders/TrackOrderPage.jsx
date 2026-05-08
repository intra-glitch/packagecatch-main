import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderService } from './orderService'

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']
const STATUS_META = {
    PENDING:   { label: 'Order Placed', icon: '📋', color: '#f59e0b', desc: 'Your order has been received.' },
    CONFIRMED: { label: 'Confirmed',    icon: '✅', color: '#3b82f6', desc: 'Seller confirmed your order.' },
    SHIPPED:   { label: 'Shipped',      icon: '🚚', color: '#8b5cf6', desc: 'Your package is on the way.' },
    DELIVERED: { label: 'Delivered',    icon: '📦', color: '#22c55e', desc: 'Package delivered successfully.' },
    CANCELLED: { label: 'Cancelled',    icon: '✕',  color: '#ef4444', desc: 'This order was cancelled.' },
}

export default function TrackOrderPage() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(null)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [cancelling, setCancelling] = useState(false)
    const [cancelSuccess, setCancelSuccess] = useState(null)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        orderService.getMyOrders()
            .then(data => {
                setOrders(data)
                if (data.length > 0) setExpanded(data[0].id)
            })
            .catch(() => navigate('/login'))
            .finally(() => setLoading(false))
    }, [])

    const handleCancel = async () => {
        if (!cancelTarget) return
        setCancelling(true)
        try {
            await orderService.cancelOrder(cancelTarget)
            setOrders(prev => prev.map(o =>
                o.id === cancelTarget ? { ...o, status: 'CANCELLED' } : o
            ))
            setCancelSuccess(cancelTarget)
            setTimeout(() => setCancelSuccess(null), 3000)
        } catch (err) {
            alert('Unable to cancel. ' + (err.response?.data?.message || 'Please contact support.'))
        } finally {
            setCancelling(false)
            setCancelTarget(null)
        }
    }

    const canCancel = (status) => status === 'PENDING' || status === 'CONFIRMED'
    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

    if (loading) return (
        <div style={S.loadWrap}>
            <div style={S.spinner} />
        </div>
    )

    return (
        <div style={S.page}>
            <div style={S.header}>
                <button onClick={() => navigate('/profile')} style={S.backBtn}>← Back to Profile</button>
                <h1 style={S.title}>Track Orders</h1>
                <p style={S.subtitle}>{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
            </div>

            {cancelSuccess && (
                <div style={S.toast}>Order #{cancelSuccess} has been cancelled.</div>
            )}

            <div style={S.filterBar}>
                {['all', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                            style={{ ...S.filterBtn, ...(filter === f ? S.filterActive : {}) }}>
                        {f === 'all' ? 'All' : STATUS_META[f]?.label}
                        {f !== 'all' && (
                            <span style={S.filterCount}>{orders.filter(o => o.status === f).length}</span>
                        )}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && (
                <div style={S.emptyState}>
                    <div style={{ fontSize: 64 }}>📭</div>
                    <h3 style={S.emptyTitle}>No orders here</h3>
                    <p style={S.emptySub}>
                        {filter === 'all' ? "You haven't placed any orders yet." : `No ${STATUS_META[filter]?.label} orders.`}
                    </p>
                    {filter === 'all' && (
                        <button onClick={() => navigate('/home')} style={S.shopBtn}>Start Shopping</button>
                    )}
                </div>
            )}

            <div style={S.ordersList}>
                {filtered.map(order => {
                    const meta = STATUS_META[order.status] || STATUS_META.PENDING
                    const stepIdx = STATUS_STEPS.indexOf(order.status)
                    const isExpanded = expanded === order.id
                    const isCancelled = order.status === 'CANCELLED'

                    return (
                        <div key={order.id} style={S.orderCard}>
                            <div style={S.orderHeader} onClick={() => setExpanded(isExpanded ? null : order.id)}>
                                <div style={S.orderLeft}>
                                    <div style={{ ...S.statusBubble, background: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}44` }}>
                                        <span>{meta.icon}</span>
                                        <span>{meta.label}</span>
                                    </div>
                                    <div>
                                        <p style={S.orderId}>Order #{order.id}</p>
                                        <p style={S.orderDate}>
                                            {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div style={S.orderRight}>
                                    <span style={S.orderTotal}>${Number(order.totalAmount).toFixed(2)}</span>
                                    <span style={{ color: '#666', fontSize: 14 }}>{isExpanded ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {isExpanded && (
                                <div style={S.orderBody}>
                                    {/* Progress stepper */}
                                    {!isCancelled && (
                                        <div style={S.stepper}>
                                            {STATUS_STEPS.map((step, idx) => {
                                                const done = idx <= stepIdx
                                                const active = idx === stepIdx
                                                const sMeta = STATUS_META[step]
                                                return (
                                                    <div key={step} style={S.stepItem}>
                                                        <div style={S.stepLine}>
                                                            <div style={{
                                                                ...S.stepCircle,
                                                                background: done ? sMeta.color : '#222',
                                                                border: `2px solid ${done ? sMeta.color : '#333'}`,
                                                                boxShadow: active ? `0 0 0 4px ${sMeta.color}33` : 'none',
                                                            }}>
                                                                <span style={{ fontSize: 11, color: '#fff' }}>{done ? '✓' : idx + 1}</span>
                                                            </div>
                                                            {idx < STATUS_STEPS.length - 1 && (
                                                                <div style={{ ...S.stepConnector, background: idx < stepIdx ? '#22c55e' : '#222' }} />
                                                            )}
                                                        </div>
                                                        <p style={{ ...S.stepLabel, color: done ? '#f0f0f0' : '#444', fontWeight: active ? 700 : 400 }}>
                                                            {sMeta.label}
                                                        </p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {isCancelled && (
                                        <div style={S.cancelledBanner}>✕ This order was cancelled.</div>
                                    )}

                                    {/* Items */}
                                    <h4 style={S.sectionTitle}>Items Ordered</h4>
                                    <div style={S.itemsList}>
                                        {(order.items || []).map((item, i) => (
                                            <div key={i} style={S.orderItem}>
                                                <div style={S.itemImgWrap}>
                                                    {item.product?.imageUrl
                                                        ? <img src={item.product.imageUrl} alt={item.product?.name} style={S.itemImg} />
                                                        : <div style={S.itemImgPlaceholder}>📦</div>
                                                    }
                                                </div>
                                                <div style={S.itemInfo}>
                                                    <p style={S.itemName}>{item.product?.name || `Item #${i + 1}`}</p>
                                                    <p style={S.itemQty}>Qty: {item.quantity}</p>
                                                </div>
                                                <span style={S.itemPrice}>${Number(item.priceAtTime * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={S.metaGrid}>
                                        <div style={S.metaBox}>
                                            <p style={S.metaLabel}>Shipping Address</p>
                                            <p style={S.metaValue}>{order.shippingAddress || '—'}</p>
                                        </div>
                                        <div style={S.metaBox}>
                                            <p style={S.metaLabel}>Order Total</p>
                                            <p style={{ ...S.metaValue, color: '#e85d04', fontSize: 20, fontWeight: 800 }}>
                                                ${Number(order.totalAmount).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {canCancel(order.status) && (
                                        <div style={S.cancelSection}>
                                            <button onClick={() => setCancelTarget(order.id)} style={S.cancelBtn}>
                                                Cancel Order
                                            </button>
                                            <p style={S.cancelNote}>Orders can be cancelled before they are shipped.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Cancel modal */}
            {cancelTarget && (
                <div style={S.modalOverlay}>
                    <div style={S.modal}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                        <h3 style={S.modalTitle}>Cancel Order #{cancelTarget}?</h3>
                        <p style={S.modalText}>This cannot be undone. Refund takes 3–5 business days.</p>
                        <div style={S.modalActions}>
                            <button onClick={() => setCancelTarget(null)} style={S.keepBtn} disabled={cancelling}>
                                Keep Order
                            </button>
                            <button onClick={handleCancel} style={S.confirmCancelBtn} disabled={cancelling}>
                                {cancelling ? 'Cancelling…' : 'Yes, Cancel It'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const S = {
    page: { minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: "'DM Sans', sans-serif", padding: '32px 24px', maxWidth: 1000, margin: '0 auto' },
    loadWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f0f0f' },
    spinner: { width: 40, height: 40, borderRadius: '50%', border: '3px solid #333', borderTopColor: '#e85d04' },
    header: { marginBottom: 28 },
    backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13, marginBottom: 4, display: 'block', padding: 0 },
    title: { fontSize: 28, fontWeight: 700, margin: 0 },
    subtitle: { fontSize: 14, color: '#666', margin: '4px 0 0' },
    toast: { background: '#ef444422', border: '1px solid #ef444444', color: '#ef4444', padding: '12px 20px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 600 },
    filterBar: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
    filterBtn: { background: '#1a1a1a', border: '1px solid #333', color: '#888', padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
    filterActive: { background: '#e85d0422', borderColor: '#e85d04', color: '#e85d04' },
    filterCount: { background: '#333', color: '#888', fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10 },
    emptyState: { textAlign: 'center', padding: '80px 24px' },
    emptyTitle: { fontSize: 20, fontWeight: 700, margin: '16px 0 8px' },
    emptySub: { color: '#666', marginBottom: 24 },
    shopBtn: { background: '#e85d04', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    ordersList: { display: 'flex', flexDirection: 'column', gap: 16 },
    orderCard: { background: '#1a1a1a', borderRadius: 16, border: '1px solid #222', overflow: 'hidden' },
    orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', cursor: 'pointer' },
    orderLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    statusBubble: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
    orderId: { fontSize: 14, fontWeight: 700, margin: 0, color: '#f0f0f0' },
    orderDate: { fontSize: 12, color: '#666', margin: '2px 0 0' },
    orderRight: { display: 'flex', alignItems: 'center', gap: 16 },
    orderTotal: { fontSize: 18, fontWeight: 800, color: '#e85d04' },
    orderBody: { padding: '0 24px 24px', borderTop: '1px solid #222' },
    stepper: { display: 'flex', padding: '24px 0', overflowX: 'auto' },
    stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 80 },
    stepLine: { display: 'flex', alignItems: 'center', width: '100%' },
    stepCircle: { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 },
    stepConnector: { flex: 1, height: 2 },
    stepLabel: { fontSize: 12, textAlign: 'center', marginTop: 8 },
    cancelledBanner: { background: '#ef444422', border: '1px solid #ef444444', color: '#ef4444', padding: '14px 20px', borderRadius: 10, marginTop: 20, fontSize: 14, fontWeight: 600 },
    sectionTitle: { fontSize: 14, fontWeight: 700, color: '#888', margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: 1 },
    itemsList: { display: 'flex', flexDirection: 'column', gap: 8 },
    orderItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#111', borderRadius: 10, border: '1px solid #1e1e1e' },
    itemImgWrap: { width: 52, height: 52, borderRadius: 8, overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 },
    itemImg: { width: '100%', height: '100%', objectFit: 'cover' },
    itemImgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: 600, margin: 0, color: '#f0f0f0' },
    itemQty: { fontSize: 12, color: '#666', margin: '2px 0 0' },
    itemPrice: { fontSize: 15, fontWeight: 700, color: '#e85d04' },
    metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 },
    metaBox: { background: '#111', borderRadius: 10, padding: '14px', border: '1px solid #1e1e1e' },
    metaLabel: { fontSize: 12, color: '#666', margin: '0 0 4px' },
    metaValue: { fontSize: 14, fontWeight: 600, margin: 0, color: '#f0f0f0' },
    cancelSection: { marginTop: 20 },
    cancelBtn: { background: 'none', border: '1px solid #ef444466', color: '#ef4444', padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    cancelNote: { fontSize: 12, color: '#555', marginTop: 8 },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#1a1a1a', borderRadius: 20, padding: '36px', maxWidth: 420, width: '90%', border: '1px solid #333', textAlign: 'center' },
    modalTitle: { fontSize: 22, fontWeight: 700, margin: '0 0 10px' },
    modalText: { color: '#888', fontSize: 14, lineHeight: 1.6, marginBottom: 28 },
    modalActions: { display: 'flex', gap: 12 },
    keepBtn: { flex: 1, background: '#222', color: '#ddd', border: '1px solid #333', borderRadius: 12, padding: '14px', cursor: 'pointer', fontSize: 15, fontWeight: 600 },
    confirmCancelBtn: { flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', cursor: 'pointer', fontSize: 15, fontWeight: 700 },
}