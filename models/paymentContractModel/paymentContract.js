const db = require("../../db")

class PaymentContractModel {
    static generatePaymentCode() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        return `PAY-${timestamp}-${random}`;
    }

    static async findAll() {
        const [rows] = await db.query(
            `SELECT
    p.*,
    c.contract_number,
    c.contract_name,
    cust.name AS customer_name,
    c.total_amount as contract_total,
    c.paid_amount as contract_paid,
    c.remaining_amount as contract_remaining
FROM payments AS p
JOIN contracts AS c
    ON c.id = p.contract_id
LEFT JOIN customers AS cust
    ON c.customer_id = cust.id
ORDER BY p.created_at DESC;`
        );
        return rows;
    }

    static async findById(id) {
        const query = `
        SELECT p.*, 
               c.contract_number, 
               cust.name AS customer_name,
               c.total_amount as contract_total
        FROM payments p
        LEFT JOIN contracts c ON p.contract_id = c.id
        LEFT JOIN customers cust ON c.customer_id = cust.id
        WHERE p.id = ?
    `;
        const [rows] = await db.query(query, [id]);

        if (rows.length === 0) {
            throw new Error("Payment not found");
        }

        return rows[0];
    }

    static async create(paymentData) {
        const {
            contract_id,
            payment_date,
            due_date,
            amount,
            paid_amount = 0,
            payment_method,
            transaction_id,
            notes,
            receipt_path,
            created_by
        } = paymentData;

        // Tự động xác định status
        let status = 'pending';
        const total = parseFloat(amount) || 0;
        const paid = parseFloat(paid_amount) || 0;

        if (paid === 0) {
            status = 'pending';
        } else if (paid >= total) {
            status = 'paid';
        } else if (paid > 0 && paid < total) {
            status = 'partial';
        }

        // Tạo mã thanh toán tự động (ví dụ: PM + timestamp)
        const payment_code = `PM${Date.now()}`;

        const query = `
        INSERT INTO payments (
            payment_code, contract_id, payment_date, due_date, 
            amount, paid_amount, payment_method, transaction_id,
            status, notes, receipt_path, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

        const values = [
            payment_code,
            contract_id,
            payment_date || null,
            due_date || null,
            amount,
            paid_amount,
            payment_method || null,
            transaction_id || null,
            status,
            notes || null,
            receipt_path || null,
            created_by || null
        ];

        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            throw new Error("Failed to create payment");
        }

        return this.findById(result.insertId);
    }

    static async update(id, paymentData) {
        const {
            payment_code,
            contract_id,
            payment_date,
            due_date,
            amount,
            paid_amount,        // Thêm trường paid_amount
            payment_method,
            transaction_id,
            status,
            notes,
            receipt_path,
            created_by
        } = paymentData;

        const updateFields = [];
        const values = [];

        if (payment_code !== undefined) {
            updateFields.push("payment_code = ?");
            values.push(payment_code);
        }
        if (contract_id !== undefined) {
            updateFields.push("contract_id = ?");
            values.push(contract_id);
        }
        if (payment_date !== undefined) {
            updateFields.push("payment_date = ?");
            values.push(payment_date);
        }
        if (due_date !== undefined) {
            updateFields.push("due_date = ?");
            values.push(due_date);
        }
        if (amount !== undefined) {
            updateFields.push("amount = ?");
            values.push(amount);
        }
        if (paid_amount !== undefined) {  // Thêm điều kiện cho paid_amount
            updateFields.push("paid_amount = ?");
            values.push(paid_amount);
        }
        if (payment_method !== undefined) {
            updateFields.push("payment_method = ?");
            values.push(payment_method);
        }
        if (transaction_id !== undefined) {
            updateFields.push("transaction_id = ?");
            values.push(transaction_id);
        }
        if (status !== undefined) {
            updateFields.push("status = ?");
            values.push(status);
        }
        if (notes !== undefined) {
            updateFields.push("notes = ?");
            values.push(notes);
        }
        if (receipt_path !== undefined) {
            updateFields.push("receipt_path = ?");
            values.push(receipt_path);
        }
        if (created_by !== undefined) {
            updateFields.push("created_by = ?");
            values.push(created_by);
        }

        if (updateFields.length === 0) {
            throw new Error("No fields to update");
        }

        const query = `UPDATE payments SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        values.push(id);

        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            throw new Error("Payment not found");
        }

        return this.findById(id);
    }

    static async updateWithAutoStatus(id, paymentData) {
        const existing = await this.findById(id);

        const amount = paymentData.amount ?? existing.amount;
        const paid_amount = paymentData.paid_amount ?? existing.paid_amount;

        let status = 'pending';

        const total = parseFloat(amount) || 0;
        const paid = parseFloat(paid_amount) || 0;

        if (paid === 0) {
            status = 'pending';
        } else if (paid >= total) {
            status = 'paid';
        } else {
            status = 'partial';
        }

        return this.update(id, {
            ...paymentData,
            status
        });
    }

    static async delete(id) {
        const [result] = await db.query("DELETE FROM payments WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            throw new Error("Payment not found");
        }

        return { message: "Payment deleted successfully" };
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM payments WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async findByContractId(contractId) {
        const [rows] = await db.query(
            `SELECT p.*,
                    c.contract_number,
                    c.contract_name,
                    cust.name AS customer_name
             FROM payments p
             LEFT JOIN contracts c ON p.contract_id = c.id
             LEFT JOIN customers cust ON c.customer_id = cust.id
             WHERE p.contract_id = ?
             ORDER BY p.created_at DESC`,
            [contractId]
        );
        return rows;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async getTotalPaidByContract(contractId) {
        const [rows] = await db.query(
            'SELECT COALESCE(SUM(paid_amount), 0) as total_paid FROM payments WHERE contract_id = ? AND status IN ("paid", "partial")',
            [contractId]
        );
        return rows[0]?.total_paid || 0;
    }
}

module.exports = PaymentContractModel;