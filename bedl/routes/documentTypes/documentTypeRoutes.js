const express = require('express');
const router = express.Router();
const DocumentTypeController = require('../../controllers/documentType/documentTypeController');
const { authenticate, authorize } = require('../../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', DocumentTypeController.getAll);
router.post('/', authorize('ADMIN', 'STAFF'), DocumentTypeController.create);
router.put('/:id', authorize('ADMIN'), DocumentTypeController.update);
router.delete('/:id', authorize('ADMIN'), DocumentTypeController.delete);

module.exports = router;
