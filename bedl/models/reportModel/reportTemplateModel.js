const db = require('../../db');

const toJson = (value) => {
    if (value === undefined || value === null) {
        return null;
    }
    return typeof value === 'object' ? JSON.stringify(value) : value;
};

class ReportTemplateModel {
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM report_templates ORDER BY created_at DESC'
        );
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.query(
            'SELECT * FROM report_templates WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async create(data) {
        const {
            report_code,
            name,
            description,
            report_type,
            data_source,
            filters,
            columns,
            chart_config,
            is_public,
            created_by
        } = data;

        const [result] = await db.query(
            `INSERT INTO report_templates (
                report_code,
                name,
                description,
                report_type,
                data_source,
                filters,
                columns,
                chart_config,
                is_public,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                report_code,
                name,
                description || null,
                report_type || null,
                data_source || null,
                toJson(filters),
                toJson(columns),
                toJson(chart_config),
                is_public ? 1 : 0,
                created_by || null
            ]
        );

        return this.getById(result.insertId);
    }

    static async update(id, data) {
        const {
            report_code,
            name,
            description,
            report_type,
            data_source,
            filters,
            columns,
            chart_config,
            is_public,
            created_by
        } = data;

        const updateFields = [];
        const values = [];

        if (report_code !== undefined) {
            updateFields.push('report_code = ?');
            values.push(report_code);
        }
        if (name !== undefined) {
            updateFields.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            values.push(description);
        }
        if (report_type !== undefined) {
            updateFields.push('report_type = ?');
            values.push(report_type);
        }
        if (data_source !== undefined) {
            updateFields.push('data_source = ?');
            values.push(data_source);
        }
        if (filters !== undefined) {
            updateFields.push('filters = ?');
            values.push(toJson(filters));
        }
        if (columns !== undefined) {
            updateFields.push('columns = ?');
            values.push(toJson(columns));
        }
        if (chart_config !== undefined) {
            updateFields.push('chart_config = ?');
            values.push(toJson(chart_config));
        }
        if (is_public !== undefined) {
            updateFields.push('is_public = ?');
            values.push(is_public ? 1 : 0);
        }
        if (created_by !== undefined) {
            updateFields.push('created_by = ?');
            values.push(created_by);
        }

        if (updateFields.length === 0) {
            throw new Error('No fields to update');
        }

        const query = `UPDATE report_templates SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        values.push(id);

        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) {
            throw new Error('Report template not found');
        }

        return this.getById(id);
    }

    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM report_templates WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            throw new Error('Report template not found');
        }

        return { message: 'Report template deleted successfully' };
    }
}

module.exports = ReportTemplateModel;
