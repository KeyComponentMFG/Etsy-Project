import { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Building, Scale, RefreshCw,
  ArrowRight, Briefcase, PiggyBank, CreditCard
} from 'lucide-react';
import { getValuation, checkApiHealth } from '../../lib/analyticsApi';

export default function ValuationTab({ showNotification }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const isConnected = await checkApiHealth();
      if (!isConnected) {
        setError('Analytics server not available');
        setLoading(false);
        return;
      }
      const valuation = await getValuation();
      setData(valuation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '3px solid #e2e8f0', borderTopColor: '#6366f1',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: '#64748b' }}>Calculating valuation...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button onClick={loadData} style={{
          marginTop: '16px', padding: '8px 16px',
          background: '#6366f1', color: '#fff',
          border: 'none', borderRadius: '8px', cursor: 'pointer'
        }}>Retry</button>
      </div>
    );
  }

  const revVal = data?.valuations?.revenue_multiple;
  const sdeVal = data?.valuations?.sde_multiple;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Scale size={28} style={{ color: '#f59e0b' }} />
          Business Valuation
        </h2>
        <button onClick={loadData} style={{
          background: '#f1f5f9', border: 'none', borderRadius: '8px',
          padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <MetricCard
          label="Annual Revenue (proj.)"
          value={data?.metrics?.annual_revenue_projected}
          icon={TrendingUp}
          color="#6366f1"
        />
        <MetricCard
          label="Annual Profit (proj.)"
          value={data?.metrics?.annual_profit_projected}
          icon={DollarSign}
          color="#10b981"
        />
        <MetricCard
          label="SDE"
          value={data?.metrics?.sde}
          icon={Briefcase}
          color="#f59e0b"
          subtitle="Seller's Discretionary Earnings"
        />
        <MetricCard
          label="Profit Margin"
          value={`${data?.metrics?.profit_margin}%`}
          icon={TrendingUp}
          color="#8b5cf6"
          isPercent
        />
      </div>

      {/* Valuation Ranges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Revenue Multiple */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{ fontWeight: '600', color: '#1a1a2e' }}>Revenue Multiple Valuation</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{revVal?.method}</div>
          </div>
          <div style={{ padding: '20px' }}>
            <ValuationRange low={revVal?.low} mid={revVal?.mid} high={revVal?.high} color="#6366f1" />
          </div>
        </div>

        {/* SDE Multiple */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{ fontWeight: '600', color: '#1a1a2e' }}>SDE Multiple Valuation</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{sdeVal?.method}</div>
          </div>
          <div style={{ padding: '20px' }}>
            <ValuationRange low={sdeVal?.low} mid={sdeVal?.mid} high={sdeVal?.high} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Blended Estimate */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        color: '#fff'
      }}>
        <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '8px' }}>Estimated Business Value Range</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Low</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
              ${Math.round((revVal?.low + sdeVal?.low) / 2)?.toLocaleString()}
            </div>
          </div>
          <ArrowRight size={24} style={{ opacity: 0.5 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#10b981' }}>Mid (Most Likely)</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#10b981' }}>
              ${Math.round((revVal?.mid + sdeVal?.mid) / 2)?.toLocaleString()}
            </div>
          </div>
          <ArrowRight size={24} style={{ opacity: 0.5 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>High</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
              ${Math.round((revVal?.high + sdeVal?.high) / 2)?.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Balance Sheet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        {/* Assets */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PiggyBank size={18} style={{ color: '#10b981' }} />
            Assets
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <BalanceRow label="Cash on Hand" value={data?.assets?.cash_on_hand} />
            <BalanceRow label="Etsy Balance" value={data?.assets?.etsy_balance} />
            <BalanceRow label="Inventory Value" value={data?.assets?.inventory_value} />
            <BalanceRow
              label="Total Assets"
              value={(data?.assets?.cash_on_hand || 0) + (data?.assets?.etsy_balance || 0) + (data?.assets?.inventory_value || 0)}
              isTotal
              color="#10b981"
            />
          </div>
        </div>

        {/* Liabilities */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} style={{ color: '#ef4444' }} />
            Liabilities
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <BalanceRow label="Credit Card Balance" value={data?.liabilities?.credit_card} />
            <BalanceRow
              label="Total Liabilities"
              value={data?.liabilities?.credit_card || 0}
              isTotal
              color="#ef4444"
            />
          </div>

          {/* Net Equity */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#059669', marginBottom: '4px' }}>Net Equity</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>
              ${(
                (data?.assets?.cash_on_hand || 0) +
                (data?.assets?.etsy_balance || 0) +
                (data?.assets?.inventory_value || 0) -
                (data?.liabilities?.credit_card || 0)
              )?.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Valuation Factors */}
      <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1a1a2e' }}>Valuation Factors</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <FactorBox
            label="Months Operating"
            value={data?.metrics?.months_operating}
            status={data?.metrics?.months_operating >= 12 ? 'good' : data?.metrics?.months_operating >= 6 ? 'ok' : 'new'}
            note={data?.metrics?.months_operating >= 12 ? 'Established history' : 'Building track record'}
          />
          <FactorBox
            label="Profit Margin"
            value={`${data?.metrics?.profit_margin}%`}
            status={data?.metrics?.profit_margin >= 25 ? 'good' : data?.metrics?.profit_margin >= 15 ? 'ok' : 'low'}
            note={data?.metrics?.profit_margin >= 25 ? 'Healthy margins' : 'Room to improve'}
          />
          <FactorBox
            label="Revenue Trend"
            value="Growing"
            status="good"
            note="Positive trajectory"
          />
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ label, value, icon: Icon, color, subtitle, isPercent }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {Icon && <Icon size={16} style={{ color }} />}
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color }}>
        {isPercent ? value : `$${typeof value === 'number' ? value.toLocaleString() : value}`}
      </div>
      {subtitle && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{subtitle}</div>}
    </div>
  );
}

function ValuationRange({ low, mid, high, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Low</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#64748b' }}>${low?.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color }}>Mid</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color }}>${mid?.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>High</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#64748b' }}>${high?.toLocaleString()}</div>
        </div>
      </div>
      <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '20%',
          right: '20%',
          height: '100%',
          background: `linear-gradient(90deg, ${color}40, ${color})`,
          borderRadius: '4px'
        }} />
      </div>
    </div>
  );
}

function BalanceRow({ label, value, isTotal, color }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: isTotal ? '12px' : '4px 0',
      background: isTotal ? `${color}10` : 'transparent',
      borderRadius: isTotal ? '8px' : 0,
      borderTop: isTotal ? '1px solid #e2e8f0' : 'none',
      marginTop: isTotal ? '8px' : 0
    }}>
      <span style={{ color: isTotal ? color : '#64748b', fontWeight: isTotal ? '600' : '400' }}>{label}</span>
      <span style={{ fontWeight: isTotal ? '700' : '500', color: isTotal ? color : '#1a1a2e' }}>
        ${value?.toLocaleString() || 0}
      </span>
    </div>
  );
}

function FactorBox({ label, value, status, note }) {
  const colors = {
    good: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#059669' },
    ok: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#d97706' },
    low: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#dc2626' },
    new: { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)', text: '#4f46e5' },
  };
  const style = colors[status] || colors.ok;

  return (
    <div style={{
      padding: '16px',
      background: style.bg,
      borderRadius: '10px',
      border: `1px solid ${style.border}`
    }}>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: style.text }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: style.text, marginTop: '4px' }}>{note}</div>
    </div>
  );
}
