package com.expensetracker.service;

import com.expensetracker.dto.CategoryRequest;
import com.expensetracker.model.Category;
import com.expensetracker.model.TransactionType;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.TransactionTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionTypeRepository transactionTypeRepository;

    public List<Category> getAvailableCategories(Long userId) {
        return categoryRepository.findAllAvailableToUser(userId);
    }

    public List<Category> getAvailableCategoriesByType(Long userId, Integer typeId) {
        return categoryRepository.findAvailableToUserByType(userId, typeId);
    }

    @Transactional
    public Category createCustomCategory(CategoryRequest request, User user) {
        TransactionType type = transactionTypeRepository.findById(request.getTransactionTypeId())
                .orElseThrow(() -> new RuntimeException("Transaction Type not found"));

        String normalizedName = request.getName().trim();

        // Check if category name already exists globally or for this user for the same transaction type
        if (categoryRepository.existsByNameAndTypeAndUser(normalizedName, type.getId(), user.getId())) {
            throw new RuntimeException("Category '" + normalizedName + "' already exists for this type");
        }

        Category category = Category.builder()
                .name(normalizedName)
                .transactionType(type)
                .user(user)
                .build();

        return categoryRepository.save(category);
    }
}
