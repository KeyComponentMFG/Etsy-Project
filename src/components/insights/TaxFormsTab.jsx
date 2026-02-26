import { useState, useEffect } from 'react';
import {
  FileText, Calculator, Users, DollarSign, Calendar,
  RefreshCw, AlertCircle, CheckCircle, Download
} from 'lucide-react';
import { getTaxInfo, getPnL, checkApiHealth } from '../../lib/analyticsApi';

export default function TaxFormsTab({ showNotification }) {
  const [tax, setTax] = useState(null);
  const [pnl, setPnl] = useState(null);
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

      const [taxData, pnlData] = await Promise.all([
        getTaxInfo(),
        getPnL(),
      ]);

      setTax(taxData);
      setPnl(pnlData);
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
        <p style={{ color: '#64748b' }}>Loading tax information...</p>
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

  const partnerShare = tax?.net_income / 2 || 0;
  const partnerSETax = tax?.self_employment_tax / 2 || 0;
  const partnerIncomeTax = tax?.estimated_income_tax / 2 || 0;
  const partnerTotalTax = partnerSETax + partnerIncomeTax;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={28} style={{ color: '#8b5cf6' }} />
          Tax Preparation
        </h2>
        <button onClick={loadData} style={{
          background: '#f1f5f9', border: 'none', borderRadius: '8px',
          padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Disclaimer */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>Tax Estimates Only</div>
          <div style={{ fontSize: '0.9rem', color: '#a16207' }}>
            These are estimates for planning purposes. Consult a tax professional for actual filing.
          </div>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <TaxCard
          label="Net Business Income"
          value={tax?.net_income}
          color="#10b981"
          icon={DollarSign}
        />
        <TaxCard
          label="Total Estimated Tax"
          value={tax?.total_estimated_tax}
          color="#ef4444"
          icon={Calculator}
        />
        <TaxCard
          label="Quarterly Payment"
          value={tax?.quarterly_payment}
          color="#f59e0b"
          icon={Calendar}
          subtitle="Due each quarter"
        />
      </div>

      {/* Partnership Split */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={20} style={{ color: '#8b5cf6' }} />
          <span style={{ fontWeight: '600', color: '#1a1a2e' }}>Partnership Split (50/50)</span>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* Partner 1 */}
            <PartnerCard
              name="Partner 1 (TJ)"
              share={partnerShare}
              seTax={partnerSETax}
              incomeTax={partnerIncomeTax}
              totalTax={partnerTotalTax}
              quarterly={tax?.quarterly_payment / 2}
            />
            {/* Partner 2 */}
            <PartnerCard
              name="Partner 2 (Braden)"
              share={partnerShare}
              seTax={partnerSETax}
              incomeTax={partnerIncomeTax}
              totalTax={partnerTotalTax}
              quarterly={tax?.quarterly_payment / 2}
            />
          </div>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Self-Employment Tax */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1a1a2e' }}>Self-Employment Tax</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <TaxRow label="Net Income" value={tax?.net_income} />
            <TaxRow label="x 92.35% (taxable portion)" value={tax?.net_income * 0.9235} />
            <TaxRow label="x 15.3% (SE tax rate)" isRate />
            <TaxRow label="= SE Tax Due" value={tax?.self_employment_tax} isTotal />
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
              Includes: 12.4% Social Security + 2.9% Medicare
            </div>
          </div>
        </div>

        {/* Estimated Income Tax */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1a1a2e' }}>Estimated Income Tax</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <TaxRow label="Net Income" value={tax?.net_income} />
            <TaxRow label="- SE Tax Deduction (50%)" value={-tax?.self_employment_tax / 2} />
            <TaxRow label="= Taxable Income" value={tax?.net_income - (tax?.self_employment_tax / 2)} />
            <TaxRow label="x 22% (est. bracket)" isRate />
            <TaxRow label="= Income Tax Due" value={tax?.estimated_income_tax} isTotal />
          </div>
        </div>
      </div>

      {/* Deductions Summary */}
      {tax?.deductions && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1a1a2e' }}>Business Deductions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <DeductionBox label="Shipping" value={tax.deductions.shipping} />
            <DeductionBox label="Etsy Fees" value={tax.deductions.fees} />
            <DeductionBox label="Marketing" value={tax.deductions.marketing} />
            <DeductionBox label="Total Expenses" value={tax.deductions.total_expenses} isTotal />
          </div>
        </div>
      )}

      {/* Quarterly Payment Schedule */}
      <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.05))', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '20px', marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: '#8b5cf6' }} />
          Estimated Quarterly Payments (Form 1040-ES)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <QuarterBox quarter="Q1" dueDate="Apr 15" amount={tax?.quarterly_payment} />
          <QuarterBox quarter="Q2" dueDate="Jun 15" amount={tax?.quarterly_payment} />
          <QuarterBox quarter="Q3" dueDate="Sep 15" amount={tax?.quarterly_payment} />
          <QuarterBox quarter="Q4" dueDate="Jan 15" amount={tax?.quarterly_payment} />
        </div>
        <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#64748b' }}>
          Per partner: ${(tax?.quarterly_payment / 2)?.toLocaleString()} per quarter
        </div>
      </div>
    </div>
  );
}

// Helper Components
function TaxCard({ label, value, color, icon: Icon, subtitle }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {Icon && <Icon size={18} style={{ color }} />}
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: '700', color }}>${value?.toLocaleString()}</div>
      {subtitle && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>{subtitle}</div>}
    </div>
  );
}

function PartnerCard({ name, share, seTax, incomeTax, totalTax, quarterly }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
      <div style={{ fontWeight: '600', color: '#1a1a2e', marginBottom: '12px' }}>{name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Income Share</span>
          <span style={{ fontWeight: '600', color: '#10b981' }}>${share?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>SE Tax</span>
          <span style={{ color: '#ef4444' }}>${seTax?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Income Tax</span>
          <span style={{ color: '#ef4444' }}>${incomeTax?.toLocaleString()}</span>
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '600' }}>Total Tax</span>
          <span style={{ fontWeight: '700', color: '#ef4444' }}>${totalTax?.toLocaleString()}</span>
        </div>
        <div style={{ background: 'rgba(139, 92, 246, 0.1)', borderRadius: '6px', padding: '8px', marginTop: '4px' }}>
          <div style={{ fontSize: '0.75rem', color: '#7c3aed' }}>Quarterly Payment</div>
          <div style={{ fontWeight: '700', color: '#7c3aed' }}>${quarterly?.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function TaxRow({ label, value, isRate, isTotal }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: isTotal ? '8px 12px' : '4px 0',
      background: isTotal ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
      borderRadius: isTotal ? '6px' : 0,
    }}>
      <span style={{ color: isTotal ? '#4f46e5' : '#64748b', fontWeight: isTotal ? '600' : '400' }}>{label}</span>
      {!isRate && (
        <span style={{ fontWeight: isTotal ? '700' : '500', color: isTotal ? '#4f46e5' : '#1a1a2e' }}>
          {value < 0 ? '-' : ''}${Math.abs(value || 0)?.toLocaleString()}
        </span>
      )}
    </div>
  );
}

function DeductionBox({ label, value, isTotal }) {
  return (
    <div style={{
      padding: '12px',
      background: isTotal ? 'rgba(16, 185, 129, 0.1)' : '#f8fafc',
      borderRadius: '8px',
      border: isTotal ? '1px solid rgba(16, 185, 129, 0.3)' : 'none'
    }}>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: '600', color: isTotal ? '#059669' : '#1a1a2e' }}>
        ${value?.toLocaleString()}
      </div>
    </div>
  );
}

function QuarterBox({ quarter, dueDate, amount }) {
  return (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
      <div style={{ fontWeight: '700', color: '#8b5cf6', fontSize: '1.1rem' }}>{quarter}</div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Due {dueDate}</div>
      <div style={{ fontWeight: '600', color: '#1a1a2e' }}>${amount?.toLocaleString()}</div>
    </div>
  );
}
