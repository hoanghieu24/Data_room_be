const PaymentContractModel = require('../../models/paymentContractModel/paymentContract');

class PaymentContractService {
    static async getAllPaymentContracts() {
        return await PaymentContractModel.findAll();
    }
    static async getPaymentContractById(id) {
        return await PaymentContractModel.findById(id);
    }
    static async createPaymentContract(data) {
        return await PaymentContractModel.create(data);
    }
    static async updatePaymentContract(id, data) {
        return await PaymentContractModel.updateWithAutoStatus(id, data);
    }
    static async deletePaymentContract(id) {
        return await PaymentContractModel.delete(id);
    }

}

module.exports = PaymentContractService;