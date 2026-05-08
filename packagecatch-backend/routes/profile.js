const express = require('express');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('./auth');
const supabase = require('../utils/supabase');

const router = express.Router();

// Get profile
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, address, landmark, profile_photo, role')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/', verifyToken, async (req, res) => {
  try {
    const { fullName, phone, address, landmark } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ full_name: fullName, phone, address, landmark })
      .eq('id', req.user.id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;