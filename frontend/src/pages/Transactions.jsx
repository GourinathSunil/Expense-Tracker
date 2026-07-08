import React, { useState, useEffect } from 'react';

export default function Transactions({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [size] = useState(10); // Page size

  // Filter states
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionTypeId, setTransactionTypeId] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Sorting states
  const [sortBy, setSortBy] = useState('transactionDate');
  const [sortDir, setSortDir] = useState('desc');

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editTypeId, setEditTypeId] = useState(2);
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editError, setEditError] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Build filter query parameters
      let url = `http://localhost:8080/api/transactions?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
      if (query) url += `&query=${encodeURIComponent(query)}`;
      if (categoryId) url += `&categoryId=${categoryId}`;
      if (transactionTypeId) url += `&transactionTypeId=${transactionTypeId}`;
      if (month) url += `&month=${month}`;
      if (year) url += `&year=${year}`;

      const res = await fetch(url, { headers });
      const data = await res.json();
      
      if (res.ok) {
        setTransactions(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, sortBy, sortDir, categoryId, transactionTypeId, month, year, token]);

  useEffect(() => {
    fetchCategories();
  }, [token]);

  // Set default category in edit form when editType changes
  useEffect(() => {
    if (editingTx) {
      const available = categories.filter(c => c.transactionTypeId === Number(editTypeId));
      if (available.length > 0) {
        // Only override if the current selection is invalid for the new type
        const matchesCurrent = available.some(c => c.id === Number(editCategoryId));
        if (!matchesCurrent) {
          setEditCategoryId(available[0].id);
        }
      } else {
        setEditCategoryId('');
      }
    }
  }, [editTypeId, categories, editingTx]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchTransactions();
  };

  const handleClearFilters = () => {
    setQuery('');
    setCategoryId('');
    setTransactionTypeId('');
    setMonth('');
    setYear('');
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete transaction');
      }

      fetchTransactions();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (t) => {
    setEditingTx(t);
    setEditAmount(t.amount.toString());
    setEditTypeId(t.transactionTypeId);
    setEditCategoryId(t.categoryId);
    setEditDescription(t.description || '');
    setEditDate(t.transactionDate);
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editAmount || Number(editAmount) <= 0) {
      setEditError('Amount must be positive');
      return;
    }

    if (!editCategoryId) {
      setEditError('Please select a category');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/transactions/${editingTx.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(editAmount),
          transactionTypeId: Number(editTypeId),
          categoryId: Number(editCategoryId),
          description: editDescription,
          transactionDate: editDate,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update transaction');
      }

      setShowEditModal(false);
      setEditingTx(null);
      fetchTransactions();
    } catch (err) {
      setEditError(err.message);
    }
  };

  const editAvailableCategories = categories.filter(c => c.transactionTypeId === Number(editTypeId));

  // Range of years for filter (current year - 5 to current year + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div>
      <div className="section-header">
        <h1 className="auth-title" style={{ textAlign: 'left', margin: 0 }}>Transactions</h1>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div className="filter-item">
          <label className="form-label" htmlFor="searchQuery">Search</label>
          <input
            id="searchQuery"
            className="form-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search description..."
          />
        </div>

        <div className="filter-item">
          <label className="form-label" htmlFor="filterType">Type</label>
          <select
            id="filterType"
            className="form-select"
            value={transactionTypeId}
            onChange={(e) => { setTransactionTypeId(e.target.value); setPage(0); }}
          >
            <option value="">All Types</option>
            <option value="1">Income</option>
            <option value="2">Expense</option>
          </select>
        </div>

        <div className="filter-item">
          <label className="form-label" htmlFor="filterCategory">Category</label>
          <select
            id="filterCategory"
            className="form-select"
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.transactionTypeName})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item small">
          <label className="form-label" htmlFor="filterMonth">Month</label>
          <select
            id="filterMonth"
            className="form-select"
            value={month}
            onChange={(e) => { setMonth(e.target.value); setPage(0); }}
          >
            <option value="">All</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-item small">
          <label className="form-label" htmlFor="filterYear">Year</label>
          <select
            id="filterYear"
            className="form-select"
            value={year}
            onChange={(e) => { setYear(e.target.value); setPage(0); }}
          >
            <option value="">All</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="filter-item actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" type="button" onClick={handleClearFilters}>
            Clear
          </button>
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </div>
      </form>

      {/* Sorting bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Sort By:</span>
          <select className="form-select" style={{ padding: '0.25rem 0.5rem', width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="transactionDate">Date</option>
            <option value="amount">Amount</option>
            <option value="description">Description</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Order:</span>
          <select className="form-select" style={{ padding: '0.25rem 0.5rem', width: 'auto' }} value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="empty-state"><p>Loading Transactions...</p></div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No transactions found</p>
          <p className="empty-state-subtitle">Try adjusting your filters or add a new transaction.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.transactionDate}</td>
                    <td>{t.description || '—'}</td>
                    <td>
                      <span className={`badge ${t.transactionTypeName === 'INCOME' ? 'badge-income' : 'badge-expense'}`}>
                        {t.transactionTypeName}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-category">{t.categoryName}</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className={`amount-text ${t.transactionTypeName.toLowerCase()}`}>
                      {t.transactionTypeName === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons-cell" style={{ justifyContent: 'center' }}>
                        <button className="btn btn-secondary btn-small" onClick={() => openEditModal(t)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-small" onClick={() => handleDelete(t.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination">
            <div className="pagination-info">
              Showing page {page + 1} of {totalPages} ({totalElements} total items)
            </div>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary"
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(prev - 1, 0))}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Transaction</h3>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingTx(null); }}>&times;</button>
            </div>

            {editError && <div className="alert alert-error">{editError}</div>}

            <form onSubmit={handleUpdateTransaction}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="editType"
                      checked={Number(editTypeId) === 1}
                      onChange={() => setEditTypeId(1)}
                    />
                    Income
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="editType"
                      checked={Number(editTypeId) === 2}
                      onChange={() => setEditTypeId(2)}
                    />
                    Expense
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editAmount">Amount ($)</label>
                <input
                  className="form-input"
                  id="editAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editCategory">Category</label>
                <select
                  className="form-select"
                  id="editCategory"
                  required
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                >
                  {editAvailableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.custom ? '(Custom)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editDate">Date</label>
                <input
                  className="form-input"
                  id="editDate"
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editDesc">Description</label>
                <input
                  className="form-input"
                  id="editDesc"
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description"
                />
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => { setShowEditModal(false); setEditingTx(null); }}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
