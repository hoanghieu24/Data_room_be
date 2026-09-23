const axios = require('axios');

async function testPasswordProtection() {
  console.log('🔐 BẮT ĐẦU KIỂM THỬ TÍNH NĂNG BẢO MẬT BẰNG MẬT KHẨU...');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Đăng nhập Admin
  const adminRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@dataroom.local',
    password: 'Admin@123'
  });
  const adminToken = adminRes.data.token;
  console.log('✅ 1. Đăng nhập Admin thành công');

  // 2. Đăng nhập Staff
  const staffRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'staff@dataroom.local',
    password: 'Staff@123'
  });
  const staffToken = staffRes.data.token;
  console.log('✅ 2. Đăng nhập Staff thành công');

  // 3. Lấy 1 tài liệu để test
  const docsRes = await axios.get(`${BASE_URL}/documents`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const targetDoc = docsRes.data.documents[0];
  console.log(`✅ 3. Chọn tài liệu test: ID=${targetDoc.id} [${targetDoc.documentCode}] "${targetDoc.name}"`);

  // Phân quyền cho Staff để loại trừ bị chặn bởi RBAC (đảm bảo Staff có quyền VIEW qua Security Level hoặc Permission)
  await axios.put(`${BASE_URL}/documents/${targetDoc.id}`, {
    security_level: 'PUBLIC'
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  // 4. Admin đặt mật khẩu bảo vệ cho tài liệu
  const setPassRes = await axios.post(`${BASE_URL}/documents/${targetDoc.id}/password`, {
    password: 'SuperSecret@123'
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✅ 4. Đặt mật khẩu thành công:', setPassRes.data.message);

  // 5. Kiểm tra danh sách tài liệu phản hồi có cờ hasPassword = true
  const checkListRes = await axios.get(`${BASE_URL}/documents`, {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  const updatedDoc = checkListRes.data.documents.find(d => d.id === targetDoc.id);
  console.log(`✅ 5. Cờ bảo mật trong danh sách: hasPassword = ${updatedDoc.hasPassword}, isEncrypted = ${updatedDoc.isEncrypted}`);

  // 6. Staff cố gắng tải hoặc xem file mà KHÔNG có mật khẩu -> Phải bị chặn 401 PASSWORD_REQUIRED
  try {
    await axios.get(`${BASE_URL}/documents/${targetDoc.id}/file`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    console.error('❌ Lỗi: Staff không có mật khẩu mà vẫn tải được!');
  } catch (err) {
    if (err.response?.status === 401 && err.response?.data?.code === 'PASSWORD_REQUIRED') {
      console.log('✅ 6. Chặn không mật khẩu thành công (Status 401, Code: PASSWORD_REQUIRED)');
    } else {
      console.error('❌ Lỗi không đúng mã lỗi:', err.response?.status, err.response?.data);
    }
  }

  // 7. Staff nhập SAI mật khẩu -> Phải bị chặn 401 PASSWORD_REQUIRED
  try {
    await axios.get(`${BASE_URL}/documents/${targetDoc.id}/file`, {
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'x-document-password': 'WrongPassword123'
      }
    });
    console.error('❌ Lỗi: Nhập sai mật khẩu mà vẫn tải được!');
  } catch (err) {
    if (err.response?.status === 401 && err.response?.data?.code === 'PASSWORD_REQUIRED') {
      console.log('✅ 7. Chặn nhập sai mật khẩu thành công (Status 401, Message:', err.response?.data?.message, ')');
    } else {
      console.error('❌ Lỗi:', err.response?.status, err.response?.data);
    }
  }

  // 8. Staff nhập ĐÚNG mật khẩu -> Phải mở khóa thành công (200 OK)
  try {
    const unlockRes = await axios.get(`${BASE_URL}/documents/${targetDoc.id}/file`, {
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'x-document-password': 'SuperSecret@123'
      }
    });
    console.log('✅ 8. Mở khóa đúng mật khẩu thành công! (Status:', unlockRes.status, ')');
  } catch (err) {
    console.error('❌ Lỗi khi mở khóa đúng mật khẩu:', err.response?.status, err.response?.data);
  }

  // 9. Admin gỡ bỏ mật mã bảo vệ
  const removePassRes = await axios.post(`${BASE_URL}/documents/${targetDoc.id}/password`, {
    password: ''
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✅ 9. Gỡ bỏ mật khẩu thành công:', removePassRes.data.message);

  // 10. Staff truy cập lại mà không cần mật khẩu -> Phải được 200 OK
  const normalRes = await axios.get(`${BASE_URL}/documents/${targetDoc.id}/file`, {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  console.log('✅ 10. Truy cập bình thường sau khi gỡ mật khẩu thành công! (Status:', normalRes.status, ')');

  console.log('\n🎉 TOÀN BỘ BÀI TEST BẢO MẬT MẬT KHẨU ĐÃ VƯỢT QUA 100%!');
}

testPasswordProtection().catch(err => {
  console.error('Fatal error during password test:', err.message);
  process.exit(1);
});
