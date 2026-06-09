const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendPushNotification } = require('../services/firebaseService');

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

exports.createOrder = async (req, res) => {
    try {
        const { booking_id, amount } = req.body;
        
        // Ensure booking belongs to user
        const [bookings] = await pool.execute('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [booking_id, req.user.id]);
        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_order_${booking_id}`
        };

        const order = await razorpayInstance.orders.create(options);
        
        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret')
            .update(body)
            .digest('hex');
        const isAuthentic = expectedSignature === razorpay_signature;
        if (!isAuthentic) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [booking] = await connection.execute('SELECT total_cost, user_id FROM bookings WHERE id = ?', [booking_id]);
            await connection.execute(
                `INSERT INTO payments (booking_id, transaction_id, amount, payment_method, status)
                 VALUES (?, ?, ?, ?, 'success')`,
                [booking_id, razorpay_payment_id, booking[0].total_cost, 'razorpay']
            );
            await connection.execute(
                `UPDATE bookings SET status = 'active', advance_paid = total_cost WHERE id = ?`,
                [booking_id]
            );
            await connection.commit();
            // Send push notification to user if token exists
            const [userRows] = await connection.execute('SELECT fcm_token FROM users WHERE id = ?', [booking[0].user_id]);
            if (userRows.length > 0 && userRows[0].fcm_token) {
                await sendPushNotification(
                    userRows[0].fcm_token,
                    'Payment Successful',
                    `Your booking #${booking_id} has been confirmed.`,
                    { bookingId: booking_id.toString() }
                );
            }
            res.json({ message: 'Payment verified successfully' });
        } catch (err) {
            await connection.rollback();
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
