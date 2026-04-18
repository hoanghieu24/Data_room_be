const ContractService = require("../../services/contract/contractService");
const jwt = require("jsonwebtoken");

// Authentication middleware
const authMiddleware = (roles = []) => (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Chưa đăng nhập hoặc định dạng token sai"
        });
    }
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        if (roles.length && !roles.includes(decoded.role_code)) {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập"
            });
        }

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token đã hết hạn"
            });
        }
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ"
        });
    }
};

// Get all contracts
exports.getAllContracts = [
    authMiddleware(),
    async (req, res) => {
        try {
            const filters = req.query;
            const contracts = await ContractService.getAllContracts(filters);

            return res.json({
                success: true,
                data: contracts,
                message: "Lấy danh sách hợp đồng thành công"
            });
        } catch (error) {
            console.error("getAllContracts error:", error);
            return res.status(500).json({
                success: false,
                message: "Lỗi server",
                error: error.message
            });
        }
    }
];

// Get contract by ID
exports.getContractById = [
    authMiddleware(),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: "ID hợp đồng không hợp lệ"
                });
            }

            const contract = await ContractService.getContractById(parseInt(id));

            return res.json({
                success: true,
                data: contract,
                message: "Lấy thông tin hợp đồng thành công"
            });
        } catch (error) {
            console.error("getContractById error:", error);

            if (error.message === "Contract không tồn tại") {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: "Lỗi server",
                error: error.message
            });
        }
    }
];

// Create new contract
exports.createContract = [
    authMiddleware(),
    async (req, res) => {
        try {
            const contractData = req.body;
            const userId = req.user.id;

            const contract = await ContractService.createContract(contractData, userId);

            return res.status(201).json({
                success: true,
                data: contract,
                message: "Tạo hợp đồng thành công"
            });
        } catch (error) {
            console.error("createContract error:", error);

            if (error.message.includes("Thiếu thông tin bắt buộc") ||
                error.message.includes("Số hợp đồng đã tồn tại")) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: "Lỗi server",
                error: error.message
            });
        }
    }
];

// Update contract
exports.updateContract = [
    authMiddleware(),
    async (req, res) => {
        try {
            const { id } = req.params;
            const contractData = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: "ID hợp đồng không hợp lệ"
                });
            }

            const contract = await ContractService.updateContract(parseInt(id), contractData);

            return res.json({
                success: true,
                data: contract,
                message: "Cập nhật hợp đồng thành công"
            });
        } catch (error) {
            console.error("updateContract error:", error);

            if (error.message === "Contract không tồn tại" ||
                error.message === "Số hợp đồng đã tồn tại") {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: "Lỗi server",
                error: error.message
            });
        }
    }
];

// Delete contract
exports.deleteContract = [
    authMiddleware(["ADMIN"]),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: "ID hợp đồng không hợp lệ"
                });
            }

            await ContractService.deleteContract(parseInt(id));

            return res.json({
                success: true,
                message: "Xóa hợp đồng thành công"
            });
        } catch (error) {
            console.error("deleteContract error:", error);

            if (error.message === "Contract không tồn tại") {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: "Lỗi server",
                error: error.message
            });
        }
    }
];

// Get contracts by customer ID
exports.getContractsByCustomer = [
    authMiddleware(),
    async (req, res) => {
        try {
            const { customerId } = req.params;

            if (!customerId || isNaN(customerId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID khách hàng không hợp lệ"
                });
            }

            const contracts = await ContractService.getContractsByCustomerId(parseInt(customerId));

            return res.json({
                success: true,
                data: contracts,
                message: "Lấy danh sách hợp đồng theo khách hàng thành công"
            });
        } catch (error) {
            console.error("getContractsByCustomer error:", error);
            return res.status(500).json({
                success: false,
                message: "Lỗi server",
                error: error.message
            });
        }
    }
];

// Update contract status
exports.updateContractStatus = [
    authMiddleware(),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status_id } = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: "ID hợp đồng không hợp lệ"
                });
            }

            if (!status_id || isNaN(status_id)) {
                return res.status(400).json({
                    success: false,
                    message: "ID trạng thái không hợp lệ"
                });
            }

            const contract = await ContractService.updateContractStatus(parseInt(id), parseInt(status_id));

            return res.json({
                success: true,
                data: contract,
                message: "Cập nhật trạng thái hợp đồng thành công"
            });
        } catch (error) {
            console.error("updateContractStatus error:", error);

            if (error.message === "Contract không tồn tại") {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: "Lỗi server",
                error: error.message
            });
        }
    }
];

// Update payment amounts
exports.updatePaymentAmounts = [
    authMiddleware(),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { paid_amount, remaining_amount } = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: "ID hợp đồng không hợp lệ"
                });
            }

            if (paid_amount === undefined || remaining_amount === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin thanh toán"
                });
            }

            const contract = await ContractService.updatePaymentAmounts(
                parseInt(id),
                parseFloat(paid_amount),
                parseFloat(remaining_amount)
            );

            return res.json({
                success: true,
                data: contract,
                message: "Cập nhật thông tin thanh toán thành công"
            });
        } catch (error) {
            console.error("updatePaymentAmounts error:", error);

            if (error.message === "Contract không tồn tại") {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: "Lỗi server",
                error: error.message
            });
        }
    }
];

// Get contract statistics
exports.getContractStats = [
    authMiddleware(),
    async (req, res) => {
        try {
            const stats = await ContractService.getContractStats();

            return res.json({
                success: true,
                data: stats,
                message: "Lấy thống kê hợp đồng thành công"
            });
        } catch (error) {
            console.error("getContractStats error:", error);
            return res.status(500).json({
                success: false,
                message: "Lỗi server",
                error: error.message
            });
        }
    }
];