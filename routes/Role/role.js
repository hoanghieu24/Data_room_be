const express = require("express");
const router = express.Router();
const authController = require("../../controllers/Auth/authController");
const userController = require("../../controllers/Role/roleController");


router.get( "/",
        authController.authMiddleware(["ADMIN"]),
        userController.getAllRoles
);



module.exports = router;