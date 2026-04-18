const express = require("express");
const router = express.Router();
const taskController = require("../../controllers/task/taskController");
const positions = require("../../controllers/Auth/authController");

router.get( "/",
        positions.authMiddleware(["ADMIN", "STAFF"]),
        taskController.getAllTasks
);

router.post( "/",
        positions.authMiddleware(["ADMIN", "STAFF"]),
        taskController.createTask
);

router.get( "/:id",
        positions.authMiddleware(["ADMIN", "STAFF"]),
        taskController.getTaskById
);

router.put( "/:id",
        positions.authMiddleware(["ADMIN", "STAFF"]),
        taskController.updateTask
);

router.delete( "/:id",
        positions.authMiddleware(["ADMIN", "STAFF"]),
        taskController.deleteTask
);
module.exports = router;