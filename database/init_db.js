const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initializeDatabase() {
    console.log('Starting database initialization...');
    
    // Connect to MySQL server without selecting database first
    const connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        multipleStatements: true
    };

    let connection;
    try {
        connection = await mysql.createConnection(connectionConfig);
        console.log('Connected to MySQL server successfully.');
    } catch (err) {
        console.error('Error connecting to MySQL server:', err.message);
        console.log('Please ensure MySQL is running on localhost:' + (process.env.DB_PORT || 3306));
        process.exit(1);
    }

    try {
        // Read schema.sql file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema.sql...');
        // Split queries by semicolon to execute them sequentially if needed,
        // or execute as multiple statements since multipleStatements: true is enabled
        await connection.query(schemaSql);
        console.log('Database and tables initialized successfully!');
        
        // Seed default admin account if not already present
        const [rows] = await connection.query('SELECT * FROM users WHERE role = "admin"');
        if (rows.length === 0) {
            console.log('Seeding default admin user...');
            const bcrypt = require('bcrypt');
            const adminPasswordHash = await bcrypt.hash('admin123', 10);
            await connection.query(
                `INSERT INTO users (full_name, phone_number, email, password_hash, role, address, state, district)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['System Admin', '9999999999', 'admin@parkease.com', adminPasswordHash, 'admin', 'Main Head Office', 'State', 'District']
            );
            console.log('Default admin seeded (Email: admin@parkease.com, Password: admin123)');
        }
    } catch (err) {
        console.error('Error initializing database:', err.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
