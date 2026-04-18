const ContractService = require('../../services/PaymentService/PaymentContract');

class PaymentContractController {
    static async getAllPaymentContracts(req, res) {
        try {
            const paymentContracts = await ContractService.getAllPaymentContracts();
            res.status(200).json({
                success: true,
                message: 'Payment contracts retrieved successfully',
                data: paymentContracts
            });
        } catch (error) {
            console.error('getAllPaymentContracts error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async getPaymentContractById(req, res) {
        try {
            const { id } = req.params;
            const paymentContract = await ContractService.getPaymentContractById(id);
            if (!paymentContract) {
                return res.status(404).json({ success: false, message: 'Payment contract not found' });
            }
            res.status(200).json({
                success: true,
                message: 'Payment contract retrieved successfully',
                data: paymentContract
            });
        } catch (error) {
            console.error('getPaymentContractById error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }


    static async createPaymentContract(req, res) {
        try {
            const payload = req.body || {};

            if (!payload.contract_id || payload.amount === undefined || payload.amount === null) {
                return res.status(400).json({ success: false, message: "contract_id and amount are required" });
            }

            const createdPayment = await ContractService.createPaymentContract(payload);

            return res.status(201).json({
                success: true,
                message: 'Payment contract created successfully',
                data: createdPayment
            });
        } catch (error) {
            console.error('createPaymentContract error:', error);
            if (error.message === 'contract_id and amount are required') {
                return res.status(400).json({ success: false, message: 'contract_id and amount are required' });
            }
            return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
        }
    }

    static async updatePaymentContract(req, res) {
        try {
            const { id } = req.params;
            const payload = req.body || {};

            const updatedPayment = await ContractService.updatePaymentContract(id, payload);

            return res.status(200).json({
                success: true,
                message: 'Payment contract updated successfully',
                data: updatedPayment
            });
        } catch (error) {
            console.error('updatePaymentContract error:', error);
            if (error.message === 'Payment not found') {
                return res.status(404).json({ success: false, message: 'Payment not found' });
            }
            if (error.message === 'No fields to update') {
                return res.status(400).json({ success: false, message: 'No fields to update' });
            }
            return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
        }
    }

    static async deletePaymentContract(req, res) {
        try {
            const { id } = req.params;

            const result = await ContractService.deletePaymentContract(id);

            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('deletePaymentContract error:', error);
            if (error.message === 'Payment not found') {
                return res.status(404).json({ success: false, message: 'Payment not found' });
            }
            return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
        }
    }
} 

module.exports = PaymentContractController;