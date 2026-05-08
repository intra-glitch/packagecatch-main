const express = require('express');
const supabase = require('../utils/supabase');
const { verifyToken } = require('./auth');

const router = express.Router();

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

// GET all orders (Admin only)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                id, 
                total_amount, 
                status, 
                shipping_fee, 
                created_at, 
                users (full_name, email),
                order_items (
                    quantity, 
                    price_at_time_of_purchase,
                    products (id, name, image_url)
                )
            `)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Supabase Error fetching orders:', error);
            throw error;
        }
        
        // Format the orders for the frontend table
        const formattedOrders = (orders || []).map(o => {
            const itemsString = (o.order_items || []).map(item => `${item.products?.name || 'Unknown'} (x${item.quantity})`).join(', ');
            return {
                id: o.id,
                customer: o.users?.full_name || o.users?.email || 'Unknown',
                email: o.users?.email,
                items: itemsString,
                rawItems: o.order_items,
                total: o.total_amount,
                status: o.status,
                payment: 'N/A',
                date: new Date(o.created_at).toLocaleDateString()
            };
        });

        res.json(formattedOrders);
    } catch (err) {
        console.error('Backend Error in GET /orders:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update order status (Admin only)
router.put('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create new order
router.post('/', verifyToken, async (req, res) => {
    try {
        const { items, subtotal, deliveryFee, total, shippingInfo } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in order' });
        }

        // 1. Create the order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: req.user.id,
                total_amount: total,
                subtotal: subtotal,
                shipping_fee: deliveryFee,
                status: 'pending'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create order items and update stock
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price_at_time_of_purchase: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // 3. Update stock for each product
        for (const item of items) {
            const { data: product } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', item.id)
                .single();
            
            if (product) {
                const newStock = Math.max(0, product.stock_quantity - item.quantity);
                await supabase
                    .from('products')
                    .update({ stock_quantity: newStock })
                    .eq('id', item.id);
            }
        }

        // 4. Trigger Notifications (Real-time and Email)
        const io = req.app.get('io');
        if (io) {
            io.emit('new_order', {
                id: order.id,
                total: order.total_amount,
                customer_id: req.user.id
            });
        }

        // Send Email Alert (Non-blocking)
        const { sendOrderNotification } = require('../utils/notifier');
        sendOrderNotification(order).catch(err => console.error('Email alert error:', err));

        res.status(201).json(order);
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET my orders
router.get('/my', verifyToken, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                id, 
                total_amount, 
                status, 
                subtotal,
                shipping_fee, 
                created_at, 
                order_items (
                    quantity, 
                    price_at_time_of_purchase,
                    products (id, name, image_url, category)
                )
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH cancel order (User only)
router.patch('/:id/cancel', verifyToken, async (req, res) => {
    try {
        // 1. Check if order belongs to user and is pending
        const { data: order, error: findError } = await supabase
            .from('orders')
            .select('status, user_id')
            .eq('id', req.params.id)
            .single();

        if (findError || !order) return res.status(404).json({ error: 'Order not found' });
        if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
        if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be cancelled' });

        // 2. Update status
        const { data, error } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
