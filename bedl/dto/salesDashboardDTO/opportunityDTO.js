class OpportunityDTO {
    constructor(opportunity) {
        this.id = opportunity.id;
        this.opportunity_code = opportunity.opportunity_code;
        this.name = opportunity.name;
        this.customer_id = opportunity.customer_id;
        this.customer_name = opportunity.customer_name;
        this.customer_code = opportunity.customer_code;
        this.stage_id = opportunity.stage_id;
        this.stage_name = opportunity.stage_name;
        this.expected_value = parseFloat(opportunity.expected_value) || 0;
        this.probability = parseFloat(opportunity.probability) || 0;
        this.currency = opportunity.currency || 'VND';
        this.expected_close_date = opportunity.expected_close_date;
        this.actual_close_date = opportunity.actual_close_date;
        this.priority = opportunity.priority;
        this.assigned_to = opportunity.assigned_to;
        this.assigned_name = opportunity.assigned_name;
        this.assigned_username = opportunity.assigned_username;
        this.source_id = opportunity.source_id;
        this.source_name = opportunity.source_name;
        this.notes = opportunity.notes;
        this.next_step = opportunity.next_step;
        this.loss_reason = opportunity.loss_reason;
        this.metadata = opportunity.metadata ? JSON.parse(opportunity.metadata) : null;
        this.is_active = opportunity.is_active;
        this.created_by = opportunity.created_by;
        this.created_by_name = opportunity.created_by_name;
        this.created_at = opportunity.created_at;
        this.updated_at = opportunity.updated_at;
        
        // Tính weighted value
        this.weighted_value = this.expected_value * (this.probability / 100);
    }

    static fromDatabase(opportunity) {
        return new OpportunityDTO(opportunity);
    }

    static toDatabase(opportunityDTO) {
        return {
            opportunity_code: opportunityDTO.opportunity_code,
            name: opportunityDTO.name,
            customer_id: opportunityDTO.customer_id,
            stage_id: opportunityDTO.stage_id,
            expected_value: opportunityDTO.expected_value,
            probability: opportunityDTO.probability,
            currency: opportunityDTO.currency,
            expected_close_date: opportunityDTO.expected_close_date,
            priority: opportunityDTO.priority,
            assigned_to: opportunityDTO.assigned_to,
            source_id: opportunityDTO.source_id,
            notes: opportunityDTO.notes,
            next_step: opportunityDTO.next_step,
            campaign_id: opportunityDTO.campaign_id,
            created_by: opportunityDTO.created_by
        };
    }

    static toResponse(opportunity) {
        const dto = new OpportunityDTO(opportunity);
        
        return {
            id: dto.id,
            code: dto.opportunity_code,
            name: dto.name,
            customer: {
                id: dto.customer_id,
                name: dto.customer_name,
                code: dto.customer_code
            },
            stage: {
                id: dto.stage_id,
                name: dto.stage_name
            },
            value: {
                expected: dto.expected_value,
                probability: dto.probability,
                weighted: dto.weighted_value,
                currency: dto.currency
            },
            dates: {
                expected_close: dto.expected_close_date,
                actual_close: dto.actual_close_date,
                created: dto.created_at,
                updated: dto.updated_at
            },
            assigned_to: {
                id: dto.assigned_to,
                name: dto.assigned_name,
                username: dto.assigned_username
            },
            priority: dto.priority,
            source: dto.source_name,
            notes: dto.notes,
            next_step: dto.next_step,
            status: dto.is_active ? 'Active' : 'Inactive'
        };
    }
}

class OpportunityHistoryDTO {
    constructor(history) {
        this.id = history.id;
        this.opportunity_id = history.opportunity_id;
        this.from_stage_id = history.from_stage_id;
        this.from_stage_name = history.from_stage_name;
        this.to_stage_id = history.to_stage_id;
        this.to_stage_name = history.to_stage_name;
        this.changed_by = history.changed_by;
        this.changed_by_name = history.changed_by_name;
        this.notes = history.notes;
        this.created_at = history.created_at;
    }

    static fromDatabase(history) {
        return new OpportunityHistoryDTO(history);
    }
}

module.exports = {
    OpportunityDTO,
    OpportunityHistoryDTO
};