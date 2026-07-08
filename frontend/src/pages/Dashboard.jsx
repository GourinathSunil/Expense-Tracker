import React, { useState, useEffect } from 'react';
import { IncomeVsExpenseBarChart } from '../components/SvgCharts';

export default function Dashboard({ token }) {
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, currentBalance: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form states for adding transaction
  const [amount, setAmount] = useState('');
  const [transactionTypeId, setTransactionTypeId] = useState(2); // 1 = Income, 2 = Expense (default)
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  // Form states for custom category
  const [catName, setCatName] = useState('');
  const [catTypeId, setCatTypeId] = useState(2); // 2 = Expense (default)
  const [catError, setCatError] = useState('');

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch Summary
      const summaryRes = await fetch('http://localhost:8080/api/dashboard/summary', { headers });
      const summaryData = await summaryRes.json();
      
      // Fetch Recent Transactions
      const transRes = await fetch('http://localhost:8080/api/transactions?page=0&size=5', { headers });
      const transData = await transRes.json();

      // Fetch Categories
      const catRes = await fetch('http://localhost:8080/api/categories', { headers });
      const catData = await catRes.json();

      if (summaryRes.ok) setSummary(summaryData);
      if (transRes.ok) setRecentTransactions(transData.content || []);
      if (catRes.ok) setCategories(catData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Set default category when type or categories change
  useEffect(() => {
    const available = categories.filter(c => c.transactionTypeId === Number(transactionTypeId));
    if (available.length > 0) {
      setCategoryId(available[0].id);
    } else {
      setCategoryId('');
    }
  }, [transactionTypeId, categories]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!amount || Number(amount) <= 0) {
      setFormError('Amount must be a positive number');
      return;
    }

    if (!categoryId) {
      setFormError('Please select a category');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          transactionTypeId: Number(transactionTypeId),
          categoryId: Number(categoryId),
          description,
          transactionDate,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to add transaction');
      }

      // Reset form
      setAmount('');
      setDescription('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setShowAddModal(false);
      
      // Refresh dashboard
      fetchData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCatError('');

    if (!catName.trim()) {
      setCatError('Category name is required');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: catName,
          transactionTypeId: Number(catTypeId),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to create category');
      }

      const newCat = await response.json();
      setCategories(prev => [...prev, newCat]);
      setCatName('');
      setShowCategoryModal(false);
      
      // Auto select new category in the other form
      if (Number(transactionTypeId) === Number(catTypeId)) {
        setCategoryId(newCat.id);
      }
    } catch (err) {
      setCatError(err.message);
    }
  };

  const availableCategories = categories.filter(c => c.transactionTypeId === Number(transactionTypeId));

  if (loading) {
    return <div className="empty-state"><p>Loading Dashboard...</p></div>;
  }

  return (
    <div>
      <div className="section-header">
        <h1 className="auth-title" style={{ textAlign: 'left', margin: 0 }}>Overview</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-small" onClick={() => setShowCategoryModal(true)}>
            + Custom Category
          </button>
          <button className="btn btn-primary btn-small" onClick={() => setShowAddModal(true)}>
            + Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-header">
            <span className="card-title">Current Balance</span>
          </div>
          <span className="card-value balance">
            ${summary.currentBalance.toFixed(2)}
          </span>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <span className="card-title">Total Income</span>
            <span className="badge badge-income">IN</span>
          </div>
          <span className="card-value income">
            +${summary.totalIncome.toFixed(2)}
          </span>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <span className="card-title">Total Expenses</span>
            <span className="badge badge-expense">OUT</span>
          </div>
          <span className="card-value expense">
            -${summary.totalExpense.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Comparison and Recent activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dashboard-section">
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>Income vs Expense</h3>
            <IncomeVsExpenseBarChart income={summary.totalIncome} expense={summary.totalExpense} />
          </div>

          <div className="dashboard-section">
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>Recent Transactions</h3>
            {recentTransactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <p className="empty-state-subtitle">No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((t) => (
                      <tr key={t.id}>
                        <td>{t.transactionDate}</td>
                        <td>{t.description || '—'}</td>
                        <td>
                          <span className="badge badge-category">{t.categoryName}</span>
                        </td>
                        <td style={{ textAlign: 'right' }} className={`amount-text ${t.transactionTypeName.toLowerCase()}`}>
                          {t.transactionTypeName === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Categories summaries widgets */}
        <div className="dashboard-section" style={{ height: 'fit-content' }}>
          <h3 className="section-title">Quick Settings</h3>
          <div className="category-list" style={{ marginTop: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Configure your dashboard or view transaction lists to get detailed history, pagination, sorting and category filters.
            </p>
            <a href="#transactions" className="btn btn-secondary btn-small" style={{ width: '100%', textDecoration: 'none', marginTop: '0.5rem' }}>
              View Full History
            </a>
            <a href="#analytics" className="btn btn-primary btn-small" style={{ width: '100%', textDecoration: 'none' }}>
              View Analytics
            </a>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Transaction</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="txType"
                      checked={Number(transactionTypeId) === 1}
                      onChange={() => setTransactionTypeId(1)}
                    />
                    Income
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="txType"
                      checked={Number(transactionTypeId) === 2}
                      onChange={() => setTransactionTypeId(2)}
                    />
                    Expense
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="amount">Amount ($)</label>
                <input
                  className="form-input"
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="category">Category</label>
                <select
                  className="form-select"
                  id="category"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.custom ? '(Custom)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="date">Date</label>
                <input
                  className="form-input"
                  id="date"
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="desc">Description</label>
                <input
                  className="form-input"
                  id="desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Weekly Groceries"
                />
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">New Custom Category</h3>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>&times;</button>
            </div>

            {catError && <div className="alert alert-error">{catError}</div>}

            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label className="form-label" htmlFor="catName">Category Name</label>
                <input
                  className="form-input"
                  id="catName"
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Subscriptions"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Associated Type</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="catType"
                      checked={Number(catTypeId) === 1}
                      onChange={() => setCatTypeId(1)}
                    />
                    Income
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="catType"
                      checked={Number(catTypeId) === 2}
                      onChange={() => setCatTypeId(2)}
                    />
                    Expense
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowCategoryModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
