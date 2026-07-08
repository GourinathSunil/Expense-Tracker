-- Seed transaction types
INSERT INTO transaction_types (id, name) VALUES (1, 'INCOME') ON CONFLICT DO NOTHING;
INSERT INTO transaction_types (id, name) VALUES (2, 'EXPENSE') ON CONFLICT DO NOTHING;

-- Seed default categories for INCOME (transaction_type_id = 1)
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Salary', NULL, 1) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Freelance', NULL, 1) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Investments', NULL, 1) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Other Income', NULL, 1) ON CONFLICT DO NOTHING;

-- Seed default categories for EXPENSE (transaction_type_id = 2)
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Food & Dining', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Rent & Housing', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Utilities', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Transportation', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Entertainment', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Shopping', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Healthcare', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Education', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO categories (name, user_id, transaction_type_id) VALUES ('Other Expense', NULL, 2) ON CONFLICT DO NOTHING;
