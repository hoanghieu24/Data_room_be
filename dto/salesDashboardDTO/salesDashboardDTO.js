class SalesOverviewDTO {
    constructor(data) {
        this.total_opportunities = parseInt(data.total_opportunities) || 0;
        this.total_pipeline_value = parseFloat(data.total_pipeline_value) || 0;
        this.weighted_pipeline_value = parseFloat(data.weighted_pipeline_value) || 0;
        this.new_opportunities = parseInt(data.new_opportunities) || 0;
        this.closed_opportunities = parseInt(data.closed_opportunities) || 0;
        this.won_opportunities = parseInt(data.won_opportunities) || 0;
        this.won_value = parseFloat(data.won_value) || 0;
        this.win_rate = parseFloat(data.win_rate) || 0;
        this.avg_deal_size = parseFloat(data.avg_deal_size) || 0;
        this.avg_sales_cycle_days = parseFloat(data.avg_sales_cycle_days) || 0;
    }

    static fromDatabase(data) {
        return new SalesOverviewDTO(data);
    }
}

class PipelineStageDTO {
    constructor(data) {
        this.stage_id = data.stage_id;
        this.stage_name = data.stage_name;
        this.stage_code = data.stage_code;
        this.opportunity_count = parseInt(data.opportunity_count) || 0;
        this.total_value = parseFloat(data.total_value) || 0;
        this.avg_probability = parseFloat(data.avg_probability) || 0;
        this.weighted_value = parseFloat(data.weighted_value) || 0;
    }

    static fromDatabase(data) {
        return new PipelineStageDTO(data);
    }
}

class SalesRepDTO {
    constructor(data) {
        this.user_id = data.user_id;
        this.full_name = data.full_name;
        this.username = data.username;
        this.total_opportunities = parseInt(data.total_opportunities) || 0;
        this.total_pipeline_value = parseFloat(data.total_pipeline_value) || 0;
        this.won_count = parseInt(data.won_count) || 0;
        this.won_value = parseFloat(data.won_value) || 0;
        this.lost_count = parseInt(data.lost_count) || 0;
        this.win_rate = parseFloat(data.win_rate) || 0;
    }

    static fromDatabase(data) {
        return new SalesRepDTO(data);
    }
}

class SalesSourceDTO {
    constructor(data) {
        this.source_id = data.source_id;
        this.source_name = data.source_name;
        this.opportunity_count = parseInt(data.opportunity_count) || 0;
        this.total_value = parseFloat(data.total_value) || 0;
        this.won_count = parseInt(data.won_count) || 0;
        this.won_value = parseFloat(data.won_value) || 0;
        this.conversion_rate = parseFloat(data.conversion_rate) || 0;
    }

    static fromDatabase(data) {
        return new SalesSourceDTO(data);
    }
}

module.exports = {
    SalesOverviewDTO,
    PipelineStageDTO,
    SalesRepDTO,
    SalesSourceDTO
};