const IntegrationService = require('../../services/integrationService/integrationService');

const parseId = (value) => {
    const id = parseInt(value, 10);
    if (Number.isNaN(id)) {
        throw new Error('Invalid ID format');
    }
    return id;
};

class IntegrationController {
    static async getAllIntegrations(req, res) {
        try {
            const integrations = await IntegrationService.getAllIntegrations();
            res.json({
                success: true,
                message: 'Integrations retrieved successfully',
                data: integrations
            });
        } catch (error) {
            console.error('getAllIntegrations error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async getIntegrationById(req, res) {
        try {
            const id = parseId(req.params.id);
            const integration = await IntegrationService.getIntegrationById(id);
            res.json({
                success: true,
                message: 'Integration retrieved successfully',
                data: integration
            });
        } catch (error) {
            console.error('getIntegrationById error:', error);
            const status = error.message.includes('Invalid ID') ? 400 : error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async createIntegration(req, res) {
        try {
            const integrationData = {
                integration_code: req.body.integration_code,
                name: req.body.name,
                type: req.body.type,
                status: req.body.status,
                config: req.body.config,
                last_sync: req.body.last_sync,
                sync_status: req.body.sync_status,
                notes: req.body.notes,
                created_by: req.body.created_by
            };

            const newIntegration = await IntegrationService.createIntegration(integrationData);
            res.status(201).json({
                success: true,
                message: 'Integration created successfully',
                data: newIntegration
            });
        } catch (error) {
            console.error('createIntegration error:', error);
            const status = error.message.includes('required') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async updateIntegration(req, res) {
        try {
            const id = parseId(req.params.id);
            const integrationData = {
                integration_code: req.body.integration_code,
                name: req.body.name,
                type: req.body.type,
                status: req.body.status,
                config: req.body.config,
                last_sync: req.body.last_sync,
                sync_status: req.body.sync_status,
                notes: req.body.notes,
                created_by: req.body.created_by
            };

            const updatedIntegration = await IntegrationService.updateIntegration(id, integrationData);
            res.json({
                success: true,
                message: 'Integration updated successfully',
                data: updatedIntegration
            });
        } catch (error) {
            console.error('updateIntegration error:', error);
            const status = error.message.includes('Invalid ID') ? 400 : error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async deleteIntegration(req, res) {
        try {
            const id = parseId(req.params.id);
            const result = await IntegrationService.deleteIntegration(id);
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('deleteIntegration error:', error);
            const status = error.message.includes('Invalid ID') ? 400 : error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}

module.exports = IntegrationController;
