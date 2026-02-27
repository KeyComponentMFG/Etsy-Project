import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Palette } from 'lucide-react';
import { calculateMaterialAvailability } from '../../utils/inventoryUtils';

function PrintQueueCard({ order, model, filaments, printers, teamMembers }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: order.orderId || order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Material availability check
  const availability = model
    ? calculateMaterialAvailability(order, model, filaments, order.assignedTo)
    : { status: 'missing', details: [] };

  // Get printer name
  const printer = printers?.find(p => p.id === order.printerId);
  const assignee = teamMembers?.find(m => m.id === order.assignedTo);

  // Estimate print time from model
  let printMinutes = 0;
  if (model?.printerSettings?.[0]?.plates) {
    model.printerSettings[0].plates.forEach(plate => {
      printMinutes += (parseInt(plate.printHours) || 0) * 60 + (parseInt(plate.printMinutes) || 0);
    });
  }
  if (order.isExtraPrint && order.extraPrintMinutes) {
    printMinutes = order.extraPrintMinutes;
  }

  const barFillPercent = availability.status === 'available' ? 100
    : availability.status === 'low' ? 60
    : 30;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`print-queue-card ${isDragging ? 'dnd-dragging' : ''}`}
    >
      <div className="dnd-handle" {...attributes} {...listeners}>
        <GripVertical size={18} />
      </div>

      <div className="pqc-info">
        <div className="pqc-order-id">#{order.orderId}</div>
        <div className="pqc-product">{order.item} {order.quantity > 1 ? `×${order.quantity}` : ''}</div>
        <div className="pqc-meta">
          {order.color && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Palette size={12} /> {order.color}
            </span>
          )}
          {printMinutes > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={12} /> {Math.floor(printMinutes / 60)}h {printMinutes % 60}m
            </span>
          )}
          {printer && <span>{printer.name}</span>}
          {assignee && <span>{assignee.name}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <div className="availability-bar">
          <div
            className={`bar-fill ${availability.status}`}
            style={{ width: `${barFillPercent}%` }}
          />
        </div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
          {availability.status === 'available' ? 'Ready' : availability.status === 'low' ? 'Low' : 'Missing'}
        </span>
      </div>
    </div>
  );
}

export default PrintQueueCard;
