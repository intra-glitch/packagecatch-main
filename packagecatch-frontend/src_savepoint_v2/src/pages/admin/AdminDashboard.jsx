import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { adminService } from '../../api/adminService'
import { productService } from '../../api/productService'
import { orderService } from '../../api/orderService'

// ── Status Dropdown ───────────────────────────────────────────
const statusConfig = {
    pending:          { label: 'Pending',         bg: '#fff8e1', color: '#b8860b' },
    packed:           { label: 'Packed',           bg: '#e8f4fd', color: '#1565c0' },
    out_for_delivery: { label: 'Out for Delivery', bg: '#f0fff8', color: '#1b6b4a' },
    completed:        { label: 'Completed',        bg: '#f0fff8', color: '#1b6b4a' },
    cancelled:        { label: 'Cancelled',        bg: '#fff0f0', color: '#c62828' },
}
const ALL_STATUSES = ['pending', 'packed', 'out_for_delivery', 'completed', 'cancelled']

function StatusDropdown({ orderId, currentStatus, onUpdate }) {
    const [open, setOpen] = useState(false)
    const ref = useRef()
    const current = statusConfig[currentStatus] || statusConfig.pending

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
            <button onClick={() => setOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '20px', fontSize: '11px',
                fontWeight: '700', cursor: 'pointer', border: 'none',
                background: current.bg, color: current.color,
                letterSpacing: '0.5px', whiteSpace: 'nowrap',
            }}>
                {current.label} <span style={{ fontSize: '9px', opacity: 0.7 }}>▼</span>
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                    background: '#fff', border: '1px solid #f0f0f0', borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200,
                    minWidth: '160px', overflow: 'hidden',
                }}>
                    {ALL_STATUSES.map(s => {
                        const sc = statusConfig[s]
                        return (
                            <button key={s} onClick={() => { onUpdate(orderId, s); setOpen(false) }} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                width: '100%', padding: '10px 14px',
                                background: s === currentStatus ? sc.bg : '#fff',
                                border: 'none', borderBottom: '1px solid #f5f5f5',
                                cursor: 'pointer', fontSize: '13px', textAlign: 'left',
                                fontWeight: s === currentStatus ? '700' : '500',
                                color: s === currentStatus ? sc.color : '#444',
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
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

// ── Main Dashboard ────────────────────────────────────────────
const AdminDashboard = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')
    const [notification, setNotification] = useState('')
    
    // Data State
    const [dashboardStats, setDashboardStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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
            }
        } catch (error) {
            showNotif('Error loading data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const stats = dashboardStats ? [
        { label: 'Total Revenue',  value: `₱${dashboardStats.revenue.toLocaleString()}`, icon: '💰', change: 'Total collected' },
        { label: 'Pending Orders', value: dashboardStats.pendingOrders.toString(),        icon: '📦', change: 'Needs attention' },
        { label: 'Low Stock Items',value: dashboardStats.lowStockItems.toString(),        icon: '⚠️', change: 'Check inventory' },
        { label: 'Active Users',   value: dashboardStats.activeUsers.toString(),      icon: '👥', change: 'Registered users' },
    ] : [];

    const updateOrderStatus = async (id, status) => {
        try {
            await orderService.updateOrderStatus(id, status);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
            showNotif(`Order ${id.substring(0,8)} updated to ${statusConfig[status].label}`);
        } catch (e) {
            showNotif('Failed to update status');
        }
    }

    const deleteProduct = async (id, name) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await productService.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            showNotif(`${name} deleted`);
        } catch (e) {
            showNotif('Failed to delete product');
        }
    }

    const tabs = [
        { key: 'overview', label: '📊 Overview' }, 
        { key: 'products', label: '👗 Your Listings' }, 
        { key: 'drafts', label: '📝 Drafts' },
        { key: 'orders', label: '📦 Orders' }, 
        { key: 'users', label: '👥 Users' }
    ]

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>
            {notification && (
                <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: '#111', color: '#fff', padding: '14px 28px', borderRadius: '40px', fontSize: '14px', fontWeight: '600', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>✓ {notification}</div>
            )}

            <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: '64px', background: '#111', color: '#fff' }}>
                <div style={{ fontSize: '20px', fontWeight: '900' }}>
                    PACKAGE<span style={{ color: '#e63946' }}>CATCH</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginLeft: '10px', letterSpacing: '2px' }}>ADMIN</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span onClick={() => navigate('/home')} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600 }}>Back to Store</span>
                    <button onClick={() => { logout(); navigate('/') }} style={{ padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', background: '#e63946', color: '#fff', border: 'none', cursor: 'pointer' }}>Log out</button>
                </div>
            </nav>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 48px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '900' }}>Admin Dashboard</h1>
                    <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>Manage your store from one place</p>
                </div>

                <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e0e0e0', marginBottom: '36px' }}>
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                            padding: '14px 24px', fontSize: '14px', fontWeight: '700', background: 'transparent', border: 'none', cursor: 'pointer',
                            color: activeTab === tab.key ? '#1877F2' : '#65676B',
                            borderBottom: activeTab === tab.key ? '3px solid #1877F2' : '3px solid transparent',
                            marginBottom: '-3px', transition: 'all 0.2s',
                        }}>{tab.label}</button>
                    ))}
                </div>

                {loading ? <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div> : (
                    <>
                        {/* OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                                    {stats.map(stat => (
                                        <div key={stat.label} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f0f0f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{stat.icon}</div>
                                            <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '4px', color: '#1c1e21' }}>{stat.value}</div>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#65676b', marginBottom: '4px' }}>{stat.label}</div>
                                            <div style={{ fontSize: '12px', color: '#8a8d91' }}>{stat.change}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Live Activity Feed</h2>
                                    {activities.length === 0 ? <p style={{color: '#888'}}>No recent activity.</p> : activities.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: i < activities.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{item.icon}</div>
                                            <div style={{ flex: 1, fontSize: '14px', color: '#1c1e21', fontWeight: 500 }}>{item.msg}</div>
                                            <div style={{ fontSize: '12px', color: '#8a8d91', flexShrink: 0 }}>{new Date(item.time).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* PRODUCTS & DRAFTS (FB Marketplace Style) */}
                        {(activeTab === 'products' || activeTab === 'drafts') && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{activeTab === 'products' ? 'Your Listings' : 'Your Drafts'}</h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <input type="text" placeholder="Search your listings" style={{ padding: '10px 16px', paddingLeft: '40px', borderRadius: '20px', border: 'none', background: '#F0F2F5', fontSize: '15px', outline: 'none', width: '280px' }} />
                                                <span style={{ position: 'absolute', left: '14px', top: '10px', color: '#65676B' }}>🔍</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/admin/products/new')} style={{ padding: '10px 24px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', background: '#1877F2', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>+</span> Create New Listing
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {products.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#65676B', background: '#fff', borderRadius: '8px', border: '1px solid #ced0d4' }}>No listings found.</div> : products.map(p => (
                                        <div key={p.id} style={{ display: 'flex', background: '#fff', borderRadius: '8px', border: '1px solid #ced0d4', padding: '16px', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {p.images && p.images[0] ? (
                                                    <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '32px', color: '#bcc0c4' }}>📷</span>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#050505', margin: '0 0 4px 0', cursor: 'pointer' }} onClick={() => navigate(`/product/${p.id}`)}>{p.name} - {p.condition}</h3>
                                                <div style={{ fontSize: '15px', color: '#050505', fontWeight: '600', marginBottom: '8px' }}>₱{p.price.toLocaleString()}</div>
                                                <div style={{ fontSize: '13px', color: '#65676B' }}>
                                                    {p.status === 'active' ? 'Active' : p.status === 'draft' ? 'Draft' : 'Sold'} · Listed on {new Date().toLocaleDateString()}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#65676B', marginTop: '4px' }}>
                                                    Stock: {p.stockQuantity} • Category: {p.category}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                                                {p.status !== 'sold' && (
                                                    <button style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', background: '#E4E6EB', color: '#050505', border: 'none', cursor: 'pointer' }}>
                                                        ✓ Mark as sold
                                                    </button>
                                                )}
                                                <button onClick={() => navigate(`/admin/products/edit/${p.id}`)} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', background: '#E4E6EB', color: '#050505', border: 'none', cursor: 'pointer' }}>
                                                    Edit
                                                </button>
                                                <button onClick={() => deleteProduct(p.id, p.name)} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer' }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ORDERS */}
                        {activeTab === 'orders' && (
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>
                                    Orders <span style={{ fontSize: '14px', color: '#888', fontWeight: '400' }}>({orders.length} total)</span>
                                </h2>
                                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f0f0f0', overflow: 'visible' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                            {['Order ID','Customer','Items','Total','Payment','Date','Action'].map(h => (
                                                <th key={h} style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: '#888', textAlign: 'left', letterSpacing: '1px' }}>{h.toUpperCase()}</th>
                                            ))}
                                        </tr></thead>
                                        <tbody>{orders.map((order, i) => (
                                            <tr key={order.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                                <td style={{ padding: '16px', fontSize: '13px', fontWeight: '800' }}>{order.id.substring(0,8)}</td>
                                                <td style={{ padding: '16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#1877F2' }} onClick={() => showNotif('Redirect to user profile...')}>{order.customer}</td>
                                                <td style={{ padding: '16px', fontSize: '12px', color: '#666', maxWidth: '200px' }}>
                                                    {order.rawItems && order.rawItems.map((item, idx) => (
                                                        <div key={idx} style={{cursor: 'pointer', color: '#1877F2', marginBottom: '4px'}} onClick={() => navigate(`/product/${item.products.id}`)}>
                                                            {item.products.name} (x{item.quantity})
                                                        </div>
                                                    ))}
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '800', color: '#e63946' }}>₱{order.total.toLocaleString()}</td>
                                                <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>{order.payment}</td>
                                                <td style={{ padding: '16px', fontSize: '12px', color: '#999' }}>{order.date}</td>
                                                <td style={{ padding: '16px' }}>
                                                    <StatusDropdown orderId={order.id} currentStatus={order.status} onUpdate={updateOrderStatus} />
                                                </td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* USERS */}
                        {activeTab === 'users' && (
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>
                                    Users <span style={{ fontSize: '14px', color: '#888', fontWeight: '400' }}>({users.length} total)</span>
                                </h2>
                                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                            {['User','Email','Phone','Role','Joined','Action'].map(h => (
                                                <th key={h} style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: '#888', textAlign: 'left', letterSpacing: '1px' }}>{h.toUpperCase()}</th>
                                            ))}
                                        </tr></thead>
                                        <tbody>{users.map((user, i) => (
                                            <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
                                                            {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span style={{ fontSize: '14px', fontWeight: '700' }}>{user.full_name || 'No Name'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>{user.email}</td>
                                                <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>{user.phone || 'N/A'}</td>
                                                <td style={{ padding: '16px', fontSize: '12px', fontWeight: '700' }}>{user.role}</td>
                                                <td style={{ padding: '16px', fontSize: '12px', color: '#999' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td style={{ padding: '16px' }}>
                                                    <button onClick={() => showNotif(`Cannot change role here yet`)} style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: `1.5px solid #e0e0e0`, background: '#fff', color: '#111' }}>Edit</button>
                                                </td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default AdminDashboard