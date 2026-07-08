import React from 'react';

/**
 * Helper to get X and Y coordinates on a circle of radius 1,
 * offset by -0.25 (to start at 12 o'clock / top of circle).
 */
const getCoordinatesForPercent = (percent) => {
  const angle = 2 * Math.PI * (percent - 0.25);
  return [Math.cos(angle), Math.sin(angle)];
};

/**
 * Custom SVG Pie Chart Component
 * @param {Array} data - [{ name: string, value: number, color: string }]
 */
export const CategoryPieChart = ({ data }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-subtitle">No expense data available for charts</p>
      </div>
    );
  }

  let accumulatedPercent = 0;
  const cx = 100;
  const cy = 100;
  const r = 75;

  return (
    <div className="chart-container" style={{ flexDirection: 'column' }}>
      <svg width="220" height="220" viewBox="0 0 200 200" className="svg-chart">
        {data.map((item, index) => {
          if (item.value <= 0) return null;

          const startPercent = accumulatedPercent;
          const percentage = item.value / total;
          accumulatedPercent += percentage;
          const endPercent = accumulatedPercent;

          // If it's 100% of the pie, draw a simple circle
          if (percentage >= 0.999) {
            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={r}
                fill={item.color || '#6366f1'}
              />
            );
          }

          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(endPercent);

          const x1 = cx + startX * r;
          const y1 = cy + startY * r;
          const x2 = cx + endX * r;
          const y2 = cy + endY * r;

          const largeArcFlag = percentage > 0.5 ? 1 : 0;

          const pathData = [
            `M ${cx} ${cy}`,
            `L ${x1} ${y1}`,
            `A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              stroke="var(--bg-primary)"
              strokeWidth="1.5"
            >
              <title>{`${item.name}: $${item.value.toFixed(2)} (${(percentage * 100).toFixed(1)}%)`}</title>
            </path>
          );
        })}
      </svg>

      <div className="pie-chart-legend">
        {data.map((item, index) => (
          <div key={index} className="legend-item">
            <span className="legend-color-box" style={{ backgroundColor: item.color }} />
            <span>{`${item.name}: $${item.value.toFixed(2)}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Custom SVG Line Chart Component for Monthly spending trends
 * @param {Array} data - [{ label: string, income: number, expense: number }]
 */
export const SpendingLineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-subtitle">No monthly data available for trends</p>
      </div>
    );
  }

  // Find max values to scale chart
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    100 // default minimum ceiling
  );
  
  const chartHeight = 180;
  const chartWidth = 500;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = chartWidth - paddingLeft - paddingRight;

  // Generate coordinates for points
  const pointsIncome = [];
  const pointsExpense = [];
  
  data.forEach((item, index) => {
    // Distribute X evenly across graph width
    const x = paddingLeft + (index / Math.max(data.length - 1, 1)) * graphWidth;
    
    // Scale Y (SVG 0 is at the top, so we subtract from graph height)
    const yIncome = chartHeight - paddingBottom - (item.income / maxVal) * graphHeight;
    const yExpense = chartHeight - paddingBottom - (item.expense / maxVal) * graphHeight;

    pointsIncome.push({ x, y: yIncome, val: item.income, label: item.label });
    pointsExpense.push({ x, y: yExpense, val: item.expense, label: item.label });
  });

  const getPathData = (points) => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  // Generate Y-axis grid values (4 lines)
  const yTicks = [];
  for (let i = 0; i <= 4; i++) {
    const val = (maxVal / 4) * i;
    const y = chartHeight - paddingBottom - (val / maxVal) * graphHeight;
    yTicks.push({ val, y });
  }

  return (
    <div className="chart-container">
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="svg-chart">
        {/* Y Grid Lines */}
        {yTicks.map((tick, index) => (
          <g key={index}>
            <line
              x1={paddingLeft}
              y1={tick.y}
              x2={chartWidth - paddingRight}
              y2={tick.y}
              className="chart-grid-line"
            />
            <text
              x={paddingLeft - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="chart-text"
            >
              {`$${Math.round(tick.val)}`}
            </text>
          </g>
        ))}

        {/* X Labels */}
        {data.map((item, index) => {
          const x = paddingLeft + (index / Math.max(data.length - 1, 1)) * graphWidth;
          return (
            <text
              key={index}
              x={x}
              y={chartHeight - 10}
              textAnchor="middle"
              className="chart-text"
            >
              {item.label}
            </text>
          );
        })}

        {/* Axis Lines */}
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={chartHeight - paddingBottom}
          className="chart-axis-line"
        />
        <line
          x1={paddingLeft}
          y1={chartHeight - paddingBottom}
          x2={chartWidth - paddingRight}
          y2={chartHeight - paddingBottom}
          className="chart-axis-line"
        />

        {/* Income Line (Green) */}
        {pointsIncome.length > 1 && (
          <path
            d={getPathData(pointsIncome)}
            fill="none"
            stroke="var(--income-color)"
            strokeWidth="2.5"
          />
        )}

        {/* Expense Line (Red) */}
        {pointsExpense.length > 1 && (
          <path
            d={getPathData(pointsExpense)}
            fill="none"
            stroke="var(--expense-color)"
            strokeWidth="2.5"
          />
        )}

        {/* Income Points */}
        {pointsIncome.map((p, i) => (
          <circle
            key={`inc-${i}`}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill="var(--bg-secondary)"
            stroke="var(--income-color)"
            strokeWidth="2"
          >
            <title>{`Income - ${p.label}: $${p.val.toFixed(2)}`}</title>
          </circle>
        ))}

        {/* Expense Points */}
        {pointsExpense.map((p, i) => (
          <circle
            key={`exp-${i}`}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill="var(--bg-secondary)"
            stroke="var(--expense-color)"
            strokeWidth="2"
          >
            <title>{`Expense - ${p.label}: $${p.val.toFixed(2)}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

/**
 * Custom SVG Bar Chart Component comparing Income vs Expense totals
 * @param {number} income - total income
 * @param {number} expense - total expense
 */
export const IncomeVsExpenseBarChart = ({ income, expense }) => {
  const maxVal = Math.max(income, expense, 100);
  
  const chartHeight = 200;
  const chartWidth = 300;
  const barWidth = 45;
  const graphHeight = 130;
  const spacing = 60;
  
  const incHeight = (income / maxVal) * graphHeight;
  const expHeight = (expense / maxVal) * graphHeight;
  
  const incY = 160 - incHeight;
  const expY = 160 - expHeight;

  return (
    <div className="chart-container">
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="svg-chart">
        {/* Y Grids */}
        {[0, 0.5, 1].map((p, index) => {
          const val = maxVal * p;
          const y = 160 - p * graphHeight;
          return (
            <g key={index}>
              <line x1="40" y1={y} x2="260" y2={y} className="chart-grid-line" />
              <text x="32" y={y + 4} textAnchor="end" className="chart-text">
                {`$${Math.round(val)}`}
              </text>
            </g>
          );
        })}

        {/* Base line */}
        <line x1="40" y1="160" x2="260" y2="160" className="chart-axis-line" />

        {/* Income Bar (Green) */}
        <rect
          x={75}
          y={incY}
          width={barWidth}
          height={incHeight > 0 ? incHeight : 2}
          fill="var(--income-color)"
          rx="4"
        >
          <title>{`Total Income: $${income.toFixed(2)}`}</title>
        </rect>
        <text x={97} y="180" textAnchor="middle" className="chart-text" style={{ fontWeight: '500' }}>
          Income
        </text>
        <text x={97} y={incY - 8} textAnchor="middle" className="chart-text" style={{ fill: 'var(--text-primary)', fontWeight: '600' }}>
          {`$${income.toFixed(0)}`}
        </text>

        {/* Expense Bar (Red) */}
        <rect
          x={180}
          y={expY}
          width={barWidth}
          height={expHeight > 0 ? expHeight : 2}
          fill="var(--expense-color)"
          rx="4"
        >
          <title>{`Total Expense: $${expense.toFixed(2)}`}</title>
        </rect>
        <text x={202} y="180" textAnchor="middle" className="chart-text" style={{ fontWeight: '500' }}>
          Expense
        </text>
        <text x={202} y={expY - 8} textAnchor="middle" className="chart-text" style={{ fill: 'var(--text-primary)', fontWeight: '600' }}>
          {`$${expense.toFixed(0)}`}
        </text>
      </svg>
    </div>
  );
};
