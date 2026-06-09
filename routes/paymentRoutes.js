const express = require('express');

const router = express.Router();

const paymentController =
    require('../controllers/paymentController');

const {
    authenticateToken
} = require('../middleware/authMiddleware');

const pool =
    require('../config/db');

router.use(authenticateToken);

router.post(
    '/create-order',
    paymentController.createOrder
);

router.post(
    '/verify',
    paymentController.verifyPayment
);
router.get(
    '/all',

    async (req, res) => {

        try {

            // ADMIN
            if (req.user.role === 'admin') {

                const [rows] =
                    await pool.execute(

                        `SELECT *
                         FROM transactions
                         ORDER BY created_at DESC`
                    );

                return res.json(rows);
            }

            // PROVIDER
            if (req.user.role === 'provider') {

                const [rows] =
                    await pool.execute(

                        `SELECT
                            b.id,
                            b.parking_name,
                            b.amount,
                            b.status,
                            b.created_at
                         FROM bookings b
                         JOIN parking_spaces p
                         ON b.parking_id = p.id
                         WHERE p.provider_id = ?
                         ORDER BY b.created_at DESC`,

                        [req.user.id]
                    );

                return res.json(rows);
            }

            // USER
            const [rows] =
                await pool.execute(

                    `SELECT *
                     FROM transactions
                     WHERE user_email = ?
                     ORDER BY created_at DESC`,

                    [req.user.email]
                );

            res.json(rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: 'Database error'
            });ss
        }
    }
);module.exports = router;