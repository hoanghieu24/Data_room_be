const IntegrationModel = require('../../models/integrationModel/integrationModel');

class IntegrationService {
    static async getAllIntegrations() {
        return await IntegrationModel.getAll();
    }

    static async getIntegrationById(id) {
        if (isNaN(id)) {
            throw new Error('Invalid integration ID');
        }

        const integration = await IntegrationModel.getById(id);
        if (!integration) {
            throw new Error('Integration not found');
        }
        return integration;
    }

    static async createIntegration(data) {
        if (!data.integration_code || !data.name) {
            throw new Error('integration_code and name are required');
        }

        return await IntegrationModel.create(data);
    }

    static async updateIntegration(id, data) {
        if (isNaN(id)) {
            throw new Error('Invalid integration ID');
        }

        const integration = await IntegrationModel.getById(id);
        if (!integration) {
            throw new Error('Integration not found');
        }

        return await IntegrationModel.update(id, data);
    }

    static async deleteIntegration(id) {
        if (isNaN(id)) {
            throw new Error('Invalid integration ID');
        }

        return await IntegrationModel.delete(id);
    }
}

module.exports = IntegrationService;
