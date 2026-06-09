const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {

    try {

        const [usersCount] =
            await pool.execute(

                "SELECT COUNT(*) AS count FROM users WHERE role='user'"
            );

        const [providersCount] =
            await pool.execute(

                "SELECT COUNT(*) AS count FROM users WHERE role='provider'"
            );

        const [bookingsCount] =
            await pool.execute(

                "SELECT COUNT(*) AS count FROM bookings"
            );

        const [parkingCount] =
            await pool.execute(

                "SELECT COUNT(*) AS count FROM parking_spaces"
            );

        res.json({

            totalUsers:
                usersCount[0].count,

            totalProviders:
                providersCount[0].count,

            totalBookings:
                bookingsCount[0].count,

            totalParking:
                parkingCount[0].count,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.getProviders = async (req, res) => {

    try {

        const [providers] =
            await pool.execute(

                `SELECT
                    id,
                    email,
                    role,
                    is_verified

                 FROM users

                 WHERE role = 'provider'`
            );

        res.json(providers);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.verifyProvider = async (req, res) => {

    try {

        const { provider_id } =
            req.params;

        await pool.execute(

            `UPDATE users
             SET is_verified = 1
             WHERE id = ?`,

            [provider_id]
        );

        res.json({
            success: true,
            message:
                'Provider verified successfully'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.getUsers = async (req, res) => {

    try {

        const [users] =
            await pool.execute(

                `SELECT
                    id,
                    email,
                    role,
                    created_at,
                    is_verified

                 FROM users

                 ORDER BY id DESC`
            );

        res.json(users);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Internal server error'
        });
    }
};