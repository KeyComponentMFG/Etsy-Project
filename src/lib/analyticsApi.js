/**
 * Analytics API Service
 * Connects to the Python analytics backend for financial data, health scores, and AI insights
 */

// Production URL that is always available (Railway)
const PRODUCTION_URL = 'https://web-production-7f385.up.railway.app';
const LOCAL_URL = 'http://localhost:8070';

// Resolved API base URL — starts as production, upgraded to local if available
let _resolvedBaseUrl = null;

/**
 * Determine the best API URL. Tries local first (fast for devs),
 * falls back to production Railway URL which is always online.
 */
async function resolveBaseUrl() {
  if (_resolvedBaseUrl) return _resolvedBaseUrl;

  // If env var is explicitly set, use it directly
  if (import.meta.env.VITE_ANALYTICS_API_URL) {
    _resolvedBaseUrl = import.meta.env.VITE_ANALYTICS_API_URL;
    return _resolvedBaseUrl;
  }

  // Try local server with a quick ping (2s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${LOCAL_URL}/api/diagnostics`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      _resolvedBaseUrl = LOCAL_URL;
      console.log('[Analytics] Using local server');
      return _resolvedBaseUrl;
    }
  } catch {
    // Local not available — that's fine
  }

  // Fall back to production (always available)
  _resolvedBaseUrl = PRODUCTION_URL;
  console.log('[Analytics] Using production server');
  return _resolvedBaseUrl;
}

// Expose for external reads (will be populated after first call)
export { PRODUCTION_URL };
export const getApiBaseUrl = () => _resolvedBaseUrl || PRODUCTION_URL;

/**
 * Fetch with error handling, timeout, and automatic failover.
 * The analytics backend does not require auth — no Authorization header is sent.
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(id);

    // If local server failed, failover to production and retry once
    if (_resolvedBaseUrl === LOCAL_URL && url.startsWith(LOCAL_URL)) {
      console.log('[Analytics] Local server failed, falling back to production');
      _resolvedBaseUrl = PRODUCTION_URL;
      const prodUrl = url.replace(LOCAL_URL, PRODUCTION_URL);
      return fetchWithTimeout(prodUrl, options, timeout);
    }

    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Helper: build a full URL from a path using the resolved base
 */
async function apiUrl(path) {
  const base = await resolveBaseUrl();
  return `${base}${path}`;
}

/**
 * Get complete dashboard overview
 */
export async function getOverview() {
  return fetchWithTimeout(await apiUrl('/api/overview'));
}

/**
 * Get business health score with breakdown
 */
export async function getHealthScore() {
  return fetchWithTimeout(await apiUrl('/api/health'));
}

/**
 * Get AI-generated daily briefing
 */
export async function getBriefing() {
  return fetchWithTimeout(await apiUrl('/api/briefing'));
}

/**
 * Get priority action items
 */
export async function getActions() {
  return fetchWithTimeout(await apiUrl('/api/actions'));
}

/**
 * Get detailed financial breakdown
 */
export async function getFinancials() {
  return fetchWithTimeout(await apiUrl('/api/financials'));
}

/**
 * Get tax calculations and estimates
 */
export async function getTaxInfo() {
  return fetchWithTimeout(await apiUrl('/api/tax'));
}

/**
 * Get basic diagnostics (lightweight health check)
 */
export async function getDiagnostics() {
  return fetchWithTimeout(await apiUrl('/api/diagnostics'));
}

/**
 * Force reload data on the analytics server
 */
export async function reloadAnalytics() {
  return fetchWithTimeout(await apiUrl('/api/reload'));
}

/**
 * Check if analytics API is available
 */
export async function checkApiHealth() {
  try {
    // resolveBaseUrl already tries local then production — so if it resolves, we're good
    const base = await resolveBaseUrl();
    await fetchWithTimeout(`${base}/api/diagnostics`, {}, 5000);
    return true;
  } catch {
    // Clear cached URL so next attempt re-probes
    _resolvedBaseUrl = null;
    return false;
  }
}

/**
 * Get bank ledger with transactions
 */
export async function getBankLedger() {
  return fetchWithTimeout(await apiUrl('/api/bank/ledger'));
}

/**
 * Get bank summary with categories
 */
export async function getBankSummary() {
  return fetchWithTimeout(await apiUrl('/api/bank/summary'));
}

/**
 * Get detailed P&L statement
 */
export async function getPnL() {
  return fetchWithTimeout(await apiUrl('/api/pnl'));
}

/**
 * Get inventory/COGS summary
 */
export async function getInventorySummary() {
  return fetchWithTimeout(await apiUrl('/api/inventory/summary'));
}

/**
 * Get business valuation estimates
 */
export async function getValuation() {
  return fetchWithTimeout(await apiUrl('/api/valuation'));
}

/**
 * Get shipping analysis
 */
export async function getShipping() {
  return fetchWithTimeout(await apiUrl('/api/shipping'));
}

/**
 * Get fee breakdown
 */
export async function getFees() {
  return fetchWithTimeout(await apiUrl('/api/fees'));
}

// ─── Chart Data Endpoints ────────────────────────────────────────────────────

export async function getMonthlyPerformance() {
  return fetchWithTimeout(await apiUrl('/api/charts/monthly-performance'));
}

export async function getDailySales() {
  return fetchWithTimeout(await apiUrl('/api/charts/daily-sales'));
}

export async function getExpenseBreakdown() {
  return fetchWithTimeout(await apiUrl('/api/charts/expense-breakdown'));
}

export async function getCashFlow() {
  return fetchWithTimeout(await apiUrl('/api/charts/cash-flow'));
}

export async function getTopProducts() {
  return fetchWithTimeout(await apiUrl('/api/charts/products'));
}

export async function getHealthBreakdown() {
  return fetchWithTimeout(await apiUrl('/api/charts/health-breakdown'));
}

export async function getProjections() {
  return fetchWithTimeout(await apiUrl('/api/charts/projections'));
}

// ─── Chat Endpoint ────────────────────────────────────────────────────────────

/**
 * Send a chat message to the AI assistant
 */
export async function sendChatMessage(message, history = []) {
  return fetchWithTimeout(await apiUrl('/api/chat'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
  }, 30000);
}

export default {
  getOverview,
  getHealthScore,
  getBriefing,
  getActions,
  getFinancials,
  getTaxInfo,
  getDiagnostics,
  reloadAnalytics,
  checkApiHealth,
  getBankLedger,
  getBankSummary,
  getPnL,
  getInventorySummary,
  getValuation,
  getShipping,
  getFees,
  // Chart data
  getMonthlyPerformance,
  getDailySales,
  getExpenseBreakdown,
  getCashFlow,
  getTopProducts,
  getHealthBreakdown,
  getProjections,
  // Chat
  sendChatMessage,
};
