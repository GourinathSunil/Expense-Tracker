import React, { useState, useEffect } from 'react';
import { CategoryPieChart, SpendingLineChart } from '../components/SvgCharts';

// Beautiful color scheme for categories
const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald Green
  '#f59e0b', // Amber/Yellow
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#fb923c', // Orange
  '#94a3b8'  // Slate
];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function Analytics({ token }) {
  const [categoriesData, setCategoriesData] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch category summaries
      const catRes = await fetch('http://localhost:8080/api/dashboard/categories', { headers });
      const catData = await catRes.json();

      // Fetch monthly trends
      const trendRes = await fetch('http://localhost:8080/api/dashboard/monthly-trend', { headers });
      const trendData = await trendRes.json();

      if (catRes.ok) setCategoriesData(catData);
      if (trendRes.ok) setMonthlyTrendData(trendData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (loading) {
    return <div className="empty-state"><p>Loading Analytics...</p></div>;
  }

  // Get available years for filters from the monthly trend data
  const years = Array.from(new Set(monthlyTrendData.map(item => item.yearVal))).sort((a, b) => b - a);

  // Filter category data based on user selections and select only 'EXPENSE' type for the pie chart
  const filteredCategorySummary = categoriesData
    .filter(item => item.transactionTypeName === 'EXPENSE')
    // Optionally filter by year and month if we had transactional breakdowns, but since it's an aggregate endpoint,
    // we show overall category spending here. Let's map it to include colors
    .map((item, index) => ({
      name: item.categoryName,
      value: item.totalAmount,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }));

  // Process and format monthly trend data
  // Combine separate income and expense records by year/month
  const monthlyMap = {};
  monthlyTrendData.forEach(item => {
    const key = `${item.yearVal}-${item.monthVal}`;
    if (!monthlyMap[key]) {
      monthlyMap[key] = {
        year: item.yearVal,
        month: item.monthVal,
        label: `${MONTH_NAMES[item.monthVal - 1]} ${item.yearVal}`,
        income: 0,
        expense: 0
      };
    }
    if (item.transactionTypeName === 'INCOME') {
      monthlyMap[key].income = item.totalAmount;
    } else if (item.transactionTypeName === 'EXPENSE') {
      monthlyMap[key].expense = item.totalAmount;
    }
  });

  // Convert monthlyMap to sorted list
  let sortedTrends = Object.values(monthlyMap).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Apply filters to trend chart if requested
  if (selectedYear !== 'All') {
    sortedTrends = sortedTrends.filter(t => t.year === Number(selectedYear));
    if (selectedMonth !== 'All') {
      sortedTrends = sortedTrends.filter(t => t.month === Number(selectedMonth));
    }
  }

  const totalFilteredExpense = filteredCategorySummary.reduce((acc, c) => acc + c.value, 0);

  return (
    <div>
      <div className="section-header">
        <h1 className="auth-title" style={{ textAlign: 'left', margin: 0 }}>Analytics</h1>
      </div>

      {/* Filter controls */}
      <div className="filter-bar" style={{ marginBottom: '2rem' }}>
        <div className="filter-item small">
          <label className="form-label" htmlFor="analyticsYear">Filter Year</label>
          <select
            id="analyticsYear"
            className="form-select"
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth('All'); }}
          >
            <option value="All">All Years</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {selectedYear !== 'All' && (
          <div className="filter-item small">
            <label className="form-label" htmlFor="analyticsMonth">Filter Month</label>
            <select
              id="analyticsMonth"
              className="form-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              {MONTH_NAMES.map((m, index) => (
                <option key={index} value={index + 1}>{m}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ flex: 1 }} />
        
        <div className="filter-item actions">
          <button className="btn btn-secondary" onClick={() => { setSelectedYear('All'); setSelectedMonth('All'); }}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-grid">
        {/* Spending trends (Line chart) */}
        <div className="analytics-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title">Income vs Expense Trend</h3>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--income-color)', fontWeight: '600' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--income-color)', borderRadius: '50%' }} />
                Income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--expense-color)', fontWeight: '600' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--expense-color)', borderRadius: '50%' }} />
                Expense
              </span>
            </div>
          </div>
          <SpendingLineChart data={sortedTrends} />
        </div>

        {/* Expense categories (Pie chart) */}
        <div className="analytics-card">
          <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Expense Breakdown</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Total Expense: ${totalFilteredExpense.toFixed(2)}
          </p>
          <CategoryPieChart data={filteredCategorySummary} />
        </div>
      </div>
    </div>
  );
}
