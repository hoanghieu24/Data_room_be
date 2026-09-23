const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const db = require('../../db');
const { optionalAuthenticate, authenticate, authorize } = require('../../middlewares/authMiddleware');

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

// DMS settings
router.get('/dms', optionalAuthenticate, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT setting_key, setting_value FROM system_settings WHERE category = 'dms'"
        );
        const settings = {};
        rows.forEach(r => {
            settings[r.setting_key] = r.setting_value;
        });

        res.json({
            success: true,
            settings: {
                expiryWarningDays: parseInt(settings.EXPIRY_WARNING_DAYS, 10) || 30,
                fileNamingRule: settings.NAMING_CONVENTION_TEMPLATE || '[DATE]_[TYPE]_[PARTNER]_[VERSION]'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/dms', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { expiryWarningDays, fileNamingRule } = req.body;

        if (expiryWarningDays !== undefined) {
            await db.query(
                "UPDATE system_settings SET setting_value = ? WHERE setting_key = 'EXPIRY_WARNING_DAYS'",
                [String(expiryWarningDays)]
            );
        }

        if (fileNamingRule !== undefined) {
            await db.query(
                "UPDATE system_settings SET setting_value = ? WHERE setting_key = 'NAMING_CONVENTION_TEMPLATE'",
                [String(fileNamingRule)]
            );
        }

        res.json({ success: true, message: 'Lưu cấu hình DMS thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
