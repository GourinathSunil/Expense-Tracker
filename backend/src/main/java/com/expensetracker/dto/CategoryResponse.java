package com.expensetracker.dto;

import com.expensetracker.model.Category;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private Integer transactionTypeId;
    private String transactionTypeName;
    private boolean custom;

    public static CategoryResponse fromEntity(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .transactionTypeId(c.getTransactionType().getId())
                .transactionTypeName(c.getTransactionType().getName())
                .custom(c.getUser() != null)
                .build();
    }
}
