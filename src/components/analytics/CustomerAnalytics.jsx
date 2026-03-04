import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpDown, ChevronDown, ChevronUp, Users, DollarSign, TrendingUp, Star } from 'lucide-react';
import { parsePrice } from '../../hooks/useDataValidator';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1', '#84cc16', '#f97316'];
const ANOMALY_THRESHOLD = 100000;
const SYNTHETIC_NAMES = ['unknown', 'extra print', 'historical import'];

const fmt = (n) => '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtPct = (n) => (Number(n || 0)).toFixed(1) + '%';

export default function CustomerAnalytics({ orders = [], archivedOrders = [] }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [sortField, setSortField] = useState('totalSpent');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // 1. Combine shipped orders, deduplicate by orderId, skip anomalies
  const allShippedOrders = useMemo(() => {
    const shipped = orders.filter(o => o.status === 'shipped');
    const archived = (archivedOrders || []).filter(o => o.status === 'shipped');
    const combined = [...shipped, ...archived];

    // Deduplicate by orderId
    const seen = new Set();
    const deduped = [];
    combined.forEach(order => {
      const id = order.orderId || order.id;
      if (seen.has(id)) return;
      seen.add(id);

      const price = parsePrice(order.price);
      if (price > ANOMALY_THRESHOLD || price < 0) return;

      deduped.push(order);
    });

    return deduped;
  }, [orders, archivedOrders]);

  // 2. Customer database - group by buyerName
  const customerDatabase = useMemo(() => {
    const db = {};

    allShippedOrders.forEach(order => {
      const name = (order.buyerName || '').trim();
      if (!name || SYNTHETIC_NAMES.includes(name.toLowerCase())) return;

      if (!db[name]) {
        db[name] = {
          name,
          totalSpent: 0,
          orderCount: 0,
          orders: [],
          firstOrder: null,
          lastOrder: null,
          items: {},
          colors: {},
        };
      }

      const c = db[name];
      const price = parsePrice(order.price);
      c.totalSpent += price;
      c.orderCount += 1;
      c.orders.push(order);

      const orderDate = order.orderDate || order.date;
      if (orderDate) {
        const d = new Date(orderDate);
        if (!isNaN(d)) {
          if (!c.firstOrder || d < new Date(c.firstOrder)) c.firstOrder = orderDate;
          if (!c.lastOrder || d > new Date(c.lastOrder)) c.lastOrder = orderDate;
        }
      }

      const item = order.item || 'Unknown';
      c.items[item] = (c.items[item] || 0) + 1;

      const color = order.color || 'Unknown';
      c.colors[color] = (c.colors[color] || 0) + 1;
    });

    // Compute derived fields
    const now = new Date();
    Object.values(db).forEach(c => {
      c.avgOrderValue = c.orderCount > 0 ? c.totalSpent / c.orderCount : 0;

      const itemEntries = Object.entries(c.items);
      c.favoriteProduct = itemEntries.length > 0
        ? itemEntries.sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

      const colorEntries = Object.entries(c.colors);
      c.favoriteColor = colorEntries.length > 0
        ? colorEntries.sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

      c.daysSinceLastOrder = c.lastOrder
        ? Math.floor((now - new Date(c.lastOrder)) / (1000 * 60 * 60 * 24))
        : 999;
    });

    return db;
  }, [allShippedOrders]);

  // 3. KPI data
  const kpiData = useMemo(() => {
    const customers = Object.values(customerDatabase);
    const total = customers.length;
    const repeat = customers.filter(c => c.orderCount > 1).length;
    const repeatRate = total > 0 ? (repeat / total) * 100 : 0;
    const avgLTV = total > 0 ? customers.reduce((s, c) => s + c.totalSpent, 0) / total : 0;
    const topCustomer = customers.sort((a, b) => b.totalSpent - a.totalSpent)[0] || null;

    // Segmentation
    const now = new Date();
    const segments = { new: [], oneTime: [], returning: [], loyal: [], highValue: [] };

    // High-value threshold: top 10% by spend
    const sortedBySpend = [...customers].sort((a, b) => b.totalSpent - a.totalSpent);
    const hvThreshold = sortedBySpend.length > 0
      ? sortedBySpend[Math.max(0, Math.floor(sortedBySpend.length * 0.1) - 1)].totalSpent
      : Infinity;

    customers.forEach(c => {
      const daysSinceFirst = c.firstOrder
        ? Math.floor((now - new Date(c.firstOrder)) / (1000 * 60 * 60 * 24))
        : 999;

      if (c.totalSpent >= hvThreshold && sortedBySpend.length >= 10) segments.highValue.push(c);
      if (daysSinceFirst <= 30) segments.new.push(c);
      else if (c.orderCount === 1) segments.oneTime.push(c);
      else if (c.orderCount >= 4) segments.loyal.push(c);
      else segments.returning.push(c);
    });

    return { total, repeat, repeatRate, avgLTV, topCustomer, segments };
  }, [customerDatabase]);

  // 4. Chart data
  const chartData = useMemo(() => {
    const customers = Object.values(customerDatabase);

    // LTV distribution histogram
    const buckets = [
      { label: '$0-25', min: 0, max: 25, count: 0 },
      { label: '$25-50', min: 25, max: 50, count: 0 },
      { label: '$50-100', min: 50, max: 100, count: 0 },
      { label: '$100-200', min: 100, max: 200, count: 0 },
      { label: '$200-500', min: 200, max: 500, count: 0 },
      { label: '$500+', min: 500, max: Infinity, count: 0 },
    ];
    customers.forEach(c => {
      const b = buckets.find(b => c.totalSpent >= b.min && c.totalSpent < b.max);
      if (b) b.count++;
    });
    const ltvDistribution = buckets.map(b => ({ name: b.label, customers: b.count }));

    // Repeat vs one-time pie
    const oneTime = customers.filter(c => c.orderCount === 1).length;
    const repeatCount = customers.filter(c => c.orderCount > 1).length;
    const repeatPie = [
      { name: 'One-Time', value: oneTime },
      { name: 'Repeat', value: repeatCount },
    ];

    // Monthly new vs returning (stacked bar)
    const firstSeenMap = {};
    const monthlyData = {};

    // Sort orders chronologically to correctly track first-seen
    const sorted = [...allShippedOrders].sort((a, b) => {
      const da = new Date(a.orderDate || a.date || 0);
      const db = new Date(b.orderDate || b.date || 0);
      return da - db;
    });

    sorted.forEach(order => {
      const name = (order.buyerName || '').trim();
      if (!name || SYNTHETIC_NAMES.includes(name.toLowerCase())) return;

      const d = new Date(order.orderDate || order.date);
      if (isNaN(d)) return;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) monthlyData[monthKey] = { month: monthKey, new: 0, returning: 0 };

      if (!firstSeenMap[name]) {
        firstSeenMap[name] = monthKey;
        monthlyData[monthKey].new++;
      } else if (firstSeenMap[name] !== monthKey) {
        monthlyData[monthKey].returning++;
      }
    });

    const monthlyNewReturning = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    return { ltvDistribution, repeatPie, monthlyNewReturning };
  }, [customerDatabase, allShippedOrders]);

  // 5. Cohort data
  const cohortData = useMemo(() => {
    const customers = Object.values(customerDatabase);
    const cohorts = {};

    customers.forEach(c => {
      if (!c.firstOrder) return;
      const fd = new Date(c.firstOrder);
      if (isNaN(fd)) return;
      const cohortKey = `${fd.getFullYear()}-${String(fd.getMonth() + 1).padStart(2, '0')}`;

      if (!cohorts[cohortKey]) cohorts[cohortKey] = { month: cohortKey, customers: [] };
      cohorts[cohortKey].customers.push(c);
    });

    return Object.values(cohorts)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(cohort => {
        const size = cohort.customers.length;
        const retention = [];
        const cohortDate = new Date(cohort.month + '-01');

        for (let offset = 1; offset <= 12; offset++) {
          let count = 0;
          cohort.customers.forEach(c => {
            const hasOrder = c.orders.some(o => {
              const od = new Date(o.orderDate || o.date);
              if (isNaN(od)) return false;
              const monthDiff = (od.getFullYear() - cohortDate.getFullYear()) * 12 +
                (od.getMonth() - cohortDate.getMonth());
              return monthDiff === offset;
            });
            if (hasOrder) count++;
          });
          retention.push({ monthOffset: offset, count, rate: size > 0 ? (count / size) * 100 : 0 });
        }

        return { month: cohort.month, size, retention };
      });
  }, [customerDatabase]);

  // 6. RFM data
  const rfmData = useMemo(() => {
    const customers = Object.values(customerDatabase);
    if (customers.length === 0) return { segments: [], customers: [] };

    // Get arrays for quintile calculation
    const recencies = customers.map(c => c.daysSinceLastOrder).sort((a, b) => a - b);
    const frequencies = customers.map(c => c.orderCount).sort((a, b) => a - b);
    const monetaries = customers.map(c => c.totalSpent).sort((a, b) => a - b);

    const quintile = (arr, val, reverse = false) => {
      const pos = arr.indexOf(val);
      const pct = arr.length > 1 ? pos / (arr.length - 1) : 0.5;
      const score = Math.ceil(pct * 5) || 1;
      return reverse ? 6 - score : score;
    };

    const scored = customers.map(c => {
      const R = quintile(recencies, c.daysSinceLastOrder, true); // lower days = higher score
      const F = quintile(frequencies, c.orderCount, false);
      const M = quintile(monetaries, c.totalSpent, false);
      const total = R + F + M;

      let segment;
      if (total >= 13) segment = 'Champions';
      else if (R >= 4 && F >= 3) segment = 'Loyal';
      else if (R >= 4 && F <= 2) segment = 'Recent';
      else if (R <= 2 && F >= 3) segment = 'At Risk';
      else if (R <= 2 && F <= 2 && M >= 3) segment = "Can't Lose";
      else if (total <= 6) segment = 'Lost';
      else segment = 'Potential';

      return { ...c, R, F, M, total, segment };
    });

    // Segment distribution
    const segCounts = {};
    scored.forEach(c => {
      segCounts[c.segment] = (segCounts[c.segment] || 0) + 1;
    });
    const segments = Object.entries(segCounts).map(([name, value]) => ({ name, value }));

    return { segments, customers: scored };
  }, [customerDatabase]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortData = (arr) => {
    return [...arr].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortHeader = ({ field, label }) => (
    <th
      onClick={() => handleSort(field)}
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        userSelect: 'none',
        background: sortField === field ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
        borderBottom: '2px solid #e2e8f0'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        <ArrowUpDown size={14} style={{
          opacity: sortField === field ? 1 : 0.3,
          transform: sortField === field && sortDirection === 'asc' ? 'rotate(180deg)' : 'none'
        }} />
      </div>
    </th>
  );

  const styles = {
    container: { padding: '24px' },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '24px', flexWrap: 'wrap', gap: '16px',
    },
    tabs: { display: 'flex', gap: '8px' },
    tab: (active) => ({
      padding: '10px 20px', border: 'none', borderRadius: '8px',
      background: active ? '#6366f1' : '#f1f5f9', color: active ? 'white' : '#64748b',
      cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center',
      gap: '8px', transition: 'all 0.2s ease',
    }),
    card: {
      background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
      overflow: 'hidden', marginBottom: '24px',
    },
    cardHeader: {
      padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    cardTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', margin: 0 },
    table: { width: '100%', borderCollapse: 'collapse' },
    td: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9' },
    badge: (color) => ({
      display: 'inline-block', padding: '4px 12px', borderRadius: '16px',
      fontSize: '12px', fontWeight: '500', background: color + '20', color: color,
    }),
    expandRow: { background: '#f8fafc', padding: '16px' },
    subTable: { width: '100%', marginTop: '8px', fontSize: '13px' },
    chartContainer: { padding: '20px', height: '300px' },
    statsGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px', marginBottom: '24px',
    },
    statCard: {
      background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px',
    },
    statLabel: { fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' },
    statValue: { fontSize: '1.75rem', fontWeight: '700', color: '#1e293b' },
  };

  const SEGMENT_COLORS = {
    Champions: '#10b981',
    Loyal: '#3b82f6',
    Recent: '#8b5cf6',
    'At Risk': '#f59e0b',
    "Can't Lose": '#ef4444',
    Lost: '#94a3b8',
    Potential: '#14b8a6',
  };

  const sortedCustomers = sortData(Object.values(customerDatabase));
  const sortedRfmCustomers = sortData(rfmData.customers);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Customer Analytics</h2>
        <div style={styles.tabs}>
          <button style={styles.tab(activeSection === 'overview')} onClick={() => setActiveSection('overview')}>
            <Users size={16} /> Overview
          </button>
          <button style={styles.tab(activeSection === 'segments')} onClick={() => setActiveSection('segments')}>
            <Star size={16} /> Segments & Cohorts
          </button>
          <button style={styles.tab(activeSection === 'rfm')} onClick={() => setActiveSection('rfm')}>
            <TrendingUp size={16} /> RFM Analysis
          </button>
        </div>
      </div>

      {/* ===== TAB A: OVERVIEW ===== */}
      {activeSection === 'overview' && (
        <>
          {/* KPI Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Customers</div>
              <div style={styles.statValue}>{kpiData.total.toLocaleString()}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Repeat Rate</div>
              <div style={styles.statValue}>{fmtPct(kpiData.repeatRate)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Avg Lifetime Value</div>
              <div style={styles.statValue}>{fmt(kpiData.avgLTV)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Top Customer</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>
                {kpiData.topCustomer ? kpiData.topCustomer.name : 'N/A'}
              </div>
              {kpiData.topCustomer && (
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                  {fmt(kpiData.topCustomer.totalSpent)} ({kpiData.topCustomer.orderCount} orders)
                </div>
              )}
            </div>
          </div>

          {/* Charts: 2-col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* LTV Distribution */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>LTV Distribution</h3>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.ltvDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="customers" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Repeat vs One-Time */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Repeat vs One-Time</h3>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.repeatPie}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {chartData.repeatPie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly New vs Returning - full width */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Monthly New vs Returning Customers</h3>
            </div>
            <div style={{ ...styles.chartContainer, height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlyNewReturning}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="new" stackId="a" fill="#10b981" name="New Customers" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="returning" stackId="a" fill="#3b82f6" name="Returning Customers" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Customers Table */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Top Customers</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', width: '40px' }}></th>
                    <SortHeader field="name" label="Customer" />
                    <SortHeader field="orderCount" label="Orders" />
                    <SortHeader field="totalSpent" label="Total Spent" />
                    <SortHeader field="avgOrderValue" label="Avg Order" />
                    <SortHeader field="favoriteProduct" label="Favorite Product" />
                    <SortHeader field="daysSinceLastOrder" label="Last Order" />
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomers.slice(0, 50).map(c => (
                    <>
                      <tr
                        key={c.name}
                        onClick={() => setExpandedCustomer(expandedCustomer === c.name ? null : c.name)}
                        style={{ cursor: 'pointer', background: expandedCustomer === c.name ? '#f8fafc' : 'transparent' }}
                      >
                        <td style={styles.td}>
                          {expandedCustomer === c.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td style={{ ...styles.td, fontWeight: '600' }}>{c.name}</td>
                        <td style={styles.td}>{c.orderCount}</td>
                        <td style={styles.td}>{fmt(c.totalSpent)}</td>
                        <td style={styles.td}>{fmt(c.avgOrderValue)}</td>
                        <td style={styles.td}>{c.favoriteProduct}</td>
                        <td style={styles.td}>
                          {c.daysSinceLastOrder < 999 ? `${c.daysSinceLastOrder}d ago` : 'N/A'}
                        </td>
                      </tr>
                      {expandedCustomer === c.name && (
                        <tr key={`${c.name}-expanded`}>
                          <td colSpan={7} style={styles.expandRow}>
                            <div style={{ fontWeight: '600', marginBottom: '12px', color: '#6366f1' }}>
                              Order History ({c.orders.length} orders)
                            </div>
                            <table style={styles.subTable}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Item</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Color</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.orders
                                  .sort((a, b) => new Date(b.orderDate || b.date || 0) - new Date(a.orderDate || a.date || 0))
                                  .map((o, i) => (
                                    <tr key={i}>
                                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                        {o.orderDate || o.date || 'N/A'}
                                      </td>
                                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                        {o.item || 'N/A'}
                                      </td>
                                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                        {o.color || 'N/A'}
                                      </td>
                                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                        {fmt(parsePrice(o.price))}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== TAB B: SEGMENTS & COHORTS ===== */}
      {activeSection === 'segments' && (
        <>
          {/* Segment Cards */}
          <div style={{ ...styles.statsGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[
              { key: 'new', label: 'New', color: '#10b981', desc: 'First order <30 days' },
              { key: 'oneTime', label: 'One-Time', color: '#94a3b8', desc: '1 order only' },
              { key: 'returning', label: 'Returning', color: '#3b82f6', desc: '2-3 orders' },
              { key: 'loyal', label: 'Loyal', color: '#8b5cf6', desc: '4+ orders' },
              { key: 'highValue', label: 'High-Value', color: '#f59e0b', desc: 'Top 10% by spend' },
            ].map(seg => {
              const count = kpiData.segments[seg.key].length;
              const pct = kpiData.total > 0 ? (count / kpiData.total) * 100 : 0;
              return (
                <div key={seg.key} style={{ ...styles.statCard, borderLeft: `4px solid ${seg.color}` }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>{seg.desc}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: seg.color }}>{seg.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginTop: '8px' }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{fmtPct(pct)} of total</div>
                </div>
              );
            })}
          </div>

          {/* Cohort Retention Heatmap */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Cohort Retention</h3>
            </div>
            <div style={{ overflowX: 'auto', padding: '16px' }}>
              {cohortData.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Not enough data to show cohort retention
                </div>
              ) : (
                <table style={{ ...styles.table, fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                        Cohort
                      </th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>
                        Size
                      </th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                          M{i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map(cohort => (
                      <tr key={cohort.month}>
                        <td style={{ padding: '8px 12px', fontWeight: '600', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                          {cohort.month}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                          {cohort.size}
                        </td>
                        {cohort.retention.map((r, i) => {
                          const intensity = Math.min(r.rate / 50, 1); // 50% = max green
                          const bg = r.count > 0
                            ? `rgba(16, 185, 129, ${0.1 + intensity * 0.6})`
                            : 'transparent';
                          return (
                            <td
                              key={i}
                              style={{
                                padding: '8px 12px',
                                textAlign: 'center',
                                borderBottom: '1px solid #f1f5f9',
                                background: bg,
                                fontWeight: r.count > 0 ? '600' : '400',
                                color: r.count > 0 ? '#065f46' : '#cbd5e1',
                                fontSize: '12px',
                              }}
                              title={`${r.count} of ${cohort.size} returned`}
                            >
                              {r.count > 0 ? fmtPct(r.rate) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== TAB C: RFM ANALYSIS ===== */}
      {activeSection === 'rfm' && (
        <>
          {/* RFM Segment Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>RFM Segment Distribution</h3>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rfmData.segments}
                      cx="50%" cy="50%"
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {rfmData.segments.map((entry, i) => (
                        <Cell key={i} fill={SEGMENT_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RFM Legend / Guide */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>RFM Scoring Guide</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Each customer is scored 1-5 on Recency, Frequency, and Monetary value.
                </div>
                {Object.entries(SEGMENT_COLORS).map(([seg, color]) => (
                  <div key={seg} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={styles.badge(color)}>{seg}</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {seg === 'Champions' && 'Total score 13+ — best customers'}
                      {seg === 'Loyal' && 'High recency (4+) & frequency (3+)'}
                      {seg === 'Recent' && 'High recency (4+), low frequency (≤2)'}
                      {seg === 'At Risk' && 'Low recency (≤2), high frequency (3+)'}
                      {seg === "Can't Lose" && 'Low recency (≤2), low frequency (≤2), high monetary (3+)'}
                      {seg === 'Lost' && 'Total score ≤6 — least engaged'}
                      {seg === 'Potential' && 'Everyone else — room to grow'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RFM Customer Table */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>RFM Customer Scores</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <SortHeader field="name" label="Customer" />
                    <SortHeader field="R" label="R" />
                    <SortHeader field="F" label="F" />
                    <SortHeader field="M" label="M" />
                    <SortHeader field="total" label="Score" />
                    <SortHeader field="segment" label="Segment" />
                    <SortHeader field="totalSpent" label="Total Spent" />
                    <SortHeader field="orderCount" label="Orders" />
                    <SortHeader field="daysSinceLastOrder" label="Last Order" />
                  </tr>
                </thead>
                <tbody>
                  {sortedRfmCustomers.slice(0, 100).map(c => (
                    <tr key={c.name}>
                      <td style={{ ...styles.td, fontWeight: '600' }}>{c.name}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{c.R}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{c.F}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{c.M}</td>
                      <td style={{ ...styles.td, textAlign: 'center', fontWeight: '700' }}>{c.total}</td>
                      <td style={styles.td}>
                        <span style={styles.badge(SEGMENT_COLORS[c.segment] || '#64748b')}>{c.segment}</span>
                      </td>
                      <td style={styles.td}>{fmt(c.totalSpent)}</td>
                      <td style={styles.td}>{c.orderCount}</td>
                      <td style={styles.td}>
                        {c.daysSinceLastOrder < 999 ? `${c.daysSinceLastOrder}d ago` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
