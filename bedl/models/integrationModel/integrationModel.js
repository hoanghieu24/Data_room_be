const db = require('../../db');

const toJson = (value) => {
    if (value === undefined || value === null) {
        return null;
    }
    return typeof value === 'object' ? JSON.stringify(value) : value;
};

class IntegrationModel {
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM integrations ORDER BY created_at DESC'
        );
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.query(
            'SELECT * FROM integrations WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async create(data) {
        const {
            integration_code,
            name,
            type,
            status,
            config,
            last_sync,
            sync_status,
            notes,
            created_by
        } = data;

        const [result] = await db.query(
            `INSERT INTO integrations (
                integration_code,
                name,
                type,
                status,
                config,
                last_sync,
                sync_status,
                notes,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                integration_code,
                name,
                type || null,
                status || 'inactive',
                toJson(config),
                last_sync || null,
                sync_status || null,
                notes || null,
                created_by || null
            ]
        );

        return this.getById(result.insertId);
    }

    static async update(id, data) {
        const {
            integration_code,
            name,
            type,
            status,
            config,
            last_sync,
            sync_status,
            notes,
            created_by
        } = data;

        const updateFields = [];
        const values = [];

        if (integration_code !== undefined) {
            updateFields.push('integration_code = ?');
            values.push(integration_code);
        }
        if (name !== undefined) {
            updateFields.push('name = ?');
            values.push(name);
        }
        if (type !== undefined) {
            updateFields.push('type = ?');
            values.push(type);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            values.push(status);
        }
        if (config !== undefined) {
            updateFields.push('config = ?');
            values.push(toJson(config));
        }
        if (last_sync !== undefined) {
            updateFields.push('last_sync = ?');
            values.push(last_sync);
        }
        if (sync_status !== undefined) {
            updateFields.push('sync_status = ?');
            values.push(sync_status);
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            values.push(notes);
        }
        if (created_by !== undefined) {
            updateFields.push('created_by = ?');
            values.push(created_by);
        }

        if (updateFields.length === 0) {
            throw new Error('No fields to update');
        }

        const query = `UPDATE integrations SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        values.push(id);

        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) {
            throw new Error('Integration not found');
        }

        return this.getById(id);
    }

    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM integrations WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            throw new Error('Integration not found');
        }

        return { message: 'Integration deleted successfully' };
    }
}

module.exports = IntegrationModel;
