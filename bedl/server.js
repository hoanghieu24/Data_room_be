const express = require("express");
const dotenv = require("dotenv");
require("dotenv").config();
const authRoutes = require("./routes/Auth/auth");
const userRoutes = require("./routes/User/users");
const customer = require("./routes/Customer/customer");
const role = require("./routes/Role/role");
const positionsRoutes = require("./routes/Positions/positions");
const StaffManager = require("./routes/StaffManager/staffManager");
const departmentRoutes = require("./routes/Department/department");
const categoryRoutes = require('./routes/categoryRoutes/categoryRoutes');
const documentRoutes = require('./routes/dataroomRoutes/Document'); 
const folderRoutes = require('./routes/Folder/folderRoutes');
const taskRoutes = require('./routes/Task/task');
const paymentRoutes = require('./routes/payment/paymentRoutes');
const reportRoutes = require('./routes/report/reportRoutes');
const integrationRoutes = require('./routes/integration/integrationRoutes');
const contractRoutes = require('./routes/contract/contractRoutes');
const testRoutes = require('./routes/test/test');

const cors = require("cors");

const app = express();
app.use(cors()); 
app.use(express.json());
app.use("/api/test", testRoutes);



// auth routes
app.use("/api/auth", authRoutes);
// customer routes
app.use("/api/customer", customer);
// user routes
app.use("/api/users", userRoutes);
// role routes
app.use("/api/role", role);
// positions routes
app.use("/api/positions", positionsRoutes);
// staff manager routes
app.use("/api/staffmanager", StaffManager);
// department routes
app.use("/api/departments", departmentRoutes);

app.use('/api/categories', categoryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/contracts', contractRoutes);

// Create upload directories
const fs = require('fs');
const path = require('path');
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const uploadDocumentsDir = path.join(uploadDir, 'documents');
const tempDir = process.env.TEMP_DIR || './temp';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(uploadDocumentsDir)) {
    fs.mkdirSync(uploadDocumentsDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy trên http://localhost:${PORT}`));
