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

// GET /api/coupons/validate?code=SUMMER20&total=1000
router.get('/validate', verifyToken, async (req, res) => {
    try {
        const { code, total } = req.query;
        if (!code) return res.status(400).json({ error: 'Coupon code required' });

        // In a multi-billion dollar company, we'd have a robust coupons table.
        // For this implementation, we'll check a 'coupons' table in Supabase.
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !coupon) {
            return res.status(404).json({ error: 'Invalid coupon code' });
        }

        // Validate expiry
        if (new Date(coupon.expiry_date) < new Date()) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }

        // Validate minimum spend
        if (total < coupon.min_spend) {
            return res.status(400).json({ error: `Minimum spend of ₱${coupon.min_spend} required` });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.type === 'percentage') {
            discount = (total * coupon.value) / 100;
            if (coupon.max_discount) {
                discount = Math.min(discount, coupon.max_discount);
            }
        } else {
            discount = coupon.value;
        }

        res.json({
            valid: true,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            discount: Math.round(discount),
            newTotal: Math.max(0, total - discount)
        });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: GET all coupons
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: POST create coupon
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { code, type, value, min_spend, max_discount, expiry_date } = req.body;
        const { data, error } = await supabase
            .from('coupons')
            .insert([{ 
                code: code.toUpperCase(), 
                type, 
                value, 
                min_spend: min_spend || 0, 
                max_discount: max_discount || null, 
                expiry_date 
            }])
            .select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: DELETE coupon
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Coupon deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
