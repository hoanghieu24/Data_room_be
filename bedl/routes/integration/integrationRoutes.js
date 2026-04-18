const express = require('express');
const router = express.Router();
const IntegrationController = require('../../controllers/integration/integrationController');

router.get('/', IntegrationController.getAllIntegrations);
router.get('/:id', IntegrationController.getIntegrationById);
router.post('/', IntegrationController.createIntegration);
router.put('/:id', IntegrationController.updateIntegration);
router.delete('/:id', IntegrationController.deleteIntegration);

module.exports = router;
