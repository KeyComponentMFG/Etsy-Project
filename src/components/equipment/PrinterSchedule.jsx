import React, { useState, useMemo } from 'react';
import { Printer, Clock } from 'lucide-react';

const TIME_SCALES = {
  '12h': { hours: 12, label: '12h' },
  '24h': { hours: 24, label: '24h' },
  '3day': { hours: 72, label: '3 Day' },
  'week': { hours: 168, label: 'Week' }
};

function PrinterSchedule({ printers, printerStatus, orders, models, teamMembers }) {
  const [timeScale, setTimeScale] = useState('24h');

  const scaleConfig = TIME_SCALES[timeScale];
  const now = Date.now();
  const startTime = now - scaleConfig.hours * 0.1 * 60 * 60 * 1000; // Start slightly before now
  const endTime = now + scaleConfig.hours * 0.9 * 60 * 60 * 1000;
  const totalMs = endTime - startTime;

  // Generate time labels
  const timeLabels = useMemo(() => {
    const labels = [];
    const intervalHours = scaleConfig.hours <= 12 ? 1 : scaleConfig.hours <= 24 ? 2 : scaleConfig.hours <= 72 ? 6 : 12;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    // Snap to nearest interval
    let t = Math.ceil(startTime / intervalMs) * intervalMs;
    while (t < endTime) {
      const d = new Date(t);
      const label = scaleConfig.hours <= 24
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
      const position = ((t - startTime) / totalMs) * 100;
      labels.push({ label, position });
      t += intervalMs;
    }
    return labels;
  }, [timeScale, startTime, endTime, totalMs, scaleConfig.hours]);

  // Build jobs for each printer from printerStatus + orders
  const getJobsForPrinter = (printerId) => {
    const jobs = [];
    const status = (printerStatus || {})[printerId];

    // Current active job
    if (status?.status === 'printing' && status.startedAt) {
      const currentOrder = status.currentJobOrderId
        ? orders.find(o => o.orderId === status.currentJobOrderId)
        : null;
      jobs.push({
        id: `active-${printerId}`,
        orderId: currentOrder?.orderId || 'Unknown',
        productName: currentOrder?.item || 'Current Job',
        start: status.startedAt,
        end: status.estimatedEndAt || (status.startedAt + 2 * 60 * 60 * 1000),
        status: 'printing'
      });
    }

    // Scheduled jobs from orders assigned to this printer
    const printerOrders = orders.filter(o =>
      o.printerId === printerId && o.status === 'received' &&
      (!status?.currentJobOrderId || o.orderId !== status.currentJobOrderId)
    );

    let nextStart = status?.estimatedEndAt || now;
    printerOrders.forEach(order => {
      // Estimate duration from model
      let durationMs = 2 * 60 * 60 * 1000; // Default 2h
      const model = models?.find(m => {
        const lowerItem = (order.item || '').toLowerCase();
        return m.name.toLowerCase().includes(lowerItem) || lowerItem.includes(m.name.toLowerCase()) ||
          (m.aliases || []).some(a => a.toLowerCase().includes(lowerItem) || lowerItem.includes(a.toLowerCase()));
      });

      if (model?.printerSettings?.[0]?.plates) {
        let totalMin = 0;
        model.printerSettings[0].plates.forEach(p => {
          totalMin += (parseInt(p.printHours) || 0) * 60 + (parseInt(p.printMinutes) || 0);
        });
        if (totalMin > 0) durationMs = totalMin * 60 * 1000;
      }

      if (order.isExtraPrint && order.extraPrintMinutes) {
        durationMs = order.extraPrintMinutes * 60 * 1000;
      }

      jobs.push({
        id: order.orderId,
        orderId: order.orderId,
        productName: order.item,
        start: nextStart,
        end: nextStart + durationMs,
        status: 'scheduled'
      });
      nextStart += durationMs;
    });

    // Completed jobs from fulfilled orders (show within time window)
    const completedOrders = orders.filter(o =>
      o.printerId === printerId &&
      (o.status === 'fulfilled' || o.status === 'shipped') &&
      o.fulfilledAt && o.fulfilledAt >= startTime
    );

    completedOrders.forEach(order => {
      jobs.push({
        id: `done-${order.orderId}`,
        orderId: order.orderId,
        productName: order.item,
        start: order.fulfilledAt - 2 * 60 * 60 * 1000,
        end: order.fulfilledAt,
        status: 'completed'
      });
    });

    return jobs;
  };

  // Now line position
  const nowPosition = ((now - startTime) / totalMs) * 100;

  return (
    <div className="gantt-container">
      <div className="gantt-header">
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
          <Clock size={20} /> Printer Schedule
        </h3>
        <div className="gantt-time-toggle">
          {Object.entries(TIME_SCALES).map(([key, config]) => (
            <button
              key={key}
              className={timeScale === key ? 'active' : ''}
              onClick={() => setTimeScale(key)}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', marginTop: '12px' }}>
        {/* Time labels */}
        <div style={{ position: 'relative', height: '24px', borderBottom: '2px solid #e5e7eb', marginLeft: '140px' }}>
          {timeLabels.map((tl, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${tl.position}%`,
                transform: 'translateX(-50%)',
                fontSize: '0.7rem',
                color: '#94a3b8',
                whiteSpace: 'nowrap'
              }}
            >
              {tl.label}
            </span>
          ))}
        </div>

        {/* Printer rows */}
        {printers.map(printer => {
          const status = (printerStatus || {})[printer.id];
          const jobs = getJobsForPrinter(printer.id);

          return (
            <div key={printer.id} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', minHeight: '48px' }}>
              {/* Printer label */}
              <div className="gantt-row-label">
                <Printer size={14} />
                <span>{printer.name}</span>
                {status && (
                  <span className={`fleet-status-badge ${status.status || 'idle'}`} style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                    {(status.status || 'idle').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Timeline area */}
              <div className="gantt-row-timeline" style={{ flex: 1, position: 'relative' }}>
                {jobs.map(job => {
                  const left = Math.max(0, ((job.start - startTime) / totalMs) * 100);
                  const width = Math.min(100 - left, ((job.end - job.start) / totalMs) * 100);
                  if (width <= 0 || left >= 100) return null;

                  return (
                    <div
                      key={job.id}
                      className={`gantt-bar ${job.status}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${job.orderId}: ${job.productName}\n${new Date(job.start).toLocaleTimeString()} - ${new Date(job.end).toLocaleTimeString()}`}
                    >
                      {width > 5 && <span>{job.productName}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Now line */}
        {nowPosition > 0 && nowPosition < 100 && (
          <div className="gantt-now-line" style={{ left: `calc(140px + ${nowPosition}% * (100% - 140px) / 100%)`, marginLeft: '140px', left: `${nowPosition}%` }}>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrinterSchedule;
