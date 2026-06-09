const express = require('express');

const router = express.Router();

const pool = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/create', authenticateToken,

    async (req, res) => {

        try {

            const {
                parking_id,
                parking_name,
                slot_number,
                amount,
                status
            } = req.body;
            const userEmail = req.user.email || 'user@example.com';

            const [parking] =
                await pool.execute(

                    'SELECT available_slots FROM parking_spaces WHERE id = ?',

                    [parking_id]
                );

            if (
                parking.length === 0
            ) {

                return res.status(404).json({
                    error: 'Parking not found'
                });
            }

            if (
                parking[0].available_slots <= 0
            ) {

                return res.status(400).json({
                    error: 'Parking Full'
                });
            }

            const [result] =
                await pool.execute(
                    `INSERT INTO bookings
                    (
                        parking_id,
                        parking_name,
                        slot_number,
                        amount,
                        status,
                        user_id
                    )
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        parking_id,
                        parking_name,
                        slot_number,
                        amount,
                        status,
                        req.user.id
                    ]
                );

            await pool.execute(

                `UPDATE parking_spaces
                SET available_slots =
                available_slots - 1

                WHERE id = ?`,

                [parking_id]
            );

            await pool.execute(

                `INSERT INTO transactions
                (
                    booking_id,
                    user_email,
                    parking_name,
                    amount,
                    payment_status
                )

                VALUES (?, ?, ?, ?, ?)`,

                [
                    result.insertId,
                    userEmail,
                    parking_name,
                    amount,
                    'Paid'
                ]
            );

            res.json({

                success: true,

                bookingId:
                    result.insertId
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: 'Database error'
            });
        }
    }
);

router.get('/all', authenticateToken,

    async (req, res) => {

        try {

            const [rows] =
                await pool.execute(

                    `SELECT
                        id,
                        parking_name,
                        slot_number,
                        amount,
                        status,
                        created_at
                     FROM bookings
                     ORDER BY created_at DESC`
                );

            res.json(rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: 'Database error'
            });
        }
    }
);

router.delete('/cancel/:id', authenticateToken,

    async (req, res) => {

        try {

            const { id } = req.params;

            const [booking] =
                await pool.execute(

                    'SELECT parking_id FROM bookings WHERE id = ?',

                    [id]
                );

            if (booking.length === 0) {

                return res.status(404).json({
                    error: 'Booking not found'
                });
            }

            await pool.execute(

                `UPDATE parking_spaces
                 SET available_slots = available_slots + 1
                 WHERE id = ?`,

                [booking[0].parking_id]
            );

            await pool.execute(

                'DELETE FROM bookings WHERE id = ?',

                [id]
            );

            res.json({
                success: true
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: 'Database error'
            });
        }
    }
);

module.exports = router;