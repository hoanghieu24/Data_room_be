const express = require("express");
require("dotenv").config();
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const authRoutes = require("./routes/Auth/auth");
const userRoutes = require("./routes/User/users");
const customerRoutes = require("./routes/Customer/customer");
const roleRoutes = require("./routes/Role/role");
const positionsRoutes = require("./routes/Positions/positions");
const staffManagerRoutes = require("./routes/StaffManager/staffManager");
const departmentRoutes = require("./routes/Department/department");
const categoryRoutes = require("./routes/categoryRoutes/categoryRoutes");
const documentRoutes = require("./routes/dataroomRoutes/Document");
const folderRoutes = require("./routes/Folder/folderRoutes");
const taskRoutes = require("./routes/Task/task");
const paymentRoutes = require("./routes/payment/paymentRoutes");
const reportRoutes = require("./routes/report/reportRoutes");
const integrationRoutes = require("./routes/integration/integrationRoutes");
const contractRoutes = require("./routes/contract/contractRoutes");
const testRoutes = require("./routes/test/test");

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://data-room-chi.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-document-password"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server OK"
  });
});

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/positions", positionsRoutes);
app.use("/api/staffmanager", staffManagerRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/contracts", contractRoutes);

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
const uploadDocumentsDir = path.join(uploadDir, "documents");
const tempDir = process.env.TEMP_DIR || "./temp";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(uploadDocumentsDir)) {
  fs.mkdirSync(uploadDocumentsDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
