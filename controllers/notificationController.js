const { sendPushNotification } = require('../services/firebaseService');

exports.sendTestNotification = async (req, res) => {
  try {
    const { fcmToken, title, body, data } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token required' });
    }
    await sendPushNotification(fcmToken, title || 'Test Notification', body || 'This is a test.', data || {});
    res.json({ message: 'Test notification sent (simulated)' });
  } catch (err) {
    console.error('Error sending test notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
