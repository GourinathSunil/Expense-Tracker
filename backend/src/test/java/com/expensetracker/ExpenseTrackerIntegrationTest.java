package com.expensetracker;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.expensetracker.dto.CategoryRequest;
import com.expensetracker.dto.LoginRequest;
import com.expensetracker.dto.RegisterRequest;
import com.expensetracker.dto.TransactionRequest;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class ExpenseTrackerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        transactionRepository.deleteAll();
        // Delete all users except global categories
        userRepository.deleteAll();
    }

    @Test
    public void testFullE2EFlow() throws Exception {
        // 1. User Registration
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("integrationuser");
        registerRequest.setEmail("integration@example.com");
        registerRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("registered successfully")));

        // 2. User Login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("integrationuser");
        loginRequest.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username", is("integrationuser")))
                .andReturn();

        String responseString = loginResult.getResponse().getContentAsString();
        Map<String, Object> responseMap = objectMapper.readValue(responseString, Map.class);
        String token = (String) responseMap.get("token");
        assertNotNull(token);

        String authHeader = "Bearer " + token;

        // 3. Create Custom Category (Subscriptions - Expense type 2)
        CategoryRequest categoryRequest = new CategoryRequest();
        categoryRequest.setName("Streaming Services");
        categoryRequest.setTransactionTypeId(2); // EXPENSE

        MvcResult categoryResult = mockMvc.perform(post("/api/categories")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(categoryRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Streaming Services")))
                .andExpect(jsonPath("$.custom", is(true)))
                .andReturn();

        Map<String, Object> catMap = objectMapper.readValue(categoryResult.getResponse().getContentAsString(), Map.class);
        Number customCategoryIdNum = (Number) catMap.get("id");
        Long customCategoryId = customCategoryIdNum.longValue();

        // 4. Add Transaction: Income ($5000.00, Salary [id 1 from seed data])
        TransactionRequest incomeTx = new TransactionRequest();
        incomeTx.setAmount(new BigDecimal("5000.00"));
        incomeTx.setTransactionTypeId(1); // INCOME
        incomeTx.setCategoryId(1L); // Salary is seeded at id 1
        incomeTx.setTransactionDate(LocalDate.now());
        incomeTx.setDescription("Monthly Salary");

        mockMvc.perform(post("/api/transactions")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(incomeTx)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount", is(5000.00)))
                .andExpect(jsonPath("$.transactionTypeName", is("INCOME")));

        // 5. Add Transaction: Expense ($1200.00, Rent & Housing [id 6 from seed data])
        TransactionRequest rentTx = new TransactionRequest();
        rentTx.setAmount(new BigDecimal("1200.00"));
        rentTx.setTransactionTypeId(2); // EXPENSE
        rentTx.setCategoryId(6L); // Rent & Housing
        rentTx.setTransactionDate(LocalDate.now());
        rentTx.setDescription("Apartment Rent");

        mockMvc.perform(post("/api/transactions")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rentTx)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount", is(1200.00)))
                .andExpect(jsonPath("$.transactionTypeName", is("EXPENSE")));

        // 6. Add Transaction: Expense ($50.00, Custom Category [Subscriptions])
        TransactionRequest subTx = new TransactionRequest();
        subTx.setAmount(new BigDecimal("50.00"));
        subTx.setTransactionTypeId(2); // EXPENSE
        subTx.setCategoryId(customCategoryId);
        subTx.setTransactionDate(LocalDate.now());
        subTx.setDescription("Netflix & Spotify");

        mockMvc.perform(post("/api/transactions")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(subTx)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount", is(50.00)))
                .andExpect(jsonPath("$.categoryName", is("Streaming Services")));

        // 7. Verify Dashboard Summary metrics
        mockMvc.perform(get("/api/dashboard/summary")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome", is(5000.00)))
                .andExpect(jsonPath("$.totalExpense", is(1250.00)))
                .andExpect(jsonPath("$.currentBalance", is(3750.00)));

        // 8. Verify Transactions History list with search and filters
        mockMvc.perform(get("/api/transactions?query=Netflix")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].description", is("Netflix & Spotify")));

        mockMvc.perform(get("/api/transactions?transactionTypeId=2")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2))); // 2 expenses

        // 9. Verify Category Summary aggregation
        mockMvc.perform(get("/api/dashboard/categories")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));
    }
}
