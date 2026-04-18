const db = require("../../db");
const Customer = require("../../models/Customer/CustomerModel");

class CustomerService {
    static async addCustomer(data, userId) {
        console.log("Received data for new customer:", data);
        if (!data || !data.name) throw new Error("Tên khách hàng là bắt buộc");

        const conn = await db.getConnection();

        try {
            await conn.beginTransaction();

            if (data.email && await Customer.existsByEmail(conn, data.email))
                throw new Error("Email đã tồn tại");

            if (data.phone && await Customer.existsByPhone(conn, data.phone))
                throw new Error("Số điện thoại đã tồn tại");

            const customerId = await Customer.create(conn, {
                ...data,
                created_by: userId.id || userId
            });

            await conn.commit();
            return customerId;

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    static async getAllCustomer() {
        const customers = await Customer.getAllCustomer();


        return customers.map(c => ({
            ...c,
            is_active: c.is_active === 1,
            role: {
                code: c.role_code,
                name: c.role_name
            }
        }));
    }

    static async deletedById(id) {
        const deleted = await Customer.deletedById(id);
        return deleted;
    }

    static async deletedByIds(ids) {
        const deletedCount = await Customer.deletedByIds(ids);
        return deletedCount;
    }

    static async changeStatus(id) {
        return await Customer.changeStatus(id);
    }

    static async changeIsVip(id) {
        return await Customer.changeIsVip(id);
    }

    static async updateCustomer(id, data) {
        return Customer.updateCustomer(id, data);
    }


}

module.exports = CustomerService;
