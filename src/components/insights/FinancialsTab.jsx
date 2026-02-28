import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Building2,
  ArrowDown, ArrowUp, RefreshCw, ChevronDown, ChevronUp,
  Truck, Tag, Users, PieChart, Minus, Receipt
} from 'lucide-react';
import { getPnL, getBankSummary, getBankLedger, getShipping, getFees, getFinancials, checkApiHealth } from '../../lib/analyticsApi';

export default function FinancialsTab({ showNotification }) {
  const [pnl, setPnl] = useState(null);
  const [bank, setBank] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('pnl');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const isConnected = await checkApiHealth();
      if (!isConnected) {
        setError('Analytics server not available');
        setLoading(false);
        return;
      }

      const [pnlData, bankData, ledgerData, shippingData, feesData, financialsData] = await Promise.all([
        getPnL().catch(() => null),
        getBankSummary().catch(() => null),
        getBankLedger().catch(() => null),
        getShipping().catch(() => null),
        getFees().catch(() => null),
        getFinancials().catch(() => null),
      ]);

      setLedger(ledgerData);
      setFees(feesData || (financialsData ? { total: financialsData.fees?.total, as_percent_of_sales: financialsData.profit?.margin_percent ? (100 - financialsData.profit.margin_percent).toFixed(1) : null, breakdown: financialsData.fees, marketing: { etsy_ads: financialsData.fees?.marketing }, credits: null } : null));

      // Build P&L from /api/pnl or fall back to /api/financials
      if (pnlData) {
        setPnl(pnlData);
      } else if (financialsData) {
        const f = financialsData;
        setPnl({
          revenue: { gross_sales: f.revenue?.gross_sales || 0, refunds: f.revenue?.refunds || 0, net_sales: f.revenue?.net_sales || 0 },
          etsy_fees: { total_fees: f.fees?.total || 0 },
          shipping: { label_costs: f.shipping?.label_costs || f.fees?.shipping_labels || 0 },
          marketing: { total: f.fees?.marketing || 0 },
          after_etsy_fees: f.profit?.etsy_net || 0,
          owner_draws: f.owner_draws?.total || 0,
          net_profit: f.profit?.after_expenses || 0,
          cash_on_hand: f.bank?.cash_on_hand || 0,
        });
      }

      // Build bank data from /api/bank/summary or fall back to /api/financials
      if (bankData) {
        setBank(bankData);
      } else if (financialsData?.bank) {
        const fb = financialsData.bank;
        const draws = financialsData.owner_draws || {};
        setBank({
          balance: fb.cash_on_hand || 0,
          total_deposits: fb.total_deposits || 0,
          total_debits: fb.total_debits || 0,
          by_category: fb.categories || {},
          owner_draws: {
            tulsa: draws.tulsa || 0,
            texas: draws.texas || 0,
            total: draws.total || 0,
            difference: Math.abs((draws.tulsa || 0) - (draws.texas || 0)),
            owed_to: (draws.tulsa || 0) > (draws.texas || 0) ? 'Texas (Braden)' : (draws.texas || 0) > (draws.tulsa || 0) ? 'Tulsa (TJ)' : null,
          },
        });
      }

      // Build shipping from /api/shipping or fall back to /api/financials
      if (shippingData) {
        setShipping(shippingData);
      } else if (financialsData?.shipping) {
        setShipping({
          summary: {
            buyer_paid: financialsData.shipping.buyer_paid || 0,
            label_costs: financialsData.shipping.label_costs || financialsData.fees?.shipping_labels || 0,
            profit_loss: financialsData.shipping.profit || 0,
            margin: financialsData.shipping.margin || 0,
          },
          labels: null,
          orders: null,
        });
      }
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
        <p style={{ color: '#64748b' }}>Loading financials...</p>
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
        }}>
          <RefreshCw size={16} style={{ marginRight: '8px' }} />
          Retry
        </button>
      </div>
    );
  }

  const sections = [
    { id: 'pnl', label: 'P&L Statement', icon: Receipt },
    { id: 'bank', label: 'Bank & Expenses', icon: Building2 },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'fees', label: 'Fees', icon: Tag },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DollarSign size={28} style={{ color: '#10b981' }} />
          Financial Reports
        </h2>
        <button onClick={loadData} style={{
          background: '#f1f5f9', border: 'none', borderRadius: '8px',
          padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              padding: '10px 16px',
              background: activeSection === section.id ? '#6366f1' : '#f1f5f9',
              color: activeSection === section.id ? '#fff' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <section.icon size={16} />
            {section.label}
          </button>
        ))}
      </div>

      {/* P&L Section */}
      {activeSection === 'pnl' && !pnl && (
        <UnavailableNotice section="P&L Statement" onRetry={loadData} />
      )}
      {activeSection === 'pnl' && pnl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <SummaryCard label="Gross Sales" value={pnl.revenue?.gross_sales} color="#10b981" />
            <SummaryCard label="After Fees" value={pnl.after_etsy_fees} color="#6366f1" />
            <SummaryCard label="Net Profit" value={pnl.net_profit} color={pnl.net_profit >= 0 ? '#10b981' : '#ef4444'} />
            <SummaryCard label="Cash on Hand" value={pnl.cash_on_hand} color="#f59e0b" />
          </div>

          {/* Waterfall P&L */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#1a1a2e' }}>
              Profit & Loss Waterfall
            </div>
            <div style={{ padding: '16px' }}>
              <WaterfallRow label="Gross Sales" value={pnl.revenue?.gross_sales} isPositive />
              <WaterfallRow label="Refunds" value={-pnl.revenue?.refunds} />
              <WaterfallRow label="= Net Sales" value={pnl.revenue?.net_sales} isSubtotal />
              <WaterfallRow label="Etsy Fees" value={-pnl.etsy_fees?.total_fees} />
              <WaterfallRow label="Shipping Labels" value={-pnl.shipping?.label_costs} />
              <WaterfallRow label="Marketing" value={-pnl.marketing?.total} />
              <WaterfallRow label="= After Etsy" value={pnl.after_etsy_fees} isSubtotal />
              <WaterfallRow label="Owner Draws" value={-pnl.owner_draws} />
              <WaterfallRow label="= Net Profit" value={pnl.net_profit} isTotal />
            </div>
          </div>
        </div>
      )}

      {/* Bank Section */}
      {activeSection === 'bank' && !bank && !ledger && (
        <UnavailableNotice section="Bank & Expenses" onRetry={loadData} />
      )}
      {activeSection === 'bank' && (bank || ledger) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Bank Summary */}
          {bank && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <SummaryCard label="Bank Balance" value={bank.balance} color="#10b981" icon={Building2} />
            <SummaryCard label="Total Deposits" value={bank.total_deposits} color="#6366f1" icon={ArrowDown} />
            <SummaryCard label="Total Debits" value={bank.total_debits} color="#ef4444" icon={ArrowUp} />
          </div>
          )}

          {/* Owner Draws */}
          {bank?.owner_draws && (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: '#8b5cf6' }} />
                Owner Draws
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Tulsa (TJ)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1a1a2e' }}>
                    ${bank.owner_draws.tulsa?.toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Texas (Braden)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1a1a2e' }}>
                    ${bank.owner_draws.texas?.toLocaleString()}
                  </div>
                </div>
                {bank.owner_draws.owed_to && (
                  <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Owed to {bank.owner_draws.owed_to}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#d97706' }}>
                      ${Math.abs(bank.owner_draws.difference)?.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expense Categories */}
          {bank?.by_category && Object.keys(bank.by_category).length > 0 && (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} style={{ color: '#6366f1' }} />
                Expense Categories
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(bank.by_category)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([category, amount]) => (
                    <ExpenseRow key={category} category={category} amount={amount} total={bank.total_debits} />
                  ))}
              </div>
            </div>
          )}

          {/* Transaction Ledger */}
          {ledger?.transactions && ledger.transactions.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: '600' }}>
                Recent Transactions ({ledger.transactions.length})
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#64748b' }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#64748b' }}>Description</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#64748b' }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#64748b' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.transactions.slice(0, 50).map((txn, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{txn.date}</td>
                        <td style={{ padding: '12px 16px', color: '#1a1a2e' }}>{txn.description?.slice(0, 40)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: txn.amount >= 0 ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                          {txn.amount >= 0 ? '+' : ''}{txn.amount?.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500' }}>
                          ${txn.running_balance?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shipping Section */}
      {activeSection === 'shipping' && !shipping && (
        <UnavailableNotice section="Shipping" onRetry={loadData} />
      )}
      {activeSection === 'shipping' && shipping && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <SummaryCard label="Buyer Paid" value={shipping.summary?.buyer_paid} color="#10b981" />
            <SummaryCard label="Label Costs" value={shipping.summary?.label_costs} color="#ef4444" />
            <SummaryCard
              label="Profit/Loss"
              value={shipping.summary?.profit_loss}
              color={shipping.summary?.profit_loss >= 0 ? '#10b981' : '#ef4444'}
            />
            <SummaryCard label="Margin" value={`${shipping.summary?.margin}%`} color="#6366f1" isPercent />
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Label Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <StatBox label="USPS Outbound" value={`$${shipping.labels?.usps_outbound?.toLocaleString()}`} sub={`${shipping.labels?.usps_outbound_count} labels`} />
              <StatBox label="USPS Returns" value={`$${shipping.labels?.usps_returns?.toLocaleString()}`} sub={`${shipping.labels?.usps_return_count} labels`} />
              <StatBox label="International" value={`$${shipping.labels?.asendia?.toLocaleString()}`} sub={`${shipping.labels?.asendia_count} labels`} />
              <StatBox label="Avg Label Cost" value={`$${shipping.orders?.avg_label_cost?.toFixed(2)}`} />
            </div>
          </div>
        </div>
      )}

      {/* Fees Section */}
      {activeSection === 'fees' && !fees && (
        <UnavailableNotice section="Fees" onRetry={loadData} />
      )}
      {activeSection === 'fees' && fees && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <SummaryCard label="Total Fees" value={fees.total} color="#ef4444" />
            <SummaryCard label="Fee %" value={`${fees.as_percent_of_sales}%`} color="#f59e0b" isPercent />
            <SummaryCard label="Credits" value={fees.credits?.total_credits} color="#10b981" />
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Fee Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <FeeRow label="Listing Fees" value={fees.breakdown?.listing_fees} total={fees.total} />
              <FeeRow label="Transaction Fees (Product)" value={fees.breakdown?.transaction_fees_product} total={fees.total} />
              <FeeRow label="Transaction Fees (Shipping)" value={fees.breakdown?.transaction_fees_shipping} total={fees.total} />
              <FeeRow label="Processing Fees" value={fees.breakdown?.processing_fees} total={fees.total} />
              <FeeRow label="Etsy Ads" value={fees.marketing?.etsy_ads} total={fees.total} />
              <FeeRow label="Offsite Ads" value={fees.marketing?.offsite_ads_fees} total={fees.total} />
            </div>
          </div>

          {fees.credits && (
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#059669' }}>Fee Credits</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <StatBox label="Share & Save" value={`$${fees.credits?.share_save?.toFixed(2)}`} color="#10b981" />
                <StatBox label="Listing Credits" value={`$${fees.credits?.listing_credits?.toFixed(2)}`} color="#10b981" />
                <StatBox label="Transaction Credits" value={`$${fees.credits?.transaction_credits?.toFixed(2)}`} color="#10b981" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper Components
function SummaryCard({ label, value, color, icon: Icon, isPercent }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '16px',
    }}>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {Icon && <Icon size={14} />}
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color }}>
        {isPercent ? value : `$${typeof value === 'number' ? value.toLocaleString() : value}`}
      </div>
    </div>
  );
}

function WaterfallRow({ label, value, isPositive, isSubtotal, isTotal }) {
  const bgColor = isTotal ? 'rgba(16, 185, 129, 0.1)' : isSubtotal ? '#f8fafc' : 'transparent';
  const fontWeight = isSubtotal || isTotal ? '600' : '400';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 12px',
      background: bgColor,
      borderRadius: '6px',
      marginBottom: '4px',
    }}>
      <span style={{ color: '#1a1a2e', fontWeight }}>{label}</span>
      <span style={{
        fontWeight: '600',
        color: value >= 0 ? '#10b981' : '#ef4444'
      }}>
        {value >= 0 ? '' : '-'}${Math.abs(value || 0).toLocaleString()}
      </span>
    </div>
  );
}

function ExpenseRow({ category, amount, total }) {
  const pct = total > 0 ? (amount / total * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.9rem', color: '#1a1a2e' }}>{category}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1a2e' }}>${amount.toLocaleString()}</span>
        </div>
        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#6366f1', borderRadius: '3px' }} />
        </div>
      </div>
      <span style={{ fontSize: '0.8rem', color: '#64748b', width: '40px', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

function FeeRow({ label, value, total }) {
  const pct = total > 0 && value > 0 ? (value / total * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>{label}</span>
          <span style={{ fontWeight: '500' }}>${value?.toLocaleString() || 0}</span>
        </div>
      </div>
      <span style={{ fontSize: '0.8rem', color: '#94a3b8', width: '40px', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

function UnavailableNotice({ section, onRetry }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '40px 24px',
      textAlign: 'center'
    }}>
      <AlertCircle size={36} style={{ color: '#f59e0b', marginBottom: '12px' }} />
      <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: '1.1rem' }}>
        {section} data unavailable
      </h3>
      <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.9rem' }}>
        The server returned an error for this report. Other sections may still be available.
      </p>
      <button onClick={onRetry} style={{
        padding: '8px 16px', background: '#6366f1', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '6px'
      }}>
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

function StatBox({ label, value, sub, color }) {
  return (
    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: '600', color: color || '#1a1a2e' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sub}</div>}
    </div>
  );
}
