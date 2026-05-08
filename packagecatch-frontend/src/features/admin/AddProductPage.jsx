import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../../api/productService';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { 
    Package, Image as ImageIcon, Tag, Info, DollarSign, 
    Layers, Plus, Trash2, ArrowLeft, CheckCircle2, 
    UploadCloud, Eye, Box, AlertCircle, ChevronLeft, ChevronRight,
    User, MapPin, Clock
} from 'lucide-react';

const AddProductPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [images, setImages] = useState([]); 
    const [uploading, setUploading] = useState(false);
    const [previewIdx, setPreviewIdx] = useState(0);

    const [form, setForm] = useState({
        name: '',
        price: '',
        originalPrice: '',
        category: 'Tops',
        condition: 'New',
        description: '',
        tag: 'NEW',
        stockQuantity: '1'
    });

    useEffect(() => {
        if (isEdit) {
            productService.getById(id).then(data => {
                setForm({
                    name: data.name || '',
                    price: data.price || '',
                    originalPrice: data.originalPrice || '',
                    category: data.category || 'Tops',
                    condition: data.condition || 'New',
                    description: data.description || '',
                    tag: data.tag || 'NEW',
                    stockQuantity: data.stockQuantity || '1'
                });
                setImages(data.images || []);
                setLoading(false);
            }).catch(e => {
                console.error(e);
                setLoading(false);
            });
        }
    }, [id, isEdit]);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        if (images.length + files.length > 10) {
            alert('Maximum 10 photos allowed.');
            return;
        }

        setUploading(true);
        const newImages = [...images];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `product_images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                alert('Error uploading image');
                continue;
            }

            const { data } = supabase.storage.from('products').getPublicUrl(filePath);
            newImages.push(data.publicUrl);
        }

        setImages(newImages);
        setUploading(false);
    };

    const removeImage = (index) => {
        const updated = images.filter((_, i) => i !== index);
        setImages(updated);
        if (previewIdx >= updated.length) setPreviewIdx(Math.max(0, updated.length - 1));
    };

    const handleSave = async (status) => {
        if (!form.name || !form.price || !form.category) {
            alert('Please fill in required fields: Title, Price, Category');
            return;
        }

        setSaving(true);
        const payload = {
            ...form,
            price: Number(form.price),
            originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
            stockQuantity: Number(form.stockQuantity),
            images,
            status // 'draft' or 'active'
        };

        try {
            if (isEdit) {
                await productService.update(id, payload);
            } else {
                await productService.create(payload);
            }
            navigate('/admin');
        } catch (e) {
            alert('Error saving product: ' + (e.response?.data?.error || e.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #e63946', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
        fontSize: '13px', fontWeight: '500', outline: 'none', background: '#fff',
        transition: 'all 0.2s', marginBottom: '14px', boxSizing: 'border-box'
    };

    const labelStyle = {
        fontSize: '9px', fontWeight: '900', color: '#64748b', letterSpacing: '0.8px',
        textTransform: 'uppercase', marginBottom: '6px', display: 'block'
    };

    return (
        <div style={{ height: '100vh', display: 'flex', background: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
            
            {/* LEFT: LIVE PREVIEW (PROPORTIONAL SIZE) */}
            <div style={{ flex: 1.2, background: '#0a0a0a', padding: '32px', display: 'flex', flexDirection: 'column', color: '#fff', overflowY: 'auto' }}>
                <div onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', marginBottom: '24px' }}>
                    <ArrowLeft size={12} /> BACK TO COMMAND
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '1.5px', color: '#e63946', marginBottom: '4px' }}>LIVE PREVIEW</h2>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>Review your boutique listing in real-time.</p>
                </div>

                {/* SCALED PREVIEW CARD */}
                <div style={{ 
                    background: '#141414', borderRadius: '20px', overflow: 'hidden', 
                    display: 'flex', border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)', minHeight: '380px'
                }}>
                    {/* Image Area */}
                    <div style={{ flex: 1.1, background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {images.length > 0 ? (
                            <>
                                <img src={images[previewIdx]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                {images.length > 1 && (
                                    <div style={{ position: 'absolute', bottom: '12px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                        {images.map((_, i) => (
                                            <div key={i} onClick={() => setPreviewIdx(i)} style={{ width: '5px', height: '5px', borderRadius: '50%', background: i === previewIdx ? '#e63946' : 'rgba(255,255,255,0.15)', cursor: 'pointer' }} />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.1)' }}>
                                <ImageIcon size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                <div style={{ fontSize: '11px', fontWeight: '700' }}>Visual preview active...</div>
                            </div>
                        )}
                    </div>

                    {/* Info Area */}
                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>{form.name || 'Product Title'}</h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: '#e63946' }}>₱{Number(form.price || 0).toLocaleString()}</div>
                                {form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
                                    <>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>₱{Number(form.originalPrice).toLocaleString()}</div>
                                        <div style={{ fontSize: '9px', fontWeight: '900', color: '#e63946', background: 'rgba(230,57,70,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                            -{Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)}%
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>{form.condition.toUpperCase()}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                                    <Clock size={10} /> RECENTLY LISTED
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', marginBottom: '8px' }}>DESCRIPTION</div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
                                {form.description || 'Provide a narrative for this piece.'}
                            </p>
                        </div>

                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={16} color="rgba(255,255,255,0.3)" />
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: '800' }}>{user?.user_metadata?.full_name || 'Administrator'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: COMPACT FORM AREA */}
            <div style={{ flex: 0.8, background: '#f8fafc', padding: '32px 48px', overflowY: 'auto' }}>
                <div style={{ maxWidth: '400px' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>{isEdit ? 'Refine' : 'Curate'} <span style={{ color: '#e63946' }}>Listing</span></h1>
                        <p style={{ color: '#64748b', fontWeight: '500', fontSize: '13px', marginTop: '2px' }}>Enter product details below.</p>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()}>
                        {/* IMAGERY GRID */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>imagery (up to 10)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                {images.map((img, i) => (
                                    <div key={i} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0' }}>
                                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: '3px', right: '3px', background: '#e63946', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={8} /></button>
                                    </div>
                                ))}
                                {images.length < 10 && (
                                    <label style={{ aspectRatio: '1', border: '1.5px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff', color: '#94a3b8' }}>
                                        <UploadCloud size={18} />
                                        <input type="file" multiple accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <label style={labelStyle}>Product Title</label>
                        <input placeholder="e.g. Vintage Blazer" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Category</label>
                                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle}>
                                    {['Tops', 'Bottoms', 'Dresses', 'Accessories', 'Electronics'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Condition</label>
                                <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} style={inputStyle}>
                                    {['New', 'Open-Box', 'Refurbished', 'Used - Like New', 'Used - Good', 'Used - Fair'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Sale Price (₱)</label>
                                <input type="number" placeholder="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Original Price (₱)</label>
                                <input type="number" placeholder="Optional" value={form.originalPrice} onChange={e => setForm({...form, originalPrice: e.target.value})} style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                             <div>
                                <label style={labelStyle}>Category</label>
                                <input placeholder="e.g. Vintage" value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Stock Quantity</label>
                                <input type="number" value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})} style={inputStyle} />
                            </div>
                        </div>

                        <label style={labelStyle}>Narrative</label>
                        <textarea placeholder="Tell the story..." rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{...inputStyle, resize: 'none'}} />

                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button onClick={() => handleSave('draft')} disabled={saving} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.3s' }}>
                                DRAFT
                            </button>
                            <button onClick={() => handleSave('active')} disabled={saving} style={{ flex: 1.5, padding: '14px', borderRadius: '12px', background: '#e63946', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(230, 57, 70, 0.2)' }}>
                                {saving ? 'SYNCING...' : 'PUBLISH'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                input:focus, select:focus, textarea:focus { border-color: #111 !important; outline: none; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); borderRadius: 10px; }
            `}</style>
        </div>
    );
};

export default AddProductPage;