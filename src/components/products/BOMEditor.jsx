import React from 'react';
import { DollarSign } from 'lucide-react';
import { calculateBOMCost } from '../../utils/inventoryUtils';
import { TRANSACTION_FEE_RATE, PAYMENT_PROCESSING_RATE, PAYMENT_PROCESSING_FLAT } from '../../constants/defaults';

function BOMEditor({ model, filaments, teamMembers }) {
  // Use first team member's filaments as reference for stock levels
  const memberId = teamMembers?.[0]?.id;
  const memberFilaments = filaments?.[memberId] || [];

  const bomData = calculateBOMCost(model, filaments, memberId);

  // Get filament stock status for a given color
  const getFilamentStock = (colorNeeded) => {
    if (!colorNeeded) return 'available';
    const lowerColor = (model.defaultColor || '').toLowerCase();
    const fil = memberFilaments.find(f => {
      const fColor = f.color.toLowerCase();
      return fColor === lowerColor || fColor.includes(lowerColor) || lowerColor.includes(fColor);
    });
    if (!fil) return 'missing';
    // Rough grams check
    const totalGrams = bomData.breakdown
      .filter(b => b.type === 'filament')
      .reduce((s, b) => s + b.cost / 0.025, 0);
    if (fil.amount < totalGrams) return 'missing';
    if (fil.amount < totalGrams * 2) return 'low';
    return 'available';
  };

  // Calculate suggested price with Etsy fees
  const targetMargin = 0.5; // 50% default
  const totalFeeRate = TRANSACTION_FEE_RATE + PAYMENT_PROCESSING_RATE;
  const suggestedPrice = bomData.totalCOGS > 0
    ? (bomData.totalCOGS + PAYMENT_PROCESSING_FLAT) / (1 - targetMargin - totalFeeRate)
    : 0;

  const filamentStockStatus = getFilamentStock(model.defaultColor);

  return (
    <div style={{ marginTop: '12px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#6e6e73', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <DollarSign size={14} /> Bill of Materials
      </h4>

      <table className="bom-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Quantity</th>
            <th>Cost</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {bomData.breakdown.map((item, idx) => (
            <tr key={idx}>
              <td>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>{item.type}</span>
                <br />
                {item.name}
              </td>
              <td>{item.quantity}</td>
              <td>${item.cost.toFixed(2)}</td>
              <td>
                <span className={`bom-stock-dot ${item.type === 'filament' ? filamentStockStatus : 'available'}`} />
                {item.type === 'filament' ? filamentStockStatus : 'OK'}
              </td>
            </tr>
          ))}
          {bomData.breakdown.length === 0 && (
            <tr>
              <td colSpan="4" style={{ color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                No materials configured. Add printer settings and external parts to see BOM.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {bomData.breakdown.length > 0 && (
        <div className="bom-summary">
          <div className="bom-summary-item">
            <div className="bom-summary-value">${bomData.materialCost.toFixed(2)}</div>
            <div className="bom-summary-label">Material Cost</div>
          </div>
          <div className="bom-summary-item">
            <div className="bom-summary-value">${bomData.laborCost.toFixed(2)}</div>
            <div className="bom-summary-label">Labor ({(bomData.totalPrintMinutes / 60).toFixed(1)}h)</div>
          </div>
          <div className="bom-summary-item">
            <div className="bom-summary-value">${bomData.electricityCost.toFixed(2)}</div>
            <div className="bom-summary-label">Electricity</div>
          </div>
          <div className="bom-summary-item">
            <div className="bom-summary-value" style={{ color: '#6366f1' }}>${bomData.totalCOGS.toFixed(2)}</div>
            <div className="bom-summary-label">Total COGS</div>
          </div>
          {suggestedPrice > 0 && (
            <div className="bom-summary-item">
              <div className="bom-summary-value" style={{ color: '#10b981' }}>${suggestedPrice.toFixed(2)}</div>
              <div className="bom-summary-label">Suggested ({(targetMargin * 100).toFixed(0)}% margin)</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BOMEditor;
