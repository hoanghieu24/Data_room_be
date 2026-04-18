const ContractModel = require("../../models/contract/contractModel");
const ContractCreateDTO = require("../../dto/contract/contractCreateDto");
const ContractUpdateDTO = require("../../dto/contract/contractUpdateDto");

class ContractService {
    // Get all contracts with optional filters
    static async getAllContracts(filters = {}) {
        return await ContractModel.findAll(filters);
    }

    // Get contract by ID
    static async getContractById(id) {
        const contract = await ContractModel.findById(id);
        if (!contract) {
            throw new Error("Contract không tồn tại");
        }
        return contract;
    }

    // Create new contract
    static async createContract(contractData, userId) {
        // Validate required fields
        if (!contractData.contract_number || !contractData.contract_name ||
            !contractData.customer_id || !contractData.value) {
            throw new Error("Thiếu thông tin bắt buộc: contract_number, contract_name, customer_id, value");
        }

        // Check if contract number already exists
        const existingContract = await this.checkContractNumberExists(contractData.contract_number);
        if (existingContract) {
            throw new Error("Số hợp đồng đã tồn tại");
        }

        const dto = new ContractCreateDTO({
            ...contractData,
            created_by: userId
        });

        const contractId = await ContractModel.create(dto);
        return await ContractModel.findById(contractId);
    }

    // Update contract
    static async updateContract(id, contractData) {
        const existingContract = await ContractModel.findById(id);
        if (!existingContract) {
            throw new Error("Contract không tồn tại");
        }

        // Check if contract number is being changed and if it already exists
        if (contractData.contract_number && contractData.contract_number !== existingContract.contract_number) {
            const existingContractWithNumber = await this.checkContractNumberExists(contractData.contract_number);
            if (existingContractWithNumber) {
                throw new Error("Số hợp đồng đã tồn tại");
            }
        }

        const dto = new ContractUpdateDTO(contractData);
        const updated = await ContractModel.update(id, dto);

        if (!updated) {
            throw new Error("Không thể cập nhật contract");
        }

        return await ContractModel.findById(id);
    }

    // Delete contract
    static async deleteContract(id) {
        const existingContract = await ContractModel.findById(id);
        if (!existingContract) {
            throw new Error("Contract không tồn tại");
        }

        const deleted = await ContractModel.delete(id);
        if (!deleted) {
            throw new Error("Không thể xóa contract");
        }

        return true;
    }

    // Get contracts by customer ID
    static async getContractsByCustomerId(customerId) {
        return await ContractModel.findByCustomerId(customerId);
    }

    // Update contract status
    static async updateContractStatus(id, statusId) {
        const existingContract = await ContractModel.findById(id);
        if (!existingContract) {
            throw new Error("Contract không tồn tại");
        }

        const updated = await ContractModel.updateStatus(id, statusId);
        if (!updated) {
            throw new Error("Không thể cập nhật trạng thái contract");
        }

        return await ContractModel.findById(id);
    }

    // Update payment amounts
    static async updatePaymentAmounts(id, paidAmount, remainingAmount) {
        const existingContract = await ContractModel.findById(id);
        if (!existingContract) {
            throw new Error("Contract không tồn tại");
        }

        const updated = await ContractModel.updatePaymentAmounts(id, paidAmount, remainingAmount);
        if (!updated) {
            throw new Error("Không thể cập nhật thông tin thanh toán");
        }

        return await ContractModel.findById(id);
    }

    // Check if contract number exists
    static async checkContractNumberExists(contractNumber) {
        const [rows] = await ContractModel.findAll({ contract_number: contractNumber });
        return rows.length > 0;
    }

    // Get contract statistics
    static async getContractStats() {
        const [rows] = await ContractModel.findAll();
        const stats = {
            total: rows.length,
            active: rows.filter(c => c.status_name && c.status_name.toLowerCase().includes('active')).length,
            expired: rows.filter(c => c.end_date && new Date(c.end_date) < new Date()).length,
            total_value: rows.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0),
            total_paid: rows.reduce((sum, c) => sum + (parseFloat(c.paid_amount) || 0), 0),
            total_remaining: rows.reduce((sum, c) => sum + (parseFloat(c.remaining_amount) || 0), 0)
        };
        return stats;
    }
}

module.exports = ContractService;