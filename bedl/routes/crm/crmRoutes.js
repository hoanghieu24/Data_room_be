const express = require('express');
const router = express.Router();
const db = require('../../db');
const { optionalAuthenticate } = require('../../middlewares/authMiddleware');

router.get('/clients', optionalAuthenticate, async (req, res) => {
    try {
        const [customers] = await db.query(
            `SELECT id, customer_code, name, email, phone, is_vip, created_at as createdAt 
             FROM customers 
             ORDER BY created_at DESC`
        );
        res.json({
            success: true,
            clients: customers.map(c => ({
                id: c.id,
                code: c.customer_code,
                name: c.name,
                email: c.email,
                phone: c.phone,
                company: c.name,
                status: 'lead',
                isVip: !!c.is_vip,
                createdAt: c.createdAt
            }))
        });
    } catch (error) {
        console.error('CRM clients get error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/clients', optionalAuthenticate, async (req, res) => {
    try {
        const { name, email, phone, company, status } = req.body;
        const code = `CUS_${Date.now().toString(36).toUpperCase()}`;
        const [result] = await db.query(
            `INSERT INTO customers (customer_code, name, email, phone, created_by, is_active)
             VALUES (?, ?, ?, ?, 1, 1)`,
            [code, name || company || 'Khách hàng mới', email || null, phone || null]
        );
        const [created] = await db.query(`SELECT * FROM customers WHERE id = ?`, [result.insertId]);
        res.status(201).json({
            success: true,
            message: 'Tạo khách hàng thành công',
            client: created[0]
        });
    } catch (error) {
        console.error('CRM client create error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/deals', optionalAuthenticate, async (req, res) => {
    try {
        const [contracts] = await db.query(
            `SELECT ct.*, c.name as customer_name
             FROM contracts ct
             LEFT JOIN customers c ON c.id = ct.customer_id
             ORDER BY ct.created_at DESC`
        );
        res.json({
            success: true,
            deals: contracts.map(ct => ({
                id: ct.id,
                title: ct.contract_name || ct.contract_number,
                contractNumber: ct.contract_number,
                customerId: ct.customer_id,
                customerName: ct.customer_name || 'Khách hàng',
                amount: ct.total_amount || ct.value || 0,
                status: 'draft',
                startDate: ct.start_date,
                endDate: ct.end_date,
                createdAt: ct.created_at
            }))
        });
    } catch (error) {
        console.error('CRM deals get error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/deals', optionalAuthenticate, async (req, res) => {
    try {
        const { title, customerId, amount, status, startDate, endDate } = req.body;
        const contractNumber = `CON_${Date.now().toString(36).toUpperCase()}`;
        const [result] = await db.query(
            `INSERT INTO contracts (contract_number, contract_name, customer_id, total_amount, start_date, end_date, created_by)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [contractNumber, title || 'Hợp đồng mới', customerId || 1, amount || 0, startDate || null, endDate || null]
        );
        const [created] = await db.query(`SELECT * FROM contracts WHERE id = ?`, [result.insertId]);
        res.status(201).json({
            success: true,
            message: 'Tạo hợp đồng/cơ hội thành công',
            deal: created[0]
        });
    } catch (error) {
        console.error('CRM deal create error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
