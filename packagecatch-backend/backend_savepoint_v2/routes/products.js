const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('./auth');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Middleware to check if user is admin
const verifyAdmin = async (req, res, next) => {
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

// GET all products (admin sees all, users see active only - handled in query)
router.get('/', async (req, res) => {
    try {
        const { status } = req.query; // 'draft', 'active', 'sold'
        let query = supabase.from('products').select('*').order('created_at', { ascending: false });
        
        if (status) {
            query = query.eq('status', status);
        }

        const { data: products, error } = await query;
        if (error) throw error;
        
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET product by id
router.get('/:id', async (req, res) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();
            
        if (error) throw error;
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create product (Admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name, description, price, original_price, category, tag, stock_quantity, images, status, condition } = req.body;
        
        const { data, error } = await supabase
            .from('products')
            .insert([{ 
                name, description, price, original_price, category, tag, 
                stock_quantity, images, status, condition, active: status !== 'draft' 
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update product (Admin only)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name, description, price, original_price, category, tag, stock_quantity, images, status, condition } = req.body;
        
        const { data, error } = await supabase
            .from('products')
            .update({ 
                name, description, price, original_price, category, tag, 
                stock_quantity, images, status, condition, active: status !== 'draft' 
            })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE product (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET product reviews (with replies)
router.get('/:id/reviews', async (req, res) => {
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*, users(full_name, email)')
            .eq('product_id', req.params.id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;

        // Fetch replies for each review
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

// POST product review
router.post('/:id/reviews', verifyToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const { data, error } = await supabase
            .from('reviews')
            .insert([{ 
                product_id: req.params.id, 
                user_id: req.user.id, 
                rating, 
                comment 
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE product review
router.delete('/:productId/reviews/:reviewId', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', req.params.reviewId)
            .eq('user_id', req.user.id); // Security: only owner can delete

        if (error) throw error;
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST reply to a review (any logged-in user or admin)
router.post('/:productId/reviews/:reviewId/replies', verifyToken, async (req, res) => {
    try {
        const { comment, reply_to_name } = req.body;
        if (!comment || !comment.trim()) {
            return res.status(400).json({ error: 'Comment is required' });
        }

        // Fetch user details from database to be 100% sure of the role
        const { data: userData, error: userErr } = await supabase
            .from('users')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (userErr) console.error("Error fetching user role:", userErr);
        const isAdmin = userData?.role === 'ADMIN';

        const { data, error } = await supabase
            .from('review_replies')
            .insert([{
                review_id: parseInt(req.params.reviewId),
                user_id: req.user.id,
                comment: comment.trim(),
                is_admin: isAdmin,
                reply_to_name: reply_to_name || null
            }])
            .select('*');

        if (error) {
            console.error("Supabase Reply Error:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data[0]);
    } catch (err) {
        console.error("Reply Server Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
