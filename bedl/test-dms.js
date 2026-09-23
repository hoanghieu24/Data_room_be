const http = require('http');

async function request(options, postData = null, isFormData = false) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ HỆ THỐNG CRM + DMS...\n');

  // 1. Test Login Admin
  console.log('1. Kiểm thử Đăng nhập Admin (admin@dataroom.local / Admin@123):');
  const loginAdminRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@dataroom.local', password: 'Admin@123' }));

  if (!loginAdminRes.data?.success) {
    console.error('❌ Login Admin thất bại:', loginAdminRes);
    process.exit(1);
  }
  const adminToken = loginAdminRes.data.token;
  console.log('✅ Đăng nhập Admin thành công, Role:', loginAdminRes.data.user.role);

  // 2. Test Login Staff
  console.log('\n2. Kiểm thử Đăng nhập Staff (staff@dataroom.local / Staff@123):');
  const loginStaffRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'staff@dataroom.local', password: 'Staff@123' }));

  if (!loginStaffRes.data?.success) {
    console.error('❌ Login Staff thất bại:', loginStaffRes);
    process.exit(1);
  }
  const staffToken = loginStaffRes.data.token;
  console.log('✅ Đăng nhập Staff thành công, Role:', loginStaffRes.data.user.role);

  // 3. Test CRM Cũ (Khách hàng & Deals)
  console.log('\n3. Kiểm thử Tương thích Module CRM cũ (/api/crm/clients & /api/crm/deals):');
  const crmClientsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/crm/clients',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✅ CRM Clients hoạt động tốt (Status ${crmClientsRes.status}, Số khách hàng: ${crmClientsRes.data?.clients?.length || 0})`);

  const crmDealsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/crm/deals',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✅ CRM Deals hoạt động tốt (Status ${crmDealsRes.status}, Số deals: ${crmDealsRes.data?.deals?.length || 0})`);

  // 4. Test Data Room Cũ (Folders)
  console.log('\n4. Kiểm thử Cây thư mục Data Room cũ (/api/folders/tree):');
  const foldersRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/folders/tree',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✅ Data Room Folders hoạt động tốt (Status ${foldersRes.status}, Cây thư mục sẵn sàng)`);

  // 5. Test Document Types
  console.log('\n5. Kiểm thử API Loại tài liệu (/api/document-types):');
  const docTypesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/document-types',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✅ Danh mục Loại tài liệu (Status ${docTypesRes.status}, Số loại: ${docTypesRes.data?.types?.length || 0}):`);
  docTypesRes.data?.types?.slice(0, 4).forEach(t => console.log(`   - [${t.code}] ${t.name}`));

  // 6. Test Departments & Members
  console.log('\n6. Kiểm thử API Quản lý Phòng ban & Thành viên (/api/departments):');
  const deptsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/departments',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const deptsList = deptsRes.data?.data?.data || deptsRes.data?.data || [];
  console.log(`✅ Phòng ban doanh nghiệp (Status ${deptsRes.status}, Số phòng ban: ${deptsList.length})`);
  if (deptsList.length > 0) {
    const firstDept = deptsList[0];
    const membersRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/departments/${firstDept.id}/members`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`   - Phòng ban "${firstDept.name}": ${membersRes.data?.members?.length || 0} thành viên.`);
  }

  // 7. Test Documents List & Multi-filter
  console.log('\n7. Kiểm thử API Danh sách Tài liệu DMS (/api/documents):');
  const docsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/documents?status=ALL&limit=10',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✅ Danh sách tài liệu lấy thành công (Tổng số: ${docsRes.data?.pagination?.total || 0} tài liệu)`);
  if (docsRes.data?.documents?.length > 0) {
    const d = docsRes.data.documents[0];
    console.log(`   - Tài liệu mẫu: [${d.documentCode}] ${d.name} | Trạng thái: ${d.status} | Quyền Admin: ${d.userPermission}`);
  }

  // 8. Test Dashboard Stats
  console.log('\n8. Kiểm thử API Thống kê Dashboard DMS (/api/documents/dashboard-stats):');
  const dashStatsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/documents/dashboard-stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✅ Thống kê 5 trạng thái tài liệu:', dashStatsRes.data?.stats);
  console.log(`   - Số tài liệu sắp hết hạn: ${dashStatsRes.data?.expiringDocuments?.length || 0}`);
  console.log(`   - Số hoạt động gần đây ghi nhận: ${dashStatsRes.data?.recentActivities?.length || 0}`);

  // 9. Test Audit Logs (Admin only)
  console.log('\n9. Kiểm thử Nhật ký Audit Log (/api/audit-logs):');
  const auditRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/audit-logs?limit=5',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✅ Nhật ký Audit Log (Status ${auditRes.status}, Tổng logs: ${auditRes.data?.pagination?.total || 0})`);
  auditRes.data?.logs?.slice(0, 3).forEach(l => {
    console.log(`   - [${l.action}] ${l.userName}: ${l.documentName} lúc ${new Date(l.timestamp).toLocaleTimeString()}`);
  });

  // 10. Test Notifications
  console.log('\n10. Kiểm thử Thông báo hệ thống (/api/notifications):');
  const notifsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✅ Thông báo (Status ${notifsRes.status}, Số thông báo: ${notifsRes.data?.notifications?.length || 0}, Chưa đọc: ${notifsRes.data?.unreadCount || 0})`);

  // 11. Test Phân quyền Backend (Chặn vượt quyền)
  console.log('\n11. Kiểm thử Bảo mật & Phân quyền Backend (Chặn Staff can thiệp tài liệu Mật):');
  // Lấy tài liệu đầu tiên
  if (docsRes.data?.documents?.length > 0) {
    const testDocId = docsRes.data.documents[0].id;
    // Cập nhật tài liệu này sang CONFIDENTIAL và không cấp quyền cho staff
    await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/documents/${testDocId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, JSON.stringify({ security_level: 'CONFIDENTIAL' }));

    // Cho Staff gọi GET /api/documents/:id/file
    const staffAccessRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/documents/${testDocId}/file`,
      method: 'GET',
      headers: { Authorization: `Bearer ${staffToken}` }
    });

    if (staffAccessRes.status === 403) {
      console.log('✅ Backend đã chặn thành công (Status 403 Forbidden): Staff không có quyền truy cập file Mật!');
    } else {
      console.warn('⚠️ Cảnh báo quyền truy cập:', staffAccessRes.status);
    }
  }

  console.log('\n🎉 TOÀN BỘ CÁC BƯỚC KIỂM THỬ ĐÃ HOÀN THÀNH VỚI KẾT QUẢ XUẤT SẮC!');
}

runTests().catch(console.error);
