const express = require('express');
const router = express.Router();

const providerController =
    require('../controllers/providerController');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

const pool =
    require('../config/db');

router.use(authenticateToken);

router.use(
    authorizeRole('provider', 'admin')
);

router.post(
    '/zone',
    providerController.addZone
);

router.get(
    '/zones',
    providerController.getZones
);

router.post(
    '/slot',
    providerController.addSlot
);

router.get(
    '/slots/:zone_id',
    providerController.getSlots
);

router.post(
    '/add-parking',

    async (req, res) => {

        try {

            const {
                provider_name,
                area_location,
                landmark,
                available_slots,
                slot_price,
                parking_type
            } = req.body;

            await pool.execute(

    `INSERT INTO parking_spaces
    (
        provider_name,
        area_location,
        landmark,
        available_slots,
        slot_price,
        parking_type,
        provider_id
    )

    VALUES (?, ?, ?, ?, ?, ?, ?)`,

    [
        provider_name,
        area_location,
        landmark,
        available_slots,
        slot_price,
        parking_type,
        req.user.id
    ]
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