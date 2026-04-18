const db = require("../../db");

class CustomerModel {

    static async findByEmail(email) {
        const [rows] = await db.query(
            "SELECT * FROM customers WHERE email = ? AND is_active = ?",
            [email, 1]
        );
        return rows[0];

    }

    static async existsByName(name) {
        const [rows] = await db.query(
            "SELECT 1 FROM customers WHERE name = ? LIMIT 1",
            [name]
        );
        return rows.length > 0;
    }

    static async existsByEmail(conn, email) {
        const [rows] = await conn.query(
            "SELECT 1 FROM customers WHERE email = ? LIMIT 1",
            [email]
        );
        return rows.length > 0;
    }

    static async existsByPhone(conn, phone) {
        const [rows] = await conn.query(
            "SELECT 1 FROM customers WHERE phone = ? LIMIT 1",
            [phone]
        );
        return rows.length > 0;
    }


    static async updateCustomer(id, data) {
    const [current] = await db.query("SELECT * FROM customers WHERE id = ?", [id]);
    if (current.length === 0) {
        return { success: false, msg: "Khách hàng không tồn tại!" };
    }

    const customer = current[0];

    // ép kiểu an toàn, nếu NaN hoặc undefined thì lấy giá trị hiện tại
    const isVip = ["0","1",0,1].includes(data.is_vip) ? Number(data.is_vip) : customer.is_vip;
    const isActive = ["0","1",0,1].includes(data.is_active) ? Number(data.is_active) : customer.is_active;

    const values = [
        data.name ?? customer.name,
        data.short_name ?? customer.short_name,
        data.customer_type_id ?? customer.customer_type_id,
        data.status_id ?? customer.status_id,
        data.source_id ?? customer.source_id,
        data.industry ?? customer.industry,
        data.tax_code ?? customer.tax_code,
        data.website ?? customer.website,
        data.email ?? customer.email,
        data.phone ?? customer.phone,
        data.address ?? customer.address,
        data.city ?? customer.city,
        data.country ?? customer.country,
        data.contact_person ?? customer.contact_person,
        data.contact_phone ?? customer.contact_phone,
        data.contact_email ?? customer.contact_email,
        data.assigned_to ?? customer.assigned_to,
        data.credit_limit ?? customer.credit_limit,
        data.payment_term ?? customer.payment_term,
        data.note ?? customer.note,
        data.tags ? JSON.stringify(data.tags) : customer.tags,
        isVip,
        isActive,
        id
    ];

    const [result] = await db.query(
        `UPDATE customers SET
            name = ?, 
            short_name = ?, 
            customer_type_id = ?, 
            status_id = ?, 
            source_id = ?, 
            industry = ?, 
            tax_code = ?, 
            website = ?, 
            email = ?, 
            phone = ?, 
            address = ?, 
            city = ?, 
            country = ?, 
            contact_person = ?, 
            contact_phone = ?, 
            contact_email = ?, 
            assigned_to = ?, 
            credit_limit = ?, 
            payment_term = ?, 
            note = ?, 
            tags = ?, 
            is_vip = ?, 
            is_active = ?
        WHERE id = ?`,
        values
    );

    if (result.affectedRows > 0) {
        return { success: true, msg: "Cập nhật khách hàng thành công!" };
    } else {
        return { success: false, msg: "Cập nhật thất bại hoặc không có thay đổi!" };
    }
}

    static async create(conn, data) {
        const customer_code = "CUST-" + Date.now();

        const values = [
            customer_code,
            data.name,
            data.short_name || null,

            data.customer_type_id || null,
            data.status_id || null,
            data.source_id || null,

            data.industry || null,
            data.tax_code || null,
            data.website || null,
            data.email || null,
            data.phone || null,

            data.address || null,
            data.city || null,
            data.country || null,

            data.contact_person || null,
            data.contact_phone || null,
            data.contact_email || null,

            data.assigned_to || null,
            data.credit_limit || null,
            data.payment_term || null,

            data.note || null,
            data.tags ? JSON.stringify(data.tags) : null,
            data.is_vip ?? false,
            data.is_active ?? true,
            data.created_by
        ];

        const [result] = await conn.execute(
            `
        INSERT INTO customers (
            customer_code,
            name,
            short_name,
            customer_type_id,
            status_id,
            source_id,
            industry,
            tax_code,
            website,
            email,
            phone,
            address,
            city,
            country,
            contact_person,
            contact_phone,
            contact_email,
            assigned_to,
            credit_limit,
            payment_term,
            note,
            tags,
            is_vip,
            is_active,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            values
        );

        return result.insertId;
    }
    static async deletedById(id) {
        const [check] = await db.query("SELECT * FROM customers WHERE id = ?", [id]);

        if (check.length === 0) {
            return { success: false, msg: "Khách hàng không tồn tại!" };
        }

        if (check[0].is_active === 0) {
            return { success: false, msg: "Khách hàng này đã bị xoá trước đó rồi!!!" };
        }

        // Nếu chưa bị xoá thì xoá
        const [result] = await db.query("UPDATE customers SET is_active = 0 WHERE id = ?", [id]);

        if (result.affectedRows > 0) {
            return { success: true, msg: "Xoá khách hàng thành công!" };
        }

        return { success: false, msg: "Xoá khách hàng thất bại!" };
    }


    static async deletedByIds(ids = []) {
        if (ids.length === 0) return { success: false, msg: "Không có ID nào để xoá!" };

        const [rows] = await db.query(
            `SELECT id, is_active FROM customers WHERE id IN (${ids.map(() => '?').join(',')})`,
            ids
        );

        const deleted = [];
        const alreadyDeleted = [];
        const notFound = [];


        ids.forEach(id => {
            const customer = rows.find(r => r.id === id);
            if (!customer) {
                notFound.push(id);
            } else if (customer.is_active === 0) {
                alreadyDeleted.push(id);
            } else {
                deleted.push(id);
            }
        });


        if (deleted.length > 0) {
            await db.query(
                `UPDATE customers SET is_active = 0 WHERE id IN (${deleted.map(() => '?').join(',')})`,
                deleted
            );
        }


        return {
            success: deleted.length > 0,
            deleted,
            alreadyDeleted,
            notFound,
            msg: `Xoá thành công ${deleted.length} khách hàng. ${alreadyDeleted.length > 0 ? `${alreadyDeleted.length} khách đã xoá trước đó.` : ''} ${notFound.length > 0 ? `${notFound.length} khách không tồn tại.` : ''}`
        };
    }



    static async getAllCustomer() {
        const [rows] = await db.query(
            `
            SELECT 
    c.id,
    c.customer_code,
    c.name,
    ct.name AS customer_type_name,
    c.email,
    c.phone,
    src.name AS source_name,
    u.username AS assigned_name,
    st.name AS status_name,
    c.is_active,
    c.is_vip
FROM customers c
LEFT JOIN users u ON c.assigned_to = u.id 
LEFT JOIN categories ct ON c.customer_type_id = ct.id
LEFT JOIN categories st ON c.status_id = st.id
LEFT JOIN categories src ON c.source_id = src.id
ORDER BY u.created_at DESC;
            `
        );
        return rows;
    }

    // static async UpdateCustomer(id, data

    static async changeStatus(id) {
        const [rows] = await db.query("SELECT is_active FROM customers WHERE id = ?", [id]);
        if (rows.length === 0) return false;

        const current = rows[0].is_active;
        const newStatus = current == 1 ? 0 : 1;

        const [result] = await db.query(
            "UPDATE customers SET is_active = ? WHERE id = ?",
            [newStatus, id]
        );

        return result.affectedRows > 0;
    }

    static async changeIsVip(id) {
        const [result] = await db.query(
            "UPDATE customers SET is_vip = NOT is_vip WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }

}

module.exports = CustomerModel;