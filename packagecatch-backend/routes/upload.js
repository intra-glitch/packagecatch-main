const express = require('express');
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('./auth');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload profile photo
router.post('/photo', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `profile-${req.user.id}-${Date.now()}.jpg`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    // Update user profile with photo URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_photo: urlData.publicUrl })
      .eq('id', req.user.id);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ photoUrl: urlData.publicUrl });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;