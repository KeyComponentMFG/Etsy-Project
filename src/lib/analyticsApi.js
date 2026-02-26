/**
 * Analytics API Service
 * Connects to the Python analytics backend for financial data, health scores, and AI insights
 */

// API base URL - will be updated when deployed to Railway
const API_BASE_URL = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:8070';

/**
 * Fetch with error handling and timeout
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
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
};
