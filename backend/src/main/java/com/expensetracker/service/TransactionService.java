package com.expensetracker.service;

import com.expensetracker.dto.TransactionRequest;
import com.expensetracker.dto.TransactionResponse;
import com.expensetracker.model.Category;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.TransactionType;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.TransactionTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.YearMonth;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionTypeRepository transactionTypeRepository;

    @Transactional
    public TransactionResponse createTransaction(TransactionRequest request, User user) {
        TransactionType type = transactionTypeRepository.findById(request.getTransactionTypeId())
                .orElseThrow(() -> new RuntimeException("Transaction Type not found"));

        Category category = categoryRepository.findByIdAndUserAccess(request.getCategoryId(), user.getId())
                .orElseThrow(() -> new RuntimeException("Category not found or access denied"));

        // Validate that category matches the transaction type
        if (!category.getTransactionType().getId().equals(type.getId())) {
            throw new RuntimeException("Category type does not match transaction type");
        }

        Transaction transaction = Transaction.builder()
                .user(user)
                .amount(request.getAmount())
                .transactionType(type)
                .category(category)
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .build();

        Transaction saved = transactionRepository.save(transaction);
        return TransactionResponse.fromEntity(saved);
    }

    @Transactional
    public TransactionResponse updateTransaction(Long transactionId, TransactionRequest request, User user) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        // Validate owner
        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied to update transaction");
        }

        TransactionType type = transactionTypeRepository.findById(request.getTransactionTypeId())
                .orElseThrow(() -> new RuntimeException("Transaction Type not found"));

        Category category = categoryRepository.findByIdAndUserAccess(request.getCategoryId(), user.getId())
                .orElseThrow(() -> new RuntimeException("Category not found or access denied"));

        if (!category.getTransactionType().getId().equals(type.getId())) {
            throw new RuntimeException("Category type does not match transaction type");
        }

        transaction.setAmount(request.getAmount());
        transaction.setTransactionType(type);
        transaction.setCategory(category);
        transaction.setDescription(request.getDescription());
        transaction.setTransactionDate(request.getTransactionDate());

        Transaction updated = transactionRepository.save(transaction);
        return TransactionResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteTransaction(Long transactionId, User user) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        // Validate owner
        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied to delete transaction");
        }

        transactionRepository.delete(transaction);
    }

    public Page<TransactionResponse> getTransactions(
            User user, String query, Long categoryId, Integer transactionTypeId,
            Integer month, Integer year, int page, int size, String sortBy, String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.DESC.name()) ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);

        LocalDate startDate = null;
        LocalDate endDate = null;

        // Process dates if month and year are specified
        if (year != null) {
            if (month != null) {
                YearMonth yearMonth = YearMonth.of(year, month);
                startDate = yearMonth.atDay(1);
                endDate = yearMonth.atEndOfMonth();
            } else {
                startDate = LocalDate.of(year, 1, 1);
                endDate = LocalDate.of(year, 12, 31);
            }
        }

        // Search text: map empty text to null for simpler repository query
        String searchText = (query != null && !query.trim().isEmpty()) ? query.trim() : null;

        Page<Transaction> transactionPage = transactionRepository.findFilteredTransactions(
                user.getId(), searchText, categoryId, transactionTypeId, startDate, endDate, pageable);

        return transactionPage.map(TransactionResponse::fromEntity);
    }
}
