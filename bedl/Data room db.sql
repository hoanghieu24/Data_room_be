-- ============================================
-- CRM & DATA ROOM DATABASE
-- Version: 1.0 (Formatted)
-- Created: 2026-01-02
-- ============================================

-- Tạo database
CREATE DATABASE IF NOT EXISTS crm_data_room;
USE crm_data_room;

-- ============================================
-- 1. NGƯỜI DÙNG & PHÂN QUYỀN
-- ============================================

-- Bảng vai trò
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng người dùng
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    department_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20),
    last_login TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Bảng phân quyền người dùng
CREATE TABLE user_role (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Bảng reset mật khẩu
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Bảng chức danh
CREATE TABLE positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Mã chức danh',
    name VARCHAR(100) NOT NULL COMMENT 'Tên chức danh',
    description TEXT,
    level INT DEFAULT 1 COMMENT 'Cấp độ (1 cao nhất)',
    parent_id INT NULL,
    base_salary DECIMAL(15,2),
    allowance JSON,
    department_id INT,
    is_manager BOOLEAN DEFAULT FALSE,
    team_size_limit INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_positions_parent FOREIGN KEY (parent_id) REFERENCES positions(id),
    CONSTRAINT fk_positions_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Bảng phòng ban
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng quản lý nhân viên
CREATE TABLE employee_management (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    position_id INT NOT NULL,
    job_title VARCHAR(100),
    department_id INT,
    manager_id INT NULL,
    contract_type VARCHAR(50),
    contract_number VARCHAR(100),
    contract_start_date DATE,
    contract_end_date DATE,
    salary_grade VARCHAR(20),
    basic_salary DECIMAL(15,2),
    allowance JSON,
    bank_account VARCHAR(100),
    bank_name VARCHAR(100),
    work_location VARCHAR(200),
    working_hours JSON,
    probation_period INT,
    probation_end_date DATE,
    official_start_date DATE,
    last_promotion_date DATE,
    next_review_date DATE,
    employment_status VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    exit_date DATE,
    exit_reason TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    hr_notes TEXT,
    performance_notes TEXT,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_management_position FOREIGN KEY (position_id) REFERENCES positions(id),
    CONSTRAINT fk_employee_management_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Bảng lịch sử chức danh
CREATE TABLE position_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    from_position_id INT,
    to_position_id INT NOT NULL,
    effective_date DATE NOT NULL,
    change_type VARCHAR(50),
    previous_salary DECIMAL(15,2),
    new_salary DECIMAL(15,2),
    reason TEXT,
    notes TEXT,
    approved_by INT,
    approved_date DATE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_position_history_employee FOREIGN KEY (employee_id) REFERENCES users(id),
    CONSTRAINT fk_position_history_from_position FOREIGN KEY (from_position_id) REFERENCES positions(id),
    CONSTRAINT fk_position_history_to_position FOREIGN KEY (to_position_id) REFERENCES positions(id),
    CONSTRAINT fk_position_history_approver FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT fk_position_history_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- 2. DANH MỤC
-- ============================================

CREATE TABLE category_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_type_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_type_id) REFERENCES category_types(id),
    UNIQUE (code, category_type_id)
);

CREATE INDEX idx_categories_type_active ON categories(category_type_id, is_active);

-- ============================================
-- 3. CRM - KHÁCH HÀNG & CƠ HỘI
-- ============================================

CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(255),
    customer_type_id INT,
    status_id INT,
    source_id INT,
    industry VARCHAR(100),
    tax_code VARCHAR(100),
    website VARCHAR(200),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    assigned_to INT,
    credit_limit DECIMAL(15,2),
    payment_term INT,
    note TEXT,
    tags JSON,
    is_vip BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_type_id) REFERENCES categories(id),
    FOREIGN KEY (status_id) REFERENCES categories(id),
    FOREIGN KEY (source_id) REFERENCES categories(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE opportunities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    opportunity_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    customer_id INT NOT NULL,
    stage_id INT NOT NULL,
    expected_value DECIMAL(15,2),
    probability DECIMAL(5,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'VND',
    expected_close_date DATE,
    actual_close_date DATE,
    priority VARCHAR(20),
    assigned_to INT NOT NULL,
    campaign_id INT,
    source_id INT,
    notes TEXT,
    next_step TEXT,
    loss_reason TEXT,
    metadata JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_opportunity_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_opportunity_stage FOREIGN KEY (stage_id) REFERENCES categories(id),
    CONSTRAINT fk_opportunity_assigned FOREIGN KEY (assigned_to) REFERENCES users(id),
    CONSTRAINT fk_opportunity_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE opportunity_stage_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    opportunity_id INT NOT NULL,
    from_stage_id INT,
    to_stage_id INT NOT NULL,
    changed_by INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hist_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    CONSTRAINT fk_hist_from_stage FOREIGN KEY (from_stage_id) REFERENCES categories(id),
    CONSTRAINT fk_hist_to_stage FOREIGN KEY (to_stage_id) REFERENCES categories(id),
    CONSTRAINT fk_hist_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- ============================================
-- 4. TƯƠNG TÁC & CÔNG VIỆC
-- ============================================

CREATE TABLE interaction_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    interaction_code VARCHAR(50) UNIQUE NOT NULL,
    interaction_type_id INT NOT NULL,
    customer_id INT NOT NULL,
    opportunity_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    interaction_date DATETIME,
    duration INT,
    location VARCHAR(255),
    participants TEXT,
    outcome TEXT,
    next_action TEXT,
    next_action_date DATE,
    is_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    attachments JSON,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_interaction_type FOREIGN KEY (interaction_type_id) REFERENCES interaction_types(id),
    CONSTRAINT fk_interaction_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_interaction_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    CONSTRAINT fk_interaction_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type_id INT,
    priority_id INT,
    status_id INT,
    assigned_to INT NOT NULL,
    assigned_by INT,
    customer_id INT,
    opportunity_id INT,
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    completion_percentage INT DEFAULT 0,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    is_reminder BOOLEAN DEFAULT FALSE,
    reminder_date DATETIME,
    tags JSON,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INT,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_tasks_task_type FOREIGN KEY (task_type_id) REFERENCES categories(id),
    CONSTRAINT fk_tasks_priority FOREIGN KEY (priority_id) REFERENCES categories(id),
    CONSTRAINT fk_tasks_status FOREIGN KEY (status_id) REFERENCES categories(id),
    CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES employee_management(id),
    CONSTRAINT fk_tasks_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id),
    CONSTRAINT fk_tasks_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_tasks_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_tasks_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- ============================================
-- 5. HỢP ĐỒNG & THANH TOÁN
-- ============================================

CREATE TABLE contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contract_number VARCHAR(50) NOT NULL UNIQUE,
    contract_name VARCHAR(200) NOT NULL,
    customer_id INT NOT NULL,
    opportunity_id INT NULL,
    contract_type VARCHAR(50),
    status_id INT,
    start_date DATE,
    end_date DATE,
    sign_date DATE,
    value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    payment_term INT,
    payment_method VARCHAR(50),
    tax_rate DECIMAL(5,2),
    total_amount DECIMAL(15,2),
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2),
    renewal_date DATE,
    renewal_reminder_date DATE,
    terms_and_conditions TEXT,
    notes TEXT,
    document_path VARCHAR(500),
    signed_by VARCHAR(100),
    signed_position VARCHAR(100),
    created_by INT,
    approved_by INT,
    approved_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contract_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_contract_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    CONSTRAINT fk_contract_status FOREIGN KEY (status_id) REFERENCES categories(id),
    CONSTRAINT fk_contract_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_contract_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_code VARCHAR(50) NOT NULL UNIQUE,
    contract_id INT NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Số tiền đã thanh toán',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    receipt_path VARCHAR(500),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
    CONSTRAINT fk_payment_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- 6. DATA ROOM - TÀI LIỆU
-- ============================================

CREATE TABLE folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folder_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_id INT,
    path VARCHAR(500),
    access_level VARCHAR(20) DEFAULT 'private',
    allowed_roles JSON,
    allowed_users JSON,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_folders_parent FOREIGN KEY (parent_id) REFERENCES folders(id),
    CONSTRAINT fk_folders_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_code VARCHAR(50) NOT NULL UNIQUE,
    folder_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    mime_type VARCHAR(100),
    version INT DEFAULT 1,
    access_level VARCHAR(20) DEFAULT 'private',
    allowed_roles JSON,
    allowed_users JSON,
    metadata JSON,
    tags JSON,
    is_encrypted BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_documents_folder FOREIGN KEY (folder_id) REFERENCES folders(id),
    CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_deleted_at ON documents(deleted_at);

CREATE TABLE document_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_logs_document FOREIGN KEY (document_id) REFERENCES documents(id),
    CONSTRAINT fk_doc_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- 7. BÁO CÁO & THỐNG KÊ
-- ============================================

CREATE TABLE report_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    report_type VARCHAR(50),
    data_source VARCHAR(100),
    filters JSON,
    columns JSON,
    chart_config JSON,
    is_public BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE report_runs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_template_id INT,
    run_by INT,
    filters JSON,
    parameters JSON,
    result_count INT,
    status VARCHAR(20) DEFAULT 'running',
    error_message TEXT,
    result_path VARCHAR(500),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_report_runs_template FOREIGN KEY (report_template_id) REFERENCES report_templates(id),
    CONSTRAINT fk_report_runs_user FOREIGN KEY (run_by) REFERENCES users(id)
);

-- ============================================
-- 8. TÍCH HỢP & CẤU HÌNH
-- ============================================

CREATE TABLE integrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    integration_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'inactive',
    config JSON,
    last_sync TIMESTAMP NULL,
    sync_status VARCHAR(20),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_integrations_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50),
    category VARCHAR(50),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 9. DỮ LIỆU MẪU (INSERT)
-- ============================================

-- Roles
INSERT INTO roles (code, name) VALUES
('ADMIN', 'Quản trị hệ thống'),
('STAFF', 'Nhân viên'),
('CUSTOMER', 'Khách hàng');

-- Users
INSERT INTO users (username, email, password_hash, full_name, phone) VALUES
('admin01', 'admin@crm.com', '$2a$10$abcdefghijklmnopqrstuv', 'System Admin', '0900000001'),
('staff01', 'staff@crm.com', '$2a$10$abcdefghijklmnopqrstuv', 'Nguyễn Văn Staff', '0900000002'),
('customer01', 'customer@crm.com', '$2a$10$abcdefghijklmnopqrstuv', 'Trần Văn Customer', '0900000003');

-- User Role assignments
INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin01' AND r.code = 'ADMIN';

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'staff01' AND r.code = 'STAFF';

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'customer01' AND r.code = 'CUSTOMER';

-- Departments
INSERT INTO departments (code, name, description) VALUES
('BOARD', 'Ban điều hành', 'Hội đồng quản trị và ban giám đốc'),
('IT', 'Công nghệ thông tin', 'Phòng CNTT - Phát triển phần mềm'),
('HR', 'Nhân sự', 'Quản lý nhân sự và đào tạo'),
('FINANCE', 'Tài chính - Kế toán', 'Quản lý tài chính và kế toán'),
('SALES', 'Kinh doanh', 'Phát triển kinh doanh và bán hàng'),
('MARKETING', 'Marketing', 'Quảng bá và tiếp thị sản phẩm'),
('OPERATIONS', 'Vận hành', 'Quản lý vận hành hệ thống'),
('LEGAL', 'Pháp chế', 'Quản lý pháp lý và hợp đồng');

-- Positions
INSERT INTO positions (code, name, description, level, parent_id, base_salary, allowance, department_id, is_manager, team_size_limit, is_active, created_by) VALUES
('CHAIRMAN', 'Chủ tịch', 'Chức danh Chủ tịch công ty', 1, NULL, 60000000, '{"housing":12000000,"transport":6000000}', 1, TRUE, 10, TRUE, 1),
('HR_DIRECTOR', 'Giám đốc nhân sự', 'Chịu trách nhiệm toàn bộ nhân sự', 2, NULL, 45000000, '{"housing":8000000,"transport":4000000}', 3, TRUE, 5, TRUE, 1),
('TRAINING_DIRECTOR', 'Giám đốc đào tạo', 'Chịu trách nhiệm đào tạo nhân sự', 2, NULL, 42000000, '{"housing":7000000,"transport":3500000}', 3, TRUE, 5, TRUE, 1),
('STAFF_NEW', 'Nhân viên mới', 'Nhân viên thử việc', 4, NULL, 15000000, '{"transport":1000000}', 3, FALSE, NULL, TRUE, 1),
('STAFF_OFFICIAL', 'Nhân viên chính thức', 'Nhân viên chính thức', 4, NULL, 20000000, '{"transport":1500000}', 3, FALSE, NULL, TRUE, 1),
('CFO', 'Giám đốc tài chính', 'Chịu trách nhiệm quản lý tài chính công ty', 2, NULL, 45000000, '{"housing":8000000,"transport":4000000}', 4, TRUE, 5, TRUE, 1),
('ACCOUNTANT', 'Kế toán', 'Nhân viên kế toán', 3, NULL, 20000000, '{"transport":1000000}', 4, FALSE, NULL, TRUE, 1),
('LEGAL_DIRECTOR', 'Pháp lý', 'Chịu trách nhiệm các vấn đề pháp lý', 2, NULL, 42000000, '{"housing":7000000,"transport":3500000}', 5, TRUE, 5, TRUE, 1),
('COO', 'Giám đốc vận hành', 'Chịu trách nhiệm điều hành hoạt động công ty', 2, NULL, 45000000, '{"housing":8000000,"transport":4000000}', 6, TRUE, 5, TRUE, 1),
('CTO', 'Giám đốc công nghệ', 'Chịu trách nhiệm toàn bộ mảng công nghệ', 2, NULL, 45000000, '{"housing":8000000,"transport":4000000}', 2, TRUE, 5, TRUE, 1);

-- Employee Management
INSERT INTO employee_management (employee_id, employee_code, full_name, email, phone, position_id, job_title, department_id, manager_id, contract_type, contract_number, contract_start_date, contract_end_date, salary_grade, basic_salary, allowance, bank_account, bank_name, work_location, working_hours, probation_period, probation_end_date, official_start_date, last_promotion_date, next_review_date, employment_status, is_active, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, created_by, updated_by) VALUES
(NULL, 'HRM003', 'Ha Thi Quynh', 'quynh.ht@company.com', '0911222333', (SELECT id FROM positions WHERE code='COO'), 'Giám đốc vận hành', 3, NULL, 'Full-time', 'C003', '2024-05-01', '2024-07-31', 'B1', 15000000, '{"transport":1000000}', '323456789', 'Techcombank', 'Hà Nội', '{"start":"09:00","end":"17:00"}', 60, '2024-07-31', NULL, NULL, '2025-01-01', 'Đang làm việc', TRUE, 'Le Van B', '0911222333', 'Anh trai', 1, 1),
(NULL, 'HRM004', 'Phan Thi Mai', 'mai.pt@company.com', '0912333444', (SELECT id FROM positions WHERE code='ACCOUNTANT'), 'Kế toán', 3, NULL, 'Full-time', 'C004', '2024-01-01', NULL, 'B2', 20000000, '{"transport":1500000}', '423456789', 'Vietcombank', 'Hà Nội', '{"start":"08:00","end":"17:00"}', 0, NULL, '2024-02-01', '2024-08-01', '2025-02-01', 'Đang làm việc', TRUE, 'Tran Van D', '0912333444', 'Chị gái', 1, 1),
(NULL, 'HRM002', 'Hoàng Văn Ngọc', 'ngoc.hv@company.com', '0987654321', (SELECT id FROM positions WHERE code='CHAIRMAN'), 'Giám đốc', 3, NULL, 'Full-time', 'C002', '2024-02-01', NULL, 'A2', 45000000, '{"housing":8000000,"transport":4000000}', '223456789', 'Vietinbank', 'Hà Nội', '{"start":"08:30","end":"17:30"}', 0, NULL, '2024-03-01', '2024-08-01', '2025-03-01', 'Đang làm việc', TRUE, 'Nguyen Van F', '0987654321', 'Mẹ', 1, 1);

-- Position History
INSERT INTO position_history (employee_id, from_position_id, to_position_id, effective_date, change_type, previous_salary, new_salary, reason, notes, approved_by, created_by) VALUES
(3, (SELECT id FROM positions WHERE code='STAFF_NEW'), (SELECT id FROM positions WHERE code='STAFF_OFFICIAL'), '2024-08-01', 'Promotion', 15000000, 20000000, 'Hoàn tất thử việc', 'Thăng chức chính thức', 2, 2),
(2, (SELECT id FROM positions WHERE code='HR_DIRECTOR'), (SELECT id FROM positions WHERE code='CHAIRMAN'), '2025-01-01', 'Promotion', 45000000, 60000000, 'Thăng chức do nghỉ Chủ tịch cũ', 'Thăng chức đột xuất', 1, 1);

-- Category Types
INSERT INTO category_types (code, name, description) VALUES
('customer_type', 'Loại khách hàng', 'Lead / Prospect / Customer'),
('pipeline_stage', 'Giai đoạn pipeline', 'New / Contacted / Won / Lost'),
('customer_status', 'Trạng thái khách hàng', 'Active / Inactive'),
('lead_source', 'Nguồn khách hàng', 'Facebook / Website / Referral'),
('opportunity_priority', 'Độ ưu tiên cơ hội', 'High / Medium / Low');

-- Categories
INSERT INTO categories (code, name, category_type_id) VALUES
('lead', 'Lead', (SELECT id FROM category_types WHERE code='customer_type')),
('prospect', 'Prospect', (SELECT id FROM category_types WHERE code='customer_type')),
('customer', 'Khách hàng', (SELECT id FROM category_types WHERE code='customer_type')),
('new', 'Lead mới', (SELECT id FROM category_types WHERE code='pipeline_stage')),
('contacted', 'Đã liên hệ', (SELECT id FROM category_types WHERE code='pipeline_stage')),
('proposal', 'Báo giá', (SELECT id FROM category_types WHERE code='pipeline_stage')),
('won', 'Thành công', (SELECT id FROM category_types WHERE code='pipeline_stage')),
('lost', 'Thất bại', (SELECT id FROM category_types WHERE code='pipeline_stage')),
('active', 'Đang hoạt động', (SELECT id FROM category_types WHERE code='customer_status')),
('inactive', 'Ngừng hoạt động', (SELECT id FROM category_types WHERE code='customer_status')),
('facebook', 'Facebook', (SELECT id FROM category_types WHERE code='lead_source')),
('website', 'Website', (SELECT id FROM category_types WHERE code='lead_source')),
('referral', 'Giới thiệu', (SELECT id FROM category_types WHERE code='lead_source')),
('high', 'Cao', (SELECT id FROM category_types WHERE code='opportunity_priority')),
('medium', 'Trung bình', (SELECT id FROM category_types WHERE code='opportunity_priority')),
('low', 'Thấp', (SELECT id FROM category_types WHERE code='opportunity_priority'));

-- Customers
INSERT INTO customers (customer_code, name, short_name, customer_type_id, status_id, source_id, industry, email, phone, city, country, assigned_to, credit_limit, created_by) VALUES
('CUST001', 'Công ty ABC', 'ABC Corp', 1, 6, 8, 'Công nghệ', 'contact@abc.com', '0909123456', 'Hà Nội', 'Việt Nam', 2, 500000000, 1);

-- Opportunities
INSERT INTO opportunities (opportunity_code, name, customer_id, stage_id, expected_value, probability, expected_close_date, priority, assigned_to, source_id, notes, created_by) VALUES
('OPP001', 'Triển khai hệ thống CRM', 1, 4, 200000000, 10.00, '2024-12-31', 'high', 2, 8, 'Khách quan tâm mạnh', 2);

-- Opportunity Stage History
INSERT INTO opportunity_stage_history (opportunity_id, from_stage_id, to_stage_id, changed_by, notes) VALUES
(1, NULL, 4, 2, 'Khởi tạo cơ hội mới'),
(1, 4, 5, 2, 'Đã gọi điện trao đổi lần đầu'),
(1, 5, 6, 2, 'Gửi báo giá cho khách'),
(1, 6, 8, 1, 'Khách không đủ ngân sách');

UPDATE opportunities SET stage_id = 8 WHERE id = 1;

-- Interaction Types
INSERT INTO interaction_types (code, name) VALUES
('call', 'Gọi điện'),
('meeting', 'Gặp trực tiếp'),
('email', 'Email'),
('chat', 'Chat');

-- Interactions
INSERT INTO interactions (interaction_code, interaction_type_id, customer_id, opportunity_id, title, description, interaction_date, duration, outcome, next_action, next_action_date, is_follow_up, created_by) VALUES
('INT001', 1, 1, 1, 'Gọi điện giới thiệu dịch vụ', 'Khách quan tâm, cần gửi báo giá', NOW(), 15, 'Khách phản hồi tích cực', 'Gửi báo giá', DATE_ADD(CURDATE(), INTERVAL 2 DAY), TRUE, 2);

-- Tasks
INSERT INTO tasks (task_code, title, description, task_type_id, priority_id, status_id, assigned_to, assigned_by, customer_id, opportunity_id, start_date, due_date, completion_percentage, estimated_hours, is_reminder, reminder_date, created_by) VALUES
('TASK-2025-001', 'Gọi điện tư vấn khách hàng', 'Liên hệ khách để tư vấn giải pháp CRM', 1, 1, 1, 2, 1, 1, 1, '2025-01-02', '2025-01-03', 100, 1.5, TRUE, '2025-01-02 09:00:00', 1),
('TASK-2025-002', 'Demo hệ thống CRM', 'Demo trực tiếp cho khách hàng', 1, 2, 1, 2, 1, 1, 1, '2025-01-05', '2025-01-10', 50, 3.0, TRUE, '2025-01-05 14:00:00', 1);

-- Contracts
INSERT INTO contracts (contract_number, contract_name, customer_id, opportunity_id, contract_type, status_id, start_date, end_date, sign_date, value, currency, payment_term, payment_method, tax_rate, total_amount, paid_amount, remaining_amount, signed_by, signed_position, created_by) VALUES
('HD-2025-001', 'Hợp đồng triển khai CRM', 1, 1, 'Triển khai phần mềm', 1, '2025-01-01', '2025-12-31', '2025-01-01', 100000000, 'VND', 30, 'Chuyển khoản', 10, 110000000, 0, 110000000, 'Nguyễn Văn A', 'Giám đốc', 1);

-- Payments
INSERT INTO payments (payment_code, contract_id, payment_date, due_date, amount, paid_amount, payment_method, transaction_id, status, notes, created_by) VALUES
('PAY-2025-001', 1, '2025-01-05', '2025-01-10', 33000000, 33000000, 'Chuyển khoản', 'MB-TRX-001', 'paid', 'Thanh toán đợt 1 - 30%', 2),
('PAY-2025-002', 1, '2025-04-01', '2025-04-05', 44000000, 44000000, 'Chuyển khoản', 'VCB-TRX-002', 'paid', 'Thanh toán đợt 2 - 40%', 2);

-- Folders
INSERT INTO folders (folder_code, name, description, parent_id, path, access_level, allowed_roles, created_by) VALUES
('ROOT', 'Data Room', 'Thư mục gốc', NULL, '/data-room', 'private', JSON_ARRAY('ADMIN'), 1),
('CUS_DOC', 'Tài liệu khách hàng', 'Tài liệu liên quan khách hàng', 1, '/data-room/customer', 'restricted', JSON_ARRAY('ADMIN','STAFF'), 1),
('CONTRACT_DOC', 'Hợp đồng', 'Lưu trữ hợp đồng', 1, '/data-room/contracts', 'restricted', JSON_ARRAY('ADMIN','STAFF'), 1),
('REPORT_DOC', 'Báo cáo', 'Báo cáo hệ thống', 1, '/data-room/reports', 'private', JSON_ARRAY('ADMIN'), 1);

-- Documents
INSERT INTO documents (document_code, folder_id, name, description, file_name, file_path, file_size, file_type, mime_type, version, access_level, allowed_roles, uploaded_by) VALUES
('DOC-CUS-001', 2, 'Danh sách khách hàng VIP', 'File tổng hợp khách hàng VIP', 'vip_customers.xlsx', '/storage/customer/vip_customers.xlsx', 204800, 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 1, 'restricted', JSON_ARRAY('ADMIN','STAFF'), 2),
('DOC-CON-001', 3, 'Hợp đồng KH A', 'Hợp đồng ký với khách hàng A', 'contract_A.pdf', '/storage/contracts/contract_A.pdf', 512000, 'pdf', 'application/pdf', 1, 'restricted', JSON_ARRAY('ADMIN'), 1),
('DOC-RPT-001', 4, 'Báo cáo doanh thu tháng 6', 'Doanh thu tháng 6/2024', 'revenue_june.pdf', '/storage/reports/revenue_june.pdf', 350000, 'pdf', 'application/pdf', 1, 'private', JSON_ARRAY('ADMIN'), 1);

-- Document Access Logs
INSERT INTO document_access_logs (document_id, user_id, action, ip_address, user_agent) VALUES
(1, 2, 'view', '192.168.1.10', 'Chrome / Windows'),
(1, 2, 'download', '192.168.1.10', 'Chrome / Windows'),
(2, 1, 'view', '192.168.1.1', 'Firefox / Linux'),
(3, 1, 'download', '192.168.1.1', 'Edge / Windows');

-- Report Templates
INSERT INTO report_templates (report_code, name, description, report_type, data_source, filters, columns, chart_config, is_public, created_by) VALUES
('RPT-SALES-001', 'Báo cáo pipeline bán hàng', 'Thống kê các cơ hội theo giai đoạn', 'pipeline', 'opportunities', JSON_OBJECT('is_active', true), JSON_ARRAY('stage','count','total_value'), JSON_OBJECT('type','bar'), FALSE, 1),
('RPT-CUS-001', 'Báo cáo khách hàng', 'Danh sách khách hàng theo trạng thái', 'customer', 'customers', JSON_OBJECT('status','active'), JSON_ARRAY('name','email','phone'), JSON_OBJECT('type','table'), TRUE, 1);

-- Report Runs
INSERT INTO report_runs (report_template_id, run_by, filters, parameters, result_count, status, result_path) VALUES
(1, 1, JSON_OBJECT('from_date','2024-06-01','to_date','2024-06-30'), JSON_OBJECT('currency','VND'), 12, 'completed', '/reports/output/pipeline_june.pdf'),
(2, 2, JSON_OBJECT('status','active'), NULL, 58, 'completed', '/reports/output/customers_active.xlsx');

-- System Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('MAX_UPLOAD_SIZE', '10485760', 'number', 'storage', 'Dung lượng upload tối đa (bytes)', TRUE),
('DEFAULT_CURRENCY', 'VND', 'string', 'finance', 'Tiền tệ mặc định', TRUE),
('DATA_ROOM_ENCRYPTION', 'true', 'boolean', 'security', 'Bật mã hóa tài liệu', FALSE),
('REPORT_RETENTION_DAYS', '365', 'number', 'report', 'Số ngày lưu báo cáo', FALSE);

-- Integrations
INSERT INTO integrations (integration_code, name, type, status, config, last_sync, sync_status, notes, created_by) VALUES
('FB_LEAD', 'Facebook Lead Ads', 'facebook', 'active', JSON_OBJECT('page_id', '123456789', 'access_token', 'FB_ACCESS_TOKEN_SAMPLE', 'sync_interval_minutes', 15), NOW(), 'success', 'Đồng bộ lead Facebook', 1),
('GOOGLE_CAL', 'Google Calendar', 'google', 'active', JSON_OBJECT('client_id', 'google-client-id', 'client_secret', 'google-secret', 'calendar_id', 'primary'), NULL, 'running', 'Đồng bộ lịch meeting', 1),
('ERP_WEBHOOK', 'ERP Webhook', 'webhook', 'inactive', JSON_OBJECT('endpoint', 'https://erp.example.com/webhook', 'method', 'POST', 'secret_key', 'ERP_SECRET'), NULL, 'inactive', NULL, 1);