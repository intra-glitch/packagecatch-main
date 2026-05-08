import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { adminService } from '../../api/adminService'
import { productService } from '../../api/productService'
import { orderService } from '../../api/orderService'
import AdminReviewsPage from './AdminReviewsPage'
import { 
    LayoutDashboard, Package, FileText, ShoppingCart, Users, Star, 
    LogOut, ExternalLink, Activity, AlertCircle, TrendingUp, 
    ChevronRight, CheckCircle2, Search, ArrowRight, User, Bell
} from 'lucide-react'

// ── Status Dropdown ───────────────────────────────────────────
const statusConfig = {
    pending:          { label: 'Pending',         bg: '#fff8e1', color: '#b8860b', dot: '#ffc107' },
    packed:           { label: 'Packed',           bg: '#e8f4fd', color: '#1565c0', dot: '#2196f3' },
    out_for_delivery: { label: 'Out for Delivery', bg: '#fff0e6', color: '#d35400', dot: '#e67e22' },
    completed:        { label: 'Completed',        bg: '#f0fff8', color: '#1b6b4a', dot: '#2a9d8f' },
    cancelled:        { label: 'Cancelled',        bg: '#fff0f0', color: '#c62828', dot: '#e63946' },
}
const ALL_STATUSES = ['pending', 'packed', 'out_for_delivery', 'completed', 'cancelled']

function StatusDropdown({ orderId, currentStatus, onUpdate }) {
    const [open, setOpen] = useState(false)
    const ref = useRef()
    const current = statusConfig[currentStatus] || statusConfig.pending
    const isCancelled = currentStatus === 'cancelled';

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
            <button 
                onClick={() => !isCancelled && setOpen(o => !o)} 
                disabled={isCancelled}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '20px', fontSize: '11px',
                    fontWeight: '800', cursor: isCancelled ? 'not-allowed' : 'pointer', border: 'none',
                    background: current.bg, color: current.color,
                    letterSpacing: '0.5px', whiteSpace: 'nowrap', opacity: isCancelled ? 0.7 : 1, transition: 'all 0.2s'
                }}
            >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: current.dot }} />
                {current.label.toUpperCase()} 
                {!isCancelled && <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: '4px' }}>▼</span>}
            </button>
            {open && !isCancelled && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                    background: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.15)', zIndex: 200,
                    minWidth: '180px', overflow: 'hidden', padding: '6px'
                }}>
                    {ALL_STATUSES.map(s => {
                        const sc = statusConfig[s]
                        return (
                            <button key={s} onClick={() => { onUpdate(orderId, s); setOpen(false) }} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                width: '100%', padding: '10px 14px',
                                background: s === currentStatus ? sc.bg : 'transparent',
                                border: 'none', borderRadius: '8px',
                                cursor: 'pointer', fontSize: '13px', textAlign: 'left',
                                fontWeight: s === currentStatus ? '800' : '600',
                                color: s === currentStatus ? sc.color : '#555',
                                marginBottom: '2px', transition: 'all 0.2s'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                                {sc.label}
                                {s === currentStatus && <span style={{ marginLeft: 'auto' }}>✓</span>}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── User Detail Modal ──────────────────────────────────────────
const UserDetailModal = ({ user, userOrders, onStatusUpdate, onClose }) => {
    if (!user) return null;
    const stats = [
        { label: 'Total Orders', value: userOrders.length },
        { label: 'Pending', value: userOrders.filter(o => ['pending', 'packed', 'out_for_delivery'].includes(o.status)).length },
        { label: 'Completed', value: userOrders.filter(o => o.status === 'completed').length },
        { label: 'Total Spent', value: `₱${userOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}` },
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '40px', background: '#111', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900' }}>{(user.full_name || user.email).charAt(0).toUpperCase()}</div>
                        <div>
                            <h2 style={{ fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>{user.full_name || 'Anonymous User'}</h2>
                            <p style={{ margin: '4px 0 0', opacity: 0.6, fontSize: '15px' }}>{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontWeight: '800' }}>CLOSE</button>
                </div>
                <div style={{ padding: '40px', overflowY: 'auto', background: '#fcfcfc', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                        {stats.map(s => (
                            <div key={s.label} style={{ background: '#fff', border: '1px solid #f0f0f0', padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '22px', fontWeight: '900', color: '#111' }}>{s.value}</div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#aaa', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '1px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#111', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '24px' }}>Order History</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {userOrders.map(order => (
                                <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: '#fff', borderRadius: '20px', border: '1px solid #f0f0f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>📦 <div><div style={{ fontWeight: '900' }}>#{String(order.id).substring(0,8)}</div><div style={{ fontSize: '12px', color: '#999' }}>{order.date}</div></div></div>
                                    <div style={{ textAlign: 'right' }}><div style={{ fontWeight: '900' }}>₱{order.total?.toLocaleString()}</div><div style={{ fontSize: '11px', fontWeight: '900', color: statusConfig[order.status]?.color }}>{order.status?.toUpperCase()}</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Product Detail Modal ──────────────────────────────────────
const ProductDetailModal = ({ product, onClose }) => {
    if (!product) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '540px', maxHeight: '85vh', borderRadius: '32px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }} onClick={e => e.stopPropagation()}>
                
                {/* Close Icon */}
                <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', width: '32px', height: '32px', borderRadius: '50%', background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#eee'}>
                    <span style={{ fontSize: '18px', fontWeight: '400', color: '#111' }}>×</span>
                </button>

                <div style={{ padding: '32px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                        <div style={{ width: '180px', height: '220px', borderRadius: '20px', overflow: 'hidden', background: '#f9f9f9', flexShrink: 0, border: '1px solid #f0f0f0' }}>
                            {product.images?.[0] ? <img src={product.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>👗</div>}
                        </div>
                        <div style={{ flex: 1, paddingTop: '8px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#e63946', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{product.category}</div>
                            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#111', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{product.name}</h3>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#e63946', marginBottom: '20px' }}>₱{product.price.toLocaleString()}</div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ background: '#fcfcfc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#aaa', textTransform: 'uppercase' }}>Stocks</span>
                                    <span style={{ fontSize: '12px', fontWeight: '900', color: product.stockQuantity > 0 ? '#2a9d8f' : '#e63946' }}>{product.stockQuantity > 0 ? `${product.stockQuantity} Left` : 'Sold Out'}</span>
                                </div>
                                <div style={{ background: '#fcfcfc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#aaa', textTransform: 'uppercase' }}>Condition</span>
                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#111' }}>{product.condition || 'New'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ background: '#fafafa', padding: '20px', borderRadius: '20px', border: '1px solid #f0f0f0' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#111', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>About this product</h4>
                        <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5, margin: 0 }}>{product.description || 'No description provided.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main Dashboard ────────────────────────────────────────────
const AdminDashboard = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')
    const [notification, setNotification] = useState('')
    const [dashboardStats, setDashboardStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    const showNotif = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 2500) }

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const stats = await adminService.getStats();
                setDashboardStats(stats);
                const acts = await adminService.getActivity();
                setActivities(acts);
            } else if (activeTab === 'products' || activeTab === 'drafts') {
                const prods = await productService.getAll(activeTab === 'drafts' ? 'draft' : 'active');
                setProducts(prods);
            } else if (activeTab === 'orders') {
                const ords = await orderService.getAllOrders();
                setOrders(ords);
            } else if (activeTab === 'users') {
                const usrs = await adminService.getUsers();
                setUsers(usrs);
                const ords = await orderService.getAllOrders();
                setOrders(ords);
            }
        } catch (error) {
            showNotif('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [activeTab]);

    const updateOrderStatus = async (id, status) => {
        try {
            await orderService.updateOrderStatus(id, status);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
            showNotif(`Order updated`);
        } catch (e) { showNotif('Failed to update'); }
    }

    const updateUserStatus = async (id, status) => {
        try {
            await adminService.updateUserStatus(id, status);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
            if (selectedUser && selectedUser.id === id) setSelectedUser(prev => ({ ...prev, status }));
            showNotif(`User updated`);
        } catch (e) { showNotif('Failed to update'); }
    }

    const openUserModal = (userEmail) => {
        const foundUser = users.find(u => u.email === userEmail);
        if (foundUser) { setSelectedUser(foundUser); setIsUserModalOpen(true); }
    }

    const handleDeleteProduct = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await productService.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            showNotif('Product deleted successfully');
        } catch (e) {
            showNotif('Failed to delete product');
        }
    }

    const openProductModal = (product) => {
        setSelectedProduct(product);
        setIsProductModalOpen(true);
    }

    const navItems = [
        { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> }, 
        { key: 'products', label: 'Inventory', icon: <Package size={20} /> }, 
        { key: 'drafts', label: 'Drafts', icon: <FileText size={20} /> },
        { key: 'orders', label: 'Orders', icon: <ShoppingCart size={20} /> }, 
        { key: 'users', label: 'Users', icon: <Users size={20} /> },
        { key: 'reviews', label: 'Reviews', icon: <Star size={20} /> },
    ]

    const handleLogout = () => {
        setLoggingOut(true);
        setTimeout(async () => { await logout(); navigate('/'); }, 1200);
    }

    const stats = dashboardStats ? [
        { label: 'Revenue',  value: `₱${dashboardStats.revenue.toLocaleString()}`, icon: <TrendingUp size={24} />, color: '#e63946' },
        { label: 'Orders',   value: dashboardStats.pendingOrders.toString(),        icon: <ShoppingCart size={24} />, color: '#3b82f6' },
        { label: 'Low Stock',value: dashboardStats.lowStockItems.toString(),        icon: <AlertCircle size={24} />, color: '#ff9f1c' },
        { label: 'Users',    value: dashboardStats.activeUsers.toString(),      icon: <Users size={24} />, color: '#2a9d8f' },
    ] : [];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#fcfcfc', fontFamily: "'Inter', sans-serif" }}>
            
            {/* LOGGING OUT TRANSITION */}
            {loggingOut && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                    <div style={{ width: '50px', height: '50px', border: '4px solid #f0f0f0', borderTop: '4px solid #e63946', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontWeight: '900', letterSpacing: '2px', fontSize: '13px', color: '#111' }}>EXITING COMMAND CENTER...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {isUserModalOpen && (
                <UserDetailModal user={selectedUser} userOrders={orders.filter(o => o.email === selectedUser?.email)} onStatusUpdate={updateUserStatus} onClose={() => setIsUserModalOpen(false)} />
            )}

            {isProductModalOpen && (
                <ProductDetailModal product={selectedProduct} onClose={() => setIsProductModalOpen(false)} />
            )}

            {notification && (
                <div style={{ position: 'fixed', top: '40px', right: '40px', zIndex: 2000, background: '#111', color: '#fff', padding: '16px 32px', borderRadius: '20px', fontSize: '13px', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideRight 0.4s ease' }}>✓ {notification.toUpperCase()}</div>
            )}

            {/* SIDEBAR: COMMAND PORTAL */}
            <aside style={{ width: '240px', background: '#111', color: '#fff', display: 'flex', flexDirection: 'column', padding: '24px', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
                <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                    <span style={{ fontSize: '8px', fontWeight: '900', padding: '3px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', letterSpacing: '0.5px' }}>ADMIN</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    {navItems.map(item => (
                        <button key={item.key} onClick={() => setActiveTab(item.key)} style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                            background: activeTab === item.key ? 'rgba(230, 57, 70, 0.15)' : 'transparent',
                            color: activeTab === item.key ? '#e63946' : 'rgba(255,255,255,0.5)',
                            fontSize: '13px', fontWeight: '900', transition: 'all 0.3s', textAlign: 'left'
                        }}>
                            {item.icon && <span style={{ transform: 'scale(0.8)' }}>{item.icon}</span>} {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}>
                        <ExternalLink size={14} /> STOREFRONT
                    </button>
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '12px', border: 'none', background: '#e63946', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '900' }}>
                        <LogOut size={16} /> SIGN OUT
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>System Control</h1>
                        <p style={{ fontSize: '12px', color: '#888', fontWeight: '500', marginTop: '4px' }}>Administrator, Platform pulse is stable.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '12px', fontWeight: '900' }}>Admin Portal</div>
                            <div style={{ fontSize: '10px', color: '#2a9d8f', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2a9d8f', animation: 'pulse 2s infinite' }} /> LIVE
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '120px 0' }}>
                        <div style={{ width: '50px', height: '50px', border: '4px solid #f0f0f0', borderTop: '4px solid #111', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                    {stats.map(s => (
                                        <div key={s.label} style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #f0f0f0', boxShadow: '0 10px 20px rgba(0,0,0,0.01)' }}>
                                            <div style={{ color: s.color, marginBottom: '12px', transform: 'scale(0.8)', transformOrigin: 'left' }}>{s.icon}</div>
                                            <div style={{ fontSize: '22px', fontWeight: '900', color: '#111', letterSpacing: '-0.5px' }}>{s.value}</div>
                                            <div style={{ fontSize: '9px', fontWeight: '900', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
                                    {/* LIVE ACTIVITY: NOW SCROLLABLE */}
                                    <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h3 style={{ fontSize: '15px', fontWeight: '900' }}>Live Performance Feed</h3>
                                            <Activity size={16} color="#e63946" />
                                        </div>
                                        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="custom-scroll">
                                            {activities.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', fontSize: '12px', color: '#999' }}>No pulse detected.</div> : activities.map((item, i) => (
                                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', borderRadius: '12px', background: '#fcfcfc', border: '1px solid #f5f5f5' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: item.color || '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{item.icon || '📌'}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '12px', fontWeight: '800' }}>{item.msg}</div>
                                                        <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{new Date(item.time).toLocaleTimeString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ALERTS SECTION */}
                                    <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '900', marginBottom: '20px' }}>Inventory Health</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {dashboardStats?.lowStockItems > 0 ? (
                                                <div style={{ background: '#fff0f0', padding: '20px', borderRadius: '16px', border: '1.2px solid #ffebeb' }}>
                                                    <AlertCircle color="#e63946" size={24} style={{ marginBottom: '12px' }} />
                                                    <div style={{ fontWeight: '900', fontSize: '14px', color: '#e63946' }}>{dashboardStats.lowStockItems} Items Low</div>
                                                    <p style={{ fontSize: '11px', color: '#c62828', opacity: 0.8, margin: '4px 0 16px' }}>Refill required to maintain availability.</p>
                                                    <button onClick={() => setActiveTab('products')} style={{ padding: '10px 16px', borderRadius: '10px', background: '#e63946', color: '#fff', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '11px' }}>REFRESH</button>
                                                </div>
                                            ) : (
                                                <div style={{ background: '#f0fff8', padding: '20px', borderRadius: '16px', border: '1.2px solid #e6ffef', textAlign: 'center' }}>
                                                    <CheckCircle2 color="#2a9d8f" size={24} style={{ margin: '0 auto 12px' }} />
                                                    <div style={{ fontWeight: '900', color: '#1b6b4a', fontSize: '13px' }}>Stocks are Optimal</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'products' || activeTab === 'drafts') && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                    <h2 style={{ fontSize: '28px', fontWeight: '900' }}>{activeTab === 'products' ? 'Inventory' : 'Drafts'}</h2>
                                    <button onClick={() => navigate('/admin/products/new')} style={{ padding: '18px 32px', borderRadius: '18px', background: '#111', color: '#fff', border: 'none', fontWeight: '900', cursor: 'pointer' }}>+ ADD PRODUCT</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                                    {products.map(p => (
                                        <div key={p.id} onClick={() => openProductModal(p)} style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#111'} onMouseLeave={e => e.currentTarget.style.borderColor = '#f0f0f0'}>
                                            <div style={{ width: '60px', height: '70px', borderRadius: '12px', overflow: 'hidden', background: '#f5f5f5' }}>
                                                {p.images?.[0] ? <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👗</div>}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '900', fontSize: '13px' }}>{p.name}</div>
                                                <div style={{ fontSize: '15px', fontWeight: '900', color: '#e63946', margin: '2px 0 8px' }}>₱{p.price.toLocaleString()}</div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/products/edit/${p.id}`) }} style={{ padding: '6px 12px', borderRadius: '6px', background: '#f5f5f5', border: 'none', fontWeight: '800', fontSize: '10px', cursor: 'pointer' }}>EDIT</button>
                                                    {activeTab === 'drafts' && <button onClick={(e) => { e.stopPropagation(); productService.update(p.id, { ...p, status: 'active' }).then(() => loadData()) }} style={{ padding: '6px 12px', borderRadius: '6px', background: '#2a9d8f', color: '#fff', border: 'none', fontWeight: '800', fontSize: '10px', cursor: 'pointer' }}>PUBLISH</button>}
                                                    <button onClick={(e) => handleDeleteProduct(p.id, e)} style={{ padding: '6px 12px', borderRadius: '6px', background: '#fff0f0', color: '#e63946', border: 'none', fontWeight: '800', fontSize: '10px', cursor: 'pointer' }}>DELETE</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                        {['Order','Customer','Items','Status','Total','Date'].map(h => <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: '#aaa', letterSpacing: '1px' }}>{h.toUpperCase()}</th>)}
                                    </tr></thead>
                                    <tbody>{orders.map(order => (
                                        <tr key={order.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                            <td style={{ padding: '16px 20px', fontWeight: '900', fontSize: '13px' }}>#{String(order.id).substring(0,8).toUpperCase()}</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div onClick={() => openUserModal(order.email)} style={{ fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>{order.customer}</div>
                                                <div style={{ fontSize: '11px', color: '#999' }}>{order.email}</div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '200px' }}>
                                                    {(order.rawItems || []).map((item, idx) => (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fcfcfc', padding: '4px 8px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                                            <div style={{ width: '24px', height: '30px', borderRadius: '4px', overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
                                                                {item.products?.image_url ? <img src={item.products.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>👗</div>}
                                                            </div>
                                                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                                                                {item.products?.name} <span style={{ color: '#e63946' }}>x{item.quantity}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}><StatusDropdown orderId={order.id} currentStatus={order.status} onUpdate={updateOrderStatus} /></td>
                                            <td style={{ padding: '16px 20px', fontWeight: '900', color: '#e63946', fontSize: '13px' }}>₱{order.total?.toLocaleString()}</td>
                                            <td style={{ padding: '16px 20px', fontSize: '11px', color: '#888', fontWeight: '700' }}>{order.date}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'reviews' && <AdminReviewsPage />}

                        {activeTab === 'users' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                                {users.map(u => (
                                    <div key={u.id} onClick={() => openUserModal(u.email)} style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: u.role === 'ADMIN' ? '#e63946' : '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px' }}>{(u.full_name || u.email).charAt(0).toUpperCase()}</div>
                                        <div><div style={{ fontWeight: '900', fontSize: '13px' }}>{u.full_name || 'Buyer'}</div><div style={{ fontSize: '11px', color: '#999' }}>{u.email}</div></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.5; } }
                @keyframes slideRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #eee; borderRadius: 10px; }
            `}</style>
        </div>
    )
}

export default AdminDashboard