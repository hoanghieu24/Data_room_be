const express = require("express");
const router = express.Router();
const authController = require("../../controllers/Auth/authController");
const userController = require("../../controllers/User/userController");

router.get("/profile", userController.authMiddleware(), userController.profile);
router.put(
    "/admin/users/:id/status",
    userController.authMiddleware(["ADMIN"]),
    userController.updateStatus
);

router.get(
    "/admin/profileAdmin/:id",
    userController.authMiddleware(["ADMIN"]),
    userController.profileAdmin
);

// xoá 1
router.delete(
  "/admin/:id",
  userController.authMiddleware(["ADMIN"]),
  userController.deleteUser
);

// xoá nhiều
router.delete(
  "/admin",
  userController.authMiddleware(["ADMIN"]),
  userController.deleteMultipleUsers
);

// sửa user
router.put(
  "/admin/:id",
  userController.authMiddleware(["ADMIN"]),
  userController.updateUser
);

router.get(
    "/admin",
    userController.authMiddleware(["ADMIN"]),
    userController.getAllUsers
);

router.put("/profile", userController.authMiddleware(), userController.updateProfile);




module.exports = router;