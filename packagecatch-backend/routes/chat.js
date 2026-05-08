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
        return res.status(403).json({ error: 'Access denied.' });
    }
    next();
};

// GET messages for a specific user (Admin sees all, User sees own)
router.get('/:userId', verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.userId === 'me' ? req.user.id : req.params.userId;
        
        // If not admin and trying to see others' messages
        if (targetUserId !== req.user.id) {
            const { data: adminCheck } = await supabase.from('users').select('role').eq('id', req.user.id).single();
            if (!adminCheck || adminCheck.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Unauthorized' });
            }
        }

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all unique users who have messaged (Admin only)
router.get('/admin/conversations', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('user_id, created_at, text')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by user_id to get last message
        const conversations = [];
        const seen = new Set();
        
        for (const msg of data) {
            if (!seen.has(msg.user_id)) {
                seen.add(msg.user_id);
                // Get user details
                const { data: user } = await supabase.from('users').select('full_name, email').eq('id', msg.user_id).single();
                conversations.push({
                    user_id: msg.user_id,
                    last_message: msg.text,
                    last_time: msg.created_at,
                    user_name: user?.full_name || user?.email || 'Unknown User'
                });
            }
        }

        res.json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST send message
router.post('/', verifyToken, async (req, res) => {
    try {
        const { user_id, text, is_from_admin } = req.body;
        
        // If user is sending, user_id must be them
        const finalUserId = is_from_admin ? user_id : req.user.id;
        
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                user_id: finalUserId,
                sender_id: req.user.id,
                text,
                is_from_admin: !!is_from_admin
            })
            .select()
            .single();

        if (error) throw error;

        // Broadcast via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(finalUserId).emit('receive_message', message);
            if (is_from_admin) {
                io.emit('admin_notification', { type: 'new_message', userId: finalUserId });
            } else {
                io.emit('admin_notification', { type: 'customer_message', userId: finalUserId });
            }
        }

        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
