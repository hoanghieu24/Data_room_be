const express = require('express');
const router = express.Router();
const ReportController = require('../../controllers/report/reportController');

router.get('/templates', ReportController.getAllReportTemplates);
router.get('/templates/:id', ReportController.getReportTemplateById);
router.post('/templates', ReportController.createReportTemplate);
router.put('/templates/:id', ReportController.updateReportTemplate);
router.delete('/templates/:id', ReportController.deleteReportTemplate);

router.get('/runs', ReportController.getAllReportRuns);
router.get('/runs/:id', ReportController.getReportRunById);
router.post('/runs', ReportController.createReportRun);
router.put('/runs/:id', ReportController.updateReportRun);
router.delete('/runs/:id', ReportController.deleteReportRun);

module.exports = router;
