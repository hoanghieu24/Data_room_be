const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../../models/Customer/CustomerModel");
const CustomerService = require("../../services/Customer/customerService");
const PasswordReset = require("../../models/PasswordReset/passwordResetModel");


exports.getAllCustomer = async (req, res) => {
  try {
    const customers = await CustomerService.getAllCustomer();
    res.json({
      success: true,
      data: customers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

exports.addCustomer = async (req, res) => {
  try {
    const customerId = await CustomerService.addCustomer(req.body, req.user.id);
    res.json({
      success: true,
      msg: "Thêm khách hàng thành công",
      data: { customerId }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      msg: err.message
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const result = await CustomerService.deletedById(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    await CustomerService.changeStatus(parseInt(req.params.id));
    res.json({ success: true, msg: "Đổi trạng thái thành công" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.changeIsVip = async (req, res) => {
  try {
    await CustomerService.changeIsVip(parseInt(req.params.id));
    res.json({ success: true, msg: "Đổi VIP thành công" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    await CustomerService.updateCustomer(req.params.id, req.body);
    res.json({ success: true, msg: "Cập nhật khách hàng thành công" });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};


