const express = require('express');
const supabase = require('../utils/supabase');
const { verifyToken } = require('./auth');

const router = express.Router();

// Middleware to check if user is admin
const verifyAdmin = async (req, res, next) => {
    // verifyToken already populates req.user
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();
        
    if (error || !data || data.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

// Get Dashboard Stats
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // 1. Total Revenue (Completed Orders)
        const { data: revenueData } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('status', 'completed');
        const totalRevenue = revenueData ? revenueData.reduce((sum, order) => sum + Number(order.total_amount), 0) : 0;

        // 2. Pending Orders
        const { count: pendingOrdersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // 3. Low Stock Items (Stock <= 3)
        const { count: lowStockCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .lte('stock_quantity', 3)
            .eq('active', true);

        // 4. Active Users
        const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'USER');

        res.json({
            revenue: totalRevenue,
            pendingOrders: pendingOrdersCount || 0,
            lowStockItems: lowStockCount || 0,
            activeUsers: usersCount || 0
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Live Activity Feed (orders + users + reviews)
router.get('/activity', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Fetch recent orders
        const { data: orders } = await supabase
            .from('orders')
            .select('id, status, created_at, users(full_name, email)')
            .order('created_at', { ascending: false })
            .limit(5);

        // Fetch recent users
        const { data: users } = await supabase
            .from('users')
            .select('id, full_name, email, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        // Fetch recent reviews
        const { data: reviews } = await supabase
            .from('reviews')
            .select('id, rating, comment, created_at, product_id, products(name), users(full_name, email)')
            .order('created_at', { ascending: false })
            .limit(5);

        let activities = [];

        if (orders) {
            orders.forEach(o => {
                let msg = '';
                let icon = '📦';
                let color = '#e8f4fd';
                if (o.status === 'pending') { msg = `New order ${String(o.id).substring(0,8)} placed by ${o.users?.full_name || 'User'}`; icon = '🛍️'; }
                else if (o.status === 'completed') { msg = `Order ${String(o.id).substring(0,8)} marked as Completed`; icon = '✅'; color = '#f0fff8'; }
                else if (o.status === 'cancelled') { msg = `Order ${String(o.id).substring(0,8)} was Cancelled`; icon = '🚫'; color = '#fff0f0'; }
                else { msg = `Order ${String(o.id).substring(0,8)} updated to ${o.status}`; }
                
                activities.push({ type: 'order', icon, msg, time: o.created_at, color });
            });
        }

        if (users) {
            users.forEach(u => {
                activities.push({
                    type: 'user',
                    icon: '👤',
                    msg: `New user registered: ${u.email}`,
                    time: u.created_at,
                    color: '#f0fff8'
                });
            });
        }

        if (reviews) {
            reviews.forEach(r => {
                const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                activities.push({
                    type: 'review',
                    icon: '⭐',
                    msg: `${r.users?.full_name || 'A user'} rated "${r.products?.name || 'a product'}" ${stars}`,
                    time: r.created_at,
                    color: '#fffbe6',
                    productId: r.product_id,
                    reviewId: r.id
                });
            });
        }

        // Sort by time descending and take top 10
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        activities = activities.slice(0, 10);

        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Users List
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, full_name, email, phone, address, created_at, role, status');
        
        if (error) throw error;
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User Role
router.patch('/users/:id/role', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const { data, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', req.params.id)
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Moderation: Ban/Suspend/Mute
router.patch('/users/:id/status', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body; // e.g., 'active', 'banned', 'suspended', 'muted'
        const { data, error } = await supabase
            .from('users')
            .update({ status })
            .eq('id', req.params.id)
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all Reviews (admin overview)
router.get('/reviews', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*, users(full_name, email), products(id, name, images)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch replies
        const reviewIds = (reviews || []).map(r => r.id);
        let repliesMap = {};
        if (reviewIds.length > 0) {
            const { data: replies } = await supabase
                .from('review_replies')
                .select('*, users(full_name, email)')
                .in('review_id', reviewIds)
                .order('created_at', { ascending: true });
            (replies || []).forEach(reply => {
                if (!repliesMap[reply.review_id]) repliesMap[reply.review_id] = [];
                repliesMap[reply.review_id].push(reply);
            });
        }

        const enriched = (reviews || []).map(r => ({
            ...r,
            replies: repliesMap[r.id] || []
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
