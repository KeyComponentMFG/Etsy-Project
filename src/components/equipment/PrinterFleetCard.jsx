import React, { useState } from 'react';
import { Printer, Clock, Zap, Settings, Play, Pause, AlertCircle, Package } from 'lucide-react';

function PrinterFleetCard({ printer, printerStatus, orders, teamMembers, onUpdateStatus, onStartJob }) {
  const status = printerStatus || { status: 'idle', currentJobOrderId: null, startedAt: null, estimatedEndAt: null, notes: '' };
  const [showActions, setShowActions] = useState(false);

  // Get current job info
  const currentJob = status.currentJobOrderId
    ? orders.find(o => o.orderId === status.currentJobOrderId)
    : null;

  // Calculate progress
  let progress = 0;
  if (status.status === 'printing' && status.startedAt && status.estimatedEndAt) {
    const elapsed = Date.now() - status.startedAt;
    const total = status.estimatedEndAt - status.startedAt;
    progress = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
  }

  // ETA countdown
  let etaText = '';
  if (status.status === 'printing' && status.estimatedEndAt) {
    const remaining = status.estimatedEndAt - Date.now();
    if (remaining > 0) {
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      etaText = `${hours}h ${minutes}m remaining`;
    } else {
      etaText = 'Should be done';
    }
  }

  // Calculate utilization (simplified: active hours / total hours tracked)
  const totalHours = printer.totalHours || 0;
  const utilization = totalHours > 0 ? Math.min(100, (totalHours / (totalHours + 24)) * 100) : 0;

  // Get assignee name
  const owner = printer.ownerId ? teamMembers?.find(m => m.id === printer.ownerId) : null;

  // Active orders on this printer
  const printerOrders = orders.filter(o => o.printerId === printer.id && o.status === 'received');

  return (
    <div className={`fleet-card status-${status.status}`}>
      <div className="fleet-card-header">
        <div className="fleet-card-name">
          <Printer size={18} />
          {printer.name}
          {owner && <span style={{ fontSize: '0.75rem', color: '#6e6e73', fontWeight: 'normal' }}>({owner.name})</span>}
        </div>
        <span className={`fleet-status-badge ${status.status}`}>
          {status.status}
        </span>
      </div>

      {/* Current Job Info */}
      {status.status === 'printing' && currentJob && (
        <div className="fleet-job-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>#{currentJob.orderId}</div>
              <div style={{ fontSize: '0.8rem', color: '#6e6e73' }}>{currentJob.item}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#3b82f6' }}>
              {etaText}
            </div>
          </div>
          <div className="fleet-progress-bar">
            <div className="fleet-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: '#94a3b8' }}>
            <span>{progress.toFixed(0)}% complete</span>
            {status.startedAt && <span>Started {new Date(status.startedAt).toLocaleTimeString()}</span>}
          </div>
        </div>
      )}

      {/* Maintenance notes */}
      {status.status === 'maintenance' && status.notes && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(245, 158, 11, 0.08)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#f59e0b',
          marginBottom: '8px'
        }}>
          {status.notes}
        </div>
      )}

      {/* Stats Row */}
      <div className="fleet-stats">
        <div className="fleet-stat-item">
          <Clock size={14} />
          {(printer.totalHours || 0).toFixed(1)}h total
        </div>
        <div className="fleet-stat-item">
          <Zap size={14} />
          {utilization.toFixed(0)}% util
        </div>
        <div className="fleet-stat-item">
          <Package size={14} />
          {printerOrders.length} queued
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fleet-actions">
        {status.status === 'idle' && (
          <button onClick={() => onStartJob && onStartJob(printer.id)}>
            <Play size={14} /> Start Job
          </button>
        )}
        {status.status === 'printing' && (
          <button onClick={() => onUpdateStatus(printer.id, { status: 'idle', currentJobOrderId: null, startedAt: null, estimatedEndAt: null })}>
            <Pause size={14} /> Mark Idle
          </button>
        )}
        {status.status !== 'maintenance' && (
          <button onClick={() => {
            const note = prompt('Maintenance notes (optional):') || '';
            onUpdateStatus(printer.id, { status: 'maintenance', notes: note, currentJobOrderId: null });
          }}>
            <Settings size={14} /> Maintenance
          </button>
        )}
        {status.status === 'maintenance' && (
          <button onClick={() => onUpdateStatus(printer.id, { status: 'idle', notes: '' })}>
            <Zap size={14} /> Back Online
          </button>
        )}
        {status.status === 'error' && (
          <button onClick={() => onUpdateStatus(printer.id, { status: 'idle', notes: '' })}>
            <AlertCircle size={14} /> Clear Error
          </button>
        )}
      </div>
    </div>
  );
}

export default PrinterFleetCard;
