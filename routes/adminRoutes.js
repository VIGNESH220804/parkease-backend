const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

const pool = require('../config/db');

router.use(authenticateToken);
router.use(authorizeRole('admin'));

router.get('/stats', adminController.getDashboardStats);

router.get('/providers', adminController.getProviders);

router.put('/providers/:provider_id/verify', adminController.verifyProvider);

router.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, email, role FROM users'
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

router.delete('/delete-user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/analytics', async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT COUNT(*) AS totalUsers FROM users'
        );

        const [providers] = await pool.execute(
            "SELECT COUNT(*) AS totalProviders FROM users WHERE role='provider'"
        );

        const [bookings] = await pool.execute(
            'SELECT COUNT(*) AS totalBookings FROM bookings'
        );

        const [parking] = await pool.execute(
            'SELECT COUNT(*) AS totalParking FROM parking_spaces'
        );

        res.json({
            totalUsers: users[0].totalUsers,
            totalProviders: providers[0].totalProviders,
            totalBookings: bookings[0].totalBookings,
            totalParking: parking[0].totalParking,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/complaints', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM complaints ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

router.put('/complaints/:id/solve', async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_response } = req.body;

        await pool.execute(
            `UPDATE complaints
             SET status = 'Solved',
                 admin_response = ?
             WHERE id = ?`,
            [
                admin_response || 'Issue resolved',
                id
            ]
        );

        // ✅ Fetch complaint user email
        const [complaint] = await pool.execute(
            'SELECT user_email FROM complaints WHERE id = ?',
            [id]
        );

        if (complaint.length > 0) {
            await pool.execute(
                `INSERT INTO notifications
                 (user_email, title, message)
                 VALUES (?, ?, ?)`,
                [
                    complaint[0].user_email,
                    'Complaint Resolved',
                    'Your complaint has been resolved by admin'
                ]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
