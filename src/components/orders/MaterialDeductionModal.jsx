import React, { useState, useMemo } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

function MaterialDeductionModal({ order, model, filaments, externalParts, memberId, onConfirm, onCancel }) {
  // Calculate planned materials from model
  const plannedMaterials = useMemo(() => {
    const materials = [];
    const quantity = order.quantity || 1;
    const orderColor = order.color || model?.defaultColor || 'Unknown';

    // Filament usage
    if (model) {
      const printerSettings = model.printerSettings?.find(ps => ps.printerId === order.printerId) || model.printerSettings?.[0];
      let filamentGrams = 0;

      if (printerSettings?.plates?.length > 0) {
        printerSettings.plates.forEach(plate => {
          if (plate.parts?.length > 0) {
            plate.parts.forEach(part => {
              if (!part.isMultiColor) {
                const partQty = parseInt(part.quantity) || 1;
                filamentGrams += (parseFloat(part.filamentUsage) || 0) * partQty;
              }
            });
          } else if (plate.filamentUsage) {
            filamentGrams += parseFloat(plate.filamentUsage) || 0;
          }
        });
      } else if (model.filamentUsage) {
        filamentGrams = parseFloat(model.filamentUsage) || 0;
      }

      materials.push({
        type: 'filament',
        name: `${orderColor} Filament`,
        planned: filamentGrams * quantity,
        unit: 'g'
      });

      // External parts
      if (model.externalParts?.length > 0) {
        model.externalParts.forEach(part => {
          materials.push({
            type: 'part',
            name: part.name,
            planned: (part.quantity || 1) * quantity,
            unit: 'pcs'
          });
        });
      }
    }

    return materials;
  }, [model, order]);

  // Initialize actual values with planned values
  const [actualValues, setActualValues] = useState(() => {
    const values = {};
    plannedMaterials.forEach((m, idx) => {
      values[idx] = m.planned;
    });
    return values;
  });

  const updateActual = (idx, value) => {
    setActualValues(prev => ({ ...prev, [idx]: parseFloat(value) || 0 }));
  };

  const handleConfirm = () => {
    // Build the confirmed materials data
    const confirmedMaterials = plannedMaterials.map((m, idx) => ({
      ...m,
      actual: actualValues[idx] || 0,
      variance: (actualValues[idx] || 0) - m.planned
    }));
    onConfirm(confirmedMaterials);
  };

  return (
    <div className="deduction-modal-overlay" onClick={onCancel}>
      <div className="deduction-modal" onClick={e => e.stopPropagation()}>
        <div className="deduction-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} color="#f59e0b" />
            Confirm Material Deduction
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#6e6e73' }}>
            Order #{order.orderId} — {order.item} {order.quantity > 1 ? `×${order.quantity}` : ''}
          </p>
        </div>

        <div className="deduction-body">
          {/* Header Row */}
          <div style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '2px solid #e5e7eb', marginBottom: '4px' }}>
            <div style={{ flex: 1, fontWeight: '600', fontSize: '0.8rem', color: '#6e6e73' }}>Material</div>
            <div style={{ width: '80px', textAlign: 'center', fontWeight: '600', fontSize: '0.8rem', color: '#6e6e73' }}>Planned</div>
            <div style={{ width: '80px', textAlign: 'center', fontWeight: '600', fontSize: '0.8rem', color: '#6e6e73' }}>Actual</div>
            <div style={{ width: '100px', textAlign: 'right', fontWeight: '600', fontSize: '0.8rem', color: '#6e6e73' }}>Variance</div>
          </div>

          {plannedMaterials.map((material, idx) => {
            const actual = actualValues[idx] || 0;
            const variance = actual - material.planned;
            return (
              <div key={idx} className="deduction-row">
                <div className="deduction-name">
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>{material.type}</span>
                  <br />
                  {material.name}
                </div>
                <div className="deduction-planned">
                  {material.planned.toFixed(material.unit === 'g' ? 1 : 0)}{material.unit}
                </div>
                <div className="deduction-actual">
                  <input
                    type="number"
                    value={actual}
                    onChange={e => updateActual(idx, e.target.value)}
                    min="0"
                    step={material.unit === 'g' ? '0.1' : '1'}
                  />
                </div>
                <div className={`deduction-variance ${variance > 0 ? 'positive' : variance < 0 ? 'negative' : ''}`}>
                  {variance !== 0 && (
                    <>
                      {variance > 0 ? '+' : ''}{variance.toFixed(material.unit === 'g' ? 1 : 0)}{material.unit}
                      {variance > 0 ? ' waste' : ' saved'}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {plannedMaterials.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
              No materials tracked for this order's model.
            </div>
          )}
        </div>

        <div className="deduction-footer">
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <X size={14} /> Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={14} /> Confirm & Deduct
          </button>
        </div>
      </div>
    </div>
  );
}

export default MaterialDeductionModal;
