const express = require('express');

const router = express.Router();

const pool = require('../config/db');
const {
    authenticateToken
} = require('../middleware/authMiddleware');

router.get(
    '/all',
    authenticateToken,

    async (req, res) => {

        try {

            // Admin sees everything
            if (req.user.role === 'admin') {

                const [rows] =
                    await pool.execute(

                        'SELECT * FROM parking_spaces'
                    );

                return res.json(rows);
            }

            // Provider sees only own parking
            const [rows] =
                await pool.execute(

                    `SELECT *
                     FROM parking_spaces
                     WHERE provider_id = ?`,

                    [req.user.id]
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
router.delete('/delete/:id',

    async (req, res) => {

        try {

            const { id } = req.params;

            await pool.execute(

                'DELETE FROM parking_spaces WHERE id = ?',

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