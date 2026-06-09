const express = require('express');
const router = express.Router();

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

const userController = require('../controllers/userController');
const pool = require('../config/db');

// Middleware
router.use(authenticateToken);
router.use(authorizeRole('user'));

// Routes
router.get('/search', userController.searchParking);
router.get('/bookings', userController.getMyBookings);

// Complaint submission (transaction-safe)
router.post('/complaint', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { subject, message } = req.body;

        await connection.execute(
            `INSERT INTO complaints
             (user_email, subject, message, status)
             VALUES (?, ?, ?, ?)`,
            [req.user.email, subject, message, 'Pending']
        );

        await connection.execute(
            `INSERT INTO notifications
             (user_email, title, message)
             VALUES (?, ?, ?)`,
            [
                req.user.email,
                'Complaint Submitted',
                'Your complaint has been submitted successfully'
            ]
        );

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        connection.release();
    }
});

// Get my complaints
router.get('/my-complaints', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT *
             FROM complaints
             WHERE user_email = ?
             ORDER BY created_at DESC`,
            [req.user.email]
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Book parking (transaction-safe)
router.post('/book', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            parking_id,
            start_time,
            end_time,
            duration_hours,
            total_cost,
            advance_paid
        } = req.body;

        const userId = req.user.id;
        const userEmail = req.user.email || '';

        const [parking] = await connection.execute(
            'SELECT * FROM parking_spaces WHERE id = ?',
            [parking_id]
        );

        if (parking.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Parking not found' });
        }

        if (parking[0].available_slots <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'No slots available' });
        }

        const parkingName = parking[0].area_location;
        const slotNumber = `P-${parking_id}`;

        const [result] = await connection.execute(
            `INSERT INTO bookings
             (user_id, parking_id, parking_name, slot_number, amount,
              start_time, end_time, duration_hours, total_cost,
              advance_paid, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                parking_id,
                parkingName,
                slotNumber,
                total_cost,
                start_time,
                end_time,
                duration_hours,
                total_cost,
                advance_paid || 0,
                'Booked'
            ]
        );

        await connection.execute(
            `UPDATE parking_spaces
             SET available_slots = available_slots - 1
             WHERE id = ?`,
            [parking_id]
        );

        // ✅ Insert transaction record
        await connection.execute(
            `INSERT INTO transactions
             (booking_id, user_email, parking_name, amount, payment_status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                result.insertId,
                userEmail,
                parkingName,
                total_cost,
                'Paid'
            ]
        );

        await connection.execute(
            `INSERT INTO notifications
             (user_email, title, message)
             VALUES (?, ?, ?)`,
            [
                userEmail,
                'Booking Confirmed',
                `Your booking for ${parkingName} has been confirmed`
            ]
        );

        await connection.commit();
        res.status(201).json({
            success: true,
            bookingId: result.insertId
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        connection.release();
    }
});

// Notifications route
router.get('/notifications', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT *
             FROM notifications
             WHERE user_email = ?
             ORDER BY created_at DESC`,
            [req.user.email]
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
