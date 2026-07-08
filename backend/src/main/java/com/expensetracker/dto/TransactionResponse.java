package com.expensetracker.dto;

import com.expensetracker.model.Transaction;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TransactionResponse {
    private Long id;
    private BigDecimal amount;
    private Integer transactionTypeId;
    private String transactionTypeName;
    private Long categoryId;
    private String categoryName;
    private String description;
    private LocalDate transactionDate;
    private LocalDateTime createdAt;

    public static TransactionResponse fromEntity(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .amount(t.getAmount())
                .transactionTypeId(t.getTransactionType().getId())
                .transactionTypeName(t.getTransactionType().getName())
                .categoryId(t.getCategory().getId())
                .categoryName(t.getCategory().getName())
                .description(t.getDescription())
                .transactionDate(t.getTransactionDate())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
