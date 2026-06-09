const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// In a real scenario, the serviceAccountKey.json should be securely loaded
try {
    // If you have the JSON file downloaded from Firebase Console, place it in config/ or similar.
    // const serviceAccount = require('../config/serviceAccountKey.json');
    // admin.initializeApp({
    //     credential: admin.credential.cert(serviceAccount)
    // });
    console.log("Firebase Admin SDK initialized (placeholder)");
} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK", error);
}

exports.sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!fcmToken) {
        console.log("No FCM token provided, skipping notification.");
        return;
    }

    const message = {
        notification: {
            title: title,
            body: body,
        },
        data: data,
        token: fcmToken
    };

    try {
        // Uncomment the actual call when Firebase is fully configured
        // const response = await admin.messaging().send(message);
        // console.log('Successfully sent message:', response);
        console.log(`[Push Notification Simulated] To: ${fcmToken} | Title: ${title} | Body: ${body}`);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};
