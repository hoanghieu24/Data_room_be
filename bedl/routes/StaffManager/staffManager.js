const express = require("express");
const router = express.Router();
const staff = require("../../controllers/StaffManager/StaffController");
const positions = require("../../controllers/Auth/authController");

router.get(
    "/",
    positions.authMiddleware(["ADMIN"]),
    staff.getAllStaff
);

router.post(
    "/",
    positions.authMiddleware(["ADMIN"]),
    staff.createStaff
);

router.put(
    "/:id",
    positions.authMiddleware(["ADMIN"]),
    staff.updateStaff
);

router.delete(
    "/:id",
    positions.authMiddleware(["ADMIN"]),
    staff.deleteStaff
);
router.delete(
    "/",
    positions.authMiddleware(["ADMIN"]),
    staff.deleteStaffs
);
module.exports = router;