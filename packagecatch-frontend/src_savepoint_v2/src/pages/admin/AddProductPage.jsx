import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { productService } from '../../api/productService'
import { saveDraft, getDrafts, deleteDraft } from './ProductDraftPage'

const CATEGORIES = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Beauty', 'Automotive', 'Food', 'Other']

export default function AddProductPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const isDraftEdit = searchParams.get('draft') === 'true'
    const fileRef = useRef()

    const [form, setForm] = useState({ name: '', description: '', price: '', originalPrice: '', category: '', stockQuantity: '', imageUrl: '', images: [] })
    const [imagePreview, setImagePreview] = useState(null)
    const [extraPreviews, setExtraPreviews] = useState([])
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState({})
    const [dragOver, setDragOver] = useState(false)

    useEffect(() => {
        if (id && isDraftEdit) {
            const draft = getDrafts().find(d => d.id === id)
            if (draft) {
                setForm(draft)
                if (draft.imageUrl) setImagePreview(draft.imageUrl)
                if (draft.images) setExtraPreviews(draft.images)
            }
        } else if (id) {
            productService.getById(id).then(p => {
                setForm({ name: p.name, description: p.description || '', price: p.price, originalPrice: p.originalPrice || '', category: p.category || '', stockQuantity: p.stockQuantity, imageUrl: p.imageUrl || '', images: p.images || [] })
                if (p.imageUrl) setImagePreview(p.imageUrl)
                if (p.images) setExtraPreviews(p.images)
            })
        }
    }, [id])

    const set = (field, value) => {
        setForm(f => ({ ...f, [field]: value }))
        setErrors(e => ({ ...e, [field]: '' }))
    }

    const fileToDataUrl = (file) => new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = e => res(e.target.result)
        reader.onerror = rej
        reader.readAsDataURL(file)
    })

    const handleMainImage = async (file) => {
        if (!file || !file.type.startsWith('image/')) return
        const dataUrl = await fileToDataUrl(file)
        setImagePreview(dataUrl)
        set('imageUrl', dataUrl)
    }

    const handleExtraImages = async (files) => {
        const newPreviews = []
        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) continue
            newPreviews.push(await fileToDataUrl(file))
        }
        const combined = [...extraPreviews, ...newPreviews]
        setExtraPreviews(combined)
        setForm(f => ({ ...f, images: combined }))
    }

    const removeExtraImage = (idx) => {
        const updated = extraPreviews.filter((_, i) => i !== idx)
        setExtraPreviews(updated)
        setForm(f => ({ ...f, images: updated }))
    }

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = 'Product name is required'
        if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Valid price is required'
        if (!form.stockQuantity || isNaN(form.stockQuantity)) e.stockQuantity = 'Stock quantity is required'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSaveDraft = () => {
        if (!form.name.trim()) { setErrors({ name: 'Add a name before saving draft' }); return }
        saveDraft({ ...form, id: id && isDraftEdit ? id : undefined })
        navigate('/admin/drafts')
    }

    const handlePublish = async () => {
        if (!validate()) return
        setSaving(true)
        try {
            const payload = { ...form, price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : null, stockQuantity: Number(form.stockQuantity), active: true }
            if (id && !isDraftEdit) await productService.update(id, payload)
            else {
                await productService.create(payload)
                if (id && isDraftEdit) deleteDraft(id)
            }
            navigate('/admin')
        } catch (err) {
            alert('Failed to publish. ' + (err.response?.data?.message || ''))
        } finally {
            setSaving(false)
        }
    }

    const discount = form.price && form.originalPrice
        ? Math.round((1 - Number(form.price) / Number(form.originalPrice)) * 100)
        : 0

    return (
        <div style={S.page}>
            <div style={S.header}>
                <div>
                    <button onClick={() => navigate(-1)} style={S.backBtn}>← Back</button>
                    <h1 style={S.title}>{id && !isDraftEdit ? 'Edit Product' : 'New Product'}</h1>
                </div>
                <div style={S.headerActions}>
                    <button onClick={handleSaveDraft} style={S.draftBtn}>Save as Draft</button>
                    <button onClick={handlePublish} disabled={saving} style={S.publishBtn}>
                        {saving ? 'Publishing…' : '🚀 Publish Product'}
                    </button>
                </div>
            </div>

            <div style={S.layout}>
                {/* Left */}
                <div style={S.mainCol}>
                    <div style={S.card}>
                        <h2 style={S.cardTitle}>Basic Information</h2>
                        <div style={S.field}>
                            <label style={S.label}>Product Name *</label>
                            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Premium Wireless Headphones"
                                   style={{ ...S.input, ...(errors.name ? S.inputError : {}) }} />
                            {errors.name && <span style={S.error}>{errors.name}</span>}
                        </div>
                        <div style={S.field}>
                            <label style={S.label}>Description</label>
                            <textarea value={form.description} onChange={e => set('description', e.target.value)}
                                      placeholder="Describe the product in detail..." rows={5} style={S.textarea} />
                        </div>
                        <div style={S.field}>
                            <label style={S.label}>Category</label>
                            <select value={form.category} onChange={e => set('category', e.target.value)} style={S.select}>
                                <option value="">Select a category</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={S.card}>
                        <h2 style={S.cardTitle}>Pricing</h2>
                        <div style={S.row}>
                            <div style={{ ...S.field, flex: 1 }}>
                                <label style={S.label}>Sale Price ($) *</label>
                                <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                                       placeholder="0.00" min="0" step="0.01"
                                       style={{ ...S.input, ...(errors.price ? S.inputError : {}) }} />
                                {errors.price && <span style={S.error}>{errors.price}</span>}
                            </div>
                            <div style={{ ...S.field, flex: 1 }}>
                                <label style={S.label}>Original Price ($)</label>
                                <input type="number" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)}
                                       placeholder="0.00" min="0" step="0.01" style={S.input} />
                            </div>
                        </div>
                        {discount > 0 && (
                            <div style={S.discountPreview}>🏷️ Will show a <strong>{discount}% discount</strong> badge</div>
                        )}
                    </div>

                    <div style={S.card}>
                        <h2 style={S.cardTitle}>Inventory</h2>
                        <div style={S.field}>
                            <label style={S.label}>Stock Quantity *</label>
                            <input type="number" value={form.stockQuantity} onChange={e => set('stockQuantity', e.target.value)}
                                   placeholder="0" min="0"
                                   style={{ ...S.input, ...(errors.stockQuantity ? S.inputError : {}) }} />
                            {errors.stockQuantity && <span style={S.error}>{errors.stockQuantity}</span>}
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div style={S.sideCol}>
                    <div style={S.card}>
                        <h2 style={S.cardTitle}>Product Images</h2>
                        <div
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleMainImage(e.dataTransfer.files[0]) }}
                            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onClick={() => fileRef.current?.click()}
                            style={{ ...S.dropZone, ...(dragOver ? S.dropZoneActive : {}), ...(imagePreview ? { padding: 0, minHeight: 200 } : {}) }}
                        >
                            {imagePreview
                                ? <img src={imagePreview} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 10 }} />
                                : (
                                    <div style={S.dropMsg}>
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
                                        <p style={S.dropTitle}>Drop your main image here</p>
                                        <p style={S.dropSub}>or click to browse files</p>
                                        <p style={{ fontSize: 11, color: '#444', margin: 0 }}>PNG, JPG, WebP up to 10MB</p>
                                    </div>
                                )
                            }
                            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                                   onChange={e => handleMainImage(e.target.files[0])} />
                        </div>

                        {imagePreview && (
                            <button onClick={() => { setImagePreview(null); set('imageUrl', '') }} style={S.removeImgBtn}>
                                Remove main image
                            </button>
                        )}

                        <div style={{ marginTop: 16 }}>
                            <label style={S.label}>Additional Images</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                {extraPreviews.map((src, idx) => (
                                    <div key={idx} style={S.extraThumb}>
                                        <img src={src} alt={`Extra ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button onClick={() => removeExtraImage(idx)} style={S.removeThumb}>×</button>
                                    </div>
                                ))}
                                <label style={S.addMoreBtn}>
                                    <span>+</span>
                                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                                           onChange={e => handleExtraImages(e.target.files)} />
                                </label>
                            </div>
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <label style={S.label}>Or paste image URL</label>
                            <input
                                value={form.imageUrl?.startsWith('data:') ? '' : (form.imageUrl || '')}
                                onChange={e => { set('imageUrl', e.target.value); setImagePreview(e.target.value || null) }}
                                placeholder="https://example.com/image.jpg"
                                style={S.input}
                            />
                        </div>
                    </div>

                    {/* Live preview */}
                    {(form.name || imagePreview) && (
                        <div style={S.card}>
                            <h2 style={S.cardTitle}>Preview</h2>
                            <div style={{ background: '#111', borderRadius: 12, overflow: 'hidden', border: '1px solid #222' }}>
                                <div style={{ height: 160, background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
                                    {imagePreview
                                        ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.3 }}>📦</div>
                                    }
                                    {discount > 0 && (
                                        <div style={{ position: 'absolute', top: 8, left: 8, background: '#e85d04', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                                            -{discount}%
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '12px' }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 6px', color: '#f0f0f0' }}>
                                        {form.name || 'Product Name'}
                                    </p>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#e85d04' }}>
                      ${form.price ? Number(form.price).toFixed(2) : '0.00'}
                    </span>
                                        {form.originalPrice && (
                                            <span style={{ fontSize: 13, color: '#555', textDecoration: 'line-through' }}>
                        ${Number(form.originalPrice).toFixed(2)}
                      </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const S = {
    page: { minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: "'DM Sans', sans-serif", padding: '32px 24px', maxWidth: 1200, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
    backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13, marginBottom: 4, display: 'block', padding: 0 },
    title: { fontSize: 28, fontWeight: 700, margin: 0 },
    headerActions: { display: 'flex', gap: 12 },
    draftBtn: { background: '#1a1a1a', color: '#ddd', border: '1px solid #333', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    publishBtn: { background: '#e85d04', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' },
    mainCol: { display: 'flex', flexDirection: 'column', gap: 20 },
    sideCol: { display: 'flex', flexDirection: 'column', gap: 20 },
    card: { background: '#1a1a1a', borderRadius: 16, padding: '24px', border: '1px solid #222' },
    cardTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: '#f0f0f0' },
    field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
    label: { fontSize: 13, fontWeight: 600, color: '#999' },
    input: { background: '#111', border: '1px solid #333', borderRadius: 10, padding: '12px 14px', color: '#f0f0f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" },
    inputError: { borderColor: '#ef4444' },
    textarea: { background: '#111', border: '1px solid #333', borderRadius: 10, padding: '12px 14px', color: '#f0f0f0', fontSize: 14, outline: 'none', resize: 'vertical', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" },
    select: { background: '#111', border: '1px solid #333', borderRadius: 10, padding: '12px 14px', color: '#f0f0f0', fontSize: 14, outline: 'none', width: '100%', cursor: 'pointer' },
    row: { display: 'flex', gap: 16 },
    discountPreview: { background: '#e85d0411', border: '1px solid #e85d0433', color: '#e85d04', padding: '10px 14px', borderRadius: 8, fontSize: 13 },
    error: { fontSize: 12, color: '#ef4444' },
    dropZone: { border: '2px dashed #333', borderRadius: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#111', position: 'relative', overflow: 'hidden', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    dropZoneActive: { borderColor: '#e85d04', background: '#e85d0411' },
    dropMsg: { pointerEvents: 'none' },
    dropTitle: { fontSize: 15, fontWeight: 600, color: '#ddd', margin: '0 0 4px' },
    dropSub: { fontSize: 13, color: '#666', margin: '0 0 8px' },
    removeImgBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, marginTop: 8, padding: 0 },
    extraThumb: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', position: 'relative', background: '#111', border: '1px solid #333' },
    removeThumb: { position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
    addMoreBtn: { width: 72, height: 72, borderRadius: 8, background: '#111', border: '2px dashed #333', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555', fontSize: 28 },
}