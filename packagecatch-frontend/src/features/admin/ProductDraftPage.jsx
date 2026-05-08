import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productService } from '../products/productService'

const DRAFTS_KEY = 'product_drafts'

export function getDrafts() {
    return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]')
}
export function saveDraft(draft) {
    const drafts = getDrafts()
    const idx = drafts.findIndex(d => d.id === draft.id)
    if (idx >= 0) drafts[idx] = draft
    else drafts.push({ ...draft, id: Date.now().toString(), createdAt: new Date().toISOString() })
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
}
export function deleteDraft(id) {
    const drafts = getDrafts().filter(d => d.id !== id)
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
}

export default function ProductDraftPage() {
    const navigate = useNavigate()
    const [drafts, setDrafts] = useState([])
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [publishSuccess, setPublishSuccess] = useState(null)
    const [filter, setFilter] = useState('all')

    useEffect(() => { setDrafts(getDrafts()) }, [])

    const handleDelete = (id) => {
        deleteDraft(id)
        setDrafts(getDrafts())
        setConfirmDelete(null)
    }

    const handlePublish = async (draft) => {
        try {
            await productService.create({
                name: draft.name,
                description: draft.description,
                price: draft.price,
                originalPrice: draft.originalPrice,
                imageUrl: draft.imageUrl,
                category: draft.category,
                stockQuantity: draft.stockQuantity,
                active: true,
            })
            deleteDraft(draft.id)
            setDrafts(getDrafts())
            setPublishSuccess(draft.name)
            setTimeout(() => setPublishSuccess(null), 3000)
        } catch {
            alert('Failed to publish. Make sure you are logged in as Admin.')
        }
    }

    const categories = [...new Set(drafts.map(d => d.category).filter(Boolean))]
    const filtered = filter === 'all' ? drafts : drafts.filter(d => d.category === filter)

    return (
        <div style={S.page}>
            <div style={S.header}>
                <div>
                    <button onClick={() => navigate('/admin')} style={S.backBtn}>← Back to Dashboard</button>
                    <h1 style={S.title}>Product Drafts</h1>
                    <p style={S.subtitle}>{drafts.length} saved draft{drafts.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => navigate('/admin/products/new')} style={S.newBtn}>+ New Product</button>
            </div>

            {publishSuccess && (
                <div style={S.toast}>✓ "{publishSuccess}" is now live!</div>
            )}

            {categories.length > 0 && (
                <div style={S.filterBar}>
                    {['all', ...categories].map(cat => (
                        <button key={cat} onClick={() => setFilter(cat)}
                                style={{ ...S.filterBtn, ...(filter === cat ? S.filterActive : {}) }}>
                            {cat === 'all' ? 'All Drafts' : cat}
                        </button>
                    ))}
                </div>
            )}

            {filtered.length === 0 && (
                <div style={S.emptyState}>
                    <div style={{ fontSize: 64 }}>📝</div>
                    <h3 style={S.emptyTitle}>No drafts yet</h3>
                    <p style={S.emptySub}>When you save a product as a draft, it appears here.</p>
                    <button onClick={() => navigate('/admin/products/new')} style={S.newBtn}>Create Your First Product</button>
                </div>
            )}

            <div style={S.grid}>
                {filtered.map(draft => (
                    <div key={draft.id} style={S.card}>
                        <div style={S.imgWrap}>
                            {draft.imageUrl
                                ? <img src={draft.imageUrl} alt={draft.name} style={S.img}
                                       onError={e => { e.target.src = `https://placehold.co/300x200/1a1a1a/555?text=Draft` }} />
                                : <div style={S.imgEmpty}><span style={{ fontSize: 32, opacity: 0.3 }}>🖼️</span></div>
                            }
                            <div style={S.draftBadge}>DRAFT</div>
                        </div>

                        <div style={S.cardBody}>
                            {draft.category && <span style={S.catTag}>{draft.category}</span>}
                            <h3 style={S.cardTitle}>{draft.name || 'Untitled Product'}</h3>
                            <p style={S.cardDesc}>
                                {draft.description
                                    ? draft.description.slice(0, 80) + (draft.description.length > 80 ? '…' : '')
                                    : 'No description'}
                            </p>
                            <div style={S.priceRow}>
                                {draft.price && <span style={S.price}>${Number(draft.price).toFixed(2)}</span>}
                                {draft.originalPrice && <span style={S.origPrice}>${Number(draft.originalPrice).toFixed(2)}</span>}
                            </div>
                            <div style={S.meta}>
                                <span style={S.metaItem}>📦 {draft.stockQuantity || 0} units</span>
                                <span style={S.metaItem}>🕐 {new Date(draft.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div style={S.actions}>
                            <button onClick={() => navigate(`/admin/products/edit/${draft.id}?draft=true`)} style={S.editBtn}>Edit</button>
                            <button onClick={() => handlePublish(draft)} style={S.publishBtn}>🚀 Go Live</button>
                            <button onClick={() => setConfirmDelete(draft.id)} style={S.deleteBtn}>🗑</button>
                        </div>
                    </div>
                ))}
            </div>

            {confirmDelete && (
                <div style={S.modalOverlay}>
                    <div style={S.modal}>
                        <h3 style={S.modalTitle}>Delete this draft?</h3>
                        <p style={S.modalText}>This action cannot be undone.</p>
                        <div style={S.modalActions}>
                            <button onClick={() => setConfirmDelete(null)} style={S.cancelBtn}>Cancel</button>
                            <button onClick={() => handleDelete(confirmDelete)} style={S.confirmDeleteBtn}>Delete</button>
                        </div>
                    </div>
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
    newBtn: { background: '#e85d04', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    toast: { background: '#22c55e22', border: '1px solid #22c55e44', color: '#22c55e', padding: '12px 20px', borderRadius: 10, marginBottom: 24, fontSize: 14, fontWeight: 600 },
    filterBar: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
    filterBtn: { background: '#1a1a1a', border: '1px solid #333', color: '#888', padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer' },
    filterActive: { background: '#e85d0422', borderColor: '#e85d04', color: '#e85d04' },
    emptyState: { textAlign: 'center', padding: '80px 24px' },
    emptyTitle: { fontSize: 20, fontWeight: 700, margin: '16px 0 8px' },
    emptySub: { color: '#666', marginBottom: 24, fontSize: 14 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 },
    card: { background: '#1a1a1a', borderRadius: 16, border: '1px solid #222', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    imgWrap: { position: 'relative', height: 200, background: '#111', overflow: 'hidden' },
    img: { width: '100%', height: '100%', objectFit: 'cover' },
    imgEmpty: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    draftBadge: { position: 'absolute', top: 12, right: 12, background: '#f59e0b', color: '#000', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: 1 },
    cardBody: { padding: '16px', flex: 1 },
    catTag: { display: 'inline-block', background: '#e85d0422', color: '#e85d04', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
    cardTitle: { fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: '#f0f0f0' },
    cardDesc: { fontSize: 13, color: '#777', lineHeight: 1.5, margin: '0 0 12px' },
    priceRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
    price: { fontSize: 20, fontWeight: 700, color: '#e85d04' },
    origPrice: { fontSize: 14, color: '#555', textDecoration: 'line-through' },
    meta: { display: 'flex', gap: 12, flexWrap: 'wrap' },
    metaItem: { fontSize: 12, color: '#555' },
    actions: { display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid #222' },
    editBtn: { flex: 1, background: '#222', color: '#ddd', border: '1px solid #333', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    publishBtn: { flex: 2, background: '#e85d04', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
    deleteBtn: { background: '#1a1a1a', color: '#ef4444', border: '1px solid #ef444433', borderRadius: 8, padding: '8px 12px', fontSize: 16, cursor: 'pointer' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#1a1a1a', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', border: '1px solid #333' },
    modalTitle: { fontSize: 20, fontWeight: 700, margin: '0 0 8px' },
    modalText: { color: '#888', fontSize: 14, marginBottom: 24 },
    modalActions: { display: 'flex', gap: 12 },
    cancelBtn: { flex: 1, background: '#222', color: '#ddd', border: '1px solid #333', borderRadius: 10, padding: '12px', cursor: 'pointer', fontSize: 14 },
    confirmDeleteBtn: { flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
}