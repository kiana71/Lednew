/**
 * Application Configuration
 * 
 * Central configuration for features, data sources, and environment settings
 */

import { AppConfig } from './types';

/**
 * The main administrator's email — source of truth for who the root admin is.
 * This user cannot be deleted or edited. Shown with a crown badge in the admin list.
 */
export const MAIN_ADMIN_EMAIL = 'admin@signcast.com';

/**
 * Default application configuration
 * Can be overridden by environment variables
 */
export const config: AppConfig = {
  features: {
    inventoryManagement: false,    // Coming soon
    advancedSearch: true,           // Enabled
    collaboration: false,           // Coming soon
    versionControl: false,          // Coming soon
    exportToPDF: false,            // Coming soon
  },
  dataSource: (import.meta.env.VITE_DATA_SOURCE as 'mock' | 'database') || 'database',
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT,
};

/**
 * Get configuration value
 */
export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return config[key];
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return config.features[feature];
}

/**
 * Update configuration (for runtime changes)
 */
export function updateConfig(updates: Partial<AppConfig>): void {
  Object.assign(config, updates);
}
