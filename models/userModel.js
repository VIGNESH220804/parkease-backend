const pool = require('../config/db');

class UserModel {
    static async create(userData) {
        const { full_name, phone_number, email, password_hash, role, address, state, district } = userData;
        const [result] = await pool.execute(
            `INSERT INTO users (full_name, phone_number, email, password_hash, role, address, state, district)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, phone_number, email, password_hash, role || 'user', address, state, district]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT id, full_name, email, role, phone_number FROM users WHERE id = ?', [id]);
        return rows[0];
    }
}

module.exports = UserModel;
