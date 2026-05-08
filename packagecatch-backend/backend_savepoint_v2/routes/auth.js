const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Use Supabase Auth for registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName: fullName,
          role: 'USER'
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ error: 'Registration failed or email verification required' });
    }

    // Generate our own JWT for backend compatibility
    const token = jwt.sign({ id: data.user.id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: data.user.id, email, fullName: fullName, role: 'USER' } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Use Supabase Auth for login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Fetch user details from public.users table to get full_name and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', data.user.id)
      .single();

    const fullName = userData ? userData.full_name : '';
    const role = userData ? userData.role : 'USER';

    // Generate our own JWT for backend compatibility
    const token = jwt.sign({ id: data.user.id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: data.user.id, email, fullName: fullName, role: role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Account Recovery: Get Email Hint or Reveal Full Email
router.post('/recover/email-hint', async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    if (!fullName) return res.status(400).json({ error: 'Full name is required' });

    // Find user by name
    const { data: users, error } = await supabase
      .from('users')
      .select('email, phone')
      .ilike('full_name', `%${fullName}%`);

    if (error || !users || users.length === 0) {
      return res.status(404).json({ error: 'No account found with that name' });
    }

    const user = users[0];
    const email = user.email;

    // If phone is provided and matches, reveal FULL email
    if (phone && user.phone === phone.trim()) {
        return res.json({ email: email, verified: true });
    }

    // Otherwise, just return a hint
    const parts = email.split('@');
    const hint = parts[0].substring(0, 2) + '***@' + parts[1];
    res.json({ hint, verified: false });
  } catch (err) {
    res.status(500).json({ error: 'Recovery failed' });
  }
});

// Account Recovery: Reset Password via Identity Verification
router.post('/recover/password', async (req, res) => {
  try {
    const { email, fullName, newPassword } = req.body;
    if (!email || !fullName || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 1. Verify identity in the users table
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .ilike('full_name', fullName.trim())
      .single();

    if (fetchErr || !user) {
      return res.status(400).json({ error: 'Identity verification failed. Information does not match.' });
    }

    // 2. Update password using Supabase Admin API (bypasses email)
    const { error: resetErr } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (resetErr) {
      return res.status(400).json({ error: resetErr.message });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Middleware to verify JWT
const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { router, verifyToken };