package com.expensetracker.repository;

import com.expensetracker.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    // Find all global categories (where user_id is null)
    List<Category> findByUserIdIsNull();

    // Find all custom categories for a user
    List<Category> findByUserId(Long userId);

    // Find both global categories and a user's custom categories
    @Query("SELECT c FROM Category c WHERE c.user.id IS NULL OR c.user.id = :userId")
    List<Category> findAllAvailableToUser(Long userId);

    // Find both global and user custom categories by type
    @Query("SELECT c FROM Category c WHERE (c.user.id IS NULL OR c.user.id = :userId) AND c.transactionType.id = :typeId")
    List<Category> findAvailableToUserByType(Long userId, Integer typeId);

    // Check if category name exists either globally or for a specific user
    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE LOWER(c.name) = LOWER(:name) " +
           "AND c.transactionType.id = :typeId AND (c.user.id IS NULL OR c.user.id = :userId)")
    boolean existsByNameAndTypeAndUser(String name, Integer typeId, Long userId);

    // Find specific category by ID and user access (either global or owned by user)
    @Query("SELECT c FROM Category c WHERE c.id = :categoryId AND (c.user.id IS NULL OR c.user.id = :userId)")
    Optional<Category> findByIdAndUserAccess(Long categoryId, Long userId);
}
