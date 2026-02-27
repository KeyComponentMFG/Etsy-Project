import React, { useState } from 'react';
import { AlertCircle, X, Palette, Printer, Box, Clock, ExternalLink } from 'lucide-react';
import { calculateConsumptionRate, calculateDaysUntilStockout } from '../../utils/inventoryUtils';

function LowStockAlerts({ filaments, externalParts, teamMembers, models, setActiveTab, filamentUsageHistory }) {
  const [dismissed, setDismissed] = useState(false);

  // Collect all low stock items with days-until-stockout
  const lowStockItems = [];

  // Check filaments — enhanced with consumption rate and days-until-stockout
  teamMembers.forEach(member => {
    const memberFilaments = filaments[member.id] || [];
    memberFilaments.forEach(fil => {
      const threshold = fil.reorderAt ?? 250;
      if (fil.amount <= threshold && (fil.backupRolls?.length || 0) === 0) {
        const consumptionRate = calculateConsumptionRate(fil.color, filamentUsageHistory || []);
        const daysUntilStockout = calculateDaysUntilStockout(fil, consumptionRate);

        let urgency = 'watch'; // default
        if (daysUntilStockout !== null) {
          if (daysUntilStockout < 7) urgency = 'critical';
          else if (daysUntilStockout < 14) urgency = 'low';
          else if (daysUntilStockout < 30) urgency = 'watch';
        }

        lowStockItems.push({
          type: 'filament',
          name: fil.color,
          member: member.name,
          current: `${fil.amount.toFixed(0)}g`,
          threshold: `${threshold}g`,
          daysUntilStockout,
          consumptionRate,
          urgency,
          supplierUrl: fil.supplierUrl || null
        });
      }
    });
  });

  // Check supplies
  teamMembers.forEach(member => {
    const memberParts = externalParts[member.id] || [];
    memberParts.forEach(part => {
      if (part.reorderAt && part.quantity <= part.reorderAt) {
        lowStockItems.push({
          type: 'supply',
          name: part.name,
          member: member.name,
          current: part.quantity.toString(),
          threshold: part.reorderAt.toString(),
          daysUntilStockout: null,
          urgency: 'watch'
        });
      }
    });
  });

  // Check model stock (stock count <= 3)
  (models || []).forEach(model => {
    if (model.stockCount !== null && model.stockCount !== undefined && model.stockCount <= 3) {
      lowStockItems.push({
        type: 'model',
        name: model.name + (model.variantName ? ` (${model.variantName})` : ''),
        current: model.stockCount.toString(),
        threshold: '3',
        daysUntilStockout: null,
        urgency: model.stockCount === 0 ? 'critical' : 'low'
      });
    }
  });

  // Sort by urgency: critical first, then low, then watch
  const urgencyOrder = { critical: 0, low: 1, watch: 2 };
  lowStockItems.sort((a, b) => {
    const urgencyDiff = (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
    if (urgencyDiff !== 0) return urgencyDiff;
    // Secondary sort by days until stockout (fewest first)
    if (a.daysUntilStockout !== null && b.daysUntilStockout !== null) {
      return a.daysUntilStockout - b.daysUntilStockout;
    }
    if (a.daysUntilStockout !== null) return -1;
    if (b.daysUntilStockout !== null) return 1;
    return 0;
  });

  // Don't show if dismissed or no items
  if (dismissed || lowStockItems.length === 0) return null;

  const getUrgencyBadge = (item) => {
    if (item.daysUntilStockout === null && item.type === 'filament') return null;

    if (item.urgency === 'critical') {
      return (
        <span className="urgency-badge critical">
          <Clock size={10} />
          {item.daysUntilStockout !== null ? `${item.daysUntilStockout}d left` : 'Critical'}
        </span>
      );
    }
    if (item.urgency === 'low') {
      return (
        <span className="urgency-badge low-stock">
          <Clock size={10} />
          {item.daysUntilStockout !== null ? `${item.daysUntilStockout}d left` : 'Low'}
        </span>
      );
    }
    if (item.urgency === 'watch' && item.daysUntilStockout !== null) {
      return (
        <span className="urgency-badge watch">
          <Clock size={10} />
          {item.daysUntilStockout}d left
        </span>
      );
    }
    return null;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 107, 107, 0.1) 100%)',
      border: '1px solid rgba(255, 193, 7, 0.4)',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px'
    }}>
      <AlertCircle size={24} style={{ color: '#ffc107', flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ margin: 0, color: '#ffc107', fontWeight: '600' }}>
            Low Stock Alert - {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} need restock
          </h4>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {lowStockItems.slice(0, 5).map((item, idx) => (
            <span key={idx} style={{
              background: item.type === 'filament' ? 'rgba(0, 204, 255, 0.2)' : item.type === 'model' ? 'rgba(165, 94, 234, 0.2)' : 'rgba(0, 255, 136, 0.2)',
              border: `1px solid ${item.type === 'filament' ? 'rgba(0, 204, 255, 0.4)' : item.type === 'model' ? 'rgba(165, 94, 234, 0.4)' : 'rgba(0, 255, 136, 0.4)'}`,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.8rem',
              color: item.type === 'filament' ? '#00ccff' : item.type === 'model' ? '#a55eea' : '#00ff88',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {item.type === 'filament' ? <Palette size={12} /> : item.type === 'model' ? <Printer size={12} /> : <Box size={12} />}
              {item.name} ({item.current})
              {getUrgencyBadge(item)}
              {item.supplierUrl && (
                <a
                  href={item.supplierUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ color: 'inherit', display: 'flex' }}
                  title="Quick Reorder"
                >
                  <ExternalLink size={10} />
                </a>
              )}
            </span>
          ))}
          {lowStockItems.length > 5 && (
            <span style={{ color: '#888', fontSize: '0.8rem', padding: '4px 10px' }}>
              +{lowStockItems.length - 5} more
            </span>
          )}
        </div>
        <button
          onClick={() => setActiveTab('restock')}
          style={{
            background: 'rgba(255, 193, 7, 0.2)',
            border: '1px solid rgba(255, 193, 7, 0.4)',
            borderRadius: '6px',
            padding: '6px 14px',
            color: '#ffc107',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}
        >
          View Restock List
        </button>
      </div>
    </div>
  );
}

export default LowStockAlerts;
