const pool = require('../config/db');

exports.addZone = async (req, res) => {
    try {
        const { name, area, landmark, latitude, longitude, operating_hours } = req.body;
        const providerId = req.user.id; // Using user_id as provider_id for simplicity, in real app query provider table
        
        // Ensure provider exists
        const [providers] = await pool.execute('SELECT id FROM providers WHERE user_id = ?', [providerId]);
        let pid;
        if (providers.length === 0) {
            const [newProvider] = await pool.execute('INSERT INTO providers (user_id) VALUES (?)', [providerId]);
            pid = newProvider.insertId;
        } else {
            pid = providers[0].id;
        }

        const [result] = await pool.execute(
            `INSERT INTO parking_zones (provider_id, name, area, landmark, latitude, longitude, operating_hours)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [pid, name, area, landmark, latitude, longitude, operating_hours]
        );
        
        res.status(201).json({ message: 'Zone added successfully', zoneId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getZones = async (req, res) => {
    try {
        const providerId = req.user.id;
        const [providers] = await pool.execute('SELECT id FROM providers WHERE user_id = ?', [providerId]);
        if (providers.length === 0) return res.json([]);
        
        const [zones] = await pool.execute('SELECT * FROM parking_zones WHERE provider_id = ?', [providers[0].id]);
        res.json(zones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addSlot = async (req, res) => {
    try {
        const { zone_id, vehicle_type, price_per_hour } = req.body;
        const [result] = await pool.execute(
            `INSERT INTO parking_slots (zone_id, vehicle_type, price_per_hour) VALUES (?, ?, ?)`,
            [zone_id, vehicle_type, price_per_hour]
        );
        res.status(201).json({ message: 'Slot added successfully', slotId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getSlots = async (req, res) => {
    try {
        const { zone_id } = req.params;
        const [slots] = await pool.execute('SELECT * FROM parking_slots WHERE zone_id = ?', [zone_id]);
        res.json(slots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
