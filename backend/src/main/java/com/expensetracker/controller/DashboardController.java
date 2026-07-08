package com.expensetracker.controller;

import com.expensetracker.dto.DashboardSummary;
import com.expensetracker.model.User;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.service.DashboardService;
import com.expensetracker.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private UserService userService;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userService.findByUsername(username);
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummary> getSummary() {
        User user = getAuthenticatedUser();
        DashboardSummary summary = dashboardService.getDashboardSummary(user);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<TransactionRepository.CategorySummary>> getCategorySummaries() {
        User user = getAuthenticatedUser();
        List<TransactionRepository.CategorySummary> summaries = dashboardService.getCategorySummaries(user);
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/monthly-trend")
    public ResponseEntity<List<TransactionRepository.MonthlySummary>> getMonthlySummaries() {
        User user = getAuthenticatedUser();
        List<TransactionRepository.MonthlySummary> summaries = dashboardService.getMonthlySummaries(user);
        return ResponseEntity.ok(summaries);
    }
}
