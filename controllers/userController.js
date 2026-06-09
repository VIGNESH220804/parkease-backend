const pool =
    require('../config/db');
exports.getMyBookings = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;

        const [rows] =
            await pool.execute(

                `SELECT *
                 FROM bookings
                 WHERE user_id = ?
                 ORDER BY created_at DESC`,

                [userId]
            );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Database error'
        });
    }
};

exports.searchParking = async (
    req,
    res
) => {

    try {

        const {
            area
        } = req.query;

        let sql =
            'SELECT * FROM parking_spaces';

        let values = [];

        if (area) {

            sql +=
                ' WHERE area_location LIKE ? OR landmark LIKE ?';

            values.push(
                `%${area}%`,
                `%${area}%`
            );
        }

        const [rows] =
            await pool.execute(
                sql,
                values
            );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Database error'
        });
    }
};