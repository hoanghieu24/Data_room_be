class ContractCreateDTO {
    constructor(data) {
        this.contract_number = data.contract_number;
        this.contract_name = data.contract_name;
        this.customer_id = data.customer_id;
        this.opportunity_id = data.opportunity_id || null;
        this.contract_type = data.contract_type || null;
        this.status_id = data.status_id || null;
        this.start_date = data.start_date || null;
        this.end_date = data.end_date || null;
        this.sign_date = data.sign_date || null;
        this.value = data.value;
        this.currency = data.currency || 'VND';
        this.payment_term = data.payment_term || null;
        this.payment_method = data.payment_method || null;
        this.tax_rate = data.tax_rate || null;
        this.total_amount = data.total_amount || null;
        this.paid_amount = data.paid_amount || 0;
        this.remaining_amount = data.remaining_amount || null;
        this.renewal_date = data.renewal_date || null;
        this.renewal_reminder_date = data.renewal_reminder_date || null;
        this.terms_and_conditions = data.terms_and_conditions || null;
        this.notes = data.notes || null;
        this.document_path = data.document_path || null;
        this.signed_by = data.signed_by || null;
        this.signed_position = data.signed_position || null;
        this.created_by = data.created_by;
        this.approved_by = data.approved_by || null;
        this.approved_date = data.approved_date || null;
    }
}

module.exports = ContractCreateDTO;