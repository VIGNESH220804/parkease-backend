const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const authController = require('../controllers/authController');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, full_name, email, role, phone_number FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { full_name, phone_number, password } = req.body;

        if (!full_name && !phone_number && !password) {
            return res.status(400).json({ error: 'No profile fields provided' });
        }

        if (phone_number) {
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE phone_number = ? AND id != ?',
                [phone_number, req.user.id]
            );

            if (existing.length > 0) {
                return res.status(409).json({ error: 'Phone number already in use' });
            }
        }

        const updates = [];
        const values = [];

        if (full_name) {
            updates.push('full_name = ?');
            values.push(full_name);
        }

        if (phone_number) {
            updates.push('phone_number = ?');
            values.push(phone_number);
        }

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            updates.push('password_hash = ?');
            values.push(password_hash);
        }

        values.push(req.user.id);

        await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
