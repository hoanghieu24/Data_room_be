const axios = require('axios');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class PaymentService {
    static async getAllPayments() {
        try {
            const response = await axios.get(`${API_BASE_URL}/payments`);
            return response.data;
        } catch (error) {
            console.error('Error fetching payments:', error);
            throw error;
        }
    }

    static async getPaymentById(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/payments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching payment:', error);
            throw error;
        }
    }

    static async createPayment(paymentData) {
        try {
            const response = await axios.post(`${API_BASE_URL}/payments`, paymentData);
            return response.data;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }

    static async updatePayment(id, paymentData) {
        try {
            const response = await axios.put(`${API_BASE_URL}/payments/${id}`, paymentData);
            return response.data;
        } catch (error) {
            console.error('Error updating payment:', error);
            throw error;
        }
    }

    static async deletePayment(id) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/payments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting payment:', error);
            throw error;
        }
    }

    static async getPaymentsByContract(contractId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/payments/contract/${contractId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching payments by contract:', error);
            throw error;
        }
    }

    static async updatePaymentStatus(id, statusData) {
        try {
            const response = await axios.patch(`${API_BASE_URL}/payments/${id}/status`, statusData);
            return response.data;
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }
}

module.exports = PaymentService;