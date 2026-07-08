package com.expensetracker.service;

import com.expensetracker.dto.DashboardSummary;
import com.expensetracker.model.User;
import com.expensetracker.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardService {

    @Autowired
    private TransactionRepository transactionRepository;

    public DashboardSummary getDashboardSummary(User user) {
        BigDecimal totalIncome = transactionRepository.sumAmountByUserIdAndType(user.getId(), 1);
        BigDecimal totalExpense = transactionRepository.sumAmountByUserIdAndType(user.getId(), 2);
        BigDecimal balance = totalIncome.subtract(totalExpense);

        return DashboardSummary.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .currentBalance(balance)
                .build();
    }

    public List<TransactionRepository.CategorySummary> getCategorySummaries(User user) {
        return transactionRepository.getCategorySummary(user.getId());
    }

    public List<TransactionRepository.MonthlySummary> getMonthlySummaries(User user) {
        return transactionRepository.getMonthlySummaryTrend(user.getId());
    }
}
