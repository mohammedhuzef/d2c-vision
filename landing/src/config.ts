/**
 * Configuration and URL targets for LaunchTwin AI Landing Page.
 * Driven strictly by VITE_APP_URL environment variable.
 */

const rawAppUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

// Normalize by stripping trailing slash
export const APP_URL = rawAppUrl.replace(/\/+$/, '');
export const NEW_ANALYSIS_URL = `${APP_URL}/new-analysis`;
