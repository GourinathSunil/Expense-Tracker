package com.expensetracker.repository;

import com.expensetracker.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Filter transactions dynamically
    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
           "AND (:query IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:categoryId IS NULL OR t.category.id = :categoryId) " +
           "AND (:transactionTypeId IS NULL OR t.transactionType.id = :transactionTypeId) " +
           "AND (:startDate IS NULL OR t.transactionDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.transactionDate <= :endDate)")
    Page<Transaction> findFilteredTransactions(
            Long userId, String query, Long categoryId, Integer transactionTypeId,
            LocalDate startDate, LocalDate endDate, Pageable pageable);

    // Sum transactions by type for a user
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.transactionType.id = :typeId")
    BigDecimal sumAmountByUserIdAndType(Long userId, Integer typeId);

    // Projection for Category summary
    interface CategorySummary {
        Long getCategoryId();
        String getCategoryName();
        String getTransactionTypeName();
        BigDecimal getTotalAmount();
    }

    // Category summary for a user
    @Query("SELECT t.category.id as categoryId, t.category.name as categoryName, " +
           "t.transactionType.name as transactionTypeName, SUM(t.amount) as totalAmount " +
           "FROM Transaction t WHERE t.user.id = :userId " +
           "GROUP BY t.category.id, t.category.name, t.transactionType.name")
    List<CategorySummary> getCategorySummary(Long userId);

    // Projection for Monthly summary
    interface MonthlySummary {
        Integer getYearVal();
        Integer getMonthVal();
        String getTransactionTypeName();
        BigDecimal getTotalAmount();
    }

    // Monthly aggregates (Income vs Expense spending trends)
    @Query("SELECT YEAR(t.transactionDate) as yearVal, MONTH(t.transactionDate) as monthVal, " +
           "t.transactionType.name as transactionTypeName, SUM(t.amount) as totalAmount " +
           "FROM Transaction t WHERE t.user.id = :userId " +
           "GROUP BY YEAR(t.transactionDate), MONTH(t.transactionDate), t.transactionType.name " +
           "ORDER BY YEAR(t.transactionDate) DESC, MONTH(t.transactionDate) DESC")
    List<MonthlySummary> getMonthlySummaryTrend(Long userId);
}
