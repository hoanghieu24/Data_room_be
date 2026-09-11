const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { optionalAuthenticate } = require('../../middlewares/authMiddleware');

router.get('/cloudinary', optionalAuthenticate, async (req, res) => {
    try {
        let isConnected = false;
        try {
            const ping = await cloudinary.api.ping();
            isConnected = ping.status === 'ok';
        } catch (e) {}

        res.json({
            success: true,
            config: {
                cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dzdldby9a',
                apiKey: '••••••••••••' + (process.env.CLOUDINARY_API_KEY || '').slice(-4),
                isConnected
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/cloudinary', optionalAuthenticate, async (req, res) => {
    try {
        const { cloudName, apiKey, apiSecret } = req.body;
        if (cloudName && apiKey && apiSecret) {
            cloudinary.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
                secure: true
            });
            const ping = await cloudinary.api.ping();
            if (ping.status === 'ok') {
                return res.json({ success: true, message: 'Kết nối Cloudinary thành công!' });
            }
        }
        res.status(400).json({ success: false, message: 'Thông tin kết nối không hợp lệ' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
