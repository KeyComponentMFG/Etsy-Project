import { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Building, Scale, RefreshCw,
  ArrowRight, Briefcase, PiggyBank, CreditCard, AlertTriangle,
  Target, Clock, CheckCircle, Info
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

  const sdeVal = data?.valuations?.sde_multiple;
  const monthlyVal = data?.valuations?.monthly_profit;
  const revVal = data?.valuations?.revenue_multiple;
  const estimated = data?.estimated_value;
  const risk = data?.risk_assessment;
  const guidance = data?.guidance;

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

      {/* Stage & Confidence Indicator */}
      <div style={{
        display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap'
      }}>
        <div style={{
          background: guidance?.current_stage === 'Early Stage' ? 'rgba(99, 102, 241, 0.1)' :
                      guidance?.current_stage === 'Growth Stage' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: `1px solid ${guidance?.current_stage === 'Early Stage' ? 'rgba(99, 102, 241, 0.3)' :
                               guidance?.current_stage === 'Growth Stage' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          borderRadius: '20px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Clock size={14} />
          <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{guidance?.current_stage}</span>
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>({data?.metrics?.months_operating} months)</span>
        </div>
        <div style={{
          background: estimated?.confidence === 'Speculative' ? 'rgba(239, 68, 68, 0.1)' :
                      estimated?.confidence === 'Medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: `1px solid ${estimated?.confidence === 'Speculative' ? 'rgba(239, 68, 68, 0.3)' :
                               estimated?.confidence === 'Medium' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          borderRadius: '20px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Info size={14} />
          <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>Confidence: {estimated?.confidence}</span>
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>({data?.metrics?.track_record_weight}% track record)</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <MetricCard
          label="Annual Revenue"
          value={data?.metrics?.annual_revenue_projected}
          icon={TrendingUp}
          color="#6366f1"
          subtitle="projected"
        />
        <MetricCard
          label="Annual Profit"
          value={data?.metrics?.annual_profit_projected}
          icon={DollarSign}
          color="#10b981"
          subtitle="projected"
        />
        <MetricCard
          label="SDE"
          value={data?.metrics?.sde}
          icon={Briefcase}
          color="#f59e0b"
          subtitle="Seller's Discretionary Earnings"
        />
        <MetricCard
          label="Monthly SDE"
          value={data?.metrics?.monthly_sde}
          icon={DollarSign}
          color="#8b5cf6"
          subtitle="for Flippa-style calc"
        />
        <MetricCard
          label="Profit Margin"
          value={`${data?.metrics?.profit_margin}%`}
          icon={TrendingUp}
          color="#10b981"
          isPercent
        />
      </div>

      {/* Risk Assessment */}
      {risk && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            <span style={{ fontWeight: '600', color: '#1a1a2e' }}>Risk Adjustment: -{risk.total_discount}%</span>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>(multiplier: {risk.risk_multiplier}x)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {risk.factors?.map((f, i) => (
              <span key={i} style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
                color: '#64748b'
              }}>
                {f.factor} (-{Math.round(f.discount * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Realistic Valuation Estimate */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        color: '#fff'
      }}>
        <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '4px' }}>Realistic Market Value</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '16px' }}>{estimated?.method}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Conservative</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
              ${estimated?.low?.toLocaleString()}
            </div>
          </div>
          <ArrowRight size={24} style={{ opacity: 0.5 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#10b981' }}>Most Likely</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#10b981' }}>
              ${estimated?.mid?.toLocaleString()}
            </div>
          </div>
          <ArrowRight size={24} style={{ opacity: 0.5 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Optimistic</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
              ${estimated?.high?.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Valuation Methods */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* SDE Multiple (Primary) */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '2px solid #f59e0b', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: '600', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} style={{ color: '#f59e0b' }} /> SDE Multiple
                <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>PRIMARY</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sdeVal?.method}</div>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            <ValuationRange low={sdeVal?.low} mid={sdeVal?.mid} high={sdeVal?.high} color="#f59e0b" multipliers={sdeVal?.multipliers} />
          </div>
        </div>

        {/* Monthly Profit (Flippa Style) */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{ fontWeight: '600', color: '#1a1a2e' }}>Monthly Profit Multiple</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{monthlyVal?.method}</div>
          </div>
          <div style={{ padding: '16px' }}>
            <ValuationRange low={monthlyVal?.low} mid={monthlyVal?.mid} high={monthlyVal?.high} color="#8b5cf6" multipliers={monthlyVal?.multipliers} />
          </div>
        </div>

        {/* Revenue Multiple (Reference) */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', opacity: 0.7 }}>
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{ fontWeight: '600', color: '#1a1a2e' }}>Revenue Multiple</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{revVal?.method}</div>
          </div>
          <div style={{ padding: '16px' }}>
            <ValuationRange low={revVal?.low} mid={revVal?.mid} high={revVal?.high} color="#6366f1" multipliers={revVal?.multipliers} />
          </div>
        </div>
      </div>

      {/* Balance Sheet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
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

      {/* How to Increase Your Multiple */}
      {guidance?.to_increase_multiple && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} style={{ color: '#6366f1' }} />
            How to Increase Your Valuation Multiple
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {guidance.to_increase_multiple.map((tip, i) => (
              <div key={i} style={{
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.9rem',
                color: '#374151'
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6366f1', fontWeight: '600', fontSize: '0.75rem', flexShrink: 0
                }}>{i + 1}</div>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}
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
      <div style={{ fontSize: '1.35rem', fontWeight: '700', color }}>
        {isPercent ? value : `$${typeof value === 'number' ? value.toLocaleString() : value}`}
      </div>
      {subtitle && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{subtitle}</div>}
    </div>
  );
}

function ValuationRange({ low, mid, high, color, multipliers }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Low ({multipliers?.low}x)</div>
          <div style={{ fontSize: '1rem', fontWeight: '600', color: '#64748b' }}>${low?.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color }}>Mid ({multipliers?.mid}x)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color }}>${mid?.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>High ({multipliers?.high}x)</div>
          <div style={{ fontSize: '1rem', fontWeight: '600', color: '#64748b' }}>${high?.toLocaleString()}</div>
        </div>
      </div>
      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '20%',
          right: '20%',
          height: '100%',
          background: `linear-gradient(90deg, ${color}40, ${color})`,
          borderRadius: '3px'
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
