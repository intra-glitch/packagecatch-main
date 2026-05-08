import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../../shared/supabaseClient'
import AvatarEditor from 'react-avatar-editor'
import { orderService } from '../../api/orderService'
import { cartService } from '../../api/cartService'
import { User, Package, MapPin, Phone, ShieldCheck, LogOut, ShoppingBag, Camera, ChevronRight, CheckCircle2, Clock, Truck, CheckCircle, TrendingUp, Mail, Edit3, ArrowLeft, ShoppingCart } from 'lucide-react'

const ProfilePage = () => {
    const navigate = useNavigate()
    const { user, logout, updateProfile, updatePassword, isAdmin } = useAuth()
    
    useEffect(() => {
        if (isAdmin) navigate('/admin')
    }, [isAdmin, navigate])
    
    const meta = user?.user_metadata || {}

    const [activeTab, setActiveTab] = useState('orders')
    const [editing, setEditing] = useState(false)
    const [editingPassword, setEditingPassword] = useState(false)
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
    const [notification, setNotification] = useState('')
    const [loadingOrders, setLoadingOrders] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const [userOrders, setUserOrders] = useState([])
    const [cartCount, setCartCount] = useState(0)
    const [orderCount, setOrderCount] = useState(0)

    const syncCartCount = () => {
        const cart = cartService.getCart(user?.id)
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0))
    }

    useEffect(() => {
        syncCartCount()
        const syncOrders = async () => {
            const ords = await orderService.getMyOrders();
            setOrderCount(orderService.getActiveCount(ords));
        }
        syncOrders();
        window.addEventListener('cartUpdated', syncCartCount)
        window.addEventListener('ordersUpdated', syncOrders)
        return () => {
            window.removeEventListener('cartUpdated', syncCartCount)
            window.removeEventListener('ordersUpdated', syncOrders)
        }
    }, [user])
    
    // Avatar Editor State
    const [imageFile, setImageFile] = useState(null)
    const [editorOpen, setEditorOpen] = useState(false)
    const [zoom, setZoom] = useState(1.2)
    const [rotate, setRotate] = useState(0)
    const editorRef = useRef(null)
    
    const [profile, setProfile] = useState({
        fullName: meta.full_name || meta.fullName || (meta.firstName && meta.lastName ? `${meta.firstName} ${meta.lastName}` : (meta.firstName || meta.lastName || 'Valued Member')),
        email: user?.email || '',
        phone: meta.phone || '',
        address: meta.address || '',
        landmark: meta.landmark || '',
        avatar: meta.avatar || '',
    })

    const [editForm, setEditForm] = useState({ ...profile })

    const fetchOrders = async (isInitial = false) => {
        if (isInitial) setLoadingOrders(true)
        try {
            const data = await orderService.getMyOrders()
            setUserOrders(data)
        } catch (err) {
            console.error('Error fetching orders:', err)
        } finally {
            setLoadingOrders(false)
        }
    }

    useEffect(() => {
        if (user) {
            const m = user.user_metadata || {}
            // Normalize name to avoid "undefined undefined"
            const nameFromMeta = m.full_name || m.fullName || (m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : (m.firstName || m.lastName || 'Valued Member'));
            
            const data = {
                fullName: nameFromMeta,
                email: user.email || '',
                phone: m.phone || '',
                address: m.address || '',
                landmark: m.landmark || '',
                avatar: m.avatar || '',
            }
            setProfile(data)
            setEditForm(data)
            if (userOrders.length === 0) fetchOrders(true)
        }
    }, [user])

    const statusConfig = {
        pending:          { label: 'Pending',           bg: '#fff8e1', color: '#b8860b', icon: <Clock size={14} /> },
        packed:           { label: 'Packed',             bg: '#e8f4fd', color: '#1565c0', icon: <Package size={14} /> },
        out_for_delivery: { label: 'In Transit',         bg: '#f0fff8', color: '#1b6b4a', icon: <Truck size={14} /> },
        completed:        { label: 'Delivered',          bg: '#f0fff8', color: '#1b6b4a', icon: <CheckCircle size={14} /> },
        cancelled:        { label: 'Cancelled',          bg: '#fff0f0', color: '#c62828', icon: <LogOut size={14} /> },
    }

    const showNotif = (msg) => {
        setNotification(msg)
        setTimeout(() => setNotification(''), 2500)
    }

    const handleLogout = async () => {
        setLoggingOut(true)
        setTimeout(async () => {
            await logout()
            navigate('/')
        }, 1200)
    }

    const handleSave = async () => {
        try {
            await updateProfile({
                fullName: editForm.fullName,
                phone: editForm.phone,
                address: editForm.address,
                landmark: editForm.landmark,
                avatar: editForm.avatar,
            })
            setProfile({ ...editForm })
            setEditing(false)
            showNotif('Profile updated successfully!')
        } catch (err) {
            alert('Failed to update profile: ' + err.message)
        }
    }

    const handlePasswordSave = async () => {
        if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) return alert('Min 8 characters')
        if (passwordForm.newPassword !== passwordForm.confirmPassword) return alert('Passwords do not match')
        try {
            await updatePassword(passwordForm.newPassword)
            setEditingPassword(false)
            setPasswordForm({ newPassword: '', confirmPassword: '' })
            showNotif('Security updated!')
        } catch (err) { alert('Failed: ' + err.message) }
    }

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            await orderService.cancelOrder(orderId);
            showNotif('Order cancelled successfully');
            fetchOrders();
            // Trigger badge update
            window.dispatchEvent(new Event('ordersUpdated'));
        } catch (err) {
            alert('Failed to cancel order: ' + err.message);
        }
    }

    const handleSaveAvatar = async () => {
        if (editorRef.current) {
            showNotif('Optimizing avatar...')
            const canvas = editorRef.current.getImageScaledToCanvas()
            canvas.toBlob(async (blob) => {
                try {
                    let fileExt = 'png'
                    if (imageFile && imageFile.name) fileExt = imageFile.name.split('.').pop()
                    const fileName = `${user.id}-${Math.random()}.${fileExt}`
                    const filePath = `public/${fileName}`
                    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, { contentType: `image/${fileExt}` })
                    if (uploadError) throw uploadError
                    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
                    setEditForm({ ...editForm, avatar: publicUrl })
                    setProfile({ ...profile, avatar: publicUrl })
                    await updateProfile({ ...editForm, avatar: publicUrl })
                    setEditorOpen(false)
                    setImageFile(null)
                    showNotif('Avatar saved!')
                } catch (err) { alert('Error: ' + err.message) }
            }, "image/png")
        }
    }

    const inputStyle = {
        width: '100%', padding: '16px 20px',
        borderRadius: '16px', fontSize: '15px',
        border: '2px solid #f0f0f0', background: '#fff',
        outline: 'none', transition: 'all 0.3s', fontWeight: '500'
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fcfcfc', fontFamily: "'Inter', sans-serif", color: '#111' }}>

            {/* LOGGING OUT TRANSITION */}
            {loggingOut && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                    <div style={{ width: '50px', height: '50px', border: '4px solid #f0f0f0', borderTop: '4px solid #e63946', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontWeight: '900', letterSpacing: '2px', fontSize: '13px', color: '#111' }}>LOGGING OUT OF YOUR SECURE SESSION...</p>
                </div>
            )}

            {/* AVATAR EDITOR */}
            {editorOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div style={{ background: '#fff', padding: '48px', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', maxWidth: '440px', width: '90%' }}>
                        <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>Crop Avatar</h3>
                        <AvatarEditor ref={editorRef} image={imageFile} width={240} height={240} border={0} borderRadius={120} color={[255, 255, 255, 0.8]} scale={zoom} rotate={rotate} crossOrigin="anonymous" />
                        <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#e63946' }} />
                        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                            <button onClick={() => setEditorOpen(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#f5f5f5', color: '#666', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSaveAvatar} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#111', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Apply</button>
                        </div>
                    </div>
                </div>
            )}

            {notification && (
                <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#111', color: '#fff', padding: '16px 32px', borderRadius: '50px', fontSize: '13px', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s ease' }}>✓ {notification.toUpperCase()}</div>
            )}

            {/* NAVBAR: ULTRA-COMPACT */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '60px', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0' }}>
                <div onClick={() => navigate('/')} style={{ fontSize: '18px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.5px' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/home')} style={{ background: 'transparent', border: 'none', fontSize: '11px', fontWeight: '900', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={e => e.target.style.color = '#111'}>
                        <ArrowLeft size={16} /> BACK TO SHOP
                    </button>
                    <div onClick={() => navigate('/cart')} style={{ position: 'relative', cursor: 'pointer', color: '#111' }}>
                        <ShoppingCart size={20} strokeWidth={2.5} />
                        {cartCount > 0 && (
                            <div style={{
                                position: 'absolute', top: '-5px', right: '-8px',
                                minWidth: '16px', height: '16px', borderRadius: '50%',
                                background: '#e63946', color: '#fff',
                                fontSize: '9px', fontWeight: '900',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid #fff', padding: '0 2px'
                            }}>{cartCount}</div>
                        )}
                    </div>
                    <button onClick={handleLogout} style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', background: '#111', color: '#fff', cursor: 'pointer', border: 'none' }}>LOG OUT</button>
                </div>
            </nav>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
                
                {/* TABS NAVIGATION: COMPACT */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', padding: '6px', background: '#fff', borderRadius: '16px', border: '1.5px solid #f0f0f0', width: 'fit-content' }}>
                    {[
                        { key: 'orders', label: 'MY ORDERS', icon: <Package size={18} /> },
                        { key: 'account', label: 'ACCOUNT SETTINGS', icon: <User size={18} /> },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => { setActiveTab(tab.key); setEditing(false); }} style={{ 
                            padding: '12px 24px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', 
                            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.3s',
                            background: activeTab === tab.key ? '#111' : 'transparent',
                            color: activeTab === tab.key ? '#fff' : '#888', border: 'none', position: 'relative'
                        }}>
                            {tab.icon && <tab.icon.type {...tab.icon.props} size={14} />} {tab.label}
                            {tab.key === 'orders' && orderCount > 0 && (
                                <div style={{
                                    position: 'absolute', top: '2px', right: '2px',
                                    minWidth: '14px', height: '14px', borderRadius: '50%',
                                    background: activeTab === 'orders' ? '#fff' : '#e63946',
                                    color: activeTab === 'orders' ? '#111' : '#fff',
                                    fontSize: '8px', fontWeight: '900',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1.5px solid #fff'
                                }}>{orderCount}</div>
                            )}
                        </button>
                    ))}
                </div>

                {/* ORDERS TAB */}
                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '600px', overflowY: 'auto', paddingRight: '12px', scrollbarWidth: 'thin', scrollbarColor: '#eee transparent' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '4px' }}>Order History</h1>
                            <p style={{ fontSize: '13px', color: '#aaa', fontWeight: '500' }}>Tracking {userOrders.length} curation drops.</p>
                        </div>
                        {loadingOrders ? (
                             <div style={{ textAlign: 'center', padding: '100px 0' }}><div style={{ width: '40px', height: '40px', border: '3px solid #eee', borderTop: '3px solid #111', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>
                        ) : userOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '120px 0', background: '#fff', borderRadius: '40px', border: '3px dashed #f0f0f0' }}>
                                <div style={{ fontSize: '64px', marginBottom: '32px' }}>🛍️</div>
                                <h3 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '32px' }}>No orders yet.</h3>
                                <button onClick={() => navigate('/home')} style={{ padding: '20px 56px', background: '#111', color: '#fff', borderRadius: '20px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>START SHOPPING</button>
                            </div>
                        ) : userOrders.map(order => {
                            const status = statusConfig[order.status] || statusConfig.pending
                            return (
                                <div key={order.id} style={{ background: '#fff', borderRadius: '24px', border: '1.5px solid #f0f0f0', padding: '20px', display: 'flex', alignItems: 'center', gap: '24px', transition: 'all 0.3s' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{ background: status.bg, color: status.color, fontSize: '9px', fontWeight: '900', padding: '5px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>{status.icon} {status.label.toUpperCase()}</div>
                                            <span style={{ fontSize: '12px', color: '#ccc', fontWeight: '700' }}>#{String(order.id).substring(0, 10).toUpperCase()}</span>
                                            <span style={{ fontSize: '12px', color: '#ccc', fontWeight: '700' }}>• {new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {order.order_items?.slice(0, 5).map((item, idx) => (
                                                <div key={idx} style={{ width: '60px', height: '70px', borderRadius: '12px', background: '#f8f8f8', border: '1px solid #eee', overflow: 'hidden' }}>
                                                    {item.products?.image_url ? <img src={item.products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👗</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#ccc', marginBottom: '4px' }}>TOTAL PAID</div>
                                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#111' }}>₱{order.total_amount.toLocaleString()}</div>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                                            {order.status === 'pending' && (
                                                <button onClick={() => handleCancelOrder(order.id)} style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', border: '1.5px solid #e63946', color: '#e63946', background: 'transparent', cursor: 'pointer' }}>CANCEL ORDER</button>
                                            )}
                                            <button onClick={() => navigate('/home')} style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', border: '1.5px solid #111', background: 'transparent', cursor: 'pointer' }}>REORDER ITEMS</button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ACCOUNT SETTINGS TAB - REDESIGNED SPLIT LAYOUT */}
                {activeTab === 'account' && (
                    <div style={{ 
                        display: 'grid', gridTemplateColumns: '320px 1fr', gap: '0', 
                        background: '#fff', borderRadius: '24px', overflow: 'hidden', 
                        border: '1.5px solid #f0f0f0', boxShadow: '0 20px 50px rgba(0,0,0,0.02)',
                        minHeight: '500px'
                    }}>
                        
                        {/* LEFT PANEL: Cinematic Profile Branding: COMPACT */}
                        <div style={{ background: '#111', color: '#fff', padding: '40px 32px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(230, 57, 70, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
                            
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '32px' }}>
                                    <div style={{ 
                                        width: '100%', height: '100%', borderRadius: '32px', 
                                        background: profile.avatar ? `url(${profile.avatar}) center/cover` : '#e63946', 
                                        border: '3px solid rgba(255,255,255,0.1)', overflow: 'hidden',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '900'
                                    }}>
                                        {!profile.avatar && profile.fullName.charAt(0)}
                                    </div>
                                    <label style={{ 
                                        position: 'absolute', bottom: '-5px', right: '-5px', width: '32px', height: '32px', 
                                        background: '#fff', color: '#111', borderRadius: '10px', display: 'flex', 
                                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' 
                                    }}>
                                        <Camera size={16} />
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files[0]; if (file) { setImageFile(file); setZoom(1.2); setRotate(0); setEditorOpen(true); } }} />
                                    </label>
                                </div>
 
                                <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>{profile.fullName}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '500', marginBottom: '32px' }}>
                                    <Mail size={14} /> {profile.email}
                                </div>
 
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { label: 'TOTAL ORDERS', value: userOrders.length, icon: <ShoppingBag size={14} color="#e63946" /> },
                                        { label: 'DELIVERED', value: userOrders.filter(o => o.status === 'completed').length, icon: <CheckCircle2 size={14} color="#e63946" /> },
                                        { label: 'LIFETIME SPENT', value: `₱${userOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString()}`, icon: <TrendingUp size={14} color="#e63946" /> },
                                    ].map((stat, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stat.icon}</div>
                                            <div>
                                                <div style={{ fontSize: '15px', fontWeight: '900' }}>{stat.value}</div>
                                                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', fontWeight: '900', letterSpacing: '0.5px' }}>{stat.label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL: Dynamic Form Area: COMPACT */}
                        <div style={{ padding: '40px', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                <div>
                                    <h1 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Account Identity</h1>
                                    <p style={{ fontSize: '12px', color: '#aaa', fontWeight: '500' }}>{editing ? 'Modify your profile.' : 'View account details.'}</p>
                                </div>
                                {!editing ? (
                                    <button onClick={() => setEditing(true)} style={{ padding: '10px 20px', borderRadius: '10px', background: '#111', color: '#fff', border: 'none', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Edit3 size={14} /> EDIT PROFILE
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => { setEditing(false); setEditForm({ ...profile }) }} style={{ padding: '10px 16px', borderRadius: '10px', background: '#f5f5f5', color: '#666', border: 'none', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>CANCEL</button>
                                        <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: '10px', background: '#e63946', color: '#fff', border: 'none', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>SAVE</button>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>FULL DISPLAY NAME</label>
                                        {editing ? <input value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} style={{ ...inputStyle, padding: '12px 16px', fontSize: '14px' }} placeholder="Your Name" /> : <div style={{ fontSize: '15px', fontWeight: '700', padding: '12px 0', borderBottom: '1.5px solid #f5f5f5' }}>{profile.fullName}</div>}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>CONTACT NUMBER</label>
                                        {editing ? <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={{ ...inputStyle, padding: '12px 16px', fontSize: '14px' }} placeholder="09XXXXXXXXX" /> : <div style={{ fontSize: '15px', fontWeight: '700', padding: '12px 0', borderBottom: '1.5px solid #f5f5f5' }}>{profile.phone || 'Not provided'}</div>}
                                    </div>
                                </div>
 
                                <div>
                                    <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>SHIPPING DESTINATION</label>
                                    {editing ? <textarea value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={{ ...inputStyle, height: '80px', resize: 'none', padding: '12px 16px', fontSize: '14px' }} placeholder="Your complete address..." /> : <div style={{ fontSize: '15px', fontWeight: '700', padding: '12px 0', borderBottom: '1.5px solid #f5f5f5', lineHeight: 1.5 }}>{profile.address || 'No destination set.'}</div>}
                                </div>
 
                                <div>
                                    <label style={{ fontSize: '9px', fontWeight: '900', color: '#bbb', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>LANDMARK</label>
                                    {editing ? <input value={editForm.landmark} onChange={e => setEditForm({ ...editForm, landmark: e.target.value })} style={{ ...inputStyle, padding: '12px 16px', fontSize: '14px' }} placeholder="e.g. Near Market" /> : <div style={{ fontSize: '15px', fontWeight: '700', padding: '12px 0', borderBottom: '1.5px solid #f5f5f5' }}>{profile.landmark || '—'}</div>}
                                </div>
 
                                <div style={{ marginTop: '24px', padding: '24px', background: '#fafafa', borderRadius: '20px', border: '1.2px solid #f0f0f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>Security Settings</h3>
                                            <p style={{ fontSize: '11px', color: '#aaa', fontWeight: '500' }}>Manage access and password.</p>
                                        </div>
                                        {!editingPassword ? (
                                            <button onClick={() => setEditingPassword(true)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #111', background: 'transparent', fontWeight: '900', fontSize: '10px', cursor: 'pointer' }}>CHANGE PASSWORD</button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => setEditingPassword(false)} style={{ fontSize: '10px', fontWeight: '900', color: '#666', background: 'transparent', border: 'none', cursor: 'pointer' }}>CANCEL</button>
                                                <button onClick={handlePasswordSave} style={{ padding: '8px 16px', borderRadius: '10px', background: '#111', color: '#fff', border: 'none', fontWeight: '900', fontSize: '10px', cursor: 'pointer' }}>SAVE</button>
                                            </div>
                                        )}
                                    </div>
                                    {editingPassword && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
                                            <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="New Password" style={{ ...inputStyle, padding: '12px 16px', background: '#fff', fontSize: '14px' }} />
                                            <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Confirm Password" style={{ ...inputStyle, padding: '12px 16px', background: '#fff', fontSize: '14px' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
                body { margin: 0; }
                input:focus, textarea:focus { border-color: #111 !important; box-shadow: 0 10px 20px rgba(0,0,0,0.02); }
                
                /* BOUTIQUE SCROLLBAR */
                div::-webkit-scrollbar { width: 4px; }
                div::-webkit-scrollbar-track { background: transparent; }
                div::-webkit-scrollbar-thumb { background: #eee; borderRadius: 10px; transition: background 0.3s; }
                div::-webkit-scrollbar-thumb:hover { background: #ddd; }
            `}</style>
        </div>
    )
}

export default ProfilePage