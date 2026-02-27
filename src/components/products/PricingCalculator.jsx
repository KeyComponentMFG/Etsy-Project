import React, { useState, useMemo } from 'react';
import { DollarSign, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { TRANSACTION_FEE_RATE, PAYMENT_PROCESSING_RATE, PAYMENT_PROCESSING_FLAT } from '../../constants/defaults';
import { calculateBOMCost } from '../../utils/inventoryUtils';

function PricingCalculator({ model, filaments, teamMembers, onClose }) {
  const memberId = teamMembers?.[0]?.id;
  const bomData = calculateBOMCost(model, filaments, memberId);

  // Pricing inputs — initialized from BOM, saved to localStorage per model
  const storageKey = `pricing_${model.id}`;
  const savedPrefs = (() => {
    try {
      const s = localStorage.getItem(storageKey);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  })();

  const [materialCost, setMaterialCost] = useState(savedPrefs?.materialCost ?? bomData.materialCost);
  const [printTimeHours, setPrintTimeHours] = useState(savedPrefs?.printTimeHours ?? (bomData.totalPrintMinutes / 60));
  const [electricityRate, setElectricityRate] = useState(savedPrefs?.electricityRate ?? 0.05);
  const [packagingCost, setPackagingCost] = useState(savedPrefs?.packagingCost ?? 1.00);
  const [laborRate, setLaborRate] = useState(savedPrefs?.laborRate ?? 15);
  const [shippingEstimate, setShippingEstimate] = useState(savedPrefs?.shippingEstimate ?? 0);
  const [targetMargin, setTargetMargin] = useState(savedPrefs?.targetMargin ?? 50);

  // Save preferences
  const savePrefs = () => {
    localStorage.setItem(storageKey, JSON.stringify({
      materialCost, printTimeHours, electricityRate, packagingCost, laborRate, shippingEstimate, targetMargin
    }));
  };

  // Calculations
  const calculations = useMemo(() => {
    const laborCost = printTimeHours * laborRate;
    const electricityCost = printTimeHours * electricityRate;
    const totalCosts = materialCost + laborCost + electricityCost + packagingCost + shippingEstimate;

    // Etsy fee rates
    const totalFeeRate = TRANSACTION_FEE_RATE + PAYMENT_PROCESSING_RATE;

    // Breakeven: costs + fees = price
    // price = (totalCosts + flat_fee) / (1 - feeRate)
    const breakevenPrice = (totalCosts + PAYMENT_PROCESSING_FLAT) / (1 - totalFeeRate);

    // Suggested price with margin
    const marginDecimal = targetMargin / 100;
    const suggestedPrice = (totalCosts + PAYMENT_PROCESSING_FLAT) / (1 - marginDecimal - totalFeeRate);

    // Etsy fees at suggested price
    const etsyFees = suggestedPrice * totalFeeRate + PAYMENT_PROCESSING_FLAT;
    const profit = suggestedPrice - totalCosts - etsyFees;

    // Breakdown for chart
    const breakdown = [
      { name: 'Materials', value: materialCost, color: '#3b82f6' },
      { name: 'Labor', value: laborCost, color: '#8b5cf6' },
      { name: 'Electricity', value: electricityCost, color: '#f59e0b' },
      { name: 'Packaging', value: packagingCost, color: '#6366f1' },
      { name: 'Shipping', value: shippingEstimate, color: '#94a3b8' },
      { name: 'Etsy Fees', value: etsyFees, color: '#ef4444' },
      { name: 'Profit', value: Math.max(0, profit), color: '#10b981' }
    ];

    return { totalCosts, breakevenPrice, suggestedPrice, etsyFees, profit, laborCost, electricityCost, breakdown };
  }, [materialCost, printTimeHours, electricityRate, packagingCost, laborRate, shippingEstimate, targetMargin]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '700px', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} />
            Pricing Calculator — {model.name} {model.variantName ? `(${model.variantName})` : ''}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e6e73' }}>
            <X size={20} />
          </button>
        </div>

        <div className="pricing-calculator">
          {/* Left: Inputs */}
          <div className="pricing-inputs">
            <div className="pricing-input-group">
              <label>Material Cost ($)</label>
              <input type="number" value={materialCost} onChange={e => setMaterialCost(parseFloat(e.target.value) || 0)} step="0.01" min="0" />
            </div>
            <div className="pricing-input-group">
              <label>Print Time (hours)</label>
              <input type="number" value={printTimeHours} onChange={e => setPrintTimeHours(parseFloat(e.target.value) || 0)} step="0.1" min="0" />
            </div>
            <div className="pricing-input-group">
              <label>Electricity Cost ($/hour)</label>
              <input type="number" value={electricityRate} onChange={e => setElectricityRate(parseFloat(e.target.value) || 0)} step="0.01" min="0" />
            </div>
            <div className="pricing-input-group">
              <label>Packaging Cost ($)</label>
              <input type="number" value={packagingCost} onChange={e => setPackagingCost(parseFloat(e.target.value) || 0)} step="0.25" min="0" />
            </div>
            <div className="pricing-input-group">
              <label>Labor Rate ($/hour)</label>
              <input type="number" value={laborRate} onChange={e => setLaborRate(parseFloat(e.target.value) || 0)} step="1" min="0" />
            </div>
            <div className="pricing-input-group">
              <label>Shipping Estimate ($)</label>
              <input type="number" value={shippingEstimate} onChange={e => setShippingEstimate(parseFloat(e.target.value) || 0)} step="0.5" min="0" />
            </div>
            <div className="pricing-input-group">
              <label>Target Margin: {targetMargin}%</label>
              <div className="slider-container">
                <span>20%</span>
                <input type="range" min="20" max="80" value={targetMargin} onChange={e => setTargetMargin(parseInt(e.target.value))} />
                <span>80%</span>
              </div>
            </div>
            <button
              onClick={savePrefs}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                cursor: 'pointer',
                fontSize: '0.85rem',
                marginTop: '8px'
              }}
            >
              Save Preferences
            </button>
          </div>

          {/* Right: Outputs */}
          <div className="pricing-outputs">
            <div className="pricing-price-card breakeven">
              <div className="price-label">Minimum Price (Breakeven)</div>
              <div className="price-value">${calculations.breakevenPrice.toFixed(2)}</div>
            </div>
            <div className="pricing-price-card suggested">
              <div className="price-label">Suggested Price ({targetMargin}% margin)</div>
              <div className="price-value">${calculations.suggestedPrice.toFixed(2)}</div>
            </div>

            {/* Cost Breakdown Details */}
            <div style={{ fontSize: '0.8rem', color: '#6e6e73' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Materials</span><span>${materialCost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Labor ({printTimeHours.toFixed(1)}h × ${laborRate})</span><span>${calculations.laborCost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Electricity</span><span>${calculations.electricityCost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Packaging</span><span>${packagingCost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Shipping</span><span>${shippingEstimate.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #e5e7eb', marginTop: '4px', fontWeight: '600' }}>
                <span>Etsy Fees (6.5% + 3% + $0.25)</span><span style={{ color: '#ef4444' }}>${calculations.etsyFees.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: '600', color: calculations.profit >= 0 ? '#10b981' : '#ef4444' }}>
                <span>Profit</span><span>${calculations.profit.toFixed(2)}</span>
              </div>
            </div>

            {/* Cost Breakdown Bar Chart */}
            <div style={{ marginTop: '8px' }}>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={[{ name: 'Breakdown', ...Object.fromEntries(calculations.breakdown.map(b => [b.name, b.value])) }]} layout="vertical" barSize={24}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  {calculations.breakdown.map(b => (
                    <Bar key={b.name} dataKey={b.name} stackId="cost" fill={b.color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingCalculator;
