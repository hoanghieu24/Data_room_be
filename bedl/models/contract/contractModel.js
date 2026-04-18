const db = require("../../db");

class ContractModel {
    // Find all contracts with optional filters
    static async findAll(filters = {}) {
        let query = `
            SELECT
                c.*,
                cust.name,
                opp.name,
                cat.name as status_name,
                creator.username as created_by_name,
                approver.username as approved_by_name
            FROM contracts c
            LEFT JOIN customers cust ON c.customer_id = cust.id
            LEFT JOIN opportunities opp ON c.opportunity_id = opp.id
            LEFT JOIN categories cat ON c.status_id = cat.id
            LEFT JOIN users creator ON c.created_by = creator.id
            LEFT JOIN users approver ON c.approved_by = approver.id
        `;

        const conditions = [];
        const params = [];

        if (filters.customer_id) {
            conditions.push('c.customer_id = ?');
            params.push(filters.customer_id);
        }

        if (filters.status_id) {
            conditions.push('c.status_id = ?');
            params.push(filters.status_id);
        }

        if (filters.contract_type) {
            conditions.push('c.contract_type = ?');
            params.push(filters.contract_type);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY c.created_at DESC';

        const [rows] = await db.query(query, params);
        return rows;
    }

    // Find contract by ID
    static async findById(id) {
        const [rows] = await db.query(`
            SELECT
                c.*,
                cust.customer_name,
                opp.opportunity_name,
                cat.name as status_name,
                creator.username as created_by_name,
                approver.username as approved_by_name
            FROM contracts c
            LEFT JOIN customers cust ON c.customer_id = cust.id
            LEFT JOIN opportunities opp ON c.opportunity_id = opp.id
            LEFT JOIN categories cat ON c.status_id = cat.id
            LEFT JOIN users creator ON c.created_by = creator.id
            LEFT JOIN users approver ON c.approved_by = approver.id
            WHERE c.id = ?
        `, [id]);
        return rows[0];
    }

    // Create new contract
    static async create(contractData) {
        const [result] = await db.query(`
            INSERT INTO contracts (
                contract_number, contract_name, customer_id, opportunity_id,
                contract_type, status_id, start_date, end_date, sign_date,
                value, currency, payment_term, payment_method, tax_rate,
                total_amount, paid_amount, remaining_amount, renewal_date,
                renewal_reminder_date, terms_and_conditions, notes,
                document_path, signed_by, signed_position, created_by,
                approved_by, approved_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            contractData.contract_number,
            contractData.contract_name,
            contractData.customer_id,
            contractData.opportunity_id,
            contractData.contract_type,
            contractData.status_id,
            contractData.start_date,
            contractData.end_date,
            contractData.sign_date,
            contractData.value,
            contractData.currency || 'VND',
            contractData.payment_term,
            contractData.payment_method,
            contractData.tax_rate,
            contractData.total_amount,
            contractData.paid_amount || 0,
            contractData.remaining_amount,
            contractData.renewal_date,
            contractData.renewal_reminder_date,
            contractData.terms_and_conditions,
            contractData.notes,
            contractData.document_path,
            contractData.signed_by,
            contractData.signed_position,
            contractData.created_by,
            contractData.approved_by,
            contractData.approved_date
        ]);
        return result.insertId;
    }

    // Update contract
    static async update(id, contractData) {
        const [result] = await db.query(`
            UPDATE contracts SET
                contract_number = ?, contract_name = ?, customer_id = ?,
                opportunity_id = ?, contract_type = ?, status_id = ?,
                start_date = ?, end_date = ?, sign_date = ?, value = ?,
                currency = ?, payment_term = ?, payment_method = ?,
                tax_rate = ?, total_amount = ?, paid_amount = ?,
                remaining_amount = ?, renewal_date = ?,
                renewal_reminder_date = ?, terms_and_conditions = ?,
                notes = ?, document_path = ?, signed_by = ?,
                signed_position = ?, approved_by = ?, approved_date = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            contractData.contract_number,
            contractData.contract_name,
            contractData.customer_id,
            contractData.opportunity_id,
            contractData.contract_type,
            contractData.status_id,
            contractData.start_date,
            contractData.end_date,
            contractData.sign_date,
            contractData.value,
            contractData.currency || 'VND',
            contractData.payment_term,
            contractData.payment_method,
            contractData.tax_rate,
            contractData.total_amount,
            contractData.paid_amount || 0,
            contractData.remaining_amount,
            contractData.renewal_date,
            contractData.renewal_reminder_date,
            contractData.terms_and_conditions,
            contractData.notes,
            contractData.document_path,
            contractData.signed_by,
            contractData.signed_position,
            contractData.approved_by,
            contractData.approved_date,
            id
        ]);
        return result.affectedRows > 0;
    }

    // Delete contract
    static async delete(id) {
        const [result] = await db.query('DELETE FROM contracts WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    // Find contracts by customer ID
    static async findByCustomerId(customerId) {
        const [rows] = await db.query(`
            SELECT
                c.*,
                cust.customer_name,
                opp.opportunity_name,
                cat.name as status_name
            FROM contracts c
            LEFT JOIN customers cust ON c.customer_id = cust.id
            LEFT JOIN opportunities opp ON c.opportunity_id = opp.id
            LEFT JOIN categories cat ON c.status_id = cat.id
            WHERE c.customer_id = ?
            ORDER BY c.created_at DESC
        `, [customerId]);
        return rows;
    }

    // Update contract status
    static async updateStatus(id, statusId) {
        const [result] = await db.query(
            'UPDATE contracts SET status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [statusId, id]
        );
        return result.affectedRows > 0;
    }

    // Update payment amounts
    static async updatePaymentAmounts(id, paidAmount, remainingAmount) {
        const [result] = await db.query(
            'UPDATE contracts SET paid_amount = ?, remaining_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [paidAmount, remainingAmount, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = ContractModel;