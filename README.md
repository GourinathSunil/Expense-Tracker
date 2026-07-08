# Expense Tracker System

A full-stack, secure personal finance application for tracking income and expenses. Built using Spring Boot on the backend, React (Vite) on the frontend, and supporting both H2 (in-memory) and PostgreSQL databases.

---

## Features

###  Authentication & Security
* **User Registration & Login**: Custom authentication flows.
* **JWT Security**: Session stateless JSON Web Tokens verifying incoming requests.
* **BCrypt Hashing**: Encrypted password storage.

###  Expense Management
* **CRUD Transactions**: Easily add, view, edit, and delete transactions.
* **Pagination & Sorting**: Paginated tables with configurable sorting (by date, amount, description).
* **Advanced Filters**: Search by description, filter by transaction type, category, or year/month.

###  Category Customization
* **System Categories**: Default global categories (e.g. Salary, Rent, Food, Utilities).
* **Custom Categories**: Users can dynamically define their own custom categories.
* **Category-wise summaries**: Automatically computed aggregates of spending.

###  Dashboard & Analytics
* **Summary Cards**: Total Income, Total Expense, and Current Balance metrics.
* **Zero-Dependency SVG Charts**: Dynamic React charts built using native SVGs:
  * **Dual Bar Chart**: Income vs Expense comparison.
  * **Line Chart**: Monthly spending trends.
  * **Pie Chart**: Category-wise expense distribution.

---

## Tech Stack

* **Backend**: Java 17, Spring Boot 3.2.5, Spring Security, Spring Data JPA, Maven
* **Frontend**: React (Vite), CSS
* **Database**: PostgreSQL (Production) / H2 (In-memory development database)

---

## Directory Structure

```text
expense-tracker/
├── backend/
│   ├── src/main/java/com/expensetracker/     # Java source files (Security, Config, MVC layers)
│   └── src/main/resources/
│       ├── schema.sql                         # Database schema definition
│       ├── data.sql                           # Seed data insertion
│       ├── application.properties             # Global config
│       ├── application-h2.properties          # Dev H2 configuration
│       └── application-postgres.properties    # PostgreSQL configuration
│
├── frontend/
│   ├── src/components/                        # Custom SVG charts
│   ├── src/pages/                             # Login, Register, Dashboard, History, Analytics
│   ├── src/App.jsx                            # Hash router and state management
│   ├── src/App.css                            # Clean minimalist CSS stylesheet
│   └── package.json                           # Frontend configurations
│
└── README.md                                  # Setup and description guide
```

---

## Normalized Database Schema

The database model is fully normalized to guarantee consistency and avoid duplication:

* **`users`**: Manages users with a unique constraint on username and email.
* **`transaction_types`**: Seeded with two static values: `INCOME` and `EXPENSE`.
* **`categories`**: System-wide global categories have `user_id = NULL`. Custom categories are linked to a specific user (`user_id`). Features a unique constraint `(name, user_id, transaction_type_id)` to avoid duplicate categories.
* **`transactions`**: Stores transaction amounts (positive check constraint), categories, transaction types, dates, descriptions, and user links.

---

## API Endpoints

The following REST API endpoints are exposed by the backend:

| HTTP Method | Endpoint | Description | Auth Required | Request / Parameters | Response |
|---|---|---|---|---|---|
| **POST** | `/api/auth/register` | Register a new user | No | `RegisterRequest` (JSON) | `MessageResponse` |
| **POST** | `/api/auth/login` | Authenticate user & get JWT | No | `LoginRequest` (JSON) | `AuthResponse` (includes JWT) |
| **GET** | `/api/categories` | Get all available categories | Yes (Bearer Token) | None | `List<CategoryResponse>` |
| **POST** | `/api/categories` | Create custom category | Yes (Bearer Token) | `CategoryRequest` (JSON) | `CategoryResponse` |
| **GET** | `/api/categories/type/{typeId}` | Get categories by type | Yes (Bearer Token) | Path: `typeId` (1 = Income, 2 = Expense) | `List<CategoryResponse>` |
| **POST** | `/api/transactions` | Create a transaction | Yes (Bearer Token) | `TransactionRequest` (JSON) | `TransactionResponse` |
| **GET** | `/api/transactions` | Filter/Search transactions (Paged) | Yes (Bearer Token) | Query params: `query`, `categoryId`, `transactionTypeId`, `month`, `year`, `page`, `size`, `sortBy`, `sortDir` | `Page<TransactionResponse>` |
| **PUT** | `/api/transactions/{id}` | Update existing transaction | Yes (Bearer Token) | Path: `id`, Body: `TransactionRequest` | `TransactionResponse` |
| **DELETE** | `/api/transactions/{id}` | Delete transaction | Yes (Bearer Token) | Path: `id` | `MessageResponse` |
| **GET** | `/api/dashboard/summary` | Get balance, income, expense totals | Yes (Bearer Token) | None | `DashboardSummary` |
| **GET** | `/api/dashboard/categories` | Get category-wise summaries | Yes (Bearer Token) | None | `List<CategorySummary>` (Projection) |
| **GET** | `/api/dashboard/monthly-trend` | Get monthly spending trends | Yes (Bearer Token) | None | `List<MonthlySummary>` (Projection) |

---

## Quick Start (Running Locally)

### Prerequisites
* **Java Development Kit (JDK) 17** or higher
* **Apache Maven 3.6+**
* **Node.js v18+** and **npm**

---

### Step 1: Run the Backend

By default, the backend runs with an in-memory **H2 database** so it works immediately without any PostgreSQL setup.

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Build and run the Spring Boot server:
   ```bash
   mvn spring-boot:run
   ```
   *(Note: If you run into HTTPS certificate issues pulling Maven dependencies due to local firewalls or proxy settings, run the command with the wagon bypass flags)*:
   ```bash
   mvn spring-boot:run "-Dmaven.resolver.transport=wagon" "-Dmaven.wagon.http.ssl.insecure=true" "-Dmaven.wagon.http.ssl.allowall=true"
   ```
3. The API will start on `http://localhost:8080`.
4. H2 Console is available at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:expensedb`, Username: `sa`, Password: *empty*).

---

### Step 2: Run the Frontend

1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
   *(If you run into SSL certificate issues on npm, run `npm install --strict-ssl=false`)*
3. Start the React development dev server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

### Running Tests

To run the backend integration test suite verifying user auth, categories, custom transaction CRUD operations, and dashboard calculations:

```bash
cd backend
mvn test
```
*(With SSL bypass flags if required)*:
```bash
mvn test "-Dmaven.resolver.transport=wagon" "-Dmaven.wagon.http.ssl.insecure=true" "-Dmaven.wagon.http.ssl.allowall=true"
```

---

## Switching to PostgreSQL

Once you have PostgreSQL installed on your machine and wish to switch:

1. Create a database named `expensedb` on your PostgreSQL server.
2. Edit [application-postgres.properties](file:///backend/src/main/resources/application-postgres.properties) and set your database connection details (username & password):
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/expensedb
   spring.datasource.username=your_postgres_user
   spring.datasource.password=your_postgres_password
   ```
3. Open [application.properties](file:///backend/src/main/resources/application.properties) and change the active profile:
   ```properties
   spring.profiles.active=postgres
   ```
4. Restart the Spring Boot app. The database tables and seeded values will be automatically generated and populated using `schema.sql` and `data.sql` on the PostgreSQL instance.
