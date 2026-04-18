const express = require("express");
const router = express.Router();
const positions = require("../../controllers/Auth/authController");
const positionsControllers = require("../../controllers/Positons/positionsController");

router.get(
    "/",
    positions.authMiddleware(["ADMIN"]),
    positionsControllers.getAllPositions
);

router.post(
    "/",
    positions.authMiddleware(["ADMIN"]),
    positionsControllers.create
);

router.put("/:id", positionsControllers.update);

router.delete(
    "/:id",
    positions.authMiddleware(["ADMIN"]),
    positionsControllers.deleteById
);

router.delete(
    "/",
    positions.authMiddleware(["ADMIN"]),
    positionsControllers.deleteByIds
);

module.exports = router;