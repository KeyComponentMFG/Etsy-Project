import { useMemo } from 'react';

/**
 * Shared price parser — strips non-numeric chars, validates format.
 * Returns a number or 0 if malformed.
 */
export function parsePrice(value) {
  if (value == null) return 0;
  const str = String(value);

  // Flag multiple decimal points as malformed
  const dotCount = (str.match(/\./g) || []).length;
  if (dotCount > 1) return 0;

  const cleaned = str.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num) || !isFinite(num)) return 0;
  return num;
}

const ANOMALY_THRESHOLD = 100000;

/**
 * Data validation hook — runs 6 checks on every data change.
 *
 * @param {{ orders: Array, archivedOrders: Array, models: Array }} params
 * @returns {{ status: string, alerts: Array, errorCount: number, warningCount: number, correctedTotals: object, discrepancy: number, computeTimeMs: number }}
 */
export function useDataValidator({ orders = [], archivedOrders = [], models = [] }) {
  return useMemo(() => {
    const start = performance.now();
    const alerts = [];

    const allOrders = [
      ...orders.filter(o => o.status === 'shipped'),
      ...(archivedOrders || []).filter(o => o.status === 'shipped'),
    ];

    // --- Check 1: Multi-item price check ---
    allOrders.forEach(order => {
      if (order.lineItems && order.lineItems.length > 1) {
        alerts.push({
          severity: 'warning',
          check: 'multi-item',
          orderId: order.orderId,
          description: `Multi-item order "${order.orderId}" has ${order.lineItems.length} items — revenue should be split across products`,
          impact: parsePrice(order.price),
        });
      }
    });

    // --- Check 2: Cross-validation (per-model sum vs total) ---
    let totalRevenue = 0;
    const modelRevenue = {};

    allOrders.forEach(order => {
      const price = parsePrice(order.price);
      if (price <= 0 || price > ANOMALY_THRESHOLD) return;
      totalRevenue += price;

      const item = order.item || 'Unknown';
      const base = item.split('|')[0].trim() || item;
      modelRevenue[base] = (modelRevenue[base] || 0) + price;
    });

    const modelSum = Object.values(modelRevenue).reduce((s, v) => s + v, 0);
    const discrepancy = Math.abs(totalRevenue - modelSum);
    if (discrepancy > 0.01) {
      alerts.push({
        severity: 'error',
        check: 'cross-validation',
        description: `Revenue discrepancy: total $${totalRevenue.toFixed(2)} vs model sum $${modelSum.toFixed(2)} (diff $${discrepancy.toFixed(2)})`,
        impact: discrepancy,
      });
    }

    // --- Check 3: Anomaly detection ---
    allOrders.forEach(order => {
      const price = parsePrice(order.price);
      const qty = order.quantity || 1;

      if (price === 0) {
        alerts.push({
          severity: 'warning',
          check: 'anomaly',
          orderId: order.orderId,
          description: `Order "${order.orderId}" has $0 price`,
          impact: 0,
        });
      }
      if (price > ANOMALY_THRESHOLD) {
        alerts.push({
          severity: 'error',
          check: 'anomaly',
          orderId: order.orderId,
          description: `Order "${order.orderId}" exceeds $100k threshold ($${price.toLocaleString()})`,
          impact: price,
        });
      }
      if (price < 0) {
        alerts.push({
          severity: 'error',
          check: 'anomaly',
          orderId: order.orderId,
          description: `Order "${order.orderId}" has negative price ($${price})`,
          impact: Math.abs(price),
        });
      }
      if (qty <= 0) {
        alerts.push({
          severity: 'warning',
          check: 'anomaly',
          orderId: order.orderId,
          description: `Order "${order.orderId}" has zero or negative quantity (${qty})`,
          impact: 0,
        });
      }
      // Suspicious tax (>20% of order total)
      if (order.salesTax != null && order.salesTax > price * 0.2 && price > 0) {
        alerts.push({
          severity: 'warning',
          check: 'anomaly',
          orderId: order.orderId,
          description: `Order "${order.orderId}" has suspicious sales tax ($${order.salesTax} on $${price} order)`,
          impact: order.salesTax,
        });
      }
    });

    // --- Check 4: Archive status check ---
    (archivedOrders || []).forEach(order => {
      if (order.status && order.status !== 'shipped') {
        alerts.push({
          severity: 'warning',
          check: 'archive-status',
          orderId: order.orderId,
          description: `Archived order "${order.orderId}" has status "${order.status}" (not shipped)`,
          impact: parsePrice(order.price),
        });
      }
    });

    // --- Check 5: Price parsing check ---
    allOrders.forEach(order => {
      const raw = String(order.price || '');
      const dotCount = (raw.match(/\./g) || []).length;
      if (dotCount > 1) {
        alerts.push({
          severity: 'error',
          check: 'price-parse',
          orderId: order.orderId,
          description: `Order "${order.orderId}" has malformed price "${raw}" (multiple decimals)`,
          impact: 0,
        });
      }
      if (raw && !/^[\s$]*[\d,.]+\s*$/.test(raw) && raw !== '0') {
        // Contains unexpected characters beyond $, digits, commas, dots
        const unusual = raw.replace(/[\s$\d,.]/g, '');
        if (unusual.length > 0) {
          alerts.push({
            severity: 'warning',
            check: 'price-parse',
            orderId: order.orderId,
            description: `Order "${order.orderId}" price has unusual characters: "${raw}"`,
            impact: 0,
          });
        }
      }
    });

    // --- Check 6: Model match check ---
    if (models.length > 0) {
      const modelNames = new Set(models.map(m => m.name?.toLowerCase()).filter(Boolean));
      const modelAliases = new Set();
      models.forEach(m => {
        if (m.aliases) {
          m.aliases.forEach(a => modelAliases.add(a.toLowerCase()));
        }
      });

      allOrders.forEach(order => {
        const item = (order.item || '').toLowerCase();
        if (!item || item === 'unknown') return;

        // Skip multi-item combined names (they contain " + ")
        if (item.includes(' + ')) return;

        const baseName = item.split('|')[0].trim();
        const matched = modelNames.has(baseName) ||
          [...modelNames].some(mn => baseName.includes(mn) || mn.includes(baseName)) ||
          [...modelAliases].some(a => baseName.includes(a) || a.includes(baseName));

        if (!matched) {
          alerts.push({
            severity: 'info',
            check: 'model-match',
            orderId: order.orderId,
            description: `Item "${order.item}" doesn't match any model definition`,
            impact: parsePrice(order.price),
          });
        }
      });
    }

    // Compute results
    const errorCount = alerts.filter(a => a.severity === 'error').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const status = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'valid';

    const correctedTotals = {
      revenue: totalRevenue,
      orders: allOrders.length,
      modelRevenue,
    };

    const computeTimeMs = Math.round((performance.now() - start) * 100) / 100;

    return {
      status,
      alerts,
      errorCount,
      warningCount,
      correctedTotals,
      discrepancy,
      computeTimeMs,
    };
  }, [orders, archivedOrders, models]);
}
