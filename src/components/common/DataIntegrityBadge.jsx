import { useState, useRef, useEffect } from 'react';
import { Shield, AlertTriangle, AlertCircle, Info, ChevronDown, X } from 'lucide-react';

const SEVERITY_CONFIG = {
  error: { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Error' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Warning' },
  info: { icon: Info, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', label: 'Info' },
};

export default function DataIntegrityBadge({ validation }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!validation) return null;

  const { status, alerts, errorCount, warningCount, computeTimeMs } = validation;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  const badgeColor = status === 'error' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981';
  const BadgeIcon = status === 'error' ? AlertCircle : status === 'warning' ? AlertTriangle : Shield;
  const totalIssues = errorCount + warningCount;

  return (
    <div className="data-integrity-badge-wrapper" ref={panelRef}>
      <button
        className={`data-integrity-badge ${status}`}
        onClick={() => setOpen(!open)}
        title={`Data integrity: ${status} (${totalIssues} issues)`}
      >
        <BadgeIcon size={16} />
        {totalIssues > 0 && <span className="badge-count">{totalIssues}</span>}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div className="data-integrity-panel">
          <div className="integrity-panel-header">
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Data Integrity</h4>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {alerts.length} checks &middot; {computeTimeMs}ms
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="integrity-summary">
            {errorCount > 0 && (
              <span className="integrity-summary-chip error">
                <AlertCircle size={12} /> {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="integrity-summary-chip warning">
                <AlertTriangle size={12} /> {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
            {infoCount > 0 && (
              <span className="integrity-summary-chip info">
                <Info size={12} /> {infoCount} info
              </span>
            )}
            {totalIssues === 0 && infoCount === 0 && (
              <span className="integrity-summary-chip valid">
                <Shield size={12} /> All checks passed
              </span>
            )}
          </div>

          <div className="integrity-alerts-list">
            {alerts.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No issues detected
              </div>
            )}
            {alerts.slice(0, 50).map((alert, idx) => {
              const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
              const Icon = config.icon;
              return (
                <div key={idx} className={`integrity-alert ${alert.severity}`}>
                  <Icon size={14} style={{ color: config.color, flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#334155' }}>{alert.description}</div>
                    {alert.impact > 0 && (
                      <span style={{ fontSize: '11px', color: config.color, fontWeight: 600 }}>
                        ${alert.impact.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} impact
                      </span>
                    )}
                  </div>
                  <span className="integrity-alert-tag" style={{ background: config.bg, color: config.color }}>
                    {alert.check}
                  </span>
                </div>
              );
            })}
            {alerts.length > 50 && (
              <div style={{ padding: '8px 16px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                + {alerts.length - 50} more alerts
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
