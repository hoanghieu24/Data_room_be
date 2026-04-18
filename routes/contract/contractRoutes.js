const express = require("express");
const router = express.Router();
const contractController = require("../../controllers/contract/contractController");

// Get all contracts
router.get("/", contractController.getAllContracts);

// Get contract statistics
router.get("/stats", contractController.getContractStats);

// Get contract by ID
router.get("/:id", contractController.getContractById);

// Get contracts by customer ID
router.get("/customer/:customerId", contractController.getContractsByCustomer);

// Create new contract
router.post("/", contractController.createContract);

// Update contract
router.put("/:id", contractController.updateContract);

// Update contract status
router.patch("/:id/status", contractController.updateContractStatus);

// Update payment amounts
router.patch("/:id/payment", contractController.updatePaymentAmounts);

// Delete contract
router.delete("/:id", contractController.deleteContract);

module.exports = router;