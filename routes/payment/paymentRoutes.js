const PaymentController = require('../../controllers/payment/paymentController');

const express = require('express');

const router = express.Router();

router.get('/', PaymentController.getAllPaymentContracts);

router.get('/:id', PaymentController.getPaymentContractById);

router.post('/', PaymentController.createPaymentContract);

router.put('/:id', PaymentController.updatePaymentContract);

router.delete('/:id', PaymentController.deletePaymentContract);

module.exports = router;