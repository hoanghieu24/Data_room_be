class CategoryTypeDTO {
    constructor(categoryType) {
        this.id = categoryType.id;
        this.code = categoryType.code;
        this.name = categoryType.name;
        this.description = categoryType.description;
        this.is_active = categoryType.is_active;
        this.created_at = categoryType.created_at;
        this.updated_at = categoryType.updated_at;
    }

    static fromDatabase(categoryType) {
        return new CategoryTypeDTO(categoryType);
    }

    static toDatabase(categoryTypeDTO) {
        return {
            code: categoryTypeDTO.code,
            name: categoryTypeDTO.name,
            description: categoryTypeDTO.description,
            is_active: categoryTypeDTO.is_active
        };
    }
}

class CategoryDTO {
    constructor(category) {
        this.id = category.id;
        this.code = category.code;
        this.name = category.name;
        this.category_type_id = category.category_type_id;
        this.category_type_name = category.category_type_name;
        this.is_active = category.is_active;
        this.created_at = category.created_at;
        this.updated_at = category.updated_at;
    }

    static fromDatabase(category) {
        return new CategoryDTO(category);
    }

    static toDatabase(categoryDTO) {
        return {
            code: categoryDTO.code,
            name: categoryDTO.name,
            category_type_id: categoryDTO.category_type_id,
            is_active: categoryDTO.is_active
        };
    }

    static toResponse(category) {
        return {
            id: category.id,
            code: category.code,
            name: category.name,
            category_type: category.category_type_name || null,
            is_active: category.is_active ? 'Active' : 'Inactive',
            created_at: category.created_at,
            updated_at: category.updated_at
        };
    }
}

module.exports = {
    CategoryTypeDTO,
    CategoryDTO
};