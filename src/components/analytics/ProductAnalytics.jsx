import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpDown, TrendingUp, Palette, Package, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1', '#84cc16', '#f97316'];

export default function ProductAnalytics({ orders = [], archivedOrders = [], models = [] }) {
  const [activeTab, setActiveTab] = useState('colors');
  const [sortField, setSortField] = useState('revenue');
  const [sortDirection, setSortDirection] = useState('desc');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [expandedModel, setExpandedModel] = useState(null);

  // Combine active and archived orders
  const allOrders = useMemo(() => {
    const shipped = orders.filter(o => o.status === 'shipped');
    const archived = archivedOrders || [];
    return [...shipped, ...archived];
  }, [orders, archivedOrders]);

  // Filter orders by date
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return allOrders.filter(order => {
      const orderDate = new Date(order.shippedAt || order.createdAt || order.archivedAt);
      if (isNaN(orderDate.getTime())) return false;

      switch (dateFilter) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        case '3months':
          const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          return orderDate >= threeMonthsAgo;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return orderDate >= yearAgo;
        default:
          return true;
      }
    });
  }, [allOrders, dateFilter]);

  // Color Analytics
  const colorStats = useMemo(() => {
    const stats = {};
    filteredOrders.forEach(order => {
      const color = (order.color || 'Unknown').trim();
      if (!color) return;

      const normalizedColor = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
      const priceStr = (order.price || '0').toString().replace(/[^0-9.]/g, '');
      const revenue = parseFloat(priceStr) || 0;
      const quantity = order.quantity || 1;
      const item = order.item || 'Unknown';

      if (!stats[normalizedColor]) {
        stats[normalizedColor] = {
          color: normalizedColor,
          orders: 0,
          quantity: 0,
          revenue: 0,
          models: {}
        };
      }
      stats[normalizedColor].orders += 1;
      stats[normalizedColor].quantity += quantity;
      stats[normalizedColor].revenue += revenue;

      // Track by model
      if (!stats[normalizedColor].models[item]) {
        stats[normalizedColor].models[item] = { orders: 0, quantity: 0, revenue: 0 };
      }
      stats[normalizedColor].models[item].orders += 1;
      stats[normalizedColor].models[item].quantity += quantity;
      stats[normalizedColor].models[item].revenue += revenue;
    });
    return Object.values(stats);
  }, [filteredOrders]);

  // Helper to get base model name (before "|" separator)
  const getBaseModelName = (fullName) => {
    if (!fullName) return 'Unknown';
    // Split by "|" and take the first part, trim whitespace
    const baseName = fullName.split('|')[0].trim();
    return baseName || fullName;
  };

  // Model Analytics - groups variants together by base name
  const modelStats = useMemo(() => {
    const stats = {};
    filteredOrders.forEach(order => {
      const fullItem = order.item || 'Unknown';
      const baseModel = getBaseModelName(fullItem);
      const priceStr = (order.price || '0').toString().replace(/[^0-9.]/g, '');
      const revenue = parseFloat(priceStr) || 0;
      const quantity = order.quantity || 1;
      const color = (order.color || 'Unknown').trim();
      const normalizedColor = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();

      if (!stats[baseModel]) {
        stats[baseModel] = {
          model: baseModel,
          fullNames: new Set(),
          orders: 0,
          quantity: 0,
          revenue: 0,
          avgPrice: 0,
          colors: {},
          variants: {}
        };
      }
      stats[baseModel].fullNames.add(fullItem);
      stats[baseModel].orders += 1;
      stats[baseModel].quantity += quantity;
      stats[baseModel].revenue += revenue;

      // Track colors per model
      if (!stats[baseModel].colors[normalizedColor]) {
        stats[baseModel].colors[normalizedColor] = { orders: 0, quantity: 0, revenue: 0 };
      }
      stats[baseModel].colors[normalizedColor].orders += 1;
      stats[baseModel].colors[normalizedColor].quantity += quantity;
      stats[baseModel].colors[normalizedColor].revenue += revenue;

      // Track variants (full names) per base model
      if (!stats[baseModel].variants[fullItem]) {
        stats[baseModel].variants[fullItem] = { orders: 0, quantity: 0, revenue: 0 };
      }
      stats[baseModel].variants[fullItem].orders += 1;
      stats[baseModel].variants[fullItem].quantity += quantity;
      stats[baseModel].variants[fullItem].revenue += revenue;
    });

    // Calculate averages and convert Sets to arrays
    Object.values(stats).forEach(s => {
      s.avgPrice = s.orders > 0 ? s.revenue / s.orders : 0;
      s.variantCount = s.fullNames.size;
      s.fullNames = Array.from(s.fullNames);
    });

    return Object.values(stats);
  }, [filteredOrders]);

  // Time Analytics
  const timeStats = useMemo(() => {
    const dayOfWeek = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const dayOfWeekRevenue = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const monthly = {};
    const hourly = {};

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    filteredOrders.forEach(order => {
      const date = new Date(order.shippedAt || order.createdAt || order.archivedAt);
      if (isNaN(date.getTime())) return;

      const priceStr = (order.price || '0').toString().replace(/[^0-9.]/g, '');
      const revenue = parseFloat(priceStr) || 0;

      // Day of week
      const day = dayNames[date.getDay()];
      dayOfWeek[day] += 1;
      dayOfWeekRevenue[day] += revenue;

      // Monthly
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[monthKey]) {
        monthly[monthKey] = { month: monthKey, orders: 0, revenue: 0 };
      }
      monthly[monthKey].orders += 1;
      monthly[monthKey].revenue += revenue;

      // Hourly
      const hour = date.getHours();
      if (!hourly[hour]) {
        hourly[hour] = { hour, orders: 0, revenue: 0 };
      }
      hourly[hour].orders += 1;
      hourly[hour].revenue += revenue;
    });

    return {
      dayOfWeek: Object.entries(dayOfWeek).map(([day, orders]) => ({
        day,
        orders,
        revenue: dayOfWeekRevenue[day],
        avgRevenue: orders > 0 ? dayOfWeekRevenue[day] / orders : 0
      })),
      monthly: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)),
      hourly: Object.values(hourly).sort((a, b) => a.hour - b.hour)
    };
  }, [filteredOrders]);

  // Sorting function
  const sortData = (data, field, direction) => {
    return [...data].sort((a, b) => {
      const aVal = a[field] || 0;
      const bVal = b[field] || 0;
      return direction === 'desc' ? bVal - aVal : aVal - bVal;
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
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
    container: {
      padding: '24px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px',
    },
    tabs: {
      display: 'flex',
      gap: '8px',
    },
    tab: (active) => ({
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      background: active ? '#6366f1' : '#f1f5f9',
      color: active ? 'white' : '#64748b',
      cursor: 'pointer',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    }),
    filters: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
    select: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      background: 'white',
      fontSize: '14px',
      cursor: 'pointer',
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      marginBottom: '24px',
    },
    cardHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #f1f5f9',
    },
    badge: (color) => ({
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '500',
      background: color + '20',
      color: color,
    }),
    expandRow: {
      background: '#f8fafc',
      padding: '16px',
    },
    subTable: {
      width: '100%',
      marginTop: '8px',
      fontSize: '13px',
    },
    chartContainer: {
      padding: '20px',
      height: '300px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '20px',
    },
    statLabel: {
      fontSize: '0.85rem',
      color: '#64748b',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '1.75rem',
      fontWeight: '700',
      color: '#1e293b',
    },
  };

  const sortedColorStats = sortData(colorStats, sortField, sortDirection);
  const sortedModelStats = sortData(modelStats, sortField, sortDirection);

  // Get unique models for filter
  const uniqueModels = [...new Set(filteredOrders.map(o => o.item).filter(Boolean))];

  return (
    <div style={styles.container}>
      {/* Header with Tabs and Filters */}
      <div style={styles.header}>
        <div style={styles.tabs}>
          <button style={styles.tab(activeTab === 'colors')} onClick={() => setActiveTab('colors')}>
            <Palette size={18} /> Colors
          </button>
          <button style={styles.tab(activeTab === 'models')} onClick={() => setActiveTab('models')}>
            <Package size={18} /> Models
          </button>
          <button style={styles.tab(activeTab === 'time')} onClick={() => setActiveTab('time')}>
            <Calendar size={18} /> Time Trends
          </button>
        </div>

        <div style={styles.filters}>
          <Filter size={18} style={{ color: '#64748b' }} />
          <select
            style={styles.select}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>

          {activeTab === 'colors' && (
            <select
              style={styles.select}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="all">All Models</option>
              {uniqueModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Orders</div>
          <div style={styles.statValue}>{filteredOrders.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Revenue</div>
          <div style={{ ...styles.statValue, color: '#10b981' }}>
            ${filteredOrders.reduce((sum, o) => {
              const price = parseFloat((o.price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
              return sum + price;
            }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Unique Colors</div>
          <div style={styles.statValue}>{colorStats.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Unique Models</div>
          <div style={styles.statValue}>{modelStats.length}</div>
        </div>
      </div>

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Color Distribution</h3>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sortedColorStats.slice(0, 10)}
                      dataKey="revenue"
                      nameKey="color"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sortedColorStats.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Top Colors by Revenue</h3>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedColorStats.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="color" width={80} />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Color Performance Table</h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Click headers to sort</span>
            </div>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ ...styles.td, fontWeight: '600' }}>Color</th>
                  <SortHeader field="orders" label="Orders" />
                  <SortHeader field="quantity" label="Units Sold" />
                  <SortHeader field="revenue" label="Revenue" />
                  <th style={{ ...styles.td, fontWeight: '600' }}>Avg/Order</th>
                </tr>
              </thead>
              <tbody>
                {sortedColorStats.map((stat, idx) => (
                  <tr key={stat.color} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={styles.td}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: COLORS[idx % COLORS.length],
                        }} />
                        {stat.color}
                      </span>
                    </td>
                    <td style={styles.td}>{stat.orders}</td>
                    <td style={styles.td}>{stat.quantity}</td>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#10b981' }}>
                      ${stat.revenue.toFixed(2)}
                    </td>
                    <td style={styles.td}>${(stat.revenue / stat.orders).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Top 10 Products by Revenue</h3>
            </div>
            <div style={{ ...styles.chartContainer, height: '450px', padding: '20px 20px 20px 10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedModelStats.slice(0, 10).map(s => ({
                    ...s,
                    shortName: s.model.length > 35 ? s.model.substring(0, 32) + '...' : s.model
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={200}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']}
                    labelFormatter={(label) => sortedModelStats.find(s => s.model.startsWith(label.replace('...', '')))?.model || label}
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="url(#colorGradient)"
                    radius={[0, 8, 8, 0]}
                    label={{
                      position: 'right',
                      formatter: (v) => `$${(v/1000).toFixed(1)}k`,
                      fill: '#64748b',
                      fontSize: 11
                    }}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Units Sold Card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Units Sold by Product</h3>
              </div>
              <div style={{ ...styles.chartContainer, height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedModelStats.slice(0, 8).map(s => ({
                      ...s,
                      shortName: s.model.length > 20 ? s.model.substring(0, 17) + '...' : s.model
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="shortName" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="quantity" name="Units" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Average Order Value</h3>
              </div>
              <div style={{ ...styles.chartContainer, height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedModelStats.slice(0, 8).map(s => ({
                      ...s,
                      shortName: s.model.length > 20 ? s.model.substring(0, 17) + '...' : s.model
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="shortName" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                    <Bar dataKey="avgPrice" name="Avg Price" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Model Performance Table</h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Click row to see color breakdown</span>
            </div>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ ...styles.td, fontWeight: '600', width: '30px' }}></th>
                  <th style={{ ...styles.td, fontWeight: '600' }}>Model</th>
                  <SortHeader field="orders" label="Orders" />
                  <SortHeader field="quantity" label="Units" />
                  <SortHeader field="revenue" label="Revenue" />
                  <SortHeader field="avgPrice" label="Avg Price" />
                </tr>
              </thead>
              <tbody>
                {sortedModelStats.map((stat, idx) => (
                  <>
                    <tr
                      key={stat.model}
                      style={{
                        background: idx % 2 === 0 ? 'white' : '#fafafa',
                        cursor: 'pointer'
                      }}
                      onClick={() => setExpandedModel(expandedModel === stat.model ? null : stat.model)}
                    >
                      <td style={styles.td}>
                        {expandedModel === stat.model ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td style={{ ...styles.td, fontWeight: '500', maxWidth: '300px' }} title={stat.fullNames?.join('\n') || stat.model}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {stat.model.length > 40 ? stat.model.substring(0, 37) + '...' : stat.model}
                          {stat.variantCount > 1 && (
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              background: '#e0e7ff',
                              color: '#4f46e5',
                              fontWeight: '600'
                            }}>
                              {stat.variantCount} variants
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>{stat.orders}</td>
                      <td style={styles.td}>{stat.quantity}</td>
                      <td style={{ ...styles.td, fontWeight: '600', color: '#10b981' }}>
                        ${stat.revenue.toFixed(2)}
                      </td>
                      <td style={styles.td}>${stat.avgPrice.toFixed(2)}</td>
                    </tr>
                    {expandedModel === stat.model && (
                      <tr key={`${stat.model}-expanded`}>
                        <td colSpan={6} style={styles.expandRow}>
                          {/* Variants Section - only show if more than 1 variant */}
                          {stat.variantCount > 1 && (
                            <>
                              <div style={{ fontWeight: '600', marginBottom: '12px', color: '#8b5cf6' }}>
                                Listing Variants ({stat.variantCount})
                              </div>
                              <table style={{ ...styles.subTable, marginBottom: '20px' }}>
                                <thead>
                                  <tr style={{ background: '#f3e8ff' }}>
                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Variant Name</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Orders</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Units</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Revenue</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>% of Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(stat.variants || {})
                                    .sort((a, b) => b[1].revenue - a[1].revenue)
                                    .map(([variant, variantData]) => (
                                      <tr key={variant}>
                                        <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                                          {variant.length > 60 ? variant.substring(0, 57) + '...' : variant}
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>{variantData.orders}</td>
                                        <td style={{ padding: '8px 12px' }}>{variantData.quantity}</td>
                                        <td style={{ padding: '8px 12px', color: '#8b5cf6' }}>${variantData.revenue.toFixed(2)}</td>
                                        <td style={{ padding: '8px 12px' }}>
                                          {((variantData.revenue / stat.revenue) * 100).toFixed(1)}%
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </>
                          )}

                          {/* Colors Section */}
                          <div style={{ fontWeight: '600', marginBottom: '12px', color: '#6366f1' }}>
                            Color Breakdown
                          </div>
                          <table style={styles.subTable}>
                            <thead>
                              <tr style={{ background: '#e0e7ff' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Color</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Orders</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Units</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Revenue</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>% of Model</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(stat.colors)
                                .sort((a, b) => b[1].revenue - a[1].revenue)
                                .map(([color, colorData]) => (
                                  <tr key={color}>
                                    <td style={{ padding: '8px 12px' }}>{color}</td>
                                    <td style={{ padding: '8px 12px' }}>{colorData.orders}</td>
                                    <td style={{ padding: '8px 12px' }}>{colorData.quantity}</td>
                                    <td style={{ padding: '8px 12px', color: '#10b981' }}>${colorData.revenue.toFixed(2)}</td>
                                    <td style={{ padding: '8px 12px' }}>
                                      {((colorData.revenue / stat.revenue) * 100).toFixed(1)}%
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
        </>
      )}

      {/* Time Trends Tab */}
      {activeTab === 'time' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Orders by Day of Week</h3>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeStats.dayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" name="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Revenue by Day of Week</h3>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeStats.dayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Monthly Trends</h3>
            </div>
            <div style={{ ...styles.chartContainer, height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeStats.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" tickFormatter={(v) => `$${v}`} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [name === 'revenue' ? `$${value.toFixed(2)}` : value, name]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Day of Week Performance</h3>
            </div>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ ...styles.td, fontWeight: '600' }}>Day</th>
                  <th style={{ ...styles.td, fontWeight: '600' }}>Orders</th>
                  <th style={{ ...styles.td, fontWeight: '600' }}>Revenue</th>
                  <th style={{ ...styles.td, fontWeight: '600' }}>Avg Order Value</th>
                </tr>
              </thead>
              <tbody>
                {timeStats.dayOfWeek.map((day, idx) => (
                  <tr key={day.day} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ ...styles.td, fontWeight: '500' }}>{day.day}</td>
                    <td style={styles.td}>{day.orders}</td>
                    <td style={{ ...styles.td, color: '#10b981', fontWeight: '600' }}>${day.revenue.toFixed(2)}</td>
                    <td style={styles.td}>${day.avgRevenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
