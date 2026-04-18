const ReportTemplateModel = require('../../models/reportModel/reportTemplateModel');
const ReportRunModel = require('../../models/reportModel/reportRunModel');

class ReportService {
    static async getAllReportTemplates() {
        return await ReportTemplateModel.getAll();
    }

    static async getReportTemplateById(id) {
        if (isNaN(id)) {
            throw new Error('Invalid report template ID');
        }

        const template = await ReportTemplateModel.getById(id);
        if (!template) {
            throw new Error('Report template not found');
        }
        return template;
    }

    static async createReportTemplate(data) {
        if (!data.report_code || !data.name) {
            throw new Error('report_code and name are required');
        }
        return await ReportTemplateModel.create(data);
    }

    static async updateReportTemplate(id, data) {
        if (isNaN(id)) {
            throw new Error('Invalid report template ID');
        }

        const template = await ReportTemplateModel.getById(id);
        if (!template) {
            throw new Error('Report template not found');
        }

        return await ReportTemplateModel.update(id, data);
    }

    static async deleteReportTemplate(id) {
        if (isNaN(id)) {
            throw new Error('Invalid report template ID');
        }

        return await ReportTemplateModel.delete(id);
    }

    static async getAllReportRuns() {
        return await ReportRunModel.getAll();
    }

    static async getReportRunById(id) {
        if (isNaN(id)) {
            throw new Error('Invalid report run ID');
        }

        const run = await ReportRunModel.getById(id);
        if (!run) {
            throw new Error('Report run not found');
        }
        return run;
    }

    static async createReportRun(data) {
        if (!data.report_template_id || !data.run_by) {
            throw new Error('report_template_id and run_by are required');
        }

        const template = await ReportTemplateModel.getById(data.report_template_id);
        if (!template) {
            throw new Error('Report template not found');
        }

        return await ReportRunModel.create(data);
    }

    static async updateReportRun(id, data) {
        if (isNaN(id)) {
            throw new Error('Invalid report run ID');
        }

        const run = await ReportRunModel.getById(id);
        if (!run) {
            throw new Error('Report run not found');
        }

        return await ReportRunModel.update(id, data);
    }

    static async deleteReportRun(id) {
        if (isNaN(id)) {
            throw new Error('Invalid report run ID');
        }

        return await ReportRunModel.delete(id);
    }
}

module.exports = ReportService;
