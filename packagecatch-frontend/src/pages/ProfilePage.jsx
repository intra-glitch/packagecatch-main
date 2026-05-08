import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../api/supabaseClient'
import AvatarEditor from 'react-avatar-editor'

const ProfilePage = () => {
    const navigate = useNavigate()
    const { user, logout, updateProfile, updatePassword } = useAuth()
    
    // Default safe fallback if user is null or missing metadata
    const meta = user?.user_metadata || {}

    const [activeTab, setActiveTab] = useState('orders')
    const [editing, setEditing] = useState(false)
    const [editingPassword, setEditingPassword] = useState(false)
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
    const [notification, setNotification] = useState('')
    
    // Avatar Editor State
    const [imageFile, setImageFile] = useState(null)
    const [editorOpen, setEditorOpen] = useState(false)
    const [zoom, setZoom] = useState(1.2)
    const [rotate, setRotate] = useState(0)
    const editorRef = useRef(null)
    
    const [profile, setProfile] = useState({
        fullName: meta.fullName || meta.firstName + ' ' + meta.lastName || 'User',
        email: user?.email || '',
        phone: meta.phone || '',
        address: meta.address || '',
        landmark: meta.landmark || '',
        avatar: meta.avatar || '',
    })

    const [editForm, setEditForm] = useState({ ...profile })

    // If context user changes (e.g. after refresh), update local state
    useEffect(() => {
        if (user) {
            const m = user.user_metadata || {}
            const data = {
                fullName: m.fullName || m.firstName + ' ' + m.lastName || 'User',
                email: user.email || '',
                phone: m.phone || '',
                address: m.address || '',
                landmark: m.landmark || '',
                avatar: m.avatar || '',
            }
            setProfile(data)
            setEditForm(data)
        }
    }, [user])

    const orders = [
        { id: 'PC-A1B2C3', date: 'Mar 10, 2025', items: 'Oversized Hoodie, Floral Midi Dress', total: 758, status: 'completed' },
        { id: 'PC-D4E5F6', date: 'Mar 12, 2025', items: 'Cargo Pants', total: 459, status: 'out_for_delivery' },
        { id: 'PC-G7H8I9', date: 'Mar 13, 2025', items: 'Crop Tank Top × 2, Bucket Hat', total: 547, status: 'packed' },
        { id: 'PC-J1K2L3', date: 'Mar 14, 2025', items: 'Wrap Dress', total: 499, status: 'pending' },
    ]

    const statusConfig = {
        pending:          { label: 'Pending',           bg: '#fff8e1', color: '#b8860b', dot: '#f4a261' },
        packed:           { label: 'Packed',             bg: '#e8f4fd', color: '#1565c0', dot: '#378add' },
        out_for_delivery: { label: 'Out for Delivery',   bg: '#f0fff8', color: '#1b6b4a', dot: '#2a9d8f' },
        completed:        { label: 'Completed',          bg: '#f0fff8', color: '#1b6b4a', dot: '#2a9d8f' },
        cancelled:        { label: 'Cancelled',          bg: '#fff0f0', color: '#c62828', dot: '#e63946' },
    }

    const showNotif = (msg) => {
        setNotification(msg)
        setTimeout(() => setNotification(''), 2500)
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
        if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
            alert('Password must be at least 8 characters')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('Passwords do not match')
            return
        }

        try {
            await updatePassword(passwordForm.newPassword)
            setEditingPassword(false)
            setPasswordForm({ newPassword: '', confirmPassword: '' })
            showNotif('Password updated successfully!')
            setTimeout(() => {
                alert('Your password has been changed successfully!')
            }, 500)
        } catch (err) {
            alert('Failed to update password: ' + err.message)
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const handleSaveAvatar = async () => {
        if (editorRef.current) {
            showNotif('Saving optimized avatar...')
            const canvas = editorRef.current.getImageScaledToCanvas()
            canvas.toBlob(async (blob) => {
                try {
                    let fileExt = 'png'
                    if (imageFile && imageFile.name) {
                        fileExt = imageFile.name.split('.').pop()
                    }
                    const fileName = `${user.id}-${Math.random()}.${fileExt}`
                    const filePath = `public/${fileName}`
                    
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, blob, { contentType: `image/${fileExt}` })
                        
                    if (uploadError) throw uploadError
                    
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath)
                        
                    setEditForm({ ...editForm, avatar: publicUrl })
                    setProfile({ ...profile, avatar: publicUrl })
                    
                    await updateProfile({ ...editForm, avatar: publicUrl })
                    
                    setEditorOpen(false)
                    setImageFile(null)
                    showNotif('Avatar saved successfully!')
                } catch (err) {
                    alert('Error saving avatar: ' + err.message)
                }
            }, "image/png")
        }
    }

    const inputStyle = {
        width: '100%', padding: '12px 14px',
        borderRadius: '8px', fontSize: '14px',
        border: '1.5px solid #e0e0e0', background: '#fafafa',
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>

            {editorOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        background: '#fff', padding: '40px', borderRadius: '24px',
                        display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)', maxWidth: '400px', width: '90%'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Edit Image Preview</h3>
                        
                        <div style={{ borderRadius: '50%', overflow: 'hidden', border: '4px solid #111' }}>
                            <AvatarEditor
                                ref={editorRef}
                                image={imageFile}
                                width={200}
                                height={200}
                                border={0}
                                borderRadius={100}
                                color={[255, 255, 255, 0.8]} 
                                scale={zoom}
                                rotate={rotate}
                                crossOrigin="anonymous"
                            />
                        </div>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600' }}>
                                    <span>Zoom / Resize</span>
                                    <span>{Math.round(zoom * 100)}%</span>
                                </div>
                                <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ width: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600' }}>
                                    <span>Rotation</span>
                                    <span>{rotate}°</span>
                                </div>
                                <input type="range" min="0" max="360" step="90" value={rotate} onChange={e => setRotate(parseFloat(e.target.value))} style={{ width: '100%' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                            <button onClick={() => setEditorOpen(false)} style={{
                                flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px',
                                fontWeight: '700', background: 'transparent', color: '#555',
                                border: '1.5px solid #e0e0e0', cursor: 'pointer'
                            }}>Cancel</button>
                            <button onClick={handleSaveAvatar} style={{
                                flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px',
                                fontWeight: '700', background: '#111', color: '#fff',
                                border: 'none', cursor: 'pointer'
                            }}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '32px', left: '50%',
                    transform: 'translateX(-50%)', zIndex: 999,
                    background: '#111', color: '#fff', padding: '14px 28px',
                    borderRadius: '40px', fontSize: '14px', fontWeight: '600',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
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
            }}>
                <div onClick={() => navigate('/')} style={{ fontSize: '20px', fontWeight: '900', cursor: 'pointer' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span onClick={() => navigate('/home')} style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#555' }}>
            ← Back to Shop
          </span>
                    <button onClick={handleLogout} style={{
                        padding: '8px 20px', borderRadius: '6px', fontSize: '14px',
                        fontWeight: '600', background: '#111', color: '#fff', cursor: 'pointer',
                        border: 'none',
                    }}>Log out</button>
                </div>
            </nav>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 48px' }}>

                {/* PROFILE HEADER */}
                <div style={{
                    background: '#111', borderRadius: '20px',
                    padding: '40px 48px', marginBottom: '32px',
                    display: 'flex', alignItems: 'center', gap: '32px',
                    color: '#fff',
                }}>
                    {/* Avatar */}
                    {/* Avatar */}
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: profile.avatar ? `url(${profile.avatar}) center/cover` : '#e63946',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '32px', fontWeight: '900', flexShrink: 0,
                            border: '3px solid #111', overflow: 'hidden'
                        }}>
                            {!profile.avatar && profile.fullName.charAt(0)}
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '900' }}>{profile.fullName}</h1>
                            <span style={{
                                background: '#2a9d8f', color: '#fff',
                                fontSize: '11px', fontWeight: '700', letterSpacing: '1px',
                                padding: '3px 10px', borderRadius: '20px',
                            }}>✓ VERIFIED</span>
                        </div>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>{profile.email}</p>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Member since March 2025</p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '32px' }}>
                        {[
                            { label: 'Orders', value: orders.length },
                            { label: 'Completed', value: orders.filter(o => o.status === 'completed').length },
                            { label: 'Wishlist', value: 3 },
                        ].map(stat => (
                            <div key={stat.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: '900' }}>{stat.value}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TABS */}
                <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #f0f0f0', marginBottom: '32px' }}>
                    {[
                        { key: 'orders', label: '📦 My Orders' },
                        { key: 'account', label: '👤 Account Info' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                            padding: '14px 28px', fontSize: '14px', fontWeight: '700',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: activeTab === tab.key ? '#111' : '#999',
                            borderBottom: activeTab === tab.key ? '2px solid #111' : '2px solid transparent',
                            marginBottom: '-2px', transition: 'all 0.2s',
                        }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.map(order => {
                            const status = statusConfig[order.status]
                            return (
                                <div key={order.id} style={{
                                    background: '#fff', borderRadius: '14px',
                                    border: '1px solid #f0f0f0', padding: '24px 28px',
                                    display: 'flex', alignItems: 'center', gap: '24px',
                                }}>
                                    {/* Order icon */}
                                    <div style={{
                                        width: '52px', height: '52px', borderRadius: '12px',
                                        background: '#f5f5f5', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '24px', flexShrink: 0,
                                    }}>📦</div>

                                    {/* Order info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: '800' }}>{order.id}</span>
                                            <span style={{
                                                fontSize: '11px', fontWeight: '700', letterSpacing: '1px',
                                                padding: '3px 10px', borderRadius: '20px',
                                                background: status.bg, color: status.color,
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                            }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.dot, display: 'inline-block' }} />
                                                {status.label}
                      </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>{order.date}</div>
                                        <div style={{ fontSize: '14px', color: '#555' }}>{order.items}</div>
                                    </div>

                                    {/* Total + button */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#e63946' }}>₱{order.total}</div>
                                        <button onClick={() => navigate(`/product/1`)} style={{
                                            padding: '8px 20px', borderRadius: '6px', fontSize: '13px',
                                            fontWeight: '600', background: 'transparent', cursor: 'pointer',
                                            border: '1.5px solid #e0e0e0', color: '#555',
                                        }}>View Details</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ACCOUNT TAB */}
                {activeTab === 'account' && (
                    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '32px' }}>
                        {/* Avatar upload section */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', gap: '24px' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: editForm.avatar ? `url(${editForm.avatar}) center/cover` : '#e63946',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '32px', fontWeight: '900', flexShrink: 0,
                                border: '3px solid #111', overflow: 'hidden'
                            }}>
                                {!editForm.avatar && editForm.fullName.charAt(0)}
                            </div>
                            
                            {editing ? (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#f5f5f5', border: '1.5px solid #e0e0e0', color: '#111', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}>
                                        Upload Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files[0]
                                                if (file) {
                                                    setImageFile(file)
                                                    setZoom(1.2)
                                                    setRotate(0)
                                                    setEditorOpen(true)
                                                }
                                            }}
                                        />
                                    </label>
                                    {editForm.avatar && (
                                        <button onClick={() => {
                                            setImageFile(editForm.avatar)
                                            setZoom(1.2)
                                            setRotate(0)
                                            setEditorOpen(true)
                                        }} style={{
                                            cursor: 'pointer', padding: '8px 16px', background: '#111', color: '#fff', 
                                            border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px'
                                        }}>
                                            Edit Image
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Profile Picture</div>
                                    <div style={{ fontSize: '13px', color: '#888' }}>Click Edit Profile to change your avatar.</div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Account Information</h2>
                            {!editing ? (
                                <button onClick={() => setEditing(true)} style={{
                                    padding: '10px 24px', borderRadius: '8px', fontSize: '14px',
                                    fontWeight: '700', background: '#111', color: '#fff',
                                    border: 'none', cursor: 'pointer',
                                }}>Edit Profile</button>
                            ) : (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => { setEditing(false); setEditForm({ ...profile }) }} style={{
                                        padding: '10px 20px', borderRadius: '8px', fontSize: '14px',
                                        fontWeight: '600', background: 'transparent', color: '#555',
                                        border: '1.5px solid #e0e0e0', cursor: 'pointer',
                                    }}>Cancel</button>
                                    <button onClick={handleSave} style={{
                                        padding: '10px 24px', borderRadius: '8px', fontSize: '14px',
                                        fontWeight: '700', background: '#2a9d8f', color: '#fff',
                                        border: 'none', cursor: 'pointer',
                                    }}>Save Changes</button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {[
                                { label: 'Full Name', key: 'fullName', placeholder: 'Your full name' },
                                { label: 'Email Address', key: 'email', placeholder: 'email@example.com' },
                                { label: 'Mobile Number', key: 'phone', placeholder: '09XXXXXXXXX' },
                                { label: 'Delivery Address', key: 'address', placeholder: 'House No., Street, City' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
                                        {field.label}
                                    </label>
                                    {editing ? (
                                        <input
                                            value={editForm[field.key]}
                                            onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                                            placeholder={field.placeholder}
                                            style={inputStyle}
                                            onFocus={e => e.target.style.border = '1.5px solid #111'}
                                            onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
                                        />
                                    ) : (
                                        <div style={{
                                            padding: '12px 14px', borderRadius: '8px',
                                            background: '#fafafa', border: '1.5px solid #f0f0f0',
                                            fontSize: '14px', color: '#333',
                                        }}>{profile[field.key]}</div>
                                    )}
                                </div>
                            ))}

                            {/* Landmark full width */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
                                    Landmark / Directions
                                </label>
                                {editing ? (
                                    <input
                                        value={editForm.landmark}
                                        onChange={e => setEditForm({ ...editForm, landmark: e.target.value })}
                                        placeholder="e.g. Near 7-Eleven"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.border = '1.5px solid #111'}
                                        onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
                                    />
                                ) : (
                                    <div style={{
                                        padding: '12px 14px', borderRadius: '8px',
                                        background: '#fafafa', border: '1.5px solid #f0f0f0',
                                        fontSize: '14px', color: '#333',
                                    }}>{profile.landmark}</div>
                                )}
                            </div>
                        </div>

                        {/* Password Section */}
                        <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Change Password</h3>
                                {!editingPassword ? (
                                    <button onClick={() => setEditingPassword(true)} style={{
                                        padding: '8px 20px', borderRadius: '8px', fontSize: '13px',
                                        fontWeight: '700', background: 'transparent', color: '#111',
                                        border: '1.5px solid #111', cursor: 'pointer',
                                    }}>Update Password</button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => setEditingPassword(false)} style={{
                                            padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                                            fontWeight: '600', background: 'transparent', color: '#555',
                                            border: '1.5px solid #e0e0e0', cursor: 'pointer',
                                        }}>Cancel</button>
                                        <button onClick={handlePasswordSave} style={{
                                            padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                                            fontWeight: '700', background: '#111', color: '#fff',
                                            border: 'none', cursor: 'pointer',
                                        }}>Save Password</button>
                                    </div>
                                )}
                            </div>

                            {editingPassword && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            placeholder="Min 8 chars"
                                            style={inputStyle}
                                            onFocus={e => e.target.style.border = '1.5px solid #111'}
                                            onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' }}>
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            placeholder="Retype password"
                                            style={inputStyle}
                                            onFocus={e => e.target.style.border = '1.5px solid #111'}
                                            onBlur={e => e.target.style.border = '1.5px solid #e0e0e0'}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProfilePage