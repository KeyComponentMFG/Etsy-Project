/**
 * Analytics API Service
 * Connects to the Python analytics backend for financial data, health scores, and AI insights
 */

import { supabase } from './supabase';

// API base URL - use Railway production URL or local development
export const API_BASE_URL = import.meta.env.VITE_ANALYTICS_API_URL
  || (window.location.hostname !== 'localhost'
      ? 'https://web-production-7f385.up.railway.app'
      : 'http://localhost:8070');

/**
 * Fetch with error handling and timeout
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // Inject Supabase auth token when available
  let authHeaders = {};
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authHeaders = { 'Authorization': `Bearer ${session.access_token}` };
    }
  } catch {
    // Auth not available — proceed without token
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
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
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Get complete dashboard overview
 * Includes health score, briefing, actions, and KPIs
 */
export async function getOverview() {
  return fetchWithTimeout(`${API_BASE_URL}/api/overview`);
}

/**
 * Get business health score with breakdown
 */
export async function getHealthScore() {
  return fetchWithTimeout(`${API_BASE_URL}/api/health`);
}

/**
 * Get AI-generated daily briefing
 */
export async function getBriefing() {
  return fetchWithTimeout(`${API_BASE_URL}/api/briefing`);
}

/**
 * Get priority action items
 */
export async function getActions() {
  return fetchWithTimeout(`${API_BASE_URL}/api/actions`);
}

/**
 * Get detailed financial breakdown
 */
export async function getFinancials() {
  return fetchWithTimeout(`${API_BASE_URL}/api/financials`);
}

/**
 * Get tax calculations and estimates
 */
export async function getTaxInfo() {
  return fetchWithTimeout(`${API_BASE_URL}/api/tax`);
}

/**
 * Get basic diagnostics (lightweight health check)
 */
export async function getDiagnostics() {
  return fetchWithTimeout(`${API_BASE_URL}/api/diagnostics`);
}

/**
 * Force reload data on the analytics server
 */
export async function reloadAnalytics() {
  return fetchWithTimeout(`${API_BASE_URL}/api/reload`);
}

/**
 * Check if analytics API is available
 */
export async function checkApiHealth() {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/api/diagnostics`, {}, 5000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get bank ledger with transactions
 */
export async function getBankLedger() {
  return fetchWithTimeout(`${API_BASE_URL}/api/bank/ledger`);
}

/**
 * Get bank summary with categories
 */
export async function getBankSummary() {
  return fetchWithTimeout(`${API_BASE_URL}/api/bank/summary`);
}

/**
 * Get detailed P&L statement
 */
export async function getPnL() {
  return fetchWithTimeout(`${API_BASE_URL}/api/pnl`);
}

/**
 * Get inventory/COGS summary
 */
export async function getInventorySummary() {
  return fetchWithTimeout(`${API_BASE_URL}/api/inventory/summary`);
}

/**
 * Get business valuation estimates
 */
export async function getValuation() {
  return fetchWithTimeout(`${API_BASE_URL}/api/valuation`);
}

/**
 * Get shipping analysis
 */
export async function getShipping() {
  return fetchWithTimeout(`${API_BASE_URL}/api/shipping`);
}

/**
 * Get fee breakdown
 */
export async function getFees() {
  return fetchWithTimeout(`${API_BASE_URL}/api/fees`);
}

// ─── Chart Data Endpoints ────────────────────────────────────────────────────

/**
 * Get monthly performance data for charts
 */
export async function getMonthlyPerformance() {
  return fetchWithTimeout(`${API_BASE_URL}/api/charts/monthly-performance`);
}

/**
 * Get daily sales data for charts
 */
export async function getDailySales() {
  return fetchWithTimeout(`${API_BASE_URL}/api/charts/daily-sales`);
}

/**
 * Get expense breakdown for pie charts
 */
export async function getExpenseBreakdown() {
  return fetchWithTimeout(`${API_BASE_URL}/api/charts/expense-breakdown`);
}

/**
 * Get cash flow data for charts
 */
export async function getCashFlow() {
  return fetchWithTimeout(`${API_BASE_URL}/api/charts/cash-flow`);
}

/**
 * Get top products data for charts
 */
export async function getTopProducts() {
  return fetchWithTimeout(`${API_BASE_URL}/api/charts/products`);
}

/**
 * Get health score breakdown for gauge charts
 */
export async function getHealthBreakdown() {
  return fetchWithTimeout(`${API_BASE_URL}/api/charts/health-breakdown`);
}

/**
 * Get revenue/profit projections for growth charts
 */
export async function getProjections() {
  return fetchWithTimeout(`${API_BASE_URL}/api/charts/projections`);
}

// ─── Chat Endpoint ────────────────────────────────────────────────────────────

/**
 * Send a chat message to the AI assistant
 * @param {string} message - The user's question
 * @param {Array} history - Optional chat history
 * @returns {Promise<{response: string, question: string}>}
 */
export async function sendChatMessage(message, history = []) {
  return fetchWithTimeout(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
  }, 30000); // 30 second timeout for AI responses
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
