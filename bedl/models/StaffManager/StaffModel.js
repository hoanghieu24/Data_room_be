const db = require("../../db");

const parseJsonField = (value, defaultValue) => {
    if (value === null || value === undefined || value === "") {
        return defaultValue;
    }
    if (typeof value === "object") {
        return value;
    }
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch (error) {
            return defaultValue;
        }
    }
    return defaultValue;
};

/* ================== AUTO GENERATE EMPLOYEE CODE ================== */
const generateEmployeeCode = async () => {
    const [rows] = await db.query(
        "SELECT employee_code FROM employee_management ORDER BY id DESC LIMIT 1"
    );

    if (rows.length === 0 || !rows[0].employee_code) {
        return "EMP001";
    }

    const lastCode = rows[0].employee_code;
    // Hỗ trợ nhiều định dạng mã: EMP001, HRM001, KTS001, v.v.
    const match = lastCode.match(/([A-Z]+)(\d+)/);
    if (match) {
        const prefix = match[1];
        const number = parseInt(match[2], 10) + 1;
        return `${prefix}${number.toString().padStart(3, "0")}`;
    }
    
    // Nếu không match được định dạng, dùng EMP + số
    const number = parseInt(lastCode.replace(/[^0-9]/g, ""), 10) + 1;
    return `EMP${number.toString().padStart(3, "0")}`;
};

class StaffModel {
    /* ================== GET ALL STAFF ================== */
    static async getAllStaff() {
        const [rows] = await db.query(`
            SELECT 
                em.*,
                d.name AS department_name,
                d.code AS department_code,
                p.name AS position_name,
                p.code AS position_code,
                CONCAT(manager.full_name) AS manager_name
            FROM employee_management em
            LEFT JOIN departments d ON em.department_id = d.id
            LEFT JOIN positions p ON em.position_id = p.id
            LEFT JOIN employee_management manager ON em.manager_id = manager.id
            ORDER BY em.id DESC
        `);
        
        // Parse JSON fields
        return rows.map(row => ({
            ...row,
            allowance: parseJsonField(row.allowance, {}),
            working_hours: parseJsonField(row.working_hours, { start: "08:00", end: "17:00" })
        }));
    }

    /* ================== GET STAFF BY ID ================== */
    static async getStaffById(id) {
        const [rows] = await db.query(`
            SELECT 
                em.*,
                d.name AS department_name,
                d.code AS department_code,
                p.name AS position_name,
                p.code AS position_code,
                CONCAT(manager.full_name) AS manager_name,
                u.username,
                u.email AS user_email
            FROM employee_management em
            LEFT JOIN departments d ON em.department_id = d.id
            LEFT JOIN positions p ON em.position_id = p.id
            LEFT JOIN employee_management manager ON em.manager_id = manager.id
            LEFT JOIN users u ON em.employee_id = u.id
            WHERE em.id = ?
        `, [id]);
        
        if (rows.length === 0) return null;
        
        const staff = rows[0];
        return {
            ...staff,
            allowance: parseJsonField(staff.allowance, {}),
            working_hours: parseJsonField(staff.working_hours, { start: "08:00", end: "17:00" })
        };
    }

    /* ================== GET STAFF BY EMPLOYEE CODE ================== */
    static async getStaffByCode(employeeCode) {
        const [rows] = await db.query(`
            SELECT 
                em.*,
                d.name AS department_name,
                p.name AS position_name
            FROM employee_management em
            LEFT JOIN departments d ON em.department_id = d.id
            LEFT JOIN positions p ON em.position_id = p.id
            WHERE em.employee_code = ?
        `, [employeeCode]);
        
        if (rows.length === 0) return null;
        
        const staff = rows[0];
        return {
            ...staff,
            allowance: parseJsonField(staff.allowance, {}),
            working_hours: parseJsonField(staff.working_hours, { start: "08:00", end: "17:00" })
        };
    }

    /* ================== CREATE STAFF ================== */
    static async createStaff(dto) {
        // Auto generate employee code if not provided
        const employeeCode = dto.employeeCode || await generateEmployeeCode();

        const sql = `
            INSERT INTO employee_management (
                employee_id, 
                employee_code, 
                full_name, 
                email,
                phone,
                position_id, 
                job_title, 
                department_id, 
                manager_id,
                contract_type, 
                contract_number, 
                contract_start_date, 
                contract_end_date,
                salary_grade, 
                basic_salary, 
                allowance, 
                bank_account, 
                bank_name,
                work_location, 
                working_hours,
                probation_period, 
                probation_end_date, 
                official_start_date,
                last_promotion_date,
                next_review_date,
                employment_status,
                is_active,
                exit_date,
                exit_reason,
                emergency_contact_name, 
                emergency_contact_phone, 
                emergency_contact_relation,
                hr_notes,
                performance_notes,
                created_by,
                updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            dto.employeeId || null,
            employeeCode,
            dto.fullName,
            dto.email || null,
            dto.phone || null,
            dto.positionId,
            dto.jobTitle || null,
            dto.departmentId || null,
            dto.managerId || null,
            dto.contractType || null,
            dto.contractNumber || null,
            dto.contractStartDate || null,
            dto.contractEndDate || null,
            dto.salaryGrade || null,
            dto.basicSalary || null,
            dto.allowance ? JSON.stringify(dto.allowance) : '{}',
            dto.bankAccount || null,
            dto.bankName || null,
            dto.workLocation || null,
            dto.workingHours ? JSON.stringify(dto.workingHours) : JSON.stringify({ start: "08:00", end: "17:00" }),
            dto.probationPeriod || null,
            dto.probationEndDate || null,
            dto.officialStartDate || null,
            dto.lastPromotionDate || null,
            dto.nextReviewDate || null,
            dto.employmentStatus || 'Đang làm việc',
            dto.is_active !== undefined ? dto.is_active : 1,
            dto.exitDate || null,
            dto.exitReason || null,
            dto.emergencyContactName || null,
            dto.emergencyContactPhone || null,
            dto.emergencyContactRelation || null,
            dto.hrNotes || null,
            dto.performanceNotes || null,
            dto.createdBy || null,
            dto.updatedBy || null
        ];

        const [result] = await db.query(sql, params);
        
        return {
            id: result.insertId,
            employee_code: employeeCode
        };
    }

    /* ================== UPDATE STAFF ================== */
    static async updateStaff(id, dto) {
        const [result] = await db.query(
            `
            UPDATE employee_management SET
                employee_id = ?,
                full_name = ?,
                email = ?,
                phone = ?,
                position_id = ?,
                job_title = ?,
                department_id = ?,
                manager_id = ?,
                contract_type = ?,
                contract_number = ?,
                contract_start_date = ?,
                contract_end_date = ?,
                salary_grade = ?,
                basic_salary = ?,
                allowance = ?,
                bank_account = ?,
                bank_name = ?,
                work_location = ?,
                working_hours = ?,
                probation_period = ?,
                probation_end_date = ?,
                official_start_date = ?,
                last_promotion_date = ?,
                next_review_date = ?,
                employment_status = ?,
                is_active = ?,
                exit_date = ?,
                exit_reason = ?,
                emergency_contact_name = ?,
                emergency_contact_phone = ?,
                emergency_contact_relation = ?,
                hr_notes = ?,
                performance_notes = ?,
                updated_by = ?
            WHERE id = ?
            `,
            [
                dto.employeeId || null,
                dto.fullName,
                dto.email || null,
                dto.phone || null,
                dto.positionId,
                dto.jobTitle || null,
                dto.departmentId || null,
                dto.managerId || null,
                dto.contractType || null,
                dto.contractNumber || null,
                dto.contractStartDate || null,
                dto.contractEndDate || null,
                dto.salaryGrade || null,
                dto.basicSalary || null,
                dto.allowance ? JSON.stringify(dto.allowance) : '{}',
                dto.bankAccount || null,
                dto.bankName || null,
                dto.workLocation || null,
                dto.workingHours ? JSON.stringify(dto.workingHours) : JSON.stringify({ start: "08:00", end: "17:00" }),
                dto.probationPeriod || null,
                dto.probationEndDate || null,
                dto.officialStartDate || null,
                dto.lastPromotionDate || null,
                dto.nextReviewDate || null,
                dto.employmentStatus || 'Đang làm việc',
                dto.is_active !== undefined ? dto.is_active : 1,
                dto.exitDate || null,
                dto.exitReason || null,
                dto.emergencyContactName || null,
                dto.emergencyContactPhone || null,
                dto.emergencyContactRelation || null,
                dto.hrNotes || null,
                dto.performanceNotes || null,
                dto.updatedBy || null,
                id
            ]
        );

        return result.affectedRows > 0;
    }

    /* ================== DELETE STAFF ================== */
    static async deleteStaff(id) {
        const [result] = await db.query(
            "DELETE FROM employee_management WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }

    /* ================== DELETE MULTIPLE STAFF ================== */
    static async deleteStaffs(ids) {
        if (!ids || ids.length === 0) return false;
        const [result] = await db.query(
            "DELETE FROM employee_management WHERE id IN (?)",
            [ids]
        );
        return result.affectedRows > 0;
    }

    /* ================== TOGGLE STAFF STATUS ================== */
    static async toggleStaffStatus(id, isActive) {
        const [result] = await db.query(
            "UPDATE employee_management SET is_active = ? WHERE id = ?",
            [isActive, id]
        );
        return result.affectedRows > 0;
    }

    /* ================== UPDATE STAFF EMPLOYMENT STATUS ================== */
    static async updateEmploymentStatus(id, status, exitDate = null, exitReason = null) {
        const [result] = await db.query(
            "UPDATE employee_management SET employment_status = ?, exit_date = ?, exit_reason = ? WHERE id = ?",
            [status, exitDate, exitReason, id]
        );
        return result.affectedRows > 0;
    }

    /* ================== GET STAFF BY DEPARTMENT ================== */
    static async getStaffByDepartment(departmentId) {
        const [rows] = await db.query(`
            SELECT 
                em.*,
                p.name AS position_name
            FROM employee_management em
            LEFT JOIN positions p ON em.position_id = p.id
            WHERE em.department_id = ? AND em.is_active = 1
            ORDER BY em.full_name
        `, [departmentId]);
        
        return rows.map(row => ({
            ...row,
            allowance: parseJsonField(row.allowance, {}),
            working_hours: parseJsonField(row.working_hours, { start: "08:00", end: "17:00" })
        }));
    }

    /* ================== GET STAFF BY POSITION ================== */
    static async getStaffByPosition(positionId) {
        const [rows] = await db.query(`
            SELECT 
                em.*,
                d.name AS department_name
            FROM employee_management em
            LEFT JOIN departments d ON em.department_id = d.id
            WHERE em.position_id = ? AND em.is_active = 1
            ORDER BY em.full_name
        `, [positionId]);
        
        return rows.map(row => ({
            ...row,
            allowance: parseJsonField(row.allowance, {}),
            working_hours: parseJsonField(row.working_hours, { start: "08:00", end: "17:00" })
        }));
    }

    /* ================== SEARCH STAFF ================== */
    static async searchStaff(keyword) {
        const searchTerm = `%${keyword}%`;
        const [rows] = await db.query(`
            SELECT 
                em.*,
                d.name AS department_name,
                p.name AS position_name
            FROM employee_management em
            LEFT JOIN departments d ON em.department_id = d.id
            LEFT JOIN positions p ON em.position_id = p.id
            WHERE em.full_name LIKE ? 
               OR em.email LIKE ?
               OR em.employee_code LIKE ?
               OR em.phone LIKE ?
            ORDER BY em.full_name
        `, [searchTerm, searchTerm, searchTerm, searchTerm]);
        
        return rows.map(row => ({
            ...row,
            allowance: parseJsonField(row.allowance, {}),
            working_hours: parseJsonField(row.working_hours, { start: "08:00", end: "17:00" })
        }));
    }

    /* ================== GET STAFF STATISTICS ================== */
    static async getStaffStatistics() {
        const [result] = await db.query(`
            SELECT 
                COUNT(*) AS total_staff,
                COUNT(CASE WHEN is_active = 1 THEN 1 END) AS active_staff,
                COUNT(CASE WHEN is_active = 0 THEN 1 END) AS inactive_staff,
                COUNT(CASE WHEN employment_status = 'Đang làm việc' THEN 1 END) AS working,
                COUNT(CASE WHEN employment_status = 'Nghỉ việc' THEN 1 END) AS resigned,
                COUNT(CASE WHEN employment_status = 'Nghỉ phép' THEN 1 END) AS on_leave,
                COUNT(DISTINCT department_id) AS departments_with_staff
            FROM employee_management
        `);
        
        return result[0];
    }

    /* ================== GET STAFF BY MANAGER ================== */
    static async getStaffByManager(managerId) {
        const [rows] = await db.query(`
            SELECT 
                em.*,
                d.name AS department_name,
                p.name AS position_name
            FROM employee_management em
            LEFT JOIN departments d ON em.department_id = d.id
            LEFT JOIN positions p ON em.position_id = p.id
            WHERE em.manager_id = ? AND em.is_active = 1
            ORDER BY em.full_name
        `, [managerId]);
        
        return rows.map(row => ({
            ...row,
            allowance: parseJsonField(row.allowance, {}),
            working_hours: parseJsonField(row.working_hours, { start: "08:00", end: "17:00" })
        }));
    }

    /* ================== CHECK EMPLOYEE CODE EXISTS ================== */
    static async checkEmployeeCodeExists(employeeCode) {
        const [rows] = await db.query(
            "SELECT id FROM employee_management WHERE employee_code = ?",
            [employeeCode]
        );
        return rows.length > 0;
    }

    /* ================== UPDATE STAFF PROBATION ================== */
    static async updateProbation(id, probationPeriod, probationEndDate, officialStartDate) {
        const [result] = await db.query(
            `UPDATE employee_management 
             SET probation_period = ?, 
                 probation_end_date = ?, 
                 official_start_date = ?,
                 employment_status = 'Đang làm việc'
             WHERE id = ?`,
            [probationPeriod, probationEndDate, officialStartDate, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = StaffModel;