class StaffCreateDTO {
  constructor(data) {
    this.employeeCode = data.employeeCode || data.employee_code || null;
    this.employeeId = data.employeeId || data.employee_id || null;

    this.fullName = data.fullName || data.full_name; // 🔥 QUAN TRỌNG
this.email = data.email || null;
    this.positionId = data.positionId || data.position_id;
    this.jobTitle = data.jobTitle || data.job_title || null;
    this.departmentId = data.departmentId || data.department_id || null;
    this.managerId = data.managerId || data.manager_id || null;

    this.contractType = data.contractType || data.contract_type || null;
    this.contractNumber = data.contractNumber || data.contract_number || null;
    this.contractStartDate = data.contractStartDate || data.contract_start_date || null;
    this.contractEndDate = data.contractEndDate || data.contract_end_date || null;

    this.salaryGrade = data.salaryGrade || data.salary_grade || null;
    this.basicSalary = data.basicSalary || data.basic_salary || 0;
    this.allowance = data.allowance || {};
    this.bankAccount = data.bankAccount || data.bank_account || null;
    this.bankName = data.bankName || data.bank_name || null;

    this.workLocation = data.workLocation || data.work_location || null;
    this.workingHours = data.workingHours || data.working_hours || { start: "08:00", end: "17:00" };

    this.probationPeriod = data.probationPeriod || data.probation_period || null;
    this.probationEndDate = data.probationEndDate || data.probation_end_date || null;
    this.officialStartDate = data.officialStartDate || data.official_start_date || null;

    this.employmentStatus = data.employmentStatus || data.is_active || "WORKING";

    this.emergencyContactName =
      data.emergencyContactName || data.emergency_contact_name || null;

    this.emergencyContactPhone =
      data.emergencyContactPhone || data.emergency_contact_phone || null;

    this.emergencyContactRelation =
      data.emergencyContactRelation || data.emergency_contact_relation || null;

    this.hrNotes = data.hrNotes || data.hr_notes || null;

    this.createdBy = data.createdBy || null;

    this.email = data.email || null;
    this.phone = data.phone || null;

    // 🚨 VALIDATE BẮT BUỘC
    if (!this.fullName) {
      throw new Error("full_name is required");
    }
  }
}

module.exports = StaffCreateDTO;
