class StaffUpdateDTO {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.employeeId = data.employeeId ?? data.employee_id ?? null;
    this.fullName = data.fullName ?? data.full_name ?? null;
    this.email = data.email ?? null;
    this.phone = data.phone ?? null;
    this.gender = data.gender ?? null;
    this.dateOfBirth = data.dateOfBirth ?? data.date_of_birth ?? null;
    this.address = data.address ?? null;
    this.positionId = data.positionId ?? data.position_id ?? null;
    this.departmentId = data.departmentId ?? data.department_id ?? null;
    this.salary = data.salary ?? null;
    this.workingHours = data.workingHours ?? data.working_hours ?? null;
    this.status = data.status ?? 1;
    this.updatedBy = data.updatedBy ?? data.updated_by ?? null;
  }
}

module.exports = StaffUpdateDTO;
