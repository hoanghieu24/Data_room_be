const db = require('../../db');

const toJson = (value) => {
    if (value === undefined || value === null) {
        return null;
    }
    return typeof value === 'object' ? JSON.stringify(value) : value;
};

class ReportRunModel {
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM report_runs ORDER BY started_at DESC'
        );
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.query(
            'SELECT * FROM report_runs WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async create(data) {
        const {
            report_template_id,
            run_by,
            filters,
            parameters,
            result_count,
            status,
            error_message,
            result_path,
            completed_at
        } = data;

        const [result] = await db.query(
            `INSERT INTO report_runs (
                report_template_id,
                run_by,
                filters,
                parameters,
                result_count,
                status,
                error_message,
                result_path,
                completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                report_template_id,
                run_by,
                toJson(filters),
                toJson(parameters),
                result_count || 0,
                status || 'running',
                error_message || null,
                result_path || null,
                completed_at || null
            ]
        );

        return this.getById(result.insertId);
    }

    static async update(id, data) {
        const {
            report_template_id,
            run_by,
            filters,
            parameters,
            result_count,
            status,
            error_message,
            result_path,
            completed_at
        } = data;

        const updateFields = [];
        const values = [];

        if (report_template_id !== undefined) {
            updateFields.push('report_template_id = ?');
            values.push(report_template_id);
        }
        if (run_by !== undefined) {
            updateFields.push('run_by = ?');
            values.push(run_by);
        }
        if (filters !== undefined) {
            updateFields.push('filters = ?');
            values.push(toJson(filters));
        }
        if (parameters !== undefined) {
            updateFields.push('parameters = ?');
            values.push(toJson(parameters));
        }
        if (result_count !== undefined) {
            updateFields.push('result_count = ?');
            values.push(result_count);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            values.push(status);
        }
        if (error_message !== undefined) {
            updateFields.push('error_message = ?');
            values.push(error_message);
        }
        if (result_path !== undefined) {
            updateFields.push('result_path = ?');
            values.push(result_path);
        }
        if (completed_at !== undefined) {
            updateFields.push('completed_at = ?');
            values.push(completed_at);
        }

        if (updateFields.length === 0) {
            throw new Error('No fields to update');
        }

        const query = `UPDATE report_runs SET ${updateFields.join(', ')} WHERE id = ?`;
        values.push(id);

        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) {
            throw new Error('Report run not found');
        }

        return this.getById(id);
    }

    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM report_runs WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            throw new Error('Report run not found');
        }

        return { message: 'Report run deleted successfully' };
    }
}

module.exports = ReportRunModel;
