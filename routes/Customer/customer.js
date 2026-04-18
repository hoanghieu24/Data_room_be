const express = require("express");
const router = express.Router();
const authController = require("../../controllers/Auth/authController");
const CustomerController = require("../../controllers/Customer/customerController");

router.post(
  "/",
  authController.authMiddleware(["ADMIN","STAFF"]),
  CustomerController.addCustomer
);

router.delete(
  "/:id",
  authController.authMiddleware(["ADMIN","STAFF"]),
  CustomerController.deleteCustomer
);

router.get(
  "/",
  authController.authMiddleware(["ADMIN","STAFF"]),
  CustomerController.getAllCustomer
);

router.delete(
  "/",
  authController.authMiddleware(["ADMIN","STAFF"]),
  CustomerController.deleteCustomer
);

router.put(
  "/change-status/:id",
  authController.authMiddleware(["ADMIN","STAFF"]),
  CustomerController.changeStatus
);

router.put(
  "/change-is-vip/:id",
  authController.authMiddleware(["ADMIN","STAFF"]),
  CustomerController.changeIsVip
);

router.put("/:id",
  authController.authMiddleware(["ADMIN","STAFF"]),
  CustomerController.updateCustomer
);

module.exports = router;
