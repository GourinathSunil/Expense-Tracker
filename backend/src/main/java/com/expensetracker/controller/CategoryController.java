package com.expensetracker.controller;

import com.expensetracker.dto.CategoryRequest;
import com.expensetracker.dto.CategoryResponse;
import com.expensetracker.dto.MessageResponse;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.service.CategoryService;
import com.expensetracker.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private UserService userService;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userService.findByUsername(username);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        User user = getAuthenticatedUser();
        List<Category> categories = categoryService.getAvailableCategories(user.getId());
        List<CategoryResponse> response = categories.stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/type/{typeId}")
    public ResponseEntity<List<CategoryResponse>> getCategoriesByType(@PathVariable Integer typeId) {
        User user = getAuthenticatedUser();
        List<Category> categories = categoryService.getAvailableCategoriesByType(user.getId(), typeId);
        List<CategoryResponse> response = categories.stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createCustomCategory(@Valid @RequestBody CategoryRequest request) {
        User user = getAuthenticatedUser();
        try {
            Category created = categoryService.createCustomCategory(request, user);
            return ResponseEntity.ok(CategoryResponse.fromEntity(created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
