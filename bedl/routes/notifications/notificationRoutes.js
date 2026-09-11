const express = require('express');
const router = express.Router();
const { optionalAuthenticate } = require('../../middlewares/authMiddleware');

const notifications = [
    { id: '1', title: 'Tài liệu mới', message: 'Hợp đồng KH A đã được cập nhật', isRead: false, createdAt: new Date() },
    { id: '2', title: 'Data Room', message: 'Hệ thống Data Room đã đồng bộ Cloudinary', isRead: false, createdAt: new Date() }
];

router.get('/', optionalAuthenticate, (req, res) => {
    res.json({
        success: true,
        notifications
    });
});

router.put('/read-all', optionalAuthenticate, (req, res) => {
    notifications.forEach(n => { n.isRead = true; });
    res.json({
        success: true,
        message: 'Đã đánh dấu tất cả là đã đọc'
    });
});

module.exports = router;
