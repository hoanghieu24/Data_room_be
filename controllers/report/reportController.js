const ReportService = require('../../services/reportService/reportService');

const parseId = (value) => {
    const id = parseInt(value, 10);
    if (Number.isNaN(id)) {
        throw new Error('Invalid ID format');
    }
    return id;
};

class ReportController {
    static async getAllReportTemplates(req, res) {
        try {
            const templates = await ReportService.getAllReportTemplates();
            res.json({
                success: true,
                message: 'Report templates retrieved successfully',
                data: templates
            });
        } catch (error) {
            console.error('getAllReportTemplates error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async getReportTemplateById(req, res) {
        try {
            const id = parseId(req.params.id);
            const template = await ReportService.getReportTemplateById(id);
            res.json({
                success: true,
                message: 'Report template retrieved successfully',
                data: template
            });
        } catch (error) {
            console.error('getReportTemplateById error:', error);
            const status = error.message.includes('Invalid ID') ? 400 : error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async createReportTemplate(req, res) {
        try {
            const templateData = {
                report_code: req.body.report_code,
                name: req.body.name,
                description: req.body.description,
                report_type: req.body.report_type,
                data_source: req.body.data_source,
                filters: req.body.filters,
                columns: req.body.columns,
                chart_config: req.body.chart_config,
                is_public: req.body.is_public,
                created_by: req.body.created_by
            };

            const newTemplate = await ReportService.createReportTemplate(templateData);
            res.status(201).json({
                success: true,
                message: 'Report template created successfully',
                data: newTemplate
            });
        } catch (error) {
            console.error('createReportTemplate error:', error);
            const status = error.message.includes('required') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async updateReportTemplate(req, res) {
        try {
            const id = parseId(req.params.id);
            const templateData = {
                report_code: req.body.report_code,
                name: req.body.name,
                description: req.body.description,
                report_type: req.body.report_type,
                data_source: req.body.data_source,
                filters: req.body.filters,
                columns: req.body.columns,
                chart_config: req.body.chart_config,
                is_public: req.body.is_public,
                created_by: req.body.created_by
            };

            const updatedTemplate = await ReportService.updateReportTemplate(id, templateData);
            res.json({
                success: true,
                message: 'Report template updated successfully',
                data: updatedTemplate
            });
        } catch (error) {
            console.error('updateReportTemplate error:', error);
            const status = error.message.includes('Invalid ID') ? 400 : error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async deleteReportTemplate(req, res) {
        try {
            const id = parseId(req.params.id);
            const result = await ReportService.deleteReportTemplate(id);
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('deleteReportTemplate error:', error);
            const status = error.message.includes('Invalid ID') ? 400 : error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async getAllReportRuns(req, res) {
        try {
            const runs = await ReportService.getAllReportRuns();
            res.json({
                success: true,
                message: 'Report runs retrieved successfully',
                data: runs
            });
        } catch (error) {
            console.error('getAllReportRuns error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async getReportRunById(req, res) {
        try {
            const id = parseId(req.params.id);
            const run = await ReportService.getReportRunById(id);
            res.json({
                success: true,
                message: 'Report run retrieved successfully',
                data: run
            });
        } catch (error) {
            console.error('getReportRunById error:', error);
            const status = error.message.includes('Invalid ID') ? 400 : error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async createReportRun(req, res) {
        try {
            const runData = {
                report_template_id: req.body.report_template_id,
                run_by: req.body.run_by,
                filters: req.body.filters,
                parameters: req.body.parameters,
                result_count: req.body.result_count,
                status: req.body.status,
                error_message: req.body.error_message,
                result_path: req.body.result_path,
                completed_at: req.body.completed_at
            };

            const newRun = await ReportService.createReportRun(runData);
            res.status(201).json({
                success: true,
                message: 'Report run created successfully',
                data: newRun
            });
        } catch (error) {
            console.error('createReportRun error:', error);
            const status = error.message.includes('required') ? 400 : error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async updateReportRun(req, res) {
        try {
            const id = parseId(req.params.id);
            const runData = {
                report_template_id: req.body.report_template_id,
                run_by: req.body.run_by,
                filters: req.body.filters,
                parameters: req.body.parameters,
                result_count: req.body.result_count,
                status: req.body.status,
                error_message: req.body.error_message,
                result_path: req.body.result_path,
                completed_at: req.body.completed_at
            };

            const updatedRun = await ReportService.updateReportRun(id, runData);
            res.json({
                success: true,
                message: 'Report run updated successfully',
                data: updatedRun
            });
        } catch (error) {
            console.error('updateReportRun error:', error);
            const status = error.message.includes('Invalid ID') ? 400 : error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async deleteReportRun(req, res) {
        try {
            const id = parseId(req.params.id);
            const result = await ReportService.deleteReportRun(id);
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('deleteReportRun error:', error);
            const status = error.message.includes('Invalid ID') ? 400 : error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}

module.exports = ReportController;
