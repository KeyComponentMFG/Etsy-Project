import { useState, useEffect } from 'react';
import {
  Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  DollarSign, Activity, Zap, RefreshCw, Wifi, WifiOff,
  ChevronDown, ChevronUp, Target, Lightbulb
} from 'lucide-react';
import { getOverview, checkApiHealth, reloadAnalytics, getMonthlyPerformance, getExpenseBreakdown, getCashFlow, getTopProducts, getProjections } from '../../lib/analyticsApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const HEALTH_METRIC_INFO = {
  'Revenue Trend': {
    description: 'Measures whether your revenue is growing, stable, or declining compared to recent months.',
    improve: 'Launch new products, run promotions, or optimize listings with better photos and SEO keywords.',
    good: 'Revenue is trending well. Keep momentum with seasonal products and repeat-customer engagement.',
  },
  'Profit Margin': {
    description: 'Percentage of revenue retained after all costs (materials, fees, shipping). Higher is better.',
    improve: 'Reduce material costs, negotiate shipping rates, raise prices on high-demand items, or cut low-margin products.',
    good: 'Strong margins. Consider reinvesting profits into inventory or marketing to scale.',
  },
  'Order Velocity': {
    description: 'How quickly orders are coming in relative to your historical average. Tracks sales momentum.',
    improve: 'Boost visibility with Etsy ads, social media promotion, or adding more product variety.',
    good: 'Great order flow. Make sure fulfillment can keep pace — consider batch processing.',
  },
  'Cash Position': {
    description: 'How many months of operating expenses your current cash reserves can cover.',
    improve: 'Build a cash buffer of 3+ months of expenses. Reduce unnecessary spending and time owner draws.',
    good: 'Healthy cash reserves. Consider investing surplus into growth or keeping it as a safety buffer.',
  },
  'Inventory Health': {
    description: 'Tracks stock levels across your materials. Penalizes low-stock and out-of-stock items.',
    improve: 'Reorder low-stock filaments and supplies. Set up reorder alerts to avoid stockouts.',
    good: 'Inventory is well-stocked. Review slow-moving items to free up capital.',
  },
  'Fee Efficiency': {
    description: 'How much of your revenue goes to Etsy fees, payment processing, and advertising costs.',
    improve: 'Reduce ad spend on low-converting listings. Use Etsy\'s Share & Save to earn fee credits.',
    good: 'Fees are well-managed. Keep monitoring ad ROI and consider free traffic sources.',
  },
  'Shipping Economics': {
    description: 'Compares what buyers pay for shipping vs. your actual label costs. Negative means you\'re subsidizing shipping.',
    improve: 'Raise shipping prices, negotiate carrier rates, use lighter packaging, or build shipping cost into item price.',
    good: 'Shipping is profitable or break-even. Keep monitoring as carrier rates change.',
  },
  'Data Quality': {
    description: 'How complete and accurate your order data is — uncategorized items, missing costs, or unmatched models.',
    improve: 'Categorize inventory items, assign models to products, and review orders with missing cost data.',
    good: 'Data is clean. Periodically audit new products to keep categorization up to date.',
  },
};

export default function InsightsTab({ showNotification }) {
  const [data, setData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [cashFlowData, setCashFlowData] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [projectionsData, setProjectionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    briefing: true,
    actions: true,
    health: false,
    charts: true,
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-retry every 10 seconds when disconnected
  useEffect(() => {
    if (apiConnected || loading) return;
    const retryInterval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(retryInterval);
  }, [apiConnected, loading]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const isConnected = await checkApiHealth();
      setApiConnected(isConnected);

      if (!isConnected) {
        setError('Unable to connect to analytics server. Retrying...');
        setLoading(false);
        return;
      }

      // Load all data in parallel
      const [overview, monthly, expenses, cashFlow, products, projections] = await Promise.all([
        getOverview(),
        getMonthlyPerformance().catch(() => null),
        getExpenseBreakdown().catch(() => null),
        getCashFlow().catch(() => null),
        getTopProducts().catch(() => null),
        getProjections().catch(() => null),
      ]);

      setData(overview);
      setMonthlyData(monthly);
      setExpenseData(expenses);
      setCashFlowData(cashFlow);
      setProductsData(products);
      setProjectionsData(projections);
    } catch (err) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      showNotification?.('Refreshing analytics data...');
      await reloadAnalytics();
      await loadData();
      showNotification?.('Analytics data refreshed');
    } catch (err) {
      showNotification?.('Failed to refresh: ' + err.message, 'error');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'HIGH') return '#ef4444';
    if (priority === 'MEDIUM') return '#f59e0b';
    return '#10b981';
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: '#64748b' }}>Loading analytics...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error/disconnected state
  if (error || !apiConnected) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <WifiOff size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px', color: '#1a1a2e' }}>Connecting to Analytics...</h3>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            {error || 'Trying to reach the analytics server. Retrying automatically...'}
          </p>
          <button
            onClick={loadData}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={18} />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          color: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Brain size={28} style={{ color: '#6366f1' }} />
          Business Insights
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#10b981',
            fontSize: '0.85rem'
          }}>
            <Wifi size={16} />
            Connected
          </span>
          <button
            onClick={handleRefresh}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#64748b',
              fontSize: '0.9rem'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Health Score Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: `conic-gradient(${getHealthColor(data.health.score)} ${data.health.score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#1a1a2e',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.75rem', fontWeight: '700' }}>{data.health.score}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>/ 100</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '4px' }}>Health Score</div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: getHealthColor(data.health.score)
              }}>
                Grade {data.health.grade}
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Revenue</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                ${data.kpis.gross_sales?.toLocaleString() || '0'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Profit</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: data.kpis.profit >= 0 ? '#10b981' : '#ef4444' }}>
                ${data.kpis.profit?.toLocaleString() || '0'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Margin</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                {data.kpis.profit_margin || 0}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Cash</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#10b981' }}>
                ${data.kpis.cash_on_hand?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-scores toggle */}
        <button
          onClick={() => toggleSection('health')}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#fff',
            cursor: 'pointer',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
          }}
        >
          {expandedSections.health ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expandedSections.health ? 'Hide' : 'Show'} Score Breakdown
        </button>

        {/* Sub-scores */}
        {expandedSections.health && data.health.sub_scores && (
          <div style={{
            marginTop: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px'
          }}>
            {Object.entries(data.health.sub_scores).map(([name, score]) => {
              const info = HEALTH_METRIC_INFO[name];
              return (
                <div key={name} className="health-metric-block" style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  position: 'relative',
                  cursor: info ? 'help' : 'default'
                }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      flex: 1,
                      height: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${score}%`,
                        height: '100%',
                        background: getHealthColor(score),
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{score}</span>
                  </div>
                  {info && (
                    <div className="health-metric-tooltip">
                      <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.8rem' }}>{name}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '8px' }}>{info.description}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '6px' }}>
                        <span style={{ fontWeight: 600 }}>Improve: </span>{score >= 80 ? info.good : info.improve}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Briefing */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => toggleSection('briefing')}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
            border: 'none',
            padding: '16px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Lightbulb size={20} style={{ color: '#6366f1' }} />
            <span style={{ fontWeight: '600', color: '#1a1a2e' }}>Daily Briefing</span>
          </div>
          {expandedSections.briefing ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.briefing && data.briefing && (
          <div style={{ padding: '20px' }}>
            {data.briefing.map((paragraph, idx) => (
              <p key={idx} style={{
                margin: idx === 0 ? 0 : '16px 0 0',
                color: idx === 0 ? '#1a1a2e' : '#64748b',
                fontSize: idx === 0 ? '1rem' : '0.95rem',
                lineHeight: '1.6',
                fontWeight: idx === 0 ? '500' : '400'
              }}>
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Priority Actions */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => toggleSection('actions')}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(249, 115, 22, 0.05))',
            border: 'none',
            padding: '16px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Target size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontWeight: '600', color: '#1a1a2e' }}>
              Priority Actions ({data.actions?.length || 0})
            </span>
          </div>
          {expandedSections.actions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.actions && data.actions && (
          <div style={{ padding: '16px' }}>
            {data.actions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                color: '#64748b'
              }}>
                <CheckCircle size={32} style={{ color: '#10b981', marginBottom: '8px' }} />
                <p style={{ margin: 0 }}>No urgent actions needed. Business is running smoothly.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.actions.map((action, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${getPriorityColor(action.priority)}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          background: `${getPriorityColor(action.priority)}20`,
                          color: getPriorityColor(action.priority),
                          marginBottom: '6px'
                        }}>
                          {action.priority}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#1a1a2e' }}>
                          {action.title}
                        </h4>
                      </div>
                      {action.impact > 0 && (
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          color: '#059669',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          +${action.impact.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                      {action.reason}
                    </p>
                    {action.difficulty && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '0.8rem',
                        color: '#94a3b8'
                      }}>
                        Difficulty: {action.difficulty}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => toggleSection('charts')}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
            border: 'none',
            padding: '16px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={20} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: '600', color: '#1a1a2e' }}>Performance Charts</span>
          </div>
          {expandedSections.charts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.charts && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

              {/* Monthly Performance Bar Chart */}
              {monthlyData?.monthly && monthlyData.monthly.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#1a1a2e' }}>
                    Monthly Revenue & Gross Margin
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(val) => val.split('-')[1] + '/' + val.split('-')[0].slice(2)}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value) => [`$${value.toLocaleString()}`, '']}
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="sales" name="Gross Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net" name="Etsy Net (after fees)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Expense Breakdown Pie Chart */}
              {expenseData?.expenses && expenseData.expenses.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#1a1a2e' }}>
                    Expense Breakdown
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={expenseData.expenses}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, payload }) => `${name} ${Math.round(payload.percent)}%`}
                        labelLine={{ stroke: '#94a3b8' }}
                      >
                        {expenseData.expenses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`$${value.toLocaleString()}`, '']}
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Total Expenses: <strong style={{ color: '#ef4444' }}>${expenseData.total?.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Orders & AOV Line Chart */}
            {monthlyData?.monthly && monthlyData.monthly.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#1a1a2e' }}>
                  Orders & Average Order Value
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyData.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => val.split('-')[1] + '/' + val.split('-')[0].slice(2)}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="orders" name="Orders" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="aov" name="Avg Order Value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Revenue & Profit Projections */}
            {projectionsData && (projectionsData.historical?.length > 0 || projectionsData.projections?.length > 0) && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: '#1a1a2e' }}>
                  Revenue & Profit Forecast
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Solid = actual &middot; Dashed = projected &middot; Growth rate: {projectionsData.growth_rate?.toFixed(0)}%
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={[...(projectionsData.historical || []), ...(projectionsData.projections || [])]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => val.split('-')[1] + '/' + val.split('-')[0].slice(2)}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                      labelFormatter={(label) => {
                        const item = [...(projectionsData.historical || []), ...(projectionsData.projections || [])].find(d => d.month === label);
                        return `${label} (${item?.type === 'projection' ? 'Projected' : 'Actual'})`;
                      }}
                      contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#gradRevenue)"
                      strokeDasharray={(d) => d?.type === 'projection' ? '5 5' : '0'}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return <circle cx={cx} cy={cy} r={4} fill={payload.type === 'projection' ? '#fff' : '#6366f1'} stroke="#6366f1" strokeWidth={2} />;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#gradProfit)"
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return <circle cx={cx} cy={cy} r={4} fill={payload.type === 'projection' ? '#fff' : '#10b981'} stroke="#10b981" strokeWidth={2} />;
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Cash Flow & Top Products side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>

              {/* Cash Flow Chart */}
              {cashFlowData?.monthly && cashFlowData.monthly.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#1a1a2e' }}>
                    Cash Flow (Bank)
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={cashFlowData.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(val) => val.split('-')[1] + '/' + val.split('-')[0].slice(2)}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                      />
                      <Tooltip
                        formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="deposits" name="Deposits" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="debits" name="Debits" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top Products Chart */}
              {productsData?.products && productsData.products.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#1a1a2e' }}>
                    Top Products by Revenue
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={productsData.products.slice(0, 8).map(p => ({
                        ...p,
                        shortName: p.name.length > 25 ? p.name.substring(0, 22) + '...' : p.name
                      }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="shortName"
                        width={150}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                        labelFormatter={(label) => productsData.products.find(p => p.name.startsWith(label.replace('...', '')))?.name || label}
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Trend (Simple fallback) */}
      {!monthlyData && data.monthly_trend && data.monthly_trend.length > 0 && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px'
        }}>
          <h3 style={{
            margin: '0 0 16px',
            fontSize: '1rem',
            color: '#1a1a2e',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Activity size={18} style={{ color: '#6366f1' }} />
            Monthly Revenue Trend
          </h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {data.monthly_trend.map((month, idx) => {
              const maxRevenue = Math.max(...data.monthly_trend.map(m => m.revenue));
              const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
              const isLast = idx === data.monthly_trend.length - 1;

              return (
                <div key={month.month} style={{
                  flex: '1',
                  minWidth: '60px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    height: '80px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '100%',
                      maxWidth: '40px',
                      height: `${Math.max(height, 5)}%`,
                      background: isLast
                        ? 'linear-gradient(180deg, #6366f1, #8b5cf6)'
                        : 'linear-gradient(180deg, #e2e8f0, #cbd5e1)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: isLast ? '#6366f1' : '#64748b',
                    fontWeight: isLast ? '600' : '400'
                  }}>
                    {month.month.split('-')[1]}/{month.month.split('-')[0].slice(2)}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: isLast ? '#1a1a2e' : '#64748b'
                  }}>
                    ${(month.revenue / 1000).toFixed(1)}k
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
