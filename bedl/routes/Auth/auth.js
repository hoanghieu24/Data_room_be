const express = require("express");
const router = express.Router();
const authController = require("../../controllers/Auth/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/change-password", authController.authMiddleware, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp)
router.post("/reset-password", authController.resetPassword);
router.put(
  "/admin/users/:userId/status",
  authController.authMiddleware(["ADMIN"]), 
  authController.toggleUserStatus
);


module.exports = router;
