import React, { useState } from 'react';
import { AlertCircle, X, Palette, Printer, Box } from 'lucide-react';

function LowStockAlerts({ filaments, externalParts, teamMembers, models, setActiveTab }) {
  const [dismissed, setDismissed] = useState(false);

  // Collect all low stock items
  const lowStockItems = [];

  // Check filaments
  teamMembers.forEach(member => {
    const memberFilaments = filaments[member.id] || [];
    memberFilaments.forEach(fil => {
      const threshold = fil.reorderAt ?? 250;
      if (fil.amount <= threshold && (fil.backupRolls?.length || 0) === 0) {
        lowStockItems.push({
          type: 'filament',
          name: fil.color,
          member: member.name,
          current: `${fil.amount.toFixed(0)}g`,
          threshold: `${threshold}g`
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
          threshold: part.reorderAt.toString()
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
        threshold: '3'
      });
    }
  });

  // Don't show if dismissed or no items
  if (dismissed || lowStockItems.length === 0) return null;

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
              color: item.type === 'filament' ? '#00ccff' : item.type === 'model' ? '#a55eea' : '#00ff88'
            }}>
              {item.type === 'filament' ? <Palette size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> : item.type === 'model' ? <Printer size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> : <Box size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
              {item.name} ({item.current})
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
